//go:build windows

package platform

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"
)

var (
	kernel32                 = syscall.NewLazyDLL("kernel32.dll")
	procLockFileEx           = kernel32.NewProc("LockFileEx")
	procUnlockFileEx         = kernel32.NewProc("UnlockFileEx")
	procGetVolumePathName    = kernel32.NewProc("GetVolumePathNameW")
	procGetVolumeInformation = kernel32.NewProc("GetVolumeInformationW")
	procGetDriveType         = kernel32.NewProc("GetDriveTypeW")
	procGetDiskFreeSpaceEx   = kernel32.NewProc("GetDiskFreeSpaceExW")
	procMoveFileEx           = kernel32.NewProc("MoveFileExW")
)

func systemPath(path string) string { return path }

func objectIdentity(f *os.File) (string, error) {
	info, err := fileInformation(f)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("windows:%08x:%08x%08x", info.VolumeSerialNumber, info.FileIndexHigh, info.FileIndexLow), nil
}

func sameVolumeHandles(a, b *os.File) error {
	x, err := fileInformation(a)
	if err != nil {
		return err
	}
	y, err := fileInformation(b)
	if err != nil {
		return err
	}
	if x.VolumeSerialNumber != y.VolumeSerialNumber {
		return fmt.Errorf("%w: different volumes", ErrUnsupported)
	}
	return nil
}

func renameNew(fromDir *os.File, from string, toDir *os.File, to string) error {
	a, err := syscall.UTF16PtrFromString(filepath.Join(fromDir.Name(), from))
	if err != nil {
		return err
	}
	b, err := syscall.UTF16PtrFromString(filepath.Join(toDir.Name(), to))
	if err != nil {
		return err
	}
	// Neither REPLACE_EXISTING nor COPY_ALLOWED is set: no overwrite and no
	// cross-volume copy/delete fallback. Windows apply remains gated above.
	ok, _, err := procMoveFileEx.Call(uintptr(unsafe.Pointer(a)), uintptr(unsafe.Pointer(b)), 0)
	if ok == 0 {
		return err
	}
	return nil
}

func nativePathSyntax(path string) error {
	volume := filepath.VolumeName(path)
	if len(volume) != 0 && (len(volume) != 2 || volume[1] != ':') {
		return ErrUnsafePath
	}
	if len(volume) != 0 && !filepath.IsAbs(path) {
		return fmt.Errorf("%w: drive-relative path", ErrUnsafePath)
	}
	if strings.Contains(path[len(volume):], ":") {
		return fmt.Errorf("%w: alternate stream syntax", ErrUnsafePath)
	}
	for _, part := range strings.FieldsFunc(path[len(volume):], func(r rune) bool { return r == '/' || r == '\\' }) {
		if part != "." {
			if err := relativeName(part); err != nil {
				return err
			}
		}
	}
	return nil
}

// Unlike Unix's conventional /tmp alias, Windows reparse roots are rejected.
func canonicalProject(path string) (string, error) { return path, nil }

func nativeEntry(path string, info os.FileInfo) error {
	data, ok := info.Sys().(*syscall.Win32FileAttributeData)
	if !ok {
		return ErrUnsupported
	}
	if data.FileAttributes&syscall.FILE_ATTRIBUTE_REPARSE_POINT != 0 {
		return fmt.Errorf("%w: Windows reparse point", ErrUnsafePath)
	}
	return nil
}

func noFollowFlags() int { return 0 }

func fileInformation(f *os.File) (*syscall.ByHandleFileInformation, error) {
	var info syscall.ByHandleFileInformation
	if err := syscall.GetFileInformationByHandle(syscall.Handle(f.Fd()), &info); err != nil {
		return nil, err
	}
	if info.FileAttributes&syscall.FILE_ATTRIBUTE_REPARSE_POINT != 0 {
		return nil, ErrUnsafePath
	}
	if info.FileAttributes&syscall.FILE_ATTRIBUTE_DIRECTORY == 0 && info.NumberOfLinks != 1 {
		return nil, fmt.Errorf("%w: multiple hard links", ErrUnsupported)
	}
	return &info, nil
}

func sameDevice(a, b os.FileInfo) error {
	// Nested Windows volumes require a reparse point, rejected by nativeEntry.
	return nil
}

func checkMetadata(f *os.File) error {
	info, err := fileInformation(f)
	if err != nil {
		return err
	}
	const unsupportedAttributes = 0x200 | 0x800 | 0x1000 | 0x4000 | 0x40000
	if info.FileAttributes&unsupportedAttributes != 0 {
		return fmt.Errorf("%w: sparse, compressed, encrypted or offline file", ErrUnsupported)
	}
	// Do not reduce a Windows DACL/SACL to Go's single readonly mode bit. The
	// first backend deliberately blocks metadata-preserving writes until native
	// security-descriptor and alternate-stream preservation has been validated.
	return fmt.Errorf("%w: Windows ACL/SACL and alternate-stream preservation not yet supported; apply disabled", ErrUnsupported)
}

