//go:build darwin || linux

package platform

import (
	"fmt"
	"os"
	"path/filepath"
	"syscall"
)

// PreserveLocalOwnership applies only a local original's UID/GID to an existing
// staged file, retaining the staged bytes, mode and mtime. The caller must own
// the staging operation and must never pass a live path as staged. The reference
// is opened read-only and is never modified. Failure blocks the transaction;
// there is no fallback ownership or attempt to undo a partially applied change.
func PreserveLocalOwnership(reference, staged string) error {
	reference, err := absolutePath(reference)
	if err != nil {
		return err
	}
	staged, err = absolutePath(staged)
	if err != nil {
		return err
	}
	reference, staged = systemPath(reference), systemPath(staged)
	refPathInfo, err := inspectPath(reference, false)
	if err != nil {
		return err
	}
	stagePathInfo, err := inspectPath(staged, false)
	if err != nil {
		return err
	}
	if !refPathInfo.Mode().IsRegular() || !stagePathInfo.Mode().IsRegular() || os.SameFile(refPathInfo, stagePathInfo) {
		return fmt.Errorf("%w: ownership reference and stage must be distinct regular files", ErrUnsafePath)
	}
	if err = relativeName(filepath.Base(reference)); err != nil {
		return err
	}
	if err = relativeName(filepath.Base(staged)); err != nil {
		return err
	}
	rr, err := openRoot(filepath.Dir(reference))
	if err != nil {
		return err
	}
	defer rr.Close()
	sr, err := openRoot(filepath.Dir(staged))
	if err != nil {
		return err
	}
	defer sr.Close()
	ref, err := openEntry(rr, filepath.Base(reference), os.O_RDONLY, 0)
	if err != nil {
		return err
	}
	defer ref.Close()
	// Fchown and fsync work on a read-only Unix descriptor, so a readonly
	// manifest mode never needs to be temporarily relaxed just to set ownership.
	out, err := openEntry(sr, filepath.Base(staged), os.O_RDONLY, 0)
	if err != nil {
		return err
	}
	defer out.Close()
	beforeRef, err := ref.Stat()
	if err != nil {
		return err
	}
	beforeStage, err := out.Stat()
	if err != nil {
		return err
	}
	if os.SameFile(beforeRef, beforeStage) {
		return ErrUnsafePath
	}
	if !os.SameFile(refPathInfo, beforeRef) || !os.SameFile(stagePathInfo, beforeStage) {
		return ErrChanged
	}
	if beforeStage.Mode()&(os.ModeSetuid|os.ModeSetgid|os.ModeSticky) != 0 {
		return fmt.Errorf("%w: special stage mode may be altered by chown", ErrUnsupported)
	}
	if err = entryStillNamed(rr, filepath.Base(reference), ref); err != nil {
		return err
	}
	if err = entryStillNamed(sr, filepath.Base(staged), out); err != nil {
		return err
	}
	want := beforeRef.Sys().(*syscall.Stat_t)
	current := beforeStage.Sys().(*syscall.Stat_t)
	if current.Uid != want.Uid || current.Gid != want.Gid {
		if err = out.Chown(int(want.Uid), int(want.Gid)); err != nil {
			return fmt.Errorf("preserve local ownership: %w", err)
		}
	}
	afterStage, err := out.Stat()
	if err != nil {
		return err
	}
	got := afterStage.Sys().(*syscall.Stat_t)
	if got.Uid != want.Uid || got.Gid != want.Gid || beforeStage.Size() != afterStage.Size() || beforeStage.Mode() != afterStage.Mode() || !beforeStage.ModTime().Equal(afterStage.ModTime()) {
		return fmt.Errorf("%w: staged ownership, size, mode or mtime differs", ErrChanged)
	}
	afterRef, err := ref.Stat()
	if err != nil {
		return err
	}
	if !unchanged(beforeRef, afterRef) {
		return ErrChanged
	}
	if err = entryStillNamed(rr, filepath.Base(reference), ref); err != nil {
		return err
	}
	if err = entryStillNamed(sr, filepath.Base(staged), out); err != nil {
		return err
	}
	if err = out.Sync(); err != nil {
		return err
	}
	if err = out.Close(); err != nil {
		return err
	}
	return syncRoot(sr)
}
