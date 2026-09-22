package engine

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strings"

	"ccradt/updater/internal/platform"
)

type PlanRequest struct {
	Project          string `json:"project"`
	Baseline         string `json:"baseline"`
	Package          string `json:"package"`
	BaselineManifest string `json:"baselineManifest,omitempty"`
	PackageManifest  string `json:"packageManifest,omitempty"`
}
type Conflict struct {
	Path   string `json:"path"`
	Reason string `json:"reason"`
}
type Action struct {
	Path   string `json:"path"`
	Kind   string `json:"kind"`
	Reason string `json:"reason"`
	Before string `json:"before,omitempty"`
	After  string `json:"after,omitempty"`
}
type Plan struct {
	ID              string     `json:"id"`
	Project         string     `json:"project"`
	Baseline        string     `json:"baseline"`
	Package         string     `json:"package"`
	FromVersion     string     `json:"fromVersion"`
	ToVersion       string     `json:"toVersion"`
	BaselineDigest  string     `json:"baselineDigest"`
	TargetDigest    string     `json:"targetDigest"`
	Actions         []Action   `json:"actions"`
	Conflicts       []Conflict `json:"conflicts"`
	Preserved       int        `json:"preserved"`
	MigrationPath   []string   `json:"migrationPath"`
	Warnings        []string   `json:"warnings"`
	Ready           bool       `json:"ready"`
	request         PlanRequest
	snapshot        map[string]Entry
	desired         map[string]desiredFile
	scopes          []string
	baselinePackage *Package
	targetPackage   *Package
}
type Entry struct {
	Hash      string `json:"hash"`
	Mode      uint32 `json:"mode"`
	Size      int64  `json:"size"`
	Directory bool   `json:"directory,omitempty"`
}
type desiredFile struct {
	Source  string
	Bytes   []byte
	Mode    uint32
	Hash    string
	Package bool
}

func ID() string {
	b := make([]byte, 16)
	if _, e := rand.Read(b); e != nil {
		panic(e)
	}
	return hex.EncodeToString(b)
}

func scopesFor(a, b *Package) []string {
	s := map[string]bool{harness: true, ".claude/agents": true, ".claude/rules": true}
	for _, p := range []*Package{a, b} {
		for path := range p.ByPath {
			if !strings.HasPrefix(path, harness+"/") && !strings.HasPrefix(path, ".claude/agents/") && !strings.HasPrefix(path, ".claude/rules/") {
				s[path] = true
			}
		}
	}
	out := []string{}
	for p := range s {
		out = append(out, p)
	}
	sort.Strings(out)
	return out
}

func Inventory(ctx context.Context, root string, scopes []string) (map[string]Entry, error) {
	result := map[string]Entry{}
	fold := map[string]string{}
	var total int64
	for _, scope := range scopes {
		p, e := platform.SafePath(root, scope)
		if e != nil {
			return nil, e
		}
		if _, e = os.Lstat(p); os.IsNotExist(e) {
			continue
		} else if e != nil {
			return nil, e
		}
		if e = platform.CheckTree(p); e != nil {
			return nil, e
		}
		e = filepath.WalkDir(p, func(q string, d fs.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if err = ctx.Err(); err != nil {
				return err
			}
			rel, err := filepath.Rel(root, q)
			if err != nil {
				return err
			}
			rel = filepath.ToSlash(rel)
			if protectedPath(rel) {
				if d.IsDir() {
					return filepath.SkipDir
				}
				return nil
			}
			if previous, ok := fold[strings.ToLower(rel)]; ok && previous != rel {
				return fmt.Errorf("大小写冲突：%s", rel)
			}
			fold[strings.ToLower(rel)] = rel
			st, err := os.Lstat(q)
			if err != nil {
				return err
			}
			en := Entry{Mode: uint32(st.Mode().Perm()), Size: st.Size(), Directory: d.IsDir()}
			if d.IsDir() {
				en.Size = 0
			} else {
				if !st.Mode().IsRegular() {
					return fmt.Errorf("不支持特殊文件：%s", rel)
				}
				total += st.Size()
				if st.Size() > 512<<20 || total > 2<<30 {
					return fmt.Errorf("安装数据超过首版支持上限")
				}
				en.Hash, err = HashFile(q)
				if err != nil {
					return err
				}
			}
			result[rel] = en
			if len(result) > 100000 {
				return fmt.Errorf("安装文件数量超过首版支持上限")
			}
			return nil
		})
		if e != nil {
			return nil, e
		}
	}
	return result, nil
}

