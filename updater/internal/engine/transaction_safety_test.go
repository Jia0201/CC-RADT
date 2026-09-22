package engine

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"

	"ccradt/updater/internal/platform"
)

func safetyRecord() Record {
	path := harness + "/VERSION"
	before := Entry{Hash: digest([]byte("1.0.0\n")), Mode: 0600, Size: 6}
	after := Entry{Hash: digest([]byte("1.1.0\n")), Mode: 0600, Size: 6}
	return Record{
		Schema: recordSchema, ID: strings.Repeat("1", 32), Project: "/fixture/project", ProjectIdentity: "fixture-directory-identity",
		UpdaterVersion: Version, FromVersion: "1.0.0", ToVersion: "1.1.0", FromDataSchema: 1, ToDataSchema: 1,
		BaselineDigest: strings.Repeat("a", 64), TargetDigest: strings.Repeat("b", 64),
		BaselineBuildID: strings.Repeat("c", 64), TargetBuildID: strings.Repeat("d", 64),
		Scopes:  []string{harness, ".claude/agents", ".claude/rules"},
		Before:  map[string]Entry{harness: {Mode: 0700, Directory: true}, path: before},
		After:   map[string]Entry{path: after},
		Actions: []Action{{Path: path, Kind: "replace", Before: before.Hash, After: after.Hash, Reason: "version update"}},
		Created: "2026-09-08T00:00:00Z",
	}
}

func safetySeal(t *testing.T, rec Record) Record {
	t.Helper()
	var e error
	rec.Checksum, e = recordChecksum(rec)
	if e != nil {
		t.Fatal(e)
	}
	return rec
}

func safetyTempDir(t *testing.T) string {
	t.Helper()
	root, e := platform.ValidateProject(t.TempDir())
	if e != nil {
		t.Fatal(e)
	}
	return root
}

func safetyTransaction(t *testing.T) (string, Record) {
	t.Helper()
	root := safetyTempDir(t)
	project := filepath.Join(root, "project")
	put(t, project, harness+"/VERSION", "1.0.0\n")
	rec := safetyRecord()
	rec.Project = project
	var e error
	rec.ProjectIdentity, e = platform.ProjectIdentity(project)
	if e != nil {
		t.Fatal(e)
	}
	txRoot, e := transactionRoot(project)
	if e != nil {
		t.Fatal(e)
	}
	tx := filepath.Join(txRoot, rec.ID)
	for _, dir := range []string{"original", "candidate", "retired", "recovery-kept", "journal"} {
		if e = secureMkdir(filepath.Join(tx, dir)); e != nil {
			t.Fatal(e)
		}
	}
	rec = safetySeal(t, rec)
	data, e := encodeRecord(rec, maxRecordBytes)
	if e != nil {
		t.Fatal(e)
	}
	if e = publishNew(filepath.Join(tx, "record.json"), data, nil); e != nil {
		t.Fatal(e)
	}
	return tx, rec
}

func TestTransactionSafetyActualRecordSizeGate(t *testing.T) {
	rec := safetyRecord()
	rec.Actions[0].Reason = "escaped \u2028 text"
	data, e := encodeRecord(rec, maxRecordBytes)
	if e != nil {
		t.Fatal(e)
	}
	if _, e = encodeRecord(rec, len(data)); e != nil {
		t.Fatal("exact limit rejected", e)
	}
	if data[len(data)-1] != '\n' {
		t.Fatal("missing persisted newline")
	}
	if _, e = encodeRecord(rec, len(data)-1); e == nil {
		t.Fatal("accepted oversized actual encoding")
	}
	var decoded Record
	if e = decodeTransactionJSON(data, &decoded); e != nil {
		t.Fatal(e)
	}
	if e = validateRecord(decoded); e != nil {
		t.Fatal(e)
	}
}

