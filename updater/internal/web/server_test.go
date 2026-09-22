package web

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"os/exec"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

const testHost = "127.0.0.1:39001"
const testToken = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
const applyBody = `{"planId":"plan-1","acknowledgeStopped":true,"trustBaseline":"old-hash","trustTarget":"new-hash"}`
const recoveryBody = `{"transaction":"/fixture/transaction","acknowledgeStopped":true}`
const planBody = `{"project":"/fixture/project","baseline":"/fixture/old","package":"/fixture/new"}`

// Enable this optional browser regression with CCRADT_WEB_PLAYWRIGHT pointing
// to a Playwright module. CCRADT_WEB_BROWSER may select an installed Chromium.
func TestUIRecoveryGateSyntheticBackend(t *testing.T) {
	module := os.Getenv("CCRADT_WEB_PLAYWRIGHT")
	if module == "" {
		t.Skip("set CCRADT_WEB_PLAYWRIGHT to run the synthetic-backend browser regression")
	}
	node, err := exec.LookPath("node")
	if err != nil {
		t.Fatal(err)
	}
	var mu sync.Mutex
	var plan map[string]any
	var planCount, recoveryCount int
	var scenario string
	snapshot := map[string]any{"state": "idle", "step": 0, "total": 0}
	backend := Backend{
		Plan: func(_ context.Context, body json.RawMessage) (any, error) {
			var req struct{ Project, Baseline, Package string }
			if err := json.Unmarshal(body, &req); err != nil {
				return nil, err
			}
			mu.Lock()
			defer mu.Unlock()
			planCount++
			scenario = strings.TrimPrefix(req.Project, "/fixture/")
			plan = map[string]any{
				"id": fmt.Sprintf("plan-%d", planCount), "project": req.Project, "baseline": req.Baseline, "package": req.Package,
				"fromVersion": "1.0.0", "toVersion": "1.1.0", "baselineDigest": strings.Repeat("1", 64), "targetDigest": strings.Repeat("2", 64),
				"actions": []any{}, "conflicts": []any{}, "preserved": 1, "migrationPath": []string{}, "warnings": []string{}, "ready": true,
			}
			snapshot = map[string]any{"state": "planned", "step": 0, "total": 1, "plan": plan}
			return plan, nil
		},
		Apply: func(context.Context, json.RawMessage) (any, error) {
			mu.Lock()
			defer mu.Unlock()
			snapshot = map[string]any{
				"state": scenario, "transaction": "/fixture/materials-" + scenario,
				"step": 0, "total": 1, "error": "synthetic failure with retained materials", "plan": plan,
			}
			return snapshot, nil
		},
		Status: func(context.Context, json.RawMessage) (any, error) {
			mu.Lock()
			defer mu.Unlock()
			return snapshot, nil
		},
		Recover: func(_ context.Context, body json.RawMessage) (any, error) {
			var req struct{ Transaction string }
			if err := json.Unmarshal(body, &req); err != nil {
				return nil, err
			}
			mu.Lock()
			defer mu.Unlock()
			recoveryCount++
			snapshot = map[string]any{"state": "restored", "transaction": req.Transaction, "step": 1, "total": 1}
			return snapshot, nil
		},
	}
	ctx, cancel := context.WithCancel(context.Background())
	ready, done := make(chan string, 1), make(chan error, 1)
	go func() { done <- Serve(ctx, "", backend, func(u string) { ready <- u }) }()
	t.Cleanup(func() {
		cancel()
		select {
		case err := <-done:
			if err != nil {
				t.Error(err)
			}
		case <-time.After(5 * time.Second):
			t.Error("synthetic UI server did not stop")
		}
	})
	var address string
	select {
	case address = <-ready:
	case <-time.After(5 * time.Second):
		t.Fatal("synthetic UI server did not start")
	}
	browserCtx, stopBrowser := context.WithTimeout(context.Background(), 60*time.Second)
	defer stopBrowser()
	cmd := exec.CommandContext(browserCtx, node, "-e", recoveryGateBrowserScript, module, os.Getenv("CCRADT_WEB_BROWSER"), address)
	if output, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("synthetic UI regression failed: %v\n%s", err, output)
	}
	mu.Lock()
	defer mu.Unlock()
	if recoveryCount != 2 {
		t.Errorf("recovery called %d times; only the two explicit recovery states should recover", recoveryCount)
	}
}

