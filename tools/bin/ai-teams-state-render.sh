#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ai-teams-lib.sh
source "$SCRIPT_DIR/ai-teams-lib.sh"

usage() {
  cat <<'USAGE'
用法：
  bash tools/bin/ai-teams-state-render.sh --dry-run [--limit <n>]
  bash tools/bin/ai-teams-state-render.sh --write [--limit <n>]
  bash tools/bin/ai-teams-state-render.sh --self-test

说明：
  从 shared/events/ 生成最近状态事件摘要。--write 只更新状态板的 AI-TEAMS 标记区，不覆盖人工维护表格。
USAGE
}

mode="--dry-run"
limit="12"
self_test=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run|--write)
      mode="$1"
      shift
      ;;
    --limit)
      limit="${2:-12}"
      shift 2
      ;;
    --self-test)
      self_test=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "未知参数：$1" >&2
      usage
      exit 2
      ;;
  esac
done

ai_teams_require_root
ai_teams_ensure_runtime_dirs

render_summary() {
  local tmp
  tmp="$1"
  {
    printf "## 最近状态事件摘要\n\n"
    printf -- "- 渲染时间：%s\n" "$(ai_teams_now)"
    printf -- "- 来源：shared/events/\n"
    printf -- "- 规则：security/state-transaction-policy\n\n"
    printf "| 事件文件 | 摘要 |\n"
    printf "|---|---|\n"
    files=()
    while IFS= read -r file; do
      files+=("$file")
    done < <(find shared/events -type f -path "shared/events/*/*.md" -print 2>/dev/null | sort | tail -n "$limit")
    if [[ "${#files[@]}" -eq 0 ]]; then
      printf "| - | 当前无状态事件 |\n"
    else
      for file in "${files[@]}"; do
        title="$(awk -F': ' '$1 == "title" {gsub(/^\"|\"$/, "", $2); print $2; exit}' "$file")"
        [[ -n "${title:-}" ]] || title="$(basename "$file")"
        printf "| %s | %s |\n" "$file" "$title"
      done
    fi
  } > "$tmp"
}

if [[ "$self_test" -eq 1 ]]; then
  tmp="$(mktemp)"
  render_summary "$tmp"
  grep -Fq "最近状态事件摘要" "$tmp"
  rm -f "$tmp"
  echo "ai-teams-state-render 自检通过"
  exit 0
fi

tmp="$(mktemp)"
render_summary "$tmp"

if [[ "$mode" == "--dry-run" ]]; then
  cat "$tmp"
else
  bash tools/bin/ai-teams-lock.sh acquire --resource shared/task-plan.md --owner lead --task state-render >/dev/null
  bash tools/bin/ai-teams-lock.sh acquire --resource shared/pipeline-status.md --owner lead --task state-render >/dev/null
  ai_teams_update_section "shared/task-plan.md" "recent-state-events" "$tmp"
  ai_teams_update_section "shared/pipeline-status.md" "recent-state-events" "$tmp"
  bash tools/bin/ai-teams-lock.sh release --resource shared/pipeline-status.md --owner lead >/dev/null
  bash tools/bin/ai-teams-lock.sh release --resource shared/task-plan.md --owner lead >/dev/null
  echo "已更新状态板最近事件摘要"
fi

rm -f "$tmp"
