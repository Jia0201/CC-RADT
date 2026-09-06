#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ai-teams-lib.sh"
ai_teams_require_root
ai_teams_ensure_runtime_dirs

probe=0
registry_file="mcp/registry.json"
project_mcp_file=".mcp.json"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --probe)
      probe=1
      shift
      ;;
    --registry)
      registry_file="${2:-}"
      shift 2
      ;;
    --project-mcp)
      project_mcp_file="${2:-}"
      shift 2
      ;;
    -h|--help)
      cat <<'EOF'
用法：tools/bin/ai-teams-mcp-healthcheck.sh [--probe] [--registry mcp/registry.json] [--project-mcp .mcp.json]

说明：
- 默认只做可移植配置检查，不启动 MCP Server，也不写入密钥。
- --probe 会尝试对默认 npx MCP 包执行短超时 --help 探测；该模式可能触发 npx 下载。
EOF
      exit 0
      ;;
    *)
      echo "未知参数：$1" >&2
      exit 2
      ;;
  esac
done

stamp="$(ai_teams_stamp)"
report="logs/command/mcp-healthcheck-${stamp}.md"
mkdir -p "$(dirname "$report")"

status=0
{
  echo "# MCP 健康检查"
  echo
  echo "- 时间：$stamp"
  echo "- registry：$registry_file"
  echo "- project MCP：$project_mcp_file"
  echo "- 探测模式：$([[ "$probe" -eq 1 ]] && echo probe || echo static)"
  echo
} > "$report"

if [[ ! -f "$registry_file" ]]; then
  echo "缺失 MCP registry：$registry_file" | tee -a "$report"
  exit 1
fi

if [[ ! -f "$project_mcp_file" ]]; then
  echo "缺失 Claude Code 项目级 MCP 配置：$project_mcp_file" | tee -a "$report"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "缺少 python3，无法解析 MCP JSON。" | tee -a "$report"
  exit 1
fi

python3 - "$registry_file" "$project_mcp_file" >> "$report" <<'PY' || status=1
import json
import sys
from pathlib import Path

registry_path = Path(sys.argv[1])
project_path = Path(sys.argv[2])
registry = json.loads(registry_path.read_text(encoding="utf-8"))
project = json.loads(project_path.read_text(encoding="utf-8"))
servers = registry.get("servers", {})
project_servers = project.get("mcpServers", {})
required = registry.get("default_mcp_servers", list(servers.keys()))
runtime_authorization_required = set(registry.get("runtime_authorization_required_servers", []))
ok = True
home_prefix = str(Path.home()).rstrip("/") + "/"

print("## 静态检查")
print()

for server_id in required:
    item = servers.get(server_id)
    if not isinstance(item, dict):
        print(f"- 缺失默认 MCP registry 服务器：{server_id}")
        ok = False
        continue
    config_name = item.get("config_name")
    if not config_name:
        print(f"- {server_id} 缺少 config_name")
        ok = False
    if item.get("credential_required") or server_id in runtime_authorization_required:
        print(f"- {server_id} 已写入项目级 MCP；运行时需要用户本机环境变量或显式授权")
    if item.get("transport") == "stdio" and not item.get("command"):
        print(f"- {server_id} stdio MCP 缺少 command")
        ok = False
    if not isinstance(item.get("args", []), list):
        print(f"- {server_id} args 必须为数组")
        ok = False
    if config_name and config_name not in project_servers:
        print(f"- .mcp.json 缺少默认 MCP：{config_name}")
        ok = False
    else:
        project_item = project_servers.get(config_name, {})
        if item.get("transport") == "http":
            if project_item.get("type") != "http" or not project_item.get("url"):
                print(f"- .mcp.json 中 {config_name} HTTP 配置不完整")
                ok = False
        elif project_item.get("command") != item.get("command"):
            print(f"- .mcp.json 中 {config_name} command 与 registry 不一致")
            ok = False
        if item.get("transport") != "http" and project_item.get("args") != item.get("args"):
            print(f"- .mcp.json 中 {config_name} args 与 registry 不一致")
            ok = False
    print(f"- 已检查：{server_id} -> {config_name}")

for name, item in project_servers.items():
    text = json.dumps(item, ensure_ascii=False)
    if home_prefix != "/" and home_prefix in text:
        print(f"- {name} 含本机绝对路径，违反可移植规则")
        ok = False
    if any(secret_word in text.lower() for secret_word in ("token=", "password=", "secret=", "api_key=")):
        print(f"- {name} 疑似包含密钥值，请改为环境变量占位符")
        ok = False

print()
print("结果：" + ("通过" if ok else "失败"))
sys.exit(0 if ok else 1)
PY

if [[ "$probe" -eq 1 ]]; then
  if ! command -v npx >/dev/null 2>&1; then
    echo "缺少 npx，无法进行 --probe 探测。" | tee -a "$report"
    status=1
  else
    echo >> "$report"
    echo "## --probe 探测" >> "$report"
    echo >> "$report"
    python3 - "$registry_file" <<'PY' > /tmp/ai-teams-mcp-probe.$$
import json
import shlex
import sys
from pathlib import Path

registry = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
servers = registry.get("servers", {})
for server_id in registry.get("default_mcp_servers", []):
    item = servers.get(server_id, {})
    command = item.get("command")
    args = item.get("args", [])
    package = item.get("package")
    if command == "npx" and package:
        print(server_id + "\t" + " ".join(shlex.quote(part) for part in ["npx", "-y", package, "--help"]))
PY
    while IFS=$'\t' read -r server_id command_line; do
      [[ -n "$server_id" ]] || continue
      if timeout 20s bash -lc "$command_line" >/tmp/ai-teams-mcp-probe-out.$$ 2>&1; then
        echo "- ${server_id}：--help 探测通过" >> "$report"
      else
        echo "- ${server_id}：--help 探测失败或超时" >> "$report"
        sed -n '1,20p' /tmp/ai-teams-mcp-probe-out.$$ >> "$report"
        status=1
      fi
      rm -f /tmp/ai-teams-mcp-probe-out.$$
    done < /tmp/ai-teams-mcp-probe.$$
    rm -f /tmp/ai-teams-mcp-probe.$$
  fi
fi

echo "MCP 健康检查报告：$report"
exit "$status"