func TestTransactionSafetyRecordConsistency(t *testing.T) {
	tests := []struct {
		name string
		edit func(*Record)
	}{
		{"scope traversal", func(r *Record) { r.Scopes = append(r.Scopes, "../outside") }},
		{"scope secret", func(r *Record) { r.Scopes = append(r.Scopes, ".claude/settings.local.json") }},
		{"scope duplicate", func(r *Record) { r.Scopes = append(r.Scopes, harness) }},
		{"before traversal", func(r *Record) { r.Before["../outside"] = r.Before[harness+"/VERSION"] }},
		{"after traversal", func(r *Record) { r.After["../outside"] = r.After[harness+"/VERSION"] }},
		{"map secret", func(r *Record) { r.Before[harness+"/.env"] = r.Before[harness+"/VERSION"] }},
		{"map outside scopes", func(r *Record) { r.Before[".mcp.json"] = r.Before[harness+"/VERSION"] }},
		{"action traversal", func(r *Record) { r.Actions[0].Path = "../outside" }},
		{"action hash", func(r *Record) { r.Actions[0].Before = strings.Repeat("e", 64) }},
		{"action kind", func(r *Record) { r.Actions[0].Kind = "add" }},
		{"action duplicate", func(r *Record) { r.Actions = append(r.Actions, r.Actions[0]) }},
		{"missing action", func(r *Record) { r.Before[harness+"/missing.txt"] = r.Before[harness+"/VERSION"] }},
		{"unclaimed addition", func(r *Record) { r.After[harness+"/extra.txt"] = r.After[harness+"/VERSION"] }},
		{"invalid mode", func(r *Record) {
			en := r.Before[harness+"/VERSION"]
			en.Mode = 04000
			r.Before[harness+"/VERSION"] = en
		}},
		{"directory hash", func(r *Record) { en := r.Before[harness]; en.Hash = strings.Repeat("e", 64); r.Before[harness] = en }},
		{"invalid audit digest", func(r *Record) { r.BaselineDigest = "not-a-digest" }},
		{"invalid build identity", func(r *Record) { r.TargetBuildID = "" }},
		{"downgrade version", func(r *Record) { r.ToVersion = "0.9.0" }},
		{"downgrade schema", func(r *Record) { r.FromDataSchema = 2 }},
		{"unknown record schema", func(r *Record) { r.Schema = 1 }},
		{"missing identity", func(r *Record) { r.ProjectIdentity = "" }},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			rec := safetyRecord()
			tc.edit(&rec)
			// Recompute the checksum so structural validation is exercised as well.
			if e := validateRecord(safetySeal(t, rec)); e == nil {
				t.Fatal("accepted inconsistent record")
			}
		})
	}
	rec := safetySeal(t, safetyRecord())
	rec.TargetDigest = strings.Repeat("e", 64)
	if e := validateRecord(rec); e == nil {
		t.Fatal("accepted changed record checksum")
	}
	rec = safetyRecord()
	rec.Before[".claude/agents"] = Entry{Directory: true, Mode: 0700}
	rec.Before[".claude/rules"] = Entry{Directory: true, Mode: 0700}
	if e := validateRecord(safetySeal(t, rec)); e != nil {
		t.Fatal("rejected aggregate directories", e)
	}
}

func TestTransactionSafetyPublishDoesNotOverwrite(t *testing.T) {
	root := safetyTempDir(t)
	path := filepath.Join(root, "record.json")
	original := []byte("existing publication\n")
	if e := publishNew(path, original, nil); e != nil {
		t.Fatal(e)
	}
	if e := publishNew(path, []byte("replacement"), nil); e == nil {
		t.Fatal("overwrote a public record")
	}
	actual, e := os.ReadFile(path)
	if e != nil || !bytes.Equal(actual, original) {
		t.Fatal("public record changed", e)
	}
}

