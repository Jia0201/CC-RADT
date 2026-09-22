package platform

import (
	"errors"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"
)

func fixture(t *testing.T) string {
	t.Helper()
	root, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	return root
}

func writeFixture(t *testing.T, path, data string, mode os.FileMode) {
	t.Helper()
	if err := os.WriteFile(path, []byte(data), mode); err != nil {
		t.Fatal(err)
	}
}

func TestValidateProject(t *testing.T) {
	root := fixture(t)
	got, err := ValidateProject(root + string(filepath.Separator) + ".")
	if err != nil || got != root {
		t.Fatalf("got %q, %v; want %q", got, err, root)
	}
	for _, path := range []string{"", "//server/share", `\\server\share`, `\\?\C:\project`, root + "/../other", root + "/missing", "bad\x00path"} {
		if _, err := ValidateProject(path); err == nil {
			t.Errorf("accepted %q", path)
		}
	}
	file := filepath.Join(root, "file")
	writeFixture(t, file, "fixture", 0600)
	if _, err := ValidateProject(file); err == nil {
		t.Fatal("accepted regular file as project")
	}
}

func TestSafePath(t *testing.T) {
	root := fixture(t)
	for _, rel := range []string{".", "file", "a/b", "space here/\u4e2d\u6587.txt"} {
		got, err := SafePath(root, rel)
		if err != nil || got != filepath.Join(root, filepath.FromSlash(rel)) {
			t.Errorf("%q: %q, %v", rel, got, err)
		}
	}
	for _, rel := range []string{"", "..", "../escape", "a/../../b", "a/../b", "a/./b", "a//b", "/absolute", `C:\absolute`, "C:relative", `a\b`, "name:stream", "x\x00y", "x\ny", "x.", "x ", "NUL", "com1.txt", "LPT9", "CONIN$", "a/PRN"} {
		if _, err := SafePath(root, rel); err == nil {
			t.Errorf("accepted %q", rel)
		}
	}
	writeFixture(t, filepath.Join(root, "file"), "fixture", 0600)
	if _, err := SafePath(root, "file/child"); err == nil {
		t.Fatal("accepted regular-file ancestor")
	}
}

func TestLinksRejected(t *testing.T) {
	root, outside := fixture(t), fixture(t)
	writeFixture(t, filepath.Join(outside, "file"), "outside fixture", 0600)
	if err := os.Symlink(outside, filepath.Join(root, "linked")); err != nil {
		t.Skipf("symlink privilege unavailable: %v", err)
	}
	for _, rel := range []string{"linked", "linked/file", "linked/missing"} {
		if _, err := SafePath(root, rel); err == nil {
			t.Errorf("accepted link path %q", rel)
		}
	}
	if err := CheckTree(root); err == nil {
		t.Fatal("accepted tree with symbolic link")
	}
	if err := CheckTree(filepath.Join(root, "linked")); err == nil {
		t.Fatal("accepted standalone symbolic link")
	}
	if err := CheckTree(filepath.Join(root, "linked", "file")); err == nil {
		t.Fatal("accepted symbolic-link ancestor")
	}
	if err := CopyFile(filepath.Join(outside, "file"), filepath.Join(root, "linked", "new")); err == nil {
		t.Fatal("copied through symbolic-link ancestor")
	}
	if runtime.GOOS == "windows" {
		if release, err := Lock(filepath.Join(root, "linked")); err == nil {
			release()
			t.Fatal("accepted reparse lock root")
		}
	}
}

func TestHardLinksRejected(t *testing.T) {
	root := fixture(t)
	src := filepath.Join(root, "original")
	writeFixture(t, src, "original fixture", 0600)
	if err := os.Link(src, filepath.Join(root, "alias")); err != nil {
		t.Skipf("hard links unavailable: %v", err)
	}
	if err := CheckTree(root); err == nil {
		t.Fatal("accepted multiply linked tree")
	}
	if err := CheckTree(src); err == nil {
		t.Fatal("accepted multiply linked file")
	}
	if err := CopyFile(src, filepath.Join(root, "copy")); err == nil {
		t.Fatal("copied multiply linked file")
	}
	if _, err := os.Lstat(filepath.Join(root, "copy")); !errors.Is(err, os.ErrNotExist) {
		t.Fatal("created destination for rejected source")
	}
}

