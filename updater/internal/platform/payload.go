package platform

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// CopyPayloadFile installs only package bytes and manifest permissions into an
// exclusively created staging file. The caller must have verified package trust,
// scope and the manifest hash, and must verify the staged hash before switching.
// Unlike CopyFile, this never imports publisher ownership, timestamps, ACLs,
// xattrs, alternate streams or flags. New-file local metadata is left intact.
// It must not be used to back up, restore or preserve a user's existing files.
// A failure may leave a new partial destination; existing files are never removed.
func CopyPayloadFile(src, dst string, mode uint32) error {
	if mode > 0777 {
		return fmt.Errorf("%w: payload mode must contain only permission bits", ErrUnsafePath)
	}
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
	if !before.Mode().IsRegular() || before.Size() < 0 {
		return ErrUnsafePath
	}
	if before.Mode()&(os.ModeSetuid|os.ModeSetgid|os.ModeSticky) != 0 {
		return fmt.Errorf("%w: special permission bits on payload source", ErrUnsafePath)
	}
	if err = checkPayloadSource(in); err != nil {
		return err
	}
	// Detect unsupported directory durability before creating a destination.
	if err = syncRoot(dr); err != nil {
		return err
	}
	out, err := openEntry(dr, filepath.Base(dst), os.O_CREATE|os.O_EXCL|os.O_RDWR, 0600)
	if err != nil {
		return err
	}
	defer out.Close()
	// Validate local inherited metadata without applying source metadata.
	if err = checkMetadata(out); err != nil {
		return err
	}
	if _, err = io.CopyN(out, in, before.Size()); err != nil {
		return err
	}
	after, err := in.Stat()
	if err != nil {
		return err
	}
	if !unchanged(before, after) {
		return ErrChanged
	}
	if err = checkPayloadSource(in); err != nil {
		return err
	}
	if err = out.Chmod(os.FileMode(mode)); err != nil {
		return err
	}
	staged, err := out.Stat()
	if err != nil {
		return err
	}
	if staged.Size() != before.Size() || uint32(staged.Mode().Perm()) != mode {
		return fmt.Errorf("%w: staged payload size or mode differs", ErrChanged)
	}
	if err = checkMetadata(out); err != nil {
		return err
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
