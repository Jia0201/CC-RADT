#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/tools/bin/ai-teams-lib.sh"
ai_teams_require_root
ai_teams_ensure_runtime_dirs

report="logs/hook/external-change-check-$(ai_teams_stamp).md"
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi

status_count="$(git status --short 2>/dev/null | awk 'NF { count++ } END { print count + 0 }')"
{
  echo "# 外部变更检查"
  echo
  echo "- 时间：$(ai_teams_now)"
  echo "- 扫描范围：Git 辅助状态，仅记录工作区变更数量，不读取提交正文、提交历史、历史代码或 diff。"
  echo "- 工作区变更数量：${status_count}"
} > "$report"