const recoveryGateBrowserScript = `
const assert = require('node:assert/strict');
const { chromium } = require(process.argv[1]);
(async () => {
  const browser = await chromium.launch({headless: true, ...(process.argv[2] ? {executablePath: process.argv[2]} : {})});
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(6000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.argv[3]);
    await page.waitForFunction(() => document.getElementById('connection').textContent === '本机服务已连接');
    const state = async () => JSON.parse(await page.locator('#status-json').textContent()).state;
    const scan = async scenario => {
      await page.locator('#project').fill('/fixture/' + scenario);
      await page.locator('#baseline').fill('/fixture/old');
      await page.locator('#package').fill('/fixture/new');
      const planned = page.waitForResponse(response => new URL(response.url()).pathname === '/api/plan');
      await page.locator('#plan-button').click();
      const result = await (await planned).json();
      await page.waitForFunction(id => JSON.parse(document.getElementById('plan-json').textContent).id === id && !document.getElementById('path-fields').disabled, result.id);
      return result.id;
    };
    for (const scenario of ['failed', 'error', 'blocked', 'recovery-required', 'recovery_required']) {
      const planID = await scan(scenario);
      await page.locator('#transaction').fill('');
      await page.locator('#trust-source').check();
      await page.locator('#stopped-writers').check();
      await page.locator('#apply-button').click();
      await page.waitForFunction(expected => JSON.parse(document.getElementById('status-json').textContent).state === expected, scenario);
      await page.waitForFunction(() => !document.getElementById('recovery-fields').disabled);
      const requiresRecovery = scenario.startsWith('recovery');
      assert.equal(await page.locator('#project').isDisabled(), requiresRecovery, scenario + ': path form gate');
      assert.equal(await page.locator('#failed-note').isVisible(), scenario === 'failed');
      assert.equal(await page.locator('#transaction').inputValue(), requiresRecovery ? '/fixture/materials-' + scenario : '', scenario + ': no recovery inferred from a materials path');
      if (requiresRecovery) {
        await page.locator('#recover-stopped').check();
        await page.locator('#recover-button').click();
        await page.waitForFunction(() => JSON.parse(document.getElementById('status-json').textContent).state === 'restored');
      } else {
        if (scenario === 'failed') {
          assert.match(await page.locator('#failed-note').textContent(), /原安装未改动/);
          assert.match(await page.locator('#failed-note').textContent(), /重新扫描/);
        }
        await page.locator('#refresh-button').click();
        await page.waitForFunction(() => !document.getElementById('refresh-button').disabled);
        assert.equal(await state(), scenario);
        assert.equal(await page.locator('#project').isDisabled(), false, 'polling must not restore the false recovery lock');
        const nextID = await scan(scenario);
        assert.notEqual(nextID, planID, 'a fresh scan succeeds without a recovery request');
        assert.equal(await page.locator('#trust-source').isChecked(), false);
        assert.equal(await page.locator('#failed-note').isVisible(), false);
      }
    }
    assert.equal(await page.locator('label[for=transaction]').textContent(), '事务绝对路径');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
`

func apiRequest(method, path, body string) *http.Request {
	r := httptest.NewRequest(method, "http://"+testHost+path, strings.NewReader(body))
	r.Header.Set("Origin", "http://"+testHost)
	r.Header.Set("Authorization", "Bearer "+testToken)
	r.Header.Set("Content-Type", "application/json")
	return r
}

func response(h http.Handler, r *http.Request) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	return w
}

