//go:build darwin

package platform

import (
	"bytes"
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"maps"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

func systemPath(path string) string {
	// Only OS-defined aliases are accepted inside standalone file operations.
	// Arbitrary symlink ancestors remain forbidden even if they stay in-tree.
	for _, alias := range []string{"/tmp", "/var", "/etc"} {
		if !strings.HasPrefix(path, alias+"/") {
			continue
		}
		target, err := os.Readlink(alias)
		if err == nil && (target == "private"+alias || target == "/private"+alias) {
			return filepath.Join("/private"+alias, strings.TrimPrefix(path, alias+"/"))
		}
	}
	return path
}

func renameNew(fromDir *os.File, from string, toDir *os.File, to string) error {
	a, err := syscall.BytePtrFromString(from)
	if err != nil {
		return err
	}
	b, err := syscall.BytePtrFromString(to)
	if err != nil {
		return err
	}
	// XNU SYS_RENAMEATX_NP=488, RENAME_EXCL=4 on amd64 and arm64.
	_, _, errno := syscall.Syscall6(488, fromDir.Fd(), uintptr(unsafe.Pointer(a)), toDir.Fd(), uintptr(unsafe.Pointer(b)), 4, 0)
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
	if st.Flags&0x00001000 == 0 { // MNT_LOCAL, Darwin sys/mount.h.
		return fmt.Errorf("%w: nonlocal filesystem", ErrUnsupported)
	}
	return nil
}

type attributeList struct {
	Count     uint16
	Reserved  uint16
	Common    uint32
	Volume    uint32
	Directory uint32
	File      uint32
	Fork      uint32
}

func checkMetadata(f *os.File) error {
	info, err := unixMetadata(f)
	if err != nil {
		return err
	}
	if info.Sys().(*syscall.Stat_t).Flags != 0 {
		return fmt.Errorf("%w: BSD file flags", ErrUnsupported)
	}
	if !info.IsDir() {
		if _, err := extendedAttributes(f, false); err != nil {
			return err
		}
	}
	// ATTR_CMN_EXTENDED_SECURITY returns an attrreference. Only its length is
	// needed: any nonempty ACL is unsupported, without reading ACL principals.
	attrs := attributeList{Count: 5, Common: 0x00400000}
	var buf [4096]byte
	_, _, errno := syscall.Syscall6(syscall.SYS_FGETATTRLIST, f.Fd(), uintptr(unsafe.Pointer(&attrs)), uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)), 0, 0)
	if errno != 0 {
		return fmt.Errorf("%w: inspect ACL: %v", ErrUnsupported, errno)
	}
	if binary.LittleEndian.Uint32(buf[0:4]) < 12 {
		return fmt.Errorf("%w: truncated ACL metadata", ErrUnsupported)
	}
	if binary.LittleEndian.Uint32(buf[8:12]) != 0 {
		return fmt.Errorf("%w: extended ACL on %q", ErrUnsupported, f.Name())
	}
	return nil
}

func unchanged(a, b os.FileInfo) bool {
	x, y := a.Sys().(*syscall.Stat_t), b.Sys().(*syscall.Stat_t)
	return os.SameFile(a, b) && a.Size() == b.Size() && a.Mode() == b.Mode() && x.Mtimespec == y.Mtimespec && x.Ctimespec == y.Ctimespec && x.Nlink == y.Nlink && x.Uid == y.Uid && x.Gid == y.Gid && x.Flags == y.Flags
}

func finishMetadata(in, out *os.File, info os.FileInfo) error {
	if err := copyAttributes(in, out); err != nil {
		return err
	}
	if err := out.Chmod(info.Mode().Perm()); err != nil {
		return err
	}
	st := info.Sys().(*syscall.Stat_t)
	attrs := attributeList{Count: 5, Common: 0x00000200 | 0x00000400 | 0x00001000}
	times := [3]syscall.Timespec{st.Birthtimespec, st.Mtimespec, st.Atimespec}
	_, _, errno := syscall.Syscall6(syscall.SYS_FSETATTRLIST, out.Fd(), uintptr(unsafe.Pointer(&attrs)), uintptr(unsafe.Pointer(&times[0])), unsafe.Sizeof(times), 0, 0)
	if errno != 0 {
		return errno
	}
	return nil
}

const (
	maxAttributeNames = 64 << 10
	maxAttributeValue = 1 << 20
	maxAttributeTotal = 16 << 20
	maxAttributes     = 256
)

