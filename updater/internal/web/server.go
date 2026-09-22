// Package web serves the updater's embedded, loopback-only user interface.
package web

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"mime"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// Backend keeps the transport independent of the engine and CLI driver.
// Callbacks must be safe for concurrent Status calls. Apply and Recover may
// return a running snapshot; the driver then owns the operation's lifetime.
type Backend struct {
	Plan    func(context.Context, json.RawMessage) (any, error)
	Apply   func(context.Context, json.RawMessage) (any, error)
	Recover func(context.Context, json.RawMessage) (any, error)
	Status  func(context.Context, json.RawMessage) (any, error)
}

//go:embed index.html style.css app.js
var assets embed.FS

const maxRequestBytes = 64 << 10

const contentSecurityPolicy = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"

// Serve binds a randomly allocated IPv4 loopback port. addr must be empty or
// "127.0.0.1:0". onReady receives the credential in a URL fragment, never a query.
// Cancellation stops accepting requests and waits for entered handlers. Mutating
// callbacks are not cancelled by browser disconnects or Serve cancellation; an
// asynchronous backend driver must also drain its own work before process exit.
func Serve(ctx context.Context, addr string, backend Backend, onReady func(url string)) error {
	if addr != "" && addr != "127.0.0.1:0" {
		return errors.New("web: address must be 127.0.0.1:0")
	}
	if err := ctx.Err(); err != nil {
		return err
	}
	secret := make([]byte, 32)
	if _, err := rand.Read(secret); err != nil {
		return fmt.Errorf("web: create access token: %w", err)
	}
	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		return fmt.Errorf("web: listen: %w", err)
	}
	token := hex.EncodeToString(secret)
	host := listener.Addr().String()
	handler := newHandler(context.WithoutCancel(ctx), host, token, backend)
	server := &http.Server{
		Handler: handler, ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout: 15 * time.Second, IdleTimeout: 30 * time.Second,
		MaxHeaderBytes: 16 << 10,
		ErrorLog:       log.New(io.Discard, "", 0),
	}
	stopped := make(chan error, 1)
	go func() { stopped <- server.Serve(listener) }()
	if onReady != nil {
		onReady("http://" + host + "/#token=" + token)
	}
	select {
	case <-ctx.Done():
		handler.stop()
		// There is deliberately no shutdown timeout that could abandon a write.
		err = server.Shutdown(context.Background())
		serveErr := <-stopped
		if err == nil && !errors.Is(serveErr, http.ErrServerClosed) {
			err = serveErr
		}
	case err = <-stopped:
		handler.stop()
		_ = server.Shutdown(context.Background())
	}
	if errors.Is(err, http.ErrServerClosed) {
		return nil
	}
	return err
}

type handler struct {
	operationContext context.Context
	host             string
	token            string
	backend          Backend
	mu               sync.Mutex
	closing          bool
	busy             bool
	submitted        map[string]bool
}

func newHandler(ctx context.Context, host, token string, backend Backend) *handler {
	return &handler{operationContext: ctx, host: host, token: token, backend: backend, submitted: make(map[string]bool)}
}

func (h *handler) stop() {
	h.mu.Lock()
	h.closing = true
	h.mu.Unlock()
}

