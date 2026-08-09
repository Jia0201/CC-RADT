#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ai-teams-lib.sh"
ai_teams_require_root
ai_teams_ensure_runtime_dirs

name=""
agent=""
scope="agent"
source_ref=""
command_ref=""
mode="plan"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      name="${2:-}"
      shift 2
      ;;
    --agent)
      agent="${2:-}"
      shift 2
      ;;
    --scope)
      scope="${2:-agent}"
      shift 2
      ;;
    --source)
      source_ref="${2:-}"
      shift 2
      ;;
    --command)
      command_ref="${2:-}"
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
用法：
  tools/bin/ai-teams-mcp-install.sh --name 名称 --scope shared --source 来源 --command 启动命令 [--plan|--apply]
  tools/bin/ai-teams-mcp-install.sh --name 名称 --agent Agent名称 --source 来源 --command 启动命令 [--plan|--apply]

说明：
- 默认只生成安装计划。
- --apply 只把用户明确提供的 MCP 元数据登记为可选 MCP，并在需要时绑定 Agent；不自动运行第三方安装命令。
- registry 不允许写入密钥、token、证书或环境变量内容。
- registry 不允许写入本机绝对路径；需要密钥的 MCP 请使用环境变量占位。
EOF
      exit 0
      ;;
    *)
      echo "未知参数：$1" >&2
      exit 2
      ;;
  esac
done

if [[ -z "$name" || -z "$source_ref" || -z "$command_ref" ]]; then
  echo "必须提供 --name、--source 和 --command。" >&2
  exit 1
fi

if [[ "$scope" != "shared" && "$scope" != "agent" ]]; then
  echo "--scope 只能是 shared 或 agent。" >&2
  exit 1
fi

if [[ "$scope" == "agent" ]]; then
  if [[ -z "$agent" || ! -d "agents/$agent" ]]; then
    echo "Agent 不存在或未提供：$agent" >&2
    exit 1
  fi
fi

if ai_teams_is_sensitive_path "$source_ref" || ai_teams_is_sensitive_path "$command_ref"; then
  echo "MCP 来源或命令包含敏感命名，拒绝写入 registry。" >&2
  exit 1
fi

user_root_literal="$(printf '/%s/' 'Users')"
case "$source_ref $command_ref" in
  *"$user_root_literal"*|*"$HOME"*|*"~/"*|"/"*)
    if [[ "$source_ref" == /* || "$command_ref" == /* || "$source_ref $command_ref" == *"$user_root_literal"* || "$source_ref $command_ref" == *"$HOME"* || "$source_ref $command_ref" == *"~/"* ]]; then
      echo "MCP 来源或命令包含本机绝对路径，拒绝写入可迁移 registry。" >&2
      exit 1
    fi
    ;;
esac

case "$(printf "%s %s" "$source_ref" "$command_ref" | tr "[:upper:]" "[:lower:]")" in
  *token*|*secret*|*credential*|*password*|*apikey*|*api_key*)
    echo "检测到疑似密钥字段，拒绝写入 registry。" >&2
    exit 1
    ;;
esac

stamp="$(ai_teams_stamp)"
report="logs/command/mcp-install-${stamp}-$$.md"
metadata_dir="mcp/installed/${scope}"
[[ "$scope" == "agent" ]] && metadata_dir="mcp/installed/agents/${agent}"
metadata_file="${metadata_dir}/${name}.md"

cat > "$report" <<EOF
# MCP 安装报告

- 时间：$(ai_teams_now)
- 名称：$name
- 范围：$scope
- Agent：${agent:-无}
- 来源：$source_ref
- 启动命令：$command_ref
- 模式：$mode

## 安全判断

- 未读取敏感文件内容。
- 未执行第三方安装命令。
- registry 不写入密钥、token、证书或环境变量内容。
EOF

if [[ "$mode" == "apply" ]]; then
  mkdir -p "$metadata_dir"
  cat > "$metadata_file" <<EOF
# MCP 元数据：$name

- 时间：$(ai_teams_now)
- 范围：$scope
- Agent：${agent:-无}
- 来源：$source_ref
- 启动命令：$command_ref
- 状态：installed-metadata

说明：该文件只记录用户明确提供的 MCP 元数据，不保存密钥。
EOF

  python3 - "$name" "$scope" "$agent" "$source_ref" "$command_ref" "$metadata_file" <<'PY'
import json
import re
import shlex
import sys
from datetime import datetime
from pathlib import Path

name, scope, agent, source, command, metadata = sys.argv[1:7]
path = Path("mcp/registry.json")
data = json.loads(path.read_text(encoding="utf-8"))
slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "custom-mcp"
parts = shlex.split(command)
cmd = parts[0] if parts else "npx"
args = parts[1:] if len(parts) > 1 else []
config_name = f"ai-teams-{slug}"
server_entry = {
    "id": slug,
    "name": name,
    "config_name": config_name,
    "source": source,
    "command": cmd,
    "args": args,
    "transport": "stdio",
    "enabled_by_default": False,
    "credential_required": False,
    "config_file": "mcp/optional-servers.mcp.example.json",
    "metadata": metadata,
    "registered_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "purpose": "用户登记的可选 MCP。启用前必须由 Lead 和 Security-Reviewer 确认任务用途、授权范围和运行风险。",
    "security_boundary": "默认不启用，不自动运行安装命令；不得保存密钥值或本机绝对路径。",
}
data.setdefault("servers", {})[slug] = server_entry
optional = data.setdefault("optional_mcp_servers", [])
if slug not in optional:
    optional.append(slug)
if scope == "agent":
    binding = {
        "id": slug,
        "config_name": config_name,
        "enabled_by_default": False,
        "config_file": "mcp/optional-servers.mcp.example.json",
        "purpose": server_entry["purpose"],
        "security_boundary": server_entry["security_boundary"],
    }
    items = data.setdefault("agents", {}).setdefault(agent, [])
    items[:] = [item for item in items if item.get("id") != slug]
    items.append(binding)
data["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY

  tmp="$(mktemp)"
  cat > "$tmp" <<EOF
## MCP 安装记录

- 时间：$(ai_teams_now)
- 名称：$name
- 范围：$scope
- Agent：${agent:-无}
- 元数据：$metadata_file
EOF
  ai_teams_update_section "index/AGENTS.md" "mcp-install-${scope}-${agent:-shared}-${name}" "$tmp"
  rm -f "$tmp"
  ai_teams_write_status_event "MCP 已注册：$name"
fi

cat "$report"
