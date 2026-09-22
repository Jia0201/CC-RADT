//go:build windows

package platform

import "fmt"

// PreserveLocalOwnership is unavailable until Windows security-descriptor
// preservation is implemented and validated. It never modifies either path.
func PreserveLocalOwnership(reference, staged string) error {
	return fmt.Errorf("%w: Windows local security-descriptor preservation", ErrUnsupported)
}
