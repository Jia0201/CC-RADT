//go:build windows

package release

import (
	"os"
	"syscall"
	"testing"
	"time"
)

type windowsInfo struct{ attributes uint32 }

func (i windowsInfo) Name() string       { return "directory" }
func (i windowsInfo) Size() int64        { return 0 }
func (i windowsInfo) Mode() os.FileMode  { return os.ModeDir | 0700 }
func (i windowsInfo) ModTime() time.Time { return time.Time{} }
func (i windowsInfo) IsDir() bool        { return true }
func (i windowsInfo) Sys() any           { return &syscall.Win32FileAttributeData{FileAttributes: i.attributes} }

func TestWindowsReparseAttributes(t *testing.T) {
	for _, attributes := range []uint32{syscall.FILE_ATTRIBUTE_REPARSE_POINT, syscall.FILE_ATTRIBUTE_DIRECTORY | syscall.FILE_ATTRIBUTE_REPARSE_POINT} {
		if !reparsePoint(windowsInfo{attributes: attributes}) {
			t.Fatal("reparse point not rejected")
		}
	}
	if reparsePoint(windowsInfo{attributes: syscall.FILE_ATTRIBUTE_DIRECTORY}) {
		t.Fatal("ordinary directory rejected")
	}
}
