#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ai-teams-lib.sh"
ai_teams_require_root
ai_teams_ensure_runtime_dirs

target="."
write_index=0
init_index=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      target="${2:-.}"
      shift 2
      ;;
    --write-index)
      write_index=1
      shift
      ;;
    --init)
      init_index=1
      shift
      ;;
    -h|--help)
      cat <<'EOF'
用法：tools/bin/ai-teams-codegraph-status.sh [--target 路径] [--write-index] [--init]

说明：
- 默认只检测 CodeGraph，不初始化，不联网。
- --write-index 会把状态写入 index/FILES.md。
- --init 会在目标项目中尝试执行 CodeGraph 初始化，需本机已有 npx 或 codegraph。
EOF
      exit 0
      ;;
    *)
      echo "未知参数：$1" >&2
      exit 2
      ;;
  esac
done

if [[ ! -d "$target" ]]; then
  echo "目标路径不存在：$target" >&2
  exit 1
fi

target="$(cd "$target" && pwd)"
stamp="$(ai_teams_stamp)"
report="logs/command/codegraph-status-${stamp}.md"
command_state="not-found"
npx_state="not-found"
index_state="missing"
mcp_state="documented"
init_result="not-requested"

if command -v codegraph >/dev/null 2>&1; then
  command_state="$(command -v codegraph)"
fi

if command -v npx >/dev/null 2>&1; then
  npx_state="$(command -v npx)"
fi

if [[ -d "$target/.codegraph" ]]; then
  index_state="present"
fi

if [[ "$init_index" -eq 1 ]]; then
  if command -v codegraph >/dev/null 2>&1; then
    (cd "$target" && codegraph init -i)
    init_result="codegraph init -i completed"
  elif command -v npx >/dev/null 2>&1; then
    (cd "$target" && npx @colbymchenry/codegraph init -i)
    init_result="npx @colbymchenry/codegraph init -i completed"
  else
    init_result="failed: codegraph and npx not found"
  fi
  [[ -d "$target/.codegraph" ]] && index_state="present"
fi

cat > "$report" <<EOF
# CodeGraph 状态报告

- 时间：$(ai_teams_now)
- 目标项目：$target
- codegraph 命令：$command_state
- npx 命令：$npx_state
- 本地索引：$index_state
- MCP 文档：$mcp_state
- 初始化结果：$init_result

## 使用建议

1. 如果本地索引存在，Dev / QA 在代码定位、影响分析和大范围搜索前优先使用 CodeGraph。
2. 如果索引缺失，可在确认目标项目安全后执行 codegraph init -i 或 npx @colbymchenry/codegraph init -i。
3. 如果 MCP 不可用，回退到 index/、rg 和必要的文件读取。
4. .codegraph/ 不进入安装包或精简安装包发布包。
EOF

if [[ "$write_index" -eq 1 ]]; then
  tmp="$(mktemp)"
  cat > "$tmp" <<EOF
## CodeGraph 自动检测

- last_checked: $(ai_teams_now)
- target: $target
- command: $command_state
- npx: $npx_state
- index: $index_state
- mcp: $mcp_state
- report: $report
EOF
  ai_teams_update_section "index/FILES.md" "codegraph-status" "$tmp"
  rm -f "$tmp"
  ai_teams_write_status_event "CodeGraph 状态已检测并写入 index/FILES.md"
fi

cat "$report"