func TestTransactionSafetyJournalClockAndTerminal(t *testing.T) {
	tx, rec := safetyTransaction(t)
	j := transactionJournal{tx: tx, total: len(rec.Actions)}
	now := time.Date(2026, 9, 8, 12, 0, 0, 0, time.UTC)
	for i, state := range []string{"switching", "switching", "complete"} {
		step := 1
		if i == 0 {
			step = 0
		}
		if e := j.appendAt(state, step, now.Add(-time.Duration(i)*time.Hour)); e != nil {
			t.Fatal(e)
		}
	}
	st, e := TransactionStatus(tx)
	if e != nil || st.State != "complete" || st.Step != 1 {
		t.Fatal("wall clock changed transaction state", st, e)
	}
	if e = j.append("recovering", 0); e == nil {
		t.Fatal("terminal state regressed")
	}
	if _, e = (Runner{}).Recover(context.Background(), tx, true); e == nil {
		t.Fatal("completed transaction was recoverable")
	}
	if pending, e := PendingTransaction(rec.Project); e != nil || pending != "" {
		t.Fatal("completed transaction reported pending", pending, e)
	}
}

func TestTransactionSafetyJournalTempAndInvalidPublishedEvents(t *testing.T) {
	tx, rec := safetyTransaction(t)
	j := transactionJournal{tx: tx, total: len(rec.Actions)}
	if e := j.append("switching", 0); e != nil {
		t.Fatal(e)
	}
	j.checkpoint = func(point string) error {
		if point == "journal-temp-created" {
			return ErrInterrupted
		}
		return nil
	}
	if e := j.append("switching", 1); !errors.Is(e, ErrInterrupted) {
		t.Fatal("missing interruption", e)
	}
	j, e := readJournal(tx, len(rec.Actions))
	if e != nil || j.last.Sequence != 1 {
		t.Fatal("temporary event blocked journal replay", e)
	}
	if e = j.append("switching", 1); e != nil {
		t.Fatal("could not reuse unpublished sequence", e)
	}
	if e = j.append("complete", 1); e != nil {
		t.Fatal(e)
	}
	bad := event{Sequence: 4, State: "recovering", Step: 0, Time: time.Now().UTC().Format(time.RFC3339Nano)}
	data, _ := json.Marshal(bad)
	if e = publishNew(filepath.Join(tx, "journal", "00000000000000000004.json"), data, nil); e != nil {
		t.Fatal(e)
	}
	st, e := TransactionStatus(tx)
	if e == nil || st.State != "complete" {
		t.Fatal("invalid published event degraded terminal state", st, e)
	}
}

func TestTransactionSafetyInvalidJournalSequences(t *testing.T) {
	for _, name := range []string{"gap", "step jump", "filename mismatch", "unknown state", "malformed JSON"} {
		t.Run(name, func(t *testing.T) {
			tx, rec := safetyTransaction(t)
			ev := event{Sequence: 1, State: "switching", Step: 0, Time: time.Now().UTC().Format(time.RFC3339Nano)}
			file := "00000000000000000001.json"
			switch name {
			case "gap":
				ev.Sequence, file = 2, "00000000000000000002.json"
			case "step jump":
				ev.Step = 1
			case "filename mismatch":
				file = "00000000000000000002.json"
			case "unknown state":
				ev.State = "approved"
			}
			data, _ := json.Marshal(ev)
			if name == "malformed JSON" {
				data = []byte("{")
			}
			if e := publishNew(filepath.Join(tx, "journal", file), data, nil); e != nil {
				t.Fatal(e)
			}
			if _, e := readJournal(tx, len(rec.Actions)); e == nil {
				t.Fatal("accepted invalid published event")
			}
		})
	}
}