func (h *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Security-Policy", contentSecurityPolicy)
	w.Header().Set("Referrer-Policy", "no-referrer")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
	w.Header().Set("Cross-Origin-Resource-Policy", "same-origin")
	w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
	origin := "http://" + h.host
	if r.Host != h.host || (r.Header.Get("Origin") != "" && r.Header.Get("Origin") != origin) {
		writeError(w, http.StatusForbidden, "invalid Host or Origin", nil)
		return
	}
	if site := r.Header.Get("Sec-Fetch-Site"); site != "" && site != "same-origin" && site != "none" {
		writeError(w, http.StatusForbidden, "cross-site request rejected", nil)
		return
	}
	if r.URL.RawQuery != "" || r.URL.ForceQuery {
		writeError(w, http.StatusBadRequest, "query parameters are not supported", nil)
		return
	}
	if strings.HasPrefix(r.URL.Path, "/api/") {
		if r.Header.Get("Origin") != origin {
			writeError(w, http.StatusForbidden, "same-origin API request required", nil)
			return
		}
		if subtle.ConstantTimeCompare([]byte(r.Header.Get("Authorization")), []byte("Bearer "+h.token)) != 1 {
			writeError(w, http.StatusUnauthorized, "missing or invalid access token", nil)
			return
		}
		h.api(w, r)
		return
	}
	var name, contentType string
	switch r.URL.Path {
	case "/":
		name, contentType = "index.html", "text/html; charset=utf-8"
	case "/style.css":
		name, contentType = "style.css", "text/css; charset=utf-8"
	case "/app.js":
		name, contentType = "app.js", "text/javascript; charset=utf-8"
	default:
		writeError(w, http.StatusNotFound, "not found", nil)
		return
	}
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed", nil)
		return
	}
	data, err := assets.ReadFile(name)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "embedded asset unavailable", nil)
		return
	}
	w.Header().Set("Content-Type", contentType)
	if r.Method == http.MethodGet {
		_, _ = w.Write(data)
	}
}

func (h *handler) api(w http.ResponseWriter, r *http.Request) {
	var callback func(context.Context, json.RawMessage) (any, error)
	switch r.URL.Path {
	case "/api/plan":
		callback = h.backend.Plan
	case "/api/apply":
		callback = h.backend.Apply
	case "/api/recover":
		callback = h.backend.Recover
	case "/api/status":
		callback = h.backend.Status
	default:
		writeError(w, http.StatusNotFound, "not found", nil)
		return
	}
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST")
		writeError(w, http.StatusMethodNotAllowed, "API requires POST", nil)
		return
	}
	contentType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || contentType != "application/json" {
		writeError(w, http.StatusUnsupportedMediaType, "application/json required", nil)
		return
	}
	if callback == nil {
		writeError(w, http.StatusServiceUnavailable, "backend operation unavailable", nil)
		return
	}
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxRequestBytes))
	if err != nil {
		writeError(w, http.StatusRequestEntityTooLarge, "request body exceeds limit or is unreadable", nil)
		return
	}
	key, err := validateRequest(r.URL.Path, body)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error(), nil)
		return
	}
	statusOnly := r.URL.Path == "/api/status"
	h.mu.Lock()
	if h.closing || (!statusOnly && (h.busy || (key != "" && h.submitted[key]))) {
		h.mu.Unlock()
		writeError(w, http.StatusConflict, "operation in progress, already submitted, or server stopping", nil)
		return
	}
	if !statusOnly {
		h.busy = true
		if key != "" {
			h.submitted[key] = true
		}
	}
	h.mu.Unlock()
	if !statusOnly {
		defer func() { h.mu.Lock(); h.busy = false; h.mu.Unlock() }()
	}
	ctx := r.Context()
	if r.URL.Path == "/api/apply" || r.URL.Path == "/api/recover" {
		ctx = h.operationContext
	}
	result, err := invoke(ctx, callback, body)
	if statusOnly {
		h.observeRecovery(result)
	}
	if err != nil {
		// Recovery is resumable after a failed attempt; apply requires a new plan.
		if r.URL.Path == "/api/recover" {
			h.mu.Lock()
			delete(h.submitted, key)
			h.mu.Unlock()
		}
		writeError(w, http.StatusUnprocessableEntity, err.Error(), result)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *handler) observeRecovery(result any) {
	// An async recovery can fail after its callback returned. A fresh failure
	// snapshot permits an explicit retry of that same resumable transaction.
	data, err := json.Marshal(result)
	if err != nil {
		return
	}
	var snapshot struct {
		State       string `json:"state"`
		Transaction string `json:"transaction"`
	}
	if json.Unmarshal(data, &snapshot) != nil || snapshot.Transaction == "" {
		return
	}
	state := strings.ReplaceAll(strings.ToLower(snapshot.State), "-", "_")
	if state == "recovery_required" || state == "failed" || state == "error" {
		h.mu.Lock()
		delete(h.submitted, "recover:"+snapshot.Transaction)
		h.mu.Unlock()
	}
}

