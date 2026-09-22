package release

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

type testEntry struct {
	name string
	data string
	mode os.FileMode
}

func makeZIP(t *testing.T, entries ...testEntry) []byte {
	t.Helper()
	var b bytes.Buffer
	w := zip.NewWriter(&b)
	for _, entry := range entries {
		mode := entry.mode
		if mode == 0 {
			mode = 0644
		}
		h := &zip.FileHeader{Name: entry.name, Method: zip.Store}
		h.SetMode(mode)
		f, err := w.CreateHeader(h)
		if err != nil {
			t.Fatal(err)
		}
		if _, err = io.WriteString(f, entry.data); err != nil {
			t.Fatal(err)
		}
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	return b.Bytes()
}

func hashBytes(b []byte) string { hash := sha256.Sum256(b); return hex.EncodeToString(hash[:]) }

func metadata(z []byte) map[string]any {
	return map[string]any{
		"tag_name": "v1.2.3", "draft": false, "prerelease": false,
		"assets": []Asset{{ID: 42, Name: "package.zip", Size: int64(len(z)), Digest: "sha256:" + hashBytes(z), State: "uploaded"}},
	}
}

type fixture struct {
	zip         []byte
	metadata    map[string]any
	raw         string
	status      int
	assetStatus int
	serveAsset  func(http.ResponseWriter, *http.Request)
	requests    atomic.Int32
	downloads   atomic.Int32
}

func localClient(t *testing.T, f *fixture) *client {
	t.Helper()
	if f.metadata == nil {
		f.metadata = metadata(f.zip)
	}
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		f.requests.Add(1)
		if r.Method != http.MethodGet || r.Header.Get("Authorization") != "" || r.Header.Get("Cookie") != "" {
			t.Error("unexpected method or credentials", r.Method, r.Header)
		}
		switch r.URL.Path {
		case repositoryPath + "tags/v1.2.3":
			if r.Header.Get("Accept") != "application/vnd.github+json" {
				t.Error("missing JSON accept header")
			}
			if f.status != 0 {
				w.WriteHeader(f.status)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			if f.raw != "" {
				io.WriteString(w, f.raw)
			} else {
				json.NewEncoder(w).Encode(f.metadata)
			}
		case repositoryPath + "assets/42":
			f.downloads.Add(1)
			if r.Header.Get("Accept") != "application/octet-stream" {
				t.Error("missing asset accept header")
			}
			if f.serveAsset != nil {
				f.serveAsset(w, r)
			} else if f.assetStatus != 0 {
				w.WriteHeader(f.assetStatus)
			} else {
				w.Write(f.zip)
			}
		default:
			t.Error("request escaped fixed repository endpoints", r.URL)
			w.WriteHeader(404)
		}
	}))
	t.Cleanup(s.Close)
	c := newClient(s.Client(), s.URL)
	t.Cleanup(c.http.CloseIdleConnections)
	return c
}

func request(t *testing.T) Request {
	t.Helper()
	parent, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	return Request{Version: "v1.2.3", Asset: "package.zip", Output: filepath.Join(parent, "new-output")}
}

func assertAbsent(t *testing.T, name string) {
	t.Helper()
	if _, err := os.Lstat(name); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("expected absent path %s, got %v", name, err)
	}
}

func TestDownloadAndList(t *testing.T) {
	z := makeZIP(t,
		testEntry{name: "bundle/", mode: os.ModeDir | 0755},
		testEntry{name: "bundle/README.md", data: "metadata allowed"},
		testEntry{name: "bundle/.claude/ai-teams/VERSION", data: "1.2.3"},
		testEntry{name: "bundle/upgrade-manifest.json", data: `{}`},
		testEntry{name: "bundle/bin/example.sh", data: "exit 99", mode: 0755})
	f := &fixture{zip: z}
	c := localClient(t, f)
	list, err := c.list(context.Background(), "v1.2.3")
	if err != nil || list.Repository != repository || len(list.Assets) != 1 || list.Assets[0].Name != "package.zip" {
		t.Fatalf("list: %+v %v", list, err)
	}
	req := request(t)
	got, err := c.download(context.Background(), req)
	if err != nil {
		t.Fatal(err)
	}
	if got.Directory != filepath.Join(req.Output, "contents", "bundle") || got.Asset != req.Asset || got.SHA256 != hashBytes(z) {
		t.Fatalf("unexpected result: %+v", got)
	}
	for _, name := range []string{"README.md", "upgrade-manifest.json", ".claude/ai-teams/VERSION", "bin/example.sh"} {
		if _, err := os.Stat(filepath.Join(got.Directory, filepath.FromSlash(name))); err != nil {
			t.Error(err)
		}
	}
	saved, err := os.ReadFile(filepath.Join(req.Output, "download.zip"))
	if err != nil || !bytes.Equal(saved, z) {
		t.Fatal("archive not retained", err)
	}
	if f.downloads.Load() != 1 {
		t.Fatal("unexpected asset request count")
	}
}

