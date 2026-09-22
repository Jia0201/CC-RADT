//go:build windows

package platform

import (
	"errors"
	"os"
	"testing"
)

func verifyTimes(t *testing.T, a, b os.FileInfo) { t.Helper() }

func TestWindowsWriterInspectionFailsClosed(t *testing.T) {
	if err := CheckWriters(fixture(t)); !errors.Is(err, ErrWriterInspection) {
		t.Fatalf("pretended writer clearance: %v", err)
	}
}
