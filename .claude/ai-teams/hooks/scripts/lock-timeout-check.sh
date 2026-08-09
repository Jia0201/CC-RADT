#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCK_FILE="$ROOT_DIR/shared/locks/LOCKS.md"
REPORT_DIR="$ROOT_DIR/logs/hook"
DEFAULT_TTL_MINUTES="${AI_TEAMS_LOCK_TTL_MINUTES:-120}"

if [[ ! -f "$LOCK_FILE" ]]; then
  echo "锁超时检查：缺少 shared/locks/LOCKS.md"
  exit 0
fi

mkdir -p "$REPORT_DIR"
timestamp="$(date +%Y%m%d-%H%M%S)"
report="$REPORT_DIR/lock-timeout-check-$timestamp.md"

python3 - "$LOCK_FILE" "$DEFAULT_TTL_MINUTES" "$report" <<'PY'
import datetime as dt
import sys
from pathlib import Path

lock_file = Path(sys.argv[1])
ttl_minutes = int(sys.argv[2])
report = Path(sys.argv[3])
now = dt.datetime.now()

rows = []
for line in lock_file.read_text(encoding="utf-8").splitlines():
    if not line.startswith("|") or "---" in line or "锁 ID" in line:
        continue
    cells = [part.strip() for part in line.strip("|").split("|")]
    if len(cells) < 9:
        continue
    lock_id, file_scope, owner, task, status, created_at, expires_at, released_at, note = cells[:9]
    if status != "active":
        continue
    expired = False
    reason = ""
    if expires_at and expires_at not in {"-", "无", "N/A"}:
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
            try:
                expiry = dt.datetime.strptime(expires_at, fmt)
                if now > expiry:
                    expired = True
                    reason = f"超过登记过期时间 {expires_at}"
                break
            except ValueError:
                continue
    elif created_at and created_at not in {"-", "无", "N/A"}:
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
            try:
                created = dt.datetime.strptime(created_at, fmt)
                if now - created > dt.timedelta(minutes=ttl_minutes):
                    expired = True
                    reason = f"超过默认 TTL {ttl_minutes} 分钟"
                break
            except ValueError:
                continue
    if expired:
        rows.append((lock_id, file_scope, owner, task, created_at, expires_at, reason))

content = [
    "---",
    f'id: "lock-timeout-check-{now.strftime("%Y%m%d-%H%M%S")}"',
    'title: "锁超时检查"',
    'type: "hook-report"',
    'scope: "project"',
    'owner: "lead"',
    'status: "active"',
    "---",
    f"# 锁超时检查 {now.strftime('%Y-%m-%d %H:%M:%S')}",
    "",
]
if rows:
    content += [
        "## 发现超时锁",
        "",
        "| 锁 ID | 文件范围 | 持有人 | 任务 | 创建时间 | 过期时间 | 原因 |",
        "|---|---|---|---|---|---|---|",
    ]
    for row in rows:
        content.append("| " + " | ".join(row) + " |")
    content += [
        "",
        "处理：本 Hook 不自动释放锁。Lead 需要按 security/lock-policy.md 仲裁，确认后修改 shared/locks/LOCKS.md。",
    ]
else:
    content += ["未发现超时 active 锁。"]

report.write_text("\n".join(content) + "\n", encoding="utf-8")
print(f"锁超时检查完成：{report}")
if rows:
    print("发现超时锁，请 Lead 仲裁。")
PY
