package platform

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"testing"
)

func TestProjectIdentity(t *testing.T) {
	root := fixture(t)
	first, second := filepath.Join(root, "Project"), filepath.Join(root, "second")
	for _, path := range []string{first, second} {
		if err := os.Mkdir(path, 0700); err != nil {
			t.Fatal(err)
		}
	}
	a, err := ProjectIdentity(first)
	if err != nil {
		t.Fatal(err)
	}
	b, err := ProjectIdentity(second)
	if err != nil {
		t.Fatal(err)
	}
	if a == b || a == "" {
		t.Fatal("distinct directories share identity")
	}
	again, err := ProjectIdentity(first + string(filepath.Separator) + ".")
	if err != nil || again != a {
		t.Fatalf("unstable identity: %q, %v", again, err)
	}
	alias := filepath.Join(root, "PROJECT")
	x, err := os.Stat(alias)
	if errors.Is(err, os.ErrNotExist) {
		return
	}
	if err != nil {
		t.Fatal(err)
	}
	y, _ := os.Stat(first)
	if !os.SameFile(x, y) {
		return
	}
	c, err := ProjectIdentity(alias)
	if err != nil || c != a {
		t.Fatalf("case alias bypass: %q != %q (%v)", a, c, err)
	}
	child := filepath.Join(alias, "nested-transactions")
	if err := os.Mkdir(child, 0700); err != nil {
		t.Fatal(err)
	}
	if err := CheckStorage(first, child, 0); !errors.Is(err, ErrUnsafePath) {
		t.Fatalf("case alias storage nesting: %v", err)
	}
}

func TestMoveNew(t *testing.T) {
	root := fixture(t)
	left, right := filepath.Join(root, "left"), filepath.Join(root, "right")
	for _, path := range []string{left, right} {
		if err := os.Mkdir(path, 0700); err != nil {
			t.Fatal(err)
		}
	}
	from, to := filepath.Join(left, "source"), filepath.Join(right, "destination")
	writeFixture(t, from, "original fixture", 0640)
	before, _ := os.Stat(from)
	err := MoveNew(from, to)
	if runtime.GOOS == "windows" && errors.Is(err, ErrUnsupported) {
		if _, err := os.Stat(from); err != nil {
			t.Fatal("unsupported move lost source", err)
		}
		if _, err := os.Stat(to); !errors.Is(err, os.ErrNotExist) {
			t.Fatal("unsupported move created destination")
		}
		return
	}
	if err != nil {
		t.Fatal(err)
	}
	after, err := os.Stat(to)
	if err != nil {
		t.Fatal(err)
	}
	if !os.SameFile(before, after) {
		t.Fatal("move did not preserve original inode")
	}
	if _, err := os.Stat(from); !errors.Is(err, os.ErrNotExist) {
		t.Fatal("source still present")
	}
	data, err := os.ReadFile(to)
	if err != nil || string(data) != "original fixture" {
		t.Fatal("move changed bytes", err)
	}
}

func TestMoveNewNeverReplaces(t *testing.T) {
	root := fixture(t)
	from, to := filepath.Join(root, "from"), filepath.Join(root, "to")
	writeFixture(t, from, "source fixture", 0600)
	writeFixture(t, to, "target fixture", 0600)
	if err := MoveNew(from, to); err == nil {
		t.Fatal("replaced existing destination")
	}
	a, _ := os.ReadFile(from)
	b, _ := os.ReadFile(to)
	if string(a) != "source fixture" || string(b) != "target fixture" {
		t.Fatal("failed move modified originals")
	}
	dirFrom, dirTo := filepath.Join(root, "dir-from"), filepath.Join(root, "dir-to")
	for _, path := range []string{dirFrom, dirTo} {
		if err := os.Mkdir(path, 0700); err != nil {
			t.Fatal(err)
		}
	}
	if err := MoveNew(dirFrom, dirTo); err == nil {
		t.Fatal("replaced existing empty directory")
	}
	for _, path := range []string{dirFrom, dirTo} {
		if _, err := os.Stat(path); err != nil {
			t.Fatal(err)
		}
	}
}

func TestRenamePrimitiveNoReplace(t *testing.T) {
	root := fixture(t)
	writeFixture(t, filepath.Join(root, "source"), "source fixture", 0600)
	// The primitive must enforce exclusivity even with no preceding Lstat.
	writeFixture(t, filepath.Join(root, "target"), "target fixture", 0600)
	dir, err := os.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	defer dir.Close()
	if err := renameNew(dir, "source", dir, "target"); !errors.Is(err, os.ErrExist) {
		t.Fatalf("kernel no-replace: %v", err)
	}
	a, _ := os.ReadFile(filepath.Join(root, "source"))
	b, _ := os.ReadFile(filepath.Join(root, "target"))
	if string(a) != "source fixture" || string(b) != "target fixture" {
		t.Fatal("primitive overwrote fixture")
	}
}

func TestMoveNewConcurrentDestination(t *testing.T) {
	root := fixture(t)
	const n = 12
	for i := range n {
		writeFixture(t, filepath.Join(root, fmt.Sprintf("source-%d", i)), fmt.Sprintf("fixture-%d", i), 0600)
	}
	start := make(chan struct{})
	errorsByIndex := make([]error, n)
	var wg sync.WaitGroup
	for i := range n {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			errorsByIndex[i] = MoveNew(filepath.Join(root, fmt.Sprintf("source-%d", i)), filepath.Join(root, "target"))
		}()
	}
	close(start)
	wg.Wait()
	winner, wins := -1, 0
	for i, err := range errorsByIndex {
		if err == nil {
			winner, wins = i, wins+1
			continue
		}
		if !errors.Is(err, os.ErrExist) && !(runtime.GOOS == "windows" && errors.Is(err, ErrUnsupported)) {
			t.Fatalf("unexpected failure: %v", err)
		}
		data, err := os.ReadFile(filepath.Join(root, fmt.Sprintf("source-%d", i)))
		if err != nil || string(data) != fmt.Sprintf("fixture-%d", i) {
			t.Fatal("losing source lost", err)
		}
	}
	if runtime.GOOS == "windows" && wins == 0 {
		return
	}
	if wins != 1 {
		t.Fatalf("%d moves won; expected exactly one", wins)
	}
	data, err := os.ReadFile(filepath.Join(root, "target"))
	if err != nil || string(data) != fmt.Sprintf("fixture-%d", winner) {
		t.Fatal("winning target overwritten", err)
	}
}