func TestEmbeddedAssetsAndSecurityHeaders(t *testing.T) {
	h := newHandler(context.Background(), testHost, testToken, Backend{})
	for _, tc := range []struct{ path, contentType, contains string }{
		{"/", "text/html", "CC-RADT"},
		{"/app.js", "text/javascript", "textContent"},
		{"/style.css", "text/css", "@media"},
	} {
		t.Run(tc.path, func(t *testing.T) {
			w := response(h, apiRequest(http.MethodGet, tc.path, ""))
			if w.Code != http.StatusOK || !strings.Contains(w.Header().Get("Content-Type"), tc.contentType) || !strings.Contains(w.Body.String(), tc.contains) {
				t.Fatalf("asset: %d %s", w.Code, w.Body.String())
			}
			for name, expected := range map[string]string{
				"Content-Security-Policy": contentSecurityPolicy,
				"Referrer-Policy":         "no-referrer", "Cache-Control": "no-store",
				"X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY",
				"Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Resource-Policy": "same-origin",
			} {
				if got := w.Header().Get(name); got != expected {
					t.Errorf("%s = %q, want %q", name, got, expected)
				}
			}
			if strings.Contains(w.Body.String(), testToken) {
				t.Fatal("access token leaked into embedded asset")
			}
			head := response(h, apiRequest(http.MethodHead, tc.path, ""))
			if head.Code != http.StatusOK || head.Body.Len() != 0 {
				t.Fatal("HEAD must not return a body")
			}
		})
	}
	for _, path := range []string{"/server.go", "/../server.go", "/etc/passwd", "/files", "/api/browse", "/api/shell"} {
		if w := response(h, apiRequest(http.MethodGet, path, "")); w.Code != http.StatusNotFound {
			t.Errorf("unexpected route %s: %d", path, w.Code)
		}
	}
	js, _ := assets.ReadFile("app.js")
	for _, forbidden := range []string{"innerHTML", "outerHTML", "insertAdjacentHTML", "document.write", "eval(", "new Function", "https://", "http://", "localStorage"} {
		if strings.Contains(string(js), forbidden) {
			t.Errorf("unsafe or remote UI operation: %s", forbidden)
		}
	}
	html, _ := assets.ReadFile("index.html")
	for _, forbidden := range []string{"<style", "<script>", " onclick=", "https://", "http://", " checked"} {
		if strings.Contains(string(html), forbidden) {
			t.Errorf("unexpected embedded HTML: %s", forbidden)
		}
	}
}

func TestRejectsUnauthorizedAndInvalidRequests(t *testing.T) {
	var calls atomic.Int32
	callback := func(context.Context, json.RawMessage) (any, error) {
		calls.Add(1)
		return map[string]string{"state": "idle"}, nil
	}
	h := newHandler(context.Background(), testHost, testToken, Backend{Plan: callback, Apply: callback, Recover: callback, Status: callback})
	for _, tc := range []struct {
		name, path, body string
		modify           func(*http.Request)
		status           int
	}{
		{name: "no token", modify: func(r *http.Request) { r.Header.Del("Authorization") }, status: 401},
		{name: "wrong token", modify: func(r *http.Request) { r.Header.Set("Authorization", "Bearer wrong") }, status: 401},
		{name: "token suffix", modify: func(r *http.Request) { r.Header.Set("Authorization", "Bearer "+testToken+"x") }, status: 401},
		{name: "untrusted host", modify: func(r *http.Request) { r.Host = "evil.example:39001" }, status: 403},
		{name: "localhost alias", modify: func(r *http.Request) { r.Host = "localhost:39001" }, status: 403},
		{name: "wrong port", modify: func(r *http.Request) { r.Host = "127.0.0.1:39002" }, status: 403},
		{name: "no origin", modify: func(r *http.Request) { r.Header.Del("Origin") }, status: 403},
		{name: "null origin", modify: func(r *http.Request) { r.Header.Set("Origin", "null") }, status: 403},
		{name: "cross origin", modify: func(r *http.Request) { r.Header.Set("Origin", "https://evil.example") }, status: 403},
		{name: "cross site", modify: func(r *http.Request) { r.Header.Set("Sec-Fetch-Site", "cross-site") }, status: 403},
		{name: "same site wrong origin", modify: func(r *http.Request) { r.Header.Set("Sec-Fetch-Site", "same-site") }, status: 403},
		{name: "query token", path: "/api/status?token=" + testToken, status: 400},
		{name: "empty query", path: "/api/status?", status: 400},
		{name: "GET", modify: func(r *http.Request) { r.Method = "GET" }, status: 405},
		{name: "OPTIONS", modify: func(r *http.Request) { r.Method = "OPTIONS" }, status: 405},
		{name: "form", modify: func(r *http.Request) { r.Header.Set("Content-Type", "application/x-www-form-urlencoded") }, status: 415},
		{name: "array", body: `[]`, status: 400},
		{name: "null", body: `null`, status: 400},
		{name: "malformed", body: `{`, status: 400},
		{name: "trailing", body: `{} {}`, status: 400},
		{name: "duplicate", body: `{"planId":"a","planId":"b"}`, status: 400},
		{name: "unknown field", body: `{"command":"rm"}`, status: 400},
		{name: "oversized", body: `{"planId":"` + strings.Repeat("a", maxRequestBytes) + `"}`, status: 413},
		{name: "missing project paths", path: "/api/plan", status: 400},
		{name: "no apply acknowledgement", path: "/api/apply", body: `{"planId":"p","trustBaseline":"a","trustTarget":"b"}`, status: 400},
		{name: "string acknowledgement", path: "/api/apply", body: `{"planId":"p","acknowledgeStopped":"true","trustBaseline":"a","trustTarget":"b"}`, status: 400},
		{name: "no trust pins", path: "/api/apply", body: `{"planId":"p","acknowledgeStopped":true}`, status: 400},
		{name: "recovery not confirmed", path: "/api/recover", body: `{"transaction":"t","acknowledgeStopped":false}`, status: 400},
		{name: "recovery path missing", path: "/api/recover", body: `{"acknowledgeStopped":true}`, status: 400},
	} {
		t.Run(tc.name, func(t *testing.T) {
			path, body := tc.path, tc.body
			if path == "" {
				path = "/api/status"
			}
			if body == "" {
				body = "{}"
			}
			r := apiRequest(http.MethodPost, path, body)
			if tc.modify != nil {
				tc.modify(r)
			}
			w := response(h, r)
			if w.Code != tc.status {
				t.Fatalf("got %d, want %d: %s", w.Code, tc.status, w.Body.String())
			}
			if w.Header().Get("Access-Control-Allow-Origin") != "" {
				t.Fatal("CORS must not be enabled")
			}
			if strings.Contains(w.Body.String(), testToken) {
				t.Fatal("credential leaked into error")
			}
		})
	}
	if calls.Load() != 0 {
		t.Fatalf("rejected requests reached backend %d times", calls.Load())
	}
}

