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
用法：tools/bin/ai-teams-skills-list.sh [--agent Agent名称]

说明：
- 只读取 skills/registry.json。
- 不执行 Skill 中的脚本，不读取私有配置。
EOF
      exit 0
      ;;
    *)
      echo "未知参数：$1" >&2
      exit 2
      ;;
  esac
done

report="logs/command/skills-list-$(ai_teams_stamp).md"

python3 - "$agent" <<'PY' > "$report"
import json
import sys
from pathlib import Path

agent = sys.argv[1]
registry = json.loads(Path("skills/registry.json").read_text(encoding="utf-8"))

print("# Skills 查询报告\n")
print("## 共享 Skills\n")
shared = registry.get("shared", [])
if shared:
    for item in shared:
        print(f"- {item.get('name', 'unnamed')}：{item.get('status', 'unknown')}，路径：{item.get('path', '未记录')}")
else:
    print("- 无共享 Skills。")

print("\n## Agent Skills\n")
agents = registry.get("agents", {})
if agent:
    items = agents.get(agent, [])
    print(f"### {agent}\n")
    if items:
        for item in items:
            print(f"- {item.get('name', 'unnamed')}：{item.get('status', 'unknown')}，路径：{item.get('path', '未记录')}")
    else:
        print("- 该 Agent 暂无 Skill。")
else:
    if agents:
        for name, items in agents.items():
            print(f"### {name}")
            for item in items:
                print(f"- {item.get('name', 'unnamed')}：{item.get('status', 'unknown')}，路径：{item.get('path', '未记录')}")
            print()
    else:
        print("- 暂无 Agent 专属 Skills。")
PY

cat "$report"
