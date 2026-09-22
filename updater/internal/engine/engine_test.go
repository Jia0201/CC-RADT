package engine

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"ccradt/updater/internal/platform"
)

func put(t *testing.T, root, name, text string) {
	t.Helper()
	p := filepath.Join(root, filepath.FromSlash(name))
	if e := os.MkdirAll(filepath.Dir(p), 0700); e != nil {
		t.Fatal(e)
	}
	if e := os.WriteFile(p, []byte(text), 0600); e != nil {
		t.Fatal(e)
	}
}
func read(t *testing.T, root, name string) string {
	t.Helper()
	b, e := os.ReadFile(filepath.Join(root, filepath.FromSlash(name)))
	if e != nil {
		t.Fatal(e)
	}
	return string(b)
}
func seal(t *testing.T, root, version string, files map[string]string, migrations []Migration, schema int) Manifest {
	t.Helper()
	files[harness+"/VERSION"] = version + "\n"
	m := Manifest{SchemaVersion: 1, Product: "CC-RADT", Version: version, DataSchema: schema, MinimumUpdaterVersion: Version, Migrations: migrations}
	for p, v := range files {
		put(t, root, p, v)
		policy := "system"
		if strings.Contains(p, "/memory/") || strings.Contains(p, "/project/") || strings.Contains(p, "/shared/") {
			policy = "data"
		}
		if p == ".claude/settings.json" || p == ".mcp.json" {
			policy = "config"
		}
		st, e := os.Stat(filepath.Join(root, filepath.FromSlash(p)))
		if e != nil {
			t.Fatal(e)
		}
		m.Files = append(m.Files, File{Path: p, SHA256: digest([]byte(v)), Size: int64(len(v)), Mode: uint32(st.Mode().Perm()), Policy: policy})
	}
	m.BuildID = BuildID(m.Files)
	b, e := json.Marshal(m)
	if e != nil {
		t.Fatal(e)
	}
	put(t, root, ManifestName, string(b))
	return m
}
func fixture(t *testing.T) (PlanRequest, *Plan) {
	t.Helper()
	root := t.TempDir()
	base := filepath.Join(root, "old")
	next := filepath.Join(root, "new")
	project := filepath.Join(root, "project 中文")
	for _, d := range []string{base, next, project} {
		if e := os.Mkdir(d, 0700); e != nil {
			t.Fatal(e)
		}
	}
	old := map[string]string{harness + "/tool.txt": "old", harness + "/retire.txt": "deprecated", harness + "/memory/MEMORY.md": "empty", harness + "/project/context.md": "empty", ".claude/settings.json": `{"agent":"lead","hooks":{},"localFeature":0}`}
	seal(t, base, "1.0.0", old, nil, 1)
	for n, v := range old {
		put(t, project, n, v)
	}
	put(t, project, harness+"/memory/MEMORY.md", "多年独立与共享记忆")
	put(t, project, harness+"/project/context.md", "真实接口与项目画像")
	put(t, project, harness+"/shared/custom-task.md", "正在积累的历史任务")
	put(t, project, harness+"/skills/local/SKILL.md", "local skill")
	put(t, project, ".claude/settings.json", `{"agent":"lead","hooks":{},"localFeature":9,"personal":{"keep":true}}`)
	put(t, project, "business.java", "do not touch")
	put(t, project, ".claude/settings.local.json", "private-unread")
	seal(t, next, "1.1.0", map[string]string{harness + "/tool.txt": "new", harness + "/added.txt": "new feature", harness + "/memory/MEMORY.md": "new empty", harness + "/project/context.md": "new empty", ".claude/settings.json": `{"agent":"lead","hooks":{},"localFeature":0,"officialFeature":true}`}, nil, 1)
	req := PlanRequest{Project: project, Baseline: base, Package: next}
	p, e := NewPlan(context.Background(), req)
	if e != nil {
		t.Fatal(e)
	}
	return req, p
}
func auth(p *Plan) ApplyRequest {
	return ApplyRequest{PlanID: p.ID, AcknowledgeStopped: true, TrustBaseline: p.BaselineDigest, TrustTarget: p.TargetDigest}
}

