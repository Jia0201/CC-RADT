// Package release downloads public release assets. An API SHA-256 digest is an
// integrity check, not a publisher signature or an authorization to install.
//
// ZIP member and attachment names are intentionally restricted to portable
// ASCII. Non-ASCII names are rejected, not normalized: this module does NOT
// support all Unicode-named packages. Output filesystem paths may contain
// Unicode, including Chinese; this module never inspects project targets.
//
// Limits: 2 MiB release JSON, 1000 attachments, 256 MiB downloaded ZIP, 128 MiB
// per extracted file, 1 GiB total extracted bytes, 20000 filesystem entries,
// 32 path components, and a 1000:1 compression ratio. ZIP64, multipart archives,
// executable prefixes, links, and special files are rejected. HTTP requests
// have a 90-second timeout; the complete download/extraction has 120 seconds.
package release

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

// The current name is display-only. Independently verified through
// GET https://api.github.com/repositories/1298234222: Jia0201/CC-RADT.
// Pin repository identity; renamed or re-registered slugs must not route traffic.
const repository = "Jia0201/CC-RADT"
const repositoryID = "1298234222"
const apiBase = "https://api.github.com"
const repositoryPath = "/repositories/" + repositoryID + "/releases/"

var stableTag = regexp.MustCompile(`^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`)

type Request struct {
	Version string `json:"version"`
	Asset   string `json:"asset"`
	Output  string `json:"output"`
}

type Result struct {
	// Directory is the extracted package root (a single outer container is
	// removed logically). On failure after creation, it is the retained Output.
	Directory string `json:"directory"`
	Asset     string `json:"asset"` // Exact GitHub attachment name, not a path.
	SHA256    string `json:"sha256"`
}

type Asset struct {
	ID     int64  `json:"id"`
	Name   string `json:"name"`
	Size   int64  `json:"size"`
	Digest string `json:"digest"`
	State  string `json:"state"`
}

type Listing struct {
	Repository string  `json:"repository"`
	Version    string  `json:"version"`
	Assets     []Asset `json:"assets"`
}

// List lists attachments for an explicit stable vX.Y.Z release. Missing digests
// remain visible in this listing, but Download will refuse such attachments.
func List(ctx context.Context, version string) (any, error) {
	c := newClient(nil, apiBase)
	defer c.http.CloseIdleConnections()
	return c.list(ctx, version)
}

// Download only uses GET requests and never reads credentials, project files,
// or executes package contents. Output's parent must exist; Output must not.
// download.zip and partial extraction are retained on failure, without cleanup.
func Download(ctx context.Context, req Request) (Result, error) {
	c := newClient(nil, apiBase)
	defer c.http.CloseIdleConnections()
	return c.download(ctx, req)
}

func validateVersion(version string) error {
	if len(version) > 64 || !stableTag.MatchString(version) {
		return fmt.Errorf("an explicit stable vX.Y.Z tag is required")
	}
	return nil
}

func assetDigest(a Asset) (string, error) {
	if a.ID <= 0 || a.State != "uploaded" {
		return "", fmt.Errorf("asset is not an uploaded release attachment")
	}
	if !strings.HasPrefix(a.Digest, "sha256:") || len(a.Digest) != 71 {
		return "", fmt.Errorf("asset requires a GitHub API sha256 digest; no checksum fallback is permitted")
	}
	digest := a.Digest[len("sha256:"):]
	if _, err := hex.DecodeString(digest); err != nil {
		return "", fmt.Errorf("invalid GitHub API sha256 digest")
	}
	return strings.ToLower(digest), nil
}