func TestTransactionSafetyIdentityAndReadOnlyDiscovery(t *testing.T) {
	project := safetyTempDir(t)
	root, e := transactionRoot(project)
	if e != nil {
		t.Fatal(e)
	}
	if pending, e := PendingTransaction(project); e != nil || pending != "" {
		t.Fatal(pending, e)
	}
	if _, e = os.Lstat(root); !os.IsNotExist(e) {
		t.Fatal("discovery created its root", e)
	}
	tx, rec := safetyTransaction(t)
	if _, e = loadRecord(tx); e != nil {
		t.Fatal(e)
	}
	alias := filepath.Join(filepath.Dir(rec.Project), "PROJECT")
	original, e := os.Stat(rec.Project)
	if e != nil {
		t.Fatal(e)
	}
	if other, err := os.Stat(alias); err == nil && os.SameFile(original, other) {
		if pending, err := PendingTransaction(alias); err != nil || pending != tx {
			t.Fatal("case alias missed pending transaction", pending, err)
		}
		a, err := transactionRoot(alias)
		if err != nil {
			t.Fatal(err)
		}
		b, err := transactionRoot(rec.Project)
		if err != nil || a != b {
			t.Fatal("case alias split transaction root", err)
		}
	}
	if e = os.Rename(rec.Project, rec.Project+"-kept"); e != nil {
		t.Fatal(e)
	}
	if e = os.Mkdir(rec.Project, 0700); e != nil {
		t.Fatal(e)
	}
	if _, e = loadRecord(tx); e == nil {
		t.Fatal("accepted different directory object at project path")
	}
}

type safetyCrashRequest struct {
	Root    string      `json:"root"`
	Request PlanRequest `json:"request"`
	Tx      string      `json:"tx"`
	Point   string      `json:"point"`
}

func TestTransactionSafetyCrashChild(t *testing.T) {
	data := os.Getenv("CC_RADT_TRANSACTION_SAFETY_CHILD")
	if data == "" {
		return
	}
	var input safetyCrashRequest
	if e := json.Unmarshal([]byte(data), &input); e != nil {
		t.Fatal(e)
	}
	// The parent provides an isolated fixture root, never a checkout or user project.
	for _, path := range []string{input.Request.Project, input.Request.Baseline, input.Request.Package, input.Tx} {
		if path == "" {
			continue
		}
		rel, e := filepath.Rel(input.Root, path)
		if e != nil || rel == "." || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) || filepath.IsAbs(rel) {
			t.Fatal("child path outside fixture")
		}
	}
	runner := Runner{Failpoint: func(point string) error {
		if point == input.Point {
			os.Exit(77) // No deferred unlock, cleanup, or status notification runs.
		}
		return nil
	}}
	if input.Tx != "" {
		if _, e := runner.Recover(context.Background(), input.Tx, true); e != nil {
			t.Fatal(e)
		}
	} else {
		p, e := NewPlan(context.Background(), input.Request)
		if e != nil {
			t.Fatal(e)
		}
		if _, e = runner.Apply(context.Background(), p, auth(p)); e != nil {
			t.Fatal(e)
		}
	}
	t.Fatal("crash checkpoint was not reached")
}

func safetyCrash(t *testing.T, input safetyCrashRequest) {
	t.Helper()
	for _, path := range []*string{&input.Root, &input.Request.Project, &input.Request.Baseline, &input.Request.Package, &input.Tx} {
		if *path == "" {
			continue
		}
		canonical, e := platform.ValidateProject(*path)
		if e != nil {
			t.Fatal(e)
		}
		*path = canonical
	}
	executable, e := os.Executable()
	if e != nil {
		t.Fatal(e)
	}
	data, e := json.Marshal(input)
	if e != nil {
		t.Fatal(e)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, executable, "-test.run=^TestTransactionSafetyCrashChild$")
	cmd.Dir = input.Root
	cmd.Env = append(os.Environ(), "CC_RADT_TRANSACTION_SAFETY_CHILD="+string(data))
	output, e := cmd.CombinedOutput()
	var exit *exec.ExitError
	if !errors.As(e, &exit) || exit.ExitCode() != 77 {
		t.Fatalf("wanted real process exit 77, got %v: %s", e, output)
	}
}

func safetyCheckRestored(t *testing.T, p *Plan) {
	t.Helper()
	for path, en := range p.snapshot {
		if !en.Directory {
			if e := matchLive(filepath.Join(p.Project, filepath.FromSlash(path)), en, true); e != nil {
				t.Fatalf("original not restored at %s: %v", path, e)
			}
		}
	}
	for _, a := range p.Actions {
		if a.Before == "" {
			if _, e := os.Lstat(filepath.Join(p.Project, filepath.FromSlash(a.Path))); !os.IsNotExist(e) {
				t.Fatal("transaction addition remains live", a.Path, e)
			}
		}
	}
}

