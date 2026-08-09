#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AI_TEAMS_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CASE="${1:-all}"
FIXTURE_PARENT="${AI_TEAMS_FIXTURE_ROOT:-${TMPDIR:-/tmp}}"
RUN_ROOT="$(mktemp -d "$FIXTURE_PARENT/ai-teams-e2e.XXXXXX")"
RUN_ROOT="$(cd "$RUN_ROOT" && pwd)"
REPORT="$RUN_ROOT/report.md"
failures=0

usage() {
  cat <<'EOF'
用法：bash tools/bin/ai-teams-e2e-fixtures.sh [all|08|09|11|12]

在独立临时目录中执行 E2E-08、E2E-09、E2E-11、E2E-12。
脚本不修改真实项目，也不自动删除测试证据；最终会输出 Fixture 和报告路径。
EOF
}

case "$CASE" in
  all|08|09|11|12) ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac

record() {
  local id="$1"
  local status="$2"
  local detail="$3"
  printf '| %s | %s | %s |\n' "$id" "$status" "$detail" >> "$REPORT"
  if [[ "$status" != "PASS" ]]; then
    failures=$((failures + 1))
  fi
}

copy_brain() {
  local destination="$1"
  local agent_source=""
  mkdir -p "$destination"
  cp -R "$AI_TEAMS_ROOT"/. "$destination"/
  if [[ -d "$AI_TEAMS_ROOT/.claude/agents" ]]; then
    agent_source="$AI_TEAMS_ROOT/.claude/agents"
  elif [[ "$(basename "$(dirname "$AI_TEAMS_ROOT")")" == ".claude" && -d "$(dirname "$AI_TEAMS_ROOT")/agents" ]]; then
    agent_source="$(dirname "$AI_TEAMS_ROOT")/agents"
  fi
  if [[ -n "$agent_source" ]]; then
    mkdir -p "$destination/.claude"
    cp -R "$agent_source" "$destination/.claude/agents"
  fi
}

{
  echo "# AI-Teams 隔离 Fixture E2E 报告"
  echo
  echo "- 执行根：$RUN_ROOT"
  echo "- 源工程：$AI_TEAMS_ROOT"
  echo
  echo "| 场景 | 结果 | 证据 |"
  echo "|---|---|---|"
} > "$REPORT"

if [[ "$CASE" == "all" || "$CASE" == "08" ]]; then
  case_root="$RUN_ROOT/e2e-08"
  brain="$case_root/brain"
  target="$case_root/target"
  mkdir -p "$brain/hooks/scripts" "$target"
  : > "$target/.env"
  input="$(printf '{"hook_event_name":"PreToolUse","tool_name":"Read","tool_input":{"file_path":"%s"}}' "$target/.env")"
  set +e
  output="$(printf '%s' "$input" | AI_TEAMS_ROOT="$brain" node "$AI_TEAMS_ROOT/hooks/scripts/ai-teams-run-hook.mjs" sensitive-file-check.sh 2>&1)"
  status=$?
  set -e
  if [[ "$status" -eq 2 ]] && grep -Fq "阻止读取敏感文件内容" <<<"$output"; then
    record "E2E-08" "PASS" "零字节敏感文件哨兵被 PreToolUse 门禁阻止"
  else
    record "E2E-08" "FAIL" "期望退出码 2，实际 $status；输出：${output//$'\n'/ }"
  fi
fi

if [[ "$CASE" == "all" || "$CASE" == "09" ]]; then
  case_root="$RUN_ROOT/e2e-09"
  brain="$case_root/brain"
  mkdir -p "$brain/tools/bin" "$brain/shared/locks/.locks"
  cp "$AI_TEAMS_ROOT/tools/bin/ai-teams-lock.sh" "$brain/tools/bin/"
  cp "$AI_TEAMS_ROOT/tools/bin/ai-teams-lib.sh" "$brain/tools/bin/"
  chmod +x "$brain/tools/bin/ai-teams-lock.sh"
  (
    cd "$brain"
    set +e
    bash tools/bin/ai-teams-lock.sh acquire --resource "project/api-contracts.md" --owner "dev-backend-service" --task "E2E-09-A" > "$case_root/a.out" 2>&1 &
    pid_a=$!
    bash tools/bin/ai-teams-lock.sh acquire --resource "project/api-contracts.md" --owner "dev-frontend-web" --task "E2E-09-B" > "$case_root/b.out" 2>&1 &
    pid_b=$!
    wait "$pid_a"; echo "$?" > "$case_root/a.status"
    wait "$pid_b"; echo "$?" > "$case_root/b.status"
  )
  status_a="$(cat "$case_root/a.status")"
  status_b="$(cat "$case_root/b.status")"
  if { [[ "$status_a" -eq 0 ]] && [[ "$status_b" -eq 3 ]]; } || \
     { [[ "$status_a" -eq 3 ]] && [[ "$status_b" -eq 0 ]]; }; then
    record "E2E-09" "PASS" "同一资源并发加锁只有一个成功，另一个以冲突码 3 退出"
  else
    record "E2E-09" "FAIL" "并发退出码为 A=$status_a、B=$status_b"
  fi