// CheckTree queries names and sizes only. CopyFile reads bounded values solely
// for local metadata preservation, including resource forks and provenance.
func extendedAttributes(f *os.File, readValues bool) (map[string][]byte, error) {
	result := make(map[string][]byte)
	n, _, errno := syscall.Syscall6(syscall.SYS_FLISTXATTR, f.Fd(), 0, 0, 0, 0, 0)
	if errno != 0 {
		return nil, fmt.Errorf("%w: inspect xattrs: %v", ErrUnsupported, errno)
	}
	if n == 0 {
		return result, nil
	}
	if n > maxAttributeNames {
		return nil, fmt.Errorf("%w: extended attribute names exceed limit", ErrUnsupported)
	}
	names := make([]byte, n)
	n, _, errno = syscall.Syscall6(syscall.SYS_FLISTXATTR, f.Fd(), uintptr(unsafe.Pointer(&names[0])), uintptr(len(names)), 0, 0, 0)
	if errno != 0 || n != uintptr(len(names)) {
		return nil, errors.Join(ErrChanged, errno)
	}
	if names[len(names)-1] != 0 {
		return nil, ErrChanged
	}
	keys := strings.Split(string(names[:len(names)-1]), "\x00")
	if len(keys) > maxAttributes {
		return nil, fmt.Errorf("%w: too many extended attributes", ErrUnsupported)
	}
	total := uintptr(0)
	for _, key := range keys {
		if key == "" {
			return nil, ErrChanged
		}
		if _, exists := result[key]; exists {
			return nil, ErrChanged
		}
		name, _ := syscall.BytePtrFromString(key)
		n, _, errno = syscall.Syscall6(syscall.SYS_FGETXATTR, f.Fd(), uintptr(unsafe.Pointer(name)), 0, 0, 0, 0)
		if errno != 0 {
			return nil, fmt.Errorf("%w: inspect xattr size: %v", ErrUnsupported, errno)
		}
		if n > maxAttributeValue || total+n > maxAttributeTotal {
			return nil, fmt.Errorf("%w: extended attributes exceed copy limits", ErrUnsupported)
		}
		total += n
		if !readValues {
			result[key] = nil
			continue
		}
		data := make([]byte, n)
		if n > 0 {
			n, _, errno = syscall.Syscall6(syscall.SYS_FGETXATTR, f.Fd(), uintptr(unsafe.Pointer(name)), uintptr(unsafe.Pointer(&data[0])), uintptr(len(data)), 0, 0)
			if errno != 0 || n != uintptr(len(data)) {
				return nil, errors.Join(ErrChanged, errno)
			}
		}
		result[key] = data
	}
	return result, nil
}

func copyAttributes(in, out *os.File) error {
	src, err := extendedAttributes(in, true)
	if err != nil {
		return err
	}
	dst, err := extendedAttributes(out, true)
	if err != nil {
		return err
	}
	for key := range dst {
		if _, exists := src[key]; exists {
			continue
		}
		name, _ := syscall.BytePtrFromString(key)
		// out is this call's O_EXCL-created inode, never a pre-existing file.
		_, _, errno := syscall.Syscall(syscall.SYS_FREMOVEXATTR, out.Fd(), uintptr(unsafe.Pointer(name)), 0)
		if errno != 0 {
			return fmt.Errorf("%w: reconcile new-file xattrs: %v", ErrUnsupported, errno)
		}
	}
	for key, data := range src {
		if existing, exists := dst[key]; exists && bytes.Equal(existing, data) {
			continue
		}
		name, _ := syscall.BytePtrFromString(key)
		var ptr *byte
		if len(data) > 0 {
			ptr = &data[0]
		}
		_, _, errno := syscall.Syscall6(syscall.SYS_FSETXATTR, out.Fd(), uintptr(unsafe.Pointer(name)), uintptr(unsafe.Pointer(ptr)), uintptr(len(data)), 0, 0)
		if errno != 0 {
			return fmt.Errorf("%w: preserve extended attribute: %v", ErrUnsupported, errno)
		}
	}
	dst, err = extendedAttributes(out, true)
	if err != nil {
		return err
	}
	if !maps.EqualFunc(src, dst, bytes.Equal) {
		return fmt.Errorf("%w: extended attributes did not round-trip", ErrUnsupported)
	}
	return nil
}

