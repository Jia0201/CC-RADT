//go:build linux

package platform

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"unsafe"
)

func systemPath(path string) string { return path }

func renameNew(fromDir *os.File, from string, toDir *os.File, to string) error {
	var trap uintptr
	switch runtime.GOARCH {
	case "amd64":
		trap = 316
	case "arm64":
		trap = 276
	default:
		return fmt.Errorf("%w: renameat2 architecture", ErrUnsupported)
	}
	a, err := syscall.BytePtrFromString(from)
	if err != nil {
		return err
	}
	b, err := syscall.BytePtrFromString(to)
	if err != nil {
		return err
	}
	_, _, errno := syscall.Syscall6(trap, fromDir.Fd(), uintptr(unsafe.Pointer(a)), toDir.Fd(), uintptr(unsafe.Pointer(b)), 1, 0)
	if errno != 0 {
		return errno
	}
	return nil
}

func localPath(path string) error {
	var st syscall.Statfs_t
	if err := syscall.Statfs(path, &st); err != nil {
		return err
	}
	// Known kernel-local filesystems. Unknown/FUSE/network types fail closed.
	switch uint64(st.Type) {
	case 0xef53, 0x01021994, 0x794c7630, 0x58465342, 0x9123683e, 0x2fc12fc1, 0xf2f52010, 0x858458f6:
		return nil
	default:
		return fmt.Errorf("%w: filesystem type %#x is not known-local", ErrUnsupported, st.Type)
	}
}

func checkMetadata(f *os.File) error {
	if _, err := unixMetadata(f); err != nil {
		return err
	}
	// FS_IOC_GETFLAGS is _IOR('f', 1, long) on the supported 64-bit targets.
	// Extent/index layout is not user metadata; other flags cannot be dropped.
	var flags uint32
	_, _, flagErr := syscall.Syscall(syscall.SYS_IOCTL, f.Fd(), 0x80086601, uintptr(unsafe.Pointer(&flags)))
	if flagErr != 0 {
		var st syscall.Statfs_t
		if err := syscall.Fstatfs(int(f.Fd()), &st); err != nil {
			return err
		}
		if (st.Type != 0x01021994 && st.Type != 0x858458f6) || (flagErr != syscall.ENOTTY && flagErr != syscall.EOPNOTSUPP) {
			return fmt.Errorf("%w: inspect inode flags: %v", ErrUnsupported, flagErr)
		}
	}
	if flags & ^uint32(0x00080000|0x00001000) != 0 {
		return fmt.Errorf("%w: Linux inode flags %#x", ErrUnsupported, flags)
	}
	n, _, errno := syscall.Syscall(syscall.SYS_FLISTXATTR, f.Fd(), 0, 0)
	if errno != 0 {
		return fmt.Errorf("%w: inspect ACL/xattrs: %v", ErrUnsupported, errno)
	}
	if n != 0 {
		return fmt.Errorf("%w: ACL or extended attributes on %q", ErrUnsupported, f.Name())
	}
	return nil
}

func unchanged(a, b os.FileInfo) bool {
	x, y := a.Sys().(*syscall.Stat_t), b.Sys().(*syscall.Stat_t)
	return os.SameFile(a, b) && a.Size() == b.Size() && a.Mode() == b.Mode() && x.Mtim == y.Mtim && x.Ctim == y.Ctim && x.Nlink == y.Nlink && x.Uid == y.Uid && x.Gid == y.Gid
}

func finishMetadata(in, out *os.File, info os.FileInfo) error {
	if err := out.Chmod(info.Mode().Perm()); err != nil {
		return err
	}
	st := info.Sys().(*syscall.Stat_t)
	times := [2]syscall.Timespec{st.Atim, st.Mtim}
	_, _, errno := syscall.Syscall6(syscall.SYS_UTIMENSAT, out.Fd(), 0, uintptr(unsafe.Pointer(&times[0])), 0, 0, 0)
	if errno != 0 {
		return errno
	}
	return nil
}

func effectiveAccess(path string) error {
	// AT_EACCESS makes the check match the credentials used by actual writes.
	return syscall.Faccessat(-100, path, 7, 0x200)
}

func checkStorage(project, transactions string, need uint64) error {
	p, err := os.Lstat(project)
	if err != nil {
		return err
	}
	t, err := os.Lstat(transactions)
	if err != nil {
		return err
	}
	if err = sameDevice(p, t); err != nil {
		return err
	}
	for _, path := range []string{project, transactions} {
		var st syscall.Statfs_t
		if err = syscall.Statfs(path, &st); err != nil {
			return err
		}
		if st.Type != 0xef53 || st.Flags&1 != 0 {
			return fmt.Errorf("%w: writable local ext4 required", ErrUnsupported)
		}
		// ext2/ext3 share ext4's statfs magic; use the kernel mount table to
		// distinguish them and avoid accepting a filesystem based on magic alone.
		if err = requireExt4Mount(path); err != nil {
			return err
		}
		if st.Bsize <= 0 || !spaceEnough(st.Bavail, uint64(st.Bsize), need) {
			return fmt.Errorf("insufficient available storage")
		}
		if err = directoryAccess(path); err != nil {
			return err
		}
	}
	return nil
}

func requireExt4Mount(path string) error {
	data, err := os.ReadFile("/proc/self/mountinfo")
	if err != nil {
		return fmt.Errorf("%w: mount inspection: %v", ErrUnsupported, err)
	}
	best, kind := -1, ""
	for _, line := range strings.Split(string(data), "\n") {
		parts := strings.SplitN(line, " - ", 2)
		if len(parts) != 2 {
			continue
		}
		left, right := strings.Fields(parts[0]), strings.Fields(parts[1])
		if len(left) < 6 || len(right) < 1 {
			continue
		}
		mount := strings.NewReplacer(`\040`, " ", `\011`, "\t", `\012`, "\n", `\134`, `\`).Replace(left[4])
		if within(mount, path) && len(mount) > best {
			best, kind = len(mount), right[0]
		}
	}
	if kind != "ext4" {
		return fmt.Errorf("%w: mounted filesystem is %q, not ext4", ErrUnsupported, kind)
	}
	return nil
}

func checkWriters(project string) error {
	entries, err := os.ReadDir("/proc")
	if err != nil {
		return errors.Join(ErrWriterInspection, err)
	}
	for _, entry := range entries {
		pid, err := strconv.Atoi(entry.Name())
		if err != nil || pid == os.Getpid() {
			continue
		}
		base := filepath.Join("/proc", entry.Name())
		comm, err := os.ReadFile(filepath.Join(base, "comm"))
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				continue
			}
			return fmt.Errorf("%w: process %d name unavailable", ErrWriterInspection, pid)
		}
		if !writerName(string(comm)) {
			continue
		}
		cwd, err := os.Readlink(filepath.Join(base, "cwd"))
		if err != nil {
			if _, gone := os.Stat(base); errors.Is(gone, os.ErrNotExist) {
				continue
			}
			return fmt.Errorf("%w: recognized process %d cwd unavailable", ErrWriterInspection, pid)
		}
		if within(project, cwd) {
			return fmt.Errorf("%w: process %d (%s)", ErrWriterActive, pid, strings.TrimSpace(string(comm)))
		}
	}
	return nil
}
