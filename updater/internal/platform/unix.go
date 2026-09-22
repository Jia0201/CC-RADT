//go:build darwin || linux

package platform

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"syscall"
)

func canonicalProject(path string) (string, error) { return filepath.EvalSymlinks(path) }

func objectIdentity(f *os.File) (string, error) {
	info, err := f.Stat()
	if err != nil {
		return "", err
	}
	st := info.Sys().(*syscall.Stat_t)
	return fmt.Sprintf("unix:%x:%x", st.Dev, st.Ino), nil
}

func sameVolumeHandles(a, b *os.File) error {
	x, err := a.Stat()
	if err != nil {
		return err
	}
	y, err := b.Stat()
	if err != nil {
		return err
	}
	return sameDevice(x, y)
}

func nativePathSyntax(path string) error {
	if strings.ContainsAny(path, "\\:") {
		return fmt.Errorf("%w: foreign volume syntax", ErrUnsafePath)
	}
	return nil
}

func nativeEntry(path string, info os.FileInfo) error {
	st, ok := info.Sys().(*syscall.Stat_t)
	if !ok {
		return ErrUnsupported
	}
	if info.Mode().IsRegular() && st.Nlink != 1 {
		return fmt.Errorf("%w: multiple hard links on %q", ErrUnsupported, path)
	}
	return nil
}

func noFollowFlags() int { return syscall.O_NOFOLLOW | syscall.O_NONBLOCK }

func sameDevice(a, b os.FileInfo) error {
	if a.Sys().(*syscall.Stat_t).Dev != b.Sys().(*syscall.Stat_t).Dev {
		return fmt.Errorf("%w: mount or different volume", ErrUnsupported)
	}
	return nil
}

func checkLockFile(f *os.File) error {
	info, err := f.Stat()
	if err != nil {
		return err
	}
	st := info.Sys().(*syscall.Stat_t)
	if st.Uid != uint32(os.Geteuid()) || info.Mode().Perm()&0077 != 0 {
		return fmt.Errorf("%w: lock must be owner-only", ErrUnsupported)
	}
	return nativeEntry(f.Name(), info)
}

func lockFile(f *os.File) error {
	err := syscall.Flock(int(f.Fd()), syscall.LOCK_EX|syscall.LOCK_NB)
	if errors.Is(err, syscall.EWOULDBLOCK) || errors.Is(err, syscall.EAGAIN) {
		return errors.Join(ErrLocked, err)
	}
	return err
}

func unlockFile(f *os.File) { _ = syscall.Flock(int(f.Fd()), syscall.LOCK_UN) }

func syncDirectory(f *os.File) error { return f.Sync() }

func prepareMetadata(in, out *os.File, info os.FileInfo) error {
	st := info.Sys().(*syscall.Stat_t)
	if err := out.Chown(int(st.Uid), int(st.Gid)); err != nil {
		return fmt.Errorf("preserve ownership: %w", err)
	}
	// An inherited ACL on the new destination must not silently alter access.
	return checkMetadata(out)
}

func unixMetadata(f *os.File) (os.FileInfo, error) {
	info, err := f.Stat()
	if err != nil {
		return nil, err
	}
	if err = plainEntry(f.Name(), info); err != nil {
		return nil, err
	}
	if info.Mode()&(os.ModeSetuid|os.ModeSetgid|os.ModeSticky) != 0 {
		return nil, fmt.Errorf("%w: special permission bits", ErrUnsupported)
	}
	st := info.Sys().(*syscall.Stat_t)
	if st.Uid != uint32(os.Geteuid()) {
		return nil, fmt.Errorf("%w: owner differs from effective user", ErrUnsupported)
	}
	return info, nil
}

func directoryAccess(path string) error {
	info, err := os.Lstat(path)
	if err != nil {
		return err
	}
	// Keep a read-only chmod fixture read-only even when tests run as root.
	if info.Mode().Perm()&0222 == 0 || info.Mode().Perm()&0111 == 0 {
		return os.ErrPermission
	}
	return effectiveAccess(path)
}
