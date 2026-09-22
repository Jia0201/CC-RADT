package engine

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"sort"
	"strconv"
	"strings"

	"ccradt/updater/internal/platform"
)

const Version = "0.1.0"
const ManifestName = "upgrade-manifest.json"
const harness = ".claude/ai-teams"

func effectiveMode(mode uint32) uint32 {
	if runtime.GOOS == "windows" {
		if mode&0200 == 0 {
			return 0444
		}
		return 0666
	}
	return mode
}

type File struct {
	Path   string `json:"path"`
	SHA256 string `json:"sha256"`
	Size   int64  `json:"size"`
	Mode   uint32 `json:"mode"`
	Policy string `json:"policy"`
}
type Rename struct {
	From string `json:"from"`
	To   string `json:"to"`
}
type Migration struct {
	ID      string   `json:"id"`
	From    int      `json:"fromSchema"`
	To      int      `json:"toSchema"`
	Renames []Rename `json:"renames"`
}
type Manifest struct {
	SchemaVersion         int         `json:"schemaVersion"`
	Product               string      `json:"product"`
	Version               string      `json:"version"`
	BuildID               string      `json:"buildId"`
	DataSchema            int         `json:"dataSchema"`
	MinimumUpdaterVersion string      `json:"minimumUpdaterVersion"`
	Files                 []File      `json:"files"`
	Migrations            []Migration `json:"migrations,omitempty"`
}
type Package struct {
	Root     string
	Manifest Manifest
	Digest   string
	Raw      []byte
	ByPath   map[string]File
}

var versionRE = regexp.MustCompile(`^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`)
var hashRE = regexp.MustCompile(`^[0-9a-f]{64}$`)
var sensitivePartRE = regexp.MustCompile(`(?i)^(\.env(?:\..*)?|\.?credentials?(?:\..*)?|\.?secrets?(?:\..*)?|id_rsa|id_ed25519|service-account.*\.json|settings\.local\.json)$`)

func CompareVersions(a, b string) (int, error) {
	if !versionRE.MatchString(a) || !versionRE.MatchString(b) {
		return 0, fmt.Errorf("仅支持明确的稳定版本 x.y.z")
	}
	aa, bb := strings.Split(a, "."), strings.Split(b, ".")
	for i := range aa {
		x, e := strconv.ParseUint(aa[i], 10, 32)
		if e != nil {
			return 0, e
		}
		y, e := strconv.ParseUint(bb[i], 10, 32)
		if e != nil {
			return 0, e
		}
		if x < y {
			return -1, nil
		}
		if x > y {
			return 1, nil
		}
	}
	return 0, nil
}

func AllowedPath(p string) bool {
	if p == "" || strings.ContainsAny(p, "\\\x00\r\n\t") || strings.HasPrefix(p, "/") || strings.Contains(p, ":") || filepath.ToSlash(filepath.Clean(p)) != p {
		return false
	}
	for _, s := range strings.Split(p, "/") {
		if s == "." || s == ".." || s == "" || strings.HasSuffix(s, ".") || strings.HasSuffix(s, " ") {
			return false
		}
	}
	if protectedPath(p) {
		return false
	}
	if strings.HasPrefix(p, harness+"/") {
		return true
	}
	if strings.HasPrefix(p, ".claude/agents/") || strings.HasPrefix(p, ".claude/rules/") {
		return strings.Count(p, "/") == 2 && strings.HasSuffix(p, ".md")
	}
	switch p {
	case ".claude/settings.json", ".claude/manifest.json", ".claude/CLAUDE.md", ".claude/settings.local.example.json", ".mcp.json", "CLAUDE.md":
		return true
	}
	return false
}

func protectedPath(p string) bool {
	for _, part := range strings.Split(filepath.ToSlash(p), "/") {
		base := strings.ToLower(part)
		if sensitivePartRE.MatchString(base) {
			return true
		}
		for _, suffix := range []string{".pem", ".key", ".p12", ".pfx", ".jks", ".keystore"} {
			if strings.HasSuffix(base, suffix) {
				return true
			}
		}
	}
	return false
}

// Hash each canonical record, not marshaled maps; Node and Go use identical bytes.
func BuildID(files []File) string {
	sorted := append([]File(nil), files...)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i].Path < sorted[j].Path })
	h := sha256.New()
	for _, f := range sorted {
		fmt.Fprintf(h, "%s\x00%s\x00%d\x00%d\x00%s\n", f.Path, f.SHA256, f.Size, f.Mode, f.Policy)
	}
	return hex.EncodeToString(h.Sum(nil))
}

