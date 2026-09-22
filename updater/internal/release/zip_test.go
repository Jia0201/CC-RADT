package release

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/binary"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestZIPUnsafePathsAndTypes(t *testing.T) {
	for _, name := range []string{
		"../outside", "a/../../outside", "/absolute", "//server/share", "C:/drive", "C:relative", "a/C:/drive",
		"a\\..\\outside", "\\server\\share", "a//b", "a/./b", "a/../b", "./a", "a/", "a//",
		"a.", "a /b", "dir./file", "file:stream", "NUL", "nul.txt", "CON", "COM1.txt", "lpt9",
		"CON .txt", "CONIN$", "a\x00b", "a\nb", "a\tb", "a\x7fb", "a?b", "a*b", "a<b",
		"caf\u00e9.txt", "cafe\u0301.txt", "\u212a.txt", "\uff21.txt", "\uff0e\uff0e/file", "\xffbad",
		strings.Repeat("a", 256), strings.Repeat("a/", 33) + "file", "",
	} {
		t.Run(name, func(t *testing.T) {
			entry := testEntry{name: name, data: "malicious"}
			if strings.HasSuffix(name, "/") {
				entry.mode, entry.data = os.ModeDir|0755, ""
			}
			z := makeZIP(t, entry)
			if _, _, err := inspectZIP(context.Background(), bytes.NewReader(z), int64(len(z)), defaultBounds()); err == nil {
				t.Fatal("accepted unsafe ZIP path", name)
			}
		})
	}
	for _, mode := range []os.FileMode{os.ModeSymlink | 0777, os.ModeNamedPipe | 0600, os.ModeSocket | 0600, os.ModeDevice | 0600, os.ModeCharDevice | os.ModeDevice | 0600, os.ModeSetuid | 0755, os.ModeSetgid | 0755, os.ModeSticky | 0755} {
		z := makeZIP(t, testEntry{name: "entry", data: "target", mode: mode})
		if _, _, err := inspectZIP(context.Background(), bytes.NewReader(z), int64(len(z)), defaultBounds()); err == nil {
			t.Fatal("accepted unsafe ZIP mode", mode)
		}
	}
	for _, flag := range []uint16{1, 64, 8192} {
		z := makeZIP(t, testEntry{name: "file", data: "contents"})
		central := bytes.Index(z, []byte("PK\x01\x02"))
		binary.LittleEndian.PutUint16(z[central+8:], flag)
		if _, _, err := inspectZIP(context.Background(), bytes.NewReader(z), int64(len(z)), defaultBounds()); err == nil {
			t.Fatal("accepted encryption flag", flag)
		}
	}
	z := makeZIP(t, testEntry{name: "junction", data: "target"})
	central := bytes.Index(z, []byte("PK\x01\x02"))
	attrs := binary.LittleEndian.Uint32(z[central+38:])
	binary.LittleEndian.PutUint32(z[central+38:], attrs|0x400)
	if _, _, err := inspectZIP(context.Background(), bytes.NewReader(z), int64(len(z)), defaultBounds()); err == nil {
		t.Fatal("accepted Windows reparse point attribute")
	}
}

func TestZIPPathCollisions(t *testing.T) {
	for _, names := range [][]string{
		{"a", "a"}, {"a", "A"}, {"dir/a", "DIR/b"}, {"a", "a/b"}, {"a/b", "a"},
		{"a/", "a"}, {"a/", "a/"}, {"dir/", "DIR/"}, {"dir/a", "dir/A"},
		{"caf\u00e9/a", "cafe\u0301/b"}, {"K.txt", "\u212a.txt"}, {"ss.txt", "\u00df.txt"},
	} {
		t.Run(strings.Join(names, "+"), func(t *testing.T) {
			var entries []testEntry
			for _, name := range names {
				entry := testEntry{name: name}
				if strings.HasSuffix(name, "/") {
					entry.mode = os.ModeDir | 0755
				}
				entries = append(entries, entry)
			}
			z := makeZIP(t, entries...)
			if _, _, err := inspectZIP(context.Background(), bytes.NewReader(z), int64(len(z)), defaultBounds()); err == nil {
				t.Fatal("accepted colliding ZIP paths", names)
			}
		})
	}
}

func TestZIPContainerAndDirectoryOrder(t *testing.T) {
	for _, tc := range []struct {
		name      string
		entries   []testEntry
		container string
	}{
		{"outer", []testEntry{{name: "bundle/README.md", data: "ok"}, {name: "bundle/", mode: os.ModeDir | 0755}}, "bundle"},
		{"hiddenRoot", []testEntry{{name: ".claude/a", data: "ok"}}, ""},
		{"flat", []testEntry{{name: "README.md", data: "ok"}, {name: ".claude/a", data: "ok"}}, ""},
		{"siblings", []testEntry{{name: "a/file"}, {name: "b/file"}}, ""},
		{"nested", []testEntry{{name: "bundle/inner/file"}}, "bundle"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			z := makeZIP(t, tc.entries...)
			dir := t.TempDir()
			root, err := os.OpenRoot(dir)
			if err != nil {
				t.Fatal(err)
			}
			defer root.Close()
			container, err := extract(context.Background(), bytes.NewReader(z), int64(len(z)), root, defaultBounds())
			if err != nil || container != tc.container {
				t.Fatal(container, err)
			}
			for _, entry := range tc.entries {
				if _, err := os.Stat(filepath.Join(dir, "contents", filepath.FromSlash(entry.name))); err != nil {
					t.Fatal(err)
				}
			}
		})
	}
}