func migrationRoute(from, to int, all []Migration) ([]Migration, error) {
	if from == to {
		return nil, nil
	}
	if from > to {
		return nil, fmt.Errorf("首版不支持数据格式降级")
	}
	seenIDs := map[string]bool{}
	for _, m := range all {
		if m.ID == "" || seenIDs[m.ID] || m.From < 1 || m.To <= m.From {
			return nil, fmt.Errorf("无效迁移图")
		}
		seenIDs[m.ID] = true
	}
	type route struct {
		schema int
		steps  []Migration
	}
	queue := []route{{schema: from}}
	seen := map[int]bool{from: true}
	for len(queue) > 0 {
		r := queue[0]
		queue = queue[1:]
		for _, m := range all {
			if m.From != r.schema || seen[m.To] {
				continue
			}
			steps := append(append([]Migration(nil), r.steps...), m)
			if m.To == to {
				return steps, nil
			}
			seen[m.To] = true
			queue = append(queue, route{m.To, steps})
		}
	}
	return nil, fmt.Errorf("缺少已声明的数据迁移路径：%d → %d", from, to)
}

func NewPlan(ctx context.Context, r PlanRequest) (*Plan, error) {
	project, e := platform.ValidateProject(r.Project)
	if e != nil {
		return nil, e
	}
	if tx, err := PendingTransaction(project); err != nil {
		return nil, err
	} else if tx != "" {
		return nil, fmt.Errorf("发现未完成事务，请先恢复：%s", tx)
	}
	base, e := LoadPackage(r.Baseline, r.BaselineManifest)
	if e != nil {
		return nil, fmt.Errorf("旧包：%w", e)
	}
	next, e := LoadPackage(r.Package, r.PackageManifest)
	if e != nil {
		return nil, fmt.Errorf("新包：%w", e)
	}
	for _, q := range []string{base.Root, next.Root} {
		overlap, err := directoriesOverlap(project, q)
		if err != nil {
			return nil, err
		}
		if overlap {
			return nil, fmt.Errorf("升级包必须位于项目之外")
		}
	}
	cmp, e := CompareVersions(next.Manifest.Version, base.Manifest.Version)
	if e != nil || cmp <= 0 {
		return nil, fmt.Errorf("目标产品版本必须高于基线版本")
	}
	p := &Plan{ID: ID(), Project: project, Baseline: base.Root, Package: next.Root, FromVersion: base.Manifest.Version, ToVersion: next.Manifest.Version, BaselineDigest: base.Digest, TargetDigest: next.Digest, Actions: []Action{}, Conflicts: []Conflict{}, MigrationPath: []string{}, Warnings: []string{"退出目标项目所有 Claude Code、Agent、观察器及编辑写入任务后才能执行。", "首版保守合并：双方修改的文本冲突会阻止整次升级。", "本地清单需要用户核对来源并明确认可指纹；哈希本身不证明官方来源。"}, request: r, desired: map[string]desiredFile{}, baselinePackage: base, targetPackage: next}
	p.scopes = scopesFor(base, next)
	p.snapshot, e = Inventory(ctx, project, p.scopes)
	if e != nil {
		return nil, e
	}
	vf := harness + "/VERSION"
	if en, ok := p.snapshot[vf]; !ok || en.Hash != base.ByPath[vf].SHA256 {
		return nil, fmt.Errorf("当前 VERSION 不匹配所选旧基线")
	}
	for name, en := range p.snapshot {
		if !en.Directory {
			p.desired[name] = desiredFile{Source: filepath.Join(project, filepath.FromSlash(name)), Mode: en.Mode, Hash: en.Hash}
		}
	}
	names := map[string]bool{}
	for n := range base.ByPath {
		names[n] = true
	}
	for n := range next.ByPath {
		names[n] = true
	}
	sorted := []string{}
	for n := range names {
		sorted = append(sorted, n)
	}
	sort.Strings(sorted)
	conflict := func(n, why string) { p.Conflicts = append(p.Conflicts, Conflict{n, why}) }
	for _, n := range sorted {
		old, had := base.ByPath[n]
		fresh, has := next.ByPath[n]
		local, exists := p.snapshot[n]
		if exists && local.Directory {
			conflict(n, "文件位置已有本地目录")
			continue
		}
		if had && old.Policy == "data" && has && fresh.Policy != "data" {
			conflict(n, "不能把已有数据重新认领为系统文件")
			continue
		}
		if had && old.Policy == "data" || has && fresh.Policy == "data" {
			if !exists && !had && has {
				p.desired[n] = fromPackage(next, fresh)
			}
			continue
		}
		if !has {
			if exists && local.Hash == old.SHA256 && local.Mode == effectiveMode(old.Mode) {
				delete(p.desired, n)
			} else if exists {
				conflict(n, "新版停用的官方文件存在本地修改")
			}
			continue
		}
		if !had {
			if !exists {
				p.desired[n] = fromPackage(next, fresh)
			} else if local.Hash != fresh.SHA256 || local.Mode != effectiveMode(fresh.Mode) {
				conflict(n, "新版新增路径已存在本地文件")
			}
			continue
		}
		if !exists {
			if old.SHA256 != fresh.SHA256 || effectiveMode(old.Mode) != effectiveMode(fresh.Mode) {
				conflict(n, "本地已删除的官方文件被新版修改")
			}
			continue
		}
		if local.Hash == fresh.SHA256 && local.Mode == effectiveMode(fresh.Mode) {
			continue
		}
		if local.Hash == old.SHA256 && local.Mode == effectiveMode(old.Mode) {
			p.desired[n] = fromPackage(next, fresh)
			continue
		}
		if old.SHA256 == fresh.SHA256 && effectiveMode(old.Mode) == effectiveMode(fresh.Mode) {
			continue
		}
		if fresh.Policy == "config" && old.Policy == "config" && strings.HasSuffix(n, ".json") {
			mode, ok := mergeMode(effectiveMode(old.Mode), local.Mode, effectiveMode(fresh.Mode))
			if !ok {
				conflict(n, "本地与新版同时修改权限，需要人工确认")
				continue
			}
			b, err := mergeFiles(filepath.Join(base.Root, filepath.FromSlash(n)), filepath.Join(project, filepath.FromSlash(n)), filepath.Join(next.Root, filepath.FromSlash(n)))
			if err == nil {
				p.desired[n] = desiredFile{Bytes: b, Mode: mode, Hash: digest(b)}
				continue
			}
			conflict(n, "双方配置键或数组冲突，或 JSON 无法可靠解析")
			continue
		}
		conflict(n, "本地与新版同时修改，需要人工保留和合并")
	}
	steps, e := migrationRoute(base.Manifest.DataSchema, next.Manifest.DataSchema, next.Manifest.Migrations)
	if e != nil {
		conflict("dataSchema", e.Error())
	}
	for _, m := range steps {
		p.MigrationPath = append(p.MigrationPath, m.ID)
		for _, rename := range m.Renames {
			if !AllowedPath(rename.From) || !AllowedPath(rename.To) || !strings.HasPrefix(rename.From, harness+"/") || !strings.HasPrefix(rename.To, harness+"/") || rename.From == rename.To {
				conflict(m.ID, "迁移路径非法")
				continue
			}
			if f, known := base.ByPath[rename.From]; known && f.Policy != "data" {
				conflict(rename.From, "数据迁移不得改写系统文件")
				continue
			}
			if f, known := next.ByPath[rename.To]; known && f.Policy != "data" {
				conflict(rename.To, "数据迁移目标不得占用系统文件")
				continue
			}
			src, exists := p.desired[rename.From]
			if !exists {
				conflict(rename.From, "迁移源缺失，不能猜测已迁移")
				continue
			}
			if _, exists = p.desired[rename.To]; exists {
				_, localExists := p.snapshot[rename.To]
				seed, seedExists := next.ByPath[rename.To]
				if localExists || !seedExists || seed.Policy != "data" {
					conflict(rename.To, "迁移目标已有文件")
					continue
				}
			}
			p.desired[rename.To] = src
			delete(p.desired, rename.From)
		}
	}
	// A directory/file collision must fail during planning, before any original moves.
	for n := range p.desired {
		for parent := filepath.ToSlash(filepath.Dir(n)); parent != "."; parent = filepath.ToSlash(filepath.Dir(parent)) {
			if en, ok := p.snapshot[parent]; ok && !en.Directory {
				conflict(n, "目标父路径已有文件")
			}
			if _, ok := p.desired[parent]; ok {
				conflict(n, "新版路径同时作为文件和目录")
			}
		}
	}
	p.finalize()
	return p, nil
}

