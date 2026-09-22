# Platform File Protection

This package uses only the Go standard library. It requires Go 1.24 or newer;
the integrating application must pin a supported, patched toolchain. Cross
compilation is not native OS acceptance and is not a release qualification.

## Contract

| API | Contract |
| --- | --- |
| `ValidateProject` | Existing directory, absolute canonical project root; Unix user-selected root aliases are resolved once. Windows reparse roots, network/device syntax, parent traversal, and nonlocal/unknown volumes are rejected. |
| `ProjectIdentity` | Unix device/inode or Windows volume serial/file index, so aliases of the same directory share a lock/journal identity. |
| `SafePath` | Portable relative paths only; `.` means the canonical root. Missing descendants are allowed, but existing links, reparse points, special entries, file ancestors and multiply linked Unix files are rejected. |
| `CheckTree` | Accepts one regular file or a directory tree. Inspects metadata, not file bodies. Rejects links, special files, multiple file hard links, unsupported ownership/permissions/ACLs, and detected submounts. |
| `CopyFile` | Opens a checked source and exclusively creates a new destination at mode 0600. Preserves supported metadata, checks source identity/size/timestamps before and after copying, fsyncs the destination and parent directory, and never overwrites or deletes a file. |
| `CopyPayloadFile` | Package-only byte copy with explicit uint32 manifest mode (0..0777). Creates exclusively with local ownership, validates source type/links/identity and syncs file/parent. Does not import publisher UID/GID, times, ACLs, xattrs, ADS or flags. |
| `PreserveLocalOwnership` | Applies and verifies a local original's UID/GID on an existing, distinct, regular single-link stage file. Leaves reference untouched and staged bytes/mode/mtime intact; syncs the stage and parent. Windows returns unsupported. |
| `SyncDir` | Syncs an opened directory, returning errors rather than treating an unsupported flush as successful. |
| `MoveNew` | Same-volume kernel no-replace rename: Darwin renameatx_np(RENAME_EXCL), Linux renameat2(RENAME_NOREPLACE), Windows MoveFileEx without replacement/copy flags. Syncs both parents. |
| `Lock` | Nonblocking exclusive OS lock on `.cc-radt-updater.lock` in the supplied directory. Release is idempotent and only unlocks/closes the handle. |
| `CheckStorage` | Read-only checks of existing, disjoint project/transaction directories: local supported filesystem, same volume, available space and effective directory permissions. No probe files. |
| `CheckWriters` | Best-effort identification of recognized executable names with a cwd in the selected project. Returns an explicit inspection error when a selected process cannot be inspected. |

All transactions for one project must pass the same persistent directory to
`Lock`. The lock file must NEVER be removed or replaced, even after release:
unlinking it would allow two different inodes to be locked simultaneously. There
is no PID-age or timeout-based lock stealing. Kernel locks disappear when the
owning process exits; an incomplete journal must independently prevent a new
transaction. The transaction layer, not this package, owns recovery policy.

`CopyFile` may leave its newly created partial destination on any failure. It
never removes that recovery evidence. Callers must journal the destination and
must not retry over it. Recovery should prepare another exclusively named file
and use the transaction layer's checked move protocol. This package does not
delete live objects or backups. `MoveNew` is the explicit move primitive; it has no
overwriting or copy/delete fallback. A rename failure retains the source. If a
post-rename check or sync fails, `ErrMovedNotSynced` indicates that the source was
already moved and must be located through journal/hash reconciliation. Windows
directory flush support is checked before moving, so unsupported durability blocks
the mutation. Filesystem identities can change on cross-volume moves/restores or
remounts; recovery discovery must also inspect persisted project records.

## Package Ownership

`CopyPayloadFile(src, dst string, mode uint32)` is intentionally separate from
`CopyFile`. The former installs trusted distribution payload; the latter preserves
existing local originals, backups and recovery content. Do not route local data,
local extensions or recovery originals through the payload primitive to avoid a
permission failure. The package is opened read-only; its owner, group, permissions
and auxiliary metadata are never rewritten. Reading its bytes can update atime.
The caller verifies package trust and hashes; this primitive does not establish
trust merely because a file is readable.

Payload creation uses 0600 followed by the validated manifest permission bits.
The owner and group come from local file-creation rules, including the destination
parent's group/setgid policy. Source UID/GID do not have to match the current user
and are never passed to chown. Source ACLs/xattrs are not copied; local inherited
metadata is validated, and system-generated metadata such as macOS provenance is
left intact. Publisher timestamps and resource forks are not installed. This
contract must only be used for the package's manifest-defined ordinary data stream.
Oversized modes, source special permission bits, links, hard links and special
files remain rejected. The existing Windows durability/metadata gates still apply.

