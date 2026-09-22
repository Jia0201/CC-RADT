//go:build !windows

package release

import "os"

func reparsePoint(os.FileInfo) bool  { return false }
func checkOutputParent(string) error { return nil }
