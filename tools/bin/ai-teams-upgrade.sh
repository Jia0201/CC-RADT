#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ai-teams-lib.sh"
ai_teams_require_root
ai_teams_ensure_runtime_dirs

package=""
mode="dry-run"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --package)
      package="${2:-}"
      shift 2
      ;;
    --dry-run)
      mode="dry-run"
      shift
      ;;
    --apply)
      mode="apply"
      shift
      ;;
    -h|--help)
      cat <<'EOF'
用法：tools/bin/ai-teams-upgrade.sh --package 升级包路径 [--dry-run|--apply]

说明：
- 默认 dry-run，只生成变更清单和升级前快照。
- --apply 只同步 AI-Teams 管理范围内文件。
EOF
      exit 0
      ;;
    *)
      echo "未知参数：$1" >&2
      exit 2
      ;;
  esac
done

if [[ -z "$package" || ! -d "$package" ]]; then
  echo "必须提供存在的升级包目录：--package PATH" >&2
  exit 1
fi

package="$(cd "$package" && pwd)"
source_dir="$package"
[[ -d "$package/files" ]] && source_dir="$package/files"
stamp="$(ai_teams_stamp)"
snapshot="tools/rollback/snapshots/upgrade-${stamp}"
report="logs/upgrade/upgrade-${stamp}.md"
allowed=(README.md VERSION MANIFEST.json CLAUDE.md .claude agents index memory kb project shared security hooks cron templates skills mcp tools)

mkdir -p "$snapshot"
for item in "${allowed[@]}"; do
  [[ -e "$item" ]] && rsync -a "$item" "$snapshot/"
done

changes_file="$(mktemp)"
for item in "${allowed[@]}"; do
  if [[ -e "$source_dir/$item" ]]; then
    if [[ -e "$item" ]]; then
      diff -qr "$item" "$source_dir/$item" 2>/dev/null || true
    else
      echo "Only in upgrade package: $item"
    fi
  fi
done > "$changes_file"

conflicts="none"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  conflicts="$(git status --short -- "${allowed[@]}" 2>/dev/null || true)"
  [[ -n "$conflicts" ]] || conflicts="none"
fi

apply_result="not-applied"
if [[ "$mode" == "apply" ]]; then
  for item in "${allowed[@]}"; do
    [[ -e "$source_dir/$item" ]] || continue
    if ai_teams_is_sensitive_path "$source_dir/$item"; then
      echo "跳过敏感路径：$source_dir/$item" >&2
      continue
    fi
    rsync -a \
      --exclude ".env" \
      --exclude ".env.*" \
      --exclude "*.pem" \
      --exclude "*.key" \
      --exclude "node_modules/" \
      --exclude ".cache/" \
      --exclude "tmp/" \
      "$source_dir/$item" ./
  done
  apply_result="applied"
  bash tools/bin/ai-teams-check.sh >/dev/null
fi

cat > "$report" <<EOF
# 升级报告

- 时间：$(ai_teams_now)
- 升级包：$package
- 源目录：$source_dir
- 模式：$mode
- 快照：$snapshot
- 应用结果：$apply_result
- 冲突检查：$conflicts

## 变更清单

EOF
if [[ -s "$changes_file" ]]; then
  sed 's/^/- /' "$changes_file" >> "$report"
else
  echo "- 未发现差异。" >> "$report"
fi

tmp="$(mktemp)"
cat > "$tmp" <<EOF
## 最近升级状态

- 时间：$(ai_teams_now)
- 升级包：$package
- 模式：$mode
- 快照：$snapshot
- 报告：$report
EOF
ai_teams_update_section "project/upgrade-state.md" "upgrade-run" "$tmp"
rm -f "$tmp" "$changes_file"

ai_teams_write_status_event "升级${mode}已完成，报告：$report"
cat "$report"