func effectiveAccess(path string) error {
	if os.Getuid() != os.Geteuid() || os.Getgid() != os.Getegid() {
		return fmt.Errorf("%w: changed effective credentials", ErrUnsupported)
	}
	return syscall.Access(path, 7)
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
		var name []byte
		for _, ch := range st.Fstypename {
			if ch == 0 {
				break
			}
			name = append(name, byte(ch))
		}
		if string(name) != "apfs" || st.Flags&0x00000001 != 0 { // MNT_RDONLY.
			return fmt.Errorf("%w: writable local APFS required", ErrUnsupported)
		}
		if !spaceEnough(st.Bavail, uint64(st.Bsize), need) {
			return fmt.Errorf("insufficient available storage")
		}
		if err = directoryAccess(path); err != nil {
			return err
		}
	}
	return nil
}

func checkWriters(project string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, "/bin/ps", "-axo", "pid=,comm=")
	cmd.Env = []string{"LC_ALL=C", "PATH=/usr/bin:/bin:/usr/sbin:/sbin"}
	data, err := cmd.Output()
	if err != nil {
		return errors.Join(ErrWriterInspection, err)
	}
	var pids []string
	selected := make(map[int]bool)
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		index := strings.IndexAny(line, " \t")
		if index < 0 {
			continue
		}
		pid, err := strconv.Atoi(line[:index])
		if err != nil || pid == os.Getpid() || !writerName(line[index:]) {
			continue
		}
		pids = append(pids, strconv.Itoa(pid))
		selected[pid] = false
	}
	if len(pids) == 0 {
		return nil
	}
	cmd = exec.CommandContext(ctx, "/usr/sbin/lsof", "-a", "-p", strings.Join(pids, ","), "-d", "cwd", "-Fpn")
	cmd.Env = []string{"LC_ALL=C", "PATH=/usr/bin:/bin:/usr/sbin:/sbin"}
	cwdData, commandErr := cmd.Output()
	err = inspectCWDOutput(project, selected, string(cwdData))
	if errors.Is(err, ErrWriterActive) {
		return err
	}
	if errors.Is(err, ErrWriterInspection) {
		for pid, seen := range selected {
			// Signal 0 only tests existence; it sends no signal. A permission
			// denial is not evidence of exit and must remain an inspection error.
			if !seen && processExited(ctx, pid) {
				delete(selected, pid)
			}
		}
		err = inspectCWDOutput(project, selected, string(cwdData))
	}
	if err != nil {
		return err
	}
	if ctx.Err() != nil {
		return errors.Join(ErrWriterInspection, ctx.Err())
	}
	if commandErr != nil {
		var exitErr *exec.ExitError
		// lsof exits 1 if a requested process vanished between the snapshots.
		// All still-live selected processes have a verified cwd at this point.
		if !errors.As(commandErr, &exitErr) || exitErr.ExitCode() != 1 {
			return errors.Join(ErrWriterInspection, commandErr)
		}
	}
	return nil
}

func processExited(ctx context.Context, pid int) bool {
	if errors.Is(syscall.Kill(pid, 0), syscall.ESRCH) {
		return true
	}
	// A zombie still has a PID but cannot write and has no cwd to inspect.
	cmd := exec.CommandContext(ctx, "/bin/ps", "-p", strconv.Itoa(pid), "-o", "stat=")
	cmd.Env = []string{"LC_ALL=C", "PATH=/usr/bin:/bin"}
	data, err := cmd.Output()
	if err == nil {
		return strings.HasPrefix(strings.TrimSpace(string(data)), "Z")
	}
	var exitErr *exec.ExitError
	return ctx.Err() == nil && errors.As(err, &exitErr) && exitErr.ExitCode() == 1 && len(strings.TrimSpace(string(data))) == 0
}

func inspectCWDOutput(project string, selected map[int]bool, data string) error {
	pid := 0
	for _, item := range strings.Split(data, "\n") {
		if strings.HasPrefix(item, "p") {
			pid, _ = strconv.Atoi(strings.TrimPrefix(item, "p"))
			continue
		}
		if _, tracked := selected[pid]; !tracked {
			continue
		}
		if strings.HasPrefix(item, "n/") {
			selected[pid] = true
			if within(project, strings.TrimPrefix(item, "n")) {
				return fmt.Errorf("%w: process %d", ErrWriterActive, pid)
			}
		}
	}
	for pid, seen := range selected {
		if !seen {
			return fmt.Errorf("%w: process %d cwd unavailable", ErrWriterInspection, pid)
		}
	}
	return nil
}
