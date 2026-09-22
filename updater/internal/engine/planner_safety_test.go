package engine

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func rewriteManifest(t *testing.T, root string, m Manifest) {
	t.Helper()
	m.BuildID = BuildID(m.Files)
	b, e := json.Marshal(m)
	if e != nil {
		t.Fatal(e)
	}
	put(t, root, ManifestName, string(b))
}

func TestPermissionOnlyUpgradeAndRecovery(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("POSIX execute bits; Windows has separate readonly tests")
	}
	req, p := fixture(t)
	n := harness + "/tool.txt"
	put(t, req.Package, n, "old")
	m := p.targetPackage.Manifest
	for i := range m.Files {
		if m.Files[i].Path == n {
			m.Files[i].SHA256, m.Files[i].Size, m.Files[i].Mode = digest([]byte("old")), 3, 0700
		}
	}
	rewriteManifest(t, req.Package, m)
	p, e := NewPlan(context.Background(), req)
	if e != nil || !p.Ready {
		t.Fatal(e, p)
	}
	if p.desired[n].Mode != 0700 {
		t.Fatal("permission-only change omitted")
	}
	s, e := (Runner{Failpoint: func(point string) error {
		if point == "before-complete" {
			return ErrInterrupted
		}
		return nil
	}}).Apply(context.Background(), p, auth(p))
	if e != ErrInterrupted {
		t.Fatal("expected injected interruption", e)
	}
	st, e := os.Stat(filepath.Join(p.Project, filepath.FromSlash(n)))
	if e != nil || st.Mode().Perm() != 0700 {
		t.Fatal("new permissions not installed", e)
	}
	if _, e = (Runner{}).Recover(context.Background(), s.Transaction, true); e != nil {
		t.Fatal(e)
	}
	st, e = os.Stat(filepath.Join(p.Project, filepath.FromSlash(n)))
	if e != nil || st.Mode().Perm() != 0600 {
		t.Fatal("original permissions not restored", e)
	}
}

func TestUnknownManifestOperationsRejected(t *testing.T) {
	req, p := fixture(t)
	b, e := json.Marshal(p.targetPackage.Manifest)
	if e != nil {
		t.Fatal(e)
	}
	var raw map[string]any
	if e = json.Unmarshal(b, &raw); e != nil {
		t.Fatal(e)
	}
	raw["dataSchema"] = 2
	raw["migrations"] = []any{map[string]any{"id": "unsupported", "fromSchema": 1, "toSchema": 2, "operations": []any{map[string]any{"shell": "do anything"}}}}
	b, _ = json.Marshal(raw)
	put(t, req.Package, ManifestName, string(b))
	if _, e = NewPlan(context.Background(), req); e == nil {
		t.Fatal("unknown migration silently accepted")
	}
}

func TestSensitiveRuntimeFilesAreOutsideInventory(t *testing.T) {
	req, p := fixture(t)
	for _, name := range []string{"credentials.yml", ".secrets.json", "service-account-prod.json", "private.p12"} {
		if AllowedPath(harness + "/" + name) {
			t.Fatal("sensitive manifest path accepted", name)
		}
	}
	for _, name := range []string{harness + "/.env", harness + "/secrets/token.json", harness + "/mcp/service.key"} {
		put(t, req.Project, name, "fixture secret; must stay untouched")
	}
	p, e := NewPlan(context.Background(), req)
	if e != nil {
		t.Fatal(e)
	}
	for name := range p.snapshot {
		if protectedPath(name) {
			t.Fatal("sensitive path entered snapshot", name)
		}
	}
	if _, e = (Runner{}).Apply(context.Background(), p, auth(p)); e != nil {
		t.Fatal(e)
	}
	for _, name := range []string{harness + "/.env", harness + "/secrets/token.json", harness + "/mcp/service.key"} {
		if read(t, req.Project, name) != "fixture secret; must stay untouched" {
			t.Fatal("secret changed")
		}
	}
}

func TestJSONArraysAndModesFailClosed(t *testing.T) {
	req, p := fixture(t)
	put(t, req.Project, ".claude/settings.json", `{"agent":"lead","hooks":{"Stop":[1]},"localFeature":0}`)
	m := p.targetPackage.Manifest
	v := `{"agent":"lead","hooks":{"Stop":[2]},"localFeature":0}`
	put(t, req.Package, ".claude/settings.json", v)
	for i := range m.Files {
		if m.Files[i].Path == ".claude/settings.json" {
			m.Files[i].SHA256 = digest([]byte(v))
			m.Files[i].Size = int64(len(v))
		}
	}
	rewriteManifest(t, req.Package, m)
	p, e := NewPlan(context.Background(), req)
	if e != nil {
		t.Fatal(e)
	}
	if p.Ready {
		t.Fatal("both changed config arrays should conflict")
	}
	if _, ok := mergeMode(0600, 0644, 0700); ok {
		t.Fatal("both changed modes should conflict")
	}
}