func TestBackendContractsAndJSONErrors(t *testing.T) {
	for _, tc := range []struct{ operation, body string }{
		{"plan", `{"project":"/fixture/项目 空格","baseline":"/fixture/old","package":"/fixture/new","baselineManifest":"old.json","packageManifest":"new.json"}`},
		{"apply", applyBody}, {"recover", recoveryBody}, {"status", `{"planId":"plan-1"}`},
	} {
		t.Run(tc.operation, func(t *testing.T) {
			callback := func(_ context.Context, body json.RawMessage) (any, error) {
				if string(body) != tc.body {
					t.Errorf("request changed: %s", body)
				}
				return map[string]any{"state": "complete", "conflicts": []any{map[string]string{"path": "<img src=x>", "reason": "<&>"}}}, nil
			}
			h := newHandler(context.Background(), testHost, testToken, Backend{Plan: callback, Apply: callback, Recover: callback, Status: callback})
			w := response(h, apiRequest(http.MethodPost, "/api/"+tc.operation, tc.body))
			if w.Code != 200 || !json.Valid(w.Body.Bytes()) {
				t.Fatalf("callback response: %d %s", w.Code, w.Body.String())
			}
			if strings.Contains(w.Body.String(), "<img") {
				t.Fatal("JSON response should escape HTML characters")
			}
		})
	}
	t.Run("error snapshot retained", func(t *testing.T) {
		h := newHandler(context.Background(), testHost, testToken, Backend{Status: func(context.Context, json.RawMessage) (any, error) {
			return map[string]any{"state": "recovery-required", "transaction": "/fixture/t", "details": map[string]string{"path": "p"}}, errors.New("conflict")
		}})
		w := response(h, apiRequest(http.MethodPost, "/api/status", "{}"))
		if w.Code != 422 || !strings.Contains(w.Body.String(), `"snapshot"`) || !strings.Contains(w.Body.String(), `"details"`) {
			t.Fatalf("lost error fields: %d %s", w.Code, w.Body.String())
		}
	})
	t.Run("nil backend", func(t *testing.T) {
		h := newHandler(context.Background(), testHost, testToken, Backend{})
		if w := response(h, apiRequest(http.MethodPost, "/api/status", "{}")); w.Code != 503 {
			t.Fatalf("got %d", w.Code)
		}
	})
	t.Run("panic isolated", func(t *testing.T) {
		h := newHandler(context.Background(), testHost, testToken, Backend{Plan: func(context.Context, json.RawMessage) (any, error) { panic("private payload") }})
		for i := 0; i < 2; i++ {
			w := response(h, apiRequest(http.MethodPost, "/api/plan", planBody))
			if w.Code != 422 || strings.Contains(w.Body.String(), "private payload") {
				t.Fatalf("unsafe panic response: %d %s", w.Code, w.Body.String())
			}
		}
	})
	t.Run("invalid JSON result", func(t *testing.T) {
		h := newHandler(context.Background(), testHost, testToken, Backend{Status: func(context.Context, json.RawMessage) (any, error) { return make(chan int), nil }})
		w := response(h, apiRequest(http.MethodPost, "/api/status", "{}"))
		if w.Code != 500 || !json.Valid(w.Body.Bytes()) {
			t.Fatalf("invalid error: %d %s", w.Code, w.Body.String())
		}
	})
}

