// Package platform provides conservative filesystem primitives for the updater.
// See README.md for the maintenance-window requirement and platform limits.
package platform

import (
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"unicode/utf8"
)

var (
	ErrUnsafePath       = errors.New("unsafe path")
	ErrUnsupported      = errors.New("unsupported storage or metadata")
	ErrLocked           = errors.New("project transaction is locked")
	ErrWriterActive     = errors.New("potential project writer is active")
	ErrWriterInspection = errors.New("writer inspection unavailable")
	ErrChanged          = errors.New("filesystem object changed during operation")
)

const lockName = ".cc-radt-updater.lock"

// ValidateProject resolves the user-selected root to an existing absolute
// directory (including macOS /tmp). Its canonical ancestors are checked.
// Network/device paths and parent traversal are rejected. Interior paths must
// subsequently go through SafePath, which does not resolve links.
func ValidateProject(path string) (string, error) {
	abs, err := absolutePath(path)
	if err != nil {
		return "", err
	}
	abs, err = canonicalProject(abs)
	if err != nil {
		return "", err
	}
	if _, err = inspectPath(abs, false); err != nil {
		return "", err
	}
	info, err := os.Lstat(abs)
	if err != nil {
		return "", err
	}
	if !info.IsDir() {
		return "", fmt.Errorf("%w: project is not a directory", ErrUnsafePath)
	}
	if err = localPath(abs); err != nil {
		return "", err
	}
	return abs, nil
}

// SafePath validates a portable relative filename and every existing ancestor.
// Missing descendants are allowed. The result is a snapshot, not a capability:
// callers must not treat a prior validation as protection for a later os.Rename.
func SafePath(root, rel string) (string, error) {
	root, err := ValidateProject(root)
	if err != nil {
		return "", err
	}
	if rel == "." {
		return root, nil
	}
	if err = relativeName(rel); err != nil {
		return "", err
	}
	path := filepath.Join(root, filepath.FromSlash(rel))
	if !within(root, path) || path == root {
		return "", ErrUnsafePath
	}
	if _, err = inspectPath(path, true); err != nil {
		return "", err
	}
	return path, nil
}

func absolutePath(path string) (string, error) {
	if path == "" || strings.ContainsRune(path, 0) || strings.HasPrefix(path, "//") || strings.HasPrefix(path, `\\`) {
		return "", fmt.Errorf("%w: empty, NUL, network or device path", ErrUnsafePath)
	}
	if err := nativePathSyntax(path); err != nil {
		return "", err
	}
	for _, part := range strings.FieldsFunc(path, func(r rune) bool { return r == '/' || r == '\\' }) {
		if part == ".." {
			return "", fmt.Errorf("%w: parent traversal", ErrUnsafePath)
		}
	}
	return filepath.Abs(path)
}

func relativeName(rel string) error {
	if rel == "" || !utf8.ValidString(rel) || strings.ContainsAny(rel, "\\\x00:<>\"|?*") || filepath.IsAbs(rel) || strings.HasPrefix(rel, "/") {
		return fmt.Errorf("%w: invalid relative name %q", ErrUnsafePath, rel)
	}
	for _, p := range strings.Split(rel, "/") {
		if p == "" || p == "." || p == ".." || strings.TrimRight(p, ". ") != p {
			return fmt.Errorf("%w: invalid path component", ErrUnsafePath)
		}
		stem := strings.TrimRight(strings.ToUpper(strings.SplitN(p, ".", 2)[0]), " ")
		if strings.HasPrefix(stem, "COM") || strings.HasPrefix(stem, "LPT") {
			if suffix := stem[3:]; suffix == "\u00b9" || suffix == "\u00b2" || suffix == "\u00b3" {
				return fmt.Errorf("%w: reserved device name", ErrUnsafePath)
			}
		}
		if stem == "CON" || stem == "PRN" || stem == "AUX" || stem == "NUL" || stem == "CONIN$" || stem == "CONOUT$" || (len(stem) == 4 && (strings.HasPrefix(stem, "COM") || strings.HasPrefix(stem, "LPT")) && stem[3] >= '0' && stem[3] <= '9') {
			return fmt.Errorf("%w: reserved device name", ErrUnsafePath)
		}
		for _, r := range p {
			if r < 32 {
				return fmt.Errorf("%w: control character", ErrUnsafePath)
			}
		}
	}
	return nil
}

