//go:build darwin || linux

package platform

import (
	"os"
	"path/filepath"
	"runtime"
	"syscall"
	"testing"
)

func TestPreserveLocalOwnership(t *testing.T) {
	reference := filepath.Join(fixture(t), "original")
	writeFixture(t, reference, "original fixture", 0600)
	refBefore, err := os.Stat(reference)
	if err != nil {
		t.Fatal(err)
	}
	if runtime.GOOS == "darwin" {
		t.Setenv("TMPDIR", "/private/tmp")
	}
	t.Run("existing-readonly-stage", func(t *testing.T) {
		staged := filepath.Join(fixture(t), "candidate")
		writeFixture(t, staged, "new candidate fixture", 0444)
		stageBefore, err := os.Stat(staged)
		if err != nil {
			t.Fatal(err)
		}
		want := refBefore.Sys().(*syscall.Stat_t)
		t.Logf("stage gid=%d; reference gid=%d", stageBefore.Sys().(*syscall.Stat_t).Gid, want.Gid)
		if err := PreserveLocalOwnership(reference, staged); err != nil {
			t.Fatal(err)
		}
		after, err := os.Stat(staged)
		if err != nil {
			t.Fatal(err)
		}
		got := after.Sys().(*syscall.Stat_t)
		if got.Uid != want.Uid || got.Gid != want.Gid {
			t.Fatalf("ownership differs: %d:%d != %d:%d", got.Uid, got.Gid, want.Uid, want.Gid)
		}
		if after.Mode() != stageBefore.Mode() || !after.ModTime().Equal(stageBefore.ModTime()) {
			t.Fatal("stage mode or mtime changed")
		}
		data, err := os.ReadFile(staged)
		if err != nil || string(data) != "new candidate fixture" {
			t.Fatal("stage content changed", err)
		}
		refAfter, err := os.Stat(reference)
		if err != nil || !unchanged(refBefore, refAfter) {
			t.Fatal("reference modified", err)
		}
		if err := PreserveLocalOwnership(reference, staged); err != nil {
			t.Fatal("idempotent ownership application failed", err)
		}
	})
}

func TestPreserveLocalOwnershipRejectsUnsafeFiles(t *testing.T) {
	root := fixture(t)
	reference, staged := filepath.Join(root, "reference"), filepath.Join(root, "stage")
	writeFixture(t, reference, "original fixture", 0600)
	writeFixture(t, staged, "candidate fixture", 0640)
	link := filepath.Join(root, "symlink")
	if err := os.Symlink(staged, link); err != nil {
		t.Fatal(err)
	}
	ancestor := filepath.Join(root, "linked-parent")
	if err := os.Symlink(root, ancestor); err != nil {
		t.Fatal(err)
	}
	other := filepath.Join(root, "hardlink-source")
	writeFixture(t, other, "hardlink fixture", 0600)
	if err := os.Link(other, filepath.Join(root, "hardlink-alias")); err != nil {
		t.Fatal(err)
	}
	beforeRef, _ := os.Stat(reference)
	beforeStage, _ := os.Stat(staged)
	for _, pair := range [][2]string{
		{reference, reference}, {reference, root}, {root, staged},
		{reference, link}, {link, staged}, {reference, filepath.Join(ancestor, "stage")},
		{reference, other}, {other, staged}, {reference, filepath.Join(root, "missing")},
	} {
		if err := PreserveLocalOwnership(pair[0], pair[1]); err == nil {
			t.Fatalf("accepted unsafe pair: %v", pair)
		}
	}
	afterRef, _ := os.Stat(reference)
	afterStage, _ := os.Stat(staged)
	if !unchanged(beforeRef, afterRef) || !unchanged(beforeStage, afterStage) {
		t.Fatal("rejected operation changed a file")
	}
}