func TestConcurrentOperationsAndReplay(t *testing.T) {
	entered, release, done := make(chan struct{}), make(chan struct{}), make(chan *httptest.ResponseRecorder, 1)
	var once sync.Once
	t.Cleanup(func() { once.Do(func() { close(release) }) })
	var calls atomic.Int32
	callback := func(ctx context.Context, _ json.RawMessage) (any, error) {
		calls.Add(1)
		close(entered)
		<-release
		if ctx.Err() != nil {
			t.Error("browser cancellation reached mutation")
		}
		return map[string]string{"state": "complete"}, nil
	}
	h := newHandler(context.Background(), testHost, testToken, Backend{Plan: callback, Apply: callback, Recover: callback, Status: func(context.Context, json.RawMessage) (any, error) {
		return map[string]string{"state": "switching"}, nil
	}})
	ctx, cancel := context.WithCancel(context.Background())
	r := apiRequest(http.MethodPost, "/api/apply", applyBody).WithContext(ctx)
	go func() { done <- response(h, r) }()
	select {
	case <-entered:
	case <-time.After(3 * time.Second):
		t.Fatal("callback did not start")
	}
	cancel()
	for _, tc := range []struct{ path, body string }{{"/api/apply", applyBody}, {"/api/plan", planBody}, {"/api/recover", recoveryBody}} {
		if w := response(h, apiRequest(http.MethodPost, tc.path, tc.body)); w.Code != 409 {
			t.Errorf("concurrent %s got %d", tc.path, w.Code)
		}
	}
	if w := response(h, apiRequest(http.MethodPost, "/api/status", "{}")); w.Code != 200 {
		t.Fatalf("status unavailable during operation: %d", w.Code)
	}
	once.Do(func() { close(release) })
	select {
	case w := <-done:
		if w.Code != 200 {
			t.Fatalf("operation failed: %d", w.Code)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("operation did not finish")
	}
	if w := response(h, apiRequest(http.MethodPost, "/api/apply", applyBody)); w.Code != 409 {
		t.Fatalf("replay accepted: %d", w.Code)
	}
	if calls.Load() != 1 {
		t.Fatalf("callback ran %d times", calls.Load())
	}
}

func TestFailedRecoveryCanRetry(t *testing.T) {
	var calls int
	h := newHandler(context.Background(), testHost, testToken, Backend{Recover: func(context.Context, json.RawMessage) (any, error) {
		calls++
		if calls == 1 {
			return nil, errors.New("new content requires attention")
		}
		return map[string]string{"state": "restored"}, nil
	}})
	for _, expected := range []int{422, 200, 409} {
		if w := response(h, apiRequest(http.MethodPost, "/api/recover", recoveryBody)); w.Code != expected {
			t.Fatalf("got %d, want %d", w.Code, expected)
		}
	}
}

func TestAsyncRecoveryCanRetryAfterFailureSnapshot(t *testing.T) {
	state := "recovering"
	h := newHandler(context.Background(), testHost, testToken, Backend{
		Recover: func(context.Context, json.RawMessage) (any, error) {
			return map[string]string{"state": "recovering", "transaction": "/fixture/transaction"}, nil
		},
		Status: func(context.Context, json.RawMessage) (any, error) {
			return map[string]string{"state": state, "transaction": "/fixture/transaction"}, nil
		},
	})
	for _, expected := range []int{200, 409} {
		if w := response(h, apiRequest(http.MethodPost, "/api/recover", recoveryBody)); w.Code != expected {
			t.Fatalf("got %d, want %d", w.Code, expected)
		}
	}
	state = "recovery-required"
	if w := response(h, apiRequest(http.MethodPost, "/api/status", "{}")); w.Code != 200 {
		t.Fatal("failed to poll the async failure")
	}
	if w := response(h, apiRequest(http.MethodPost, "/api/recover", recoveryBody)); w.Code != 200 {
		t.Fatalf("explicit recovery retry rejected: %d", w.Code)
	}
}

func TestServeLoopbackFragmentAndShutdown(t *testing.T) {
	for _, addr := range []string{"0.0.0.0:0", "localhost:0", "[::1]:0", "127.0.0.1:8000", ":0"} {
		if err := Serve(context.Background(), addr, Backend{}, nil); err == nil {
			t.Errorf("unsafe binding accepted: %s", addr)
		}
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	ready, finished := make(chan string, 1), make(chan error, 1)
	entered, release := make(chan struct{}), make(chan struct{})
	var once sync.Once
	t.Cleanup(func() { once.Do(func() { close(release) }); cancel() })
	go func() {
		finished <- Serve(ctx, "", Backend{Apply: func(operationContext context.Context, _ json.RawMessage) (any, error) {
			close(entered)
			<-release
			if operationContext.Err() != nil {
				t.Error("Serve exit cancelled mutation")
			}
			return map[string]string{"state": "complete"}, nil
		}}, func(u string) { ready <- u })
	}()
	var address string
	select {
	case address = <-ready:
	case <-time.After(3 * time.Second):
		t.Fatal("server not ready")
	}
	u, err := url.Parse(address)
	if err != nil {
		t.Fatal(err)
	}
	if u.Hostname() != "127.0.0.1" || u.Port() == "0" || u.Port() == "" || u.RawQuery != "" {
		t.Fatalf("unsafe access URL: %s", address)
	}
	fragment, err := url.ParseQuery(u.Fragment)
	if err != nil {
		t.Fatal(err)
	}
	token := fragment.Get("token")
	if len(token) != 64 {
		t.Fatalf("unexpected token length: %d", len(token))
	}
	base := "http://" + u.Host
	client := &http.Client{Timeout: 5 * time.Second}
	asset, err := client.Get(base + "/")
	if err != nil {
		t.Fatal(err)
	}
	data, _ := io.ReadAll(asset.Body)
	asset.Body.Close()
	if asset.StatusCode != 200 || strings.Contains(string(data), token) {
		t.Fatal("root asset or credential isolation failed")
	}
	requestCtx, disconnect := context.WithCancel(context.Background())
	defer disconnect()
	r, err := http.NewRequestWithContext(requestCtx, http.MethodPost, base+"/api/apply", strings.NewReader(applyBody))
	if err != nil {
		t.Fatal(err)
	}
	r.Header.Set("Origin", base)
	r.Header.Set("Authorization", "Bearer "+token)
	r.Header.Set("Content-Type", "application/json")
	clientDone := make(chan struct{})
	go func() {
		resp, _ := client.Do(r)
		if resp != nil {
			resp.Body.Close()
		}
		close(clientDone)
	}()
	select {
	case <-entered:
	case <-time.After(3 * time.Second):
		t.Fatal("mutation not entered")
	}
	disconnect()
	select {
	case <-clientDone:
	case <-time.After(3 * time.Second):
		t.Fatal("client did not disconnect")
	}
	cancel()
	select {
	case err := <-finished:
		t.Fatalf("Serve abandoned an entered callback: %v", err)
	case <-time.After(100 * time.Millisecond):
	}
	once.Do(func() { close(release) })
	select {
	case err := <-finished:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("Serve did not finish after callback completed")
	}
}