fi

if [[ "$CASE" == "all" || "$CASE" == "11" ]]; then
  case_root="$RUN_ROOT/e2e-11"
  brain="$case_root/brain"
  copy_brain "$brain"
  prompt_agents=(
    lead pd plan-pm dev-frontend-web dev-frontend-miniapp
    dev-backend-systems dev-backend-service qa memory doc role security-reviewer
  )
  prompt_failures=0
  for prompt_agent in "${prompt_agents[@]}"; do
    agent_case="$case_root/$prompt_agent"
    mkdir -p "$agent_case"
    version="e2e-${prompt_agent}-$(date +%Y%m%d%H%M%S)-$$"
    original="$agent_case/original.json"
    node - "$brain/prompts/registry.json" "$prompt_agent" > "$original" <<'NODE'
const fs = require("fs");
const registry = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
process.stdout.write(JSON.stringify(registry.agents[process.argv[3]].active.system));
NODE
    node "$brain/tools/bin/ai-teams-prompt-evolve.mjs" \
      --root "$brain" --agent "$prompt_agent" --kind system --version "$version" \
      --from-active --risk low --reason "E2E-11 isolated fixture" --write --json > "$agent_case/evolve.json"
    candidate="$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(x.candidateId)' "$agent_case/evolve.json")"
    node "$brain/tools/bin/ai-teams-prompt-eval.mjs" --root "$brain" --candidate "$candidate" --write --json > "$agent_case/eval.json"
    node "$brain/tools/bin/ai-teams-prompt-activate.mjs" --root "$brain" --candidate "$candidate" --approve "lead,qa" --write --json > "$agent_case/activate.json"
    node "$brain/tools/bin/ai-teams-prompt-rollback.mjs" --root "$brain" --agent "$prompt_agent" --kind system --approve lead --compile --write --json > "$agent_case/rollback.json"
    current="$agent_case/current.json"
    node - "$brain/prompts/registry.json" "$prompt_agent" > "$current" <<'NODE'
const fs = require("fs");
const registry = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
process.stdout.write(JSON.stringify(registry.agents[process.argv[3]].active.system));
NODE
    if ! cmp -s "$original" "$current" || ! grep -Fq '"passed": true' "$agent_case/eval.json"; then
      prompt_failures=$((prompt_failures + 1))
    fi
  done
  if [[ "$prompt_failures" -eq 0 ]]; then
    record "E2E-11" "PASS" "12/12 Agent 均完成候选创建、评测、低风险激活和回滚"
  else
    record "E2E-11" "FAIL" "${prompt_failures}/12 Agent 激活回滚后 active 未恢复，或评测未通过"
  fi
fi

if [[ "$CASE" == "all" || "$CASE" == "12" ]]; then
  case_root="$RUN_ROOT/e2e-12"
  project="$case_root/project"
  brain="$project/.claude/ai-teams"
  mkdir -p "$project/src"
  printf '%s\n' '{"name":"ai-teams-clean-start","scripts":{"build":"node src/main.js"},"dependencies":{}}' > "$project/package.json"
  printf '%s\n' 'console.log("fixture");' > "$project/src/main.js"
  before="$(shasum -a 256 "$project/package.json" "$project/src/main.js")"
  copy_brain "$brain"
  (
    cd "$brain"
    bash tools/bin/ai-teams-init-project.sh --target "$project" --write > "$case_root/init.out" 2>&1
  )
  after="$(shasum -a 256 "$project/package.json" "$project/src/main.js")"
  if [[ "$before" == "$after" ]] && [[ ! -d "$project/.git" ]] && \
     grep -Fq "$project" "$brain/project/context.md" && \
     grep -Fq "JavaScript" "$brain/project/context.md"; then
    record "E2E-12" "PASS" "无 Git 新项目完成初始化，项目画像已写入且业务文件哈希不变"
  else
    record "E2E-12" "FAIL" "初始化未写入项目画像、误依赖 Git 或改变了业务文件"
  fi
fi

echo >> "$REPORT"
echo "- 失败数：$failures" >> "$REPORT"
echo "Fixture：$RUN_ROOT"
echo "报告：$REPORT"

if [[ "$failures" -ne 0 ]]; then
  exit 1
fi

echo "AI-Teams 隔离 Fixture E2E 通过"