func TestTransactionSafetyRealCrashAndRecovery(t *testing.T) {
	for _, stage := range []string{"record-temp-created", "record-temp-written", "record-temp-synced", "record-published", "journal-temp-created", "after-retire", "after-install", "before-complete"} {
		t.Run(stage, func(t *testing.T) {
			req, p := fixture(t)
			point := stage
			if stage == "after-retire" || stage == "after-install" {
				found := false
				for i, a := range p.Actions {
					if a.Before != "" && a.After != "" && a.Path != harness+"/VERSION" {
						point, found = fmt.Sprintf("%s-%d", stage, i), true
						break
					}
				}
				if !found {
					t.Fatal("missing replace action")
				}
			}
			safetyCrash(t, safetyCrashRequest{Root: filepath.Dir(p.Project), Request: req, Point: point})
			tx, e := PendingTransaction(p.Project)
			if e != nil {
				t.Fatal(e)
			}
			if strings.HasPrefix(stage, "record-temp-") {
				if tx != "" {
					t.Fatal("unpublished record blocks next attempt")
				}
				now, e := Inventory(context.Background(), p.Project, p.scopes)
				if e != nil || !reflect.DeepEqual(now, p.snapshot) {
					t.Fatal("original changed before publication", e)
				}
				fresh, e := NewPlan(context.Background(), req)
				if e != nil {
					t.Fatal(e)
				}
				if _, e = (Runner{}).Apply(context.Background(), fresh, auth(fresh)); e != nil {
					t.Fatal("partial record permanently blocked retry", e)
				}
				return
			}
			if tx == "" {
				t.Fatal("published record not discovered after restart")
			}
			rec, e := loadRecord(tx)
			if e != nil || rec.BaselineDigest != p.BaselineDigest || rec.TargetDigest != p.TargetDigest || rec.FromVersion != p.FromVersion || rec.ToVersion != p.ToVersion || rec.BaselineBuildID != p.baselinePackage.Manifest.BuildID || rec.TargetBuildID != p.targetPackage.Manifest.BuildID {
				t.Fatal("missing recovery audit identity", e)
			}
			newPath := harness + "/shared/after-crash.txt"
			put(t, p.Project, newPath, "new user data")
			st, e := (Runner{}).Recover(context.Background(), tx, true)
			if e != nil || st.State != "restored" {
				t.Fatal(st.State, e)
			}
			safetyCheckRestored(t, p)
			if read(t, p.Project, newPath) != "new user data" {
				t.Fatal("recovery lost post-crash file")
			}
			put(t, p.Project, harness+"/added.txt", "new work after restoration")
			if _, e = (Runner{}).Recover(context.Background(), tx, true); e != nil {
				t.Fatal(e)
			}
			if read(t, p.Project, harness+"/added.txt") != "new work after restoration" {
				t.Fatal("repeated recovery lost post-restoration data")
			}
			if pending, e := PendingTransaction(p.Project); e != nil || pending != "" {
				t.Fatal("restored transaction remains pending", pending, e)
			}
		})
	}
}

func TestTransactionSafetyRealRecoveryCopyCrash(t *testing.T) {
	_, p := fixture(t)
	st, e := (Runner{Failpoint: func(point string) error {
		if point == "before-complete" {
			return ErrInterrupted
		}
		return nil
	}}).Apply(context.Background(), p, auth(p))
	if !errors.Is(e, ErrInterrupted) {
		t.Fatal(e)
	}
	point := fmt.Sprintf("recovery-copy-prepared-%d", len(p.Actions)-1)
	safetyCrash(t, safetyCrashRequest{Root: filepath.Dir(p.Project), Tx: st.Transaction, Point: point})
	if _, e = (Runner{}).Recover(context.Background(), st.Transaction, true); e != nil {
		t.Fatal(e)
	}
	safetyCheckRestored(t, p)
}

