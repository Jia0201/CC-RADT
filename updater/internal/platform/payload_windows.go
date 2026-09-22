//go:build windows

package platform

import (
	"fmt"
	"os"
)

func checkPayloadSource(f *os.File) error {
	info, err := fileInformation(f)
	if err != nil {
		return err
	}
	const cloudRecall = 0x00001000 | 0x00040000 | 0x00400000
	if info.FileAttributes&cloudRecall != 0 {
		return fmt.Errorf("%w: offline or recall-on-access payload", ErrUnsupported)
	}
	return nil
}
