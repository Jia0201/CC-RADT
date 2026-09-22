//go:build linux

package platform

import (
	"errors"
	"os"
	"path/filepath"
	"syscall"
	"testing"
	"unsafe"
)

func verifyTimes(t *testing.T, a, b os.FileInfo) {
	t.Helper()
	x, y := a.Sys().(*syscall.Stat_t), b.Sys().(*syscall.Stat_t)
	if x.Atim != y.Atim || x.Mtim != y.Mtim {
		t.Fatalf("timestamps changed: %+v/%+v %+v/%+v", x.Atim, y.Atim, x.Mtim, y.Mtim)
	}
	if x.Uid != y.Uid || x.Gid != y.Gid {
		t.Fatal("ownership changed")
	}
}

func TestExtendedAttributeRejected(t *testing.T) {
	root := fixture(t)
	path := filepath.Join(root, "with-xattr")
	writeFixture(t, path, "fixture", 0600)
	if err := syscall.Setxattr(path, "user.ccradt.fixture", []byte("fixture"), 0); err != nil {
		t.Skipf("xattrs unavailable: %v", err)
	}
	if err := CheckTree(path); !errors.Is(err, ErrUnsupported) {
		t.Fatalf("xattr accepted: %v", err)
	}
}

func TestInodeFlagsRejected(t *testing.T) {
	path := filepath.Join(fixture(t), "nodump")
	writeFixture(t, path, "fixture", 0600)
	f, err := os.OpenFile(path, os.O_RDWR, 0)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	var flags uint32
	_, _, errno := syscall.Syscall(syscall.SYS_IOCTL, f.Fd(), 0x80086601, uintptr(unsafe.Pointer(&flags)))
	if errno != 0 {
		t.Skipf("fixture inode flags unavailable: %v", errno)
	}
	flags |= 0x40 // FS_NODUMP_FL needs no privileged immutable operation.
	_, _, errno = syscall.Syscall(syscall.SYS_IOCTL, f.Fd(), 0x40086602, uintptr(unsafe.Pointer(&flags)))
	if errno != 0 {
		t.Skipf("fixture inode flags cannot be set: %v", errno)
	}
	if err := CheckTree(path); !errors.Is(err, ErrUnsupported) {
		t.Fatalf("inode flags silently dropped: %v", err)
	}
}
