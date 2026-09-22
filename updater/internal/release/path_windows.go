//go:build windows

package release

import (
	"fmt"
	"os"
	"path/filepath"
	"syscall"
)

func reparsePoint(info os.FileInfo) bool {
	data, ok := info.Sys().(*syscall.Win32FileAttributeData)
	return !ok || data.FileAttributes&syscall.FILE_ATTRIBUTE_REPARSE_POINT != 0
}

func checkOutputParent(path string) error {
	for {
		info, err := os.Lstat(path)
		if err != nil {
			return err
		}
		if reparsePoint(info) {
			return fmt.Errorf("output parent contains a Windows reparse point")
		}
		parent := filepath.Dir(path)
		if parent == path {
			return nil
		}
		path = parent
	}
}