func within(root, path string) bool {
	rel, err := filepath.Rel(root, path)
	return err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator)) && !filepath.IsAbs(rel)
}

// inspectPath uses Lstat even for the last component; it never opens contents.
func inspectPath(path string, missingOK bool) (os.FileInfo, error) {
	volume := filepath.VolumeName(path)
	current := volume + string(filepath.Separator)
	parts := strings.Split(strings.TrimPrefix(path[len(volume):], string(filepath.Separator)), string(filepath.Separator))
	var info os.FileInfo
	for i := -1; i < len(parts); i++ {
		if i >= 0 {
			if parts[i] == "" {
				continue
			}
			current = filepath.Join(current, parts[i])
		}
		var err error
		info, err = os.Lstat(current)
		if err != nil {
			if missingOK && errors.Is(err, fs.ErrNotExist) {
				return nil, nil
			}
			return nil, err
		}
		if err = plainEntry(current, info); err != nil {
			return nil, err
		}
		if i < len(parts)-1 && !info.IsDir() {
			return nil, fmt.Errorf("%w: non-directory ancestor %q", ErrUnsafePath, current)
		}
	}
	return info, nil
}

func plainEntry(path string, info os.FileInfo) error {
	if !info.IsDir() && !info.Mode().IsRegular() {
		return fmt.Errorf("%w: link or special file %q", ErrUnsafePath, path)
	}
	return nativeEntry(path, info)
}

func openRoot(path string) (*os.Root, error) {
	path, err := ValidateProject(path)
	if err != nil {
		return nil, err
	}
	before, err := os.Lstat(path)
	if err != nil {
		return nil, err
	}
	r, err := os.OpenRoot(path)
	if err != nil {
		return nil, err
	}
	after, err := r.Stat(".")
	if err != nil || !os.SameFile(before, after) {
		r.Close()
		return nil, errors.Join(ErrChanged, err)
	}
	return r, nil
}

func openEntry(r *os.Root, name string, flags int, mode os.FileMode) (*os.File, error) {
	before, err := r.Lstat(name)
	if err != nil && !(flags&os.O_CREATE != 0 && errors.Is(err, fs.ErrNotExist)) {
		return nil, err
	}
	if before != nil {
		if !before.Mode().IsRegular() && !before.IsDir() {
			return nil, ErrUnsafePath
		}
	}
	f, err := r.OpenFile(name, flags|noFollowFlags(), mode)
	if err != nil {
		return nil, err
	}
	after, err := f.Stat()
	if err == nil && before != nil && !os.SameFile(before, after) {
		err = ErrChanged
	}
	if err == nil {
		err = plainEntry(f.Name(), after)
	}
	if err != nil {
		f.Close()
		return nil, err
	}
	return f, nil
}

// CheckTree inspects metadata only. It rejects special files, links, hard-linked
// regular files, mounts, and metadata which CopyFile cannot preserve.
func CheckTree(root string) error {
	abs, err := absolutePath(root)
	if err != nil {
		return err
	}
	abs = systemPath(abs)
	if _, err = inspectPath(abs, false); err != nil {
		return err
	}
	// Canonicalize only verified ancestors, never the inspected entry itself.
	parent, err := ValidateProject(filepath.Dir(abs))
	if err != nil {
		return err
	}
	abs = filepath.Join(parent, filepath.Base(abs))
	info, err := os.Lstat(abs)
	if err != nil {
		return err
	}
	if err = plainEntry(abs, info); err != nil {
		return err
	}
	if info.Mode().IsRegular() {
		r, err := openRoot(parent)
		if err != nil {
			return err
		}
		defer r.Close()
		f, err := openEntry(r, filepath.Base(abs), os.O_RDONLY, 0)
		if err != nil {
			return err
		}
		defer f.Close()
		return checkMetadata(f)
	}
	r, err := openRoot(abs)
	if err != nil {
		return err
	}
	defer r.Close()
	info, err = r.Stat(".")
	if err != nil {
		return err
	}
	return checkTree(r, info)
}

