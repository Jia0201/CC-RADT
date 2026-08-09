#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ai-teams-lib.sh"
ai_teams_require_root
ai_teams_ensure_runtime_dirs

usage() {
  cat <<'EOF'
用法：
  tools/bin/ai-teams-supervision.sh status
  tools/bin/ai-teams-supervision.sh note --agent <agent> --task <task-id> --status <status> --summary <text> [--evidence <path>]

说明：
- status 只读取 shared/supervision/current.md。
- note 追加 shared/events/ 状态事件，并给出需要 Lead/Plan-PM 汇总到监督状态板的提示。
- 本工具不直接覆盖状态板；跨状态板更新必须遵循 security/state-transaction-policy.md。
EOF
}

cmd="${1:-}"
shift || true

case "$cmd" in
  status)
    sed -n '1,220p' shared/supervision/current.md
    ;;
  note)
    agent=""
    task=""
    status=""
    summary=""
    evidence=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --agent)
          agent="${2:-}"
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
        --summary)
          summary="${2:-}"
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
          usage >&2
          exit 2
          ;;
      esac
    done
    if [[ -z "$agent" || -z "$task" || -z "$status" || -z "$summary" ]]; then
      echo "note 需要 --agent、--task、--status、--summary" >&2
      usage >&2
      exit 2
    fi
    event_args=(
      "--type" "supervision"
      "--agent" "$agent"
      "--task" "$task"
      "--status" "$status"
      "--summary" "$summary"
    )
    if [[ -n "$evidence" ]]; then
      event_args+=("--evidence" "$evidence")
    fi
    bash tools/bin/ai-teams-state-event.sh "${event_args[@]}"
    echo
    echo "已追加监督事件。需要更新 shared/supervision/current.md 时，请按 security/state-transaction-policy.md 创建事务后汇总。"
    ;;
  -h|--help|"")
    usage
    ;;
  *)
    echo "未知命令：$cmd" >&2
    usage >&2
    exit 2
    ;;
esac