func safetyModeFixture(t *testing.T) *Plan {
	t.Helper()
	req, p := fixture(t)
	path := harness + "/tool.txt"
	put(t, req.Package, path, "old")
	if e := os.Chmod(filepath.Join(req.Package, filepath.FromSlash(path)), 0755); e != nil {
		t.Fatal(e)
	}
	m := p.targetPackage.Manifest
	for i := range m.Files {
		if m.Files[i].Path == path {
			m.Files[i].SHA256, m.Files[i].Size, m.Files[i].Mode = digest([]byte("old")), 3, 0755
		}
	}
	m.BuildID = BuildID(m.Files)
	data, _ := json.Marshal(m)
	put(t, req.Package, ManifestName, string(data))
	p, e := NewPlan(context.Background(), req)
	if e != nil || !p.Ready {
		t.Fatal("mode fixture not ready", e)
	}
	return p
}

func TestTransactionSafetyRecoverModeOnlyAndProtectNewMode(t *testing.T) {
	for _, changed := range []bool{false, true} {
		t.Run(fmt.Sprintf("user-mode-change-%t", changed), func(t *testing.T) {
			p := safetyModeFixture(t)
			path := filepath.Join(p.Project, harness, "tool.txt")
			st, e := (Runner{Failpoint: func(point string) error {
				if point == "before-complete" {
					return ErrInterrupted
				}
				return nil
			}}).Apply(context.Background(), p, auth(p))
			if !errors.Is(e, ErrInterrupted) {
				t.Fatal(e)
			}
			info, e := os.Stat(path)
			if e != nil || info.Mode().Perm() != 0755 {
				t.Fatal("mode-only action not installed", e)
			}
			if changed {
				if e = os.Chmod(path, 0700); e != nil {
					t.Fatal(e)
				}
			}
			_, e = (Runner{}).Recover(context.Background(), st.Transaction, true)
			if changed {
				if e == nil {
					t.Fatal("new user permission change was overwritten")
				}
				info, err := os.Stat(path)
				if err != nil || info.Mode().Perm() != 0700 || read(t, p.Project, harness+"/VERSION") != p.ToVersion+"\n" {
					t.Fatal("preflight touched live state", err)
				}
			} else {
				if e != nil {
					t.Fatal(e)
				}
				safetyCheckRestored(t, p)
			}
		})
	}
}

func safetyWriteSameInode(t *testing.T, path, text string) {
	t.Helper()
	before, e := os.Stat(path)
	if e != nil {
		t.Fatal(e)
	}
	if e = os.WriteFile(path, []byte(text), before.Mode().Perm()); e != nil {
		t.Fatal(e)
	}
	after, e := os.Stat(path)
	if e != nil || !os.SameFile(before, after) {
		t.Fatal("fixture did not retain source inode", e)
	}
}

func safetyAssertRecoveryBlockedWithoutWrites(t *testing.T, p *Plan, tx string) {
	t.Helper()
	before, e := Inventory(context.Background(), p.Project, p.scopes)
	if e != nil {
		t.Fatal(e)
	}
	if _, e = (Runner{}).Recover(context.Background(), tx, true); e == nil || !strings.Contains(e.Error(), "手动") {
		t.Fatal("expected explicit manual retrieval, got", e)
	}
	after, e := Inventory(context.Background(), p.Project, p.scopes)
	if e != nil || !reflect.DeepEqual(before, after) {
		t.Fatal("blocked recovery still changed the live project", e)
	}
}