func checkTree(r *os.Root, top os.FileInfo) error {
	dir, err := openEntry(r, ".", os.O_RDONLY, 0)
	if err != nil {
		return err
	}
	defer dir.Close()
	if err = checkMetadata(dir); err != nil {
		return err
	}
	entries, err := dir.ReadDir(-1)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		name := entry.Name()
		if err = relativeName(name); err != nil {
			return err
		}
		f, err := openEntry(r, name, os.O_RDONLY, 0)
		if err != nil {
			return fmt.Errorf("inspect %q: %w", name, err)
		}
		info, err := f.Stat()
		if err == nil {
			err = sameDevice(top, info)
		}
		if err == nil {
			err = checkMetadata(f)
		}
		f.Close()
		if err != nil {
			return fmt.Errorf("inspect %q: %w", name, err)
		}
		if info.IsDir() {
			child, err := r.OpenRoot(name)
			if err != nil {
				return err
			}
			actual, err := child.Stat(".")
			if err == nil && !os.SameFile(info, actual) {
				err = ErrChanged
			}
			if err == nil {
				err = checkTree(child, top)
			}
			child.Close()
			if err != nil {
				return err
			}
		}
	}
	return nil
}

// CopyFile creates dst exclusively; it never removes, truncates or replaces a
// destination. On error a partial destination may remain for transaction recovery.
// Permissions, ownership, atime and mtime are preserved for supported metadata.
func CopyFile(src, dst string) error {
	src, err := absolutePath(src)
	if err != nil {
		return err
	}
	dst, err = absolutePath(dst)
	if err != nil {
		return err
	}
	src, dst = systemPath(src), systemPath(dst)
	if _, err = inspectPath(src, false); err != nil {
		return err
	}
	if _, err = inspectPath(dst, true); err != nil {
		return err
	}
	if err = relativeName(filepath.Base(src)); err != nil {
		return err
	}
	if err = relativeName(filepath.Base(dst)); err != nil {
		return err
	}
	sr, err := openRoot(filepath.Dir(src))
	if err != nil {
		return err
	}
	defer sr.Close()
	dr, err := openRoot(filepath.Dir(dst))
	if err != nil {
		return err
	}
	defer dr.Close()
	in, err := openEntry(sr, filepath.Base(src), os.O_RDONLY, 0)
	if err != nil {
		return err
	}
	defer in.Close()
	before, err := in.Stat()
	if err != nil {
		return err
	}
	if !before.Mode().IsRegular() {
		return ErrUnsafePath
	}
	if err = checkMetadata(in); err != nil {
		return err
	}
	out, err := openEntry(dr, filepath.Base(dst), os.O_CREATE|os.O_EXCL|os.O_RDWR, 0600)
	if err != nil {
		return err
	}
	defer out.Close()
	if err = prepareMetadata(in, out, before); err != nil {
		return err
	}
	written, err := io.Copy(out, in)
	if err != nil {
		return err
	}
	after, err := in.Stat()
	if err != nil {
		return err
	}
	if written != before.Size() || !unchanged(before, after) {
		return ErrChanged
	}
	if err = checkMetadata(in); err != nil {
		return err
	}
	if err = finishMetadata(in, out, before); err != nil {
		return err
	}
	after, err = in.Stat()
	if err != nil {
		return err
	}
	if !unchanged(before, after) {
		return ErrChanged
	}
	if err = entryStillNamed(sr, filepath.Base(src), in); err != nil {
		return err
	}
	if err = entryStillNamed(dr, filepath.Base(dst), out); err != nil {
		return err
	}
	if err = out.Sync(); err != nil {
		return err
	}
	if err = out.Close(); err != nil {
		return err
	}
	return syncRoot(dr)
}

func entryStillNamed(r *os.Root, name string, f *os.File) error {
	named, err := r.Lstat(name)
	if err != nil {
		return errors.Join(ErrChanged, err)
	}
	opened, err := f.Stat()
	if err != nil {
		return err
	}
	if !os.SameFile(named, opened) {
		return ErrChanged
	}
	return plainEntry(f.Name(), opened)
}