func TestPlanNoWritesAndPreservesRuntime(t *testing.T) {
	req, p := fixture(t)
	before, e := Inventory(context.Background(), p.Project, p.scopes)
	if e != nil {
		t.Fatal(e)
	}
	if !p.Ready {
		t.Fatalf("not ready: %+v", p.Conflicts)
	}
	_, e = NewPlan(context.Background(), req)
	if e != nil {
		t.Fatal(e)
	}
	after, e := Inventory(context.Background(), p.Project, p.scopes)
	if e != nil || !reflect.DeepEqual(before, after) {
		t.Fatal("plan mutated project", e)
	}
	txRoot, e := transactionRoot(p.Project)
	if e != nil {
		t.Fatal(e)
	}
	if _, e = os.Stat(txRoot); !os.IsNotExist(e) {
		t.Fatal("plan created transaction root")
	}
	for _, a := range p.Actions {
		if strings.Contains(a.Path, "/memory/") || strings.Contains(a.Path, "/project/") || strings.Contains(a.Path, "/shared/") {
			t.Fatalf("runtime update: %+v", a)
		}
	}
}
func TestApplyRetainsDataConfigOriginals(t *testing.T) {
	_, p := fixture(t)
	s, e := (Runner{}).Apply(context.Background(), p, auth(p))
	if e != nil {
		t.Fatal(e)
	}
	if s.State != "complete" {
		t.Fatal(s)
	}
	if read(t, p.Project, harness+"/tool.txt") != "new" || read(t, p.Project, harness+"/memory/MEMORY.md") != "多年独立与共享记忆" {
		t.Fatal("incorrect merge")
	}
	if read(t, p.Project, "business.java") != "do not touch" || read(t, p.Project, ".claude/settings.local.json") != "private-unread" {
		t.Fatal("project changed")
	}
	if read(t, filepath.Join(s.Transaction, "original"), harness+"/retire.txt") != "deprecated" {
		t.Fatal("retired original lost")
	}
	if _, e = os.Stat(filepath.Join(p.Project, harness, "retire.txt")); !os.IsNotExist(e) {
		t.Fatal("retire remains active")
	}
	var cfg map[string]any
	if e = DecodeJSON([]byte(read(t, p.Project, ".claude/settings.json")), &cfg); e != nil {
		t.Fatal(e)
	}
	if cfg["localFeature"] != json.Number("9") || cfg["officialFeature"] != true || cfg["personal"] == nil {
		t.Fatal(cfg)
	}
	if _, e = (Runner{}).Recover(context.Background(), s.Transaction, true); e == nil {
		t.Fatal("completed upgrade must not permit destructive historical rollback")
	}
}
func TestConflictBlocksWholeApply(t *testing.T) {
	req, p := fixture(t)
	put(t, p.Project, harness+"/tool.txt", "local customization")
	p, e := NewPlan(context.Background(), req)
	if e != nil {
		t.Fatal(e)
	}
	if p.Ready || len(p.Conflicts) != 1 {
		t.Fatal(p.Conflicts)
	}
	if _, e = (Runner{}).Apply(context.Background(), p, auth(p)); e == nil {
		t.Fatal("conflict applied")
	}
	if read(t, p.Project, harness+"/VERSION") != "1.0.0\n" {
		t.Fatal("version changed")
	}
}
func TestStalePlanStopsBeforeOriginalMutation(t *testing.T) {
	_, p := fixture(t)
	put(t, p.Project, harness+"/shared/new-task.md", "post-preview")
	if _, e := (Runner{}).Apply(context.Background(), p, auth(p)); e == nil {
		t.Fatal("stale plan applied")
	}
	if read(t, p.Project, harness+"/tool.txt") != "old" {
		t.Fatal("mutated")
	}
}
func TestPackageTamperStops(t *testing.T) {
	_, p := fixture(t)
	put(t, p.Package, harness+"/tool.txt", "tampered")
	if _, e := (Runner{}).Apply(context.Background(), p, auth(p)); e == nil {
		t.Fatal("tampered package applied")
	}
}
func TestExplicitConsentAndTrustRequired(t *testing.T) {
	_, p := fixture(t)
	a := auth(p)
	a.AcknowledgeStopped = false
	if _, e := (Runner{}).Apply(context.Background(), p, a); e == nil {
		t.Fatal("no stopped ack")
	}
	a = auth(p)
	a.TrustTarget = ""
	if _, e := (Runner{}).Apply(context.Background(), p, a); e == nil {
		t.Fatal("no trust")
	}
}