func TestTransactionSafetyApplyRetireConcurrentWrite(t *testing.T) {
	for _, receiptFails := range []bool{false, true} {
		t.Run(fmt.Sprintf("receipt-failure-%t", receiptFails), func(t *testing.T) {
			_, p := fixture(t)
			index := -1
			for i, action := range p.Actions {
				if action.Before != "" && action.After != "" && action.Path != harness+"/VERSION" {
					index = i
					break
				}
			}
			if index < 0 {
				t.Fatal("missing replace action")
			}
			action := p.Actions[index]
			live := filepath.Join(p.Project, filepath.FromSlash(action.Path))
			written := false
			st, e := (Runner{Failpoint: func(point string) error {
				if point == fmt.Sprintf("before-retire-%d", index) {
					safetyWriteSameInode(t, live, "new same-inode user content")
					written = true
				}
				if receiptFails && point == "conflict-temp-created" {
					return ErrInterrupted
				}
				return nil
			}}).Apply(context.Background(), p, auth(p))
			if !written || e == nil || st.State != "recovery-required" || !strings.Contains(e.Error(), "手动") {
				t.Fatal("retired concurrent write was not blocked", st.State, e)
			}
			if _, e = os.Lstat(live); !os.IsNotExist(e) {
				t.Fatal("candidate installed after source mismatch", e)
			}
			retired := filepath.Join(st.Transaction, "retired")
			if read(t, retired, action.Path) != "new same-inode user content" {
				t.Fatal("new data not retained")
			}
			_, receiptErr := os.Stat(filepath.Join(st.Transaction, "conflict.json"))
			if receiptFails && !os.IsNotExist(receiptErr) {
				t.Fatal("failure fixture unexpectedly published receipt", receiptErr)
			}
			if !receiptFails && receiptErr != nil {
				t.Fatal("missing durable conflict receipt", receiptErr)
			}
			safetyAssertRecoveryBlockedWithoutWrites(t, p, st.Transaction)
			if read(t, retired, action.Path) != "new same-inode user content" {
				t.Fatal("recovery changed retained user data")
			}
		})
	}
}

func TestTransactionSafetyRecoveryKeptConcurrentWrite(t *testing.T) {
	for _, receiptFails := range []bool{false, true} {
		t.Run(fmt.Sprintf("receipt-failure-%t", receiptFails), func(t *testing.T) {
			_, p := fixture(t)
			st, e := (Runner{Failpoint: func(point string) error {
				if point == "before-complete" {
					return ErrInterrupted
				}
				return nil
			}}).Apply(context.Background(), p, auth(p))
			if !errors.Is(e, ErrInterrupted) {
				t.Fatal(e)
			}
			index := len(p.Actions) - 1
			action := p.Actions[index]
			live := filepath.Join(p.Project, filepath.FromSlash(action.Path))
			written := false
			_, e = (Runner{Failpoint: func(point string) error {
				if point == fmt.Sprintf("before-recovery-retire-%d", index) {
					safetyWriteSameInode(t, live, "new work during recovery")
					written = true
				}
				if receiptFails && point == "conflict-temp-created" {
					return ErrInterrupted
				}
				return nil
			}}).Recover(context.Background(), st.Transaction, true)
			if !written || e == nil || !strings.Contains(e.Error(), "手动") {
				t.Fatal("recovery installed old original over new work", e)
			}
			if _, e = os.Lstat(live); !os.IsNotExist(e) {
				t.Fatal("old original installed despite kept mismatch", e)
			}
			files, e := filepath.Glob(filepath.Join(st.Transaction, "recovery-kept", "*", filepath.FromSlash(action.Path)))
			if e != nil || len(files) != 1 {
				t.Fatal("missing retained live file", e)
			}
			data, e := os.ReadFile(files[0])
			if e != nil || string(data) != "new work during recovery" {
				t.Fatal("retained new work lost", e)
			}
			_, receiptErr := os.Stat(filepath.Join(st.Transaction, "conflict.json"))
			if receiptFails && !os.IsNotExist(receiptErr) {
				t.Fatal("failure fixture unexpectedly published receipt", receiptErr)
			}
			if !receiptFails && receiptErr != nil {
				t.Fatal("missing conflict receipt", receiptErr)
			}
			safetyAssertRecoveryBlockedWithoutWrites(t, p, st.Transaction)
			data, e = os.ReadFile(files[0])
			if e != nil || string(data) != "new work during recovery" {
				t.Fatal("repeated recovery changed retained new work", e)
			}
		})
	}
}

