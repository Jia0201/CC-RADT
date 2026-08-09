#!/usr/bin/env bash
set -euo pipefail

packaging_enabled=0
if [[ -f "tools/bin/ai-teams-package.sh" && -f "tools/commands/ai/package-formal.md" && -f "tools/commands/ai/package-simplify.md" ]]; then
  packaging_enabled=1
fi

claude_settings_file=".claude/settings.json"
claude_local_example_file=".claude/settings.local.example.json"
project_mcp_file=".mcp.json"
formal_claude_subdir=0
if [[ "$packaging_enabled" -ne 1 && ! -d ".claude" && -f "../settings.json" ]]; then
  formal_claude_subdir=1
  claude_settings_file="../settings.json"
  claude_local_example_file="../settings.local.example.json"
  project_mcp_file="../../.mcp.json"
fi

required_files=(
  "README.md"
  "README.en.md"
  "VERSION"
  "MANIFEST.json"
  "CLAUDE.md"
  ".mcp.json"
  ".claude/settings.json"
  ".claude/settings.local.example.json"
  ".claude/agents/lead.md"
  ".claude/agents/pd.md"
  ".claude/agents/plan-pm.md"
  ".claude/agents/dev-frontend-web.md"
  ".claude/agents/dev-frontend-miniapp.md"
  ".claude/agents/dev-backend-systems.md"
  ".claude/agents/dev-backend-service.md"
  ".claude/agents/qa.md"
  ".claude/agents/memory.md"
  ".claude/agents/doc.md"
  ".claude/agents/role.md"
  ".claude/agents/security-reviewer.md"
  ".claude/rules/ai-teams-router.md"
  ".claude/rules/ai-teams-frontend.md"
  ".claude/rules/ai-teams-backend-service.md"
  ".claude/rules/ai-teams-backend-systems.md"
  ".claude/rules/ai-teams-governance.md"
  ".claude/rules/ai-teams-custom.md"
  "agents/index.md"
  "rule/README.md"
  "rule/index.md"
  "rule/routing.md"
  "rule/agents/index.md"
  "rule/tasks/index.md"
  "rule/custom/index.md"
  "rule/custom/agents/index.md"
  "rule/custom/project/index.md"
  "rule/custom/security/index.md"
  "rule/project/index.md"
  "rule/project/structure.md"
  "rule/project/files.md"
  "rule/project/frontend/index.md"
  "rule/project/frontend/ui.md"
  "rule/project/frontend/syntax.md"
  "rule/project/backend/index.md"
  "rule/project/backend/api.md"
  "rule/project/backend/syntax.md"
  "rule/project/decisions.md"
  "rule/project/plans.md"
  "rule/catalog/index.md"
  "rule/catalog/directories.md"
  "rule/catalog/files.md"
  "rule/engineering/index.md"
  "rule/engineering/structure.md"
  "rule/engineering/workflow.md"
  "rule/security/index.md"
  "rule/shared/index.md"
  "rule/memory/index.md"
  "rule/knowledge/index.md"
  "rule/tools/index.md"
  "tools/commands/index.md"
  "index/README.md"
  "index/INDEX.md"
  "index/PROJECT.md"
  "index/AGENTS.md"
  "index/COMMANDS.md"
  "index/FILES.md"
  "index/STATUS.md"
  "index/ENTRY.md"
  "index/NAVIGATION.md"
  "index/READING-MODES.md"
  "index/CODEGRAPH.md"
  "index/REQUIREMENTS.md"
  "project/index.md"
  "project/PROJECT.md"
  "project/context.md"
  "project/change-log.md"
  "project/ui-style.md"
  "project/api-contracts.md"
  "project/imported-rules.md"
  "project/rules/index.md"
  "project/graph.md"
  "project/requirements/index.md"
  "project/plans/index.md"
  "playbook.md"
  "shared/escalations/retry-flowback.md"
  "shared/escalations/ESCALATION_TEMPLATE.md"
  "shared/tasks/TASK_TEMPLATE.md"
  "shared/tasks/EXECUTION_PLAN_TEMPLATE.md"
  "shared/handoffs/HANDOFF_TEMPLATE.md"
  "shared/locks/LOCKS.md"
  "shared/locks/LOCK_TEMPLATE.md"
  "shared/events/EVENT_TEMPLATE.md"
  "shared/transactions/index.md"
  "shared/transactions/TRANSACTION_TEMPLATE.md"
  "shared/contracts/index.md"
  "shared/contracts/API_CONTRACT_TEMPLATE.md"
  "shared/task-plan.md"
  "shared/pipeline-status.md"
  "shared/escalations/index.md"
  "shared/escalations/pending/index.md"
  "shared/escalations/resolved/index.md"
  "shared/supervision/index.md"
  "shared/supervision/SUPERVISION_TEMPLATE.md"
  "shared/supervision/current.md"
  "shared/events/index.md"
  "security/index.md"
  "security/adr.md"
  "security/file-ownership.md"
  "security/sensitive-files.md"
  "security/delete-policy.md"
  "security/task-policy.md"
  "security/rule-policy.md"
  "security/project-policy.md"
  "security/runtime-maintenance-policy.md"
  "security/development-policy.md"
  "security/development-frontend-web-policy.md"
  "security/development-frontend-miniapp-policy.md"
  "security/development-backend-systems-policy.md"
  "security/development-backend-service-policy.md"
  "security/mcp-policy.md"
  "security/interface-contract-policy.md"
  "security/lock-policy.md"
  "security/state-policy.md"
  "security/state-transaction-policy.md"
  "security/escalation-policy.md"
  "security/workspace-policy.md"
  "security/context-compression-policy.md"
  "security/prompt-policy.md"
  "security/prompt-injection-policy.md"
  "security/prompt-evolution-policy.md"
  "security/agent-playbooks/index.md"
  "project/adr/index.md"
  "project/adr/template.md"
  "project/adr/accepted/ADR-0001-agent-directory.md"
  "project/adr/accepted/ADR-0002-command-location.md"
  "project/adr/accepted/ADR-0003-memory-layering.md"
  "project/adr/accepted/ADR-0005-retry-flowback.md"
  "project/adr/accepted/ADR-0006-lightweight-lock.md"
  "project/adr/accepted/ADR-0007-lightweight-index.md"
  "project/adr/accepted/ADR-0008-lead-takeover-heartbeat.md"
  "project/adr/accepted/ADR-0009-rule-routing.md"
  "project/adr/accepted/ADR-0010-workflow-selector.md"
  "project/adr/accepted/ADR-0011-prompt-evolution-system.md"
  "prompts/index.md"
  "prompts/graph.md"
  "prompts/registry.json"
  "prompts/common/system-core.prompt.md"
  "prompts/common/task-contract.prompt.md"
  "prompts/common/retry-guard.prompt.md"
  "prompts/schemas/prompt.schema.json"
  "prompts/schemas/variables.schema.json"
  "prompts/schemas/result.schema.json"
  "prompts/schemas/eval-case.schema.json"
  "templates/registry.json"
  "templates/project-graph/template.md"
  "templates/project-graph/README.md"
  "templates/project-graph/example.md"
  "templates/project-graph/schema.json"
  "skills/index.md"
  "skills/shared/index.md"
  "mcp/index.md"
  "mcp/shared/index.md"
  "mcp/agents/index.md"
  "mcp/registry.json"
  "mcp/claude-project.mcp.json"
  "mcp/optional-servers.mcp.example.json"
  "skills/registry.json"
  "hooks/index.md"
  "hooks/scripts/ai-teams-run-hook.sh"
  "hooks/scripts/ai-teams-run-hook.mjs"
  "hooks/scripts/agent-heartbeat.mjs"
  "hooks/scripts/hook-output.mjs"
  "hooks/scripts/prompt-evolution-event.mjs"
  "hooks/scripts/prompt-contract-check.mjs"
  "hooks/scripts/ai-teams-run-hook.ps1"
  "hooks/scripts/ai-teams-user-prompt-submit.sh"
  "hooks/configs/context-compression.example.env"
  "hooks/templates/context-compression-notice.md"
  "cron/schedules.md"
  "memory/MEMORY.md"
  "memory/index.md"
  "memory/native-claude-memory-audit.md"
  "memory/context-compression.md"
  "memory/archive/index.md"
  "agents/memory/memorys/index.md"
  "kb/index.md"
  "kb/graph.md"
  "kb/agents/index.md"
  "shared/index.md"
  "shared/supervision/heartbeat.md"
  "shared/supervision/heartbeat-current.md"
  "shared/protocol.md"
  "shared/broadcasts/BROADCAST_PROTOCOL.md"
  "shared/decisions/DECISION_TEMPLATE.md"
  "shared/prompt-evolution/index.md"
  "shared/prompt-evolution/active-run.md"
  "shared/prompt-evolution/events/index.md"
  "shared/prompt-evolution/events/PROMPT_EVENT_TEMPLATE.md"
  "shared/prompt-evolution/candidates/index.md"
  "shared/prompt-evolution/candidates/PROMPT_CANDIDATE_TEMPLATE.md"
  "shared/prompt-evolution/reviews/index.md"
  "shared/prompt-evolution/reviews/PROMPT_REVIEW_TEMPLATE.md"
  "memory/conversations/index.md"
  "templates/kb-file/markdown-template.md"
  "mcp/codegraph/index.md"
  "mcp/codegraph/tools.md"
  "mcp/codegraph/agent-policy.md"
  "logs/agent/index.md"
  "logs/task/index.md"
  "logs/command/index.md"
  "logs/hook/index.md"
  "logs/package/index.md"
  "logs/upgrade/index.md"
  "logs/security/index.md"
  "tools/bin/ai-teams-lib.sh"
  "tools/bin/ai-teams-init-project.sh"
  "tools/bin/ai-teams-rule-refresh.mjs"
  "tools/bin/ai-teams-rule-create.mjs"
  "tools/bin/ai-teams-rule-refresh.ps1"
  "tools/bin/ai-teams-codegraph-status.sh"
  "tools/bin/ai-teams-package.sh"
  "tools/bin/ai-teams-upgrade.sh"
  "security/supervision-policy.md"
  "tools/bin/ai-teams-rollback.sh"
  "tools/bin/ai-teams-logs-clean.sh"
  "tools/bin/ai-teams-mcp-list.sh"
  "tools/bin/ai-teams-mcp-install.sh"
  "tools/bin/ai-teams-mcp-healthcheck.sh"
  "tools/bin/ai-teams-skills-list.sh"
  "tools/bin/ai-teams-skills-install.sh"
  "tools/bin/ai-teams-skills-verify.sh"
  "tools/bin/ai-teams-e2e-fixtures.sh"
  "tools/bin/ai-teams-context-compact.sh"
  "tools/bin/ai-teams-memory-audit.mjs"
  "tools/bin/ai-teams-hook-output-test.mjs"
  "tools/bin/ai-teams-lock.sh"
  "tools/bin/ai-teams-state-event.sh"
  "tools/bin/ai-teams-state-render.sh"
  "tools/bin/ai-teams-prompt-core.mjs"
  "tools/bin/ai-teams-prompt-status.mjs"
  "tools/bin/ai-teams-prompt-render.mjs"
  "tools/bin/ai-teams-prompt-compile.mjs"
  "tools/bin/ai-teams-prompt-evolve.mjs"
  "tools/bin/ai-teams-prompt-eval.mjs"
  "tools/bin/ai-teams-prompt-activate.mjs"
  "tools/bin/ai-teams-prompt-rollback.mjs"
  "tools/bin/ai-teams-prompt-history.mjs"
  "tools/bin/ai-teams-supervision.sh"
  "tools/bin/ai-teams-check-simplify.sh"
  "tools/bin/ai-teams-run.ps1"
  "tools/bin/ai-teams-check.ps1"
  "tools/bin/ai-teams-init-project.ps1"
  "tools/mcp/README.md"
  "tools/skills/README.md"
)

missing=0

