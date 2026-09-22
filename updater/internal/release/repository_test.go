package release

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
)

func TestPinnedRepositoryRoutesIgnoreMutableSlugs(t *testing.T) {
	z := makeZIP(t, testEntry{name: "README.md", data: "pinned identity"})
	var calls atomic.Int32
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		if r.Method != http.MethodGet || r.Header.Get("Authorization") != "" || r.Header.Get("Cookie") != "" {
			t.Error("unexpected method or credentials", r.Method, r.Header)
		}
		switch r.URL.EscapedPath() {
		case "/repositories/1298234222/releases/tags/v1.2.3":
			json.NewEncoder(w).Encode(map[string]any{
				"tag_name": "v1.2.3", "draft": false, "prerelease": false,
				"url":        "https://api.github.com/repos/other/repository/releases/1",
				"assets_url": "https://api.github.com/repositories/999/releases/1/assets",
				"assets": []map[string]any{{
					"id": 42, "name": "package.zip", "size": len(z), "state": "uploaded",
					"digest":               "sha256:" + hashBytes(z),
					"url":                  "https://api.github.com/repos/other/repository/releases/assets/42",
					"browser_download_url": "https://github.com/Jia0201/Claude-Code-Research-and-Development-Teams/releases/download/v1.2.3/package.zip",
				}},
			})
		case "/repositories/1298234222/releases/assets/42":
			w.Write(z)
		default:
			t.Error("request left pinned repository routes", r.URL)
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer s.Close()
	c := newClient(s.Client(), s.URL)
	defer c.http.CloseIdleConnections()
	list, err := c.list(context.Background(), "v1.2.3")
	if err != nil || list.Repository != "Jia0201/CC-RADT" {
		t.Fatal("current display name missing", list, err)
	}
	result, err := c.download(context.Background(), request(t))
	if err != nil || result.SHA256 != hashBytes(z) || calls.Load() != 3 {
		t.Fatal("pinned repository download failed", result, err, calls.Load())
	}
}

func TestPinnedRepositoryRejectsAPIRedirectsAndSlugFallback(t *testing.T) {
	for _, asset := range []bool{false, true} {
		tail := "tags/v1.2.3"
		accept := "application/vnd.github+json"
		if asset {
			tail, accept = "assets/42", "application/octet-stream"
		}
		for _, target := range []string{
			"https://api.github.com/repositories/1298234222/releases/" + tail,
			"https://api.github.com/repositories/999/releases/" + tail,
			"https://api.github.com/repositories/1298234222/releases/tags/v9.9.9",
			"https://api.github.com/repositories/1298234222/releases/assets/99",
			"https://api.github.com/repos/Jia0201/Claude-Code-Research-and-Development-Teams/releases/" + tail,
			"https://api.github.com/repos/Jia0201/CC-RADT/releases/" + tail,
			"https://github.com/Jia0201/Claude-Code-Research-and-Development-Teams/releases/download/v1.2.3/package.zip",
			"https://github.com/Jia0201/CC-RADT/releases/download/v1.2.3/package.zip",
			"http://api.github.com/repositories/1298234222/releases/" + tail,
			"https://api.github.com.evil.test/repositories/1298234222/releases/" + tail,
		} {
			for _, status := range []int{301, 302, 303, 307, 308, 404} {
				var calls atomic.Int32
				c := newClient(&http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
					calls.Add(1)
					if r.Method != "GET" || r.URL.String() != "https://api.github.com/repositories/1298234222/releases/"+tail {
						t.Error("unexpected unpinned request", r.Method, r.URL)
					}
					return &http.Response{StatusCode: status, Header: http.Header{"Location": {target}}, Body: io.NopCloser(strings.NewReader("")), Request: r}, nil
				})}, apiBase)
				if _, err := c.get(context.Background(), repositoryPath+tail, accept, asset); err == nil {
					t.Fatal("redirect or fallback accepted", target, status, asset)
				}
				if calls.Load() != 1 {
					t.Fatal("followed a redirect or retried a mutable repository slug", calls.Load())
				}
			}
		}
	}
}
