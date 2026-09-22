package release

import (
	"archive/zip"
	"context"
	"encoding/binary"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

func portablePath(name string) error {
	if name == "" || len(name) > 1024 || strings.ContainsAny(name, "\\:<>\"|?*") || filepath.IsAbs(name) || filepath.VolumeName(name) != "" || !filepath.IsLocal(filepath.FromSlash(name)) || filepath.ToSlash(filepath.Clean(filepath.FromSlash(name))) != name {
		return fmt.Errorf("unsafe ZIP path %q", name)
	}
	// Without a Unicode normalization dependency, reject non-ASCII names rather
	// than permit NFC/NFD or platform-specific Unicode aliases to collide.
	for _, ch := range name {
		if ch < 32 || ch > 126 {
			return fmt.Errorf("ZIP paths must be portable ASCII: %q", name)
		}
	}
	parts := strings.Split(name, "/")
	if len(parts) > 32 {
		return fmt.Errorf("ZIP path nesting exceeds limit")
	}
	for _, part := range parts {
		if part == "" || part == "." || part == ".." || len(part) > 255 || strings.HasSuffix(part, ".") || strings.HasSuffix(part, " ") {
			return fmt.Errorf("unsafe ZIP path component %q", part)
		}
		stem := strings.ToUpper(strings.TrimRight(strings.SplitN(part, ".", 2)[0], " "))
		if stem == "CON" || stem == "PRN" || stem == "AUX" || stem == "NUL" || stem == "CONIN$" || stem == "CONOUT$" || (len(stem) == 4 && (strings.HasPrefix(stem, "COM") || strings.HasPrefix(stem, "LPT")) && stem[3] >= '0' && stem[3] <= '9') {
			return fmt.Errorf("Windows device name in ZIP path %q", part)
		}
	}
	return nil
}

type zipEntry struct {
	file *zip.File
	name string
	dir  bool
}

type pathNode struct {
	name     string
	dir      bool
	explicit bool
}

func inspectZIP(ctx context.Context, source io.ReaderAt, size int64, limits bounds) ([]zipEntry, string, error) {
	directoryOffset, err := boundDirectory(ctx, source, size, limits)
	if err != nil {
		return nil, "", err
	}
	zr, err := zip.NewReader(source, size)
	if err != nil {
		return nil, "", fmt.Errorf("invalid ZIP: %w", err)
	}
	if len(zr.File) == 0 || len(zr.File) > limits.entries {
		return nil, "", fmt.Errorf("empty ZIP or too many ZIP entries")
	}
	nodes := map[string]pathNode{}
	entries := make([]zipEntry, 0, len(zr.File))
	var total uint64
	files := 0
	for _, f := range zr.File {
		if err = ctx.Err(); err != nil {
			return nil, "", err
		}
		dir := strings.HasSuffix(f.Name, "/")
		name := strings.TrimSuffix(f.Name, "/")
		if err = portablePath(name); err != nil {
			return nil, "", err
		}
		mode := f.Mode()
		if (mode.Type() != 0 && mode.Type() != os.ModeDir) || mode&(os.ModeSetuid|os.ModeSetgid|os.ModeSticky) != 0 || mode.IsDir() != dir || f.ExternalAttrs&0x400 != 0 {
			return nil, "", fmt.Errorf("ZIP links, reparse points, special files, or unsafe modes are forbidden: %q", name)
		}
		if f.Flags&0x2041 != 0 || (f.Method != zip.Store && f.Method != zip.Deflate) {
			return nil, "", fmt.Errorf("encrypted or unsupported ZIP entry: %q", name)
		}
		if dir && (f.UncompressedSize64 != 0 || f.CompressedSize64 != 0) {
			return nil, "", fmt.Errorf("ZIP directory contains data: %q", name)
		}
		if f.UncompressedSize64 > uint64(limits.file) || f.UncompressedSize64 > uint64(limits.expanded)-total || f.CompressedSize64 > uint64(size) {
			return nil, "", fmt.Errorf("ZIP extraction size limit exceeded")
		}
		if f.UncompressedSize64 > 0 && (f.CompressedSize64 == 0 || f.UncompressedSize64 > f.CompressedSize64*1000) {
			return nil, "", fmt.Errorf("ZIP compression ratio exceeds limit")
		}
		total += f.UncompressedSize64
		offset, err := f.DataOffset()
		if err != nil || offset < 0 || offset > directoryOffset || f.CompressedSize64 > uint64(directoryOffset-offset) {
			return nil, "", fmt.Errorf("ZIP data lies outside the archive payload")
		}
		parts := strings.Split(name, "/")
		for i := range parts {
			p := strings.Join(parts[:i+1], "/")
			key := strings.ToLower(p)
			isLeaf := i == len(parts)-1
			isDir := !isLeaf || dir
			old, exists := nodes[key]
			if exists && (old.name != p || old.dir != isDir || (isLeaf && old.explicit)) {
				return nil, "", fmt.Errorf("duplicate, case-colliding, or conflicting ZIP path: %q", p)
			}
			nodes[key] = pathNode{name: p, dir: isDir, explicit: old.explicit || isLeaf}
			if len(nodes) > limits.entries {
				return nil, "", fmt.Errorf("ZIP files and implicit directories exceed entry limit")
			}
		}
		if !dir {
			files++
		}
		entries = append(entries, zipEntry{file: f, name: name, dir: dir})
	}
	if files == 0 {
		return nil, "", fmt.Errorf("ZIP contains no regular files")
	}
	// Only unwrap one non-hidden container, never the .claude directory of a
	// package that already starts at its installation root. No project is read.
	container := ""
	for _, node := range nodes {
		if strings.Contains(node.name, "/") {
			continue
		}
		if container != "" || !node.dir || strings.HasPrefix(node.name, ".") {
			return entries, "", nil
		}
		container = node.name
	}
	return entries, container, nil
}

func extract(ctx context.Context, source io.ReaderAt, size int64, output *os.Root, limits bounds) (string, error) {
	entries, container, err := inspectZIP(ctx, source, size, limits)
	if err != nil {
		return "", err
	}
	if err = ctx.Err(); err != nil {
		return "", err
	}
	if err = output.Mkdir("contents", 0700); err != nil {
		return "", err
	}
	root, err := openDirectory(output, "contents")
	if err != nil {
		return "", err
	}
	defer root.Close()
	created := map[string]bool{}
	for _, entry := range entries {
		if err = ctx.Err(); err != nil {
			return "", err
		}
		parts := strings.Split(entry.name, "/")
		count := len(parts) - 1
		if entry.dir {
			count++
		}
		// Open each component relative to an anchored handle. Existing objects
		// not created by this extraction (including links) are never accepted.
		parent := root
		for i := 0; i < count; i++ {
			path := strings.Join(parts[:i+1], "/")
			if !created[path] {
				err = parent.Mkdir(parts[i], 0700)
				created[path] = err == nil
			}
			var next *os.Root
			if err == nil {
				next, err = openDirectory(parent, parts[i])
			}
			if parent != root {
				parent.Close()
			}
			if err != nil {
				return "", err
			}
			parent = next
		}
		if !entry.dir {
			err = extractFile(ctx, parent, parts[len(parts)-1], entry.file)
		}
		if parent != root {
			parent.Close()
		}
		if err != nil {
			return "", err
		}
	}
	return container, nil
}

func extractFile(ctx context.Context, root *os.Root, name string, f *zip.File) (err error) {
	in, err := f.Open()
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := root.OpenFile(name, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return err
	}
	defer func() {
		if closeErr := out.Close(); err == nil {
			err = closeErr
		}
	}()
	n, err := copyBounded(ctx, out, in, int64(f.UncompressedSize64))
	if err != nil {
		return fmt.Errorf("extract %q: %w", f.Name, err)
	}
	if uint64(n) != f.UncompressedSize64 {
		return fmt.Errorf("ZIP uncompressed size mismatch")
	}
	// Keep ordinary executable bits for package mode compatibility; never apply
	// ownership, special permission bits, links, timestamps, or extra attributes.
	if err = out.Chmod(f.Mode().Perm()); err != nil {
		return err
	}
	return out.Sync()
}

// archive/zip reads central directory entries before callers can count them.
// Bound and validate that directory first; ZIP64/multipart/SFX are deliberately
// unsupported under the small archive and entry limits of this downloader.
func boundDirectory(ctx context.Context, source io.ReaderAt, size int64, limits bounds) (int64, error) {
	if size < 22 || size > limits.archive {
		return 0, fmt.Errorf("invalid ZIP size")
	}
	var signature [4]byte
	if _, err := source.ReadAt(signature[:], 0); err != nil || binary.LittleEndian.Uint32(signature[:]) != 0x04034b50 {
		return 0, fmt.Errorf("ZIP must start with a local file header, not an executable prefix")
	}
	tailSize := min(size, int64(65535+22))
	tail := make([]byte, int(tailSize))
	if _, err := source.ReadAt(tail, size-tailSize); err != nil {
		return 0, err
	}
	index := -1
	for i := len(tail) - 22; i >= 0; i-- {
		if binary.LittleEndian.Uint32(tail[i:]) == 0x06054b50 {
			// Match archive/zip's last-signature choice. Skipping a malformed
			// later signature could preflight a different directory than it reads.
			if i+22+int(binary.LittleEndian.Uint16(tail[i+20:])) != len(tail) {
				return 0, fmt.Errorf("ambiguous or trailing ZIP end directory")
			}
			index = i
			break
		}
	}
	if index < 0 {
		return 0, fmt.Errorf("ZIP end directory not found")
	}
	end := tail[index:]
	u16 := func(i int) uint16 { return binary.LittleEndian.Uint16(end[i:]) }
	u32 := func(i int) uint32 { return binary.LittleEndian.Uint32(end[i:]) }
	count := int(u16(10))
	directorySize, offset := int64(u32(12)), int64(u32(16))
	if u16(4) != 0 || u16(6) != 0 || u16(8) != u16(10) || count == 0 || count == 65535 || count > limits.entries || directorySize > limits.directory || offset+directorySize != size-tailSize+int64(index) {
		return 0, fmt.Errorf("unsupported or excessive ZIP central directory")
	}
	r := io.NewSectionReader(source, offset, directorySize)
	for i := 0; i < count; i++ {
		if err := ctx.Err(); err != nil {
			return 0, err
		}
		var header [46]byte
		if _, err := io.ReadFull(r, header[:]); err != nil {
			return 0, fmt.Errorf("truncated ZIP central directory")
		}
		if binary.LittleEndian.Uint32(header[:]) != 0x02014b50 || binary.LittleEndian.Uint16(header[34:]) != 0 || int64(binary.LittleEndian.Uint32(header[42:])) >= offset {
			return 0, fmt.Errorf("invalid ZIP central directory entry")
		}
		name, extra, comment := int64(binary.LittleEndian.Uint16(header[28:])), int64(binary.LittleEndian.Uint16(header[30:])), int64(binary.LittleEndian.Uint16(header[32:]))
		if name == 0 || name > 1025 || extra > 4096 || comment > 4096 {
			return 0, fmt.Errorf("ZIP entry metadata exceeds limit")
		}
		if _, err := io.CopyN(io.Discard, r, name+extra+comment); err != nil {
			return 0, fmt.Errorf("truncated ZIP entry metadata")
		}
	}
	if current, _ := r.Seek(0, io.SeekCurrent); current != directorySize {
		return 0, fmt.Errorf("ZIP central directory count or length mismatch")
	}
	return offset, nil
}