func TestChineseOutputPath(t *testing.T) {
	z := makeZIP(t, testEntry{name: "bundle/README.md", data: "portable package"})
	c := localClient(t, &fixture{zip: z})
	req := request(t)
	parent := filepath.Join(filepath.Dir(req.Output), "\u4e2d\u6587\u76ee\u5f55 with spaces")
	if err := os.Mkdir(parent, 0700); err != nil {
		t.Fatal(err)
	}
	req.Output = filepath.Join(parent, "\u5347\u7ea7\u5305\u8f93\u51fa")
	got, err := c.download(context.Background(), req)
	if err != nil {
		t.Fatal("Chinese output path rejected", err)
	}
	if got.Directory != filepath.Join(req.Output, "contents", "bundle") {
		t.Fatal("Chinese output path changed", got.Directory)
	}
	data, err := os.ReadFile(filepath.Join(got.Directory, "README.md"))
	if err != nil || string(data) != "portable package" {
		t.Fatal("Chinese output extraction failed", err)
	}
}

func TestVersionAndRequestValidationWithoutNetwork(t *testing.T) {
	f := &fixture{}
	c := localClient(t, f)
	for _, version := range []string{"", "latest", "1.2.3", "v01.2.3", "v1.2.3-beta.1", "v1.2.3+build", "dev-v1.2.3", "v1.2.3/../v4.5.6", strings.Repeat("1", 100)} {
		t.Run("version/"+version, func(t *testing.T) {
			req := request(t)
			req.Version = version
			if _, err := c.list(context.Background(), version); err == nil {
				t.Error("list accepted invalid version")
			}
			if _, err := c.download(context.Background(), req); err == nil {
				t.Error("download accepted invalid version")
			}
			assertAbsent(t, req.Output)
		})
	}
	for _, asset := range []string{"", "auto", "a.ZIP", "a.tar.gz", "../a.zip", "a/b.zip", "C:a.zip", "a\\b.zip", "NUL.zip", "\u00e9.zip"} {
		req := request(t)
		req.Asset = asset
		if _, err := c.download(context.Background(), req); err == nil {
			t.Error("accepted invalid asset", asset)
		}
		assertAbsent(t, req.Output)
	}
	if f.requests.Load() != 0 {
		t.Fatal("invalid request caused HTTP traffic")
	}
}

func TestReleaseAndDigestValidation(t *testing.T) {
	z := makeZIP(t, testEntry{name: "README.md", data: "ok"})
	for _, tc := range []struct {
		name string
		edit func(map[string]any)
	}{
		{"draft", func(m map[string]any) { m["draft"] = true }},
		{"prerelease", func(m map[string]any) { m["prerelease"] = true }},
		{"missingDraft", func(m map[string]any) { delete(m, "draft") }},
		{"nullPrerelease", func(m map[string]any) { m["prerelease"] = nil }},
		{"wrongTag", func(m map[string]any) { m["tag_name"] = "v1.2.4" }},
		{"missingAssets", func(m map[string]any) { delete(m, "assets") }},
		{"nullAssets", func(m map[string]any) { m["assets"] = nil }},
		{"missingAsset", func(m map[string]any) { m["assets"] = []Asset{} }},
		{"missingDigest", func(m map[string]any) { m["assets"].([]Asset)[0].Digest = "" }},
		{"wrongAlgorithm", func(m map[string]any) { m["assets"].([]Asset)[0].Digest = "sha512:" + strings.Repeat("a", 64) }},
		{"invalidDigest", func(m map[string]any) { m["assets"].([]Asset)[0].Digest = "sha256:" + strings.Repeat("g", 64) }},
		{"zeroID", func(m map[string]any) { m["assets"].([]Asset)[0].ID = 0 }},
		{"notUploaded", func(m map[string]any) { m["assets"].([]Asset)[0].State = "new" }},
		{"negativeSize", func(m map[string]any) { m["assets"].([]Asset)[0].Size = -1 }},
		{"oversize", func(m map[string]any) { m["assets"].([]Asset)[0].Size = 1 << 40 }},
		{"duplicateName", func(m map[string]any) {
			a := m["assets"].([]Asset)[0]
			a.ID++
			m["assets"] = append(m["assets"].([]Asset), a)
		}},
		{"caseAlias", func(m map[string]any) {
			a := m["assets"].([]Asset)[0]
			a.ID++
			a.Name = "PACKAGE.zip"
			m["assets"] = append(m["assets"].([]Asset), a)
		}},
		{"duplicateID", func(m map[string]any) {
			a := m["assets"].([]Asset)[0]
			a.Name = "other.zip"
			m["assets"] = append(m["assets"].([]Asset), a)
		}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			m := metadata(z)
			tc.edit(m)
			f := &fixture{zip: z, metadata: m}
			c := localClient(t, f)
			req := request(t)
			if _, err := c.download(context.Background(), req); err == nil {
				t.Fatal("accepted invalid release metadata")
			}
			assertAbsent(t, req.Output)
			if f.downloads.Load() != 0 {
				t.Fatal("download attempted before validating metadata")
			}
		})
	}
}