func directoriesOverlap(a, b string) (bool, error) {
	contains := func(root, child string) (bool, error) {
		r, e := os.Stat(root)
		if e != nil {
			return false, e
		}
		for {
			st, e := os.Stat(child)
			if e != nil {
				return false, e
			}
			if os.SameFile(r, st) {
				return true, nil
			}
			parent := filepath.Dir(child)
			if parent == child {
				return false, nil
			}
			child = parent
		}
	}
	if yes, e := contains(a, b); yes || e != nil {
		return yes, e
	}
	return contains(b, a)
}
func mergeMode(old, local, next uint32) (uint32, bool) {
	if local == old || local == next {
		return next, true
	}
	if next == old {
		return local, true
	}
	return 0, false
}
func fromPackage(p *Package, f File) desiredFile {
	return desiredFile{Source: filepath.Join(p.Root, filepath.FromSlash(f.Path)), Mode: effectiveMode(f.Mode), Hash: f.SHA256, Package: true}
}
func (p *Plan) finalize() {
	names := map[string]bool{}
	for n, en := range p.snapshot {
		if !en.Directory {
			names[n] = true
		}
	}
	for n := range p.desired {
		names[n] = true
	}
	for n := range names {
		old, exists := p.snapshot[n]
		next, has := p.desired[n]
		if has && exists && old.Hash == next.Hash && old.Mode == next.Mode {
			p.Preserved++
			continue
		}
		a := Action{Path: n, Before: old.Hash, After: next.Hash}
		switch {
		case !has:
			a.Kind = "retire"
			a.Reason = "从活动目录退出，原件留存在恢复目录"
		case !exists:
			a.Kind = "add"
			a.Reason = "新增文件或显式迁移目标"
		default:
			a.Kind = "replace"
			a.Reason = "受管更新或已合并配置，原件单独保留"
		}
		p.Actions = append(p.Actions, a)
	}
	sort.Slice(p.Actions, func(i, j int) bool {
		if p.Actions[i].Path == harness+"/VERSION" {
			return false
		}
		if p.Actions[j].Path == harness+"/VERSION" {
			return true
		}
		return p.Actions[i].Path < p.Actions[j].Path
	})
	p.Ready = len(p.Conflicts) == 0 && len(p.Actions) > 0
}

