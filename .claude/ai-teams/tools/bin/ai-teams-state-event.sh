#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ai-teams-lib.sh
source "$SCRIPT_DIR/ai-teams-lib.sh"

usage() {
  cat <<'USAGE'
用法：
  bash tools/bin/ai-teams-state-event.sh --agent <agent> --type <type> --summary <summary> [--task <task-id>] [--status <status>] [--evidence <path>]
  bash tools/bin/ai-teams-state-event.sh --self-test

说明：
  向 shared/events/<date>/ 追加状态事件。事件只记录摘要、路径和证据，不写敏感文件内容。
USAGE
}

slugify() {
  printf "%s" "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/-/g; s/--*/-/g; s/^-//; s/-$//'
}

write_event() {
  local output agent event_type summary task status evidence now stamp slug event_id
  output="$1"
  agent="$2"
  event_type="$3"
  summary="$4"
  task="$5"
  status="$6"
  evidence="$7"
  now="$(ai_teams_now)"
  stamp="$(date "+%Y%m%d-%H%M%S")"
  slug="$(slugify "$summary")"
  [[ -n "$slug" ]] || slug="event"
  event_id="EVENT-${stamp}-${agent}-${slug}"
  {
    printf -- "---\n"
    printf "id: \"%s\"\n" "$event_id"
    printf "title: \"%s\"\n" "$summary"
    printf "type: \"state-event\"\n"
    printf "scope: \"project\"\n"
    printf "owner: \"%s\"\n" "$agent"
    printf "status: active\n"
    printf -- "---\n"
    printf "# 状态事件：%s\n\n" "$summary"
    printf "| 字段 | 内容 |\n"
    printf "|---|---|\n"
    printf "| 事件 ID | %s |\n" "$event_id"
    printf "| 任务 ID | %s |\n" "$task"
    printf "| Agent | %s |\n" "$agent"
    printf "| 事件类型 | %s |\n" "$event_type"
    printf "| 状态 | %s |\n" "$status"
    printf "| 时间 | %s |\n\n" "$now"
    printf "## 摘要\n\n"
    printf -- "- %s\n\n" "$summary"
    printf "## 证据\n\n"
    printf -- "- %s\n\n" "$evidence"
    printf "## 状态板影响\n\n"
    printf -- "- shared/task-plan.md：待 Lead / Plan-PM 汇总\n"
    printf -- "- shared/pipeline-status.md：待 Lead / Plan-PM 汇总\n"
    printf -- "- shared/supervision/current.md：按任务需要汇总\n"
  } > "$output"
}

self_test=0
agent=""
event_type=""
summary=""
task="-"
status="DOING"
evidence="-"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --self-test)
      self_test=1
      shift
      ;;
    --agent)
      agent="${2:-}"
      shift 2
      ;;
    --type)
      event_type="${2:-}"
      shift 2
      ;;
    --summary)
      summary="${2:-}"
      shift 2
      ;;
    --task)
      task="${2:-}"
      shift 2
      ;;
    --status)
      status="${2:-}"
      shift 2
      ;;
    --evidence)
      evidence="${2:-}"
      shift 2
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

if [[ "$self_test" -eq 1 ]]; then
  tmp="$(mktemp)"
  write_event "$tmp" "lead" "self-test" "state event self test" "SELF-TEST" "DOING" "tools/bin/ai-teams-state-event.sh"
  grep -Fq "type: \"state-event\"" "$tmp"
  grep -Fq "state event self test" "$tmp"
  rm -f "$tmp"
  echo "ai-teams-state-event 自检通过"
  exit 0
fi

[[ -n "$agent" && -n "$event_type" && -n "$summary" ]] || { usage; exit 2; }

day_dir="shared/events/$(ai_teams_day)"
mkdir -p "$day_dir"
file_slug="$(slugify "$summary")"
[[ -n "$file_slug" ]] || file_slug="event"
output="$day_dir/$(date "+%Y%m%d-%H%M%S")-$(slugify "$agent")-$file_slug.md"
write_event "$output" "$agent" "$event_type" "$summary" "$task" "$status" "$evidence"
echo "$output"