func TestListShowsAssetsWithoutDigest(t *testing.T) {
	m := metadata(nil)
	m["assets"].([]Asset)[0].Digest = ""
	c := localClient(t, &fixture{metadata: m})
	list, err := c.list(context.Background(), "v1.2.3")
	if err != nil || len(list.Assets) != 1 || list.Assets[0].Digest != "" {
		t.Fatal(list, err)
	}
}

func TestBoundedAndStrictJSON(t *testing.T) {
	for _, raw := range []string{
		`{"tag_name":"v1.2.3","draft":true,"draft":false,"prerelease":false,"assets":[]}`,
		`{"tag_name":"v1.2.3","Draft":true,"draft":false,"prerelease":false,"assets":[]}`,
		`{"tag_name":"v1.2.3","draft":false,"prerelease":false,"assets":[],"a\u017fsets":[]}`,
		`{"tag_name":"v1.2.3","draft":false,"prerelease":false,"assets":[]} {}`,
		`{"tag_name":"v1.2.3","draft":false,"prerelease":false,"assets":[],"x":"` + string([]byte{255}) + `"}`,
		strings.Repeat("[", 66) + strings.Repeat("]", 66),
		`null`, `[]`, `{"assets":`,
	} {
		t.Run(fmt.Sprint(len(raw), raw[:min(12, len(raw))]), func(t *testing.T) {
			c := localClient(t, &fixture{raw: raw})
			if _, err := c.list(context.Background(), "v1.2.3"); err == nil {
				t.Fatal("accepted invalid JSON", raw)
			}
		})
	}
	for _, chunked := range []bool{false, true} {
		s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if chunked {
				w.(http.Flusher).Flush()
			}
			io.WriteString(w, strings.Repeat(" ", 2048))
		}))
		c := newClient(s.Client(), s.URL)
		c.limits.json = 128
		_, err := c.list(context.Background(), "v1.2.3")
		c.http.CloseIdleConnections()
		s.Close()
		if err == nil {
			t.Fatal("accepted oversized release JSON")
		}
	}
	c := localClient(t, &fixture{})
	c.limits.assets = 0
	if _, err := c.list(context.Background(), "v1.2.3"); err == nil {
		t.Fatal("asset count limit not enforced")
	}
}