func TestCheckTreeOrdinary(t *testing.T) {
	root := fixture(t)
	if err := os.Mkdir(filepath.Join(root, "directory"), 0700); err != nil {
		t.Fatal(err)
	}
	file := filepath.Join(root, "directory", "file")
	writeFixture(t, file, "fixture", 0640)
	for _, path := range []string{root, file} {
		err := CheckTree(path)
		if runtime.GOOS == "windows" {
			if !errors.Is(err, ErrUnsupported) {
				t.Fatalf("Windows metadata gate: %v", err)
			}
		} else if err != nil {
			t.Fatal(err)
		}
	}
}

func TestCopyExclusiveAndMetadata(t *testing.T) {
	root := fixture(t)
	src, dst := filepath.Join(root, "source"), filepath.Join(root, "destination")
	writeFixture(t, src, "fixture bytes\x00\n", 0751)
	stamp := time.Unix(1670000000, 123456789)
	if err := os.Chtimes(src, stamp.Add(-time.Hour), stamp); err != nil {
		t.Fatal(err)
	}
	before, err := os.Stat(src)
	if err != nil {
		t.Fatal(err)
	}
	err = CopyFile(src, dst)
	if runtime.GOOS == "windows" {
		if !errors.Is(err, ErrUnsupported) {
			t.Fatalf("Windows metadata gate: %v", err)
		}
		if _, err := os.Lstat(dst); !errors.Is(err, os.ErrNotExist) {
			t.Fatal("unsupported copy created a destination")
		}
		return
	}
	if err != nil {
		t.Fatal(err)
	}
	after, err := os.Stat(dst)
	if err != nil {
		t.Fatal(err)
	}
	if after.Mode() != before.Mode() || !after.ModTime().Equal(before.ModTime()) {
		t.Fatalf("metadata differs: %v/%v, %v/%v", before.Mode(), after.Mode(), before.ModTime(), after.ModTime())
	}
	if os.SameFile(before, after) {
		t.Fatal("copy shares source inode")
	}
	verifyTimes(t, before, after)
	data, err := os.ReadFile(dst)
	if err != nil || string(data) != "fixture bytes\x00\n" {
		t.Fatalf("copied bytes differ: %q, %v", data, err)
	}
	writeFixture(t, src, "changed source", 0751)
	if err := CopyFile(src, dst); !errors.Is(err, os.ErrExist) {
		t.Fatalf("existing destination: %v", err)
	}
	data, _ = os.ReadFile(dst)
	if string(data) != "fixture bytes\x00\n" {
		t.Fatal("destination overwritten")
	}
}

func TestCopyRejectsSymlinkDestination(t *testing.T) {
	root := fixture(t)
	src, dst, victim := filepath.Join(root, "src"), filepath.Join(root, "dst"), filepath.Join(root, "victim")
	writeFixture(t, src, "source fixture", 0600)
	writeFixture(t, victim, "victim fixture", 0600)
	if err := os.Symlink(victim, dst); err != nil {
		t.Skipf("symlink unavailable: %v", err)
	}
	if err := CopyFile(src, dst); err == nil {
		t.Fatal("copied to symlink destination")
	}
	data, _ := os.ReadFile(victim)
	if string(data) != "victim fixture" {
		t.Fatal("symlink target changed")
	}
}

func TestLockExclusivePersistent(t *testing.T) {
	root := fixture(t)
	release, err := Lock(root)
	if err != nil {
		t.Fatal(err)
	}
	defer release()
	if second, err := Lock(root); !errors.Is(err, ErrLocked) {
		if second != nil {
			second()
		}
		t.Fatalf("second lock: %v", err)
	}
	release()
	release()
	if _, err := os.Stat(filepath.Join(root, lockName)); err != nil {
		t.Fatal("release deleted lock file:", err)
	}
	third, err := Lock(root)
	if err != nil {
		t.Fatal(err)
	}
	third()
}

func TestLockSubprocess(t *testing.T) {
	if dir := os.Getenv("CCR_PLATFORM_LOCK_FIXTURE"); dir != "" {
		release, err := Lock(dir)
		if release != nil {
			release()
		}
		if errors.Is(err, ErrLocked) {
			os.Exit(23)
		}
		os.Exit(24)
	}
	root := fixture(t)
	release, err := Lock(root)
	if err != nil {
		t.Fatal(err)
	}
	defer release()
	cmd := exec.Command(os.Args[0], "-test.run=^TestLockSubprocess$")
	cmd.Env = append(os.Environ(), "CCR_PLATFORM_LOCK_FIXTURE="+root)
	err = cmd.Run()
	var exit *exec.ExitError
	if !errors.As(err, &exit) || exit.ExitCode() != 23 {
		t.Fatalf("cross-process lock failed: %v", err)
	}
}

