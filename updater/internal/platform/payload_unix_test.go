//go:build darwin || linux

package platform

import (
	"os"
	"path/filepath"
	"syscall"
	"testing"
)

func TestCopyPayloadLocalOwnership(t *testing.T) {
	root := fixture(t)
	src, dst := filepath.Join(root, "publisher"), filepath.Join(root, "candidate")
	writeFixture(t, src, "fixture", 0444)
	local := filepath.Join(root, "locally-created")
	writeFixture(t, local, "fixture", 0600)
	localInfo, err := os.Stat(local)
	if err != nil {
		t.Fatal(err)
	}
	if err := CopyPayloadFile(src, dst, 0640); err != nil {
		t.Fatal(err)
	}
	info, err := os.Stat(dst)
	if err != nil {
		t.Fatal(err)
	}
	got, want := info.Sys().(*syscall.Stat_t), localInfo.Sys().(*syscall.Stat_t)
	if got.Uid != want.Uid || got.Gid != want.Gid {
		t.Fatalf("payload ownership %d:%d; local policy %d:%d", got.Uid, got.Gid, want.Uid, want.Gid)
	}
}

func TestCopyPayloadRejectsSpecialSources(t *testing.T) {
	root := fixture(t)
	for _, kind := range []string{"fifo", "setuid"} {
		src, dst := filepath.Join(root, kind), filepath.Join(root, kind+"-copy")
		if kind == "fifo" {
			if err := syscall.Mkfifo(src, 0600); err != nil {
				t.Fatal(err)
			}
		} else {
			writeFixture(t, src, "fixture", 0700)
			if err := os.Chmod(src, 0700|os.ModeSetuid); err != nil {
				t.Fatal(err)
			}
		}
		if err := CopyPayloadFile(src, dst, 0600); err == nil {
			t.Fatalf("accepted %s source", kind)
		}
		if _, err := os.Lstat(dst); !os.IsNotExist(err) {
			t.Fatalf("created %s destination", kind)
		}
	}
}
