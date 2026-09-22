//go:build darwin

package platform

import (
	"bytes"
	"context"
	"errors"
	"maps"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"testing"
	"time"
	"unsafe"
)

func verifyTimes(t *testing.T, a, b os.FileInfo) {
	t.Helper()
	x, y := a.Sys().(*syscall.Stat_t), b.Sys().(*syscall.Stat_t)
	if x.Atimespec != y.Atimespec || x.Mtimespec != y.Mtimespec || x.Birthtimespec != y.Birthtimespec {
		t.Fatalf("timestamps changed: %+v / %+v", x, y)
	}
	if x.Uid != y.Uid || x.Gid != y.Gid {
		t.Fatal("ownership changed")
	}
}

func TestExtendedAttributesPreserved(t *testing.T) {
	root := fixture(t)
	path := filepath.Join(root, "with-xattr")
	writeFixture(t, path, "fixture", 0600)
	if out, err := exec.Command("/usr/bin/xattr", "-w", "user.ccradt.fixture", "fixture", path).CombinedOutput(); err != nil {
		t.Fatalf("fixture xattr: %v: %s", err, out)
	}
	if err := CheckTree(path); err != nil {
		t.Fatal(err)
	}
	dst := filepath.Join(root, "copy")
	if err := CopyFile(path, dst); err != nil {
		t.Fatal(err)
	}
	in, err := os.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer in.Close()
	out, err := os.Open(dst)
	if err != nil {
		t.Fatal(err)
	}
	defer out.Close()
	a, err := extendedAttributes(in, true)
	if err != nil {
		t.Fatal(err)
	}
	b, err := extendedAttributes(out, true)
	if err != nil {
		t.Fatal(err)
	}
	if !maps.EqualFunc(a, b, bytes.Equal) || string(b["user.ccradt.fixture"]) != "fixture" {
		t.Fatal("xattrs did not survive exact copy")
	}
}

func TestACLRejected(t *testing.T) {
	root := fixture(t)
	path := filepath.Join(root, "with-acl")
	writeFixture(t, path, "fixture", 0600)
	if out, err := exec.Command("/bin/chmod", "+a", "everyone allow read", path).CombinedOutput(); err != nil {
		t.Fatalf("fixture ACL: %v: %s", err, out)
	}
	if err := CheckTree(path); !errors.Is(err, ErrUnsupported) {
		t.Fatalf("ACL accepted: %v", err)
	}
}

func TestCWDOutput(t *testing.T) {
	for _, tc := range []struct {
		data string
		want error
	}{
		{"p12\nn/project/subdir\n", ErrWriterActive},
		{"p12\nn/project-other\n", nil},
		{"p12\nn/private/elsewhere\n", nil},
		{"p12\n", ErrWriterInspection},
		{"p99\nn/project\n", ErrWriterInspection},
	} {
		err := inspectCWDOutput("/project", map[int]bool{12: false}, tc.data)
		if !errors.Is(err, tc.want) {
			t.Fatalf("%q: %v, want %v", tc.data, err, tc.want)
		}
	}
}

func TestLargeResourceForkRejected(t *testing.T) {
	root := fixture(t)
	path := filepath.Join(root, "resource-fork")
	writeFixture(t, path, "fixture", 0600)
	f, err := os.OpenFile(path, os.O_RDWR, 0)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	name, _ := syscall.BytePtrFromString("com.apple.ResourceFork")
	data := make([]byte, maxAttributeValue+1)
	_, _, errno := syscall.Syscall6(syscall.SYS_FSETXATTR, f.Fd(), uintptr(unsafe.Pointer(name)), uintptr(unsafe.Pointer(&data[0])), uintptr(len(data)), 0, 0)
	if errno != 0 {
		t.Skipf("fixture resource fork unsupported: %v", errno)
	}
	if err := CheckTree(path); !errors.Is(err, ErrUnsupported) {
		t.Fatalf("unbounded resource fork: %v", err)
	}
}

func TestExitedProcessRecognized(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if processExited(ctx, os.Getpid()) {
		t.Fatal("live process treated as exited")
	}
	cmd := exec.Command("/usr/bin/true")
	if err := cmd.Run(); err != nil {
		t.Fatal(err)
	}
	if !processExited(ctx, cmd.Process.Pid) {
		t.Fatal("reaped process treated as live writer")
	}
}