func TestZIPLimits(t *testing.T) {
	base := makeZIP(t, testEntry{name: "dir/file", data: "1234567890"}, testEntry{name: "second", data: "1234567890"})
	for _, tc := range []struct {
		name string
		edit func(*bounds)
	}{
		{"archive", func(b *bounds) { b.archive = int64(len(base) - 1) }},
		{"file", func(b *bounds) { b.file = 9 }},
		{"expanded", func(b *bounds) { b.expanded = 19 }},
		{"entries", func(b *bounds) { b.entries = 1 }},
		{"implicitDirectories", func(b *bounds) { b.entries = 2 }},
		{"centralDirectory", func(b *bounds) { b.directory = 45 }},
	} {
		t.Run(tc.name, func(t *testing.T) {
			limits := defaultBounds()
			tc.edit(&limits)
			if _, _, err := inspectZIP(context.Background(), bytes.NewReader(base), int64(len(base)), limits); err == nil {
				t.Fatal("ZIP limit not enforced")
			}
		})
	}
	for _, edit := range []func([]byte, int, int){
		func(z []byte, c, e int) { binary.LittleEndian.PutUint16(z[e+10:], 1) },
		func(z []byte, c, e int) {
			binary.LittleEndian.PutUint16(z[e+8:], 1)
			binary.LittleEndian.PutUint16(z[e+10:], 1)
		},
		func(z []byte, c, e int) { binary.LittleEndian.PutUint16(z[e+4:], 1) },
		func(z []byte, c, e int) { binary.LittleEndian.PutUint32(z[e+16:], 0xffffffff) },
		func(z []byte, c, e int) {
			binary.LittleEndian.PutUint16(z[e+8:], 0xffff)
			binary.LittleEndian.PutUint16(z[e+10:], 0xffff)
		},
		func(z []byte, c, e int) { binary.LittleEndian.PutUint16(z[c+28:], 2000) },
		func(z []byte, c, e int) { binary.LittleEndian.PutUint16(z[c+30:], 5000) },
		func(z []byte, c, e int) { binary.LittleEndian.PutUint16(z[c+32:], 5000) },
		func(z []byte, c, e int) { binary.LittleEndian.PutUint16(z[c+34:], 1) },
		func(z []byte, c, e int) { binary.LittleEndian.PutUint32(z[c+42:], uint32(c)) },
		func(z []byte, c, e int) { binary.LittleEndian.PutUint32(z[c+24:], 0xffffffff) },
		func(z []byte, c, e int) { binary.LittleEndian.PutUint32(z[c+20:], 0xffffffff) },
		func(z []byte, c, e int) { binary.LittleEndian.PutUint32(z[c+20:], 0) },
		func(z []byte, c, e int) {
			binary.LittleEndian.PutUint32(z[c+24:], 10001)
			binary.LittleEndian.PutUint32(z[c+20:], 1)
		},
		func(z []byte, c, e int) { binary.LittleEndian.PutUint16(z[c+10:], 99) },
		func(z []byte, c, e int) { binary.LittleEndian.PutUint16(z[26:], 65535) },
	} {
		z := append([]byte{}, base...)
		c, e := bytes.Index(z, []byte("PK\x01\x02")), bytes.LastIndex(z, []byte("PK\x05\x06"))
		edit(z, c, e)
		if _, _, err := inspectZIP(context.Background(), bytes.NewReader(z), int64(len(z)), defaultBounds()); err == nil {
			t.Fatal("accepted malformed ZIP metadata")
		}
	}
	for _, z := range [][]byte{nil, []byte("not a zip"), append(append([]byte{}, base...), 0), base[:len(base)-1], makeZIP(t), makeZIP(t, testEntry{name: "dir/", mode: os.ModeDir | 0755})} {
		if _, _, err := inspectZIP(context.Background(), bytes.NewReader(z), int64(len(z)), defaultBounds()); err == nil {
			t.Fatal("accepted invalid or empty ZIP")
		}
	}
}