// SyncDir persists directory updates or returns an explicit unsupported error.
func SyncDir(path string) error {
	r, err := openRoot(path)
	if err != nil {
		return err
	}
	defer r.Close()
	return syncRoot(r)
}

func syncRoot(r *os.Root) error {
	f, err := openEntry(r, ".", os.O_RDONLY, 0)
	if err != nil {
		return err
	}
	defer f.Close()
	return syncDirectory(f)
}

// Lock acquires a nonblocking OS lock on a persistent lock file in dir. All
// transactions for a project must use the same dir. Never unlink that file: doing
// so would allow distinct inodes to carry two supposedly exclusive locks.
func Lock(dir string) (release func(), err error) {
	r, err := openRoot(dir)
	if err != nil {
		return nil, err
	}
	defer r.Close()
	f, err := openEntry(r, lockName, os.O_RDWR|os.O_CREATE, 0600)
	if err != nil {
		return nil, err
	}
	info, err := f.Stat()
	if err == nil && !info.Mode().IsRegular() {
		err = ErrUnsafePath
	}
	if err == nil {
		err = checkLockFile(f)
	}
	if err == nil {
		err = lockFile(f)
	}
	if err != nil {
		f.Close()
		return nil, err
	}
	var once sync.Once
	return func() { once.Do(func() { unlockFile(f); f.Close() }) }, nil
}

// CheckStorage is read-only. Both directories must already exist on the same
// supported local volume, outside each other's tree, with sufficient free space
// and effective access. It cannot reserve space or prove future writes succeed.
func CheckStorage(project, transactions string, needBytes int64) error {
	if needBytes < 0 {
		return fmt.Errorf("negative space requirement")
	}
	project, err := ValidateProject(project)
	if err != nil {
		return err
	}
	transactions, err = ValidateProject(transactions)
	if err != nil {
		return err
	}
	if within(project, transactions) || within(transactions, project) {
		return fmt.Errorf("%w: project and transactions must be disjoint", ErrUnsafePath)
	}
	for _, pair := range [][2]string{{project, transactions}, {transactions, project}} {
		nested, err := objectAncestor(pair[0], pair[1])
		if err != nil {
			return err
		}
		if nested {
			return fmt.Errorf("%w: aliased project and transactions overlap", ErrUnsafePath)
		}
	}
	if cloudPath(project) || cloudPath(transactions) {
		return fmt.Errorf("%w: known cloud synchronization path", ErrUnsupported)
	}
	return checkStorage(project, transactions, uint64(needBytes))
}

func objectAncestor(ancestor, path string) (bool, error) {
	wanted, err := os.Lstat(ancestor)
	if err != nil {
		return false, err
	}
	for current := path; ; current = filepath.Dir(current) {
		info, err := os.Lstat(current)
		if err != nil {
			return false, err
		}
		if os.SameFile(wanted, info) {
			return true, nil
		}
		if filepath.Dir(current) == current {
			return false, nil
		}
	}
}

func cloudPath(path string) bool {
	for _, part := range strings.FieldsFunc(strings.ToLower(path), func(r rune) bool { return r == '/' || r == '\\' }) {
		if part == "cloudstorage" || part == "mobile documents" || part == "dropbox" || part == "onedrive" || strings.HasPrefix(part, "onedrive - ") || part == "google drive" || part == "googledrive" {
			return true
		}
	}
	return false
}

// CheckWriters reports recognized local processes whose cwd is in project.
// A nil result is NOT proof of quiescence; see README.md. This function never
// kills processes and never reads command arguments, environment or file bodies.
func CheckWriters(project string) error {
	project, err := ValidateProject(project)
	if err != nil {
		return err
	}
	return checkWriters(project)
}

func writerName(name string) bool {
	name = strings.ToLower(filepath.Base(strings.TrimSpace(name)))
	name = strings.TrimSuffix(name, ".exe")
	return name == "claude" || strings.HasPrefix(name, "claude-") || name == "observer" || name == "node" || name == "nodejs" || name == "bun"
}

func spaceEnough(blocks, blockSize, need uint64) bool {
	if blockSize == 0 {
		return false
	}
	return blocks >= need/blockSize && (blocks > need/blockSize || need%blockSize == 0)
}