The three-argument payload API cannot know a replaced live file's local GID.
For every candidate replacing an existing live file, including package payload
and merged JSON, the engine calls `PreserveLocalOwnership(reference, staged)`
after staging, with `reference` pointing to `tx/original/<path>`, before switching.
The caller must supply its transaction-owned stage, never a live destination.
The helper sets/verifies the original's UID/GID without copying its contents,
mode, timestamps or publisher metadata. Aliases, links, missing paths and
non-files are rejected. An assignment or sync failure stops the transaction;
the candidate may already carry the assigned ownership and is not rolled back.
A same-volume
rename retains the staging inode's ownership; it does NOT inherit the live parent
or old file's group. Failure to assign the required local owner/group must block
the switch, never fall back to the publisher's group or silently choose another.
For a genuinely new file, use the local installation parent's ownership policy.
Recovery always uses the faithful original and `CopyFile`; its GID is not replaced
by the package or the current default group.

## Metadata And Storage

- macOS: local APFS for writes. Files preserve UID/GID, permission bits, atime,
  mtime and birth time at nanosecond resolution. ACLs, BSD flags and special mode
  bits are explicitly unsupported. Ordinary xattrs, including provenance and
  resource forks, are copied and verified byte-for-byte through file descriptors.
  Limits are 256 names, 64 KiB of names, 1 MiB per value and 16 MiB of values per
  file. Oversized, unreadable or unwriteable attributes fail closed. CheckTree
  reads attribute names/sizes only. Original directories are retained in place;
  their xattrs are accepted but never modified or copied by this package.
- Linux: local ext4 for writes, checked against both statfs and mountinfo because
  ext2/ext3 share its magic value. Files preserve UID/GID, permission bits, atime
  and mtime at nanosecond resolution. Extended attributes (including POSIX ACLs,
  capabilities and security labels), special mode bits, and user-visible inode
  flags such as immutable, append-only, no-atime and encryption are unsupported and
  rejected. Birth time is not portable through this backend. Known local tmpfs,
  overlay and several other kernel filesystems are accepted for path validation,
  but not by the write-storage gate. Nested different-device mounts are rejected;
  same-device bind mounts and privileged mount changes are outside this boundary.
- Windows: fixed local NTFS storage checks, reparse detection and LockFileEx are
  implemented. Metadata-preserving `CheckTree`/`CopyFile` deliberately return
  `ErrUnsupported`: DACL/SACL and alternate-stream preservation are not yet
  implemented/accepted. Windows apply is therefore DISABLED, not "supported by
  compilation". Directory FlushFileBuffers errors propagate as unsupported.
  The Windows cwd inspection backend also returns an explicit unavailable error.

ctime is not preserved: operating systems update it when a new inode's metadata
is set. Reading source bytes can update its atime; the copy receives the original
pre-read atime. No source timestamps or attributes are rewritten to disguise
that read. Directory permission/time preservation is the transaction layer's
responsibility if it ever starts replacing directories instead of retaining them.

Space checks do not reserve bytes, account for every quota, or predict later
ENOSPC. The caller must include data, xattrs, block rounding, journals and a safety
margin in `needBytes`, and handle every write/sync error. Known cloud directory
names are rejected, but arbitrarily relocated synchronization roots and local
block devices backed by network storage cannot be established from these APIs.
An operator-confirmed nonsynchronized local maintenance location is still required.

## Concurrency And Writer Limits

`SafePath` returns a checked string, NOT a lasting filesystem capability. It is
unsafe to use that string as permission for an unchecked future mutation under a
concurrent writer. Copy and tree operations use anchored `os.Root` handles,
no-follow opens on Unix, inode comparisons and explicit metadata checks, but do
not claim to defend against privileged mount operations, a malicious same-user
process relocating an already-open directory, or arbitrary subsequent mutations.
Only the conventional macOS `/tmp`, `/var`, `/etc` ancestor aliases are accepted
inside standalone file operations; arbitrary link ancestors are refused.

Linux uses `/proc/<pid>/comm` and `/proc/<pid>/cwd`. macOS uses the system
`/bin/ps` executable-name output and one bounded `/usr/sbin/lsof` cwd query. It
does not invoke a shell or inspect argument strings, environments, configuration,
credentials or open file bodies. Executables named Claude, observer, node,
nodejs and bun are treated as potential writers; this deliberately includes
unrelated Node/Bun programs whose cwd is in the project. Missing tools, inaccessible
selected processes and timeouts produce `ErrWriterInspection`, not a clearance.

**A nil CheckWriters result is not proof that the project is idle.** Renamed
executables, interpreter scripts, IDE extensions, processes with a different cwd
and open handles into the project, remote writers, new processes and racing cwd
changes are not exhaustively detected. The user must stop all Claude/observer,
editors and background tasks; the engine must require a maintenance-window
confirmation and recheck file sets/hashes during backup and before switching.
Neither the lock nor a quiet period establishes exclusive access against these
writers. This package never kills a process.

## Verification

Tests create and mutate only `testing.T.TempDir` fixtures. Production code has no
file-removal operation. Run `go test -race ./internal/platform`, and compile its
tests for darwin/linux/windows on amd64/arm64 using `go test -c`. Linux and Windows
still require native test evidence; compile-only checks must not be reported as
runtime, crash-recovery or power-loss validation.

Primary API references: [Go Root](https://go.dev/blog/osroot),
[Darwin filesystem attributes](https://github.com/apple-oss-distributions/xnu/blob/main/bsd/man/man2/getattrlist.2),
[Windows directory flush limitations](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-flushfilebuffers).