func TestDeflateAndCRCFailure(t *testing.T) {
	var buf bytes.Buffer
	w := zip.NewWriter(&buf)
	f, err := w.Create("file.txt")
	if err != nil {
		t.Fatal(err)
	}
	io.WriteString(f, strings.Repeat("compressible data", 1000))
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	z := buf.Bytes()
	root, err := os.OpenRoot(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	if _, err := extract(context.Background(), bytes.NewReader(z), int64(len(z)), root, defaultBounds()); err != nil {
		t.Fatal(err)
	}
	z = makeZIP(t, testEntry{name: "file", data: "must stay unmodified"})
	z[30+len("file")] ^= 1
	dir := t.TempDir()
	root2, err := os.OpenRoot(dir)
	if err != nil {
		t.Fatal(err)
	}
	defer root2.Close()
	if _, err := extract(context.Background(), bytes.NewReader(z), int64(len(z)), root2, defaultBounds()); !errors.Is(err, zip.ErrChecksum) {
		t.Fatal("CRC corruption not detected", err)
	}
	if _, err := os.Stat(filepath.Join(dir, "contents", "file")); err != nil {
		t.Fatal("partial extraction was removed", err)
	}
}

func TestZIPEndRecordAmbiguityAndPrefixes(t *testing.T) {
	var buf bytes.Buffer
	w := zip.NewWriter(&buf)
	w.SetComment("ordinary archive comment")
	f, _ := w.Create("file")
	f.Write([]byte("data"))
	w.Close()
	z := buf.Bytes()
	if _, _, err := inspectZIP(context.Background(), bytes.NewReader(z), int64(len(z)), defaultBounds()); err != nil {
		t.Fatal("ordinary ZIP comment refused", err)
	}
	end := bytes.LastIndex(z, []byte("PK\x05\x06"))
	malformed := append([]byte{}, z[:end+22]...)
	comment := append([]byte("PK\x05\x06"), make([]byte, 19)...)
	binary.LittleEndian.PutUint16(malformed[end+20:], uint16(len(comment)))
	malformed = append(malformed, comment...)
	if _, _, err := inspectZIP(context.Background(), bytes.NewReader(malformed), int64(len(malformed)), defaultBounds()); err == nil {
		t.Fatal("ambiguous end record accepted")
	}
	prefixed := append([]byte("MZ executable prefix"), z...)
	if _, _, err := inspectZIP(context.Background(), bytes.NewReader(prefixed), int64(len(prefixed)), defaultBounds()); err == nil {
		t.Fatal("executable ZIP prefix accepted")
	}
}

func TestExtractionNeverReusesExistingTree(t *testing.T) {
	dir := t.TempDir()
	root, err := os.OpenRoot(dir)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	if err := root.Mkdir("contents", 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "contents", "file"), []byte("preserve"), 0600); err != nil {
		t.Fatal(err)
	}
	z := makeZIP(t, testEntry{name: "file", data: "replacement"})
	if _, err := extract(context.Background(), bytes.NewReader(z), int64(len(z)), root, defaultBounds()); err == nil {
		t.Fatal("reused preexisting contents")
	}
	data, _ := os.ReadFile(filepath.Join(dir, "contents", "file"))
	if string(data) != "preserve" {
		t.Fatal("existing file changed")
	}
}

func TestOpenDirectoryRefusesSymlinks(t *testing.T) {
	dir := t.TempDir()
	if err := os.Mkdir(filepath.Join(dir, "real"), 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink("real", filepath.Join(dir, "link")); err != nil {
		t.Skip("symlinks unavailable", err)
	}
	root, err := os.OpenRoot(dir)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	if child, err := openDirectory(root, "link"); err == nil {
		child.Close()
		t.Fatal("accepted directory symlink")
	}
}

func TestBoundedCopy(t *testing.T) {
	for _, size := range []int{0, 2, 3, 4} {
		var out bytes.Buffer
		n, err := copyBounded(context.Background(), &out, strings.NewReader(strings.Repeat("a", size)), 3)
		if size > 3 && err == nil || size <= 3 && err != nil || n > 3 || out.Len() > 3 {
			t.Fatal("copy limit failure", size, n, err)
		}
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := copyBounded(ctx, io.Discard, strings.NewReader("data"), 3); !errors.Is(err, context.Canceled) {
		t.Fatal("copy did not honor context", err)
	}
	z := makeZIP(t, testEntry{name: "file", data: "data"})
	if _, _, err := inspectZIP(ctx, bytes.NewReader(z), int64(len(z)), defaultBounds()); !errors.Is(err, context.Canceled) {
		t.Fatal("ZIP inspection did not honor context", err)
	}
}

func FuzzZIPInspection(f *testing.F) {
	var buf bytes.Buffer
	w := zip.NewWriter(&buf)
	entry, _ := w.Create("README.md")
	entry.Write([]byte("example"))
	w.Close()
	f.Add(buf.Bytes())
	f.Add([]byte("PK\x05\x06"))
	f.Fuzz(func(t *testing.T, data []byte) {
		if len(data) > 1<<20 {
			t.Skip()
		}
		limits := defaultBounds()
		limits.entries = 128
		limits.directory = 64 << 10
		entries, _, err := inspectZIP(context.Background(), bytes.NewReader(data), int64(len(data)), limits)
		if err == nil {
			for _, entry := range entries {
				if err := portablePath(entry.name); err != nil {
					t.Fatal(err)
				}
			}
		}
	})
}