func TestLockRejectsUnsafeFile(t *testing.T) {
	root := fixture(t)
	if err := os.Mkdir(filepath.Join(root, lockName), 0700); err != nil {
		t.Fatal(err)
	}
	if release, err := Lock(root); err == nil {
		release()
		t.Fatal("locked directory as regular file")
	}
}

func TestStorageGuards(t *testing.T) {
	root := fixture(t)
	project, tx := filepath.Join(root, "project"), filepath.Join(root, "transactions")
	for _, p := range []string{project, tx} {
		if err := os.Mkdir(p, 0700); err != nil {
			t.Fatal(err)
		}
	}
	for _, tc := range []struct {
		p, tx string
		n     int64
	}{{project, tx, -1}, {project, project, 0}, {root, tx, 0}, {project, root, 0}, {project, tx, math.MaxInt64}} {
		if err := CheckStorage(tc.p, tc.tx, tc.n); err == nil {
			t.Errorf("accepted %+v", tc)
		}
	}
	before, _ := os.ReadDir(project)
	err := CheckStorage(project, tx, 1)
	if err != nil && !errors.Is(err, ErrUnsupported) {
		t.Fatal(err)
	}
	after, _ := os.ReadDir(project)
	if len(before) != len(after) {
		t.Fatal("storage preflight wrote a probe into project")
	}
	if runtime.GOOS != "windows" {
		if err := os.Chmod(tx, 0500); err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() { _ = os.Chmod(tx, 0700) })
		if err := CheckStorage(project, tx, 0); err == nil {
			t.Fatal("accepted unwritable transactions")
		}
	}
}

func TestStorageMathAndCloudPaths(t *testing.T) {
	for _, tc := range []struct {
		blocks, size, need uint64
		want               bool
	}{{0, 0, 0, false}, {0, 4096, 0, true}, {1, 4096, 4096, true}, {1, 4096, 4097, false}, {math.MaxUint64, 4096, math.MaxUint64, true}} {
		if got := spaceEnough(tc.blocks, tc.size, tc.need); got != tc.want {
			t.Errorf("%+v got %v", tc, got)
		}
	}
	for _, path := range []string{"/home/x/Dropbox/project", "/Users/x/Library/CloudStorage/project", `C:\Users\x\OneDrive - Team\project`} {
		if !cloudPath(path) {
			t.Errorf("missed cloud path %s", path)
		}
	}
	if cloudPath("/home/onedrive-tools/project") {
		t.Fatal("cloud path false positive")
	}
}

func TestWriterClassification(t *testing.T) {
	for _, name := range []string{"claude", "/opt/bin/claude", "observer", "node", "nodejs", "bun", "Claude.exe"} {
		if !writerName(name) {
			t.Errorf("missed %q", name)
		}
	}
	for _, name := range []string{"notclaude", "notes", "python", ""} {
		if writerName(name) {
			t.Errorf("false positive %q", name)
		}
	}
	if within("/project", "/project-other/file") {
		t.Fatal("prefix collision")
	}
	if !within("/project", "/project/subdir") {
		t.Fatal("missed descendant")
	}
}

func TestSyncDir(t *testing.T) {
	root := fixture(t)
	err := SyncDir(root)
	if runtime.GOOS == "windows" {
		if err != nil && !errors.Is(err, ErrUnsupported) {
			t.Fatal(err)
		}
	} else if err != nil {
		t.Fatal(err)
	}
	file := filepath.Join(root, "file")
	writeFixture(t, file, "fixture", 0600)
	if err := SyncDir(file); err == nil {
		t.Fatal("synced file as directory")
	}
}

func FuzzRelativeName(f *testing.F) {
	for _, s := range []string{"a/b", "../escape", `C:\escape`, "CON", "."} {
		f.Add(s)
	}
	f.Fuzz(func(t *testing.T, rel string) {
		if relativeName(rel) != nil {
			return
		}
		if strings.Contains(rel, "\\") || filepath.IsAbs(rel) {
			t.Fatalf("unsafe accepted path %q", rel)
		}
		root := filepath.Join(string(filepath.Separator), "fixture")
		if !within(root, filepath.Join(root, filepath.FromSlash(rel))) {
			t.Fatalf("escaped %q", rel)
		}
	})
}
