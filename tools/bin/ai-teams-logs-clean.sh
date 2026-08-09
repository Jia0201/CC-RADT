#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ai-teams-lib.sh"
ai_teams_require_root
ai_teams_ensure_runtime_dirs

mode="plan"
before=""
after=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --before)
      before="${2:-}"
      shift 2
      ;;
    --after)
      after="${2:-}"
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
    -h|--help)
      cat <<'EOF'
用法：tools/bin/ai-teams-logs-clean.sh [--before YYYY-MM-DD|--after YYYY-MM-DD] [--plan|--apply]

说明：
- 默认只生成清理计划。
- 只处理普通日志：logs/agent、logs/task、logs/command、logs/hook、logs/package。
- 默认保留 audit、upgrade、security、compressed 和当天日志。
EOF
      exit 0
      ;;
    *)
      echo "未知参数：$1" >&2
      exit 2
      ;;
  esac
done

if [[ -z "$before" && -z "$after" ]]; then
  before="$(ai_teams_day)"
fi

stamp="$(ai_teams_stamp)"
day="$(ai_teams_day)"
plan="logs/compressed/${stamp}-clean-plan.md"
archive="logs/compressed/archive/${stamp}-raw.tar.gz"
report="logs/command/logs-clean-${stamp}.md"
targets=(logs/agent logs/task logs/command logs/hook logs/package)
candidate_file="$(mktemp)"

for dir in "${targets[@]}"; do
  [[ -d "$dir" ]] || continue
  find "$dir" -type f -name "*.md" | while read -r file; do
    base="$(basename "$file")"
    [[ "$base" == *"$day"* ]] && continue
    if [[ -n "$before" ]]; then
      file_day="$(date -r "$file" "+%Y-%m-%d")"
      if [[ "$file_day" < "$before" ]]; then
        echo "$file"
      fi
    elif [[ -n "$after" ]]; then
      file_day="$(date -r "$file" "+%Y-%m-%d")"
      if [[ "$file_day" > "$after" ]]; then
        echo "$file"
      fi
    fi
    true
  done
done | sort > "$candidate_file"

cat > "$plan" <<EOF
# 日志清理计划

- 时间：$(ai_teams_now)
- 模式：$mode
- before：${before:-未设置}
- after：${after:-未设置}
- 保留目录：logs/audit、logs/upgrade、logs/security、logs/compressed
- 归档文件：$archive

## 待处理文件

EOF
if [[ -s "$candidate_file" ]]; then
  sed 's/^/- /' "$candidate_file" >> "$plan"
else
  echo "- 无待处理文件。" >> "$plan"
fi

apply_result="not-applied"
if [[ "$mode" == "apply" && -s "$candidate_file" ]]; then
  tar -czf "$archive" -T "$candidate_file"
  while read -r file; do
    rm -f "$file"
  done < "$candidate_file"
  apply_result="archived-and-removed"
elif [[ "$mode" == "apply" ]]; then
  apply_result="nothing-to-clean"
fi

cat > "$report" <<EOF
# 日志清理报告

- 时间：$(ai_teams_now)
- 模式：$mode
- 计划：$plan
- 归档：$archive
- 执行结果：$apply_result

## 说明

- 审计、升级、安全、压缩目录未参与清理。
- 当天日志未参与清理。
EOF

tmp="$(mktemp)"
cat > "$tmp" <<EOF
## 最近日志清理

- 时间：$(ai_teams_now)
- 模式：$mode
- 计划：$plan
- 报告：$report
- 结果：$apply_result
EOF
ai_teams_update_section "logs/compressed/index.md" "logs-clean" "$tmp"
rm -f "$tmp" "$candidate_file"

ai_teams_write_status_event "日志清理${mode}已完成，报告：$report"
cat "$report"
