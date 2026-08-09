#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/tools/bin/ai-teams-lib.sh"
ai_teams_require_root

reason="${1:-关键文件可能已变更}"
tmp="$(mktemp)"
cat > "$tmp" <<EOF
## 索引可能过期

- 时间：$(ai_teams_now)
- 原因：$reason
- 处理：执行任务前优先检查 index/INDEX.md、index/FILES.md、index/PROJECT.md，必要时刷新相关索引。
EOF

ai_teams_update_section "index/STATUS.md" "index-stale" "$tmp"
rm -f "$tmp"

echo "已标记索引可能过期：$reason"
