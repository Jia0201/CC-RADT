//go:build darwin || linux

package platform

import "os"

func checkPayloadSource(f *os.File) error {
	info, err := f.Stat()
	if err != nil {
		return err
	}
	// Publisher UID/GID and auxiliary metadata do not belong to payload bytes.
	// Keep the ordinary-file and single-link checks used by other primitives.
	return plainEntry(f.Name(), info)
}
