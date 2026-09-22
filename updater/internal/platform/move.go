package platform

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// ErrMovedNotSynced means the rename already succeeded but the post-move check
// or a directory sync failed. Do not retry as if the source were still present.
var ErrMovedNotSynced = errors.New("object moved; post-move durability or identity check failed")

// ProjectIdentity identifies the directory object, not its spelling. Case and
// Unicode aliases for the same object therefore share one transaction identity.
// Identity may change after restoring, moving across volumes or remounting a disk;
// recovery discovery must not rely on the current identity alone in those cases.
func ProjectIdentity(path string) (string, error) {
	r, err := openRoot(path)
	if err != nil {
		return "", err
	}
	defer r.Close()
	f, err := openEntry(r, ".", os.O_RDONLY, 0)
	if err != nil {
		return "", err
	}
	defer f.Close()
	return objectIdentity(f)
}

// MoveNew renames a file or directory on one volume with kernel-enforced
// no-replace semantics. It never uses a copy/delete or overwriting fallback.
// Rename failure leaves the source in place. Once rename succeeds, a subsequent
// sync failure is reported as ErrMovedNotSynced; the moved original stays at to.
func MoveNew(from, to string) error {
	from, err := absolutePath(from)
	if err != nil {
		return err
	}
	to, err = absolutePath(to)
	if err != nil {
		return err
	}
	from, to = systemPath(from), systemPath(to)
	if err = relativeName(filepath.Base(from)); err != nil {
		return err
	}
	if err = relativeName(filepath.Base(to)); err != nil {
		return err
	}
	before, err := inspectPath(from, false)
	if err != nil {
		return err
	}
	if _, err = inspectPath(to, true); err != nil {
		return err
	}
	fr, err := openRoot(filepath.Dir(from))
	if err != nil {
		return err
	}
	defer fr.Close()
	tr, err := openRoot(filepath.Dir(to))
	if err != nil {
		return err
	}
	defer tr.Close()
	fd, err := openEntry(fr, ".", os.O_RDONLY, 0)
	if err != nil {
		return err
	}
	defer fd.Close()
	td, err := openEntry(tr, ".", os.O_RDONLY, 0)
	if err != nil {
		return err
	}
	defer td.Close()
	if err = sameVolumeHandles(fd, td); err != nil {
		return err
	}
	actual, err := fr.Lstat(filepath.Base(from))
	if err != nil {
		return err
	}
	if !os.SameFile(before, actual) {
		return ErrChanged
	}
	if err = plainEntry(from, actual); err != nil {
		return err
	}
	// On Windows an unsupported directory flush is discovered before mutation.
	if err = syncDirectory(fd); err != nil {
		return err
	}
	if err = syncDirectory(td); err != nil {
		return err
	}
	if err = renameNew(fd, filepath.Base(from), td, filepath.Base(to)); err != nil {
		return &os.LinkError{Op: "move-new", Old: from, New: to, Err: err}
	}
	actual, verifyErr := tr.Lstat(filepath.Base(to))
	if verifyErr == nil && !os.SameFile(before, actual) {
		verifyErr = ErrChanged
	}
	// Always attempt BOTH syncs after a successful namespace change.
	fromErr, toErr := syncDirectory(fd), syncDirectory(td)
	if err = errors.Join(verifyErr, fromErr, toErr); err != nil {
		return fmt.Errorf("%w: %w", ErrMovedNotSynced, err)
	}
	return nil
}
