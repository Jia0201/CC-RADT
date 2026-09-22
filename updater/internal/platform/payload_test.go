package platform

import (
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"
)

func TestCopyPayloadFile(t *testing.T) {
	root := fixture(t)
	src, dst := filepath.Join(root, "publisher"), filepath.Join(root, "candidate")
	writeFixture(t, src, "signed fixture bytes\x00\n", 0444)
	stamp := time.Unix(1000000000, 123456789)
	if err := os.Chtimes(src, stamp, stamp); err != nil {
		t.Fatal(err)
	}
	before, err := os.Stat(src)
	if err != nil {
		t.Fatal(err)
	}
	err = CopyPayloadFile(src, dst, 0751)
	if runtime.GOOS == "windows" {
		if !errors.Is(err, ErrUnsupported) {
			t.Fatalf("Windows write gate: %v", err)
		}
		if _, err := os.Lstat(dst); !errors.Is(err, os.ErrNotExist) {
			t.Fatal("unsupported durability created a destination")
		}
		return
	}
	if err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(dst)
	if err != nil || string(data) != "signed fixture bytes\x00\n" {
		t.Fatalf("payload bytes changed: %q, %v", data, err)
	}
	staged, err := os.Stat(dst)
	if err != nil {
		t.Fatal(err)
	}
	if staged.Mode().Perm() != 0751 {
		t.Fatalf("manifest mode lost: %v", staged.Mode())
	}
	if staged.ModTime().Equal(before.ModTime()) {
		t.Fatal("publisher timestamp inherited")
	}
	if os.SameFile(before, staged) {
		t.Fatal("payload shares source inode")
	}
	after, err := os.Stat(src)
	if err != nil {
		t.Fatal(err)
	}
	if !unchanged(before, after) {
		t.Fatal("source metadata modified")
	}
	if err := CopyPayloadFile(src, dst, 0600); !errors.Is(err, os.ErrExist) {
		t.Fatalf("existing payload overwritten: %v", err)
	}
	staged, err = os.Stat(dst)
	if err != nil || staged.Mode().Perm() != 0751 {
		t.Fatal("failed retry changed destination permissions", err)
	}
	data, _ = os.ReadFile(dst)
	if string(data) != "signed fixture bytes\x00\n" {
		t.Fatal("failed retry changed destination bytes")
	}
}

func TestCopyPayloadRejectsInvalidMode(t *testing.T) {
	root := fixture(t)
	src, dst := filepath.Join(root, "source"), filepath.Join(root, "candidate")
	writeFixture(t, src, "fixture", 0600)
	for _, mode := range []uint32{01000, 04755, 0100644, 0xffffffff} {
		if err := CopyPayloadFile(src, dst, mode); !errors.Is(err, ErrUnsafePath) {
			t.Fatalf("mode %#o: %v", mode, err)
		}
		if _, err := os.Lstat(dst); !errors.Is(err, os.ErrNotExist) {
			t.Fatal("invalid mode created destination")
		}
	}
}

func TestCopyPayloadRejectsLinks(t *testing.T) {
	root, outside := fixture(t), fixture(t)
	src, dst := filepath.Join(root, "source"), filepath.Join(root, "candidate")
	writeFixture(t, src, "fixture", 0600)
	if err := os.Symlink(outside, filepath.Join(root, "ancestor")); err != nil {
		t.Skipf("symlink privilege unavailable: %v", err)
	}
	if err := CopyPayloadFile(src, filepath.Join(root, "ancestor", "new"), 0600); err == nil {
		t.Fatal("followed destination link ancestor")
	}
	if err := os.Symlink(src, dst); err != nil {
		t.Fatal(err)
	}
	if err := CopyPayloadFile(src, dst, 0600); err == nil {
		t.Fatal("followed destination link")
	}
	if err := CopyPayloadFile(dst, filepath.Join(root, "other"), 0600); err == nil {
		t.Fatal("followed source link")
	}
	if err := os.Link(src, filepath.Join(root, "alias")); err != nil {
		t.Skipf("hard links unavailable: %v", err)
	}
	if err := CopyPayloadFile(src, filepath.Join(root, "hard-copy"), 0600); err == nil {
		t.Fatal("accepted multiple hard links")
	}
	data, _ := os.ReadFile(src)
	if string(data) != "fixture" {
		t.Fatal("source bytes changed")
	}
	if err := CopyPayloadFile(root, filepath.Join(root, "directory-copy"), 0600); !errors.Is(err, ErrUnsafePath) {
		t.Fatalf("directory source: %v", err)
	}
}

func TestCopyPayloadEmptyFile(t *testing.T) {
	root := fixture(t)
	src, dst := filepath.Join(root, "source"), filepath.Join(root, "candidate")
	writeFixture(t, src, "", 0600)
	err := CopyPayloadFile(src, dst, 0640)
	if runtime.GOOS == "windows" && errors.Is(err, ErrUnsupported) {
		return
	}
	if err != nil {
		t.Fatal(err)
	}
	info, err := os.Stat(dst)
	if err != nil || info.Size() != 0 || info.Mode().Perm() != 0640 {
		t.Fatal("empty payload metadata", err)
	}
}
