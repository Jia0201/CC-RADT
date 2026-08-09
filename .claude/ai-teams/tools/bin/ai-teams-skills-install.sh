#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ai-teams-lib.sh"
ai_teams_require_root
ai_teams_ensure_runtime_dirs

name=""
agent=""
scope="agent"
source_ref=""
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
  tools/bin/ai-teams-skills-install.sh --name 名称 --scope shared --source 本地Skill目录 [--plan|--apply]
  tools/bin/ai-teams-skills-install.sh --name 名称 --agent Agent名称 --source 本地Skill目录 [--plan|--apply]

说明：
- 默认只生成安装计划。
- --apply 只支持本地 Skill 目录复制，不自动拉取未知 GitHub 代码。
- --apply 会把 Skill 复制到 AI-Teams 工程内的 skills/shared/ 或 skills/agents/<agent>/，便于后续发布。
EOF
      exit 0
      ;;
    *)
      echo "未知参数：$1" >&2
      exit 2
      ;;
  esac
done

if [[ -z "$name" || -z "$source_ref" ]]; then
  echo "必须提供 --name 和 --source。" >&2
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

if ai_teams_is_sensitive_path "$source_ref"; then
  echo "Skill 来源路径包含敏感命名，拒绝读取。" >&2
  exit 1
fi

source_kind="local"
if [[ "$source_ref" == http://* || "$source_ref" == https://* || "$source_ref" == git@* ]]; then
  source_kind="remote-url"
fi

if [[ "$source_kind" == "local" ]]; then
  if [[ ! -d "$source_ref" || ! -f "$source_ref/SKILL.md" ]]; then
    echo "本地 Skill 目录必须存在并包含 SKILL.md。" >&2
    exit 1
  fi
  source_ref="$(cd "$source_ref" && pwd)"
fi

stamp="$(ai_teams_stamp)"
report="logs/command/skills-install-${stamp}.md"
target_dir="skills/shared/$name"
[[ "$scope" == "agent" ]] && target_dir="skills/agents/$agent/$name"

cat > "$report" <<EOF
# Skills 安装报告

- 时间：$(ai_teams_now)
- 名称：$name
- 范围：$scope
- Agent：${agent:-无}
- 来源：$source_ref
- 来源类型：$source_kind
- 目标目录：$target_dir
- 模式：$mode

## 安全判断

- 不读取敏感文件内容。
- 不执行 Skill 中的脚本。
- 远程 URL 默认只生成计划，不自动拉取未知第三方代码。
- 目标写入工程内 Skills 目录，避免发布时依赖本机绝对路径。
EOF

if [[ "$mode" == "apply" ]]; then
  if [[ "$source_kind" != "local" ]]; then
    echo "远程 URL 不支持直接 apply；请先人工获取到本地目录后再安装。" >&2
    exit 1
  fi
  if [[ -e "$target_dir" ]]; then
    echo "目标 Skill 已存在，拒绝覆盖：$target_dir" >&2
    exit 1
  fi
  mkdir -p "$(dirname "$target_dir")"
  rsync -a \
    --exclude ".git/" \
    --exclude ".env" \
    --exclude ".env.*" \
    --exclude "*.pem" \
    --exclude "*.key" \
    --exclude "node_modules/" \
    --exclude ".cache/" \
    --exclude "tmp/" \
    "$source_ref/" "$target_dir/"

  python3 - "$name" "$scope" "$agent" "$source_ref" "$target_dir" <<'PY'
import json
import sys
from datetime import datetime
from pathlib import Path

name, scope, agent, source, target = sys.argv[1:6]
path = Path("skills/registry.json")
data = json.loads(path.read_text(encoding="utf-8"))
source_name = Path(source).name
entry = {
    "slug": name,
    "name": name,
    "scope": scope,
    "agent": agent or None,
    "source": source_name,
    "source_kind": "local-copy",
    "path": target,
    "skill_file": str(Path(target) / "SKILL.md"),
    "status": "installed-local-copy",
    "installed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
}
data["canonical_root"] = "skills/agents"
data["install_mode"] = "vendored-local-copy"
if scope == "shared":
    items = data.setdefault("shared", [])
else:
    items = data.setdefault("agents", {}).setdefault(agent, [])
items[:] = [item for item in items if item.get("name") != name]
items.append(entry)
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY

  tmp="$(mktemp)"
  cat > "$tmp" <<EOF
## Skills 安装记录

- 时间：$(ai_teams_now)
- 名称：$name
- 范围：$scope
- Agent：${agent:-无}
- 目标目录：$target_dir
EOF
  ai_teams_update_section "index/AGENTS.md" "skills-install-${scope}-${agent:-shared}-${name}" "$tmp"
  rm -f "$tmp"
  ai_teams_write_status_event "Skill 已安装：$name"
fi

cat "$report"