func invoke(ctx context.Context, callback func(context.Context, json.RawMessage) (any, error), body json.RawMessage) (result any, err error) {
	defer func() {
		if recover() != nil {
			result, err = nil, errors.New("backend operation failed unexpectedly; inspect status before continuing")
		}
	}()
	return callback(ctx, body)
}

func validateRequest(route string, body []byte) (string, error) {
	// Reject duplicate keys, non-object bodies, and trailing JSON before decoding
	// the route-specific contract, so every layer sees the same request.
	decoder := json.NewDecoder(strings.NewReader(string(body)))
	token, err := decoder.Token()
	if err != nil || token != json.Delim('{') {
		return "", errors.New("request must be a JSON object")
	}
	seen := make(map[string]bool)
	for decoder.More() {
		key, err := decoder.Token()
		if err != nil {
			return "", errors.New("invalid JSON request")
		}
		name, ok := key.(string)
		if !ok || seen[name] {
			return "", errors.New("duplicate or invalid request field")
		}
		seen[name] = true
		var value json.RawMessage
		if err := decoder.Decode(&value); err != nil {
			return "", errors.New("invalid JSON request")
		}
	}
	if _, err := decoder.Token(); err != nil {
		return "", errors.New("invalid JSON request")
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		return "", errors.New("only one JSON object is allowed")
	}
	var request any
	type planRequest struct {
		Project          string `json:"project"`
		Baseline         string `json:"baseline"`
		Package          string `json:"package"`
		BaselineManifest string `json:"baselineManifest,omitempty"`
		PackageManifest  string `json:"packageManifest,omitempty"`
	}
	type applyRequest struct {
		PlanID             string `json:"planId"`
		AcknowledgeStopped bool   `json:"acknowledgeStopped"`
		TrustBaseline      string `json:"trustBaseline"`
		TrustTarget        string `json:"trustTarget"`
	}
	type recoverRequest struct {
		Transaction        string `json:"transaction"`
		AcknowledgeStopped bool   `json:"acknowledgeStopped"`
	}
	switch route {
	case "/api/plan":
		request = &planRequest{}
	case "/api/apply":
		request = &applyRequest{}
	case "/api/recover":
		request = &recoverRequest{}
	case "/api/status":
		request = &struct {
			PlanID string `json:"planId,omitempty"`
		}{}
	}
	decoder = json.NewDecoder(strings.NewReader(string(body)))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(request); err != nil {
		return "", errors.New("request fields do not match the operation contract")
	}
	nonempty := func(s string) bool { return strings.TrimSpace(s) != "" }
	switch v := request.(type) {
	case *planRequest:
		if !nonempty(v.Project) || !nonempty(v.Baseline) || !nonempty(v.Package) {
			return "", errors.New("project, baseline and package paths are required")
		}
	case *applyRequest:
		if !nonempty(v.PlanID) || !v.AcknowledgeStopped || !nonempty(v.TrustBaseline) || !nonempty(v.TrustTarget) {
			return "", errors.New("planId, stopped-writers confirmation and both trust digests are required")
		}
		return "apply:" + v.PlanID, nil
	case *recoverRequest:
		if !nonempty(v.Transaction) || !v.AcknowledgeStopped {
			return "", errors.New("transaction and stopped-writers confirmation are required")
		}
		return "recover:" + v.Transaction, nil
	}
	return "", nil
}

func writeError(w http.ResponseWriter, status int, message string, snapshot any) {
	writeJSON(w, status, struct {
		Error    string `json:"error"`
		Snapshot any    `json:"snapshot,omitempty"`
	}{message, snapshot})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	data, err := json.Marshal(value)
	if err != nil {
		status = http.StatusInternalServerError
		data = []byte(`{"error":"backend returned an invalid JSON response"}`)
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_, _ = w.Write(data)
}