func TestFaultAtEverySwitchBoundaryIsRecoverable(t *testing.T) {
	_, example := fixture(t)
	points := []string{"before-complete"}
	for i := range example.Actions {
		for _, prefix := range []string{"before-action-", "after-retire-", "after-install-"} {
			points = append(points, fmt.Sprintf("%s%d", prefix, i))
		}
	}
	for _, point := range points {
		t.Run(point, func(t *testing.T) {
			_, p := fixture(t)
			s, e := (Runner{Failpoint: func(s string) error {
				if s == point {
					return ErrInterrupted
				}
				return nil
			}}).Apply(context.Background(), p, auth(p))
			if e == nil {
				t.Fatal("not interrupted")
			}
			if s.State != "recovery-required" {
				t.Fatalf("bad state %+v", s)
			}
			restored, e := (Runner{}).Recover(context.Background(), s.Transaction, true)
			if e != nil {
				t.Fatal(e)
			}
			if restored.State != "restored" {
				t.Fatal(restored)
			}
			for n, en := range p.snapshot {
				if !en.Directory {
					if e = matchLive(filepath.Join(p.Project, filepath.FromSlash(n)), en, true); e != nil {
						t.Fatal(n, e)
					}
				}
			}
			for _, a := range p.Actions {
				if a.Before == "" {
					if _, e = os.Lstat(filepath.Join(p.Project, filepath.FromSlash(a.Path))); !os.IsNotExist(e) {
						t.Fatalf("new file still active: %s", a.Path)
					}
				}
			}
			if _, e = (Runner{}).Recover(context.Background(), s.Transaction, true); e != nil {
				t.Fatal("repeat recovery failed", e)
			}
		})
	}
}
func TestRecoveryCanBeInterruptedAndRepeated(t *testing.T) {
	_, p := fixture(t)
	s, e := (Runner{Failpoint: func(s string) error {
		if s == "before-complete" {
			return ErrInterrupted
		}
		return nil
	}}).Apply(context.Background(), p, auth(p))
	if e == nil {
		t.Fatal("expected interruption")
	}
	_, e = (Runner{Failpoint: func(s string) error {
		if strings.HasPrefix(s, "recovery-retired-") {
			return ErrInterrupted
		}
		return nil
	}}).Recover(context.Background(), s.Transaction, true)
	if e == nil {
		t.Fatal("expected second interruption")
	}
	if _, e = (Runner{}).Recover(context.Background(), s.Transaction, true); e != nil {
		t.Fatal(e)
	}
}
func TestRecoveryDoesNotOverwriteNewData(t *testing.T) {
	_, p := fixture(t)
	s, e := (Runner{Failpoint: func(s string) error {
		if s == "before-complete" {
			return ErrInterrupted
		}
		return nil
	}}).Apply(context.Background(), p, auth(p))
	if e == nil {
		t.Fatal("expected interruption")
	}
	put(t, p.Project, harness+"/tool.txt", "new work since interruption")
	if _, e = (Runner{}).Recover(context.Background(), s.Transaction, true); e == nil {
		t.Fatal("new contents overwritten")
	}
	if read(t, p.Project, harness+"/tool.txt") != "new work since interruption" {
		t.Fatal("lost new content")
	}
}
func TestBackupFailureLeavesOriginalUntouched(t *testing.T) {
	_, p := fixture(t)
	s, e := (Runner{Failpoint: func(s string) error {
		if s == "backup-complete" {
			return ErrInterrupted
		}
		return nil
	}}).Apply(context.Background(), p, auth(p))
	if e == nil {
		t.Fatal("expected error")
	}
	if read(t, p.Project, harness+"/VERSION") != "1.0.0\n" {
		t.Fatal("original changed")
	}
	if _, e = os.Stat(filepath.Join(s.Transaction, "record.json")); !os.IsNotExist(e) {
		t.Fatal("premature transaction")
	}
}
func TestConcurrentUpdaterRefused(t *testing.T) {
	_, p := fixture(t)
	root, e := transactionRoot(p.Project)
	if e != nil {
		t.Fatal(e)
	}
	if e := os.MkdirAll(root, 0700); e != nil {
		t.Fatal(e)
	}
	release, e := platform.Lock(root)
	if e != nil {
		t.Fatal(e)
	}
	defer release()
	if _, e = (Runner{}).Apply(context.Background(), p, auth(p)); e == nil {
		t.Fatal("concurrent apply")
	}
}
func TestPendingTransactionBlocksAnotherApply(t *testing.T) {
	req, p := fixture(t)
	_, e := (Runner{Failpoint: func(s string) error {
		if s == "before-action-0" {
			return ErrInterrupted
		}
		return nil
	}}).Apply(context.Background(), p, auth(p))
	if e == nil {
		t.Fatal("expected crash")
	}
	if _, e = NewPlan(context.Background(), req); e == nil {
		t.Fatal("preview did not identify pending recovery")
	}
	if _, e = (Runner{}).Apply(context.Background(), p, auth(p)); e == nil {
		t.Fatal("ignored pending transaction")
	}
}
func TestStrictJSONAndManifestPaths(t *testing.T) {
	for _, s := range []string{`{"a":1,"a":2}`, `{"x":{"a":1,"a":2}}`, `{} {}`} {
		var v any
		if e := DecodeJSON([]byte(s), &v); e == nil {
			t.Fatal("accepted", s)
		}
	}
	for _, p := range []string{"../secret", ".claude/ai-teams/../settings.json", ".claude/ai-teams/.env", "README.md", ".claude/settings.local.json", ".claude/ai-teams/C:evil", ".claude/ai-teams/a\nb"} {
		if AllowedPath(p) {
			t.Fatal(p)
		}
	}
}
func TestMigrationRouteAndDataRename(t *testing.T) {
	req, p := fixture(t)
	m := p.targetPackage.Manifest
	m.DataSchema = 3
	m.Migrations = []Migration{{ID: "one-two", From: 1, To: 2, Renames: []Rename{{From: harness + "/shared/custom-task.md", To: harness + "/shared/tasks/custom-task.md"}}}, {ID: "two-three", From: 2, To: 3}}
	b, _ := json.Marshal(m)
	put(t, req.Package, ManifestName, string(b))
	p, e := NewPlan(context.Background(), req)
	if e != nil {
		t.Fatal(e)
	}
	if !p.Ready || len(p.MigrationPath) != 2 {
		t.Fatal(p.Conflicts, p.MigrationPath)
	}
	s, e := (Runner{}).Apply(context.Background(), p, auth(p))
	if e != nil {
		t.Fatal(e)
	}
	if read(t, p.Project, harness+"/shared/tasks/custom-task.md") != "正在积累的历史任务" {
		t.Fatal("migration data lost")
	}
	if read(t, filepath.Join(s.Transaction, "original"), harness+"/shared/custom-task.md") != "正在积累的历史任务" {
		t.Fatal("original lost")
	}
}
func TestMissingMigrationBlocks(t *testing.T) {
	req, p := fixture(t)
	m := p.targetPackage.Manifest
	m.DataSchema = 3
	b, _ := json.Marshal(m)
	put(t, req.Package, ManifestName, string(b))
	p, e := NewPlan(context.Background(), req)
	if e != nil {
		t.Fatal(e)
	}
	if p.Ready {
		t.Fatal("no migration accepted")
	}
}