func unchanged(a, b os.FileInfo) bool {
	x, y := a.Sys().(*syscall.Win32FileAttributeData), b.Sys().(*syscall.Win32FileAttributeData)
	return os.SameFile(a, b) && a.Size() == b.Size() && x.FileAttributes == y.FileAttributes && x.LastWriteTime == y.LastWriteTime
}

func prepareMetadata(in, out *os.File, info os.FileInfo) error { return checkMetadata(in) }

func finishMetadata(in, out *os.File, info os.FileInfo) error {
	data := info.Sys().(*syscall.Win32FileAttributeData)
	if err := syscall.SetFileTime(syscall.Handle(out.Fd()), &data.CreationTime, &data.LastAccessTime, &data.LastWriteTime); err != nil {
		return err
	}
	return out.Chmod(info.Mode().Perm())
}

func checkLockFile(f *os.File) error {
	_, err := fileInformation(f)
	return err
}

func lockFile(f *os.File) error {
	var ov syscall.Overlapped
	ok, _, err := procLockFileEx.Call(f.Fd(), 0x1|0x2, 0, 1, 0, uintptr(unsafe.Pointer(&ov)))
	if ok == 0 {
		if errors.Is(err, syscall.Errno(33)) {
			return errors.Join(ErrLocked, err)
		}
		return fmt.Errorf("LockFileEx: %w", err)
	}
	return nil
}

func unlockFile(f *os.File) {
	var ov syscall.Overlapped
	procUnlockFileEx.Call(f.Fd(), 0, 1, 0, uintptr(unsafe.Pointer(&ov)))
}

func syncDirectory(f *os.File) error {
	if err := syscall.FlushFileBuffers(syscall.Handle(f.Fd())); err != nil {
		return fmt.Errorf("%w: Windows directory flush: %v", ErrUnsupported, err)
	}
	return nil
}

type volumeInfo struct {
	root       string
	serial     uint32
	filesystem string
}

func volume(path string) (volumeInfo, error) {
	var result volumeInfo
	name, err := syscall.UTF16PtrFromString(path)
	if err != nil {
		return result, err
	}
	var root, fsname [32768]uint16
	ok, _, err := procGetVolumePathName.Call(uintptr(unsafe.Pointer(name)), uintptr(unsafe.Pointer(&root[0])), uintptr(len(root)))
	if ok == 0 {
		return result, err
	}
	typeID, _, _ := procGetDriveType.Call(uintptr(unsafe.Pointer(&root[0])))
	if typeID != 3 {
		return result, fmt.Errorf("%w: Windows fixed local drive required", ErrUnsupported)
	}
	var maxComponent, flags uint32
	ok, _, err = procGetVolumeInformation.Call(uintptr(unsafe.Pointer(&root[0])), 0, 0, uintptr(unsafe.Pointer(&result.serial)), uintptr(unsafe.Pointer(&maxComponent)), uintptr(unsafe.Pointer(&flags)), uintptr(unsafe.Pointer(&fsname[0])), uintptr(len(fsname)))
	if ok == 0 {
		return result, err
	}
	result.root, result.filesystem = syscall.UTF16ToString(root[:]), syscall.UTF16ToString(fsname[:])
	if flags&0x80000 != 0 {
		return result, os.ErrPermission
	}
	return result, nil
}

func localPath(path string) error { _, err := volume(path); return err }

func checkStorage(project, transactions string, need uint64) error {
	p, err := volume(project)
	if err != nil {
		return err
	}
	t, err := volume(transactions)
	if err != nil {
		return err
	}
	if p.serial != t.serial || !strings.EqualFold(p.root, t.root) {
		return fmt.Errorf("%w: different volumes", ErrUnsupported)
	}
	if p.filesystem != "NTFS" || t.filesystem != "NTFS" {
		return fmt.Errorf("%w: NTFS required", ErrUnsupported)
	}
	for _, path := range []string{project, transactions} {
		name, err := syscall.UTF16PtrFromString(path)
		if err != nil {
			return err
		}
		var available, total, free uint64
		ok, _, err := procGetDiskFreeSpaceEx.Call(uintptr(unsafe.Pointer(name)), uintptr(unsafe.Pointer(&available)), uintptr(unsafe.Pointer(&total)), uintptr(unsafe.Pointer(&free)))
		if ok == 0 {
			return err
		}
		if available < need {
			return fmt.Errorf("insufficient available storage")
		}
		// Opening a directory for these rights checks the current token/DACL
		// without creating or deleting a probe file.
		const directoryRights = 0x0001 | 0x0002 | 0x0004 | 0x0020 | 0x0040
		h, err := syscall.CreateFile(name, directoryRights, syscall.FILE_SHARE_READ|syscall.FILE_SHARE_WRITE|syscall.FILE_SHARE_DELETE, nil, syscall.OPEN_EXISTING, syscall.FILE_FLAG_BACKUP_SEMANTICS|syscall.FILE_FLAG_OPEN_REPARSE_POINT, 0)
		if err != nil {
			return err
		}
		syscall.CloseHandle(h)
	}
	return nil
}

func checkWriters(project string) error {
	return fmt.Errorf("%w: Windows has no validated cwd inspection backend; require a maintenance window and explicit operator confirmation", ErrWriterInspection)
}
