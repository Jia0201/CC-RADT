#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ai-teams-lib.sh"
ai_teams_require_root
ai_teams_ensure_runtime_dirs

snapshot=""
mode="plan"
yes=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --snapshot)
      snapshot="${2:-}"
      shift 2
      ;;
    --plan)
      mode="plan"
      shift
      ;;
    --apply)
      mode="apply"
      shift
      ;;
    --yes)
      yes=1
      shift
      ;;
    --list)
      find tools/rollback/snapshots -mindepth 1 -maxdepth 1 -type d | sort
      exit 0
      ;;
    -h|--help)
      cat <<'EOF'
用法：tools/bin/ai-teams-rollback.sh --snapshot 快照目录 [--plan|--apply --yes]

说明：
- 默认只生成回滚计划。
- 真正执行回滚必须同时提供 --apply --yes。
EOF
      exit 0
      ;;
    *)
      echo "未知参数：$1" >&2
      exit 2
      ;;
  esac
done

if [[ -z "$snapshot" || ! -d "$snapshot" ]]; then
  echo "必须提供存在的快照目录：--snapshot PATH" >&2
  exit 1
fi

snapshot="$(cd "$snapshot" && pwd)"
stamp="$(ai_teams_stamp)"
pre_snapshot="tools/rollback/snapshots/pre-rollback-${stamp}"
report="logs/audit/rollback-${stamp}.md"
allowed=(README.md VERSION MANIFEST.json CLAUDE.md .claude agents index memory kb project shared security hooks cron templates skills mcp tools)

mkdir -p "$pre_snapshot"
for item in "${allowed[@]}"; do
  [[ -e "$item" ]] && rsync -a "$item" "$pre_snapshot/"
done

plan_file="$(mktemp)"
for item in "${allowed[@]}"; do
  [[ -e "$snapshot/$item" ]] || continue
  echo "$item"
done > "$plan_file"

apply_result="not-applied"
if [[ "$mode" == "apply" ]]; then
  if [[ "$yes" -ne 1 ]]; then
    echo "执行回滚必须同时提供 --yes。" >&2
    exit 1
  fi
  while read -r item; do
    [[ -n "$item" ]] || continue
    rsync -a "$snapshot/$item" ./
  done < "$plan_file"
  bash tools/bin/ai-teams-check.sh >/dev/null
  apply_result="applied"
fi

cat > "$report" <<EOF
# 回滚报告

- 时间：$(ai_teams_now)
- 回滚快照：$snapshot
- 回滚前快照：$pre_snapshot
- 模式：$mode
- 应用结果：$apply_result

## 回滚范围

EOF
sed 's/^/- /' "$plan_file" >> "$report"
rm -f "$plan_file"

ai_teams_write_status_event "回滚${mode}已完成，报告：$report"
cat "$report"
