package engine

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strconv"
	"strings"
	"time"

	"ccradt/updater/internal/platform"
)

type ApplyRequest struct {
	PlanID             string `json:"planId"`
	AcknowledgeStopped bool   `json:"acknowledgeStopped"`
	TrustBaseline      string `json:"trustBaseline"`
	TrustTarget        string `json:"trustTarget"`
}
type Status struct {
	State       string `json:"state"`
	Transaction string `json:"transaction,omitempty"`
	Step        int    `json:"step"`
	Total       int    `json:"total"`
	Error       string `json:"error,omitempty"`
	Plan        *Plan  `json:"plan,omitempty"`
}
type Record struct {
	Schema          int              `json:"schema"`
	ID              string           `json:"id"`
	Project         string           `json:"project"`
	ProjectIdentity string           `json:"projectIdentity"`
	UpdaterVersion  string           `json:"updaterVersion"`
	FromVersion     string           `json:"fromVersion"`
	ToVersion       string           `json:"toVersion"`
	FromDataSchema  int              `json:"fromDataSchema"`
	ToDataSchema    int              `json:"toDataSchema"`
	BaselineDigest  string           `json:"baselineDigest"`
	TargetDigest    string           `json:"targetDigest"`
	BaselineBuildID string           `json:"baselineBuildId"`
	TargetBuildID   string           `json:"targetBuildId"`
	Scopes          []string         `json:"scopes"`
	Before          map[string]Entry `json:"before"`
	After           map[string]Entry `json:"after"`
	Actions         []Action         `json:"actions"`
	Created         string           `json:"created"`
	Checksum        string           `json:"checksum"`
}
type event struct {
	Sequence uint64 `json:"sequence"`
	State    string `json:"state"`
	Step     int    `json:"step"`
	Time     string `json:"time"`
}

const recordSchema = 2
const maxRecordBytes = 32 << 20
const maxEventBytes = 4096

// Failpoint is nil in production; tests crash at the same boundaries as disk writes.
type Runner struct {
	Failpoint func(string) error
	Observe   func(Status)
}

func (r Runner) hit(name string) error {
	if r.Failpoint != nil {
		return r.Failpoint(name)
	}
	return nil
}
func (r Runner) notify(s Status) {
	if r.Observe != nil {
		r.Observe(s)
	}
}

func transactionRoot(project string) (string, error) {
	project, e := platform.ValidateProject(project)
	if e != nil {
		return "", e
	}
	identity, e := platform.ProjectIdentity(project)
	if e != nil {
		return "", e
	}
	return filepath.Join(filepath.Dir(project), ".cc-radt-upgrades", digest([]byte(identity))), nil
}

func writeNew(path string, data []byte, mode os.FileMode) error {
	f, e := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, mode)
	if e != nil {
		return e
	}
	if _, e = f.Write(data); e != nil {
		f.Close()
		return e
	}
	if e = f.Sync(); e != nil {
		f.Close()
		return e
	}
	if e = f.Close(); e != nil {
		return e
	}
	return platform.SyncDir(filepath.Dir(path))
}

