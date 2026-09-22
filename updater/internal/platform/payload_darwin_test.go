//go:build darwin

package platform

import (
	"bytes"
	"errors"
	"maps"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"testing"
)

func TestCopyPayloadForeignPublisherGroup(t *testing.T) {
	local := fixture(t)
	// Darwin inherits /private/tmp's group without needing chown privilege.
	// Both directories remain owned and cleaned up by testing.T.TempDir.
	t.Setenv("TMPDIR", "/private/tmp")
	t.Run("independent-publisher-directory", func(t *testing.T) {
		testPayloadPublisherGroup(t, local)
	})
}

func testPayloadPublisherGroup(t *testing.T, local string) {
	t.Helper()
	publisher := fixture(t)
	src, dst := filepath.Join(publisher, "payload"), filepath.Join(local, "candidate")
	writeFixture(t, src, "publisher fixture", 0444)
	before, err := os.Stat(src)
	if err != nil {
		t.Fatal(err)
	}
	localInfo, err := os.Stat(local)
	if err != nil {
		t.Fatal(err)
	}
	sourceOwner := before.Sys().(*syscall.Stat_t)
	localOwner := localInfo.Sys().(*syscall.Stat_t)
	if sourceOwner.Gid == localOwner.Gid {
		t.Skip("fixture filesystem did not provide distinct publisher/local groups")
	}
	t.Logf("publisher gid=%d; local gid=%d", sourceOwner.Gid, localOwner.Gid)
	if err := CopyPayloadFile(src, dst, 0640); err != nil {
		t.Fatal(err)
	}
	staged, err := os.Stat(dst)
	if err != nil {
		t.Fatal(err)
	}
	got := staged.Sys().(*syscall.Stat_t)
	if got.Uid != uint32(os.Geteuid()) || got.Gid != localOwner.Gid {
		t.Fatalf("publisher group inherited: %d:%d, local group %d", got.Uid, got.Gid, localOwner.Gid)
	}
	after, err := os.Stat(src)
	if err != nil || !unchanged(before, after) {
		t.Fatal("publisher metadata changed", err)
	}
	// The faithful primitive must still retain the source group or report the
	// permission failure, never quietly switch to the payload ownership policy.
	faithful := filepath.Join(local, "faithful")
	err = CopyFile(src, faithful)
	if err == nil {
		info, statErr := os.Stat(faithful)
		if statErr != nil || info.Sys().(*syscall.Stat_t).Gid != sourceOwner.Gid {
			t.Fatal("CopyFile group preservation changed", statErr)
		}
	} else if !errors.Is(err, syscall.EPERM) && !errors.Is(err, syscall.EACCES) {
		t.Fatalf("unexpected faithful copy failure: %v", err)
	}
}

func TestCopyPayloadDoesNotImportPublisherMetadata(t *testing.T) {
	root := fixture(t)
	src, dst := filepath.Join(root, "publisher"), filepath.Join(root, "candidate")
	writeFixture(t, src, "fixture", 0600)
	if out, err := exec.Command("/usr/bin/xattr", "-w", "user.ccradt.publisher", "publisher-only", src).CombinedOutput(); err != nil {
		t.Fatalf("fixture xattr: %v: %s", err, out)
	}
	if out, err := exec.Command("/bin/chmod", "+a", "everyone allow read", src).CombinedOutput(); err != nil {
		t.Fatalf("fixture ACL: %v: %s", err, out)
	}
	in, err := os.Open(src)
	if err != nil {
		t.Fatal(err)
	}
	defer in.Close()
	attrs, err := extendedAttributes(in, true)
	if err != nil {
		t.Fatal(err)
	}
	before, err := in.Stat()
	if err != nil {
		t.Fatal(err)
	}
	if err := CopyPayloadFile(src, dst, 0640); err != nil {
		t.Fatal(err)
	}
	out, err := os.Open(dst)
	if err != nil {
		t.Fatal(err)
	}
	defer out.Close()
	copied, err := extendedAttributes(out, true)
	if err != nil {
		t.Fatal(err)
	}
	if _, exists := copied["user.ccradt.publisher"]; exists {
		t.Fatal("publisher xattr imported")
	}
	if err := checkMetadata(out); err != nil {
		t.Fatal("publisher ACL imported", err)
	}
	after, err := in.Stat()
	if err != nil || !unchanged(before, after) {
		t.Fatal("publisher inode metadata changed", err)
	}
	remaining, err := extendedAttributes(in, true)
	if err != nil || !maps.EqualFunc(attrs, remaining, bytes.Equal) {
		t.Fatal("publisher xattrs modified", err)
	}
	if err := checkMetadata(in); !errors.Is(err, ErrUnsupported) {
		t.Fatal("publisher ACL removed", err)
	}
}