func (c *client) download(ctx context.Context, req Request) (result Result, err error) {
	ctx, cancel := context.WithTimeout(ctx, 120*time.Second)
	defer cancel()
	if err = validateVersion(req.Version); err != nil {
		return result, err
	}
	if err = portablePath(req.Asset); err != nil || strings.Contains(req.Asset, "/") || !strings.HasSuffix(req.Asset, ".zip") {
		return result, fmt.Errorf("an exact, portable .zip attachment name is required")
	}
	if err = ctx.Err(); err != nil {
		return result, err
	}
	output, parent, err := prepareOutput(req.Output)
	if err != nil {
		return result, err
	}
	defer parent.Close()
	listing, err := c.list(ctx, req.Version)
	if err != nil {
		return result, err
	}
	var selected *Asset
	for i := range listing.Assets {
		if listing.Assets[i].Name == req.Asset {
			selected = &listing.Assets[i]
		}
	}
	if selected == nil {
		return result, fmt.Errorf("attachment %q does not exist in %s", req.Asset, req.Version)
	}
	expected, err := assetDigest(*selected)
	if err != nil {
		return result, err
	}
	if selected.Size <= 0 || selected.Size > c.limits.archive {
		return result, fmt.Errorf("asset size exceeds download limit or is empty")
	}
	if err = ctx.Err(); err != nil {
		return result, err
	}
	base := filepath.Base(output)
	if err = parent.Mkdir(base, 0700); err != nil {
		return result, fmt.Errorf("create new output (existing paths are refused): %w", err)
	}
	result = Result{Directory: output, Asset: req.Asset}
	defer func() {
		if err != nil {
			err = fmt.Errorf("%w; artifacts retained at %s", err, output)
		}
	}()
	root, err := openDirectory(parent, base)
	if err != nil {
		return result, err
	}
	defer root.Close()
	archive, err := root.OpenFile("download.zip", os.O_CREATE|os.O_EXCL|os.O_RDWR, 0600)
	if err != nil {
		return result, err
	}
	defer archive.Close()
	response, err := c.get(ctx, repositoryPath+fmt.Sprintf("assets/%d", selected.ID), "application/octet-stream", true)
	if err != nil {
		return result, err
	}
	defer response.Body.Close()
	if response.ContentLength >= 0 && response.ContentLength != selected.Size {
		return result, fmt.Errorf("asset Content-Length differs from API size")
	}
	hash := sha256.New()
	n, err := copyBounded(ctx, io.MultiWriter(archive, hash), response.Body, selected.Size)
	if err != nil {
		return result, fmt.Errorf("download: %w", err)
	}
	if n != selected.Size {
		return result, fmt.Errorf("asset length differs from API size")
	}
	actual := hex.EncodeToString(hash.Sum(nil))
	if actual != expected {
		return result, fmt.Errorf("asset SHA-256 does not match GitHub API digest")
	}
	result.SHA256 = actual
	if err = archive.Sync(); err != nil {
		return result, err
	}
	container, err := extract(ctx, archive, n, root, c.limits)
	if err != nil {
		return result, err
	}
	result.Directory = filepath.Join(output, "contents", filepath.FromSlash(container))
	return result, nil
}

// Check one byte beyond the limit without writing it. This bounds both dishonest
// HTTP bodies and decompression even when advertised sizes are incorrect.
func copyBounded(ctx context.Context, dst io.Writer, src io.Reader, limit int64) (int64, error) {
	n, err := io.Copy(dst, &contextReader{ctx: ctx, r: io.LimitReader(src, limit)})
	if err != nil {
		return n, err
	}
	var extra [1]byte
	read, err := io.ReadFull(&contextReader{ctx: ctx, r: src}, extra[:])
	if read != 0 {
		return n, fmt.Errorf("body exceeds limit (%d bytes)", limit)
	}
	if err != io.EOF {
		return n, err
	}
	return n, ctx.Err()
}

type contextReader struct {
	ctx context.Context
	r   io.Reader
}

func (r *contextReader) Read(p []byte) (int, error) {
	if err := r.ctx.Err(); err != nil {
		return 0, err
	}
	return r.r.Read(p)
}

func prepareOutput(name string) (string, *os.Root, error) {
	if strings.TrimSpace(name) == "" {
		return "", nil, fmt.Errorf("a new output directory is required")
	}
	abs, err := filepath.Abs(name)
	if err != nil {
		return "", nil, err
	}
	if _, err = os.Lstat(abs); !errors.Is(err, os.ErrNotExist) {
		if err == nil {
			err = fmt.Errorf("output already exists")
		}
		return "", nil, err
	}
	// Resolve existing parent aliases (including macOS /var and /tmp), never the
	// new leaf. Hold the parent handle throughout the request to avoid retargeting.
	parentPath, err := filepath.EvalSymlinks(filepath.Dir(abs))
	if err != nil {
		return "", nil, fmt.Errorf("output parent must exist: %w", err)
	}
	if err = checkOutputParent(filepath.Dir(abs)); err != nil {
		return "", nil, err
	}
	parent, err := os.OpenRoot(parentPath)
	if err != nil {
		return "", nil, err
	}
	return filepath.Join(parentPath, filepath.Base(abs)), parent, nil
}

func openDirectory(parent *os.Root, name string) (*os.Root, error) {
	before, err := parent.Lstat(name)
	if err != nil {
		return nil, err
	}
	if !before.IsDir() || before.Mode()&os.ModeSymlink != 0 || reparsePoint(before) {
		return nil, fmt.Errorf("directory is a link, reparse point, or non-directory")
	}
	root, err := parent.OpenRoot(name)
	if err != nil {
		return nil, err
	}
	after, err := root.Stat(".")
	if err != nil || !os.SameFile(before, after) || reparsePoint(after) {
		root.Close()
		return nil, fmt.Errorf("directory changed during open")
	}
	return root, nil
}
