#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ai-teams-lib.sh"
ai_teams_require_root
ai_teams_ensure_runtime_dirs

edition="${1:-}"
version=""
output=""
verify=0
install_layout=""

if [[ "$edition" == "formal" || "$edition" == "simplify" ]]; then
  shift
else
  cat <<'EOF'
用法：tools/bin/ai-teams-package.sh formal|simplify [--version 版本] [--output 目录] [--install-layout root|claude-subdir] [--verify]
EOF
  exit 2
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      version="${2:-}"
      shift 2
      ;;
    --output)
      output="${2:-}"
      shift 2
      ;;
    --verify)
      verify=1
      shift
      ;;
    --install-layout)
      install_layout="${2:-}"
      shift 2
      ;;
    -h|--help)
      cat <<'EOF'
用法：tools/bin/ai-teams-package.sh formal|simplify [--version 版本] [--output 目录] [--install-layout root|claude-subdir] [--verify]

说明：
- formal 生成正式版，排除主工程研发日志、实验草稿、会话、缓存、本地配置和敏感文件。
- simplify 生成精简版，保留核心 Agent、初始化、基础记忆、知识库、安全、日志、回滚和模板。
- formal 默认使用 --install-layout claude-subdir：输出可直接合并到目标项目根目录，AI-Teams 位于 .claude/ai-teams/。
- --install-layout root：输出目录本身就是 AI-Teams 根目录，仅用于调试或兼容场景。
EOF
      exit 0
      ;;
    *)
      echo "未知参数：$1" >&2
      exit 2
      ;;
  esac
done

if [[ -z "$install_layout" ]]; then
  if [[ "$edition" == "formal" ]]; then
    install_layout="claude-subdir"
  else
    install_layout="root"
  fi
fi

case "$install_layout" in
  root|claude-subdir)
    ;;
  *)
    echo "未知安装布局：$install_layout" >&2
    exit 2
    ;;
esac

if [[ "$edition" != "formal" && "$install_layout" != "root" ]]; then
  echo "当前只有 formal 支持 --install-layout claude-subdir" >&2
  exit 2
fi

if [[ -z "$version" ]]; then
  if [[ -f VERSION ]]; then
    version="$(tr -d '[:space:]' < VERSION)"
  elif command -v python3 >/dev/null 2>&1 && [[ -f MANIFEST.json ]]; then
    version="$(python3 - <<'PY'
import json
from pathlib import Path

try:
    data = json.loads(Path("MANIFEST.json").read_text(encoding="utf-8"))
    print(data.get("version") or "1.0.0")
except Exception:
    print("1.0.0")
PY
)"
  else
    version="1.0.0"
  fi
fi
stamp="$(ai_teams_stamp)"
if [[ -z "$output" ]]; then
  default_output_root="${AI_TEAMS_PACKAGE_OUTPUT_ROOT:-${HOME}/CC-RADT-dist}"
  if [[ "$edition" == "formal" ]]; then
    output="${default_output_root}/formal"
  else
    output="${default_output_root}/${edition}-${version}-${stamp}"
  fi
fi