func HashFile(p string) (string, error) {
	f, e := os.Open(p)
	if e != nil {
		return "", e
	}
	defer f.Close()
	h := sha256.New()
	if _, e = io.Copy(h, f); e != nil {
		return "", e
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}
func digest(b []byte) string { h := sha256.Sum256(b); return hex.EncodeToString(h[:]) }

func readPlainBounded(path string, limit int64) ([]byte, error) {
	before, e := os.Lstat(path)
	if e != nil {
		return nil, e
	}
	if !before.Mode().IsRegular() || before.Size() > limit {
		return nil, fmt.Errorf("文件类型不支持或超过大小上限")
	}
	f, e := os.Open(path)
	if e != nil {
		return nil, e
	}
	defer f.Close()
	after, e := f.Stat()
	if e != nil {
		return nil, e
	}
	if !os.SameFile(before, after) {
		return nil, fmt.Errorf("读取前文件身份变化")
	}
	b, e := io.ReadAll(io.LimitReader(f, limit+1))
	if e != nil {
		return nil, e
	}
	if int64(len(b)) > limit {
		return nil, fmt.Errorf("文件超过大小上限")
	}
	return b, nil
}

// Reject duplicate JSON object keys before standard decoding can discard them.
func DecodeJSON(raw []byte, v any) error {
	d := json.NewDecoder(bytes.NewReader(raw))
	d.UseNumber()
	var walk func() error
	walk = func() error {
		t, e := d.Token()
		if e != nil {
			return e
		}
		switch t {
		case json.Delim('{'):
			seen := map[string]bool{}
			for d.More() {
				k, e := d.Token()
				if e != nil {
					return e
				}
				s, ok := k.(string)
				if !ok || seen[s] {
					return fmt.Errorf("JSON 键重复或无效")
				}
				seen[s] = true
				if e = walk(); e != nil {
					return e
				}
			}
			_, e = d.Token()
			return e
		case json.Delim('['):
			for d.More() {
				if e = walk(); e != nil {
					return e
				}
			}
			_, e = d.Token()
			return e
		}
		return nil
	}
	if e := walk(); e != nil {
		return e
	}
	if _, e := d.Token(); e != io.EOF {
		return fmt.Errorf("JSON 包含尾随内容")
	}
	d = json.NewDecoder(bytes.NewReader(raw))
	d.UseNumber()
	return d.Decode(v)
}

func DecodeStrictJSON(raw []byte, v any) error {
	var validated any
	if e := DecodeJSON(raw, &validated); e != nil {
		return e
	}
	d := json.NewDecoder(bytes.NewReader(raw))
	d.DisallowUnknownFields()
	return d.Decode(v)
}

func LoadPackage(root, manifestPath string) (*Package, error) {
	r, e := platform.ValidateProject(root)
	if e != nil {
		return nil, e
	}
	if manifestPath == "" {
		manifestPath = filepath.Join(r, ManifestName)
	}
	manifestPath, e = filepath.Abs(manifestPath)
	if e != nil {
		return nil, e
	}
	info, e := os.Lstat(manifestPath)
	if e != nil {
		return nil, e
	}
	if !info.Mode().IsRegular() || info.Size() > 8<<20 {
		return nil, fmt.Errorf("无效或过大的升级清单")
	}
	b, e := readPlainBounded(manifestPath, 8<<20)
	if e != nil {
		return nil, e
	}
	var m Manifest
	if e = DecodeStrictJSON(b, &m); e != nil {
		return nil, e
	}
	if m.Product != "CC-RADT" || m.SchemaVersion != 1 || m.DataSchema < 1 || m.MinimumUpdaterVersion == "" {
		return nil, fmt.Errorf("不支持的升级包契约")
	}
	if _, e = CompareVersions(m.Version, m.Version); e != nil {
		return nil, e
	}
	c, e := CompareVersions(Version, m.MinimumUpdaterVersion)
	if e != nil || c < 0 {
		return nil, fmt.Errorf("需要更高版本升级器：%s", m.MinimumUpdaterVersion)
	}
	if len(m.Files) == 0 || len(m.Files) > 100000 {
		return nil, fmt.Errorf("无效的文件清单长度")
	}
	p := &Package{Root: r, Manifest: m, Digest: digest(b), Raw: b, ByPath: map[string]File{}}
	names := map[string]bool{}
	var total int64
	for _, f := range m.Files {
		if !AllowedPath(f.Path) || !hashRE.MatchString(f.SHA256) || f.Size < 0 || f.Size > 512<<20 || f.Mode > 0777 {
			return nil, fmt.Errorf("清单路径或属性无效：%s", f.Path)
		}
		if names[strings.ToLower(f.Path)] {
			return nil, fmt.Errorf("清单路径重复或大小写冲突：%s", f.Path)
		}
		names[strings.ToLower(f.Path)] = true
		switch f.Policy {
		case "system", "data", "config", "generated":
		default:
			return nil, fmt.Errorf("未知文件策略：%s", f.Path)
		}
		q, e := platform.SafePath(r, f.Path)
		if e != nil {
			return nil, e
		}
		info, e := os.Lstat(q)
		if e != nil {
			return nil, e
		}
		if !info.Mode().IsRegular() || info.Size() != f.Size {
			return nil, fmt.Errorf("包内文件大小或类型不匹配：%s", f.Path)
		}
		h, e := HashFile(q)
		if e != nil {
			return nil, e
		}
		if h != f.SHA256 {
			return nil, fmt.Errorf("包内文件哈希不匹配：%s", f.Path)
		}
		total += f.Size
		if total > 2<<30 {
			return nil, fmt.Errorf("安装内容超过首版支持上限")
		}
		p.ByPath[f.Path] = f
	}
	if !hashRE.MatchString(m.BuildID) || BuildID(m.Files) != m.BuildID {
		return nil, fmt.Errorf("构建身份与文件集不一致")
	}
	vf, ok := p.ByPath[harness+"/VERSION"]
	if !ok || vf.Policy != "system" {
		return nil, fmt.Errorf("包缺少受管 VERSION")
	}
	vb, e := os.ReadFile(filepath.Join(r, filepath.FromSlash(vf.Path)))
	if e != nil || strings.TrimSpace(string(vb)) != m.Version {
		return nil, fmt.Errorf("VERSION 与升级清单不一致")
	}
	return p, nil
}
