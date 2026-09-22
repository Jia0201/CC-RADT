//go:build darwin || linux

package platform

import (
	"bufio"
	"errors"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"testing"
)

func TestWriterProcessDetection(t *testing.T) {
	if os.Getenv("CCR_PLATFORM_WRITER_FIXTURE") == "1" {
		_, _ = os.Stdout.WriteString("ready\n")
		_, _ = io.Copy(io.Discard, os.Stdin)
		return
	}
	root := fixture(t)
	// Copy only the test framework's generated executable into its own fixture.
	executable, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	in, err := os.Open(executable)
	if err != nil {
		t.Fatal(err)
	}
	defer in.Close()
	binary := filepath.Join(root, "observer")
	out, err := os.OpenFile(binary, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0700)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = io.Copy(out, in); err != nil {
		out.Close()
		t.Fatal(err)
	}
	if err = out.Close(); err != nil {
		t.Fatal(err)
	}
	cmd := exec.Command(binary, "-test.run=^TestWriterProcessDetection$")
	cmd.Dir = root
	cmd.Env = append(os.Environ(), "CCR_PLATFORM_WRITER_FIXTURE=1")
	stdin, err := cmd.StdinPipe()
	if err != nil {
		t.Fatal(err)
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		t.Fatal(err)
	}
	if err = cmd.Start(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = stdin.Close(); _ = cmd.Wait() })
	if line, err := bufio.NewReader(stdout).ReadString('\n'); err != nil || line != "ready\n" {
		t.Fatalf("writer fixture startup: %q, %v", line, err)
	}
	if err = CheckWriters(root); !errors.Is(err, ErrWriterActive) {
		t.Fatalf("missed active observer fixture: %v", err)
	}
}

func TestFIFORejectedWithoutBlocking(t *testing.T) {
	root := fixture(t)
	path := filepath.Join(root, "fifo")
	if err := syscall.Mkfifo(path, 0600); err != nil {
		t.Fatal(err)
	}
	if err := CheckTree(path); err == nil {
		t.Fatal("accepted FIFO")
	}
	if err := CheckTree(root); err == nil {
		t.Fatal("accepted tree containing FIFO")
	}
	if err := CopyFile(path, filepath.Join(root, "copy")); err == nil {
		t.Fatal("copied FIFO")
	}
}

func TestSpecialModeRejected(t *testing.T) {
	root := fixture(t)
	path := filepath.Join(root, "setuid")
	writeFixture(t, path, "fixture", 0700)
	if err := os.Chmod(path, 0700|os.ModeSetuid); err != nil {
		t.Fatal(err)
	}
	if err := CheckTree(path); err == nil {
		t.Fatal("accepted setuid metadata")
	}
}

func TestRootAliasCanonicalized(t *testing.T) {
	root := fixture(t)
	alias := filepath.Join(fixture(t), "alias")
	if err := os.Symlink(root, alias); err != nil {
		t.Fatal(err)
	}
	got, err := ValidateProject(alias)
	if err != nil || got != root {
		t.Fatalf("root alias: %q, %v", got, err)
	}
}

func TestLockRejectsLinkAndBroadPermissions(t *testing.T) {
	root := fixture(t)
	path := filepath.Join(root, lockName)
	writeFixture(t, path, "existing fixture lock", 0644)
	if release, err := Lock(root); err == nil {
		release()
		t.Fatal("accepted publicly accessible lock")
	}
	other := fixture(t)
	if err := os.Symlink(path, filepath.Join(other, lockName)); err != nil {
		t.Fatal(err)
	}
	if release, err := Lock(other); err == nil {
		release()
		t.Fatal("accepted linked lock")
	}
}