if [[ -e "$output" ]]; then
  if [[ ! -d "$output" ]]; then
    echo "输出路径已存在且不是目录：$output" >&2
    exit 1
  fi
  if [[ -n "$(find "$output" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]]; then
    echo "输出目录已存在且非空：$output" >&2
    echo "为避免覆盖用户文件，请先清空目录或指定新的 --output。" >&2
    exit 1
  fi
fi

artifact_root="$output"
payload_root="$artifact_root"
if [[ "$edition" == "formal" && "$install_layout" == "claude-subdir" ]]; then
  payload_root="$artifact_root/.claude/ai-teams"
fi
mkdir -p "$payload_root" logs/package
output="$payload_root"

copy_formal() {
  rsync -a \
    --exclude "CLAUDE.md" \
    --exclude ".git/" \
    --exclude ".DS_Store" \
    --exclude ".env" \
    --exclude ".env.*" \
    --exclude "*.pem" \
    --exclude "*.key" \
    --exclude "*.p12" \
    --exclude "*.pfx" \
    --exclude "id_rsa" \
    --exclude "id_ed25519" \
    --exclude "secrets.*" \
    --exclude "credentials.*" \
    --exclude "service-account*.json" \
    --exclude "node_modules/" \
    --exclude "__pycache__/" \
    --exclude "*.pyc" \
    --exclude "*.pyo" \
    --exclude ".cache/" \
    --exclude "tmp/" \
    --exclude ".codegraph/" \
    --exclude "lab/" \
    --exclude ".claude/settings.local.json" \
    --exclude "logs/*" \
    --exclude "memory/conversations/sessions/*" \
    --exclude "shared/supervision/.runtime/" \
    --exclude "tests/fixtures/private/" \
    --exclude "releases/" \
    ./ "$output/"
}

normalize_payload_claude_settings() {
  command -v python3 >/dev/null 2>&1 || return 0
  [[ -f "$output/.claude/settings.json" ]] || return 0
  python3 - "$output/.claude/settings.json" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
data = json.loads(path.read_text(encoding="utf-8"))
data.setdefault("$schema", "https://json.schemastore.org/claude-code-settings.json")
data["agent"] = "lead"
data.pop("notes", None)
data["permissions"] = {
    "deny": [
        "Read(./.env)",
        "Read(./.env.*)",
        "Read(./**/.env)",
        "Read(./**/.env.*)",
        "Read(./**/*credentials*)",
        "Read(./**/*credential*)",
        "Read(./**/*token*)",
        "Read(./**/*secret*)",
        "Read(./**/*.pem)",
        "Read(./**/*.key)",
        "Read(./**/*.p12)",
        "Read(./**/*.pfx)",
        "Read(./**/id_rsa)",
        "Read(./**/id_ed25519)",
        "Read(./**/service-account*.json)",
        "Bash(rm -rf *)",
        "Bash(git reset --hard*)",
        "Bash(git clean -fd*)",
        "Bash(git push --force*)",
    ]
}
ai = data.setdefault("ai_teams", {})
ai.pop("notes", None)
ai["stage"] = "runtime"
ai["brain_root"] = "."
ai.setdefault("default_agent_mode", "multi-agent")
ai.setdefault("lead_agent", "lead")
ai["subagent_runtime"] = {
    "official_project_dir": ".claude/agents/",
    "component_agent_dir": "agents/",
    "policy": "Claude Code 官方 subagent 从 .claude/agents/*.md 加载 AI-Teams 的 12 个 Agent、颜色和 Lead 调度白名单；Agent 组件文档、记忆、知识库、规则、共享工作区、Hooks、MCP、Skills 和项目画像由 AI-Teams 工程目录管理。",
}
ai["paths"] = {
    "harness_root": ".",
    "target_project_root": None,
    "target_project_source": "payload 内部配置；根 .claude/settings.json 会指向目标项目根目录。",
}
ai["runtime_policy"] = {
    "must_follow_ai_teams": True,
    "multi_agent_default": "required",
    "lead_agent_required": True,
    "require_project_initialization_check": True,
    "require_harness_root_and_target_project_root": True,
    "per_query_policy": "每次用户请求进入时，先确认 AI-Teams harness 工程根目录与目标项目根目录；未初始化目标项目时，主动询问并引导执行初始化；除非用户明确要求单 Agent、不要多 Agent 或只回答，否则必须按 AI-Teams 多 Agent 流程执行。",
    "single_agent_override_phrases": ["单 Agent", "单Agent", "不需要多Agent", "不要多 Agent", "只回答", "不要启动多Agent", "不要启动多 Agent"],
}
ai["initialization"] = {
    "required_before_project_work": True,
    "command": "bash tools/bin/ai-teams-init-project.sh --target <目标项目路径> --write",
    "windows_command": "pwsh -NoProfile -ExecutionPolicy Bypass -File tools/bin/ai-teams-init-project.ps1 -Target <目标项目路径> -Write",
    "ask_user_when_missing": "未发现已初始化目标项目画像时，必须先询问目标项目路径和是否立即初始化。",
    "writes_to": ["project/", "index/", "memory/"],
    "never_reads_sensitive_content": True,
    "agent_review_required_after_script": True,
    "review_agents": ["doc", "pd", "plan-pm", "dev-frontend-web", "dev-frontend-miniapp", "dev-backend-systems", "dev-backend-service", "qa", "security-reviewer", "memory", "role"],
}
extra_entrypoints = [
    "rule/index.md",
    "rule/routing.md",
    "rule/agents/index.md",
    "rule/tasks/index.md",
    "rule/custom/index.md",
    "rule/custom/agents/index.md",
    "rule/custom/project/index.md",
    "rule/custom/security/index.md",
    "rule/project/index.md",
    "rule/catalog/index.md",
    "rule/security/index.md",
    "rule/shared/index.md",
    "rule/memory/index.md",
    "rule/tools/index.md",
    "project/change-log.md",
    "project/rules/index.md",
    "project/graph.md",
    "security/file-ownership.md",
    "security/sensitive-files.md",
    "security/delete-policy.md",
    "security/task-policy.md",
    "security/lock-policy.md",
    "security/state-policy.md",
    "security/state-transaction-policy.md",
    "security/supervision-policy.md",
    "security/rule-policy.md",
    "security/escalation-policy.md",
    "security/workspace-policy.md",
    "security/context-compression-policy.md",
    "index/NAVIGATION.md",
    "security/runtime-maintenance-policy.md",
    "security/interface-contract-policy.md",
    "security/development-policy.md",
    "security/agent-playbooks/index.md",
    "shared/events/index.md",
    "shared/transactions/index.md",
    "shared/supervision/index.md",
    "shared/supervision/current.md",
    "shared/supervision/heartbeat.md",
    "shared/supervision/heartbeat-current.md",
    "memory/native-claude-memory-audit.md",
    "memory/context-compression.md",
    "memory/refresh-rules.md",
    "tools/bin/ai-teams-memory-audit.mjs",
    "agents/memory/memorys/index.md",
]
ai["entrypoints"] = list(dict.fromkeys([*ai.get("entrypoints", []), *extra_entrypoints]))
ai["memory_governance"] = {
    "auto_memory_enabled": False,
    "formal_memory_root": "memory/",
    "native_claude_memory_policy": "audit-and-ignore",
    "native_claude_memory_audit": "memory/native-claude-memory-audit.md",
    "audit_command": "node tools/bin/ai-teams-memory-audit.mjs --write",
    "compact_candidate_policy": "PreCompact/PostCompact/Stop 只生成恢复候选；正式记忆由 Memory Agent 筛选写入。",
}
ai["rule_routing"] = {
    "canonical_root": "rule/",
    "claude_native_root": ".claude/rules/",
    "default_read": [
        "rule/index.md",
        "rule/agents/<agent>.md",
        "rule/tasks/index.md",
    ],
    "custom_route": "rule/custom/index.md",
    "custom_rule_create_command": "node tools/bin/ai-teams-rule-create.mjs --id <规则id> --title <标题> --scope <agents|project|security> --owner <agent> --trigger <触发条件> --write",
    "project_route": "rule/project/index.md",
    "full_file_catalog": "rule/catalog/files.md",
    "project_file_catalog": "rule/project/files.md",
    "refresh_command": "node tools/bin/ai-teams-rule-refresh.mjs --target <目标项目路径> --write",
    "policy": "索引优先、正文按需；只有索引缺失、过期或与代码冲突时才扩大搜索。",
}
ai["security"] = {
    "policy_index": "security/index.md",
    "mandatory_read_before_project_work": [
        "security/index.md",
        "security/project-policy.md",
        "security/runtime-maintenance-policy.md",
        "security/interface-contract-policy.md",
        "security/file-ownership.md",
        "security/sensitive-files.md",
        "security/task-policy.md",
        "security/lock-policy.md",
        "security/state-policy.md",
        "security/state-transaction-policy.md",
        "security/supervision-policy.md",
        "security/rule-policy.md",
        "security/delete-policy.md",
    ],
    "rule_entrypoints": [
        "security/index.md",
        "security/file-ownership.md",
        "security/sensitive-files.md",
        "security/delete-policy.md",
        "security/task-policy.md",
        "security/lock-policy.md",
        "security/state-policy.md",
        "security/state-transaction-policy.md",
        "security/supervision-policy.md",
        "security/rule-policy.md",
        "security/escalation-policy.md",
        "security/workspace-policy.md",
        "security/context-compression-policy.md",
        "index/NAVIGATION.md",
        "security/project-policy.md",
        "security/runtime-maintenance-policy.md",
        "security/development-policy.md",
        "security/development-frontend-web-policy.md",
        "security/development-frontend-miniapp-policy.md",
        "security/development-backend-systems-policy.md",
        "security/development-backend-service-policy.md",
        "security/interface-contract-policy.md",
        "security/adr.md",
        "security/agent-playbooks/index.md",
    ],
    "agent_playbooks": "security/agent-playbooks/<agent>.md",
    "permissions_deny_source": ".claude/settings.json permissions.deny",
}
ai["project_management"] = {
    "directory": "project/",
    "owner": "doc",
    "purpose": "记录目标项目画像、规则、架构、命令、验证、风险、需求、计划和执行中沉淀的项目上下文。Agent 先通过 rule/ 路由按需读取 project，不默认加载全部项目文档。",
    "policy": "security/project-policy.md",
    "runtime_maintenance_policy": "security/runtime-maintenance-policy.md",
    "frequent_read_required_for_all_agents": True,
    "frequent_read_files": [
        "rule/index.md",
        "rule/agents/<agent>.md",
        "rule/project/index.md",
        "project/context.md",
        "project/change-log.md",
        "shared/tasks/<current-task>.md",
    ],
    "parallel_supervisors_for_non_trivial_tasks": ["doc", "memory", "role", "security-reviewer"],
}
hooks = data.setdefault("hooks", {})
session = hooks.setdefault("SessionStart", [{"matcher": "startup|resume|clear|compact", "hooks": []}])
audit_args = [
    "${CLAUDE_PROJECT_DIR}/hooks/scripts/ai-teams-run-hook.mjs",
    "native-claude-memory-audit",
]
has_audit_hook = False
for group in session:
    if not isinstance(group, dict):
        continue
    hook_list = group.setdefault("hooks", [])
    hook_list[:] = [
        item for item in hook_list
        if not (
            isinstance(item, dict)
            and isinstance(item.get("command"), str)
            and "native-claude-memory-audit" in item.get("command", "")
        )
    ]
    if any(
        isinstance(item, dict) and item.get("args") == audit_args
        for item in hook_list
    ):
        has_audit_hook = True
if not has_audit_hook and session and isinstance(session[0], dict):
    session[0].setdefault("hooks", []).append({
        "type": "command",
        "command": "node",
        "args": audit_args,
    })
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY
}

write_formal_wrapper_claude_settings() {
  command -v python3 >/dev/null 2>&1 || {
    echo "生成安装包 .claude/settings.json 需要 python3" >&2
    exit 1
  }
  python3 - "$output/.claude/settings.json" "$artifact_root/.claude/settings.json" <<'PY'
import json
import sys
from pathlib import Path

source = Path(sys.argv[1])
target = Path(sys.argv[2])
data = json.loads(source.read_text(encoding="utf-8"))
data.setdefault("$schema", "https://json.schemastore.org/claude-code-settings.json")
data["agent"] = "lead"
data.pop("notes", None)
data["permissions"] = {
    "deny": [
        "Read(./.env)",
        "Read(./.env.*)",
        "Read(./**/.env)",
        "Read(./**/.env.*)",
        "Read(./**/*credentials*)",
        "Read(./**/*credential*)",
        "Read(./**/*token*)",
        "Read(./**/*secret*)",
        "Read(./**/*.pem)",
        "Read(./**/*.key)",
        "Read(./**/*.p12)",
        "Read(./**/*.pfx)",
        "Read(./**/id_rsa)",
        "Read(./**/id_ed25519)",
        "Read(./**/service-account*.json)",
        "Bash(rm -rf *)",
        "Bash(git reset --hard*)",
        "Bash(git clean -fd*)",
        "Bash(git push --force*)",
    ]
}
ai = data.setdefault("ai_teams", {})
ai.pop("notes", None)
prefix = ".claude/ai-teams/"

def prefixed(value):
    if not isinstance(value, str) or not value:
        return value
    if value.startswith(prefix):
        return value
    if value in {".", "./"}:
        return ".claude/ai-teams"
    if value.startswith("/"):
        return value
    return prefix + value.lstrip("./")

ai["stage"] = "runtime"
ai["brain_root"] = ".claude/ai-teams"
ai["install_layout"] = "claude-subdir"
ai["default_agent_mode"] = "multi-agent"
ai["lead_agent"] = ai.get("lead_agent") or "lead"
ai["subagent_runtime"] = {
    "official_project_dir": ".claude/agents/",
    "component_agent_dir": ".claude/ai-teams/agents/",
    "policy": "Claude Code 官方 subagent 从 .claude/agents/*.md 加载 AI-Teams 的 12 个 Agent、颜色和 Lead 调度白名单；Agent 组件文档、记忆、知识库、规则、共享工作区、Hooks、MCP、Skills 和项目画像由 .claude/ai-teams/ 管理。",
}
ai["paths"] = {
    "harness_root": ".claude/ai-teams",
    "target_project_root": ".",
    "target_project_source": "Claude Code 当前打开的目标项目根目录",
}
ai["runtime_policy"] = {
    "must_follow_ai_teams": True,
    "multi_agent_default": "required",
    "lead_agent_required": True,
    "require_project_initialization_check": True,
    "require_harness_root_and_target_project_root": True,
    "per_query_policy": "每次 query 进入时必须遵循 AI-Teams；非平凡任务默认多 Agent；未初始化目标项目时必须先询问并引导初始化；除非用户明确要求单 Agent、不要多 Agent 或只回答，否则不得降级为单 Agent。",
    "single_agent_override_phrases": ["单 Agent", "单Agent", "不需要多Agent", "不要多 Agent", "只回答", "不要启动多Agent", "不要启动多 Agent"],
}
ai["initialization"] = {
    "required_before_project_work": True,
    "command": "bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target \"$PWD\" --write",
    "windows_command": "pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write",
    "ask_user_when_missing": "未发现 .claude/ai-teams/project/context.md 已初始化目标项目时，必须主动询问用户是否初始化项目。",
    "harness_root_required": ".claude/ai-teams",
    "target_project_root_required": ".",
    "writes_to": [".claude/ai-teams/project/", ".claude/ai-teams/index/", ".claude/ai-teams/memory/"],
    "never_reads_sensitive_content": True,
    "agent_review_required_after_script": True,
    "review_agents": ["doc", "pd", "plan-pm", "dev-frontend-web", "dev-frontend-miniapp", "dev-backend-systems", "dev-backend-service", "qa", "security-reviewer", "memory", "role"],
}
ai["project_management"] = {
    "directory": ".claude/ai-teams/project/",
    "owner": "doc",
    "policy": ".claude/ai-teams/security/project-policy.md",
    "runtime_maintenance_policy": ".claude/ai-teams/security/runtime-maintenance-policy.md",
    "purpose": "持续记录目标项目画像、规则、架构、命令、验证、风险、需求、计划和运行期上下文。Agent 先通过 .claude/ai-teams/rule/ 路由按需读取 project，不默认加载全部项目文档。",
    "frequent_read_required_for_all_agents": True,
    "frequent_read_files": [
        ".claude/ai-teams/rule/index.md",
        ".claude/ai-teams/rule/agents/<agent>.md",
        ".claude/ai-teams/rule/project/index.md",
        ".claude/ai-teams/project/context.md",
        ".claude/ai-teams/project/change-log.md",
        ".claude/ai-teams/shared/tasks/<current-task>.md",
    ],
    "parallel_supervisors_for_non_trivial_tasks": ["doc", "memory", "role", "security-reviewer"],
}
ai["mcp"] = {
    "project_config": ".mcp.json",
    "canonical_project_config": ".claude/ai-teams/mcp/claude-project.mcp.json",
    "optional_servers_template": ".claude/ai-teams/mcp/optional-servers.mcp.example.json",
    "registry": ".claude/ai-teams/mcp/registry.json",
    "index": ".claude/ai-teams/mcp/index.md",
    "shared_index": ".claude/ai-teams/mcp/shared/index.md",
    "agent_index": ".claude/ai-teams/mcp/agents/index.md",
    "agent_binding_pattern": ".claude/ai-teams/mcp/agents/<agent>/index.md",
    "agent_pointer_pattern": ".claude/ai-teams/agents/<agent>/mcp.md",
    "security_policy": ".claude/ai-teams/security/mcp-policy.md",
    "portable_default_servers": [
        "ai-teams-chrome",
        "ai-teams-context7",
        "ai-teams-shadcn",
        "ai-teams-filesystem",
        "ai-teams-figma",
        "ai-teams-mysql",
        "ai-teams-github",
        "ai-teams-codegraph",
        "ai-teams-puppeteer-fallback",
        "ai-teams-canva-remote",
    ],
    "runtime_authorization_required_servers": [
        "ai-teams-figma",
        "ai-teams-mysql",
        "ai-teams-github",
        "ai-teams-canva-remote",
    ],
    "config_rule": "Claude Code 项目级 MCP 配置使用目标项目根目录 .mcp.json；settings 只登记入口、权限、Agent 和规则指针。",
    "secrets_policy": "never store MCP secret values in AI-Teams files or Claude Code settings",
}
ai["memory_governance"] = {
    "auto_memory_enabled": False,
    "formal_memory_root": ".claude/ai-teams/memory/",
    "native_claude_memory_policy": "audit-and-ignore",
    "native_claude_memory_audit": ".claude/ai-teams/memory/native-claude-memory-audit.md",
    "audit_command": "node .claude/ai-teams/tools/bin/ai-teams-memory-audit.mjs --write",
    "compact_candidate_policy": "PreCompact/PostCompact/Stop 只生成恢复候选；正式记忆由 Memory Agent 筛选写入。",
}
ai["entrypoints"] = [prefixed(item) for item in ai.get("entrypoints", [])]
ai["rule_routing"] = {
    "canonical_root": ".claude/ai-teams/rule/",
    "claude_native_root": ".claude/rules/",
    "default_read": [
        ".claude/ai-teams/rule/index.md",
        ".claude/ai-teams/rule/agents/<agent>.md",
        ".claude/ai-teams/rule/tasks/index.md",
    ],
    "custom_route": ".claude/ai-teams/rule/custom/index.md",
    "custom_rule_create_command": "node .claude/ai-teams/tools/bin/ai-teams-rule-create.mjs --id <规则id> --title <标题> --scope <agents|project|security> --owner <agent> --trigger <触发条件> --write",
    "project_route": ".claude/ai-teams/rule/project/index.md",
    "full_file_catalog": ".claude/ai-teams/rule/catalog/files.md",
    "project_file_catalog": ".claude/ai-teams/rule/project/files.md",
    "refresh_command": "node .claude/ai-teams/tools/bin/ai-teams-rule-refresh.mjs --target \"$PWD\" --write",
    "policy": "索引优先、正文按需；只有索引缺失、过期或与代码冲突时才扩大搜索。",
}
ai["prompt_management"] = {
    "registry": ".claude/ai-teams/prompts/registry.json",
    "index": ".claude/ai-teams/prompts/index.md",
    "graph": ".claude/ai-teams/prompts/graph.md",
    "agent_pattern": ".claude/ai-teams/prompts/agents/<agent>/index.md",
    "policy": ".claude/ai-teams/security/prompt-policy.md",
    "injection_policy": ".claude/ai-teams/security/prompt-injection-policy.md",
    "evolution_policy": ".claude/ai-teams/security/prompt-evolution-policy.md",
    "workspace": ".claude/ai-teams/shared/prompt-evolution/",
    "renderer": "node .claude/ai-teams/tools/bin/ai-teams-prompt-render.mjs",
    "compiler": "node .claude/ai-teams/tools/bin/ai-teams-prompt-compile.mjs",
    "runtime_hot_swap": False,
    "agent_can_edit_own_active_system": False,
    "task_prompt_contract_required": True,
    "activation_effect": "next-agent-invocation-or-new-session",
}
for hook_items in data.get("hooks", {}).values():
    if not isinstance(hook_items, list):
        continue
    for item in hook_items:
        if not isinstance(item, dict):
            continue
        for hook in item.get("hooks", []):
            if not isinstance(hook, dict):
                continue
            args = hook.get("args")
            if isinstance(args, list):
                hook["args"] = [
                    value.replace(
                        "${CLAUDE_PROJECT_DIR}/hooks/scripts/",
                        "${CLAUDE_PROJECT_DIR}/.claude/ai-teams/hooks/scripts/",
                    )
                    if isinstance(value, str)
                    else value
                    for value in args
                ]
            command = hook.get("command")
            if isinstance(command, str):
                command = command.replace("bash hooks/scripts/", "bash .claude/ai-teams/hooks/scripts/")
                command = command.replace("bash ./hooks/scripts/", "bash .claude/ai-teams/hooks/scripts/")
                command = command.replace("node hooks/scripts/", "node .claude/ai-teams/hooks/scripts/")
                command = command.replace("node ./hooks/scripts/", "node .claude/ai-teams/hooks/scripts/")
                hook["command"] = command
hooks = data.setdefault("hooks", {})
session = hooks.setdefault("SessionStart", [{"matcher": "startup|resume|clear|compact", "hooks": []}])
if session and isinstance(session[0], dict):
    hook_list = session[0].setdefault("hooks", [])
    audit_hook = {
        "type": "command",
        "command": "node",
        "args": [
            "${CLAUDE_PROJECT_DIR}/.claude/ai-teams/hooks/scripts/ai-teams-run-hook.mjs",
            "native-claude-memory-audit",
        ],
    }
    if all(item.get("args") != audit_hook["args"] for item in hook_list if isinstance(item, dict)):
        hook_list.append(audit_hook)
ai["security"] = {
    "policy_index": ".claude/ai-teams/security/index.md",
    "mandatory_read_before_project_work": [
        ".claude/ai-teams/security/index.md",
        ".claude/ai-teams/security/project-policy.md",
        ".claude/ai-teams/security/runtime-maintenance-policy.md",
        ".claude/ai-teams/security/interface-contract-policy.md",
        ".claude/ai-teams/security/file-ownership.md",
        ".claude/ai-teams/security/sensitive-files.md",
        ".claude/ai-teams/security/task-policy.md",
        ".claude/ai-teams/security/mcp-policy.md",
        ".claude/ai-teams/security/lock-policy.md",
        ".claude/ai-teams/security/state-policy.md",
        ".claude/ai-teams/security/state-transaction-policy.md",
        ".claude/ai-teams/security/supervision-policy.md",
        ".claude/ai-teams/security/rule-policy.md",
        ".claude/ai-teams/security/delete-policy.md",
        ".claude/ai-teams/security/prompt-policy.md",
        ".claude/ai-teams/security/prompt-injection-policy.md",
        ".claude/ai-teams/security/prompt-evolution-policy.md",
    ],
    "rule_entrypoints": [
        ".claude/ai-teams/security/index.md",
        ".claude/ai-teams/security/file-ownership.md",
        ".claude/ai-teams/security/sensitive-files.md",
        ".claude/ai-teams/security/delete-policy.md",
        ".claude/ai-teams/security/task-policy.md",
        ".claude/ai-teams/security/mcp-policy.md",
        ".claude/ai-teams/security/lock-policy.md",
        ".claude/ai-teams/security/state-policy.md",
        ".claude/ai-teams/security/state-transaction-policy.md",
        ".claude/ai-teams/security/supervision-policy.md",
        ".claude/ai-teams/security/rule-policy.md",
        ".claude/ai-teams/security/escalation-policy.md",
        ".claude/ai-teams/security/workspace-policy.md",
        ".claude/ai-teams/security/context-compression-policy.md",
        ".claude/ai-teams/index/NAVIGATION.md",
        ".claude/ai-teams/security/project-policy.md",
        ".claude/ai-teams/security/runtime-maintenance-policy.md",
        ".claude/ai-teams/security/development-policy.md",
        ".claude/ai-teams/security/development-frontend-web-policy.md",
        ".claude/ai-teams/security/development-frontend-miniapp-policy.md",
        ".claude/ai-teams/security/development-backend-systems-policy.md",
        ".claude/ai-teams/security/development-backend-service-policy.md",
        ".claude/ai-teams/security/interface-contract-policy.md",
        ".claude/ai-teams/security/adr.md",
        ".claude/ai-teams/security/agent-playbooks/index.md",
        ".claude/ai-teams/security/prompt-policy.md",
        ".claude/ai-teams/security/prompt-injection-policy.md",
        ".claude/ai-teams/security/prompt-evolution-policy.md",
    ],
    "agent_playbooks": ".claude/ai-teams/security/agent-playbooks/<agent>.md",
    "permissions_deny_source": ".claude/settings.json permissions.deny",
}

for agent in ai.get("agents", []):
    for key in ("entry", "playbook", "security_playbook", "memory", "kb", "skills", "mcp"):
        if key in agent:
            agent[key] = prefixed(agent[key])

data["ai_teams"] = {
    "version": str(ai.get("version") or "1.0.0"),
    "hooks_enabled": True,
    "brain_root": ".claude/ai-teams",
    "default_agent_mode": "multi-agent",
    "lead_agent": "lead",
    "subagent_runtime": {
        "official_project_dir": ".claude/agents/",
        "component_agent_dir": ".claude/ai-teams/agents/",
    },
    "entrypoints": [
        ".claude/ai-teams/index/ENTRY.md",
        ".claude/ai-teams/rule/index.md",
        ".claude/ai-teams/agents/index.md",
        ".claude/ai-teams/project/index.md",
        ".claude/ai-teams/memory/index.md",
        ".claude/ai-teams/security/index.md",
        ".claude/ai-teams/prompts/index.md",
        ".claude/ai-teams/shared/index.md",
        ".claude/ai-teams/playbook.md",
    ],
    "policy": {
        "initialization": ".claude/ai-teams/security/project-policy.md",
        "security": ".claude/ai-teams/security/index.md",
        "memory": ".claude/ai-teams/memory/index.md",
        "prompts": ".claude/ai-teams/security/prompt-policy.md",
        "multi_agent": ".claude/rules/ai-teams-router.md",
    },
    "memory_governance": {
        "auto_memory_enabled": False,
        "native_claude_memory_policy": "audit-and-ignore",
        "native_claude_memory_audit": ".claude/ai-teams/memory/native-claude-memory-audit.md",
    },
}

def compact_scalar_arrays(text):
    lines = text.splitlines()
    result = []
    index = 0
    while index < len(lines):
        line = lines[index]
        stripped = line.strip()
        if stripped in {'"args": [', '"deny": ['}:
            indent = line[: len(line) - len(line.lstrip())]
            key = stripped.split('"', 2)[1]
            values = []
            cursor = index + 1
            trailing_comma = False
            while cursor < len(lines):
                current = lines[cursor].strip()
                if current in {"]", "],"}:
                    trailing_comma = current.endswith(",")
                    break
                values.append(json.loads(current.rstrip(",")))
                cursor += 1
            if cursor < len(lines):
                suffix = "," if trailing_comma else ""
                result.append(
                    f'{indent}"{key}": {json.dumps(values, ensure_ascii=False)}{suffix}'
                )
                index = cursor + 1
                continue
        result.append(line)
        index += 1
    return "\n".join(result) + "\n"

target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(
    compact_scalar_arrays(json.dumps(data, ensure_ascii=False, indent=2)),
    encoding="utf-8",
)
PY
}

write_formal_project_mcp_config() {
  local source_mcp="$output/mcp/claude-project.mcp.json"
  local fallback_mcp="$output/.mcp.json"
  local target_mcp="$artifact_root/.mcp.json"

  if [[ -f "$source_mcp" ]]; then
    cp "$source_mcp" "$target_mcp"
  elif [[ -f "$fallback_mcp" ]]; then
    cp "$fallback_mcp" "$target_mcp"
  else
    echo "安装包缺少可写入根目录的 MCP 项目配置：mcp/claude-project.mcp.json" >&2
    exit 1
  fi

  rm -f "$output/.mcp.json"
}

reset_formal_memory_audit_artifacts() {
  [[ "$edition" == "formal" ]] || return 0
  mkdir -p "$output/memory" "$output/shared/events"
  rm -f "$output/shared/events/native-claude-memory-audit.json"
  cat > "$output/memory/native-claude-memory-audit.md" <<'EOF'
---
id: "native-claude-memory-audit"
title: "Claude Code 原生记忆审计"
type: "memory-audit"
scope: "project"
owner: "memory"
status: "pending"
---
# Claude Code 原生记忆审计

<!-- AI-TEAMS:native-memory-audit:BEGIN -->

- 状态：待运行时审计。
- 触发：Claude Code `SessionStart` Hook 调用 `native-claude-memory-audit`。
- 输出：运行后更新本文件，并写入 shared/events/native-claude-memory-audit.json。
- 策略：Claude Code 原生 auto memory 目录采用 `audit-and-ignore`，不得作为 AI-Teams 事实来源。
- 内容边界：审计只读取目录和文件元数据，不读取原生记忆内容。

<!-- AI-TEAMS:native-memory-audit:END -->
EOF
}

write_formal_wrapper_local_example() {
  command -v python3 >/dev/null 2>&1 || {
    cp "$output/.claude/settings.local.example.json" "$artifact_root/.claude/settings.local.example.json"
    return
  }
  python3 - "$output/.claude/settings.local.example.json" "$artifact_root/.claude/settings.local.example.json" <<'PY'
import json
import sys
from pathlib import Path

source = Path(sys.argv[1])
target = Path(sys.argv[2])
if source.is_file():
    data = json.loads(source.read_text(encoding="utf-8"))
else:
    data = {
        "$schema": "https://json.schemastore.org/claude-code-settings.json",
        "permissions": {"allow": [], "deny": []},
        "env": {},
        "enabledMcpjsonServers": [],
    }
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY
}

write_formal_subagent_adapters() {
  command -v python3 >/dev/null 2>&1 || {
    echo "生成 Claude Code subagent 主定义需要 python3" >&2
    exit 1
  }
  python3 - "$output/.claude/settings.json" "$artifact_root/.claude/agents" <<'PY'
import json
import sys
from pathlib import Path

settings_path = Path(sys.argv[1])
target_dir = Path(sys.argv[2])
data = json.loads(settings_path.read_text(encoding="utf-8"))
agents = data.get("ai_teams", {}).get("agents", [])
target_dir.mkdir(parents=True, exist_ok=True)

focus = {
    "lead": ("接收用户需求、确认 AI-Teams 根目录和目标项目路径、默认启用多 Agent、只调度 AI-Teams 已定义 Agent；每次需求开始时确认 UserPromptSubmit 已执行 git-activity-watch 并读取 project/change-log.md，Git 不可用时跳过；派出多个 Agent 后每 10 秒检查心跳，在报错、权限拒绝、跑偏或停滞时立即接管，并检查 QA、Doc、Memory、Role、Security 的收尾结果。", "调度决策、任务路由、Lead 接管记录、最终验收、用户汇报。"),
    "pd": ("澄清业务目标、用户场景、范围边界、验收标准、待确认问题和需求风险。", "需求解析、需求边界、验收标准、待确认问题。"),
    "plan-pm": ("把需求拆成任务单、执行方案、Agent 分工、串并行关系、锁需求、状态更新和风险计划。", "任务单、执行方案、分工计划、状态板更新建议。"),
    "dev-frontend-web": ("执行 Vue、React、Angular、TypeScript、组件、路由、状态管理、API 请求、表单、权限、构建和前端验证相关任务。", "前端实现、变更说明、测试说明、风险和交接。"),
    "dev-frontend-miniapp": ("执行微信小程序、支付宝小程序、uni-app、登录授权、支付、订阅消息、分享、生命周期、路由、分包和平台差异适配任务。", "小程序实现、平台差异说明、测试说明、风险和交接。"),
    "dev-backend-systems": ("执行 C、C++、Java、Spring、系统级后端、构建系统、资源释放、并发安全、性能和稳定性任务。", "系统后端实现、构建/测试说明、风险和交接。"),
    "dev-backend-service": ("执行 Python、Go、Node.js/TypeScript、API、云原生服务、数据库迁移、配置、日志、错误处理、单元测试和集成测试任务。", "服务端实现、接口/迁移/配置说明、测试说明、风险和交接。"),
    "qa": ("执行代码评审、测试计划、回归验证、Chrome MCP 浏览器自动化、验收证据整理和风险确认。", "QA 报告、测试结果、缺陷清单、验收结论。"),
    "memory": ("筛选共享记忆、Agent 独立记忆、恢复点、上下文压缩候选和记忆健康状态；归档/压缩不等于删除。", "记忆候选处理、恢复点、压缩建议、记忆健康结论。"),
    "doc": ("并行维护 project、知识库、索引、文档关系图、文档链接、日志入口、MCP/Skills 文档和项目运行期事实。", "project 更新、知识库/图谱/索引维护、文档交接。"),
    "role": ("维护 Agent 职责边界、官方入口、组件指针、playbook 关联、MCP/Skills 指针和角色调整建议。", "Agent 指引维护结论、职责调整建议、索引更新建议。"),
    "security-reviewer": ("审查敏感文件、删除、命令、MCP、Hooks、锁、文件所有权、越界行为和高风险变更。", "安全审查结论、阻塞项、风险分级、允许/禁止建议。"),
}
descriptions = {
    "lead": "AI-Teams Lead 主 Agent；MUST BE USED PROACTIVELY for every non-trivial AI-Teams request. 默认启动多 Agent，调度 PD/Plan-PM/Dev/QA/Doc/Memory/Role/Security-Reviewer，禁止把 AI-Teams 任务交给 general-purpose。",
    "pd": "AI-Teams PD 需求解析 Agent；MUST BE USED PROACTIVELY for requirements, scope, product discovery, acceptance criteria, user stories, and unclear requests.",
    "plan-pm": "AI-Teams Plan-PM 计划管理 Agent；MUST BE USED PROACTIVELY for task planning, execution plans, scheduling, decomposition, status boards, and Agent assignment.",
    "dev-frontend-web": "AI-Teams Dev-Frontend-Web 前端 Web Agent；MUST BE USED PROACTIVELY for Vue, React, Angular, TypeScript frontend, components, routing, state, forms, API integration, and frontend validation.",
    "dev-frontend-miniapp": "AI-Teams Dev-Frontend-Miniapp 小程序 Agent；MUST BE USED PROACTIVELY for WeChat Mini Program, Alipay Mini Program, uni-app, login, authorization, payment, subscription messages, sharing, routing, and package splitting.",
    "dev-backend-systems": "AI-Teams Dev-Backend-Systems 系统后端 Agent；MUST BE USED PROACTIVELY for C, C++, Java, Spring, system backend, strongly constrained services, build systems, concurrency, performance, and stability.",
    "dev-backend-service": "AI-Teams Dev-Backend-Service 服务端 Agent；MUST BE USED PROACTIVELY for Python, Go, Node.js, TypeScript backend, API, cloud-native services, database migration, logging, config, and service tests.",
    "qa": "AI-Teams QA 测试与代码评审 Agent；MUST BE USED PROACTIVELY after development, refactor, package, release, migration, bugfix, audit, or validation tasks; handles review, tests, regression, Chrome MCP browser automation, and evidence.",
    "memory": "AI-Teams Memory 记忆管理 Agent；MUST BE USED PROACTIVELY for memory candidates, recovery points, context compression, long-term facts, and memory health during non-trivial tasks.",
    "doc": "AI-Teams Doc 文档管理 Agent；MUST BE USED PROACTIVELY for project/, indexes, 标准 Markdown graph, docs, KB, MCP/Skills docs, and runtime document maintenance during non-trivial project work.",
    "role": "AI-Teams Role 角色管理 Agent；MUST BE USED PROACTIVELY when Agent duties, .claude/agents entries, playbooks, tools, hooks, MCP, Skills, directories, or role boundaries change.",
    "security-reviewer": "AI-Teams Security-Reviewer 安全审查 Agent；MUST BE USED PROACTIVELY for sensitive files, deletion, commands, MCP, Hooks, locks, file ownership, permissions, credentials, and high-risk changes.",
}
runtime_directives = {
    "pd": """- 默认输出轻量“需求卡”：用户目标、业务字段、验收口径、待确认问题、不做范围、最小可计划任务。
- 页面或接口需求必须明确字段展示名、必填、默认值、枚举、空态、错误态和权限态；不确定就标记待确认，不猜技术字段。
- 只有跨模块、跨端、合规、安全、架构或用户明确要求时，才升级为完整需求文档。""",
    "plan-pm": """- 默认输出轻量“执行卡”：目标、Owner、输入、最短顺序、锁范围、QA 节点、回流条件。
- 前后端任务必须登记契约文件、前端 Owner、后端 Owner、字段/页面状态 QA 节点和不一致回流路径。
- 能串行完成的不强拆并行；只有跨模块、跨端、锁冲突、高风险或 Lead 明确要求时，才升级为完整执行方案。""",
    "dev-frontend-web": """- 页面与接口任务必须先读项目 UI 画像和已登记契约，不得猜字段或用临时假数据绕过缺口。
- 必须处理加载态、空态、错误态、权限态、禁用态、未知枚举、超长文本和重复提交。""",
    "dev-frontend-miniapp": """- 页面与接口任务必须先读项目 UI 画像和已登记契约，不得猜字段或把敏感服务端信息写入小程序。
- 必须处理平台差异、加载态、空态、错误态、权限态、未知枚举和弱网失败。""",
    "dev-backend-systems": """- 公共接口、DTO、Schema、序列化模型和错误结构变更前必须读取并更新契约。
- 不得擅自删除、改名、改类型、收紧可空性或遗漏前端已确认需要的字段。""",
    "dev-backend-service": """- API、DTO、Schema、序列化模型、枚举和错误结构变更前必须读取并更新契约。
- 不得擅自删除、改名、改类型、收紧可空性或遗漏前端已确认需要的字段。""",
    "qa": """- 前后端联调必须逐项核对字段名、类型、必填、可空、默认值、枚举、分页、鉴权和错误结构。
- 页面验收必须覆盖加载态、空态、错误态、权限态、禁用态、缺失字段、未知枚举、时间/金额/ID 和边界值。
- 契约未批准、实现与契约不一致或关键状态无证据时必须阻断。""",
}

def quote(value: str) -> str:
    return '"' + value.replace('\\', '\\\\').replace('"', '\\"') + '"'

for item in agents:
    agent_id = item.get("id")
    if not agent_id:
        continue
    title = item.get("name") or agent_id
    description = descriptions.get(agent_id) or f"AI-Teams {title}；MUST BE USED PROACTIVELY for matching AI-Teams work."
    color = item.get("color") or "cyan"
    style = item.get("style") or "ai-teams-agent"
    agent_focus, outputs = focus.get(agent_id, (f"执行 {title} 对应职责。", "任务产出、交接和风险说明。"))
    directives = runtime_directives.get(agent_id, "- 按 AI-Teams 组件文档、专属 playbook、项目事实和安全规则执行，不自行扩展范围。")
    tools = ""
    initial = ""
    if agent_id == "lead":
        tools = "\ntools: Agent(pd, plan-pm, dev-frontend-web, dev-frontend-miniapp, dev-backend-systems, dev-backend-service, qa, memory, doc, role, security-reviewer), Read, Grep, Glob, Bash, Write, Edit, MultiEdit"
        initial = "\ninitialPrompt: \"读取 AI 团队详情\""
    content = f'''---
name: {agent_id}
description: {quote(description)}
color: {color}
style: {quote(style)}{tools}{initial}
---
# {title}

## 入口定位

这是 Claude Code 官方扫描的 AI-Teams subagent 主定义文件：.claude/agents/{agent_id}.md。

本文件只负责让 Claude Code 识别这个 Agent、显示颜色、加载工具边界，并把 Agent 引导回 AI-Teams Harness 大脑。详细职责、组件说明、记忆、知识库、Skills、MCP、共享工作区、Hooks 和安全规则不在 .claude/agents/ 内维护。

## AI-Teams 根目录

本安装布局固定使用：

```text
AI_TEAMS_ROOT=.claude/ai-teams
```

目标项目路径是 Claude Code 当前打开的项目根目录。未完成初始化时，不允许自行猜项目路径，必须回到 Lead 询问并引导初始化。

## 必读入口

按顺序读取：

1. .claude/ai-teams/rule/index.md
2. .claude/ai-teams/rule/agents/{agent_id}.md
3. .claude/ai-teams/rule/tasks/index.md
4. .claude/ai-teams/index/ENTRY.md
5. .claude/ai-teams/agents/{agent_id}/{agent_id}.md
6. 当前任务单或执行方案：.claude/ai-teams/shared/tasks/
7. .claude/ai-teams/shared/index.md

只有规则索引缺失、过期或与代码冲突时，才扩大到 .claude/ai-teams/rule/project/files.md、.claude/ai-teams/rule/catalog/files.md、CodeGraph 或必要源码检索。

## 本 Agent 重点

{agent_focus}

## 运行时硬约束

{directives}

## 必须写入或检查的位置

- 项目认知：.claude/ai-teams/project/index.md、.claude/ai-teams/project/context.md、.claude/ai-teams/project/change-log.md、.claude/ai-teams/project/ui-style.md、.claude/ai-teams/project/api-contracts.md、.claude/ai-teams/project/graph.md
- 规则路由：.claude/ai-teams/rule/agents/{agent_id}.md、.claude/ai-teams/rule/tasks/index.md、.claude/ai-teams/rule/project/index.md
- 接口契约：.claude/ai-teams/shared/contracts/index.md、.claude/ai-teams/security/interface-contract-policy.md
- 任务与交接：.claude/ai-teams/shared/tasks/、.claude/ai-teams/shared/handoffs/
- 状态板：.claude/ai-teams/shared/task-plan.md、.claude/ai-teams/shared/pipeline-status.md
- 正式记忆：.claude/ai-teams/memory/agents/{agent_id}/MEMORY.md
- Agent 知识库：.claude/ai-teams/kb/agents/{agent_id}/index.md
- Agent Skills：.claude/ai-teams/skills/agents/{agent_id}/index.md
- Agent MCP：.claude/ai-teams/mcp/agents/{agent_id}/index.md
- 专属动作规则：.claude/ai-teams/security/agent-playbooks/{agent_id}.md
- 心跳与接管：.claude/ai-teams/shared/supervision/heartbeat-current.md、.claude/ai-teams/security/supervision-policy.md

## 输出

{outputs}

## 协作边界

- 非平凡任务默认走 AI-Teams 多 Agent 流程。
- 非 Lead Agent 只接受 Lead 或任务单分派，不自行扩展范围或私自派单。
- Lead 只能调度 AI-Teams 已定义 Agent，不把 AI-Teams 任务拆给默认 `general-purpose`。
- 所有协作必须落到 .claude/ai-teams/shared/、.claude/ai-teams/project/、.claude/ai-teams/memory/、.claude/ai-teams/kb/ 或 .claude/ai-teams/logs/ 的可追溯文件。
- 敏感文件默认不读取内容；删除、密钥、token、证书、MCP 凭据、Hooks 高风险动作先走 .claude/ai-teams/security/ 规则。
- .claude/agents/ 保持扁平，只放 12 个官方 Agent 主定义，不放组件文件，不创建索引文件。
- 首次失败即由 Lead 诊断；只允许一次有根因、有边界、有验证方式的定向重试，再次失败必须由 Lead 改派、拆分、等待用户或停止。

## 维护要求

修改以下内容后，Role 必须检查本文件是否需要同步更新：

- .claude/ai-teams/agents/{agent_id}/{agent_id}.md
- .claude/ai-teams/agents/{agent_id}/role.md
- .claude/ai-teams/agents/{agent_id}/workflow.md
- .claude/ai-teams/security/agent-playbooks/{agent_id}.md
- .claude/ai-teams/memory/agents/{agent_id}/MEMORY.md
- .claude/ai-teams/kb/agents/{agent_id}/index.md
- .claude/ai-teams/skills/agents/{agent_id}/index.md
- .claude/ai-teams/mcp/agents/{agent_id}/index.md
- .claude/ai-teams/hooks/

Doc 必须同步检查 .claude/ai-teams/index/AGENTS.md、.claude/ai-teams/index/FILES.md、.claude/ai-teams/kb/graph.md 和 标准 Markdown 链接。
'''
    (target_dir / f"{agent_id}.md").write_text(content, encoding="utf-8")
PY
  node "$output/tools/bin/ai-teams-prompt-compile.mjs" \
    --root "$output" \
    --all \
    --target-dir "$artifact_root/.claude/agents" \
    --write
}

write_formal_rule_adapters() {
  local rules_dir="$artifact_root/.claude/rules"
  mkdir -p "$rules_dir"
  cat > "$rules_dir/ai-teams-router.md" <<'EOF'
---
description: AI-Teams 全局规则路由入口
---
# AI-Teams 全局规则路由

每次请求先定位 .claude/ai-teams 为 `AI_TEAMS_ROOT`，读取 .claude/ai-teams/index/ENTRY.md 的必要段落，再进入 .claude/ai-teams/rule/index.md。非平凡任务必须由 Lead 调度 AI-Teams 12 个具名 Agent，不把任务拆给默认 `general-purpose`。

最小读取链：

1. .claude/ai-teams/rule/index.md
2. .claude/ai-teams/rule/agents/<agent>.md
3. .claude/ai-teams/rule/tasks/index.md
4. .claude/ai-teams/rule/custom/index.md 中命中的自建规则
5. 当前任务需要的 rule/project/、rule/security/、rule/shared/、rule/memory/、rule/tools/ 或 rule/catalog/ 路由

只有规则索引缺失、过期或与代码冲突时，才扩大到项目正文、CodeGraph 或源码检索。
EOF
  cat > "$rules_dir/ai-teams-custom.md" <<'EOF'
---
description: AI-Teams 自建规则路由入口
paths:
  - ".claude/ai-teams/rule/custom/**"
  - ".claude/ai-teams/project/rules/**"
  - ".claude/ai-teams/security/**"
---
# AI-Teams 自建规则路由

需要新增、审查或使用自建规则时，先读 .claude/ai-teams/rule/custom/index.md 和 .claude/ai-teams/security/rule-policy.md。

- rule/custom/ 只保存规则路由、触发条件和读取入口。
- `security/` 保存动作规则、安全边界、禁区和命令要求。
- project/rules/ 保存目标项目规则正文或导入索引。
- `kb/` 只保存知识，不保存动作规则。

不得为每条自建规则在 .claude/rules/ 下创建散乱适配文件；Claude Code 官方入口统一从本文件回到 AI-Teams 工程规则层。
EOF
  cat > "$rules_dir/ai-teams-frontend.md" <<'EOF'
---
description: AI-Teams 前端任务规则路由
paths:
  - "**/*.{vue,jsx,tsx,ts,js,css,scss,less}"
---
# AI-Teams 前端任务规则路由

前端任务先读：

1. .claude/ai-teams/rule/agents/dev-frontend-web.md 或 .claude/ai-teams/rule/agents/dev-frontend-miniapp.md
2. .claude/ai-teams/rule/project/frontend/index.md
3. .claude/ai-teams/rule/project/frontend/ui.md
4. .claude/ai-teams/rule/project/frontend/syntax.md
5. .claude/ai-teams/rule/project/backend/api.md（涉及接口时）

页面和联调不得猜字段；缺字段、字段类型不一致、UI 状态缺失时回到 Lead/PD/Plan-PM 处理契约。
EOF
  cat > "$rules_dir/ai-teams-backend-service.md" <<'EOF'
---
description: AI-Teams 服务端任务规则路由
paths:
  - "**/*.{py,go,js,ts,mjs,cjs}"
---
# AI-Teams 服务端任务规则路由

服务端任务先读：

1. .claude/ai-teams/rule/agents/dev-backend-service.md
2. .claude/ai-teams/rule/project/backend/index.md
3. .claude/ai-teams/rule/project/backend/api.md
4. .claude/ai-teams/rule/project/backend/syntax.md
5. .claude/ai-teams/security/interface-contract-policy.md

API、DTO、Schema、枚举和错误结构变更必须登记契约，不得擅自删除、改名、改类型或遗漏前端已确认字段。
EOF
  cat > "$rules_dir/ai-teams-backend-systems.md" <<'EOF'
---
description: AI-Teams 系统后端任务规则路由
paths:
  - "**/*.{c,cc,cpp,cxx,h,hpp,hxx,java,kt,gradle,xml,cmake}"
---
# AI-Teams 系统后端任务规则路由

系统后端任务先读：

1. .claude/ai-teams/rule/agents/dev-backend-systems.md
2. .claude/ai-teams/rule/project/backend/index.md
3. .claude/ai-teams/rule/project/backend/api.md
4. .claude/ai-teams/rule/project/backend/syntax.md
5. .claude/ai-teams/security/development-backend-systems-policy.md

涉及资源释放、并发、构建产物、ABI/API 兼容和稳定性时必须走 QA 与 Security-Reviewer。
EOF
  cat > "$rules_dir/ai-teams-governance.md" <<'EOF'
---
description: AI-Teams 协作、安全、记忆、工作区规则路由
paths:
  - ".claude/ai-teams/**"
  - "**/*.md"
---
# AI-Teams 协作与治理规则路由

治理类任务先读：

1. .claude/ai-teams/rule/security/index.md
2. .claude/ai-teams/rule/shared/index.md
3. .claude/ai-teams/rule/memory/index.md
4. .claude/ai-teams/rule/tools/index.md
5. .claude/ai-teams/security/index.md

动作规则放 `security/`，实时协作放 `shared/`，长期知识放 `kb/`，规则路由放 `rule/`。不得把动作规则写进知识库。
EOF
}

clean_formal_runtime_artifacts() {
  [[ "$edition" == "formal" ]] || return 0

  mkdir -p \
    "$output/shared/events" \
    "$output/shared/escalations/pending" \
    "$output/shared/escalations/resolved" \
    "$output/shared/locks/.locks" \
    "$output/shared/transactions" \
    "$output/project/requirements" \
    "$output/project/plans" \
    "$output/logs/agent" \
    "$output/logs/task" \
    "$output/logs/command" \
    "$output/logs/hook" \
    "$output/logs/package" \
    "$output/logs/upgrade" \
    "$output/logs/audit" \
    "$output/logs/security"

  find "$output/shared/events" -maxdepth 1 -type f \
    ! -name ".gitkeep" ! -name "index.md" ! -name "EVENT_TEMPLATE.md" -delete
  find "$output/shared/escalations/pending" -maxdepth 1 -type f ! -name "index.md" -delete
  find "$output/shared/escalations/resolved" -maxdepth 1 -type f ! -name "index.md" -delete
  find "$output/shared/locks/.locks" -maxdepth 1 -type f -delete
  find "$output/shared/transactions" -maxdepth 1 -type f \
    ! -name "index.md" ! -name "TRANSACTION_TEMPLATE.md" -delete
  find "$output/project/requirements" -maxdepth 1 -type f ! -name "index.md" -delete
  find "$output/project/plans" -maxdepth 1 -type f ! -name "index.md" -delete

  for log_dir in agent task command hook package upgrade audit security; do
    find "$output/logs/$log_dir" -maxdepth 1 -type f ! -name "index.md" -delete
  done
}

reset_formal_runtime_state() {
  clean_formal_runtime_artifacts
  rm -rf "$output/project/adr/accepted" "$output/project/adr/rejected" "$output/shared/contracts"
  mkdir -p "$output/project/adr/accepted" "$output/project/adr/rejected" "$output/project/requirements" "$output/project/plans" "$output/project/rules" "$output/shared/contracts"
  rm -f "$output/shared/prompt-evolution/history.json"
  if [[ -d "$output/shared/prompt-evolution/events" ]]; then
    find "$output/shared/prompt-evolution/events" -maxdepth 1 -type f \
      ! -name "index.md" ! -name "PROMPT_EVENT_TEMPLATE.md" -delete
  fi
  if [[ -d "$output/shared/prompt-evolution/candidates" ]]; then
    find "$output/shared/prompt-evolution/candidates" -maxdepth 1 -type f \
      ! -name "index.md" ! -name "PROMPT_CANDIDATE_TEMPLATE.md" -delete
  fi
  if [[ -d "$output/shared/prompt-evolution/reviews" ]]; then
    find "$output/shared/prompt-evolution/reviews" -maxdepth 1 -type f \
      ! -name "index.md" ! -name "PROMPT_REVIEW_TEMPLATE.md" -delete
  fi
  reset_formal_memory_audit_artifacts
  cat > "$output/index/PROJECT.md" <<'EOF'
---
id: "index-project"
title: "项目索引"
type: "index"
scope: "project"
owner: "doc"
status: active
---
# 项目索引

本索引用于目标项目接入后的项目管理入口。安装后尚未初始化目标项目，不携带 AI-Teams 源工程扫描结果。

## 项目知识图谱

- 项目图谱：project/graph
- 项目管理索引：project/index
- 项目运行期上下文：project/context
- 项目规则索引：project/rules/index
- 初始化脚本：tools/bin/ai-teams-init-project.sh

## 初始化状态

- 目标项目：尚未初始化。
- 项目画像：尚未生成。
- 项目规则：尚未吸收。
- 项目图谱：等待初始化脚本和 Doc 处理。

## 运行期规则

1. 项目初始化只写第一轮画像；后续任务执行必须继续维护 `project/`。
2. Doc 是 `project/` 的维护者，负责项目上下文、规则、状态、风险、验证和项目图谱。
3. 所有 Agent 在项目类任务前和关键阶段切换前必须频繁读取 project/index.md、project/context.md、project/change-log.md、project/project-profile.md、project/ui-style.md、project/api-contracts.md 和 project/graph.md。
4. Lead 关闭非平凡任务前按 security/project-policy 检查 Doc 是否已处理或明确跳过项目更新。
EOF
  cat > "$output/project/index.md" <<'EOF'
---
id: "project-index"
title: "目标项目管理索引"
type: "project-index"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目管理索引

安装后初始为空。初始化后，本目录会记录目标项目画像、运行期上下文、需求、计划、命令、架构、验证、风险、项目规则和项目图谱。

Doc 是 `project/` 的正式维护者。PD、Plan-PM、Dev、QA、Memory、Security-Reviewer 提供来源材料和校验结论；Lead 负责调度与关闭检查。

所有 Agent 执行项目类任务前和关键阶段切换前，都必须频繁读取本索引、project/PROJECT.md、project/context.md、project/change-log.md、project/project-profile.md、project/ui-style.md、project/api-contracts.md、project/rules/index.md、project/imported-rules.md、project/commands.md、project/verification.md、project/risks.md 和 project/graph.md。

运行期维护按 security/runtime-maintenance-policy.md 执行：Doc 维护 project/索引/图谱，Memory 维护记忆/恢复/压缩，Role 按触发条件维护 Agent 指引，Security-Reviewer 维护风险边界。
EOF
  cat > "$output/project/change-log.md" <<'EOF'
---
id: "project-change-log"
title: "目标项目代码提交变化"
type: "project-state"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目代码提交变化

每次需求进入时由 `UserPromptSubmit` 阶段的 `git-activity-watch` 增量刷新。只记录提交元数据、变更文件名、影响分类和远端待同步状态，不读取 diff、提交正文、历史代码或敏感文件内容。

远端待同步提交尚未进入当前工作树，只能作为提醒；合入后才可作为当前项目事实。

<!-- AI-TEAMS:git-project-sync:BEGIN -->
## 最近一次需求前 Git 同步

- 状态：尚未执行目标项目 Git 同步。
<!-- AI-TEAMS:git-project-sync:END -->
EOF
  cat > "$output/project/PROJECT.md" <<'EOF'
---
id: "project-project"
title: "目标项目管理入口"
type: "project-doc"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目管理入口

本文件是安装后的目标项目管理入口。初始化前保持空白，不携带 AI-Teams 主工程的项目画像、任务状态或记忆内容。

## 使用方式

在目标项目根目录执行：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

Windows PowerShell：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write
```

初始化会写入自动扫描区块，并吸收目标项目已有的 `CLAUDE.md`、`.qcoder`、`.qwen`、`.cursorrules`、Copilot/Gemini/Windsurf 等非敏感规则入口。

后续业务执行中，Doc 并行维护 `project/`；Lead 关闭非平凡任务前必须检查 Doc 是否已处理或明确跳过 project/context.md、需求、计划、命令、架构、验证、风险、项目规则和项目图谱更新。
EOF
  cat > "$output/project/context.md" <<'EOF'
---
id: "project-context"
title: "目标项目运行期上下文"
type: "project-doc"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目运行期上下文

尚未初始化目标项目。

## 下一步

在目标项目根目录执行：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

Windows PowerShell：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write
```
EOF
  cat > "$output/project/project-profile.md" <<'EOF'
---
id: "project-profile"
title: "目标项目画像"
type: "project-doc"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目画像

尚未初始化目标项目。
EOF
  cat > "$output/project/ui-style.md" <<'EOF'
---
id: "project-ui-style"
title: "目标项目前端 UI 画像"
type: "project-doc"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目前端 UI 画像

尚未初始化目标项目。初始化后由前端 Agent 复核 UI 依赖、设计令牌、布局、组件和页面状态，Doc 合并已验证事实。
EOF
  cat > "$output/project/api-contracts.md" <<'EOF'
---
id: "project-api-contracts"
title: "目标项目接口契约索引"
type: "project-doc"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目接口契约索引

尚未初始化目标项目。初始化后记录已确认的契约来源、前后端调用入口、字段模型和待确认缺口，不推断或虚构字段。
EOF
  cat > "$output/shared/contracts/index.md" <<'EOF'
---
id: "shared-contracts-index"
title: "接口契约索引"
type: "shared-doc"
scope: "target-project"
owner: "doc"
status: active
---
# 接口契约索引

正式版初始为空。目标项目初始化和前后端对接任务开始后，由 PD、Plan-PM、Dev、QA 提供来源材料，Doc 合并登记。

| 契约 | 接口 Owner | 消费方 | 版本 | 状态 | 最后更新 | 替代/迁移 |
|---|---|---|---|---|---|---|
| 暂无 | 待指定 | 待登记 | - | - | - | - |
EOF
  cat > "$output/shared/contracts/API_CONTRACT_TEMPLATE.md" <<'EOF'
---
id: "api-contract-template"
title: "接口契约模板"
type: "shared-template"
scope: "target-project"
owner: "doc"
status: template
---
# 接口契约模板

## 基本信息

- 契约名称：
- 版本：
- Owner：
- 消费方：
- 状态：draft / review / approved / deprecated / archived

## 请求

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|

## 响应

| 字段 | 类型 | 必填 | 可空 | 说明 |
|---|---|---|---|---|

## 错误与边界

| 场景 | 错误结构 | 前端展示 | QA 证据 |
|---|---|---|---|

## 兼容与迁移

- 是否破坏兼容：
- 替代契约：
- 迁移窗口：

## 验证证据

- 后端验证：
- 前端验证：
- QA 验收：
EOF
  # 运行包使用主工程中已通过自检的规范本体，避免打包内置简版模板与主规则漂移。
  cp "project/ui-style.md" "$output/project/ui-style.md"
  cp "project/api-contracts.md" "$output/project/api-contracts.md"
  cp "shared/contracts/index.md" "$output/shared/contracts/index.md"
  cp "shared/contracts/API_CONTRACT_TEMPLATE.md" "$output/shared/contracts/API_CONTRACT_TEMPLATE.md"
  cat > "$output/project/requirements/index.md" <<'EOF'
---
id: "project-requirements-index"
title: "目标项目需求索引"
type: "project-index"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目需求索引

正式版初始为空。目标项目需求分析完成后，PD 提供需求材料，Doc 维护本项目索引和项目图谱关系。
EOF
  cat > "$output/project/plans/index.md" <<'EOF'
---
id: "project-plans-index"
title: "目标项目计划索引"
type: "project-index"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目计划索引

正式版初始为空。目标项目计划和多 Agent 分工完成后，Plan-PM 提供计划材料，Doc 维护本项目索引和项目图谱关系。
EOF
  cat > "$output/project/imported-rules.md" <<'EOF'
---
id: "project-imported-rules"
title: "项目既有规则吸收区"
type: "project-doc"
scope: "target-project"
owner: "doc"
status: active
---
# 项目既有规则吸收区

初始化前为空。执行项目初始化后，本文件会吸收目标项目已有的非敏感 AI/编码规则入口，例如 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md`、`.qcoder`、`.qwen`、`.cursorrules`、.cursor/rules/、.github/copilot-instructions.md 等。

本文件属于目标项目画像，不属于知识库，不写入长期记忆。
EOF
  cat > "$output/project/rules/index.md" <<'EOF'
---
id: "project-rules-index"
title: "目标项目规则索引"
type: "project-rule-index"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目规则索引

初始为空。初始化后由 Doc 吸收目标项目已有 AI/编码规则入口，并登记目标项目当前必须遵守的规则、验证口径和升级状态。

本文件不是 `security/` 动作规则本体，也不是知识库。

## 当前规则

| 文件 | 类型 | 状态 |
|---|---|---|
| project/imported-rules.md | 目标项目已有规则吸收区 | 待初始化 |
| project/verification.md | 目标项目验证与验收规则 | 待初始化 |
| project/upgrade-state.md | 目标项目升级状态 | 待初始化 |
| index/NAVIGATION.md | 标准 Markdown 导航规范 | 待初始化 |
EOF
  cat > "$output/project/graph.md" <<'EOF'
---
id: "project-graph"
title: "目标项目知识图谱"
type: "knowledge-graph"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目知识图谱

尚未初始化目标项目。初始化后由 tools/bin/ai-teams-init-project.sh 写入目标项目入口、命令、文档和既有规则关系。

## 关联图谱

- 全局知识图谱：kb/graph.md
- 提示词图谱：prompts/graph.md
- 提示词进化工作区：shared/prompt-evolution/index.md
- 标准 Markdown 使用指引：index/NAVIGATION.md
- 运行期上下文：project/context.md
- 需求前提交同步：project/change-log.md
- 项目规则索引：project/rules/index.md
- 项目规则路由：rule/project/index.md
- 项目自建规则路由：rule/custom/project/index.md
- 工作流选择器：`playbook.md`
- 前后端联调流：`WF-07`
- 工作流长期设计由源工程 ADR 维护；运行包只保留可执行规则和目标项目 ADR 空目录。
- 项目初始化后，本文件会写入目标项目专属 Mermaid 图谱。
- 运行期项目更新规则见 security/project-policy.md。

## 运行期工作流占位

正式版初始不写入目标项目业务图谱，但必须保留工作流节点，确保初始化后 Doc 可以把项目画像接入 AI-Teams 全局工作流。

```mermaid
graph TD
  WorkflowSelector["playbook.md 工作流选择器"] --> ProjectGraph["project/graph.md"]
  WorkflowSelector --> WF07["WF-07 前后端联调流"]
  WF07 --> APIContracts["project/api-contracts.md"]
  WF07 --> SharedContracts["shared/contracts/index.md"]
  ProjectGraph --> KBGraph["kb/graph.md"]
  ProjectGraph --> PromptGraph["prompts/graph.md"]
  PromptGraph --> PromptEvolution["shared/prompt-evolution/index.md"]
```
EOF
  mkdir -p "$output/rule/project/frontend" "$output/rule/project/backend"
  cat > "$output/rule/project/index.md" <<'EOF'
---
id: rule-project-index
title: 目标项目规则路由
type: rule-index
scope: target-project
owner: doc
status: active
---
# 目标项目规则路由

安装后尚未初始化目标项目。本目录只保存目标项目的轻量路由和索引，不携带源工程扫描结果。

## 初始化后写入

- 项目结构：rule/project/structure
- 项目文件索引：rule/project/files
- 前端与 UI：rule/project/frontend/index
- 后端与接口：rule/project/backend/index
- 项目自建规则：rule/custom/project/index
- 决策定位：rule/project/decisions
- 方案定位：rule/project/plans

## 使用规则

Agent 先读本文件，再按任务类型进入对应路由；只有路由缺失、过期或与源码冲突时才扩大检索。
EOF
  cat > "$output/rule/project/structure.md" <<'EOF'
---
id: rule-project-structure
title: 目标项目结构索引
type: rule
scope: target-project
owner: doc
status: active
---
# 目标项目结构索引

<!-- AI-TEAMS:project-rule-structure:BEGIN -->
## 目标项目目录

尚未初始化目标项目。初始化后写入目录树摘要、职责判断、前端/后端/配置/测试/文档入口。
<!-- AI-TEAMS:project-rule-structure:END -->
EOF
  cat > "$output/rule/project/files.md" <<'EOF'
---
id: rule-project-files
title: 目标项目文件索引
type: rule
scope: target-project
owner: doc
status: active
---
# 目标项目文件索引

<!-- AI-TEAMS:project-rule-files:BEGIN -->
## 目标项目文件

尚未初始化目标项目。初始化后写入可定位的项目文件清单、分类和修改前读取建议；敏感文件只记录路径存在与否，不读取内容。
<!-- AI-TEAMS:project-rule-files:END -->
EOF
  cat > "$output/rule/project/frontend/index.md" <<'EOF'
---
id: rule-project-frontend
title: 目标项目前端规则路由
type: rule-index
scope: target-project
owner: doc
status: active
---
# 目标项目前端规则路由

<!-- AI-TEAMS:project-rule-frontend:BEGIN -->
## 前端与 UI 文件入口

尚未初始化目标项目。初始化后写入前端框架、入口、页面、组件、状态管理、路由、样式系统和验证入口。
<!-- AI-TEAMS:project-rule-frontend:END -->
EOF
  cat > "$output/rule/project/frontend/ui.md" <<'EOF'
---
id: rule-project-frontend-ui
title: 目标项目 UI 规则路由
type: rule
scope: target-project
owner: doc
status: active
---
# 目标项目 UI 规则路由

尚未初始化目标项目。初始化后写入色彩、排版、间距、组件形态、页面状态、响应式规则和可复用 UI 入口。
EOF
  cat > "$output/rule/project/frontend/syntax.md" <<'EOF'
---
id: rule-project-frontend-syntax
title: 目标项目前端语法规则路由
type: rule
scope: target-project
owner: doc
status: active
---
# 目标项目前端语法规则路由

<!-- AI-TEAMS:project-rule-frontend-syntax:BEGIN -->
## 自动识别语法线索

尚未初始化目标项目。初始化后写入 TypeScript/JavaScript、组件、状态、路由、样式和测试相关约束。
<!-- AI-TEAMS:project-rule-frontend-syntax:END -->
EOF
  cat > "$output/rule/project/backend/index.md" <<'EOF'
---
id: rule-project-backend
title: 目标项目后端规则路由
type: rule-index
scope: target-project
owner: doc
status: active
---
# 目标项目后端规则路由

<!-- AI-TEAMS:project-rule-backend:BEGIN -->
## 后端与数据库文件入口

尚未初始化目标项目。初始化后写入后端语言、框架、入口、模块、服务、数据库、配置、测试和接口契约入口。
<!-- AI-TEAMS:project-rule-backend:END -->
EOF
  cat > "$output/rule/project/backend/api.md" <<'EOF'
---
id: rule-project-backend-api
title: 目标项目接口规则路由
type: rule
scope: target-project
owner: doc
status: active
---
# 目标项目接口规则路由

<!-- AI-TEAMS:project-rule-api:BEGIN -->
## 接口契约与路由入口

尚未初始化目标项目。初始化后写入接口来源、路由、控制器、客户端调用、DTO/Schema、字段模型和待确认契约缺口。
<!-- AI-TEAMS:project-rule-api:END -->
EOF
  cat > "$output/rule/project/backend/syntax.md" <<'EOF'
---
id: rule-project-backend-syntax
title: 目标项目后端语法规则路由
type: rule
scope: target-project
owner: doc
status: active
---
# 目标项目后端语法规则路由

<!-- AI-TEAMS:project-rule-backend-syntax:BEGIN -->
## 自动识别语法线索

尚未初始化目标项目。初始化后写入后端语言、错误处理、日志、配置、迁移、测试和构建约束。
<!-- AI-TEAMS:project-rule-backend-syntax:END -->
EOF
  cat > "$output/rule/project/decisions.md" <<'EOF'
---
id: rule-project-decisions
title: 目标项目决策规则路由
type: rule
scope: target-project
owner: doc
status: active
---
# 目标项目决策规则路由

尚未初始化目标项目。初始化后指向项目 ADR、需求决策、技术选择和长期结构性约束。
EOF
  cat > "$output/rule/project/plans.md" <<'EOF'
---
id: rule-project-plans
title: 目标项目方案规则路由
type: rule
scope: target-project
owner: doc
status: active
---
# 目标项目方案规则路由

尚未初始化目标项目。初始化后指向项目计划、任务单、执行方案、锁范围、验证入口和交接材料。
EOF
  cat > "$output/project/commands.md" <<'EOF'
---
id: "project-commands"
title: "目标项目命令"
type: "project-doc"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目命令

尚未初始化目标项目。
EOF
  for file in architecture stack verification dependencies risks upgrade-state; do
    cat > "$output/project/${file}.md" <<EOF
---
id: "project-${file}"
title: "目标项目 ${file}"
type: "project-doc"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目 ${file}

尚未初始化目标项目。
EOF
  done
  cat > "$output/project/adr/index.md" <<'EOF'
---
id: "adr-index"
title: "目标项目 ADR Index"
type: "adr-index"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目 ADR Index

安装包初始不携带 AI-Teams 源工程 ADR 正文。目标项目发生长期结构性决策后，由 Doc 按 security/adr.md 创建目标项目 ADR。

## Accepted

| ADR | 标题 | 日期 | 影响范围 |
|---|---|---|---|

## Rejected

| ADR | 标题 | 日期 | 拒绝原因 |
|---|---|---|---|
EOF
  cat > "$output/memory/MEMORY.md" <<'EOF'
---
id: "memory-memory"
title: "共享记忆"
type: "memory"
scope: "target-project"
owner: "memory"
status: active
---
# 共享记忆

正式版初始为空。只保存目标项目长期有用、可恢复、非敏感的稳定事实。
EOF
  find "$output/memory/agents" -type f -name "MEMORY.md" | while read -r memory_file; do
    agent_name="$(basename "$(dirname "$memory_file")")"
    cat > "$memory_file" <<EOF
---
id: "memory-agent-${agent_name}"
title: "${agent_name} Agent 记忆"
type: "memory"
scope: "target-project"
owner: "memory"
status: active
---
# ${agent_name} Agent 记忆

正式版初始为空。只保存该 Agent 对目标项目长期有用、可恢复、非敏感的稳定事实。
EOF
  done
  rm -rf "$output/memory/candidates" "$output/memory/conversations/sessions" "$output/memory/conversations/compact" "$output/memory/conversations/restore-points"
  mkdir -p "$output/memory/candidates" "$output/memory/conversations/sessions" "$output/memory/conversations/compact" "$output/memory/conversations/restore-points"
  cat > "$output/memory/conversations/sessions/index.md" <<'EOF'
# 会话记录索引

正式版初始为空。
EOF
  cat > "$output/memory/conversations/compact/index.md" <<'EOF'
# 上下文压缩索引

正式版初始为空。
EOF
  cat > "$output/memory/conversations/restore-points/index.md" <<'EOF'
# 恢复点索引

正式版初始为空。
EOF
  cat > "$output/shared/locks/LOCKS.md" <<'EOF'
---
id: "shared-locks"
title: "锁状态"
type: "shared-doc"
scope: "target-project"
owner: "lead"
status: active
---
# 锁状态

| 文件 | Owner | 任务 | 状态 | 获取时间 | 过期时间 | 说明 |
|---|---|---|---|---|---|---|
| 当前无锁 | - | - | IDLE | - | - | - |
EOF
  cat > "$output/shared/task-plan.md" <<'EOF'
---
id: "shared-task-plan"
title: "任务计划状态"
type: "shared-doc"
scope: "target-project"
owner: "plan-pm"
status: active
---
# 任务计划状态

本文件是任务计划状态汇总视图。普通 Agent 优先写 shared/events/，跨状态板变更写 shared/transactions/，Lead / Plan-PM 再按 security/state-transaction-policy.md 汇总。

## 状态字段

| 字段 | 含义 |
|---|---|
| 工作流编号 | `WF-01` 到 `WF-12`，记录实际采用的工作流 |
| Owner | 当前负责 Agent |
| 状态 | `TODO` / `DOING` / `RETRYING` / `FLOWBACK` / `REVIEW` / `DONE` / `CANCELLED` |
| attempt | `0` 到 `3` 为可重试范围；`4+` 进入回流 |
| 下一步 | 下一次动作或回流复核动作 |

## 活动任务

| 任务 ID | 工作流编号 | Owner | 状态 | attempt | 尝试计数 | 上游 | 最近失败 | 下一步 |
|---|---|---|---|---:|---|---|---|---|
| 当前无活动任务 | - | Lead | TODO | 0 | 1/4 | - | - | 等待任务单 |
EOF
  cat > "$output/shared/pipeline-status.md" <<'EOF'
---
id: "shared-pipeline-status"
title: "流水线状态"
type: "shared-doc"
scope: "target-project"
owner: "lead"
status: active
---
# 流水线状态

本文件是 Agent 流水线状态汇总视图。普通 Agent 优先写 shared/events/，跨状态板变更写 shared/transactions/，Lead / Plan-PM 再按 security/state-transaction-policy.md 汇总。

| Agent | 状态 | 当前任务 | attempt | 尝试计数 | 备注 |
|---|---|---|---:|---|---|
| Lead | IDLE | - | 0 | 1/4 | - |
| PD | IDLE | - | 0 | 1/4 | - |
| Plan-PM | IDLE | - | 0 | 1/4 | - |
| Dev-Frontend-Web | IDLE | - | 0 | 1/4 | - |
| Dev-Frontend-Miniapp | IDLE | - | 0 | 1/4 | - |
| Dev-Backend-Systems | IDLE | - | 0 | 1/4 | - |
| Dev-Backend-Service | IDLE | - | 0 | 1/4 | - |
| QA | IDLE | - | 0 | 1/4 | - |
| Memory | IDLE | - | 0 | 1/4 | - |
| Doc | IDLE | - | 0 | 1/4 | - |
| Role | IDLE | - | 0 | 1/4 | - |
| Security-Reviewer | IDLE | - | 0 | 1/4 | - |
EOF
  cat > "$output/index/STATUS.md" <<'EOF'
---
id: "index-status"
title: "AI-Teams 状态"
type: "index"
scope: "target-project"
owner: "doc"
status: active
---
# AI-Teams 状态

## 当前状态

- 阶段：AI-Teams 已安装，等待目标项目初始化
- 活动任务：无
- 目标项目画像：未初始化

## 下一步

在目标项目根目录执行：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

Windows PowerShell：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write
```
EOF
  cat > "$output/index/REQUIREMENTS.md" <<'EOF'
---
id: "index-requirements"
title: "目标项目需求索引"
type: "index"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目需求索引

正式版初始不携带 AI-Teams 主工程搭建需求。目标项目初始化和后续需求分析完成后，由 PD 提供需求材料，Doc 在本索引登记并维护项目图谱关系。

## 当前状态

- 尚未初始化目标项目。
- 尚未登记目标项目需求。
EOF
}

write_formal_runtime_docs() {
  cat > "$output/README.md" <<'EOF'
---
id: ai-teams-formal-readme
title: AI-Teams 正式版
type: entry
scope: project
owner: lead
status: active
---

# AI-Teams 正式版

AI-Teams 是面向软件研发项目的轻量 Harness 工程。它把多 Agent 团队、记忆、知识库、共享工作区、Hooks、Cron、MCP、Skills、索引和安全规则放在一个可追溯的工程大脑中，让 Claude Code 在项目里按团队流程工作。

正式版用于接入真实项目，不包含主工程发布维护能力，不包含打包正式版或精简版的指令。

## 推荐安装

低侵入安装形态：

```text
target-project/
└── .claude/
    ├── settings.json
    ├── settings.local.example.json
    ├── agents/
    ├── rules/
    └── ai-teams/
        ├── index/ENTRY.md
        ├── agents/
        ├── rule/
        ├── memory/
        ├── kb/
        ├── shared/
        ├── security/
        └── tools/
```

Claude Code 进入目标项目后，通过 .claude/settings.json 中的 `ai_teams.brain_root` 找到 .claude/ai-teams/，通过 .claude/agents/*.md 加载 12 个 AI-Teams Agent，通过 .claude/rules/*.md 加载官方规则适配层，并从 .claude/ai-teams/index/ENTRY.md 与 .claude/ai-teams/rule/index.md 按需读取。安装包不会创建或覆盖目标项目的根 `CLAUDE.md`。

AI-Teams 会在 .claude/settings.json 中使用 `ai_teams.brain_root` 指向 .claude/ai-teams/。这属于 Claude Code 的项目级引导配置，不会要求用户迁移业务代码。.claude/settings.local.example.json 仍然可用，用户自己的本地配置和私有 overrides 不应被覆盖。

.claude/settings.json 会强制记录默认多 Agent、AI-Teams harness 工程路径、目标项目路径、`rule/` 按需读取路由、`security/` 规则入口和敏感文件 `permissions.deny`。未初始化目标项目时，Claude Code 必须主动询问用户是否初始化；除非用户明确说不需要多 Agent，否则非平凡任务必须按 AI-Teams 多 Agent 流程执行。

## 快速开始

进入 AI-Teams 根目录：

```bash
cd .claude/ai-teams
```

运行自检：

```bash
bash tools/bin/ai-teams-check.sh
```

初始化目标项目：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

Windows PowerShell：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write
```

初始化会创建目标项目画像、运行期上下文、需求索引、计划索引、项目命令、验证方式、风险线索、既有规则吸收区、项目知识图谱，并刷新 rule/project/ 的目录、文件、前端 UI、前端语法、后端规范和后端接口入口。后续业务执行中，Lead 关闭非平凡任务前会按 security/project-policy.md 检查是否需要继续更新 `project/` 与 `rule/`。

## 工程与项目边界

- AI-Teams harness 工程：正式版位于目标项目 .claude/ai-teams/。
- 目标项目：Claude Code 当前打开的业务项目根目录，初始化时用 `--target "$PWD"` 明确指定。
- `project/`：记录目标项目画像和运行期项目事实，不记录任务过程流水，不替代 `memory/`、`kb/`、`logs/` 或 `shared/`。

## Agent 颜色与样式

12 个 Agent 在主文档 frontmatter 和 .claude/settings.json 注册中包含 `color` 与 `style`，颜色采用 Claude Code subagent 支持的 `red`、`blue`、`green`、`yellow`、`purple`、`orange`、`pink`、`cyan`。

Claude Code 只提供八种官方颜色，因此 12 个 Agent 会按职责有意复用颜色。Agent 的唯一身份是名称和职责，`style` 是 AI-Teams 内部描述字段，不作为 Claude Code 官方配置。

## 调用流程

AI-Teams 默认由 Lead 主 Agent 接收任务并调度其他 Agent。非平凡任务默认启用多 Agent，所有协作都必须落到文件中。

```mermaid
flowchart TD
  User["用户需求"] --> Lead["Lead 主 Agent"]
  Lead --> PD["PD 需求解析"]
  Lead --> PM["Plan-PM 计划拆解"]
  PM --> DevWeb["Dev-Frontend-Web"]
  PM --> DevMini["Dev-Frontend-Miniapp"]
  PM --> DevSys["Dev-Backend-Systems"]
  PM --> DevSvc["Dev-Backend-Service"]
  DevWeb --> QA["QA 测试与代码评审"]
  DevMini --> QA
  DevSys --> QA
  DevSvc --> QA
  QA --> Lead
  Lead --> Memory["Memory 记忆筛选"]
  Lead --> Doc["Doc 文档与知识库"]
  Lead --> Security["Security-Reviewer"]
  Lead --> User
```

## 执行流程

```mermaid
flowchart TD
  A["收到用户需求"] --> B["Lead 判断任务类型与风险"]
  B --> C{"是否非平凡任务"}
  C -->|否| D["Lead 直接回答或执行轻量任务"]
  C -->|是| E["PD 分析需求或确认验收口径"]
  E --> F["Plan-PM 创建任务单与执行方案"]
  F --> G["检查文件所有权与锁"]
  G --> H{"是否存在锁冲突"}
  H -->|是| I["按 lock-policy 等待、协调或改排期"]
  H -->|否| J["Lead 分派对应 Agent 执行"]
  I --> J
  J --> K["Dev / Doc / Memory / Security 等按职责产出"]
  K --> L["写入 shared/handoffs 交接"]
  L --> M["QA 或 Lead 验收"]
  M --> N{"是否通过"}
  N -->|否| O["进入重试或回流流程"]
  O --> F
  N -->|是| P["Memory / Doc 处理记忆与知识候选"]
  P --> Q["更新状态、日志、索引"]
  Q --> R["Lead 向用户汇报完成情况"]
```

## 决策流程

长期结构性决策必须写 ADR；普通任务过程写日志或 shared 状态，不写 ADR。

```mermaid
flowchart TD
  A["出现设计选择"] --> B{"是否影响长期工程结构"}
  B -->|否| C["写入 logs 或 shared 状态"]
  B -->|是| D["Doc 使用 project/adr/template.md 创建 ADR"]
  D --> E["Lead/Master 决策 accepted 或 rejected"]
  E --> F{"决策状态"}
  F -->|accepted| G["移动到 project/adr/accepted"]
  F -->|rejected| H["移动到 project/adr/rejected"]
  G --> I["更新 project/adr/index.md"]
  H --> I
  I --> J["如影响规则则更新 security/ 或 playbook"]
  J --> K["如影响 Agent 则更新 agents/ 和知识图谱"]
  K --> L["Doc 检查 标准 Markdown 链接和 kb/graph.md"]
```

## 文件锁流程

```mermaid
flowchart TD
  A["Agent 准备修改文件"] --> B["读取 security/file-ownership.md"]
  B --> C["读取 shared/locks/LOCKS.md"]
  C --> D{"目标文件是否已锁"}
  D -->|否| E["按 LOCK_TEMPLATE 记录锁"]
  D -->|是| F["检查锁 Owner、原因和过期时间"]
  F --> G{"是否可等待或协调"}
  G -->|可等待| H["更新任务状态为 BLOCKED 或 WAITING"]
  G -->|需仲裁| I["Lead 按 lock-policy 仲裁"]
  E --> J["执行修改"]
  H --> C
  I --> C
  J --> K["完成验证和交接"]
  K --> L["释放锁并更新流水线状态"]
```

## 重试与回流流程

```mermaid
flowchart TD
  A["Agent 失败、无权限、卡断或跑偏"] --> B["Lead 立即诊断根因并接管"]
  B --> C{"是否具备明确修复条件"}
  C -->|是| D["允许一次定向重试"]
  C -->|否| E["改派、拆分、降级或回流上游"]
  D --> F{"是否恢复"}
  F -->|是| G["继续执行并记录恢复证据"]
  F -->|否| E
  E --> H{"失败类型"}
  H -->|需求不清| I["PD 复核需求"]
  H -->|计划不可行| J["Plan-PM 重拆任务"]
  H -->|实现或模型不匹配| K["换 Agent、模型或实现路径"]
  H -->|安全/合规| L["Security-Reviewer 与 Lead 处理"]
  I --> M["更新任务单、状态与回流记录"]
  J --> M
  K --> M
  L --> M
```

## 提示词与自进化

每个 Agent 都有独立的 system、task/user、retry 提示词和评测基线。活动版本由 prompts/registry.json 管理，Claude Code 官方入口 .claude/agents/*.md 由活动 system prompt 编译生成。

```mermaid
flowchart LR
  Run["Agent 执行"] --> Signal["Hook 采集脱敏失败事实"]
  Signal --> Diagnose["Lead + QA 诊断根因"]
  Diagnose --> Route{"应修改哪个工程节点"}
  Route -->|提示词问题| Candidate["生成候选版本"]
  Route -->|项目、知识、工具、安全、记忆或工作流| Owner["回到对应 Owner"]
  Candidate --> Eval["QA 回归与安全评测"]
  Eval --> Approve["Role + QA + Security + Lead 门禁"]
  Approve --> Active["原子激活并保留上一版本"]
  Active --> Compile["编译 .claude/agents"]
  Compile --> Next["下一次调用或新会话生效"]
  Next --> Monitor["监控并可回滚"]
```

- Hook 只写 shared/prompt-evolution/events/ 的脱敏事实，不直接改提示词。
- Agent 可以提交失败事实和改进建议，但不得修改自己的活动 system prompt。
- 项目事实写回 `project/`，稳定知识写入 `kb/`，工具问题回到 Skills/MCP，安全问题回到 `security/`；不能把所有问题都堆进 Prompt。
- 低风险候选至少需要 Lead 与 QA；高风险候选需要 Lead、QA、Role、Security-Reviewer。
- 运行中的 Agent 不热替换提示词；新版本从下一次调用或新会话生效。

## Agent 团队

| Agent | 职责 | 入口 |
|---|---|---|
| Lead | 接收需求、任务调度、检查交接、最终验收 | agents/lead/lead.md |
| PD | 需求解析、PRD、用户价值和验收口径 | agents/pd/pd.md |
| Plan-PM | 计划拆解、任务单、执行方案和 Agent 分工 | agents/plan-pm/plan-pm.md |
| Dev-Frontend-Web | Vue、React、Angular Web 前端开发 | agents/dev-frontend-web/dev-frontend-web.md |
| Dev-Frontend-Miniapp | 微信小程序、支付宝小程序、uni-app 适配 | agents/dev-frontend-miniapp/dev-frontend-miniapp.md |
| Dev-Backend-Systems | C、C++、Java、系统级后端和强约束后端 | agents/dev-backend-systems/dev-backend-systems.md |
| Dev-Backend-Service | Python、Go、Node.js / TypeScript、API、服务端工程和云原生服务 | agents/dev-backend-service/dev-backend-service.md |
| QA | 测试、代码评审、回归和验收 | agents/qa/qa.md |
| Memory | 共享记忆、Agent 独立记忆和上下文压缩筛选 | agents/memory/memory.md |
| Doc | 知识库、文档关系图、项目文档和模板治理 | agents/doc/doc.md |
| Role | Agent 创建、职责边界和角色调整 | agents/role/role.md |
| Security-Reviewer | 敏感文件、删除、命令、Hooks、MCP、Skills 安全审查 | agents/security-reviewer/security-reviewer.md |

## 工程大脑

- `index/ENTRY.md`：AI-Teams 可移植项目地图。
- `agents/`：12 个 Agent 的角色、工作流、记忆、知识库、Skills、MCP 和 playbook 指针。
- prompts/registry.json：12 个 Agent 当前 system、task、retry 提示词的活动版本注册表。
- prompts/graph.md：Agent、提示词、评测、规则和进化工作区的 文档关系图。
- `rule/`：规则路由与索引层，Agent 执行前先查这里，按需定位工程、项目、Agent、任务、知识、安全、共享工作区和工具文件。
- `playbook.md`：Lead 全局调度和多 Agent 协作动作链。
- `shared/`：任务单、执行方案、状态、锁、交接、广播、回流和 文档关系维护。
- `memory/`：共享记忆、Agent 独立记忆、候选记忆和会话恢复材料。
- `kb/`：共享知识库、Agent 知识库和 标准 Markdown 知识图谱。
- `security/`：文件所有权、敏感文件、删除、任务、锁、状态、回流、开发规则和 Agent playbook。
- `hooks/`：Hook 说明、脚本、配置和模板。
- `cron/`：定时任务说明。
- `skills/`：工程内 Skills 副本和 Agent 绑定。
- `mcp/`：MCP registry、Agent MCP 和 CodeGraph 入口。
- `tools/`：运行指令和工具脚本。
- `logs/`：日志结构和索引。

## 工作区、记忆与知识库

- `shared/` 是实时协作工作区：任务单、执行方案、流水线状态、锁、交接、广播和回流都在这里。
- memory/MEMORY.md 是共享长期记忆；memory/agents/<agent>/MEMORY.md 是 Agent 独立记忆。
- memory/candidates/ 保存候选记忆；正式写入前必须由 Memory 筛选。
- `kb/` 是知识库，不放动作规则；开发 Agent 的工程知识位于 kb/agents/<dev-agent>/00-index.md 到 `05-do-not.md`。
- kb/graph.md 与 project/graph.md 是 标准 Markdown 知识图谱入口。
- rule/index.md、rule/agents/<agent>.md、rule/project/index.md 是低 token 读取入口；只有索引缺失、过期或与源码冲突时才扩大检索。

## 内置规则与治理

AI-Teams 内置轻量但严格的工程治理规则。它们让 Agent 在协作时知道“谁能改什么、什么时候要锁、什么时候要回流、什么时候要记录长期决策”。

| 治理能力 | 入口 | 说明 |
|---|---|---|
| 全局动作链 | `playbook.md` | Lead 如何收需求、分派、验收、回流和收尾 |
| Agent 专属动作规则 | security/agent-playbooks/ | 每个 Agent 的执行边界、动作步骤和禁止事项 |
| 文件所有权 | security/file-ownership.md | 规定各目录 Owner 和写入边界 |
| 文件锁 | security/lock-policy.md 与 shared/locks/LOCKS.md | 多 Agent 修改同一文件前必须检查锁 |
| 任务规则 | security/task-policy.md | 任务单、执行方案、状态更新和交接的创建与使用规则 |
| 状态规则 | security/state-policy.md | shared/task-plan.md 和 shared/pipeline-status.md 的实时更新规则 |
| 回流规则 | security/escalation-policy.md 与 shared/escalations/retry-flowback.md | 失败重试、升级、回流、复核三问和关闭规则 |
| 删除规则 | security/delete-policy.md | 删除分级、用户确认、备份、日志和回滚要求 |
| 敏感文件规则 | security/sensitive-files.md | `.env`、密钥、证书、token、credentials 等默认不读取内容 |
| 开发规则 | security/development-policy.md | 四个开发 Agent 的通用开发禁区和专属规则入口 |
| 上下文压缩规则 | security/context-compression-policy.md | Hook 自动检测和手动压缩的边界 |
| 文档导航规则 | index/NAVIGATION.md | 标准 Markdown 路径、链接和关系图维护规则 |

## ADR 决策

ADR 用来记录影响工程长期结构的关键设计原因，不记录普通任务过程。

- ADR 规范：security/adr.md
- ADR 索引：project/adr/index.md
- ADR 模板：project/adr/template.md
- 已采纳 ADR：project/adr/accepted/
- 已拒绝 ADR：project/adr/rejected/

安装包不携带 AI-Teams 研发过程中的 ADR 正文。目标项目的 `accepted/` 与 `rejected/` 初始为空；项目发生长期结构性决策后由 Doc 从模板创建并更新索引。

## 已安装 Skills

Skills 已复制到工程内 skills/agents/<agent>/<skill>/，发布时不依赖本机全局 Skills 目录。

| Agent | 已安装 Skills |
|---|---|
| Lead | triage、diagnose、zoom-out、handoff、claude-automation-recommender |
| PD | to-prd、grill-me、grill-with-docs、consulting-analysis、deep-research |
| Plan-PM | to-issues、triage、prototype、diagnose |
| Dev-Frontend-Web | frontend-design、vercel-react-best-practices、webapp-testing、tdd |
| Dev-Frontend-Miniapp | frontend-design、webapp-testing、code-documentation、tdd |
| Dev-Backend-Systems | diagnose、tdd、code-documentation、improve-codebase-architecture、karpathy-guidelines |
| Dev-Backend-Service | diagnose、tdd、code-documentation、improve-codebase-architecture、karpathy-guidelines、build-mcp-server |
| QA | webapp-testing、diagnose、tdd、triage |
| Memory | session-report、handoff、zoom-out |
| Doc | claude-md-improver、code-documentation、academic-paper-review |
| Role | agent-development、skill-creator、write-a-skill、automation-recommender、setup skills |
| Security-Reviewer | mcp-builder、mcp-integration、hook-development、writing-hookify-rules、diagnose |

第三方 Skills 的来源与许可证见 THIRD_PARTY_NOTICES.md。运行包不会包含未确认再分发授权的 Skills。

## 运行指令

| 指令 | 用法 |
|---|---|
| 项目初始化 | `bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write` |
| 项目初始化 Windows | `pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write` |
| 已安装项目升级 | `bash tools/bin/ai-teams-upgrade.sh --package <升级包路径> --dry-run` |
| 日志清理计划 | `bash tools/bin/ai-teams-logs-clean.sh --before YYYY-MM-DD --plan` |
| MCP 查询 | `bash tools/bin/ai-teams-mcp-list.sh` |
| MCP 受控安装 | `bash tools/bin/ai-teams-mcp-install.sh --name <名称> --agent <Agent> --source <来源> --command <命令> --plan` |
| Skills 查询 | `bash tools/bin/ai-teams-skills-list.sh` |
| Skills 安装 | `bash tools/bin/ai-teams-skills-install.sh --name <名称> --agent <Agent> --source <本地Skill目录> --plan` |
| Hooks 查询 | 查看 hooks/index.md |
| Cron 查询 | 查看 cron/schedules.md |
| Agent 状态 | 查看 shared/pipeline-status.md 和 agents/index.md |
| 回滚计划 | `bash tools/bin/ai-teams-rollback.sh --snapshot <快照路径> --plan` |
| 读取记忆 | 查看 memory/index.md 与 memory/MEMORY.md |
| 刷新记忆 | 按 tools/commands/ai/memory-refresh.md 执行 |
| 上下文压缩 | `bash tools/bin/ai-teams-context-compact.sh --dry-run` |
| 自建规则创建 | `node tools/bin/ai-teams-rule-create.mjs --id <规则id> --title <标题> --scope <agents|project|security> --owner <agent> --trigger <触发条件> --write` |
| 提示词状态 | `node tools/bin/ai-teams-prompt-status.mjs --json` |
| 提示词任务渲染 | `node tools/bin/ai-teams-prompt-render.mjs --agent <Agent> --kind task --vars <JSON文件>` |
| 提示词候选 | `node tools/bin/ai-teams-prompt-evolve.mjs --agent <Agent> --kind <system|task|retry> --version <版本> --from-active --write` |
| 提示词评测 | `node tools/bin/ai-teams-prompt-eval.mjs --candidate <候选ID> --write` |
| 提示词激活 | `node tools/bin/ai-teams-prompt-activate.mjs --candidate <候选ID> --approve <审批者> --write` |
| 提示词回滚 | `node tools/bin/ai-teams-prompt-rollback.mjs --agent <Agent> --approve lead --compile --write` |
| 提示词历史 | `node tools/bin/ai-teams-prompt-history.mjs --json` |
| CodeGraph 状态 | `bash .claude/ai-teams/tools/bin/ai-teams-codegraph-status.sh --target "$PWD" --write-index` |

## 安全边界

- 敏感文件默认不读取内容。
- 删除用户项目文件必须获得用户明确确认。
- 修改受保护范围前检查 shared/locks/LOCKS.md。
- 日志、记忆和知识库严格分离。
- Agent 协作必须落到可追溯文件。
- 正式版不包含打包正式版或精简版的发布维护指令。
EOF

  cat > "$output/tools/commands/index.md" <<'EOF'
---
id: tools-commands-index
title: 指令主索引
type: command-index
scope: project
owner: lead
status: active
---

# 指令主索引

正式版只包含项目运行与维护指令，不包含正式版/精简版打包指令。

| No. | 指令能力 | 指令说明 |
|---:|---|---|
| 1 | 项目初始化 | tools/commands/ai/init-project.md |
| 2 | 已在项目中运行升级指令 | tools/commands/ai/upgrade-existing.md |
| 3 | 多余日志清除指令 | tools/commands/ai/logs-clean.md |
| 4 | 自学习指令 | tools/commands/ai/self-learn.md |
| 5 | MCP 查询指令 | tools/commands/ai/mcp-list.md |
| 6 | Skills 查询指令 | tools/commands/ai/skills-list.md |
| 7 | 安装 Skills 指令 | tools/commands/ai/skills-install.md |
| 8 | 安装 MCP 指令 | tools/commands/ai/mcp-install.md |
| 9 | 查询 Hooks 指令 | tools/commands/ai/hooks-list.md |
| 10 | 查询定时任务指令 | tools/commands/ai/cron-list.md |
| 11 | 查询所有 Agent，Agent 状态指令 | tools/commands/ai/agents-status.md |
| 12 | 回滚指令 | tools/commands/ai/rollback.md |
| 13 | 读取记忆指令 | tools/commands/ai/memory-read.md |
| 14 | 刷新记忆指令 | tools/commands/ai/memory-refresh.md |
| 15 | 上下文压缩指令 | tools/commands/ai/context-compact.md |
| 16 | 自建规则创建指令 | tools/commands/ai/rule-create.md |
| 17 | 提示词状态 | tools/commands/ai/prompt-status.md |
| 18 | 提示词进化候选 | tools/commands/ai/prompt-evolve.md |
| 19 | 提示词差异 | tools/commands/ai/prompt-diff.md |
| 20 | 提示词评测 | tools/commands/ai/prompt-eval.md |
| 21 | 提示词激活 | tools/commands/ai/prompt-activate.md |
| 22 | 提示词回滚 | tools/commands/ai/prompt-rollback.md |
| 23 | 提示词历史 | tools/commands/ai/prompt-history.md |

## 边界

- tools/commands/ai/ 保存指令说明。
- tools/bin/ 保存可执行脚本。
- `.claude/` 不保存指令说明或脚本。
- 正式版不包含打包正式版和精简版的发布维护指令。
- 自建规则创建指令只写 rule/custom/ 路由和索引；动作规则仍写 `security/`。
EOF

  cat > "$output/index/COMMANDS.md" <<'EOF'
---
id: "index-commands"
title: "指令索引"
type: "index"
scope: "project"
owner: "doc"
status: active
---

# 指令索引

安装包包含 23 个运行与维护指令，不包含打包正式版或精简版的发布维护指令。

| No. | 指令能力 | 文件 |
|---:|---|---|
| 1 | 项目初始化 | tools/commands/ai/init-project.md |
| 2 | 已在项目中运行升级指令 | tools/commands/ai/upgrade-existing.md |
| 3 | 多余日志清除指令 | tools/commands/ai/logs-clean.md |
| 4 | 自学习指令 | tools/commands/ai/self-learn.md |
| 5 | MCP 查询指令 | tools/commands/ai/mcp-list.md |
| 6 | Skills 查询指令 | tools/commands/ai/skills-list.md |
| 7 | 安装 Skills 指令 | tools/commands/ai/skills-install.md |
| 8 | 安装 MCP 指令 | tools/commands/ai/mcp-install.md |
| 9 | 查询 Hooks 指令 | tools/commands/ai/hooks-list.md |
| 10 | 查询定时任务指令 | tools/commands/ai/cron-list.md |
| 11 | 查询所有 Agent，Agent 状态指令 | tools/commands/ai/agents-status.md |
| 12 | 回滚指令 | tools/commands/ai/rollback.md |
| 13 | 读取记忆指令 | tools/commands/ai/memory-read.md |
| 14 | 刷新记忆指令 | tools/commands/ai/memory-refresh.md |
| 15 | 上下文压缩指令 | tools/commands/ai/context-compact.md |
| 16 | 自建规则创建指令 | tools/commands/ai/rule-create.md |
| 17 | 提示词状态 | tools/commands/ai/prompt-status.md |
| 18 | 提示词进化候选 | tools/commands/ai/prompt-evolve.md |
| 19 | 提示词差异 | tools/commands/ai/prompt-diff.md |
| 20 | 提示词评测 | tools/commands/ai/prompt-eval.md |
| 21 | 提示词激活 | tools/commands/ai/prompt-activate.md |
| 22 | 提示词回滚 | tools/commands/ai/prompt-rollback.md |
| 23 | 提示词历史 | tools/commands/ai/prompt-history.md |

## 常用脚本

| 指令 | 可执行脚本 | 状态 |
|---|---|---|
| 项目初始化 | tools/bin/ai-teams-init-project.sh | 可生成扫描报告并合并更新项目文档、索引和记忆 |
| CodeGraph 状态检测 | tools/bin/ai-teams-codegraph-status.sh | 可检测 CLI、`.codegraph/` 和写入索引 |
| 已在项目中运行升级指令 | tools/bin/ai-teams-upgrade.sh | 支持 dry-run、快照、变更清单和受控 apply |
| 回滚指令 | tools/bin/ai-teams-rollback.sh | 支持快照列表、回滚计划和显式确认 apply |
| 多余日志清除指令 | tools/bin/ai-teams-logs-clean.sh | 支持计划、归档和普通日志清理 |
| MCP 查询指令 | tools/bin/ai-teams-mcp-list.sh | 可查询共享 MCP、Agent MCP 和 CodeGraph 状态 |
| 安装 MCP 指令 | tools/bin/ai-teams-mcp-install.sh | 可受控写入 MCP registry 和元数据 |
| Skills 查询指令 | tools/bin/ai-teams-skills-list.sh | 可查询共享 Skills 和 Agent Skills |
| 安装 Skills 指令 | tools/bin/ai-teams-skills-install.sh | 可从本地 Skill 目录复制到工程内并更新 registry |
| 上下文压缩指令 | tools/bin/ai-teams-context-compact.sh | 可生成会话恢复摘要，不直接写正式记忆 |
| 自建规则创建指令 | tools/bin/ai-teams-rule-create.mjs | 可创建 rule/custom/ 路由文档并刷新自建规则索引 |
| 提示词状态 / 差异 / 历史 | tools/bin/ai-teams-prompt-status.mjs 等 | 只读检查活动版本、候选、哈希、编译同步和历史 |
| 提示词渲染 / 编译 | tools/bin/ai-teams-prompt-render.mjs、tools/bin/ai-teams-prompt-compile.mjs | 生成结构化任务提示词，并同步活动系统提示词到 Agent 入口 |
| 提示词进化 / 评测 / 激活 / 回滚 | tools/bin/ai-teams-prompt-evolve.mjs 等 | 生成候选、运行回归评测、受控审批激活和回滚 |
EOF

  if command -v python3 >/dev/null 2>&1 && [[ -f "$output/MANIFEST.json" ]]; then
    python3 - "$output/MANIFEST.json" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
data = json.loads(path.read_text(encoding="utf-8"))
data["stage"] = "formal-runtime"
data["edition"] = "formal"
data["status"] = "runtime-remediation-ready"
data["release_planning_status"] = "runtime-package-no-packaging-commands"
summary = data.setdefault("file_summary", {})
summary["commands"] = 23
rule_indexes = summary.setdefault("rule_indexes", [])
if "rule/custom/index.md" not in rule_indexes:
    rule_indexes.append("rule/custom/index.md")
data["package_rules_summary"] = "正式版运行包不包含正式版/精简版打包指令或打包脚本；发布维护能力只保留在主工程。"
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY
  fi
}

copy_public_runtime_readmes() {
  cp "README.md" "$output/README.md"
  cp "README.en.md" "$output/README.en.md"
}

rewrite_formal_self_learn_command() {
  cat > "$output/tools/commands/ai/self-learn.md" <<'EOF'
---
id: "tools-commands-ai-self-learn"
title: "自学习指令"
type: "command"
scope: "project"
owner: "lead"
status: planned
---
# 自学习指令

## 用途

自学习体系属于 v2 能力。formal v1.0 运行包不包含工程实验室，也不自动修改 Agent、Security、Skills、MCP 或记忆规则。

本指令在正式版中只作为只读占位：用于说明当前不执行自动自学习闭环。

## 允许动作

1. 读取 index/INDEX.md。
2. 读取 `logs/` 索引和任务摘要。
3. 输出人工可读的改进建议。

## 禁止动作

1. 不写入工程实验室，正式版不包含实验室目录。
2. 不自动修改 Agent、规则、Skills、MCP、Hooks 或安全策略。
3. 不把敏感信息写入日志、记忆或知识库。

## 输出

- 当前正式版不启用自学习自动写入。
- 如需沉淀可复用知识，由 Doc 按 `kb/` 规则处理；如需长期恢复事实，由 Memory 按 `memory/` 规则处理。
EOF
}

strip_formal_lab_references() {
  local doc
  for doc in "$output/index/INDEX.md" "$output/index/FILES.md" "$output/README.md"; do
    [[ -f "$doc" ]] || continue
    perl -ni -e 'print unless m{lab/};' "$doc"
  done
}

sanitize_formal_runtime_references() {
  [[ "$edition" == "formal" ]] || return 0
  command -v python3 >/dev/null 2>&1 || {
    echo "清理运行包源工程引用需要 python3" >&2
    exit 1
  }
  python3 - "$output" <<'PY'
import re
import sys
from pathlib import Path

root = Path(sys.argv[1])
link_pattern = re.compile(
    r"\[([^\]]+)\]\((?:\.\./)*project/adr/accepted/ADR-[^)]+\)"
)

for path in root.rglob("*.md"):
    if "skills" in path.parts or "logs" in path.parts:
        continue
    text = path.read_text(encoding="utf-8")
    text = link_pattern.sub(r"\1（源工程设计记录）", text)
    lines = [
        line
        for line in text.splitlines()
        if "project/adr/accepted/ADR-" not in line
    ]
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
PY
}

refresh_formal_runtime_catalogs() {
  [[ "$edition" == "formal" ]] || return 0
  command -v python3 >/dev/null 2>&1 || {
    echo "刷新运行包文件目录索引需要 python3" >&2
    exit 1
  }
  python3 - "$output" <<'PY'
import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve()
files = sorted(
    path.relative_to(root).as_posix()
    for path in root.rglob("*")
    if path.is_file()
)
directories = sorted(
    path.relative_to(root).as_posix()
    for path in root.rglob("*")
    if path.is_dir()
)

file_rows = "\n".join(
    f"| `{value}` | 运行包文件 | 按 security/file-ownership.md |"
    for value in files
)
directory_rows = "\n".join(
    f"| `{value}` | 运行包目录 |"
    for value in directories
)

(root / "rule/catalog/files.md").write_text(
    """---
id: "rule-catalog-files"
title: "AI-Teams 运行包文件清单"
type: "generated-rule-index"
scope: "project"
owner: "doc"
status: active
---
# AI-Teams 运行包文件清单

本文件由打包流程按最终交付内容重新生成。只在需要精确定位文件时读取。

<!-- AI-TEAMS:rule-files:BEGIN -->
## AI-Teams 运行包文件

| 文件 | 分类 | Owner 规则 |
|---|---|---|
"""
    + file_rows
    + "\n<!-- AI-TEAMS:rule-files:END -->\n",
    encoding="utf-8",
)
(root / "rule/catalog/directories.md").write_text(
    """---
id: "rule-catalog-directories"
title: "AI-Teams 运行包目录清单"
type: "generated-rule-index"
scope: "project"
owner: "doc"
status: active
---
# AI-Teams 运行包目录清单

本文件由打包流程按最终交付内容重新生成。目录职责以 security/file-ownership.md 为准。

<!-- AI-TEAMS:rule-directories:BEGIN -->
## AI-Teams 运行包目录

| 目录 | 用途 |
|---|---|
"""
    + directory_rows
    + "\n<!-- AI-TEAMS:rule-directories:END -->\n",
    encoding="utf-8",
)
PY
}

sanitize_formal_user_text() {
  [[ "$edition" == "formal" ]] || return 0
  find "$artifact_root" -type f \( -name "*.md" -o -name "*.json" -o -name "*.txt" -o -name "*.sh" \) -print0 |
    while IFS= read -r -d '' file; do
      perl -0pi \
        -e 's/正式版运行包/运行包/g;' \
        -e 's/正式版安装包/AI-Teams 安装包/g;' \
        -e 's/formal v1\.0 运行包/v1.0 运行包/g;' \
        -e 's/正式版/安装包/g;' \
        -e 's/工程版/源工程/g;' \
        -e 's/精简版/精简安装包/g;' \
        -e 's/转换/生成/g;' \
        "$file"
    done
}

assert_formal_portable_paths() {
  [[ "$edition" == "formal" ]] || return 0
  local hits
  local user_hits
  local user_root_literal
  local home_prefix="${HOME%/}/"
  user_root_literal="$(printf '/%s/' 'Users')"
  hits="$(rg -n --hidden --no-ignore -F "$home_prefix" "$artifact_root" 2>/dev/null || true)"
  user_hits="$(rg -n --hidden --no-ignore -F "$user_root_literal" "$artifact_root" 2>/dev/null || true)"
  if [[ -n "$hits" && -n "$user_hits" ]]; then
    hits="${hits}"$'\n'"${user_hits}"
  elif [[ -n "$user_hits" ]]; then
    hits="$user_hits"
  fi
  if [[ -n "$hits" ]]; then
    echo "安装包包含本机绝对路径，已中止：" >&2
    printf "%s\n" "$hits" >&2
    exit 1
  fi
}

prepare_formal_runtime_package() {
  rm -f "$output/CLAUDE.md"
  rm -f "$output/tools/bin/ai-teams-package.sh" "$output/tools/bin/ai-teams-package.ps1"
  rm -f "$output/tools/commands/ai/package-formal.md"
  rm -f "$output/tools/commands/ai/package-simplify.md"
  rm -rf "$output/tools/package"
  write_formal_runtime_docs
  rewrite_formal_self_learn_command
  strip_formal_lab_references
}

copy_simplify() {
  local dirs files core_agents agent name keep scoped_dir dir_path
  files=(README.md VERSION MANIFEST.json CLAUDE.md)
  dirs=(.claude index project memory kb shared security hooks logs templates skills mcp tools rule)
  core_agents=(lead pd plan-pm dev qa doc memory role security-reviewer)
  for file in "${files[@]}"; do
    [[ -f "$file" ]] && rsync -a "$file" "$output/"
  done
  mkdir -p "$output/agents"
  for agent in "${core_agents[@]}"; do
    [[ -d "agents/$agent" ]] && rsync -a "agents/$agent" "$output/agents/"
  done
  mkdir -p "$output/agents/dev" "$output/memory/agents/dev" "$output/kb/agents/dev"
  cat > "$output/agents/dev/dev.md" <<'EOF'
# Dev 通用开发 Agent

## 角色定位

精简版通用 Dev 负责前端、后端和集成类开发任务的基础实现。

## 职责范围

- 遵循项目现有开发规范和样式规范。
- 项目无明确规范时，参考 Alibaba 开发规范。
- 按 Lead 和 Plan-PM 分派任务修改代码或文档。
- 修改前检查索引、项目命令、安全边界和 CodeGraph 状态。
- 完成后提供变更摘要、验证结果和风险说明。

## 输入

- Lead 或 Plan-PM 分派的任务。
- 项目索引、项目命令、安全边界和 CodeGraph 状态。

## 输出

- 代码或文档变更。
- 开发交接。
- 验证结果和风险说明。

## 管理目录

- 按任务指定目录执行。

## 禁止事项

- 不直接修改正式记忆，记忆由 Memory 管理。
- 不直接沉淀正式知识库，知识库由 Doc 管理。
- 不删除用户项目文件，删除必须经用户确认。

## 关联记忆

- memory/agents/dev/MEMORY.md

## 关联知识库

- kb/agents/dev/

## 关联 Skills

- 见 skills/registry.json

## 关联 MCP

- 见 mcp/registry.json

## 交接规则

完成任务后写入变更摘要、验证结果、风险和后续建议。
EOF
  cat > "$output/memory/agents/dev/MEMORY.md" <<'EOF'
# Dev 通用开发记忆

当前暂无正式记忆。只保存长期稳定、经验证、可复用的开发事实。
EOF
  cat > "$output/kb/agents/dev/index.md" <<'EOF'
# Dev 通用开发知识库

当前暂无正式知识条目。经 Doc 验证后可沉淀通用开发规范、项目架构结论和测试方法。
EOF
  for dir in "${dirs[@]}"; do
    [[ -d "$dir" ]] || continue
    rsync -a \
      --exclude ".env" \
      --exclude ".env.*" \
      --exclude "*.pem" \
      --exclude "*.key" \
      --exclude "node_modules/" \
      --exclude ".cache/" \
      --exclude "tmp/" \
      --exclude ".codegraph/" \
      --exclude "logs/audit/*.md" \
      --exclude "logs/command/*.md" \
      --exclude "logs/package/*.md" \
      --exclude "logs/upgrade/*.md" \
      --exclude "logs/task/*.md" \
      --exclude "logs/agent/*.md" \
      --exclude "memory/conversations/sessions/*" \
      --exclude "lab/experiments/" \
      --exclude "releases/" \
      "$dir" "$output/"
  done
  for scoped_dir in "$output/memory/agents" "$output/kb/agents"; do
    [[ -d "$scoped_dir" ]] || continue
    find "$scoped_dir" -mindepth 1 -maxdepth 1 -type d | while read -r dir_path; do
      name="$(basename "$dir_path")"
      keep=0
      for agent in "${core_agents[@]}"; do
        [[ "$name" == "$agent" ]] && keep=1
      done
      [[ "$keep" -eq 1 ]] || rm -rf "$dir_path"
    done
  done
  mkdir -p "$output/index"
  cat > "$output/index/SIMPLIFY.md" <<EOF
# 精简版索引

## 核心 Agent

- lead
- pd
- plan-pm
- dev
- qa
- doc
- memory
- role
- security-reviewer

## 说明

精简版保留项目初始化、基础记忆、基础知识库、基础安全、基础日志、基础回滚和核心模板。
正式版 12-Agent 自检不适用于精简版，需要使用精简版专属验收规则。
EOF
}

if [[ "$edition" == "formal" ]]; then
  copy_formal
  normalize_payload_claude_settings
else
  copy_simplify
fi

if [[ "$edition" == "formal" && "$install_layout" == "claude-subdir" ]]; then
  mkdir -p "$artifact_root/.claude"
  write_formal_wrapper_claude_settings
  write_formal_wrapper_local_example
  write_formal_subagent_adapters
  write_formal_rule_adapters
  write_formal_project_mcp_config
  rm -rf "$output/.claude"
  cat > "$artifact_root/README.md" <<'EOF'
# CC-RADT 安装包

[简体中文](README.md) | [English](README.en.md)

本目录采用低侵入安装布局。

CC-RADT 全名为 Claude Code Research and Development Teams，中文名为“基于 Claude Code 的全流程研发团队”。`.claude/ai-teams/` 是 v1 稳定运行命名空间。

## 安装方式

将本目录内容合并到目标项目根目录：

```text
target-project/
├── .mcp.json
└── .claude/
    ├── settings.json
    ├── settings.local.example.json
    ├── agents/
    ├── rules/
    ├── manifest.json
    └── ai-teams/
        ├── index/ENTRY.md
        ├── agents/
        ├── memory/
        ├── kb/
        ├── shared/
        ├── security/
        └── tools/
```

CC-RADT 工程大脑位于 `.claude/ai-teams/`。目标项目自己的根 `CLAUDE.md` 保持唯一且不会被安装包创建或覆盖；CC-RADT 通过 `.claude/settings.json`、`.claude/agents/` 和 `.claude/rules/` 接入，并提供 Claude Code 项目级 MCP 配置 `.mcp.json`。

完整中文文档见 [工程 README](.claude/ai-teams/README.md)，English documentation is available in [README.en.md](.claude/ai-teams/README.en.md).

## 参与打包的工程大脑模块

正式版包含：

- `index/ENTRY.md`
- `agents/`
- `index/`
- `project/`
- `memory/`
- `kb/`
- `shared/`
- `security/`
- `hooks/`
- `cron/`
- `templates/`
- `skills/`
- `mcp/`
- `tools/`
- `playbook.md`
- `logs/` 体系结构和索引

正式版不包含主工程历史运行日志正文、原始会话记录、缓存、`.codegraph/`、`node_modules/` 和敏感命名文件。

正式版也不包含正式版/精简版打包指令或打包脚本；发布维护能力只保留在主工程。
正式版不包含 `lab/` 工程实验室内容。

## 初始化目标项目

进入目标项目根目录后执行：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

Windows PowerShell：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write
```

初始化不得读取 `.env`、密钥、证书、token、credentials 等敏感文件内容。
初始化会把目标项目画像、技术栈、依赖入口、常用命令、验证方式、风险线索、文档入口和既有 AI/编码规则写入 .claude/ai-teams/project/，不会修改目标项目业务代码。
后续任务执行中，Lead 关闭非平凡任务前会检查是否需要继续更新 .claude/ai-teams/project/，让 Agent 对目标项目的理解随执行逐步完善。
EOF
  cat > "$artifact_root/README.en.md" <<'EOF'
# CC-RADT Runtime Package

[简体中文](README.md) | [English](README.en.md)

CC-RADT stands for Claude Code Research and Development Teams. This package uses a low-intrusion layout and keeps the stable v1 runtime namespace at `.claude/ai-teams/`.

## Install

Merge this directory into the target project root. If `.claude/settings.json` or `.mcp.json` already exists, merge the relevant sections instead of overwriting user configuration.

The CC-RADT engineering brain lives in `.claude/ai-teams/`. Claude Code discovers the 12 named agents from `.claude/agents/`, loads adapter rules from `.claude/rules/`, and uses the project MCP configuration from `.mcp.json`. The package never creates or replaces the project's root `CLAUDE.md`.

## Verify and initialize

```bash
bash .claude/ai-teams/tools/bin/ai-teams-check.sh
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

Windows PowerShell:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-check.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write
```

Initialization writes only to CC-RADT-managed project knowledge, rules, indexes, and memory candidate areas. It does not read sensitive file contents or modify application code.

See the [full English documentation](.claude/ai-teams/README.en.md) for agents, workflows, memory, governance, prompts, Skills, MCP, and commands.
EOF
  cat > "$artifact_root/INSTALL.md" <<'EOF'
# 安装说明

1. 备份目标项目已有 .claude/settings.json。
2. 将本安装包内容合并到目标项目根目录。
3. 如目标项目已有 .claude/settings.json，人工合并 `ai_teams` 配置，不要覆盖用户已有配置。
4. 如目标项目已有 `.mcp.json`，人工合并 `mcpServers`，不要覆盖用户已有 MCP。
5. 进入目标项目根目录。
6. macOS / Linux 运行 `bash .claude/ai-teams/tools/bin/ai-teams-check.sh` 做安装包自检；Windows 运行 `pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-check.ps1`。
7. macOS / Linux 运行 `bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write` 初始化项目管理文档；Windows 运行 `pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write`。
EOF
fi

mkdir -p "$output/logs/agent" "$output/logs/task" "$output/logs/command" "$output/logs/hook" "$output/logs/package" "$output/logs/upgrade" "$output/logs/audit" "$output/logs/security" "$output/logs/compressed/archive"
for log_index in \
  logs/index.md \
  logs/agent/index.md \
  logs/task/index.md \
  logs/command/index.md \
  logs/hook/index.md \
  logs/package/index.md \
  logs/upgrade/index.md \
  logs/audit/index.md \
  logs/security/index.md \
  logs/compressed/index.md
do
  if [[ -f "$log_index" ]]; then
    mkdir -p "$output/$(dirname "$log_index")"
    cp "$log_index" "$output/$log_index"
  fi
done

if [[ "$edition" == "formal" ]]; then
  prepare_formal_runtime_package
  reset_formal_runtime_state
  sanitize_formal_runtime_references
  refresh_formal_runtime_catalogs
  sanitize_formal_user_text
  copy_public_runtime_readmes
  formal_brain_items=(
    "index/ENTRY.md"
    "agents"
    "prompts"
    "index"
    "project"
    "memory"
    "kb"
    "shared"
    "security"
    "hooks"
    "cron"
    "templates"
    "skills"
    "mcp"
    "tools"
    "playbook.md"
    "logs/index.md"
    "logs/agent/index.md"
    "logs/task/index.md"
    "logs/command/index.md"
    "logs/hook/index.md"
    "logs/package/index.md"
    "logs/upgrade/index.md"
    "logs/security/index.md"
  )
  for item in "${formal_brain_items[@]}"; do
    if [[ ! -e "$output/$item" ]]; then
      echo "formal 包缺失工程大脑模块：$item" >&2
      exit 1
    fi
  done
  formal_forbidden_items=(
    "tools/bin/ai-teams-package.sh"
    "tools/bin/ai-teams-package.ps1"
    "tools/commands/ai/package-formal.md"
    "tools/commands/ai/package-simplify.md"
    "tools/package"
    "lab"
    "shared/prompt-evolution/history.json"
  )
  for item in "${formal_forbidden_items[@]}"; do
    if [[ -e "$output/$item" ]]; then
      echo "formal 包不应包含工程版发布维护文件：$item" >&2
      exit 1
    fi
  done
  formal_cache_hits="$(
    find "$artifact_root" \
      \( -type d -name "__pycache__" -o -type f \( -name "*.pyc" -o -name "*.pyo" \) \) \
      -print 2>/dev/null
  )"
  if [[ -n "$formal_cache_hits" ]]; then
    echo "formal 包不应包含 Python 字节码缓存：" >&2
    printf '%s\n' "$formal_cache_hits" >&2
    exit 1
  fi
	  formal_lab_refs="$(rg -n "lab/" "$output/tools/commands" "$output/index" "$output/README.md" 2>/dev/null || true)"
  if [[ -n "$formal_lab_refs" ]]; then
    echo "formal 包运行指令不应引用 lab/：" >&2
    printf "%s\n" "$formal_lab_refs" >&2
    exit 1
  fi
fi

find "$artifact_root" -name ".DS_Store" -type f -delete

sensitive_hits="$(find "$artifact_root" -type f | while read -r file; do
  if ai_teams_is_sensitive_path "$file"; then
    printf "%s\n" "$file"
  fi
done)"

if [[ -n "$sensitive_hits" ]]; then
  echo "发布包包含敏感命名文件，已中止：" >&2
  printf "%s\n" "$sensitive_hits" >&2
  exit 1
fi

checksum="$artifact_root/checksums.txt"
package_manifest="$artifact_root/manifest.json"
if [[ "$edition" == "formal" && "$install_layout" == "claude-subdir" ]]; then
  package_manifest="$artifact_root/.claude/manifest.json"
fi
mkdir -p "$(dirname "$package_manifest")"
file_count="$(find "$artifact_root" -type f | wc -l | tr -d ' ')"
manifest_artifact_root="$artifact_root"
manifest_ai_teams_root="$output"
if [[ "$edition" == "formal" ]]; then
  manifest_artifact_root="."
  if [[ "$install_layout" == "claude-subdir" ]]; then
    manifest_ai_teams_root=".claude/ai-teams"
  else
    manifest_ai_teams_root="."
  fi
fi

cat > "$package_manifest" <<EOF
{
  "name": "CC-RADT",
  "full_name": "Claude Code Research and Development Teams",
  "display_name_zh": "基于 Claude Code 的全流程研发团队",
  "runtime_namespace": "ai-teams",
  "edition": "$edition",
  "version": "$version",
  "stage": "$([[ "$edition" == "formal" ]] && echo "formal-runtime" || echo "package")",
  "status": "$([[ "$edition" == "formal" ]] && echo "runtime-remediation-ready" || echo "active")",
  "release_planning_status": "$([[ "$edition" == "formal" ]] && echo "runtime-package-no-packaging-commands" || echo "package-generated")",
  "install_layout": "$install_layout",
  "artifact_root": "$manifest_artifact_root",
  "ai_teams_root": "$manifest_ai_teams_root",
  "created_at": "$(ai_teams_now)",
  "file_count": $file_count,
  "sensitive_scan": "passed",
  "file_summary": {
    "commands": $([[ "$edition" == "formal" ]] && echo 23 || echo 25),
    "root_entries": [
      "README.md",
      "README.en.md",
      "THIRD_PARTY_NOTICES.md",
      "VERSION",
      "MANIFEST.json",
      "index/ENTRY.md"
    ]
  },
  "package_rules_summary": "运行包不包含打包指令或打包脚本；项目级 MCP 配置保留在目标项目根目录 .mcp.json，安装包元信息位于 .claude/manifest.json。",
  "included_brain_modules": [
    "index/ENTRY.md",
    "agents/",
    "prompts/",
    "rule/",
    "index/",
    "project/",
    "memory/",
    "kb/",
    "shared/",
    "security/",
    "hooks/",
    "cron/",
    "templates/",
    "skills/",
    "third_party/",
    "mcp/",
    "tools/",
    "playbook.md",
    "logs/ indexes and structure"
  ],
  "excluded_runtime_content": [
    "main engineering runtime log bodies",
    "memory/conversations/sessions/*",
    "shared/prompt-evolution runtime events, candidates, reviews and history",
    "lab/",
    ".git/",
    ".codegraph/",
    "node_modules/",
    "cache and tmp directories",
    "sensitive named files"
  ],
  "codegraph_index_included": false
}
EOF
if [[ "$package_manifest" != "$output/manifest.json" &&
      ! ( "$edition" == "formal" && "$install_layout" == "claude-subdir" ) ]]; then
  cp "$package_manifest" "$output/manifest.json"
fi
sanitize_formal_user_text
assert_formal_portable_paths
ai_teams_checksum_tree "$artifact_root" "$checksum"

verify_result="not-run"
if [[ "$verify" -eq 1 && "$edition" == "formal" ]]; then
  (cd "$output" && bash tools/bin/ai-teams-check.sh)
  verify_result="formal self-check passed"
elif [[ "$edition" == "simplify" ]]; then
  bash tools/bin/ai-teams-check-simplify.sh "$output"
  verify_result="simplify self-check passed"
fi

# Verification can create runtime evidence. Freeze metadata and checksums only
# after every requested check has completed.
clean_formal_runtime_artifacts
sanitize_formal_runtime_references
refresh_formal_runtime_catalogs
sanitize_formal_user_text
assert_formal_portable_paths
file_count="$(find "$artifact_root" -type f | wc -l | tr -d ' ')"
if command -v python3 >/dev/null 2>&1; then
  python3 - "$package_manifest" "$file_count" <<'PY'
import json
import sys
from pathlib import Path

manifest = Path(sys.argv[1])
data = json.loads(manifest.read_text(encoding="utf-8"))
data["file_count"] = int(sys.argv[2])
manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY
fi
ai_teams_checksum_tree "$artifact_root" "$checksum"

ai_teams_display_path() {
  local value="$1"
  local home_prefix="${HOME%/}"
  if [[ -n "$home_prefix" && "$value" == "$home_prefix"* ]]; then
    printf '$HOME%s' "${value#"$home_prefix"}"
  else
    printf "%s" "$value"
  fi
}

display_artifact_root="$(ai_teams_display_path "$artifact_root")"
display_output="$(ai_teams_display_path "$output")"
display_manifest="$(ai_teams_display_path "$package_manifest")"
display_checksum="$(ai_teams_display_path "$checksum")"

report="logs/package/package-${edition}-${stamp}.md"
cat > "$report" <<EOF
# CC-RADT ${edition} 打包报告

- 时间：$(ai_teams_now)
- 版本：$version
- 输出目录：$display_artifact_root
- CC-RADT 运行根目录：$display_output
- 安装布局：$install_layout
- manifest：$display_manifest
- checksum：$display_checksum
- 文件数量：$file_count
- 敏感命名扫描：通过
- 安装验证：$verify_result

## 排除规则

- 不包含 .env、密钥、证书、token、credentials 命名文件。
- 不包含 .codegraph/、node_modules/、缓存和临时目录。
- 包含 Skills、MCP、Project、Cron、Hooks、Index、Playbook 等工程大脑模块。
- 包含 logs 体系结构和索引，不包含主工程运行日志正文和会话记录。
- 不在主工程根目录创建 releases/，正式包 manifest/checksum 写入输出目录。
EOF

ai_teams_write_status_event "${edition} 发布包已生成：$display_artifact_root"
cat "$report"