func mergeFiles(base, local, next string) ([]byte, error) {
	var objects [3]any
	for i, p := range []string{base, local, next} {
		st, e := os.Stat(p)
		if e != nil {
			return nil, e
		}
		if st.Size() > 4<<20 {
			return nil, fmt.Errorf("配置过大")
		}
		b, e := os.ReadFile(p)
		if e != nil {
			return nil, e
		}
		if e = DecodeJSON(b, &objects[i]); e != nil {
			return nil, e
		}
	}
	result, _, e := mergeValue(objects[0], true, objects[1], true, objects[2], true)
	if e != nil {
		return nil, e
	}
	b, e := json.MarshalIndent(result, "", "  ")
	return append(b, '\n'), e
}
func mergeValue(b any, bok bool, l any, lok bool, n any, nok bool) (any, bool, error) {
	equal := func(a any, aok bool, b any, bok bool) bool { return aok == bok && (!aok || reflect.DeepEqual(a, b)) }
	if equal(l, lok, n, nok) {
		return l, lok, nil
	}
	if equal(l, lok, b, bok) {
		return n, nok, nil
	}
	if equal(n, nok, b, bok) {
		return l, lok, nil
	}
	bm, bo := b.(map[string]any)
	lm, lo := l.(map[string]any)
	nm, no := n.(map[string]any)
	if bo && lo && no {
		out := map[string]any{}
		keys := map[string]bool{}
		for k := range bm {
			keys[k] = true
		}
		for k := range lm {
			keys[k] = true
		}
		for k := range nm {
			keys[k] = true
		}
		for k := range keys {
			bv, bk := bm[k]
			lv, lk := lm[k]
			nv, nk := nm[k]
			v, ok, e := mergeValue(bv, bk, lv, lk, nv, nk)
			if e != nil {
				return nil, false, e
			}
			if ok {
				out[k] = v
			}
		}
		return out, true, nil
	}
	return nil, false, fmt.Errorf("双方修改同一配置值")
}
