#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ai-teams-lib.sh"
ai_teams_require_root
ai_teams_ensure_runtime_dirs

registry_file="skills/registry.json"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --registry)
      registry_file="${2:-}"
      shift 2
      ;;
    -h|--help)
      cat <<'EOF'
用法：tools/bin/ai-teams-skills-verify.sh [--registry skills/registry.json]

验证 Skills registry 与工程内 vendored Skills 文件是否一致。
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
if [[ "${AI_TEAMS_NO_LOG:-0}" == "1" ]]; then
  report="$(mktemp)"
else
  report="logs/command/skills-verify-${stamp}.md"
  mkdir -p "$(dirname "$report")"
fi

{
  echo "# Skills Registry 验证"
  echo
  echo "- 时间：$stamp"
  echo "- registry：$registry_file"
  echo
} > "$report"

if [[ ! -f "$registry_file" ]]; then
  echo "缺失 Skills registry：$registry_file" | tee -a "$report"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "缺少 python3，无法解析 Skills registry。" | tee -a "$report"
  exit 1
fi

python3 - "$registry_file" >> "$report" <<'PY'
import json
import sys
from pathlib import Path

registry_path = Path(sys.argv[1])
data = json.loads(registry_path.read_text(encoding="utf-8"))
agents = data.get("agents", {})
expected_agents = {
    "lead",
    "pd",
    "plan-pm",
    "dev-frontend-web",
    "dev-frontend-miniapp",
    "dev-backend-systems",
    "dev-backend-service",
    "qa",
    "memory",
    "doc",
    "role",
    "security-reviewer",
}
ok = True
total = 0
missing = []
bad_paths = []
empty_files = []
absolute_paths = []
bad_frontmatter = []
missing_indexes = []
missing_pointers = []
duplicate_paths = {}

print("## 检查结果")
print()

mode = data.get("mode")
canonical_root = data.get("canonical_root")
install_mode = data.get("install_mode")
if mode != "vendored-local-copy":
    print(f"- mode 必须是 vendored-local-copy，当前为：{mode!r}")
    ok = False
if install_mode != mode:
    print(f"- install_mode 必须与 mode 一致，当前为：{install_mode!r}")
    ok = False
if canonical_root != "skills/agents":
    print(f"- canonical_root 必须是 skills/agents，当前为：{canonical_root!r}")
    ok = False
actual_agents = set(agents)
if actual_agents != expected_agents:
    print(f"- Agent 集合不完整，缺失：{sorted(expected_agents - actual_agents)}，多余：{sorted(actual_agents - expected_agents)}")
    ok = False

seen = {}
for agent, items in agents.items():
    agent_index = Path("skills") / "agents" / agent / "index.md"
    agent_pointer = Path("agents") / agent / "skills.md"
    claude_agent = Path(".claude") / "agents" / f"{agent}.md"
    if not claude_agent.is_file() and Path.cwd().resolve().parent.name == ".claude":
        claude_agent = Path("..") / "agents" / f"{agent}.md"
    if not agent_index.is_file():
        missing_indexes.append(str(agent_index))
        ok = False
    if not agent_pointer.is_file():
        missing_pointers.append(str(agent_pointer))
        ok = False
    if not claude_agent.is_file():
        missing_pointers.append(str(claude_agent))
        ok = False
    if not isinstance(items, list):
        print(f"- {agent} skills 列表不是数组")
        ok = False
        continue
    for item in items:
        total += 1
        skill_file = item.get("skill_file")
        path_value = item.get("path")
        slug = item.get("slug")
        if not skill_file:
            print(f"- {agent}/{slug or 'unknown'} 缺少 skill_file")
            ok = False
            continue
        path = Path(skill_file)
        if path.is_absolute():
            absolute_paths.append((agent, slug, skill_file))
            ok = False
        if path_value and Path(path_value).is_absolute():
            absolute_paths.append((agent, slug, path_value))
            ok = False
        if not str(skill_file).startswith(f"skills/agents/{agent}/"):
            bad_paths.append((agent, slug, skill_file))
            ok = False
        if not path.is_file():
            missing.append((agent, slug, skill_file))
            ok = False
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        if not text.strip():
            empty_files.append((agent, slug, skill_file))
            ok = False
        elif not text.startswith("---\n") or "\nname:" not in text or "\ndescription:" not in text:
            bad_frontmatter.append((agent, slug, skill_file))
            ok = False
        key = str(path)
        seen.setdefault(key, []).append(agent)

for path, bound_agents in seen.items():
    if len(bound_agents) > 1:
        duplicate_paths[path] = bound_agents

print(f"- registry 条目数：{total}")
print(f"- Agent 数量：{len(agents)}")
print(f"- 缺失文件：{len(missing)}")
print(f"- 路径错误：{len(bad_paths)}")
print(f"- 绝对路径：{len(absolute_paths)}")
print(f"- 空文件：{len(empty_files)}")
print(f"- frontmatter 错误：{len(bad_frontmatter)}")
print(f"- 缺失 Agent Skills 索引：{len(missing_indexes)}")
print(f"- 缺失 Agent 指针：{len(missing_pointers)}")
print(f"- 多 Agent 共享同一物理路径：{len(duplicate_paths)}")
print()

if missing:
    print("### 缺失文件")
    for agent, slug, path in missing:
        print(f"- {agent}/{slug}: {path}")
if bad_paths:
    print("### 路径未落在对应 Agent 目录")
    for agent, slug, path in bad_paths:
        print(f"- {agent}/{slug}: {path}")
if absolute_paths:
    print("### 绝对路径")
    for agent, slug, path in absolute_paths:
        print(f"- {agent}/{slug}: {path}")
if empty_files:
    print("### 空文件")
    for agent, slug, path in empty_files:
        print(f"- {agent}/{slug}: {path}")
if bad_frontmatter:
    print("### Skill frontmatter 错误")
    for agent, slug, path in bad_frontmatter:
        print(f"- {agent}/{slug}: {path}")
if missing_indexes:
    print("### 缺失 Agent Skills 索引")
    for path in missing_indexes:
        print(f"- {path}")
if missing_pointers:
    print("### 缺失 Agent 指针")
    for path in missing_pointers:
        print(f"- {path}")

print()
print("结果：" + ("通过" if ok else "失败"))
sys.exit(0 if ok else 1)
PY

if [[ "${AI_TEAMS_NO_LOG:-0}" == "1" ]]; then
  echo "Skills 验证通过（无日志模式）"
else
  echo "Skills 验证报告：$report"
fi