func TestFailureRetainsArtifacts(t *testing.T) {
	z := makeZIP(t, testEntry{name: "README.md", data: "ok"})
	for _, name := range []string{"hash", "short", "oversized", "contentLength", "status", "zip", "unsafeZIP"} {
		t.Run(name, func(t *testing.T) {
			f := &fixture{zip: z, metadata: metadata(z)}
			switch name {
			case "hash":
				f.metadata["assets"].([]Asset)[0].Digest = "sha256:" + strings.Repeat("0", 64)
			case "short", "oversized":
				f.serveAsset = func(w http.ResponseWriter, r *http.Request) {
					w.(http.Flusher).Flush()
					if name == "short" {
						w.Write(z[:len(z)-1])
					} else {
						w.Write(append(append([]byte{}, z...), 1))
					}
				}
			case "contentLength":
				f.serveAsset = func(w http.ResponseWriter, r *http.Request) {
					w.Header().Set("Content-Length", "1")
					w.Write([]byte("a"))
				}
			case "status":
				f.assetStatus = 404
			case "zip":
				f.zip = []byte("not a ZIP archive")
				f.metadata = metadata(f.zip)
			case "unsafeZIP":
				f.zip = makeZIP(t, testEntry{name: "../../sentinel", data: "overwrite"})
				f.metadata = metadata(f.zip)
			}
			c := localClient(t, f)
			req := request(t)
			sentinel := filepath.Join(filepath.Dir(req.Output), "sentinel")
			if err := os.WriteFile(sentinel, []byte("original"), 0600); err != nil {
				t.Fatal(err)
			}
			got, err := c.download(context.Background(), req)
			if err == nil || got.Directory != req.Output || !strings.Contains(err.Error(), "artifacts retained") {
				t.Fatal("expected retained failure", got, err)
			}
			info, err := os.Stat(filepath.Join(req.Output, "download.zip"))
			if err != nil || info.Size() > int64(len(f.zip)) {
				t.Fatal("missing or excessive retained archive", info, err)
			}
			assertAbsent(t, filepath.Join(req.Output, "contents"))
			before, _ := os.ReadFile(sentinel)
			if string(before) != "original" {
				t.Fatal("existing data changed")
			}
		})
	}
}

func TestExistingOutputNeverTouched(t *testing.T) {
	for _, kind := range []string{"directory", "file", "symlink", "danglingSymlink"} {
		t.Run(kind, func(t *testing.T) {
			f := &fixture{}
			c := localClient(t, f)
			req := request(t)
			var err error
			switch kind {
			case "directory":
				err = os.Mkdir(req.Output, 0700)
			case "file":
				err = os.WriteFile(req.Output, []byte("keep"), 0600)
			default:
				target := filepath.Dir(req.Output)
				if kind == "danglingSymlink" {
					target = filepath.Join(target, "missing")
				}
				err = os.Symlink(target, req.Output)
				if err != nil {
					t.Skip("symlinks unavailable", err)
				}
			}
			if err != nil {
				t.Fatal(err)
			}
			if _, err := c.download(context.Background(), req); err == nil {
				t.Fatal("accepted existing output")
			}
			if _, err := os.Lstat(req.Output); err != nil || f.requests.Load() != 0 {
				t.Fatal("existing output touched or request issued", err)
			}
			if kind == "file" {
				data, _ := os.ReadFile(req.Output)
				if string(data) != "keep" {
					t.Fatal("file changed")
				}
			}
		})
	}
}

func TestOutputCreatedDuringMetadataRequestIsNotReused(t *testing.T) {
	req := request(t)
	z := makeZIP(t, testEntry{name: "README.md", data: "ok"})
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := os.Mkdir(req.Output, 0700); err != nil {
			t.Error(err)
		}
		json.NewEncoder(w).Encode(metadata(z))
	}))
	defer s.Close()
	c := newClient(s.Client(), s.URL)
	defer c.http.CloseIdleConnections()
	if _, err := c.download(context.Background(), req); err == nil {
		t.Fatal("output race accepted")
	}
	assertAbsent(t, filepath.Join(req.Output, "download.zip"))
}