func safetyOwnership(t *testing.T, path string) [2]uint64 {
	t.Helper()
	st, e := os.Stat(path)
	if e != nil {
		t.Fatal(e)
	}
	metadata := reflect.Indirect(reflect.ValueOf(st.Sys()))
	if !metadata.IsValid() || metadata.Kind() != reflect.Struct {
		t.Skip("native UID/GID metadata unavailable")
	}
	uid, gid := metadata.FieldByName("Uid"), metadata.FieldByName("Gid")
	if !uid.IsValid() || !gid.IsValid() || !uid.CanUint() || !gid.CanUint() {
		t.Skip("native UID/GID metadata unavailable")
	}
	return [2]uint64{uid.Uint(), gid.Uint()}
}

func TestTransactionSafetyPreserveLocalOwnership(t *testing.T) {
	for _, supplementary := range []bool{false, true} {
		t.Run(fmt.Sprintf("supplementary-group-%t", supplementary), func(t *testing.T) {
			req, p := fixture(t)
			paths := []string{harness + "/tool.txt", ".claude/settings.json"}
			if !p.desired[paths[0]].Package || p.desired[paths[1]].Bytes == nil {
				t.Fatal("fixture must exercise payload replacement and generated JSON")
			}
			defaultOwner := safetyOwnership(t, filepath.Join(p.Project, filepath.FromSlash(paths[0])))
			if supplementary {
				groups, e := os.Getgroups()
				if e != nil {
					t.Skipf("supplementary groups unavailable: %v", e)
				}
				group := -1
				for _, gid := range groups {
					if uint64(gid) != defaultOwner[1] {
						group = gid
						break
					}
				}
				if group < 0 {
					t.Skip("no distinct supplementary group available")
				}
				for _, n := range paths {
					if e = os.Chown(filepath.Join(p.Project, filepath.FromSlash(n)), -1, group); e != nil {
						t.Fatal("set local group", e)
					}
				}
				// A new payload must still use local defaults, even if its publisher group differs.
				if e = os.Chown(filepath.Join(req.Package, filepath.FromSlash(harness+"/added.txt")), -1, group); e != nil {
					t.Fatal("set publisher group", e)
				}
			}
			expected := map[string][2]uint64{harness + "/added.txt": defaultOwner}
			for _, n := range paths {
				expected[n] = safetyOwnership(t, filepath.Join(p.Project, filepath.FromSlash(n)))
			}
			checkedCandidate := false
			var tx string
			runner := Runner{
				Observe: func(s Status) { tx = s.Transaction },
				Failpoint: func(point string) error {
					if point != "candidate-complete" {
						return nil
					}
					for n, want := range expected {
						got := safetyOwnership(t, filepath.Join(tx, "candidate", filepath.FromSlash(n)))
						if got != want {
							t.Fatalf("candidate %s ownership = %v, want %v", n, got, want)
						}
					}
					if _, e := os.Stat(filepath.Join(tx, "record.json")); !os.IsNotExist(e) {
						t.Fatal("ownership check must precede record publication", e)
					}
					checkedCandidate = true
					return nil
				},
			}
			st, e := runner.Apply(context.Background(), p, auth(p))
			if e != nil || st.State != "complete" || !checkedCandidate {
				t.Fatal("apply failed", st.State, e)
			}
			for n, want := range expected {
				if got := safetyOwnership(t, filepath.Join(p.Project, filepath.FromSlash(n))); got != want {
					t.Fatalf("installed %s ownership = %v, want %v", n, got, want)
				}
			}
			if read(t, p.Project, paths[0]) != "new" || !strings.Contains(read(t, p.Project, paths[1]), "officialFeature") {
				t.Fatal("ownership preservation lost candidate content")
			}
		})
	}
}
