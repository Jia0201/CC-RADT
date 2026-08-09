#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ai-teams-lib.sh"
ai_teams_require_root
ai_teams_ensure_runtime_dirs

agent=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent)
      agent="${2:-}"
      shift 2
      ;;
    -h|--help)
      cat <<'EOF'
用法：tools/bin/ai-teams-mcp-list.sh [--agent Agent名称]

说明：
- 只读取 mcp/registry.json，不读取 MCP 私有凭据。
- 可展示项目级 MCP 配置、默认 MCP、可选 MCP、指定 Agent MCP、MCP 安全规则入口和 CodeGraph 状态。
EOF
      exit 0
      ;;
    *)
      echo "未知参数：$1" >&2
      exit 2
      ;;
  esac
done

report="logs/command/mcp-list-$(ai_teams_stamp)-$$.md"

python3 - "$agent" <<'PY' > "$report"
import json
import sys
from pathlib import Path

agent = sys.argv[1]
registry = json.loads(Path("mcp/registry.json").read_text(encoding="utf-8"))

print("# MCP 查询报告\n")
print("## MCP 安全规则\n")
print("- 规则入口：security/mcp-policy.md")
print("- 私有配置：只记录环境变量占位和脱敏元数据，不读取密钥值、token、证书或数据库密码。")

print("\n## 项目级配置\n")
project_file = registry.get("official_claude_code_config", {}).get("project_scope_file", ".mcp.json")
canonical = registry.get("package_contract", {}).get("canonical_project_config", "mcp/claude-project.mcp.json")
optional = registry.get("package_contract", {}).get("optional_servers_template", "mcp/optional-servers.mcp.example.json")
print(f"- Claude Code 项目级配置：`{project_file}`")
print(f"- AI-Teams 标准副本：`{canonical}`")
print(f"- 可选 MCP 模板：`{optional}`")
print("- 密钥策略：工程文件只保存环境变量占位符，不保存密钥值。")

servers = registry.get("servers", {})

def render_server(server_id):
    item = servers.get(server_id, {})
    enabled = "默认启用" if item.get("enabled_by_default") else "可选启用"
    cred = "需要环境变量/用户授权" if item.get("credential_required") else "无需密钥"
    env_keys = item.get("env_keys") or []
    env_note = f"，env keys：{', '.join(env_keys)}" if env_keys else ""
    print(f"- {item.get('name', server_id)} (`{server_id}`)：{enabled}，配置名：`{item.get('config_name', '')}`，配置文件：`{item.get('config_file', '')}`，{cred}{env_note}")
    print(f"  - 用途：{item.get('purpose', '未记录')}")
    boundary = item.get("security_boundary")
    if boundary:
        print(f"  - 边界：{boundary}")

print("\n## 默认 MCP\n")
for server_id in registry.get("default_mcp_servers", []):
    render_server(server_id)

print("\n## 可选 MCP\n")
for server_id in registry.get("optional_mcp_servers", []):
    render_server(server_id)

print("\n## Agent MCP\n")
agents = registry.get("agents", {})
if agent:
    items = agents.get(agent, [])
    print(f"### {agent}\n")
    if items:
        for item in items:
            enabled = "默认启用" if item.get("enabled_by_default") else "可选启用"
            print(f"- `{item.get('id', 'unknown')}` / `{item.get('config_name', '')}`：{enabled}，配置文件：`{item.get('config_file', '')}`，用途：{item.get('purpose', '未记录')}")
    else:
        print("- 该 Agent 暂无 MCP。")
else:
    if agents:
        for name, items in agents.items():
            print(f"### {name}")
            for item in items:
                enabled = "默认启用" if item.get("enabled_by_default") else "可选启用"
                print(f"- `{item.get('id', 'unknown')}` / `{item.get('config_name', '')}`：{enabled}")
            print()
    else:
        print("- 暂无 Agent 专属 MCP。")

print("\n## QA Chrome MCP\n")
qa_items = agents.get("qa", [])
qa_chrome = [item for item in qa_items if item.get("id") == "chrome"]
if qa_chrome:
    item = qa_chrome[0]
    enabled = "默认启用" if item.get("enabled_by_default") else "可选启用"
    print(f"- 已绑定：Chrome MCP，{enabled}，配置名：`{item.get('config_name', '')}`")
else:
    print("- 未绑定：QA 缺少 Chrome MCP。")

print("\n## CodeGraph\n")
codegraph = servers.get("codegraph", {})
for key in ["config_name", "package", "command", "config_file", "purpose", "security_boundary"]:
    print(f"- {key}: {codegraph.get(key, '未记录')}")
PY

cat "$report"