func TestCancellationAndHTTPFailures(t *testing.T) {
	z := makeZIP(t, testEntry{name: "README.md", data: "ok"})
	c := localClient(t, &fixture{zip: z})
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := c.download(ctx, request(t)); !errors.Is(err, context.Canceled) {
		t.Fatal("cancellation lost", err)
	}
	for _, status := range []int{301, 403, 404, 429, 500} {
		c := localClient(t, &fixture{status: status})
		if _, err := c.list(context.Background(), "v1.2.3"); err == nil {
			t.Fatal("accepted HTTP status", status)
		}
	}
	started := make(chan struct{})
	f := &fixture{zip: z, serveAsset: func(w http.ResponseWriter, r *http.Request) {
		w.(http.Flusher).Flush()
		close(started)
		<-r.Context().Done()
	}}
	c = localClient(t, f)
	ctx, cancel = context.WithCancel(context.Background())
	defer cancel()
	done := make(chan error, 1)
	req := request(t)
	go func() { _, err := c.download(ctx, req); done <- err }()
	select {
	case <-started:
	case <-time.After(3 * time.Second):
		t.Fatal("download did not start")
	}
	cancel()
	select {
	case err := <-done:
		if !errors.Is(err, context.Canceled) {
			t.Fatal("download cancellation lost", err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("download did not stop")
	}
	if _, err := os.Stat(filepath.Join(req.Output, "download.zip")); err != nil {
		t.Fatal("canceled archive was deleted", err)
	}
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestRedirectsAndHeaderIsolation(t *testing.T) {
	z := makeZIP(t, testEntry{name: "README.md", data: "ok"})
	var steps atomic.Int32
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		n := steps.Add(1)
		if r.Method != "GET" || r.Header.Get("Authorization") != "" || r.Header.Get("Cookie") != "" || r.Header.Get("Referer") != "" {
			t.Error("request headers leaked", r.Header)
		}
		if n > 2 && r.Header.Get("X-GitHub-Api-Version") != "" {
			t.Error("API header leaked to CDN")
		}
		switch n {
		case 1:
			json.NewEncoder(w).Encode(metadata(z))
		case 2:
			w.Header().Set("Set-Cookie", "secret=never-forward; Path=/")
			w.Header().Set("Location", "https://objects.githubusercontent.com/a?token=private")
			w.WriteHeader(302)
		case 3:
			w.Header().Set("Location", "https://release-assets.githubusercontent.com/a?token=private")
			w.WriteHeader(303)
		case 4:
			w.Write(z)
		default:
			t.Error("excess requests")
			w.WriteHeader(500)
		}
	}))
	defer s.Close()
	u, _ := url.Parse(s.URL)
	transport := s.Client().Transport
	jar, _ := cookiejar.New(nil)
	jar.SetCookies(u, []*http.Cookie{{Name: "secret", Value: "never-forward"}})
	injected := &http.Client{Jar: jar, Timeout: time.Hour, Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		clone := r.Clone(r.Context())
		copyURL := *r.URL
		copyURL.Scheme, copyURL.Host = u.Scheme, u.Host
		clone.URL = &copyURL
		return transport.RoundTrip(clone)
	})}
	c := newClient(injected, s.URL)
	if c.http.Jar != nil || c.http.Timeout < 30*time.Second || c.http.Timeout > 120*time.Second || injected.Jar == nil || injected.Timeout != time.Hour {
		t.Fatal("client isolation or timeout broken")
	}
	if _, err := c.download(context.Background(), request(t)); err != nil {
		t.Fatal(err)
	}
	if steps.Load() != 4 {
		t.Fatal("redirect chain was not followed", steps.Load())
	}
}

func TestRedirectPolicy(t *testing.T) {
	for _, value := range []string{
		"http://github.com/" + repository + "/releases/download/v1.2.3/a.zip",
		"https://github.com.evil.test/a", "https://api.github.com/a", "https://codeload.github.com/a",
		"https://release-assets.githubusercontent.com.evil.test/a", "https://evil.test/a",
		"https://objects.githubusercontent.com:444/a", "https://secret@objects.githubusercontent.com/a",
		"https://objects.githubusercontent.com/a#fragment", "https://127.0.0.1/a",
		"https://objects.githubusercontent.com./a", "https://github.com/other/repo/releases/download/v1.2.3/a.zip",
		"https://github.com/" + repository + "/releases/download/../evil",
	} {
		u, err := url.Parse(value)
		if err == nil && allowedRedirect(u) {
			t.Error("accepted unsafe redirect", value)
		}
	}
	for _, status := range []int{301, 302, 303, 307, 308} {
		var calls atomic.Int32
		h := &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
			calls.Add(1)
			return &http.Response{StatusCode: status, Header: http.Header{"Location": {"https://evil.test/a?secret=private"}}, Body: io.NopCloser(strings.NewReader("")), Request: r}, nil
		})}
		c := newClient(h, apiBase)
		if _, err := c.get(context.Background(), repositoryPath+"assets/42", "application/octet-stream", true); err == nil || strings.Contains(err.Error(), "private") {
			t.Fatal("bad redirect error", err)
		}
		if calls.Load() != 1 {
			t.Fatal("request sent to untrusted host")
		}
	}
	var calls atomic.Int32
	c := newClient(&http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		calls.Add(1)
		return &http.Response{StatusCode: 302, Header: http.Header{"Location": {"https://objects.githubusercontent.com/loop"}}, Body: io.NopCloser(strings.NewReader("")), Request: r}, nil
	})}, apiBase)
	if _, err := c.get(context.Background(), repositoryPath+"assets/42", "application/octet-stream", true); err == nil || calls.Load() != 6 {
		t.Fatal("redirect count not bounded", calls.Load(), err)
	}
}