echo "== 必需文件 =="
for file in "${required_files[@]}"; do
  if [[ "$formal_claude_subdir" -eq 1 && "$file" == "CLAUDE.md" ]]; then
    echo "运行包不创建 AI-Teams 自有 CLAUDE.md： $file"
    continue
  fi
  if [[ "$packaging_enabled" -ne 1 && "$file" == "tools/bin/ai-teams-package.sh" ]]; then
    echo "正式运行包跳过打包脚本必需文件检查： $file"
    continue
  fi
  if [[ "$formal_claude_subdir" -eq 1 && "$file" == .claude/agents/* ]]; then
    formal_agent_file="../agents/${file#.claude/agents/}"
    if [[ -f "$formal_agent_file" ]]; then
      echo "正常： $formal_agent_file"
    else
      echo "缺失： $formal_agent_file"
      missing=1
    fi
    continue
  fi
  if [[ "$formal_claude_subdir" -eq 1 && "$file" == .claude/rules/* ]]; then
    formal_rule_file="../rules/${file#.claude/rules/}"
    if [[ -f "$formal_rule_file" ]]; then
      echo "正常： $formal_rule_file"
    else
      echo "缺失： $formal_rule_file"
      missing=1
    fi
    continue
  fi
  if [[ "$formal_claude_subdir" -eq 1 && "$file" == ".claude/settings.json" ]]; then
    if [[ -f "$claude_settings_file" ]]; then
      echo "正常： $claude_settings_file"
    else
      echo "缺失： $claude_settings_file"
      missing=1
    fi
    continue
  fi
  if [[ "$formal_claude_subdir" -eq 1 && "$file" == ".claude/settings.local.example.json" ]]; then
    if [[ -f "$claude_local_example_file" ]]; then
      echo "正常： $claude_local_example_file"
    else
      echo "缺失： $claude_local_example_file"
      missing=1
    fi
    continue
  fi
  if [[ "$formal_claude_subdir" -eq 1 && "$file" == ".mcp.json" ]]; then
    if [[ -f "$project_mcp_file" ]]; then
      echo "正常： $project_mcp_file"
    else
      echo "缺失： $project_mcp_file"
      missing=1
    fi
    continue
  fi
  if [[ "$packaging_enabled" -ne 1 && "$file" == "tools/bin/ai-teams-package.sh" ]]; then
    echo "运行包跳过源工程打包脚本： $file"
    continue
  fi
  if [[ "$packaging_enabled" -ne 1 && "$file" == project/adr/accepted/ADR-* ]]; then
    echo "运行包跳过源工程内置 ADR： $file"
    continue
  fi
  if [[ ! -f "$file" ]]; then
    echo "缺失： $file"
    missing=1
  else
    echo "正常： $file"
  fi
done

echo
echo "== Claude Code 入口体积 =="
entry_file="CLAUDE.md"
[[ "$formal_claude_subdir" -eq 1 ]] && entry_file="index/ENTRY.md"
claude_lines="$(wc -l < "$entry_file" | tr -d '[:space:]')"
if [[ "$claude_lines" -le 200 ]]; then
  echo "正常：$entry_file 为 ${claude_lines} 行，不超过 200 行"
else
  echo "$entry_file 过长：${claude_lines} 行，必须保持为不超过 200 行的项目地图"
  missing=1
fi

required_dirs=(
  "agents"
  "agents/memory/memorys"
  ".claude"
  ".claude/agents"
  ".claude/rules"
  "index"
  "rule"
  "rule/agents"
  "rule/tasks"
  "rule/custom"
  "rule/custom/agents"
  "rule/custom/project"
  "rule/custom/security"
  "rule/project"
  "rule/project/frontend"
  "rule/project/backend"
  "rule/catalog"
  "rule/engineering"
  "rule/security"
  "rule/shared"
  "rule/memory"
  "rule/knowledge"
  "rule/tools"
  "memory"
  "memory/conversations"
  "memory/conversations/compact"
  "memory/conversations/restore-points"
  "memory/conversations/sessions"
  "memory/archive"
  "kb"
  "kb/agents"
  "project"
  "project/rules"
  "project/adr"
  "project/requirements"
  "project/plans"
  "project/adr/accepted"
  "project/adr/rejected"
  "shared"
  "shared/tasks"
  "shared/handoffs"
  "shared/broadcasts"
  "shared/decisions"
  "shared/locks"
  "shared/locks/.locks"
  "shared/escalations"
  "shared/escalations/pending"
  "shared/escalations/resolved"
  "shared/supervision"
  "shared/events"
  "shared/transactions"
  "shared/contracts"
  "security"
  "security/agent-playbooks"
  "hooks"
  "hooks/scripts"
  "hooks/configs"
  "hooks/templates"
  "cron"
  "logs"
  "logs/agent"
  "logs/task"
  "logs/command"
  "logs/hook"
  "logs/package"
  "logs/upgrade"
  "logs/audit"
  "logs/security"
  "logs/compressed"
  "templates"
  "skills"
  "skills/agents"
  "mcp"
  "mcp/agents"
  "tools"
  "tools/commands"
  "tools/commands/ai"
  "lab"
)

echo
echo "== 必需目录 =="
for dir in "${required_dirs[@]}"; do
  if [[ "$formal_claude_subdir" -eq 1 && "$dir" == ".claude/agents" ]]; then
    if [[ -d "../agents" ]]; then
      echo "正常： ../agents"
    else
      echo "缺失目录： ../agents"
      missing=1
    fi
    continue
  fi
  if [[ "$formal_claude_subdir" -eq 1 && "$dir" == ".claude/rules" ]]; then
    if [[ -d "../rules" ]]; then
      echo "正常： ../rules"
    else
      echo "缺失目录： ../rules"
      missing=1
    fi
    continue
  fi
  if [[ "$formal_claude_subdir" -eq 1 && "$dir" == ".claude" ]]; then
    echo "运行包跳过 payload 内部 .claude 目录： $dir"
    continue
  fi
  if [[ "$formal_claude_subdir" -eq 1 && "$dir" == "lab" ]]; then
    echo "运行包跳过工程实验室目录： $dir"
    continue
  fi
  if [[ ! -d "$dir" ]]; then
    echo "缺失目录： $dir"
    missing=1
  else
    echo "正常目录： $dir"
  fi
done

echo
echo "== 指令文档 =="
command_count=$(find tools/commands/ai -maxdepth 1 -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
expected_command_count=25
if [[ "$packaging_enabled" -ne 1 ]]; then
  expected_command_count=23
fi
if [[ "$command_count" != "$expected_command_count" ]]; then
  echo "指令数量错误：期望 ${expected_command_count}，实际 ${command_count}"
  missing=1
else
  echo "正常：$expected_command_count 个指令文档"
fi
if [[ "$packaging_enabled" -ne 1 ]]; then
  if [[ -e "tools/commands/ai/package-formal.md" || -e "tools/commands/ai/package-simplify.md" || -e "tools/bin/ai-teams-package.sh" ]]; then
    echo "运行包不应包含打包指令或打包脚本"
    missing=1
  else
    echo "正常：运行包未包含打包指令和打包脚本"
  fi
fi

if [[ "$formal_claude_subdir" -eq 1 ]]; then
  echo
  echo "== 运行包清洁度 =="
  settings_lines="$(wc -l < "$claude_settings_file" | tr -d '[:space:]')"
  if [[ "$settings_lines" -gt 400 ]]; then
    echo "运行包 settings.json 过长：${settings_lines} 行，必须不超过 400 行"
    missing=1
  else
    echo "正常：运行包 settings.json 为 ${settings_lines} 行"
  fi

  runtime_artifacts="$(
    {
      find shared/events -maxdepth 1 -type f \
        ! -name ".gitkeep" ! -name "index.md" ! -name "EVENT_TEMPLATE.md" -print
      find project/requirements project/plans -maxdepth 1 -type f ! -name "index.md" -print
      for log_dir in logs/agent logs/task logs/command logs/hook logs/package logs/upgrade logs/audit logs/security; do
        find "$log_dir" -maxdepth 1 -type f ! -name "index.md" -print
      done
    } 2>/dev/null
  )"
  if [[ -n "$runtime_artifacts" ]]; then
    echo "运行包包含不应交付的运行态或质检产物："
    printf '%s\n' "$runtime_artifacts"
    missing=1
  else
    echo "正常：运行事件、项目任务材料和日志正文均为空"
  fi

  bytecode_cache="$(
    find . \
      \( -type d -name "__pycache__" -o -type f \( -name "*.pyc" -o -name "*.pyo" \) \) \
      -print 2>/dev/null
  )"
  if [[ -n "$bytecode_cache" ]]; then
    echo "运行包包含 Python 字节码缓存："
    printf '%s\n' "$bytecode_cache"
    missing=1
  else
    echo "正常：运行包不包含 Python 字节码缓存"
  fi

  broken_source_adr_refs="$(
    rg -n --glob "*.md" \
      "project/adr/accepted/ADR-[0-9]+" \
      index project kb security rule agents shared 2>/dev/null || true
  )"
  if [[ -n "$broken_source_adr_refs" ]]; then
    echo "运行包仍引用未携带的源工程 ADR："
    printf '%s\n' "$broken_source_adr_refs"
    missing=1
  else
    echo "正常：运行包未保留指向缺失源工程 ADR 的引用"
  fi
fi

echo
echo "== Agent 文档 =="
default_agents=(lead pd plan-pm dev-frontend-web dev-frontend-miniapp dev-backend-systems dev-backend-service qa memory doc role security-reviewer)
dev_kb_agents=(dev-frontend-web dev-frontend-miniapp dev-backend-systems dev-backend-service)
dev_kb_files=(index 00-index 01-source-map 02-engineering-rules 03-code-style 04-review-checklist 05-do-not)
key_collab_kb_agents=(lead pd plan-pm qa memory doc role security-reviewer)
key_collab_kb_files=(index 00-index 01-source-map 02-engineering-rules 03-code-style 04-review-checklist 05-do-not)
agent_components=(role workflow memory kb skills mcp playbook)
agent_count=0
for agent in "${default_agents[@]}"; do
  agent_doc="agents/$agent/$agent.md"
  if [[ ! -f "$agent_doc" ]]; then
    echo "缺失 Agent 文档：$agent_doc"
    missing=1
  else
    echo "正常 Agent 文档：$agent_doc"
    agent_count=$((agent_count + 1))
  fi
  for component in "${agent_components[@]}"; do
    component_file="agents/$agent/$component.md"
    if [[ "$component_file" == "$agent_doc" ]]; then
      echo "正常 Agent 结构文件：${component_file}（兼主文件）"
      continue
    fi
    if [[ ! -f "$component_file" ]]; then
      echo "缺失 Agent 结构文件：$component_file"
      missing=1
    else
      echo "正常 Agent 结构文件：$component_file"
    fi
  done
  playbook_file="security/agent-playbooks/$agent.md"
  if [[ ! -f "$playbook_file" ]]; then
    echo "缺失 Agent Playbook 规则：$playbook_file"
    missing=1
  else
    echo "正常 Agent Playbook 规则：$playbook_file"
  fi
  skill_dir="skills/agents/$agent"
  mcp_dir="mcp/agents/$agent"
  mcp_index="mcp/agents/$agent/index.md"
  if [[ ! -d "$skill_dir" ]]; then
    echo "缺失 Agent Skills 目录：$skill_dir"
    missing=1
  else
    echo "正常 Agent Skills 目录：$skill_dir"
  fi
  if [[ ! -d "$mcp_dir" ]]; then
    echo "缺失 Agent MCP 目录：$mcp_dir"
    missing=1
  else
    echo "正常 Agent MCP 目录：$mcp_dir"
  fi
  if [[ ! -f "$mcp_index" ]]; then
    echo "缺失 Agent MCP 绑定索引：$mcp_index"
    missing=1
  else
    echo "正常 Agent MCP 绑定索引：$mcp_index"
  fi
  prompt_index="prompts/agents/$agent/index.md"
  if [[ ! -f "$prompt_index" ]]; then
    echo "缺失 Agent Prompt 索引：$prompt_index"
    missing=1
  fi
  for prompt_asset in system/v1.0.0.prompt.md task/default.v1.0.0.prompt.md retry/v1.0.0.prompt.md evals/cases.json; do
    if [[ ! -f "prompts/agents/$agent/$prompt_asset" ]]; then
      echo "缺失 Agent Prompt 资产：prompts/agents/$agent/$prompt_asset"
      missing=1
    fi
  done
  if ! grep -Fq "prompts/agents/$agent/index" "$agent_doc"; then
    echo "Agent 主文档缺少专属 Prompt 指针：$agent_doc"
    missing=1
  fi
done
if [[ "$agent_count" != "12" ]]; then
  echo "Agent 文档数量错误：期望 12，实际 $agent_count"
  missing=1
fi

echo
echo "== 开发 Agent 知识库 =="
for agent in "${dev_kb_agents[@]}"; do
  for doc_name in "${dev_kb_files[@]}"; do
    kb_file="kb/agents/$agent/$doc_name.md"
    if [[ ! -f "$kb_file" ]]; then
      echo "缺失开发 Agent 知识库文件：$kb_file"
      missing=1
    else
      echo "正常开发 Agent 知识库文件：$kb_file"
    fi
  done
  agent_kb_pointer="agents/$agent/kb.md"
  for doc_name in "${dev_kb_files[@]}"; do
    if ! grep -Fq "kb/agents/$agent/$doc_name" "$agent_kb_pointer"; then
      echo "Agent KB 指针缺少具体知识库文件：$agent_kb_pointer -> kb/agents/$agent/$doc_name"
      missing=1
    fi
  done
done

echo
echo "== 关键协作 Agent 知识库 =="
for agent in "${key_collab_kb_agents[@]}"; do
  for doc_name in "${key_collab_kb_files[@]}"; do
    kb_file="kb/agents/$agent/$doc_name.md"
    if [[ ! -f "$kb_file" ]]; then
      echo "缺失关键协作 Agent 知识库文件：$kb_file"
      missing=1
    else
      echo "正常关键协作 Agent 知识库文件：$kb_file"
    fi
  done
  agent_kb_pointer="agents/$agent/kb.md"
  if ! grep -Fq "kb/agents/$agent/00-index" "$agent_kb_pointer"; then
    echo "Agent KB 指针缺少细分知识库入口：$agent_kb_pointer -> kb/agents/$agent/00-index"
    missing=1
  fi
done

legacy_agent_indexes="$(find agents -mindepth 2 -maxdepth 2 -type f -name "index.md" -print 2>/dev/null)"
if [[ -n "$legacy_agent_indexes" ]]; then
  echo "不应存在 per-agent index.md："
  printf "%s\n" "$legacy_agent_indexes"
  missing=1
else
  echo "正常：未发现 per-agent index.md"
fi

echo
echo "== Agent 文档结构 =="
required_agent_sections=(
  "## 角色定位"
  "## 职责范围"
  "## 输入"
  "## 输出"
  "## 管理目录"
  "## 禁止事项"
  "## 关联记忆"
  "## 关联知识库"
  "## 关联 Skills"
  "## 关联 MCP"
  "## 交接规则"
)

for agent in "${default_agents[@]}"; do
  agent_doc="agents/$agent/$agent.md"
  [[ -f "$agent_doc" ]] || continue
  for section in "${required_agent_sections[@]}"; do
    if ! grep -Fq "$section" "$agent_doc"; then
      echo "Agent 文档缺少章节：$agent_doc -> $section"
      missing=1
    fi
  done
  if ! grep -Fq "## 专业能力细化" "$agent_doc"; then
    echo "Agent 文档缺少专业能力细化：$agent_doc"
    missing=1
  fi
  if ! grep -Eq '^color: "(red|blue|green|yellow|purple|orange|pink|cyan)"$' "$agent_doc"; then
    echo "Agent 文档缺少合法 color frontmatter：$agent_doc"
    missing=1
  fi
  if ! grep -Eq '^style: "[a-z0-9-]+"$' "$agent_doc"; then
    echo "Agent 文档缺少 style frontmatter：$agent_doc"
    missing=1
  fi
  if ! grep -Fq "../../security/project-policy.md" "$agent_doc"; then
    echo "Agent 文档缺少项目管理规则指针：$agent_doc"
    missing=1
  fi
  if ! grep -Fq "../../project/rules/index.md" "$agent_doc"; then
    echo "Agent 文档缺少项目规则索引指针：$agent_doc"
    missing=1
  fi
  role_doc="agents/$agent/role.md"
  if [[ -f "$role_doc" ]] && ! grep -Fq "## 专业能力细化" "$role_doc"; then
    echo "Agent role 缺少专业能力细化：$role_doc"
    missing=1
  fi
done

echo
echo "== Agent 主文档指针 =="
for agent in "${default_agents[@]}"; do
  agent_doc="agents/$agent/$agent.md"
  [[ -f "$agent_doc" ]] || continue
  required_agent_links=(
    "../../rule/index.md"
    "../../rule/agents/$agent.md"
    "../../rule/tasks/index.md"
    "../../rule/project/index.md"
    "./playbook.md"
    "../../security/agent-playbooks/$agent.md"
    "../../playbook.md"
    "../../security/index.md"
    "../../shared/index.md"
    "../../project/change-log.md"
    "./memory.md"
    "./kb.md"
    "./skills.md"
    "./mcp.md"
    "../../memory/agents/$agent/MEMORY.md"
    "../../kb/agents/$agent/index.md"
    "../../skills/agents/$agent/"
    "../../mcp/agents/$agent/index.md"
  )
  for link in "${required_agent_links[@]}"; do
    if ! grep -Fq "$link" "$agent_doc"; then
      echo "Agent 主文档缺少指针：$agent_doc -> $link"
      missing=1
    fi
  done
done

echo
echo "== Agent Rule 最短读取链 =="
for agent in "${default_agents[@]}"; do
  route_file="rule/agents/$agent.md"
  if [[ ! -f "$route_file" ]]; then
    echo "缺失 Agent Rule 路由：$route_file"
    missing=1
    continue
  fi
  if ! grep -Fq "## 执行前最短读取链" "$route_file"; then
    echo "Agent Rule 路由缺少最短读取链：$route_file"
    missing=1
  fi
  for link in \
    "../../agents/$agent/$agent.md" \
    "../tasks/index.md" \
    "../project/index.md" \
    "../../project/index.md" \
    "../shared/index.md" \
    "../security/index.md" \
    "../custom/index.md"
  do
    if ! grep -Fq "$link" "$route_file"; then
      echo "Agent Rule 路由缺少按需索引：$route_file -> $link"
      missing=1
    fi
  done
done

echo
echo "== 项目 Rule 初始化生成标记 =="
generated_rule_markers=(
  "rule/project/structure.md::project-rule-structure"
  "rule/project/files.md::project-rule-files"
  "rule/project/frontend/index.md::project-rule-frontend"
  "rule/project/frontend/syntax.md::project-rule-frontend-syntax"
  "rule/project/backend/index.md::project-rule-backend"
  "rule/project/backend/api.md::project-rule-api"
  "rule/project/backend/syntax.md::project-rule-backend-syntax"
)
for item in "${generated_rule_markers[@]}"; do
  file="${item%%::*}"
  marker="${item#*::}"
  if ! grep -Fq "<!-- AI-TEAMS:${marker}:BEGIN -->" "$file" ||
     ! grep -Fq "<!-- AI-TEAMS:${marker}:END -->" "$file"; then
    echo "项目 Rule 模板缺少初始化生成标记：$file -> $marker"
    missing=1
  fi
done

echo
echo "== Agent Playbook 项目入口指针 =="
for agent in "${default_agents[@]}"; do
  for playbook_file in "agents/$agent/playbook.md" "security/agent-playbooks/$agent.md"; do
    if [[ ! -f "$playbook_file" ]]; then
      echo "缺失 Agent Playbook 文件：$playbook_file"
      missing=1
      continue
    fi
    for link in "project/index" "project/context" "project/change-log" "project/ui-style" "project/api-contracts" "shared/contracts/index"; do
      if ! grep -Fq "$link" "$playbook_file"; then
        echo "Agent Playbook 缺少项目入口指针：$playbook_file -> $link"
        missing=1
      fi
    done
  done
done

echo
echo "== 接口与小细节防遗漏规则 =="
contract_needles=(
  "字段防错清单"
  "前后端映射矩阵"
  "小细节防遗漏门禁"
  "前端所需字段如果后端没有，必须回流契约"
)
for needle in "${contract_needles[@]}"; do
  if ! grep -Fq "$needle" "project/api-contracts.md"; then
    echo "接口契约索引缺少防错规则：project/api-contracts.md -> $needle"
    missing=1
  fi
done
ui_needles=(
  "页面小细节清单"
  "加载态"
  "空态"
  "错误态"
  "权限态"
  "不得用临时假数据绕过"
)
for needle in "${ui_needles[@]}"; do
  if ! grep -Fq "$needle" "project/ui-style.md"; then
    echo "UI 画像缺少小细节规则：project/ui-style.md -> $needle"
    missing=1
  fi
done
pd_pm_needles=(
  "需求卡"
  "执行卡"
  "轻量优先"
)
for needle in "${pd_pm_needles[@]}"; do
  if ! grep -Fq "$needle" "playbook.md"; then
    echo "根 playbook 缺少 PD/Plan-PM 轻量流程：playbook.md -> $needle"
    missing=1
  fi
done
if ! grep -Fq "需求卡" "security/agent-playbooks/pd.md" || ! grep -Fq "需求卡" "agents/pd/pd.md" || ! grep -Fq "需求卡" "agents/pd/workflow.md"; then
  echo "PD 缺少需求卡轻量流程指引"
  missing=1
fi
if ! grep -Fq "执行卡" "security/agent-playbooks/plan-pm.md" || ! grep -Fq "执行卡" "agents/plan-pm/plan-pm.md" || ! grep -Fq "执行卡" "agents/plan-pm/workflow.md"; then
  echo "Plan-PM 缺少执行卡轻量流程指引"
  missing=1
fi
init_contract_needles=(
  "server/routes"
  "server/schemas"
  "*dto*.ts"
  "if has_file \"package.json\"; then echo \"npm\""
)
for needle in "${init_contract_needles[@]}"; do
  if ! grep -Fq "$needle" "tools/bin/ai-teams-init-project.sh"; then
    echo "初始化脚本缺少接口或包管理器识别：tools/bin/ai-teams-init-project.sh -> $needle"
    missing=1
  fi
done
package_contract_needles=(
  "cp \"project/ui-style.md\""
  "cp \"project/api-contracts.md\""
  "cp \"shared/contracts/index.md\""
  "cp \"shared/contracts/API_CONTRACT_TEMPLATE.md\""
)
if [[ "$packaging_enabled" -eq 1 ]]; then
  for needle in "${package_contract_needles[@]}"; do
    if ! grep -Fq "$needle" "tools/bin/ai-teams-package.sh"; then
      echo "打包脚本未复用接口规范本体：tools/bin/ai-teams-package.sh -> $needle"
      missing=1
    fi
  done
else
  echo "运行包跳过源工程接口规范打包检查"
fi

echo
echo "== Agent Skills 绑定 =="
for agent in "${default_agents[@]}"; do
  skill_index="skills/agents/$agent/index.md"
  if [[ ! -f "$skill_index" ]]; then
    echo "缺失 Agent Skills 安装索引：$skill_index"
    missing=1
  else
    echo "正常 Agent Skills 安装索引：$skill_index"
  fi
  if ! grep -Fq "skills/agents/$agent/index" "agents/$agent/skills.md"; then
    echo "Agent Skills 指针未指向安装索引：agents/$agent/skills.md"
    missing=1
  fi
done

echo
echo "== .claude 官方 Agent 层 =="
if [[ "$formal_claude_subdir" -eq 1 ]]; then
  if [[ -e "../CLAUDE.md" || -e "CLAUDE.md" ]]; then
    echo "安装包不得创建 AI-Teams 自有 CLAUDE.md；目标项目根入口必须保持唯一"
    missing=1
  else
    echo "正常：安装包未创建额外 CLAUDE.md，目标项目根入口保持唯一"
  fi
  if [[ -e ".claude" ]]; then
    echo "安装包 payload 内不应再嵌套 .claude：.claude"
    missing=1
  else
    echo "正常：运行包 payload 内无 .claude，配置位于父级 ${claude_settings_file}，官方 Agent 主定义位于父级 ../agents"
  fi
else
	  claude_extra="$(find .claude -type f \
	    ! -path ".claude/settings.json" \
	    ! -path ".claude/settings.local.example.json" \
	    ! -path ".claude/settings.local.json" \
	    ! -path ".claude/.DS_Store" \
	    ! -path ".claude/agents/*.md" \
	    ! -path ".claude/rules/*.md" \
	    -print 2>/dev/null)"
  if [[ -n "$claude_extra" ]]; then
    echo ".claude 中存在非 settings 文件："
    printf "%s\n" "$claude_extra"
    missing=1
	  else
	    echo "正常：.claude 只包含 settings、官方 Agent 主定义和官方 Rules 适配文件"
  fi

  claude_dirs="$(find .claude -mindepth 1 -type d ! -path ".claude/agents" ! -path ".claude/rules" -print 2>/dev/null)"
  if [[ -n "$claude_dirs" ]]; then
    echo ".claude 中存在工程目录："
    printf "%s\n" "$claude_dirs"
    missing=1
  else
	    echo "正常：.claude 只包含官方 Agent 主定义目录和 Rules 适配目录"
  fi

  official_rule_count="$(find .claude/rules -maxdepth 1 -type f -name '*.md' 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "$official_rule_count" != "6" ]]; then
    echo "Claude Code 官方 Rules 适配文件数量错误：期望 6，实际 $official_rule_count"
    missing=1
  else
    echo "正常：Claude Code 官方 Rules 适配文件为 6 个"
  fi
fi

echo
echo "== Claude Code 官方 subagent 主定义 =="
official_agent_dir=".claude/agents"
[[ "$formal_claude_subdir" -eq 1 ]] && official_agent_dir="../agents"
if [[ -d "$official_agent_dir" ]]; then
  official_agent_files_count="$(find "$official_agent_dir" -maxdepth 1 -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "$official_agent_files_count" != "12" ]]; then
    echo "官方 subagent 主定义数量错误：期望 12，实际 $official_agent_files_count"
    missing=1
  else
    echo "正常：官方 subagent 主定义为 12 个"
  fi
  official_agent_extra="$(find "$official_agent_dir" -mindepth 1 -maxdepth 1 \
    ! -name "lead.md" \
    ! -name "pd.md" \
    ! -name "plan-pm.md" \
    ! -name "dev-frontend-web.md" \
    ! -name "dev-frontend-miniapp.md" \
    ! -name "dev-backend-systems.md" \
    ! -name "dev-backend-service.md" \
    ! -name "qa.md" \
    ! -name "memory.md" \
    ! -name "doc.md" \
    ! -name "role.md" \
    ! -name "security-reviewer.md" \
    -print 2>/dev/null)"
  if [[ -n "$official_agent_extra" ]]; then
    echo "官方 subagent 目录存在非 12 Agent 文件或目录："
    printf "%s\n" "$official_agent_extra"
    missing=1
  else
    echo "正常：官方 subagent 目录保持扁平 12 Agent 文件"
  fi
fi
for agent in "${default_agents[@]}"; do
  adapter_file=".claude/agents/$agent.md"
  canonical_ref="agents/$agent/$agent.md"
  if [[ "$formal_claude_subdir" -eq 1 ]]; then
    adapter_file="../agents/$agent.md"
    canonical_ref=".claude/ai-teams/agents/$agent/$agent.md"
  fi
  if [[ ! -f "$adapter_file" ]]; then
    echo "缺失 subagent 主定义文件：$adapter_file"
    missing=1
    continue
  fi
  if ! grep -Eq "^name: $agent$" "$adapter_file"; then
    echo "subagent 主定义缺少 name：$adapter_file"
    missing=1
  fi
  if ! grep -Fq "MUST BE USED PROACTIVELY" "$adapter_file"; then
    echo "subagent 主定义 description 缺少主动委派触发词：$adapter_file"
    missing=1
  fi
  if ! grep -Eq '^color: "?(red|blue|green|yellow|purple|orange|pink|cyan)"?$' "$adapter_file"; then
    echo "subagent 主定义缺少合法 color：$adapter_file"
    missing=1
  fi
  if ! grep -Fq "$canonical_ref" "$adapter_file"; then
    echo "subagent 主定义未指向 AI-Teams Agent 组件：$adapter_file -> $canonical_ref"
    missing=1
  fi
  if ! grep -Fq "## 入口定位" "$adapter_file"; then
    echo "subagent 主定义缺少官方运行入口指引：$adapter_file"
    missing=1
  fi
  for needle in "rule/index.md" "rule/agents/$agent.md" "rule/tasks/index.md" "rule/project/index.md" "security/agent-playbooks/$agent.md" "shared/index.md" "project/index.md" "project/change-log.md" "memory/" "kb/" "skills/" "mcp/"; do
    if ! grep -Fq "$needle" "$adapter_file"; then
      echo "subagent 主定义缺少 AI-Teams 工程大脑指针：$adapter_file -> $needle"
      missing=1
    fi
  done
done

official_runtime_rules=(
  "pd.md::需求卡"
  "plan-pm.md::执行卡"
  "dev-frontend-web.md::不得猜字段"
  "dev-frontend-miniapp.md::不得猜字段"
  "dev-backend-systems.md::不得擅自删除、改名、改类型"
  "dev-backend-service.md::不得擅自删除、改名、改类型"
  "qa.md::契约未批准"
  "qa.md::Chrome MCP"
)
for rule in "${official_runtime_rules[@]}"; do
  file="${rule%%::*}"
  needle="${rule#*::}"
  if ! grep -Fq "$needle" "$official_agent_dir/$file"; then
    echo "官方 subagent 主定义缺少运行时硬约束：$official_agent_dir/$file -> $needle"
    missing=1
  fi
done

if command -v python3 >/dev/null 2>&1; then
  python3 - "$claude_settings_file" <<'PY' || missing=1
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
data = json.loads(path.read_text(encoding="utf-8"))
if data.get("agent") != "lead":
    raise SystemExit("settings.json 顶层 agent 必须为 lead")
ai = data.get("ai_teams", {})
runtime = ai.get("subagent_runtime") or ai.get("subagent_adapters") or {}
if runtime.get("official_project_dir") != ".claude/agents/":
    raise SystemExit("settings.json 缺少 .claude/agents 官方 subagent 目录登记")
print("正常：settings.json 默认进入 lead，并登记 .claude/agents 官方 Agent 主定义目录")
PY
fi

lead_adapter=".claude/agents/lead.md"
[[ "$formal_claude_subdir" -eq 1 ]] && lead_adapter="../agents/lead.md"
if [[ -f "$lead_adapter" ]]; then
  if ! grep -Fq "Agent(pd, plan-pm, dev-frontend-web, dev-frontend-miniapp, dev-backend-systems, dev-backend-service, qa, memory, doc, role, security-reviewer)" "$lead_adapter"; then
    echo "Lead subagent 主定义未限制 AI-Teams 调度池：$lead_adapter"
    missing=1
  else
    echo "正常：Lead subagent 主定义限制为 AI-Teams 11 个下游 Agent"
  fi
  if ! grep -Fq 'initialPrompt: "读取 AI 团队详情"' "$lead_adapter"; then
    echo "Lead subagent initialPrompt 必须保持短提示：$lead_adapter"
    missing=1
  elif grep -Fq "先解析 AI-Teams" "$lead_adapter"; then
    echo "Lead subagent initialPrompt 不得包含长启动说明：$lead_adapter"
    missing=1
  else
    echo "正常：Lead subagent initialPrompt 为短提示"
  fi
fi

echo
echo "== 已取消目录 =="
cancelled_dirs=(rules workflows tests updates releases)
for dir in "${cancelled_dirs[@]}"; do
  if [[ -e "$dir" ]]; then
    echo "不应存在目录：$dir"
    missing=1
  else
    echo "正常：未发现 $dir"
  fi
done

echo
echo "== 旧路径与旧引用 =="
old_retry_dir="docs/governance"
old_retry_name="retry-flowback.md"
old_retry_file="$old_retry_dir/$old_retry_name"
if [[ -e "$old_retry_file" ]]; then
  echo "旧重试协议文件不应存在：$old_retry_file"
  missing=1
else
  echo "正常：旧重试协议文件不存在"
fi

if command -v rg >/dev/null 2>&1; then
  if rg -n "$old_retry_dir/retry-flowback" \
    --glob '!logs/**' \
    --glob '!memory/conversations/**' \
    --glob '!shared/escalations/retry-flowback.md' \
    . >/tmp/ai-teams-old-retry-refs.$$ 2>/dev/null; then
    echo "存在旧重试协议引用："
    cat /tmp/ai-teams-old-retry-refs.$$
    rm -f /tmp/ai-teams-old-retry-refs.$$
    missing=1
  else
    rm -f /tmp/ai-teams-old-retry-refs.$$
    echo "正常：未发现旧重试协议引用"
  fi

  for subdir in commands workflows skills; do
    if rg -n "\\.claude/$subdir" \
      --glob '!logs/**' \
      --glob '!memory/conversations/**' \
      . >/tmp/ai-teams-old-claude-refs.$$ 2>/dev/null; then
      echo "存在旧 .claude/$subdir 引用："
      cat /tmp/ai-teams-old-claude-refs.$$
      rm -f /tmp/ai-teams-old-claude-refs.$$
      missing=1
    else
      rm -f /tmp/ai-teams-old-claude-refs.$$
      echo "正常：未发现旧 .claude/$subdir 引用"
    fi
  done
else
  echo "跳过：未找到 rg，无法扫描旧引用"
fi

legacy_agent_readmes="$(find agents -mindepth 2 -maxdepth 2 -type f -name "README.md" -print 2>/dev/null)"
if [[ -n "$legacy_agent_readmes" ]]; then
  echo "不应存在 Agent README.md："
  printf "%s\n" "$legacy_agent_readmes"
  missing=1
else
  echo "正常：未发现 Agent README.md"
fi

echo
echo "== 标准 Markdown 与禁止结构 =="
if rg -n -P '\\[\\[[A-Za-z0-9_.<][A-Za-z0-9_./<>-]*(?:\\|[^\\]]+)?\\]\\]' --glob '*.md' . >/tmp/ai-teams-editor-links.txt 2>/dev/null; then
  echo "发现编辑器专用链接："
  cat /tmp/ai-teams-editor-links.txt
  missing=1
else
  echo "正常：AI-Teams 文档未使用编辑器专用链接"
fi
if rg -n '^(tags|links):' --glob '*.md' . >/tmp/ai-teams-link-metadata.txt 2>/dev/null; then
  echo "发现已取消的 tags/links 元数据："
  cat /tmp/ai-teams-link-metadata.txt
  missing=1
else
  echo "正常：AI-Teams 文档未维护 tags/links 元数据"
fi
if [[ -f index/NAVIGATION.md && -f index/ENTRY.md ]]; then
  echo "正常：标准 Markdown 导航和 Harness 地图存在"
else
  echo "缺失标准 Markdown 导航或 Harness 地图"
  missing=1
fi

echo
echo "== ADR 规范 =="
adr_template_sections=(
  "## 1. 背景"
  "## 2. 决策"
  "## 3. 原因"
  "## 4. 影响范围"
  "## 5. 后果"
  "## 6. 关联"
)
for section in "${adr_template_sections[@]}"; do
  if grep -Fq "$section" project/adr/template.md; then
    echo "正常 ADR 模板章节： $section"
  else
    echo "缺失 ADR 模板章节： $section"
    missing=1
  fi
done

if [[ "$packaging_enabled" -eq 1 ]]; then
  accepted_adr_count=$(find project/adr/accepted -maxdepth 1 -type f -name "ADR-*.md" 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$accepted_adr_count" -lt "7" ]]; then
    echo "accepted ADR 数量不足：期望至少 7，实际 $accepted_adr_count"
    missing=1
  else
    echo "正常：accepted ADR 不少于 7 个"
  fi

  expected_adrs=(ADR-0001 ADR-0002 ADR-0003 ADR-0005 ADR-0006 ADR-0007 ADR-0012)
  for adr_number in "${expected_adrs[@]}"; do
    if find project/adr/accepted project/adr/rejected -maxdepth 1 -type f -name "$adr_number-*.md" | grep -q .; then
      echo "正常 ADR 编号： $adr_number"
    else
      echo "缺失 ADR 编号： $adr_number"
      missing=1
    fi
  done
else
  echo "运行包跳过源工程内置 ADR 数量和编号检查"
fi

for adr_file in project/adr/accepted/*.md; do
  [[ -e "$adr_file" ]] || continue
  if ! grep -Fq "status: accepted" "$adr_file"; then
    echo "accepted ADR 状态错误： $adr_file"
    missing=1
  fi
  if ! grep -Fq "decision_by: lead" "$adr_file"; then
    echo "ADR 决策者应为 lead： $adr_file"
    missing=1
  fi
  for section in "${adr_template_sections[@]}"; do
    if ! grep -Fq "$section" "$adr_file"; then
      echo "ADR 缺少章节： $adr_file -> $section"
      missing=1
    fi
  done
done

for adr_file in project/adr/rejected/*.md; do
  [[ -e "$adr_file" ]] || continue
  if ! grep -Fq "status: rejected" "$adr_file"; then
    echo "rejected ADR 状态错误： $adr_file"
    missing=1
  fi
done

echo
echo "== 模板目录 =="
template_count=$(find templates -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
if [[ "$template_count" -lt "12" ]]; then
  echo "模板目录数量错误：期望至少 12，实际 $template_count"
  missing=1
else
  echo "正常：模板目录不少于 12 个"
fi
if [[ ! -f "templates/project-graph/template.md" ]]; then
  echo "缺失项目知识图谱模板：templates/project-graph/template.md"
  missing=1
else
  echo "正常：项目知识图谱模板"
fi

echo
echo "== 标准 Markdown 与 CodeGraph 索引 =="
if [[ -f "index/NAVIGATION.md" && -f "index/CODEGRAPH.md" && -f "kb/graph.md" ]]; then
  echo "正常：标准 Markdown 导航与 CodeGraph 索引"
else
  echo "标准 Markdown/CodeGraph 索引错误"
  missing=1
fi

echo
echo "== 索引与标准 Markdown 链接 =="
core_indexes=(
  "index/ENTRY.md"
  "index/NAVIGATION.md"
  "index/INDEX.md"
  "agents/index.md"
  "security/index.md"
  "shared/index.md"
  "memory/index.md"
  "kb/index.md"
  "prompts/index.md"
  "project/index.md"
  "tools/commands/index.md"
)
for file in "${core_indexes[@]}"; do
  if [[ -f "$file" ]]; then
    echo "正常核心索引：$file"
  else
    echo "缺失核心索引：$file"
    missing=1
  fi
done
if [[ "$formal_claude_subdir" -eq 0 ]] && ! grep -Fq '@index/ENTRY.md' CLAUDE.md; then
  echo "源工程 CLAUDE.md 未导入 index/ENTRY.md"
  missing=1
fi
if [[ "$packaging_enabled" -eq 1 ]]; then
  if node <<'NODE_LINK_CHECK'
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const skipped = new Set(['.git', 'node_modules', 'skills', 'logs', 'conversations', 'lab']);
const errors = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.md')) check(file);
  }
}
function check(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/u);
  let fenced = false;
  lines.forEach((line, index) => {
    if (/^\s*`{3}/u.test(line)) { fenced = !fenced; return; }
    if (fenced) return;
    for (const match of line.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/gu)) {
      let target = match[1].trim().replace(/^<|>$/gu, '');
      if (!target || /^(?:https?:|mailto:|#)/u.test(target)) continue;
      if (/[<>{}$*]/u.test(target)) continue;
      target = target.split('#')[0].split('?')[0];
      try { target = decodeURI(target); } catch {}
      const relativeFile = path.relative(root, file);
      const formalTemplatePrefix = path.join('templates', 'package', 'formal') + path.sep;
      const formalBrainPrefix = '.claude/ai-teams/';
      const resolved = relativeFile.startsWith(formalTemplatePrefix) && target.startsWith(formalBrainPrefix)
        ? path.resolve(root, target.slice(formalBrainPrefix.length))
        : path.resolve(path.dirname(file), target);
      if (!fs.existsSync(resolved)) errors.push(path.relative(root, file) + ':' + (index + 1) + ' -> ' + target);
    }
  });
}
walk(root);
if (errors.length) {
  console.error(errors.slice(0, 200).join('\n'));
  console.error('断链总数：' + errors.length);
  process.exit(1);
}
console.log('标准 Markdown 相对链接可解析');
NODE_LINK_CHECK
  then
    echo "正常：标准 Markdown 链接可解析"
  else
    echo "标准 Markdown 链接存在断链"
    missing=1
  fi
else
  echo "运行包使用核心索引、Agent 入口和自检清单验证导航"
fi

echo
echo "== 工作流系统 =="
workflow_ids=(WF-01 WF-02 WF-03 WF-04 WF-05 WF-06 WF-07 WF-08 WF-09 WF-10 WF-11 WF-12)
for workflow_id in "${workflow_ids[@]}"; do
  if ! grep -Fq "$workflow_id" "playbook.md"; then
    echo "根 playbook 缺少工作流编号：playbook.md -> $workflow_id"
    missing=1
  else
    echo "正常工作流编号：$workflow_id"
  fi
done
workflow_needles=(
  "playbook.md::工作流选择器"
  "playbook.md::高风险自动升级规则"
  "playbook.md::Memory 收尾门"
  "playbook.md::WF-07 前后端联调流"
  "playbook.md::WF-08 Bug 修复流"
  "playbook.md::WF-11 高风险变更流"
  "playbook.md::M0 不写记忆"
  "playbook.md::M1 记忆检查"
  "playbook.md::M2 候选记忆"
  "playbook.md::M3 正式记忆"
  "security/agent-playbooks/lead.md::工作流选择规则"
  "security/agent-playbooks/lead.md::WF-11 高风险变更流"
  "index/ENTRY.md::选择 \`WF-01\` 到 \`WF-12\`"
  "memory/refresh-rules.md::M0 不写记忆"
  "memory/refresh-rules.md::M1 记忆检查"
  "memory/refresh-rules.md::M2 候选记忆"
  "memory/refresh-rules.md::M3 正式记忆"
  "shared/tasks/TASK_TEMPLATE.md::工作流编号"
  "shared/tasks/EXECUTION_PLAN_TEMPLATE.md::工作流编号"
  "shared/task-plan.md::工作流编号"
  "security/task-policy.md::WF-11"
  "security/task-policy.md::Memory"
  "security/agent-playbooks/qa.md::Q0"
  "security/agent-playbooks/doc.md::D0"
  "security/agent-playbooks/security-reviewer.md::S0"
  "security/agent-playbooks/role.md::R0"
  "kb/graph.md::WF-01"
  "kb/graph.md::WF-12"
  "kb/graph.md::M0 不写记忆"
  "project/graph.md::WF-07"
  "index/INDEX.md::工作流选择器"
  "index/AGENTS.md::WF-10"
  "index/FILES.md::ADR-0010-workflow-selector.md"
  "project/adr/index.md::ADR-0010"
)
for item in "${workflow_needles[@]}"; do
  file="${item%%::*}"
  needle="${item#*::}"
  if [[ "$formal_claude_subdir" -eq 1 && "$needle" == *"ADR-0010"* ]]; then
    echo "运行包不携带源工程 ADR 正文和 ADR 索引占位：$file -> $needle"
    continue
  fi
  if [[ ! -f "$file" ]]; then
    echo "工作流检查缺失文件：$file"
    missing=1
  elif grep -Fq "$needle" "$file"; then
    echo "正常工作流索引：$file -> $needle"
  else
    echo "工作流索引缺失：$file -> $needle"
    missing=1
  fi
done
for agent in "${default_agents[@]}"; do
  workflow_file="agents/$agent/workflow.md"
  if [[ ! -f "$workflow_file" ]]; then
    echo "缺失 Agent workflow：$workflow_file"
    missing=1
  elif ! grep -Fq "## 参与工作流" "$workflow_file"; then
    echo "Agent workflow 缺少参与工作流章节：$workflow_file"
    missing=1
  else
    echo "正常 Agent workflow 参与工作流章节：$workflow_file"
  fi
done

echo
echo "== 核心脚本 =="
core_scripts=(
  "tools/bin/ai-teams-check.sh"
  "tools/bin/ai-teams-status.sh"
  "tools/bin/ai-teams-init-project.sh"
  "tools/bin/ai-teams-codegraph-status.sh"
  "tools/bin/ai-teams-package.sh"
  "tools/bin/ai-teams-upgrade.sh"
  "tools/bin/ai-teams-rollback.sh"
  "tools/bin/ai-teams-logs-clean.sh"
  "tools/bin/ai-teams-mcp-list.sh"
  "tools/bin/ai-teams-mcp-install.sh"
  "tools/bin/ai-teams-mcp-healthcheck.sh"
  "tools/bin/ai-teams-skills-list.sh"
  "tools/bin/ai-teams-skills-install.sh"
  "tools/bin/ai-teams-skills-verify.sh"
  "tools/bin/ai-teams-e2e-fixtures.sh"
  "tools/bin/ai-teams-context-compact.sh"
  "tools/bin/ai-teams-lock.sh"
  "tools/bin/ai-teams-state-event.sh"
  "tools/bin/ai-teams-state-render.sh"
  "tools/bin/ai-teams-supervision.sh"
  "tools/bin/ai-teams-check-simplify.sh"
  "hooks/scripts/protected-file-check.sh"
  "hooks/scripts/sensitive-file-check.sh"
  "hooks/scripts/delete-check.sh"
  "hooks/scripts/daily-log-compress.sh"
  "hooks/scripts/external-change-check.sh"
  "hooks/scripts/protected-file-lock-check.sh"
  "hooks/scripts/index-stale-mark.sh"
  "hooks/scripts/ai-teams-run-hook.sh"
  "hooks/scripts/ai-teams-user-prompt-submit.sh"
  "hooks/scripts/context-compression-check.sh"
  "hooks/scripts/lock-timeout-check.sh"
)

for script in "${core_scripts[@]}"; do
  if [[ "$packaging_enabled" -ne 1 && "$script" == "tools/bin/ai-teams-package.sh" ]]; then
    echo "运行包跳过源工程打包脚本检查： $script"
    continue
  fi
  if [[ ! -f "$script" ]]; then
    echo "缺失脚本： $script"
    missing=1
  elif [[ ! -x "$script" ]]; then
    echo "脚本不可执行： $script"
    missing=1
  elif ! bash -n "$script"; then
    echo "脚本语法错误： $script"
    missing=1
  else
    echo "正常脚本： $script"
  fi
done

echo
echo "== Skills 发现验证 =="
if AI_TEAMS_NO_LOG=1 bash tools/bin/ai-teams-skills-verify.sh; then
  echo "正常：Skills Registry、12 个 Agent、frontmatter 和工程内指针"
else
  echo "Skills 发现验证失败"
  missing=1
fi

echo
echo "== 隔离 Fixture E2E =="
if bash tools/bin/ai-teams-e2e-fixtures.sh all; then
  echo "正常：E2E-08、E2E-09、E2E-11、E2E-12"
else
  echo "隔离 Fixture E2E 失败"
  missing=1
fi

echo
echo "== 项目初始化低侵入回归 =="
init_fixture="$(mktemp -d)"
mkdir -p "$init_fixture/.claude/ai-teams" "$init_fixture/.claude/agents" "$init_fixture/src"
printf '%s\n' '{"name":"ai-teams-init-check","dependencies":{"vite":"latest","react":"latest"}}' > "$init_fixture/package.json"
printf '%s\n' ':root { color: #111827; }' > "$init_fixture/src/styles.css"
printf '%s\n' ':root { color: red; }' > "$init_fixture/.claude/ai-teams/harness-only.css"
printf '%s\n' '# Harness Agent' > "$init_fixture/.claude/agents/harness-only.md"
if init_report="$(bash tools/bin/ai-teams-init-project.sh --target "$init_fixture" --plan 2>&1)"; then
  if ! grep -Fq '样式入口：src/styles.css' <<<"$init_report"; then
    echo "初始化回归未识别目标项目 UI 文件"
    missing=1
  elif grep -Fq '样式入口：.claude/ai-teams/harness-only.css' <<<"$init_report" || \
       grep -Fq -- '- .claude/ai-teams' <<<"$init_report" || \
       grep -Fq -- '- .claude/agents' <<<"$init_report"; then
    echo "初始化回归错误地扫描了 AI-Teams 本体或官方 Agent 目录"
    missing=1
  elif grep -Fq 'No such file or directory' <<<"$init_report"; then
    echo "初始化回归出现路径命令替换错误"
    missing=1
  else
    echo "正常：初始化识别目标项目并排除 AI-Teams 本体、官方 Agent 与配置入口"
  fi
else
  echo "初始化低侵入回归执行失败"
  printf '%s\n' "$init_report"
  missing=1
fi
rm -rf "$init_fixture"

echo
echo "== Windows PowerShell 包装脚本 =="
ps_scripts=(
  "hooks/scripts/ai-teams-run-hook.ps1"
  "tools/bin/ai-teams-run.ps1"
  "tools/bin/ai-teams-check.ps1"
  "tools/bin/ai-teams-init-project.ps1"
)
if [[ "$packaging_enabled" -eq 1 ]]; then
  ps_scripts+=("tools/bin/ai-teams-package.ps1")
fi
for script in "${ps_scripts[@]}"; do
  if [[ ! -f "$script" ]]; then
    echo "缺失 PowerShell 脚本： $script"
    missing=1
  else
    echo "正常 PowerShell 脚本： $script"
  fi
done
if command -v pwsh >/dev/null 2>&1; then
  for script in "${ps_scripts[@]}"; do
    if [[ -f "$script" ]] && ! pwsh -NoProfile -Command "\$null = [System.Management.Automation.Language.Parser]::ParseFile('$script', [ref]\$null, [ref]\$null)" >/dev/null 2>&1; then
      echo "PowerShell 语法错误： $script"
      missing=1
    fi
  done
else
  echo "提示：未安装 pwsh，跳过 PowerShell 语法解析。"
fi
if ! node --check hooks/scripts/ai-teams-run-hook.mjs >/dev/null 2>&1; then
  echo "Node Hook 运行器语法错误： hooks/scripts/ai-teams-run-hook.mjs"
  missing=1
else
  echo "正常 Node Hook 运行器： hooks/scripts/ai-teams-run-hook.mjs"
fi
if ! node --check hooks/scripts/agent-heartbeat.mjs >/dev/null 2>&1; then
  echo "Node 心跳 Hook 语法错误： hooks/scripts/agent-heartbeat.mjs"
  missing=1
else
  echo "正常 Node 心跳 Hook： hooks/scripts/agent-heartbeat.mjs"
fi
for node_script in \
  hooks/scripts/hook-output.mjs \
  hooks/scripts/prompt-evolution-event.mjs \
  hooks/scripts/prompt-contract-check.mjs \
  tools/bin/ai-teams-hook-output-test.mjs \
  tools/bin/ai-teams-prompt-core.mjs \
  tools/bin/ai-teams-prompt-status.mjs \
  tools/bin/ai-teams-prompt-render.mjs \
  tools/bin/ai-teams-prompt-compile.mjs \
  tools/bin/ai-teams-prompt-evolve.mjs \
  tools/bin/ai-teams-prompt-eval.mjs \
  tools/bin/ai-teams-prompt-activate.mjs \
  tools/bin/ai-teams-prompt-rollback.mjs \
  tools/bin/ai-teams-prompt-history.mjs
do
  if ! node --check "$node_script" >/dev/null 2>&1; then
    echo "Prompt/Hook Node 脚本语法错误：$node_script"
    missing=1
  else
    echo "正常 Prompt/Hook Node 脚本：$node_script"
  fi
done
if ! node tools/bin/ai-teams-hook-output-test.mjs >/dev/null 2>&1; then
  echo "Hook 输出事件契约测试失败"
  missing=1
else
  echo "正常：Hook 输出按 Claude Code 事件 Schema 分流"
fi
if ! prompt_status_json="$(node tools/bin/ai-teams-prompt-status.mjs --json 2>/dev/null)"; then
  echo "Prompt 状态工具运行失败"
  missing=1
elif ! printf '%s' "$prompt_status_json" | node -e '
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => input += chunk);
process.stdin.on("end", () => {
  const data = JSON.parse(input);
  const active = Array.isArray(data.active) ? data.active : [];
  const systems = active.filter(item => item.kind === "system");
  const ok =
    data.activeCount === 36 &&
    active.length === 36 &&
    active.every(item => item.validHash === true) &&
    systems.length === 12 &&
    systems.every(item => item.compiled === true);
  if (!ok) process.exit(1);
});
'; then
  echo "Prompt 完整性门禁失败：必须满足 36/36 活动版本哈希有效且 12/12 system 已编译"
  missing=1
else
  echo "正常：Prompt 36/36 哈希有效，12/12 system 已编译"
fi
if ! node --check tools/bin/ai-teams-rule-refresh.mjs >/dev/null 2>&1; then
  echo "Rule 刷新脚本语法错误： tools/bin/ai-teams-rule-refresh.mjs"
  missing=1
else
  echo "正常 Rule 刷新脚本： tools/bin/ai-teams-rule-refresh.mjs"
fi
if ! node --check tools/bin/ai-teams-rule-create.mjs >/dev/null 2>&1; then
  echo "Rule 创建脚本语法错误： tools/bin/ai-teams-rule-create.mjs"
  missing=1
else
  echo "正常 Rule 创建脚本： tools/bin/ai-teams-rule-create.mjs"
fi
if ! node --check tools/bin/ai-teams-memory-audit.mjs >/dev/null 2>&1; then
  echo "记忆审计脚本语法错误： tools/bin/ai-teams-memory-audit.mjs"
  missing=1
else
  echo "正常记忆审计脚本： tools/bin/ai-teams-memory-audit.mjs"
fi
if grep -Fq "memory-recovery-candidate" hooks/scripts/ai-teams-run-hook.mjs && \
   grep -Fq "最近用户指令" hooks/scripts/ai-teams-run-hook.mjs && \
   grep -Fq "Memory 处理要求" hooks/scripts/ai-teams-run-hook.mjs; then
  echo "正常：上下文压缩 Hook 会生成恢复候选"
else
  echo "上下文压缩 Hook 未生成完整恢复候选结构"
  missing=1
fi
if command -v python3 >/dev/null 2>&1; then
  if ! memory_audit_json="$(node tools/bin/ai-teams-memory-audit.mjs --json 2>/dev/null)"; then
    echo "记忆审计脚本运行失败： tools/bin/ai-teams-memory-audit.mjs --json"
    missing=1
  elif ! printf '%s' "$memory_audit_json" | python3 -c 'import json,sys
data=json.load(sys.stdin)
ok=True
if data.get("settings", {}).get("autoMemoryEnabled") is not False:
    print("记忆审计失败：autoMemoryEnabled 不是 false")
    ok=False
if data.get("overrides", {}).get("ok") is not True:
    print("记忆审计失败：存在 user/local auto memory 覆盖风险")
    ok=False
if data.get("formalMemory", {}).get("ok") is not True:
    print("记忆审计失败：AI-Teams 正式记忆文件不完整")
    ok=False
if data.get("nativeClaudeMemory", {}).get("contentRead") is not False:
    print("记忆审计失败：不应读取 Claude 原生 memory 内容")
    ok=False
if data.get("policy", {}).get("nativeClaudeMemory") != "audit-and-ignore":
    print("记忆审计失败：原生 Claude memory 策略不是 audit-and-ignore")
    ok=False
if not ok:
    sys.exit(1)
'; then
    missing=1
  else
    echo "正常：记忆审计门禁通过（原生 Claude memory 只审计元数据并忽略）"
  fi
else
  echo "提示：未安装 python3，跳过记忆审计 JSON 断言。"
fi

set +e
printf '%s' '{"hook_event_name":"PreToolUse","tool_name":"Read","tool_input":{"file_path":".env"}}' | node hooks/scripts/ai-teams-run-hook.mjs sensitive-file-check.sh >/dev/null 2>&1
sensitive_hook_status=$?
set -e
if [[ "$sensitive_hook_status" -ne 2 ]]; then
  echo "敏感文件 Hook 未使用 Claude Code 官方阻断退出码 2"
  missing=1
else
  echo "正常：敏感文件 Hook 使用退出码 2 真正阻断"
fi

echo
echo "== 每次需求前 Git 增量同步回归 =="
git_sync_agent_entry=".claude/agents/lead.md"
[[ "$formal_claude_subdir" -eq 1 ]] && git_sync_agent_entry="../agents/lead.md"
for required_ref in \
  "agents/lead/workflow.md::git-activity-watch" \
  "rule/tasks/index.md::git-activity-watch" \
  "rule/agents/lead.md::project/change-log" \
  "$git_sync_agent_entry::git-activity-watch"; do
  required_file="${required_ref%%::*}"
  required_text="${required_ref#*::}"
  if ! grep -Fq "$required_text" "$required_file"; then
    echo "需求前 Git 同步指引缺失：$required_file -> $required_text"
    missing=1
  fi
done
if command -v git >/dev/null 2>&1; then
  git_fixture="$(mktemp -d)"
  git_brain="$git_fixture/brain"
  git_project="$git_fixture/project"
  mkdir -p "$git_brain/hooks/scripts" "$git_brain/project" "$git_brain/shared/events" "$git_brain/logs/hook" "$git_brain/index" "$git_project/src"
  printf '%s\n' '# 项目代码变化' > "$git_brain/project/change-log.md"
  printf '%s\n' '# 项目上下文' > "$git_brain/project/context.md"
  printf '%s\n' '# 状态' > "$git_brain/index/STATUS.md"
  git -C "$git_project" init -q
  git -C "$git_project" config user.name "Local User"
  git -C "$git_project" config user.email "local@example.com"
  printf '%s\n' 'initial' > "$git_project/README.md"
  git -C "$git_project" add README.md
  git -C "$git_project" commit -q -m "initial"
  printf '%s' '{"hook_event_name":"UserPromptSubmit"}' | AI_TEAMS_ROOT="$git_brain" CLAUDE_PROJECT_DIR="$git_project" node hooks/scripts/ai-teams-run-hook.mjs git-activity-watch >/dev/null
  printf '%s\n' 'export const feature = true;' > "$git_project/src/feature.ts"
  git -C "$git_project" add src/feature.ts
  GIT_AUTHOR_NAME="Teammate" GIT_AUTHOR_EMAIL="teammate@example.com" git -C "$git_project" commit -q -m "feat: teammate change"
  printf '%s' '{"hook_event_name":"UserPromptSubmit"}' | AI_TEAMS_ROOT="$git_brain" CLAUDE_PROJECT_DIR="$git_project" node hooks/scripts/ai-teams-run-hook.mjs git-activity-watch >/dev/null
  if grep -Fq 'Teammate' "$git_brain/project/change-log.md" && \
     grep -Fq '同事/外部' "$git_brain/project/change-log.md" && \
     grep -Fq 'src/feature.ts' "$git_brain/project/change-log.md" && \
     grep -Fq '"teammateCommitCount": 1' "$git_brain/shared/events/git-state.json"; then
    echo "正常：UserPromptSubmit Hook 将同事增量提交刷新到 project/"
  else
    echo "Git 增量同步回归失败：未正确写入同事提交、变更文件或状态"
    missing=1
  fi
  rm -rf "$git_fixture"
else
  echo "提示：未安装 git，跳过 Git 增量同步回归。"
fi

echo
echo "== JSON Registry =="
if command -v python3 >/dev/null 2>&1; then
  if AI_TEAMS_SETTINGS_FILE="$claude_settings_file" AI_TEAMS_FORMAL_SUBDIR="$formal_claude_subdir" python3 - <<'PY'
import json
import os
from pathlib import Path

agents = [
    "lead", "pd", "plan-pm", "dev-frontend-web", "dev-frontend-miniapp",
    "dev-backend-systems", "dev-backend-service", "qa", "memory", "doc",
    "role", "security-reviewer",
]
settings_path = Path(__import__("os").environ["AI_TEAMS_SETTINGS_FILE"])
data = json.loads(settings_path.read_text(encoding="utf-8"))
ai = data.get("ai_teams", {})
registered = {item.get("id"): item for item in ai.get("agents", []) if isinstance(item, dict)}
allowed_colors = {"red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"}
ok = True
formal = os.environ.get("AI_TEAMS_FORMAL_SUBDIR") == "1"
home_prefix = str(Path.home()).rstrip("/") + "/"
if ai.get("hooks_enabled") is not True:
    print(f"{settings_path} 未设置 ai_teams.hooks_enabled=true")
    ok = False
if data.get("disableAllHooks") is not False:
    print(f"{settings_path} 顶层 disableAllHooks 必须为 false")
    ok = False
if data.get("autoMemoryEnabled") is not False:
    print(f"{settings_path} 必须关闭独立 Auto Memory，避免绕过 AI-Teams Memory Agent")
    ok = False
if data.get("includeGitInstructions") is not False:
    print(f"{settings_path} 必须关闭默认 Git 指令注入，项目初始化以当前项目为主")
    ok = False
hooks = data.get("hooks", {})
for event in ("SessionStart", "UserPromptSubmit", "PreToolUse", "PostToolUse", "PostToolUseFailure", "PermissionDenied", "SubagentStart", "SubagentStop", "TaskCompleted", "PreCompact", "PostCompact", "StopFailure", "Stop"):
    if not isinstance(hooks.get(event), list) or not hooks.get(event):
        print(f"{settings_path} 顶层 hooks 缺少 {event}")
        ok = False
hook_text = json.dumps(hooks, ensure_ascii=False)
for required_hook in ("ai-teams-run-hook.mjs", "agent-heartbeat.mjs", "ai-teams-user-prompt-submit.sh", "context-compression-check.sh", "native-claude-memory-audit", "lock-timeout-check.sh", "sensitive-file-check.sh", "delete-check.sh", "prompt-contract-check.mjs", "prompt-evolution-event.mjs"):
    if required_hook not in hook_text:
        print(f"{settings_path} hooks 缺少脚本：{required_hook}")
        ok = False
task_completed_text = json.dumps(hooks.get("TaskCompleted", []), ensure_ascii=False)
task_completed_hooks = []
for group in hooks.get("TaskCompleted", []):
    if not isinstance(group, dict):
        continue
    for hook in group.get("hooks", []):
        if not isinstance(hook, dict):
            continue
        task_completed_hooks.append(" ".join([
            str(hook.get("command", "")),
            *[str(value) for value in hook.get("args", []) if isinstance(value, str)],
        ]))
if not any("prompt-evolution-event.mjs" in signature and "task-completed" in signature for signature in task_completed_hooks):
    print(f"{settings_path} TaskCompleted 未接入提示词失败事件采集")
    ok = False
for groups in hooks.values():
    if not isinstance(groups, list):
        continue
    for group in groups:
        if not isinstance(group, dict):
            continue
        for hook in group.get("hooks", []):
            if not isinstance(hook, dict) or hook.get("type") != "command":
                continue
            command = hook.get("command")
            args = hook.get("args")
            if command == "node":
                if not isinstance(args, list) or not args:
                    print(f"{settings_path} Node Hook 缺少 args 执行目标")
                    ok = False
                    continue
                target = str(args[0])
                if not target.startswith("${CLAUDE_PROJECT_DIR}/"):
                    print(f"{settings_path} Node Hook 未从 CLAUDE_PROJECT_DIR 解析：{target}")
                    ok = False
                duplicate_root = ".claude/ai-teams/"
                if f"{duplicate_root}{duplicate_root}" in target:
                    print(f"{settings_path} Node Hook 出现重复 AI-Teams 路径：{target}")
                    ok = False
if "bash -lc" in hook_text:
    print(f"{settings_path} hooks 仍使用 Bash shell 字符串，不符合跨平台 Hook 规则")
    ok = False
if "bash .claude/ai-teams/hooks/scripts/delete-check.sh" in hook_text:
    print(f"{settings_path} hooks 仍使用易受 cwd 影响的直接脚本路径")
    ok = False
if home_prefix != "/" and home_prefix in hook_text:
    print(f"{settings_path} hooks 含本机绝对路径")
    ok = False
if formal:
    expected_entrypoints = {
        ".claude/ai-teams/index/ENTRY.md",
        ".claude/ai-teams/rule/index.md",
        ".claude/ai-teams/agents/index.md",
        ".claude/ai-teams/project/index.md",
        ".claude/ai-teams/memory/index.md",
        ".claude/ai-teams/security/index.md",
        ".claude/ai-teams/prompts/index.md",
        ".claude/ai-teams/shared/index.md",
        ".claude/ai-teams/playbook.md",
    }
    if ai.get("brain_root") != ".claude/ai-teams":
        print(f"{settings_path} 运行包 brain_root 必须为 .claude/ai-teams")
        ok = False
    if ai.get("default_agent_mode") != "multi-agent" or ai.get("lead_agent") != "lead":
        print(f"{settings_path} 运行包必须默认由 lead 调度 multi-agent")
        ok = False
    runtime = ai.get("subagent_runtime", {})
    if runtime.get("official_project_dir") != ".claude/agents/":
        print(f"{settings_path} 运行包必须登记 Claude Code 官方 Agent 目录")
        ok = False
    if not expected_entrypoints.issubset(set(ai.get("entrypoints", []))):
        print(f"{settings_path} 运行包最小工程入口不完整")
        ok = False
    policy = ai.get("policy", {})
    for key in ("initialization", "security", "memory", "prompts", "multi_agent"):
        if not policy.get(key):
            print(f"{settings_path} 运行包缺少 ai_teams.policy.{key}")
            ok = False
    for forbidden_key in (
        "agents", "project_management", "mcp", "rule_routing",
        "prompt_management", "security",
    ):
        if forbidden_key in ai:
            print(f"{settings_path} 运行包不应内嵌长篇 ai_teams.{forbidden_key} 元数据")
            ok = False
    memory_governance = ai.get("memory_governance", {})
    if memory_governance.get("auto_memory_enabled") is not False:
        print(f"{settings_path} 运行包必须关闭原生 auto memory")
        ok = False
    if memory_governance.get("native_claude_memory_policy") != "audit-and-ignore":
        print(f"{settings_path} 运行包原生记忆策略必须为 audit-and-ignore")
        ok = False
    official_agents = settings_path.parent / "agents"
    for agent in agents:
        agent_file = official_agents / f"{agent}.md"
        if not agent_file.is_file():
            print(f"运行包缺少 Claude Code 官方 Agent 定义：{agent_file}")
            ok = False
            continue
        text = agent_file.read_text(encoding="utf-8")
        if f"name: {agent}" not in text:
            print(f"运行包 Agent frontmatter name 异常：{agent_file}")
            ok = False
        if not any(f"color: {color}" in text for color in allowed_colors):
            print(f"运行包 Agent frontmatter color 缺失或非法：{agent_file}")
            ok = False
    if not ok:
        raise SystemExit(1)
    raise SystemExit(0)
if ai.get("default_agent_mode") != "multi-agent":
    print(f"{settings_path} 未设置 default_agent_mode=multi-agent")
    ok = False
if ai.get("lead_agent") != "lead":
    print(f"{settings_path} 未设置 lead_agent=lead")
    ok = False
runtime_policy = ai.get("runtime_policy", {})
if runtime_policy.get("must_follow_ai_teams") is not True:
    print(f"{settings_path} 未强制 must_follow_ai_teams=true")
    ok = False
if runtime_policy.get("multi_agent_default") != "required":
    print(f"{settings_path} 未强制 multi_agent_default=required")
    ok = False
if runtime_policy.get("require_project_initialization_check") is not True:
    print(f"{settings_path} 未强制初始化检查")
    ok = False
if runtime_policy.get("require_harness_root_and_target_project_root") is not True:
    print(f"{settings_path} 未强制区分 harness_root 与 target_project_root")
    ok = False
paths = ai.get("paths", {})
if not paths.get("harness_root"):
    print(f"{settings_path} 缺少 paths.harness_root")
    ok = False
if "target_project_root" not in paths:
    print(f"{settings_path} 缺少 paths.target_project_root")
    ok = False
initialization = ai.get("initialization", {})
if initialization.get("required_before_project_work") is not True:
    print(f"{settings_path} 未强制 required_before_project_work")
    ok = False
if not initialization.get("windows_command"):
    print(f"{settings_path} initialization 缺少 Windows PowerShell 命令")
    ok = False
if initialization.get("agent_review_required_after_script") is not True:
    print(f"{settings_path} 未要求初始化后 Agent 复核")
    ok = False
for reviewer in ("doc", "pd", "plan-pm", "dev-frontend-web", "dev-frontend-miniapp", "dev-backend-systems", "dev-backend-service", "qa", "security-reviewer", "memory", "role"):
    if reviewer not in initialization.get("review_agents", []):
        print(f"{settings_path} initialization.review_agents 缺少 {reviewer}")
        ok = False
project_management = ai.get("project_management", {})
if project_management.get("owner") != "doc":
    print(f"{settings_path} project_management.owner 必须为 doc")
    ok = False
if project_management.get("frequent_read_required_for_all_agents") is not True:
    print(f"{settings_path} 未要求所有 Agent 频繁读取 project/")
    ok = False
if project_management.get("runtime_maintenance_policy") not in {"security/runtime-maintenance-policy.md", ".claude/ai-teams/security/runtime-maintenance-policy.md"}:
    print(f"{settings_path} project_management.runtime_maintenance_policy 指向异常")
    ok = False
for supervisor in ("doc", "memory", "role", "security-reviewer"):
    if supervisor not in project_management.get("parallel_supervisors_for_non_trivial_tasks", []):
        print(f"{settings_path} project_management.parallel_supervisors_for_non_trivial_tasks 缺少 {supervisor}")
        ok = False
for required_project_file in (
    "rule/index.md",
    "rule/agents/<agent>.md",
    "rule/project/index.md",
    "project/context.md",
    "project/change-log.md",
    "shared/tasks/<current-task>.md",
):
    project_files = project_management.get("frequent_read_files", [])
    if required_project_file not in project_files and f".claude/ai-teams/{required_project_file}" not in project_files:
        print(f"{settings_path} project_management.frequent_read_files 缺少 {required_project_file}")
        ok = False
rule_routing = ai.get("rule_routing", {})
for key in ("canonical_root", "claude_native_root", "default_read", "project_route", "full_file_catalog", "project_file_catalog", "refresh_command"):
    if not rule_routing.get(key):
        print(f"{settings_path} 缺少 ai_teams.rule_routing.{key}")
        ok = False
for required_route in ("rule/index.md", "rule/agents/<agent>.md", "rule/tasks/index.md"):
    route_entries = rule_routing.get("default_read", [])
    if required_route not in route_entries and f".claude/ai-teams/{required_route}" not in route_entries:
        print(f"{settings_path} ai_teams.rule_routing.default_read 缺少 {required_route}")
        ok = False
security = ai.get("security", {})
if security.get("policy_index") not in {"security/index.md", ".claude/ai-teams/security/index.md"}:
    print(f"{settings_path} 缺少 security.policy_index")
    ok = False
for required_rule in (
    "security/index.md",
    "security/project-policy.md",
    "security/file-ownership.md",
    "security/sensitive-files.md",
    "security/delete-policy.md",
    "security/task-policy.md",
	    "security/runtime-maintenance-policy.md",
	    "security/mcp-policy.md",
	    "security/lock-policy.md",
	    "security/state-policy.md",
	    "security/state-transaction-policy.md",
    "security/agent-playbooks/index.md",
    "security/prompt-policy.md",
    "security/prompt-injection-policy.md",
    "security/prompt-evolution-policy.md",
	):
	    rule_entries = security.get("rule_entrypoints", [])
	    if required_rule not in rule_entries and f".claude/ai-teams/{required_rule}" not in rule_entries:
	        print(f"{settings_path} security.rule_entrypoints 缺少 {required_rule}")
	        ok = False
prompt_management = ai.get("prompt_management", {})
for key in ("registry", "policy", "evolution_policy", "workspace", "renderer", "compiler"):
    if not prompt_management.get(key):
        print(f"{settings_path} 缺少 ai_teams.prompt_management.{key}")
        ok = False
if prompt_management.get("runtime_hot_swap") is not False:
    print(f"{settings_path} 必须设置 prompt_management.runtime_hot_swap=false")
    ok = False
if prompt_management.get("agent_can_edit_own_active_system") is not False:
    print(f"{settings_path} 必须禁止 Agent 修改自己的 active system prompt")
    ok = False
for required_mandatory in (
    "security/index.md",
    "security/project-policy.md",
    "security/runtime-maintenance-policy.md",
    "security/state-transaction-policy.md",
	    "security/supervision-policy.md",
):
    mandatory_entries = security.get("mandatory_read_before_project_work", [])
    if required_mandatory not in mandatory_entries and f".claude/ai-teams/{required_mandatory}" not in mandatory_entries:
        print(f"{settings_path} security.mandatory_read_before_project_work 缺少 {required_mandatory}")
        ok = False
for required_entrypoint in (
    "shared/events/index.md",
    "shared/transactions/index.md",
    "shared/supervision/current.md",
    "memory/native-claude-memory-audit.md",
    "tools/bin/ai-teams-memory-audit.mjs",
    "security/state-transaction-policy.md",
    "security/runtime-maintenance-policy.md",
):
    entrypoints = ai.get("entrypoints", [])
    if required_entrypoint not in entrypoints and f".claude/ai-teams/{required_entrypoint}" not in entrypoints:
        print(f"{settings_path} ai_teams.entrypoints 缺少 {required_entrypoint}")
        ok = False
memory_governance = ai.get("memory_governance", {})
if memory_governance.get("auto_memory_enabled") is not False:
    print(f"{settings_path} ai_teams.memory_governance.auto_memory_enabled 必须为 false")
    ok = False
if memory_governance.get("native_claude_memory_policy") != "audit-and-ignore":
    print(f"{settings_path} ai_teams.memory_governance.native_claude_memory_policy 必须为 audit-and-ignore")
    ok = False
if not memory_governance.get("native_claude_memory_audit"):
    print(f"{settings_path} ai_teams.memory_governance 缺少 native_claude_memory_audit")
    ok = False
if "ai-teams-memory-audit.mjs" not in str(memory_governance.get("audit_command", "")):
    print(f"{settings_path} ai_teams.memory_governance.audit_command 未指向 ai-teams-memory-audit.mjs")
    ok = False
mcp = ai.get("mcp", {})
for key in ("registry", "index", "shared_index", "agent_index", "agent_binding_pattern", "security_policy"):
    if not mcp.get(key):
        print(f"{settings_path} 缺少 ai_teams.mcp.{key}")
        ok = False
if mcp.get("registry") not in {"mcp/registry.json", ".claude/ai-teams/mcp/registry.json"}:
    print(f"{settings_path} ai_teams.mcp.registry 指向异常：{mcp.get('registry')}")
    ok = False
if mcp.get("security_policy") not in {"security/mcp-policy.md", ".claude/ai-teams/security/mcp-policy.md"}:
    print(f"{settings_path} ai_teams.mcp.security_policy 指向异常：{mcp.get('security_policy')}")
    ok = False
permissions = data.get("permissions", {})
deny = permissions.get("deny", [])
for required_deny in ("Read(./.env)", "Read(./**/.env)", "Read(./**/*token*)", "Read(./**/*.pem)"):
    if required_deny not in deny:
        print(f"{settings_path} permissions.deny 缺少 {required_deny}")
        ok = False
for agent in agents:
    item = registered.get(agent)
    if not item:
        print(f"{settings_path} 缺少 Agent 注册：{agent}")
        ok = False
        continue
    for key in ("entry", "playbook", "security_playbook", "memory", "kb", "skills", "mcp"):
        if not item.get(key):
            print(f"{settings_path} Agent 字段缺失：{agent}.{key}")
            ok = False
    if item.get("color") not in allowed_colors:
        print(f"{settings_path} Agent color 非法或缺失：{agent}.{item.get('color')}")
        ok = False
    if not item.get("style"):
        print(f"{settings_path} Agent style 缺失：{agent}")
        ok = False
if not ok:
    raise SystemExit(1)
PY
	  then
    if [[ "$formal_claude_subdir" -eq 1 ]]; then
      echo "正常：$claude_settings_file 使用最小路由，12 个 Agent 由 Claude Code 官方 .claude/agents 加载"
    else
      echo "正常：$claude_settings_file 已注册 12 个 Agent、颜色样式和强制 multi-agent 策略"
    fi
  else
    echo "$claude_settings_file Agent 注册检查失败"
    missing=1
  fi
	  for json_file in MANIFEST.json templates/registry.json mcp/registry.json mcp/claude-project.mcp.json mcp/optional-servers.mcp.example.json skills/registry.json; do
	    if python3 -m json.tool "$json_file" >/dev/null; then
	      echo "正常 JSON： $json_file"
    else
      echo "JSON 错误： $json_file"
	      missing=1
	    fi
	  done
	  if python3 - <<'PY'
import json
from pathlib import Path

version = Path("VERSION").read_text(encoding="utf-8").strip()
manifest = json.loads(Path("MANIFEST.json").read_text(encoding="utf-8"))
ok = True
home_prefix = str(Path.home()).rstrip("/") + "/"
if not version:
    print("VERSION 为空")
    ok = False
if manifest.get("version") != version:
    print(f"MANIFEST.json version 与 VERSION 不一致：{manifest.get('version')} != {version}")
    ok = False
if manifest.get("status") != "runtime-remediation-ready":
    print(f"MANIFEST.json status 未更新为 runtime-remediation-ready：{manifest.get('status')}")
    ok = False
text = json.dumps(manifest, ensure_ascii=False)
if home_prefix != "/" and home_prefix in text:
    print("MANIFEST.json 包含本机绝对路径")
    ok = False
if not ok:
    raise SystemExit(1)
PY
	  then
	    echo "正常：VERSION 与 MANIFEST.json 一致"
	  else
	    echo "VERSION / MANIFEST.json 检查失败"
	    missing=1
	  fi
	  if python3 - "$project_mcp_file" <<'PY'
import json
import sys
from pathlib import Path

project_mcp_file = Path(sys.argv[1])
agents = [
    "lead", "pd", "plan-pm", "dev-frontend-web", "dev-frontend-miniapp",
    "dev-backend-systems", "dev-backend-service", "qa", "memory", "doc",
    "role", "security-reviewer",
]
registry_path = Path("mcp/registry.json")
data = json.loads(registry_path.read_text(encoding="utf-8"))
ok = True
servers = data.get("servers", {})
default_servers = set(data.get("default_mcp_servers", []))
optional_servers = set(data.get("optional_mcp_servers", []))
required_server_ids = {
    "chrome", "context7", "shadcn", "filesystem", "figma",
    "mysql", "github", "codegraph", "puppeteer", "canva",
}
for required in sorted(required_server_ids):
    if required not in servers:
        print(f"MCP servers 缺少默认项：{required}")
        ok = False
    if required not in default_servers:
        print(f"MCP default_mcp_servers 缺少：{required}")
        ok = False
for server_id, item in servers.items():
    if not item.get("id") or not item.get("config_name") or not item.get("purpose") or not item.get("security_boundary"):
        print(f"MCP server 字段缺失：{server_id}")
        ok = False
    if item.get("enabled_by_default") and item.get("config_file") != ".mcp.json":
        print(f"默认 MCP 必须指向 .mcp.json：{server_id} -> {item.get('config_file')}")
        ok = False
registry_agents = data.get("agents", {})
for agent in agents:
    items = registry_agents.get(agent, [])
    if not items:
        print(f"Agent MCP 绑定为空：{agent}")
        ok = False
    for item in items:
        if not item.get("id") or not item.get("config_name") or not item.get("config_file") or not item.get("purpose"):
            print(f"Agent MCP 条目字段缺失：{agent} -> {item}")
            ok = False
        if not Path(f"mcp/agents/{agent}/index.md").is_file():
            print(f"Agent MCP 绑定文件不存在：mcp/agents/{agent}/index.md")
            ok = False
qa_ids = {item.get("id") for item in registry_agents.get("qa", [])}
if "chrome" not in qa_ids:
    print("QA 未绑定 Chrome MCP")
    ok = False
registry_text = json.dumps(data, ensure_ascii=False).lower()
home_prefix = str(Path.home()).rstrip("/").lower() + "/"
for forbidden in (home_prefix, "actual_token", "actual_secret", "actual_password", "sk-", "ghp_", "figd_"):
    if forbidden in registry_text:
        print(f"MCP registry 疑似包含不可迁移路径或敏感值：{forbidden}")
        ok = False
project_mcp = json.loads(project_mcp_file.read_text(encoding="utf-8"))
canonical_mcp = json.loads(Path("mcp/claude-project.mcp.json").read_text(encoding="utf-8"))
for label, config in ((".mcp.json", project_mcp), ("mcp/claude-project.mcp.json", canonical_mcp)):
    names = set((config.get("mcpServers") or {}).keys())
    required_config_names = {
        servers[server_id].get("config_name")
        for server_id in required_server_ids
        if server_id in servers
    }
    for required_name in sorted(required_config_names):
        if required_name not in names:
            print(f"{label} 缺少 MCP server：{required_name}")
            ok = False
optional_text = Path("mcp/optional-servers.mcp.example.json").read_text(encoding="utf-8").lower()
home_prefix = str(Path.home()).rstrip("/").lower() + "/"
for forbidden in (home_prefix, "sk-", "ghp_", "figd_"):
    if forbidden in optional_text:
        print(f"optional MCP 模板疑似包含不可迁移路径或敏感值：{forbidden}")
        ok = False
if not ok:
    raise SystemExit(1)
PY
  then
    echo "正常：MCP registry 已覆盖 12 个 Agent，QA 已绑定 Chrome MCP"
  else
    echo "MCP registry 检查失败"
    missing=1
  fi
  if python3 - <<'PY'
import json
from pathlib import Path

agents = [
    "lead", "pd", "plan-pm", "dev-frontend-web", "dev-frontend-miniapp",
    "dev-backend-systems", "dev-backend-service", "qa", "memory", "doc",
    "role", "security-reviewer",
]
data = json.loads(Path("skills/registry.json").read_text(encoding="utf-8"))
ok = True
home_prefix = str(Path.home()).rstrip("/") + "/"
for agent in agents:
    items = data.get("agents", {}).get(agent, [])
    if not items:
        print(f"Agent Skills 绑定为空：{agent}")
        ok = False
    for item in items:
        if item.get("status") != "installed-local-copy":
            print(f"Agent Skill 状态异常：{agent} -> {item.get('slug')} -> {item.get('status')}")
            ok = False
        if home_prefix != "/" and home_prefix in json.dumps(item, ensure_ascii=False):
            print(f"Agent Skill 条目包含本机绝对路径：{agent} -> {item.get('slug')}")
            ok = False
        skill_file = Path(item.get("skill_file", ""))
        if skill_file.is_absolute() or not str(skill_file).startswith(f"skills/agents/{agent}/"):
            print(f"Agent Skill 文件路径必须为工程内相对路径：{agent} -> {skill_file}")
            ok = False
        if not skill_file.is_file():
            print(f"Agent Skill 文件不存在：{agent} -> {skill_file}")
            ok = False
if not ok:
    raise SystemExit(1)
PY
  then
    echo "正常：Agent Skills registry 已绑定工程内 Skills 副本"
  else
    echo "Agent Skills registry 检查失败"
    missing=1
  fi
else
  echo "跳过：未找到 python3，无法执行 JSON 语法检查"
fi

echo
echo "== 旧 Skills 路径引用 =="
legacy_skill_root="${AI_TEAMS_LEGACY_SKILL_ROOT:-${HOME:-}/.agents/skills}"
legacy_status="registered-installed"
legacy_status="$legacy_status-global"
legacy_refs="$(rg -n "$legacy_skill_root|$legacy_status" README.md CLAUDE.md index kb tools skills agents project templates 2>/dev/null || true)"
if [[ -n "$legacy_refs" ]]; then
  echo "发现旧 Skills 路径或状态引用："
  printf "%s\n" "$legacy_refs"
  missing=1
else
  echo "正常：未发现旧 Skills 全局路径或旧状态引用"
fi

if [[ "$missing" -eq 1 ]]; then
  echo
  echo "AI-Teams 结构自检失败。"
  exit 1
fi

echo
echo "AI-Teams 结构自检通过。"