// Only fully synced files receive a public name. Interrupted temporary files are
// inert and retained; a published record or event is never replaced in place.
func publishNew(path string, data []byte, checkpoint func(string) error) error {
	hit := func(stage string) error {
		if checkpoint != nil {
			return checkpoint(stage)
		}
		return nil
	}
	parent, e := platform.ValidateProject(filepath.Dir(path))
	if e != nil {
		return e
	}
	path, e = platform.SafePath(parent, filepath.Base(path))
	if e != nil {
		return e
	}
	tmp := filepath.Join(parent, ".tmp-"+ID())
	f, e := os.OpenFile(tmp, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if e != nil {
		return e
	}
	defer f.Close()
	if e = hit("temp-created"); e != nil {
		return e
	}
	if _, e = f.Write(data); e != nil {
		return e
	}
	if e = hit("temp-written"); e != nil {
		return e
	}
	if e = f.Sync(); e != nil {
		return e
	}
	if e = f.Close(); e != nil {
		return e
	}
	if e = hit("temp-synced"); e != nil {
		return e
	}
	if e = moveNew(tmp, path); e != nil {
		return e
	}
	return hit("published")
}

func encodeRecord(rec Record, limit int) ([]byte, error) {
	checksum, e := recordChecksum(rec)
	if e != nil {
		return nil, e
	}
	rec.Checksum = checksum
	if e = validateRecord(rec); e != nil {
		return nil, e
	}
	b, e := json.MarshalIndent(rec, "", "  ")
	if e != nil {
		return nil, e
	}
	// Check the actual persisted encoding, including its trailing newline.
	if limit < 1 || len(b) >= limit {
		return nil, fmt.Errorf("事务记录过大，原安装未切换")
	}
	return append(b, '\n'), nil
}

func recordChecksum(rec Record) (string, error) {
	rec.Checksum = ""
	b, e := json.Marshal(rec)
	if e != nil {
		return "", e
	}
	return digest(b), nil
}

func secureMkdir(path string) error {
	// Existing ancestors must be directories rather than redirects. Do not chmod user directories.
	abs, e := filepath.Abs(path)
	if e != nil {
		return e
	}
	cur := abs
	var missing []string
	for {
		st, e := os.Lstat(cur)
		if e == nil {
			if !st.IsDir() || st.Mode()&os.ModeSymlink != 0 {
				return fmt.Errorf("目录不安全：%s", cur)
			}
			break
		}
		if !os.IsNotExist(e) {
			return e
		}
		missing = append(missing, cur)
		parent := filepath.Dir(cur)
		if parent == cur {
			return e
		}
		cur = parent
	}
	if _, e = platform.ValidateProject(cur); e != nil {
		return e
	}
	for i := len(missing) - 1; i >= 0; i-- {
		if e = mkdirDurable(missing[i]); e != nil {
			return e
		}
	}
	return nil
}

func mkdirDurable(path string) error {
	parent := filepath.Dir(path)
	if _, e := platform.SafePath(parent, filepath.Base(path)); e != nil {
		return e
	}
	if e := os.Mkdir(path, 0700); e != nil {
		return e
	}
	if e := platform.SyncDir(path); e != nil {
		return e
	}
	return platform.SyncDir(parent)
}

func pendingTransaction(root string) (string, error) {
	entries, e := os.ReadDir(root)
	if os.IsNotExist(e) {
		return "", nil
	}
	if e != nil {
		return "", e
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		tx := filepath.Join(root, entry.Name())
		if _, e = os.Lstat(filepath.Join(tx, "record.json")); os.IsNotExist(e) {
			continue
		} else if e != nil {
			return "", e
		}
		s, e := TransactionStatus(tx)
		if e != nil {
			return "", e
		}
		if s.State != "complete" && s.State != "restored" && s.State != "aborted" {
			return tx, nil
		}
	}
	return "", nil
}

// PendingTransaction is a read-only discovery API. Apply rechecks under the
// project lock because a preview cannot reserve the filesystem state.
func PendingTransaction(project string) (string, error) {
	root, e := transactionRoot(project)
	if e != nil {
		return "", e
	}
	parent := filepath.Dir(filepath.Dir(root))
	if _, e = platform.SafePath(parent, filepath.ToSlash(filepath.Join(".cc-radt-upgrades", filepath.Base(root)))); e != nil {
		return "", e
	}
	return pendingTransaction(root)
}

func (r Runner) Apply(ctx context.Context, p *Plan, a ApplyRequest) (s Status, err error) {
	s = Status{State: "preparing", Total: len(p.Actions), Plan: p}
	if !p.Ready || a.PlanID != p.ID {
		return s, fmt.Errorf("计划未就绪或计划身份不匹配")
	}
	if !a.AcknowledgeStopped {
		return s, fmt.Errorf("必须先停止目标项目所有会话与写入者")
	}
	if a.TrustBaseline != p.BaselineDigest || a.TrustTarget != p.TargetDigest {
		return s, fmt.Errorf("需要明确认可预览所示的旧/新包清单指纹")
	}
	if e := platform.CheckWriters(p.Project); e != nil {
		return s, e
	}
	root, e := transactionRoot(p.Project)
	if e != nil {
		return s, e
	}
	if e := secureMkdir(root); e != nil {
		return s, e
	}
	release, e := platform.Lock(root)
	if e != nil {
		return s, e
	}
	defer release()
	if tx, e := pendingTransaction(root); e != nil {
		return s, e
	} else if tx != "" {
		return s, fmt.Errorf("发现未完成事务，请先恢复：%s", tx)
	}
	// Do not trust a UI plan after package files or the installed files changed.
	fresh, e := NewPlan(ctx, p.request)
	if e != nil {
		return s, e
	}
	if fresh.BaselineDigest != p.BaselineDigest || fresh.TargetDigest != p.TargetDigest || !reflect.DeepEqual(p.snapshot, fresh.snapshot) || !reflect.DeepEqual(p.Actions, fresh.Actions) {
		return s, fmt.Errorf("预览后文件或升级包发生变化，请重新预览")
	}
	var bytes int64
	for _, en := range p.snapshot {
		bytes += en.Size
	}
	for _, f := range p.targetPackage.Manifest.Files {
		bytes += f.Size
	}
	if e = platform.CheckStorage(p.Project, root, bytes*3+(16<<20)); e != nil {
		return s, e
	}
	tx := filepath.Join(root, p.ID)
	if e = mkdirDurable(tx); e != nil {
		return s, e
	}
	s.Transaction = tx
	for _, dir := range []string{"original", "candidate", "retired", "recovery-kept", "journal"} {
		if e = mkdirDurable(filepath.Join(tx, dir)); e != nil {
			return s, e
		}
	}
	s.State = "backing-up"
	r.notify(s)
	names := []string{}
	for n := range p.snapshot {
		names = append(names, n)
	}
	sort.Strings(names)
	for _, n := range names {
		if e = ctx.Err(); e != nil {
			return s, e
		}
		en := p.snapshot[n]
		dst := filepath.Join(tx, "original", filepath.FromSlash(n))
		if en.Directory {
			if e = secureMkdir(dst); e != nil {
				return s, e
			}
			continue
		}
		if e = secureMkdir(filepath.Dir(dst)); e != nil {
			return s, e
		}
		if e = platform.CopyFile(filepath.Join(p.Project, filepath.FromSlash(n)), dst); e != nil {
			return s, e
		}
		h, e := HashFile(dst)
		if e != nil || h != en.Hash {
			return s, fmt.Errorf("恢复原件校验失败：%s", n)
		}
	}
	if e = r.hit("backup-complete"); e != nil {
		return s, e
	}
	s.State = "staging"
	r.notify(s)
	for n, d := range p.desired {
		if e = ctx.Err(); e != nil {
			return s, e
		}
		dst := filepath.Join(tx, "candidate", filepath.FromSlash(n))
		if e = secureMkdir(filepath.Dir(dst)); e != nil {
			return s, e
		}
		if d.Bytes != nil {
			e = writeNew(dst, d.Bytes, os.FileMode(d.Mode))
		} else if d.Package {
			// Payload commits contain bytes and declared mode, never publisher
			// ownership or other publisher metadata. Local originals remain faithful copies.
			e = platform.CopyPayloadFile(d.Source, dst, d.Mode)
		} else {
			e = platform.CopyFile(d.Source, dst)
		}
		if e != nil {
			return s, e
		}
		if local, exists := p.snapshot[n]; exists && !local.Directory {
			original := filepath.Join(tx, "original", filepath.FromSlash(n))
			if e = platform.PreserveLocalOwnership(original, dst); e != nil {
				return s, e
			}
		}
		if e = chmodSynced(dst, os.FileMode(d.Mode)); e != nil {
			return s, e
		}
		h, e := HashFile(dst)
		if e != nil || h != d.Hash {
			return s, fmt.Errorf("候选文件校验失败：%s", n)
		}
	}
	if e = validateCandidate(tx, p); e != nil {
		return s, e
	}
	if e = r.hit("candidate-complete"); e != nil {
		return s, e
	}
	now, e := Inventory(ctx, p.Project, p.scopes)
	if e != nil {
		return s, e
	}
	if !reflect.DeepEqual(now, p.snapshot) {
		return s, fmt.Errorf("备份期间安装发生变化，原安装未切换")
	}
	if e = platform.CheckWriters(p.Project); e != nil {
		return s, e
	}
	identity, e := platform.ProjectIdentity(p.Project)
	if e != nil {
		return s, e
	}
	currentRoot, e := transactionRoot(p.Project)
	if e != nil || currentRoot != root {
		return s, fmt.Errorf("备份期间项目身份变化，原安装未切换")
	}
	rec := Record{
		Schema: recordSchema, ID: p.ID, Project: p.Project, ProjectIdentity: identity,
		UpdaterVersion: Version, FromVersion: p.FromVersion, ToVersion: p.ToVersion,
		FromDataSchema: p.baselinePackage.Manifest.DataSchema, ToDataSchema: p.targetPackage.Manifest.DataSchema,
		BaselineDigest: p.BaselineDigest, TargetDigest: p.TargetDigest,
		BaselineBuildID: p.baselinePackage.Manifest.BuildID, TargetBuildID: p.targetPackage.Manifest.BuildID,
		Scopes: p.scopes, Before: p.snapshot, After: map[string]Entry{}, Actions: p.Actions,
		Created: time.Now().UTC().Format(time.RFC3339Nano),
	}
	for n, d := range p.desired {
		info, e := os.Stat(filepath.Join(tx, "candidate", filepath.FromSlash(n)))
		if e != nil {
			return s, e
		}
		rec.After[n] = Entry{Hash: d.Hash, Mode: d.Mode, Size: info.Size()}
	}
	data, e := encodeRecord(rec, maxRecordBytes)
	if e != nil {
		return s, e
	}
	recordPath := filepath.Join(tx, "record.json")
	// A publish can succeed before its directory sync reports an error. Once the
	// public record exists, recovery owns this transaction even on that error path.
	defer func() {
		if err != nil {
			if _, statErr := os.Lstat(recordPath); statErr == nil {
				s.State = "recovery-required"
				s.Error = err.Error()
				r.notify(s)
			}
		}
	}()
	if e = publishNew(recordPath, data, func(stage string) error { return r.hit("record-" + stage) }); e != nil {
		return s, e
	}
	journal := transactionJournal{tx: tx, total: len(rec.Actions), checkpoint: r.Failpoint}
	if e = journal.append("switching", 0); e != nil {
		return s, e
	}
	s.State = "switching"
	r.notify(s)
	for i, action := range p.Actions {
		if e = ctx.Err(); e != nil {
			return s, e
		}
		if e = r.hit(fmt.Sprintf("before-action-%d", i)); e != nil {
			return s, e
		}
		live, e := platform.SafePath(p.Project, action.Path)
		if e != nil {
			return s, e
		}
		if e = matchLive(live, rec.Before[action.Path], rec.Before[action.Path].Hash != ""); e != nil {
			return s, fmt.Errorf("切换前文件变化：%s", action.Path)
		}
		if action.Before != "" {
			retired := filepath.Join(tx, "retired", filepath.FromSlash(action.Path))
			if e = secureMkdir(filepath.Dir(retired)); e != nil {
				return s, e
			}
			if e = r.hit(fmt.Sprintf("before-retire-%d", i)); e != nil {
				return s, e
			}
			if e = moveNew(live, retired); e != nil {
				return s, e
			}
			if e = matchLive(retired, rec.Before[action.Path], true); e != nil {
				return s, r.retainedConflict(tx, "apply-retire", i, retired)
			}
		}
		if e = r.hit(fmt.Sprintf("after-retire-%d", i)); e != nil {
			return s, e
		}
		if action.After != "" {
			if e = secureMkdir(filepath.Dir(live)); e != nil {
				return s, e
			}
			if e = moveNew(filepath.Join(tx, "candidate", filepath.FromSlash(action.Path)), live); e != nil {
				return s, e
			}
		}
		if e = r.hit(fmt.Sprintf("after-install-%d", i)); e != nil {
			return s, e
		}
		if e = journal.append("switching", i+1); e != nil {
			return s, e
		}
		s.Step = i + 1
		r.notify(s)
	}
	if e = checkRetained(tx, rec); e != nil {
		return s, e
	}
	if e = validateInstalled(ctx, rec); e != nil {
		return s, e
	}
	if e = r.hit("before-complete"); e != nil {
		return s, e
	}
	if e = journal.append("complete", len(p.Actions)); e != nil {
		return s, e
	}
	s.State = "complete"
	r.notify(s)
	return s, nil
}

func moveNew(from, to string) error {
	return platform.MoveNew(from, to)
}

func chmodSynced(path string, mode os.FileMode) error {
	f, e := os.Open(path)
	if e != nil {
		return e
	}
	defer f.Close()
	if e = f.Chmod(mode); e != nil {
		return e
	}
	if e = f.Sync(); e != nil {
		return e
	}
	return f.Close()
}
func matchLive(p string, en Entry, exists bool) error {
	st, e := os.Lstat(p)
	if !exists {
		if os.IsNotExist(e) {
			return nil
		}
		return fmt.Errorf("预期不存在的路径已出现")
	}
	if e != nil {
		return e
	}
	if !st.Mode().IsRegular() || uint32(st.Mode().Perm()) != en.Mode {
		return fmt.Errorf("文件类型或权限变化")
	}
	h, e := HashFile(p)
	if e != nil {
		return e
	}
	if h != en.Hash {
		return fmt.Errorf("文件内容变化")
	}
	return nil
}

func recoveryEntry(path string) (Entry, bool, error) {
	st, e := os.Lstat(path)
	if os.IsNotExist(e) {
		return Entry{}, false, nil
	}
	if e != nil {
		return Entry{}, false, e
	}
	if !st.Mode().IsRegular() {
		return Entry{}, false, fmt.Errorf("恢复路径出现非文件对象")
	}
	if e = platform.CheckTree(path); e != nil {
		return Entry{}, false, e
	}
	h, e := HashFile(path)
	if e != nil {
		return Entry{}, false, e
	}
	return Entry{Hash: h, Mode: uint32(st.Mode().Perm()), Size: st.Size()}, true, nil
}

func retainedConflictError(path string) error {
	return fmt.Errorf("保留文件含未确认的新写入或权限变化；自动恢复已停止，请手动核对并取回：%s", path)
}

func (r Runner) retainedConflict(tx, phase string, action int, path string) error {
	// This receipt contains only control state, never file contents or metadata.
	data, e := json.Marshal(struct {
		Schema int    `json:"schema"`
		Phase  string `json:"phase"`
		Action int    `json:"action"`
	}{1, phase, action})
	if e == nil {
		e = publishNew(filepath.Join(tx, "conflict.json"), append(data, '\n'), func(stage string) error {
			return r.hit("conflict-" + stage)
		})
	}
	if os.IsExist(e) {
		e = nil
	}
	return errors.Join(retainedConflictError(path), e)
}

func checkRetained(tx string, rec Record) error {
	receipt, e := platform.SafePath(tx, "conflict.json")
	if e != nil {
		return e
	}
	if _, e = os.Lstat(receipt); e == nil {
		return retainedConflictError(tx)
	} else if !os.IsNotExist(e) {
		return e
	}
	for _, action := range rec.Actions {
		path, e := platform.SafePath(tx, "retired/"+action.Path)
		if e != nil {
			return e
		}
		if _, e = os.Lstat(path); os.IsNotExist(e) {
			continue
		} else if e != nil {
			return e
		}
		if action.Before == "" || matchLive(path, rec.Before[action.Path], true) != nil {
			return retainedConflictError(path)
		}
	}
	kept, e := platform.SafePath(tx, "recovery-kept")
	if e != nil {
		return e
	}
	expected := make(map[string]Entry)
	for _, action := range rec.Actions {
		if action.After != "" {
			expected[action.Path] = rec.After[action.Path]
		}
	}
	// Scan independently of the receipt: a crash or ENOSPC can prevent publishing
	// it after a live file has moved. Only actual moved live files belong here.
	return filepath.WalkDir(kept, func(path string, d os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if path == kept {
			if !d.IsDir() {
				return retainedConflictError(path)
			}
			return nil
		}
		rel, e := filepath.Rel(kept, path)
		if e != nil {
			return e
		}
		parts := strings.SplitN(filepath.ToSlash(rel), "/", 2)
		if !recordID(parts[0]) {
			return retainedConflictError(path)
		}
		if d.IsDir() {
			if len(parts) == 1 {
				return nil
			}
			for name := range expected {
				if strings.HasPrefix(name, parts[1]+"/") {
					return nil
				}
			}
			return retainedConflictError(path)
		}
		if len(parts) != 2 {
			return retainedConflictError(path)
		}
		en, ok := expected[parts[1]]
		if !ok {
			return retainedConflictError(path)
		}
		if _, e = platform.SafePath(kept, filepath.ToSlash(rel)); e != nil {
			return retainedConflictError(path)
		}
		if e = matchLive(path, en, true); e != nil {
			return retainedConflictError(path)
		}
		return nil
	})
}
func validateCandidate(tx string, p *Plan) error {
	for n, d := range p.desired {
		if strings.HasSuffix(n, ".json") && (n == ".claude/settings.json" || n == ".mcp.json" || n == ".claude/manifest.json") {
			b, e := os.ReadFile(filepath.Join(tx, "candidate", filepath.FromSlash(n)))
			if e != nil {
				return e
			}
			var v any
			if e = DecodeJSON(b, &v); e != nil {
				return fmt.Errorf("候选配置不合法：%s", n)
			}
		}
		// Required .claude/ai-teams Hook references are resolved without executing scripts.
		if n == ".claude/settings.json" {
			b, e := os.ReadFile(filepath.Join(tx, "candidate", filepath.FromSlash(n)))
			if e != nil {
				return e
			}
			var v any
			if e = DecodeJSON(b, &v); e != nil {
				return e
			}
			if e = checkHookReferences(v, p.desired); e != nil {
				return e
			}
		}
		if _, ok := p.snapshot[n]; ok && p.snapshot[n].Hash == d.Hash {
			continue
		}
	}
	return nil
}
func checkHookReferences(v any, files map[string]desiredFile) error {
	switch x := v.(type) {
	case map[string]any:
		for _, v := range x {
			if e := checkHookReferences(v, files); e != nil {
				return e
			}
		}
	case []any:
		for _, v := range x {
			if e := checkHookReferences(v, files); e != nil {
				return e
			}
		}
	case string:
		// exec-form args have an exact path; shell command strings require runtime checks.
		s := strings.ReplaceAll(x, "${CLAUDE_PROJECT_DIR}/", "")
		if strings.HasPrefix(s, harness+"/") && !strings.ContainsAny(s, " \t\n\"'") && (strings.HasSuffix(s, ".mjs") || strings.HasSuffix(s, ".sh") || strings.HasSuffix(s, ".ps1")) {
			if _, ok := files[s]; !ok {
				return fmt.Errorf("Hook 引用目标不存在：%s", s)
			}
		}
	}
	return nil
}
func validateInstalled(ctx context.Context, rec Record) error {
	inv, e := Inventory(ctx, rec.Project, rec.Scopes)
	if e != nil {
		return e
	}
	for n, en := range rec.After {
		if actual, ok := inv[n]; !ok || actual != en {
			return fmt.Errorf("切换后内容不匹配：%s", n)
		}
	}
	for n, en := range inv {
		if en.Directory {
			continue
		}
		if _, ok := rec.After[n]; !ok {
			return fmt.Errorf("切换期间出现额外写入：%s", n)
		}
	}
	return nil
}

func recordID(s string) bool {
	b, e := hex.DecodeString(s)
	return e == nil && len(b) == 16 && strings.ToLower(s) == s
}

func allowedScope(path string) bool {
	return path == harness || path == ".claude/agents" || path == ".claude/rules" || AllowedPath(path)
}

func validateRecord(rec Record) error {
	invalid := func() error { return fmt.Errorf("事务记录结构或内容不一致") }
	if rec.Schema != recordSchema || !recordID(rec.ID) || rec.ProjectIdentity == "" || len(rec.ProjectIdentity) > 512 ||
		!filepath.IsAbs(rec.Project) || filepath.Clean(rec.Project) != rec.Project ||
		rec.FromDataSchema < 1 || rec.ToDataSchema < rec.FromDataSchema ||
		rec.Before == nil || rec.After == nil || len(rec.Actions) == 0 || len(rec.Scopes) == 0 {
		return invalid()
	}
	if cmp, e := CompareVersions(Version, rec.UpdaterVersion); e != nil || cmp < 0 {
		return invalid()
	}
	if cmp, e := CompareVersions(rec.ToVersion, rec.FromVersion); e != nil || cmp <= 0 {
		return invalid()
	}
	if _, e := time.Parse(time.RFC3339Nano, rec.Created); e != nil {
		return invalid()
	}
	for _, h := range []string{rec.BaselineDigest, rec.TargetDigest, rec.BaselineBuildID, rec.TargetBuildID, rec.Checksum} {
		if !hashRE.MatchString(h) {
			return invalid()
		}
	}
	checksum, e := recordChecksum(rec)
	if e != nil || checksum != rec.Checksum {
		return fmt.Errorf("事务记录校验和不匹配")
	}
	scopes := map[string]bool{}
	for _, scope := range rec.Scopes {
		if !allowedScope(scope) || scopes[strings.ToLower(scope)] {
			return invalid()
		}
		scopes[strings.ToLower(scope)] = true
	}
	covered := func(path string) bool {
		for _, scope := range rec.Scopes {
			if path == scope || strings.HasPrefix(path, scope+"/") {
				return true
			}
		}
		return false
	}
	for _, inventory := range []map[string]Entry{rec.Before, rec.After} {
		fold := map[string]bool{}
		var total int64
		for path, en := range inventory {
			if (!AllowedPath(path) && !(en.Directory && allowedScope(path))) || !covered(path) ||
				fold[strings.ToLower(path)] || en.Mode > 0777 || en.Size < 0 || en.Size > 512<<20 {
				return invalid()
			}
			fold[strings.ToLower(path)] = true
			if en.Directory {
				if en.Hash != "" || en.Size != 0 {
					return invalid()
				}
			} else if !hashRE.MatchString(en.Hash) {
				return invalid()
			}
			total += en.Size
			if total > 2<<30 {
				return invalid()
			}
			for parent := filepath.ToSlash(filepath.Dir(path)); parent != "."; parent = filepath.ToSlash(filepath.Dir(parent)) {
				if p, exists := inventory[parent]; exists && !p.Directory {
					return invalid()
				}
			}
		}
	}
	for _, en := range rec.After {
		if en.Directory {
			return invalid()
		}
	}
	actions := map[string]bool{}
	for _, a := range rec.Actions {
		if !AllowedPath(a.Path) || !covered(a.Path) || actions[a.Path] {
			return invalid()
		}
		actions[a.Path] = true
		before, had := rec.Before[a.Path]
		after, has := rec.After[a.Path]
		if before.Directory || after.Directory || (!had && !has) || before.Hash != a.Before || after.Hash != a.After || (had && has && before == after) {
			return invalid()
		}
		kind := "replace"
		if !had {
			kind = "add"
		} else if !has {
			kind = "retire"
		}
		if a.Kind != kind {
			return invalid()
		}
	}
	// Every changed regular file must have exactly one action; no extra action may
	// silently claim an unchanged file or a directory from an inventory snapshot.
	for path, before := range rec.Before {
		if before.Directory {
			if _, has := rec.After[path]; has {
				return invalid()
			}
			continue
		}
		after, has := rec.After[path]
		if (!has || before != after) != actions[path] {
			return invalid()
		}
	}
	for path := range rec.After {
		if _, had := rec.Before[path]; !had && !actions[path] {
			return invalid()
		}
	}
	versionPath := harness + "/VERSION"
	before, had := rec.Before[versionPath]
	after, has := rec.After[versionPath]
	if !had || !has || before.Directory || after.Directory || before.Hash == after.Hash || rec.Actions[len(rec.Actions)-1].Path != versionPath {
		return invalid()
	}
	return nil
}

func readBounded(root, rel string, limit int64) ([]byte, error) {
	path, e := platform.SafePath(root, rel)
	if e != nil {
		return nil, e
	}
	st, e := os.Lstat(path)
	if e != nil {
		return nil, e
	}
	if !st.Mode().IsRegular() || st.Size() > limit {
		return nil, fmt.Errorf("事务文件类型无效或过大")
	}
	f, e := os.Open(path)
	if e != nil {
		return nil, e
	}
	defer f.Close()
	actual, e := f.Stat()
	if e != nil || !os.SameFile(st, actual) {
		return nil, fmt.Errorf("事务文件读取期间发生变化")
	}
	b, e := io.ReadAll(io.LimitReader(f, limit+1))
	if e != nil {
		return nil, e
	}
	if int64(len(b)) > limit {
		return nil, fmt.Errorf("事务文件过大")
	}
	return b, nil
}

func decodeTransactionJSON(data []byte, v any) error {
	if e := DecodeStrictJSON(data, v); e != nil {
		return fmt.Errorf("事务包含未知或无效字段")
	}
	return nil
}

func loadRecord(tx string) (Record, error) {
	var rec Record
	p, e := platform.ValidateProject(tx)
	if e != nil {
		return rec, e
	}
	if p != filepath.Clean(tx) {
		return rec, fmt.Errorf("恢复路径必须为规范化绝对路径")
	}
	b, e := readBounded(tx, "record.json", maxRecordBytes)
	if e != nil {
		return rec, e
	}
	if e = decodeTransactionJSON(b, &rec); e != nil {
		return rec, e
	}
	if e = validateRecord(rec); e != nil {
		return rec, e
	}
	project, e := platform.ValidateProject(rec.Project)
	if e != nil {
		return rec, e
	}
	identity, e := platform.ProjectIdentity(project)
	if e != nil {
		return rec, e
	}
	root, e := transactionRoot(project)
	if e != nil {
		return rec, e
	}
	rootInfo, e := os.Stat(root)
	if e != nil {
		return rec, e
	}
	txParent, e := os.Stat(filepath.Dir(tx))
	if e != nil {
		return rec, e
	}
	if rec.ID != filepath.Base(tx) || rec.ProjectIdentity != identity || !os.SameFile(rootInfo, txParent) {
		return rec, fmt.Errorf("事务身份或项目路径不匹配")
	}
	paths := make(map[string]bool)
	for _, scope := range rec.Scopes {
		paths[scope] = true
	}
	for _, inventory := range []map[string]Entry{rec.Before, rec.After} {
		for path := range inventory {
			paths[path] = true
		}
	}
	for _, action := range rec.Actions {
		paths[action.Path] = true
	}
	for path := range paths {
		if _, e = platform.SafePath(project, path); e != nil {
			return rec, e
		}
	}
	for _, dir := range []string{"original", "candidate", "retired", "recovery-kept", "journal"} {
		path, e := platform.SafePath(tx, dir)
		if e != nil {
			return rec, e
		}
		st, e := os.Lstat(path)
		if e != nil || !st.IsDir() {
			return rec, fmt.Errorf("事务材料目录缺失或类型无效")
		}
	}
	return rec, nil
}

type transactionJournal struct {
	tx         string
	total      int
	last       event
	checkpoint func(string) error
}

func validTransition(previous, next event, total int) bool {
	if next.Sequence == 0 || next.Sequence != previous.Sequence+1 || next.Step < 0 || next.Step > total {
		return false
	}
	if _, e := time.Parse(time.RFC3339Nano, next.Time); e != nil {
		return false
	}
	switch previous.State {
	case "":
		return next.Step == 0 && (next.State == "switching" || next.State == "recovering")
	case "switching":
		switch next.State {
		case "switching":
			return next.Step == previous.Step+1
		case "complete":
			return previous.Step == total && next.Step == total
		case "recovering":
			return next.Step == 0
		}
	case "recovering":
		if next.State == "recovering" {
			// A repeated recovery starts a new idempotent reverse pass at zero.
			return next.Step == 0 || next.Step == previous.Step+1
		}
		return next.State == "restored" && previous.Step == total && next.Step == total
	}
	return false // Terminal states never transition, including to themselves.
}

func (j *transactionJournal) append(state string, step int) error {
	return j.appendAt(state, step, time.Now())
}

func (j *transactionJournal) appendAt(state string, step int, now time.Time) error {
	ev := event{Sequence: j.last.Sequence + 1, State: state, Step: step, Time: now.UTC().Format(time.RFC3339Nano)}
	if !validTransition(j.last, ev, j.total) {
		return fmt.Errorf("拒绝非法事务状态迁移")
	}
	data, e := json.Marshal(ev)
	if e != nil {
		return e
	}
	name := fmt.Sprintf("%020d.json", ev.Sequence)
	e = publishNew(filepath.Join(j.tx, "journal", name), append(data, '\n'), func(stage string) error {
		if j.checkpoint != nil {
			return j.checkpoint("journal-" + stage)
		}
		return nil
	})
	if e != nil {
		return e
	}
	j.last = ev
	return nil
}

func readJournal(tx string, total int) (transactionJournal, error) {
	j := transactionJournal{tx: tx, total: total}
	root, e := platform.SafePath(tx, "journal")
	if e != nil {
		return j, e
	}
	entries, e := os.ReadDir(root)
	if e != nil {
		return j, e
	}
	for _, entry := range entries {
		name := entry.Name()
		if strings.HasPrefix(name, ".tmp-") && recordID(strings.TrimPrefix(name, ".tmp-")) {
			continue
		}
		if entry.IsDir() || len(name) != 25 || !strings.HasSuffix(name, ".json") {
			return j, fmt.Errorf("事务日志文件名无效")
		}
		sequence, e := strconv.ParseUint(name[:20], 10, 64)
		if e != nil || name != fmt.Sprintf("%020d.json", sequence) {
			return j, fmt.Errorf("事务日志序号无效")
		}
		b, e := readBounded(root, name, maxEventBytes)
		if e != nil {
			return j, e
		}
		var ev event
		if e = decodeTransactionJSON(b, &ev); e != nil {
			return j, e
		}
		if sequence != ev.Sequence || !validTransition(j.last, ev, total) {
			return j, fmt.Errorf("事务日志序号或状态迁移无效")
		}
		j.last = ev
	}
	return j, nil
}

func (j transactionJournal) status() Status {
	s := Status{State: "recovery-required", Transaction: j.tx, Total: j.total, Step: j.last.Step}
	if j.last.State == "complete" || j.last.State == "restored" {
		s.State = j.last.State
	}
	return s
}

func TransactionStatus(tx string) (Status, error) {
	rec, e := loadRecord(tx)
	if e != nil {
		return Status{State: "recovery-required", Transaction: tx}, e
	}
	j, e := readJournal(tx, len(rec.Actions))
	return j.status(), e
}

func (r Runner) Recover(ctx context.Context, tx string, ack bool) (Status, error) {
	if !ack {
		return Status{}, fmt.Errorf("恢复前需要停止所有项目写入者")
	}
	tx, e := filepath.Abs(tx)
	if e != nil {
		return Status{}, e
	}
	rec, e := loadRecord(tx)
	if e != nil {
		return Status{}, e
	}
	if e = platform.CheckWriters(rec.Project); e != nil {
		return Status{}, e
	}
	release, e := platform.Lock(filepath.Dir(tx))
	if e != nil {
		return Status{}, e
	}
	defer release()
	rec, e = loadRecord(tx)
	if e != nil {
		return Status{State: "recovery-required", Transaction: tx}, e
	}
	journal, e := readJournal(tx, len(rec.Actions))
	status := journal.status()
	if e != nil {
		return status, e
	}
	journal.checkpoint = r.Failpoint
	if status.State == "restored" {
		return status, nil
	}
	if status.State == "complete" {
		return status, fmt.Errorf("已完成升级不提供历史快照降级；需保护升级后新增数据")
	}
	if e = checkRetained(tx, rec); e != nil {
		return status, e
	}
	status.State = "recovering"
	r.notify(status)
	// Preflight every affected object before touching any live file.
	for _, a := range rec.Actions {
		if e = ctx.Err(); e != nil {
			return status, e
		}
		live, e := platform.SafePath(rec.Project, a.Path)
		if e != nil {
			return status, e
		}
		if a.Before != "" {
			original, e := platform.SafePath(filepath.Join(tx, "original"), a.Path)
			if e != nil {
				return status, e
			}
			if e = matchLive(original, rec.Before[a.Path], true); e != nil {
				return status, fmt.Errorf("原件缺失或受损，停止恢复：%s", a.Path)
			}
		}
		current, exists, e := recoveryEntry(live)
		if e != nil {
			return status, e
		}
		if exists && current != rec.Before[a.Path] && current != rec.After[a.Path] {
			return status, fmt.Errorf("检测到升级后内容或权限变化，原地保留并停止恢复：%s", a.Path)
		}
	}
	if e = journal.append("recovering", 0); e != nil {
		return status, e
	}
	status.Step = 0
	for i := len(rec.Actions) - 1; i >= 0; i-- {
		if e = ctx.Err(); e != nil {
			return status, e
		}
		a := rec.Actions[i]
		live, e := platform.SafePath(rec.Project, a.Path)
		if e != nil {
			return status, e
		}
		current, exists, e := recoveryEntry(live)
		if e != nil {
			return status, e
		}
		if exists && current != rec.Before[a.Path] {
			if current != rec.After[a.Path] {
				return status, fmt.Errorf("恢复期间文件变化：%s", a.Path)
			}
			kept := filepath.Join(tx, "recovery-kept", ID(), filepath.FromSlash(a.Path))
			if e = secureMkdir(filepath.Dir(kept)); e != nil {
				return status, e
			}
			if e = r.hit(fmt.Sprintf("before-recovery-retire-%d", i)); e != nil {
				return status, e
			}
			if e = moveNew(live, kept); e != nil {
				return status, e
			}
			if e = matchLive(kept, rec.After[a.Path], true); e != nil {
				return status, r.retainedConflict(tx, "recover-retire", i, kept)
			}
			exists = false
		}
		if e = r.hit(fmt.Sprintf("recovery-retired-%d", i)); e != nil {
			return status, e
		}
		if a.Before != "" && !exists {
			if e = secureMkdir(filepath.Dir(live)); e != nil {
				return status, e
			}
			// Unpublished copies may be partial after a crash. Keep them apart from
			// recovery-kept, whose contents are all actual files moved out of live.
			prepared := filepath.Join(tx, "candidate", ".recovery-"+ID()+".prepared")
			if e = platform.CopyFile(filepath.Join(tx, "original", filepath.FromSlash(a.Path)), prepared); e != nil {
				return status, e
			}
			if e = r.hit(fmt.Sprintf("recovery-copy-prepared-%d", i)); e != nil {
				return status, e
			}
			if e = matchLive(prepared, rec.Before[a.Path], true); e != nil {
				return status, fmt.Errorf("恢复副本校验失败，停止切换：%s", a.Path)
			}
			if e = moveNew(prepared, live); e != nil {
				return status, e
			}
		}
		if e = r.hit(fmt.Sprintf("recovery-installed-%d", i)); e != nil {
			return status, e
		}
		if e = journal.append("recovering", len(rec.Actions)-i); e != nil {
			return status, e
		}
		status.Step = len(rec.Actions) - i
		r.notify(status)
	}
	for _, a := range rec.Actions {
		live, e := platform.SafePath(rec.Project, a.Path)
		if e != nil {
			return status, e
		}
		if e = matchLive(live, rec.Before[a.Path], a.Before != ""); e != nil {
			return status, e
		}
	}
	if e = checkRetained(tx, rec); e != nil {
		return status, e
	}
	if e = journal.append("restored", len(rec.Actions)); e != nil {
		return status, e
	}
	status.State = "restored"
	status.Error = ""
	r.notify(status)
	return status, nil
}

var ErrInterrupted = errors.New("测试注入的执行中断")
