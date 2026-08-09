#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ai-teams-lib.sh"
ai_teams_require_root

target=""
target_provided=0
mode="write"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      target="${2:-.}"
      target_provided=1
      shift 2
      ;;
    --plan)
      mode="plan"
      shift
      ;;
    --write)
      mode="write"
      shift
      ;;
    -h|--help)
      cat <<'EOF'
用法：tools/bin/ai-teams-init-project.sh [--target 路径] [--plan|--write]

说明：
- 只读取安全的项目识别文件，不读取 .env、密钥、证书、token、credentials 等敏感内容。
- --target 必须显式传入；低侵入安装时应在目标项目根目录执行，并使用 --target "$PWD"。
- --plan 只生成初始化报告。
- --write 会合并更新 project/、rule/、index/ 和 memory/ 中的 AI-Teams 自动扫描区块。
- 自动扫描只是辅助；初始化后必须由 Lead 调度 Doc、PD、Plan-PM、Dev、QA、Security-Reviewer、Memory 按职责补充项目理解。
- 如果目标项目已有 CLAUDE.md、AGENTS.md、.qcoder、.qwen、.cursorrules、.cursor/rules、Copilot/Gemini/Windsurf 等规则入口，会吸收到 project/imported-rules.md。
EOF
      exit 0
      ;;
    *)
      echo "未知参数：$1" >&2
      exit 2
      ;;
  esac
done

if [[ "$target_provided" -ne 1 || -z "$target" ]]; then
  echo "必须显式传入目标项目路径：--target <目标项目路径>" >&2
  echo '低侵入安装时请在目标项目根目录执行：bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write' >&2
  exit 2
fi

if [[ ! -d "$target" ]]; then
  echo "目标路径不存在：$target" >&2
  exit 1
fi

target="$(cd "$target" && pwd)"
stamp="$(ai_teams_stamp)"
day="$(ai_teams_day)"
plan_report_tmp=""
if [[ "$mode" == "write" ]]; then
  ai_teams_ensure_runtime_dirs
  mkdir -p project/requirements project/plans project/rules rule/catalog rule/project/frontend rule/project/backend
  report="logs/command/init-${stamp}.md"
else
  plan_report_tmp="$(mktemp)"
  report="$plan_report_tmp"
fi

has_file() {
  [[ -f "$target/$1" ]]
}

detect_package_manager() {
  if has_file "pnpm-lock.yaml"; then echo "pnpm"; return; fi
  if has_file "yarn.lock"; then echo "yarn"; return; fi
  if has_file "bun.lock" || has_file "bun.lockb"; then echo "bun"; return; fi
  if has_file "package-lock.json"; then echo "npm"; return; fi
  if has_file "package.json" && command -v node >/dev/null 2>&1; then
    local declared_manager
    declared_manager="$(
      node - "$target/package.json" <<'NODE'
const fs = require("fs");
try {
  const pkg = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const value = typeof pkg.packageManager === "string" ? pkg.packageManager : "";
  process.stdout.write(value.split("@")[0]);
} catch (_) {}
NODE
    )"
    if [[ -n "$declared_manager" ]]; then
      echo "$declared_manager"
      return
    fi
  fi
  if has_file "package.json"; then echo "npm"; return; fi
  if has_file "poetry.lock"; then echo "poetry"; return; fi
  if has_file "Pipfile"; then echo "pipenv"; return; fi
  if has_file "requirements.txt"; then echo "pip"; return; fi
  if has_file "go.mod"; then echo "go"; return; fi
  if has_file "pom.xml"; then echo "maven"; return; fi
  if has_file "build.gradle" || has_file "settings.gradle"; then echo "gradle"; return; fi
  echo "unknown"
}

detect_language() {
  local files
  files="$(ai_teams_safe_find "$target" | head -n 5000)"
  if printf "%s\n" "$files" | rg -q '\.(ts|tsx)$'; then echo "TypeScript"; return; fi
  if printf "%s\n" "$files" | rg -q '\.(js|jsx|mjs|cjs)$'; then echo "JavaScript"; return; fi
  if printf "%s\n" "$files" | rg -q '\.py$'; then echo "Python"; return; fi
  if printf "%s\n" "$files" | rg -q '\.go$'; then echo "Go"; return; fi
  if printf "%s\n" "$files" | rg -q '\.(java|kt)$'; then echo "Java / Kotlin"; return; fi
  if printf "%s\n" "$files" | rg -q '\.(rs)$'; then echo "Rust"; return; fi
  echo "unknown"
}

safe_grep_package() {
  local pattern
  pattern="$1"
  [[ -f "$target/package.json" ]] || return 1
  grep -qi "$pattern" "$target/package.json"
}

detect_framework() {
  if has_file "next.config.js" || has_file "next.config.mjs" || has_file "next.config.ts" || safe_grep_package '"next"'; then echo "Next.js"; return; fi
  if has_file "vite.config.js" || has_file "vite.config.ts" || safe_grep_package '"vite"'; then echo "Vite"; return; fi
  if has_file "nuxt.config.js" || has_file "nuxt.config.ts" || safe_grep_package '"nuxt"'; then echo "Nuxt"; return; fi
  if has_file "angular.json"; then echo "Angular"; return; fi
  if safe_grep_package '"react"'; then echo "React"; return; fi
  if safe_grep_package '"vue"'; then echo "Vue"; return; fi
  if has_file "pyproject.toml" && grep -qi "fastapi" "$target/pyproject.toml"; then echo "FastAPI"; return; fi
  if has_file "requirements.txt" && grep -qi "fastapi" "$target/requirements.txt"; then echo "FastAPI"; return; fi
  if has_file "go.mod"; then echo "Go module"; return; fi
  echo "unknown"
}

detect_commands() {
  local package_manager
  package_manager="$(detect_package_manager)"
  if [[ -f "$target/package.json" ]] && command -v node >/dev/null 2>&1; then
    node - "$target/package.json" "$package_manager" <<'NODE'
const fs = require("fs");
const file = process.argv[2];
const pm = process.argv[3] || "npm";
try {
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  const scripts = pkg.scripts || {};
  const keys = ["dev", "build", "test", "lint", "typecheck", "type-check", "check"];
  for (const key of keys) {
    if (scripts[key]) console.log("- " + key + ": " + pm + " run " + key);
  }
} catch (_) {}
NODE
  fi
  if has_file "pyproject.toml"; then
    echo "- test: pytest（推断，需确认）"
  elif has_file "requirements.txt"; then
    echo "- test: pytest（推断，需确认）"
  fi
  if has_file "go.mod"; then
    echo "- test: go test ./..."
    echo "- build: go build ./..."
  fi
  if has_file "pom.xml"; then
    echo "- test: mvn test"
    echo "- build: mvn package"
  fi
  if has_file "build.gradle" || has_file "settings.gradle"; then
    echo "- test: ./gradlew test"
    echo "- build: ./gradlew build"
  fi
}

detect_entries() {
  local candidates=(
    "src/main.ts" "src/main.tsx" "src/index.ts" "src/index.tsx" "src/app.ts"
    "app/page.tsx" "pages/index.tsx" "main.py" "app.py" "cmd" "src/main/java"
  )
  local found=0 item
  for item in "${candidates[@]}"; do
    if [[ -e "$target/$item" ]]; then
      echo "- $item"
      found=1
    fi
  done
  [[ "$found" -eq 1 ]] || echo "- 未自动识别"
}

detect_project_directories() {
  (
    cd "$target"
    find . -maxdepth 3 \
      -path "./.git" -prune -o \
      -path "./.claude/ai-teams" -prune -o \
      -path "./.claude/agents" -prune -o \
      -path "./node_modules" -prune -o \
      -path "./vendor" -prune -o \
      -path "./dist" -prune -o \
      -path "./build" -prune -o \
      -path "./target" -prune -o \
      -path "./.next" -prune -o \
      -path "./.nuxt" -prune -o \
      -path "./.venv" -prune -o \
      -path "./venv" -prune -o \
      -type d -print | sort | head -n 100
  ) | sed -e 's#^\./##' -e '/^$/d' -e 's#^#- #'
}

detect_ui_style_entries() {
  local found=0
  if [[ -f "$target/package.json" ]] && command -v node >/dev/null 2>&1; then
    node - "$target/package.json" <<'NODE'
const fs = require("fs");
const file = process.argv[2];
const names = [
  "react", "vue", "@angular/core", "next", "nuxt", "vite", "uni-app",
  "tailwindcss", "unocss", "sass", "less", "styled-components", "@emotion/react",
  "antd", "element-plus", "element-ui", "naive-ui", "@arco-design/web-vue",
  "@mui/material", "vuetify", "quasar", "@tarojs/taro"
];
try {
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const matched = names.filter((name) => Object.prototype.hasOwnProperty.call(all, name));
  if (matched.length) console.log("- UI/样式依赖：" + matched.join(", "));
} catch (_) {}
NODE
  fi

  local ui_paths
  ui_paths="$(
    cd "$target"
    find . -maxdepth 5 \
      -path "./.git" -prune -o \
      -path "./.claude/ai-teams" -prune -o \
      -path "./.claude/agents" -prune -o \
      -path "./node_modules" -prune -o \
      -path "./vendor" -prune -o \
      -path "./dist" -prune -o \
      -path "./build" -prune -o \
      -type f \( \
        -iname "*.css" -o -iname "*.scss" -o -iname "*.sass" -o -iname "*.less" -o \
        -iname "tailwind.config.*" -o -iname "uno.config.*" -o -iname "theme.*" -o \
        -iname "tokens.*" -o -iname "variables.*" -o -iname "global.*" -o -iname "app.*" \
      \) -print | sort | head -n 60
  )"
  if [[ -n "$ui_paths" ]]; then
    found=1
    printf "%s\n" "$ui_paths" | sed -e 's#^\./##' -e 's#^#- 样式入口：#'
  fi

  local dir
  for dir in \
    "src/components" "src/layouts" "src/pages" "src/views" "src/router" \
    "src/styles" "src/assets/styles" "src/theme" "app" "pages" "components" \
    "layouts" "styles" "theme" "uni_modules"
  do
    if [[ -d "$target/$dir" ]]; then
      echo "- UI 结构目录：$dir"
      found=1
    fi
  done

  if [[ "$found" -eq 0 ]] && ! safe_grep_package '"react"\|"vue"\|"@angular/core"\|"uni-app"'; then
    echo "- 未识别到前端 UI 入口；如项目含前端，请由对应前端 Agent 人工复核。"
  else
    echo "- 人工复核项：设计令牌、颜色、字体、间距、栅格、响应式断点、页面布局、表单、按钮、表格、卡片、弹窗、加载态、空态和错误态。"
  fi
}

detect_api_contract_entries() {
  local found=0
  local api_paths
  api_paths="$(
    cd "$target"
    find . -maxdepth 7 \
      -path "./.git" -prune -o \
      -path "./.claude/ai-teams" -prune -o \
      -path "./.claude/agents" -prune -o \
      -path "./node_modules" -prune -o \
      -path "./vendor" -prune -o \
      -path "./dist" -prune -o \
      -path "./build" -prune -o \
      -path "./target" -prune -o \
      -type f \( \
        -iname "openapi*.yaml" -o -iname "openapi*.yml" -o -iname "openapi*.json" -o \
        -iname "swagger*.yaml" -o -iname "swagger*.yml" -o -iname "swagger*.json" -o \
        -iname "*.proto" -o -iname "*controller*.java" -o -iname "*controller*.kt" -o \
        -iname "*routes*.py" -o -iname "*router*.py" -o -iname "*schema*.py" -o \
        -iname "*route*.ts" -o -iname "*route*.js" -o -iname "*route*.tsx" -o \
        -iname "*controller*.ts" -o -iname "*controller*.js" -o \
        -iname "*schema*.ts" -o -iname "*schema*.js" -o \
        -iname "*dto*.ts" -o -iname "*dto*.js" -o \
        -iname "*model*.ts" -o -iname "*model*.js" -o \
        -iname "*handler*.go" -o -iname "*controller*.go" -o -iname "*dto*.go" -o \
        -iname "*controller*.cs" -o -iname "*request*.cs" -o -iname "*response*.cs" -o \
        -iname "*dto*.java" -o -iname "*dto*.kt" -o -iname "*request*.java" -o \
        -iname "*response*.java" -o -iname "api.ts" -o -iname "api.js" -o \
        -iname "request.ts" -o -iname "request.js" -o -iname "schema.prisma" \
      \) -print | sort | head -n 100
  )"
  if [[ -n "$api_paths" ]]; then
    found=1
    printf "%s\n" "$api_paths" | sed -e 's#^\./##' -e 's#^#- 契约或接口入口：#'
  fi

  local dir
  for dir in \
    "src/api" "src/apis" "src/services" "src/request" "src/requests" "src/types" \
    "src/models" "src/schemas" "app/api" "app/routes" "api" "routes" "controllers" \
    "services" "schemas" "dto" "models" "internal" "cmd" "pkg" "src/main/java" \
    "src/main/kotlin" "migrations" "prisma" \
    "server/api" "server/routes" "server/controllers" "server/services" \
    "server/schemas" "server/dto" "server/models" \
    "backend/api" "backend/routes" "backend/controllers" "backend/services" \
    "backend/schemas" "backend/dto" "backend/models"
  do
    if [[ -d "$target/$dir" ]]; then
      echo "- 接口相关目录：$dir"
      found=1
    fi
  done

  if [[ "$found" -eq 0 ]]; then
    echo "- 未自动识别接口契约入口；后端或前后端对接任务开始前必须由 Dev 与 QA 人工确认。"
  else
    echo "- 对接复核项：路径、方法、鉴权、请求字段、响应字段、必填/可空、默认值、枚举、分页、错误结构和兼容策略。"
  fi
}

detect_docs() {
  (
    cd "$target"
    find . -maxdepth 3 \
      -path "./.git" -prune -o \
      -path "./.claude/ai-teams" -prune -o \
      -path "./.claude/agents" -prune -o \
      -path "./.claude/CLAUDE.md" -prune -o \
      -path "./.claude/settings.json" -prune -o \
      -path "./.claude/settings.local.json" -prune -o \
      -path "./.claude/settings.local.example.json" -prune -o \
      -path "./.claude/manifest.json" -prune -o \
      -path "./node_modules" -prune -o \
      -type f \( -iname "README*" -o -path "./docs/*" -o -iname "*.md" \) \
      -print | sort | head -n 30
  ) | while read -r file; do
    if ! ai_teams_is_sensitive_path "$file"; then
      echo "- ${file#./}"
    fi
  done
}

detect_rule_docs() {
  (
    cd "$target"
    for file in \
      "CLAUDE.md" \
      "AGENTS.md" \
      "GEMINI.md" \
      "QWEN.md" \
      "qwen.md" \
      ".qcoder" \
      ".qwen" \
      ".cursorrules" \
      ".windsurfrules" \
      ".github/copilot-instructions.md"
    do
      [[ -f "$file" ]] && printf "%s\n" "$file"
    done
    for dir in \
      ".qcoder" \
      ".qwen" \
      ".qoder" \
      ".cursor/rules" \
      ".windsurf/rules" \
      ".trae/rules" \
      ".github/instructions"
    do
      [[ -d "$dir" ]] || continue
      find "$dir" -maxdepth 4 -type f \( \
        -iname "*.md" -o \
        -iname "*.mdc" -o \
        -iname "*.txt" -o \
        -iname "*.json" \
      \) -print
    done
  ) | sort -u | while read -r file; do
    if ! ai_teams_is_sensitive_path "$file"; then
      echo "- $file"
    fi
  done
}

detect_stack_markers() {
  local found=0 file
  for file in \
    "package.json" \
    "tsconfig.json" \
    "vite.config.ts" \
    "vite.config.js" \
    "next.config.ts" \
    "next.config.js" \
    "angular.json" \
    "vue.config.js" \
    "pyproject.toml" \
    "requirements.txt" \
    "go.mod" \
    "pom.xml" \
    "build.gradle" \
    "settings.gradle" \
    "Dockerfile" \
    "docker-compose.yml" \
    "docker-compose.yaml" \
    "k8s" \
    "helm"
  do
    if [[ -e "$target/$file" ]]; then
      echo "- $file"
      found=1
    fi
  done
  [[ "$found" -eq 1 ]] || echo "- 未自动识别"
}

detect_dependency_entries() {
  local found=0
  if [[ -f "$target/package.json" ]] && command -v node >/dev/null 2>&1; then
    node - "$target/package.json" <<'NODE'
const fs = require("fs");
const file = process.argv[2];
try {
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  const deps = Object.keys(pkg.dependencies || {}).slice(0, 40);
  const devDeps = Object.keys(pkg.devDependencies || {}).slice(0, 40);
  console.log("- package.json");
  if (deps.length) console.log("  - dependencies: " + deps.join(", "));
  if (devDeps.length) console.log("  - devDependencies: " + devDeps.join(", "));
} catch (_) {
  console.log("- package.json（解析失败，需人工确认）");
}
NODE
    found=1
  fi
  for file in "pyproject.toml" "requirements.txt" "go.mod" "pom.xml" "build.gradle" "settings.gradle" "Dockerfile" "docker-compose.yml" "docker-compose.yaml"; do
    if [[ -f "$target/$file" ]]; then
      echo "- $file"
      found=1
    fi
  done
  [[ "$found" -eq 1 ]] || echo "- 未自动识别"
}

detect_verification_entries() {
  echo "$commands"
  if ! printf "%s\n" "$commands" | grep -Eqi "test|pytest|go test|mvn test|gradlew test"; then
    echo "- test: 未自动识别，需人工确认"
  fi
  if ! printf "%s\n" "$commands" | grep -Eqi "lint"; then
    echo "- lint: 未自动识别，需人工确认"
  fi
  if ! printf "%s\n" "$commands" | grep -Eqi "typecheck|type-check|check"; then
    echo "- typecheck: 未自动识别，需人工确认"
  fi
}

detect_sensitive_presence() {
  ai_teams_safe_find "$target" | while read -r file; do
    if ai_teams_is_sensitive_path "$file"; then
      rel="${file#"$target/"}"
      echo "- ${rel}（敏感命名，仅记录存在，未读取内容）"
    fi
  done | head -n 20
}

detect_risk_entries() {
  local sensitive current_codegraph_index current_commands current_rule_doc_count
  sensitive="$(detect_sensitive_presence || true)"
  current_codegraph_index="${codegraph_index:-missing}"
  current_commands="${commands:-- 未自动识别}"
  current_rule_doc_count="${rule_doc_count:-0}"

  if [[ "$current_codegraph_index" != "present" ]]; then
    echo "- CodeGraph：未发现目标项目 .codegraph 索引，大范围代码影响分析前需先检查 CodeGraph。"
  fi
  if [[ "$current_commands" == "- 未自动识别" ]]; then
    echo "- 验证命令：未自动识别测试、构建或 lint 命令，Dev / QA 需要人工确认。"
  fi
  if [[ "$current_rule_doc_count" -eq 0 ]]; then
    echo "- 既有规则：未发现目标项目 AI/编码规则入口，初始化后需由 Lead 结合项目补充规则。"
  fi
  if [[ -n "$sensitive" ]]; then
    echo "- 敏感文件：检测到敏感命名文件存在，初始化未读取内容；后续任务必须遵守 security/sensitive-files.md。"
    printf "%s\n" "$sensitive"
  fi
}

write_imported_rules_content() {
  local rule_list file full_path size limit
  rule_list="$1"
  limit=20000
  cat <<'EOF'
## 项目既有规则吸收

以下内容来自目标项目中已经存在的 AI/编码规则入口。AI-Teams 初始化只吸收非敏感命名文件，供 Lead、Dev、QA 和 Security-Reviewer 理解项目原有开发规范。

EOF
  if [[ -z "$rule_list" || "$rule_list" == "- 未自动识别" ]]; then
    echo "- 未自动识别"
    return
  fi
  printf "%s\n" "$rule_list" | sed 's/^- //' | while read -r file; do
    [[ -n "$file" ]] || continue
    full_path="$target/$file"
    [[ -f "$full_path" ]] || continue
    if ai_teams_is_sensitive_path "$full_path"; then
      continue
    fi
    size="$(wc -c < "$full_path" | tr -d ' ')"
    printf "\n### %s\n\n" "$file"
    printf -- "- 来源：%s\n" "$file"
    printf -- "- 字节数：%s\n" "$size"
    if [[ "$size" -gt "$limit" ]]; then
      printf -- "- 读取策略：文件较大，仅吸收前 %s 字节。\n\n" "$limit"
      printf '````md\n'
      head -c "$limit" "$full_path" || true
      printf '\n````\n'
    else
      printf -- "- 读取策略：完整吸收。\n\n"
      printf '````md\n'
      cat "$full_path"
      printf '\n````\n'
    fi
  done
}

git_assist="未发现 Git 仓库，已跳过 Git 辅助扫描"
git_branch=""
git_head=""
git_changed_count=""
if command -v git >/dev/null 2>&1 && git -C "$target" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git_branch="$(git -C "$target" branch --show-current 2>/dev/null || true)"
  git_head="$(git -C "$target" rev-parse --short HEAD 2>/dev/null || true)"
  git_changed_count="$(git -C "$target" status --short 2>/dev/null | wc -l | tr -d ' ')"
  [[ -n "$git_branch" ]] || git_branch="detached"
  [[ -n "$git_head" ]] || git_head="unknown"
  git_assist="分支=$git_branch，HEAD=$git_head，工作区变更=$git_changed_count"
fi

language="$(detect_language)"
framework="$(detect_framework)"
package_manager="$(detect_package_manager)"
commands="$(detect_commands || true)"
[[ -n "$commands" ]] || commands="- 未自动识别"
entries="$(detect_entries)"
project_directories="$(detect_project_directories)"
[[ -n "$project_directories" ]] || project_directories="- 未自动识别"
ui_style_entries="$(detect_ui_style_entries || true)"
[[ -n "$ui_style_entries" ]] || ui_style_entries="- 未自动识别"
api_contract_entries="$(detect_api_contract_entries || true)"
[[ -n "$api_contract_entries" ]] || api_contract_entries="- 未自动识别"
docs="$(detect_docs)"
[[ -n "$docs" ]] || docs="- 未自动识别"
rule_docs="$(detect_rule_docs)"
[[ -n "$rule_docs" ]] || rule_docs="- 未自动识别"
rule_doc_count="$(printf "%s\n" "$rule_docs" | awk '/^- /{c++} END{print c+0}')"
codegraph_index="missing"
[[ -d "$target/.codegraph" ]] && codegraph_index="present"
codegraph_command="not-found"
command -v codegraph >/dev/null 2>&1 && codegraph_command="$(command -v codegraph)"
stack_markers="$(detect_stack_markers)"
dependencies="$(detect_dependency_entries)"
verification_entries="$(detect_verification_entries)"
risks="$(detect_risk_entries)"
[[ -n "$risks" ]] || risks="- 未自动识别"

cat > "$report" <<EOF
# 项目初始化报告

- 时间：$(ai_teams_now)
- 目标项目：$target
- 执行模式：$mode
- Git 辅助扫描：$git_assist

## 项目优先原则

- 初始化以目标项目目录、配置、源码入口、运行命令、文档、UI 结构和接口契约为第一依据。
- 低侵入安装时排除 \.claude/ai-teams/\、\.claude/agents/\ 和 Claude Code settings/manifest，避免把 Harness 本体误写成项目画像。
- Git 仅提供当前分支、HEAD 和工作区变更数量，不读取完整提交历史、提交正文、历史代码或大范围 diff。
- 未使用 Git 的项目仍可完成全部初始化流程。

## 自动识别结果

- 主要语言：$language
- 框架：$framework
- 包管理器：$package_manager
- CodeGraph 索引：$codegraph_index
- CodeGraph 命令：$codegraph_command
- MCP registry：mcp/registry.json
- Skills registry：skills/registry.json
- 项目知识图谱：project/graph.md

## 常用命令

$commands

## 技术栈线索

$stack_markers

## 依赖线索

$dependencies

## 验证方式

$verification_entries

## 项目入口

$entries

## 项目目录结构

$project_directories

## 前端 UI 与布局线索

$ui_style_entries

## 后端与接口契约线索

$api_contract_entries

## 文档入口

$docs

## 已有 AI/编码规则入口

$rule_docs

## 风险线索

$risks

## Agent 复核要求

- Doc：复核并补齐 project/ 项目画像、上下文、架构、命令、验证、风险、规则索引和项目图谱。
- PD：复核需求入口、业务目标、用户角色和验收口径。
- Plan-PM：复核执行计划入口、依赖、任务阶段和锁范围。
- Dev-Frontend-Web：如项目包含 Web 前端，复核框架、路由、状态管理、设计令牌、颜色、字体、间距、布局、组件规范、构建和测试入口。
- Dev-Frontend-Miniapp：如项目包含小程序或 uni-app，复核平台差异、分包、登录、支付、页面布局、组件风格和发布限制。
- Dev-Backend-Systems：如项目包含 C/C++/Java 或系统后端，复核目录、Controller、DTO、Schema、构建、依赖、并发、资源释放、安全和测试入口。
- Dev-Backend-Service：如项目包含 Python/Go/Node.js/API 或云原生服务，复核目录、路由、Schema、API 契约、配置、数据库迁移、容器和测试入口。
- QA：复核验证命令、验收方式、接口字段契约、加载态、空态、错误态和边界值缺口。
- Security-Reviewer：复核导入规则、敏感边界、删除风险和权限风险。
- Memory：判断初始化材料中是否有长期恢复所需的非敏感事实。

## 安全说明

- 敏感文件只检测存在，不读取内容。
- 未修改目标项目业务代码。
- 自动写入仅限 AI-Teams 管理文件。
EOF

if [[ "$mode" == "write" ]]; then
  if [[ ! -f "project/index.md" ]]; then
    cat > "project/index.md" <<'EOF'
---
id: "project-index"
title: "项目管理索引"
type: "project-index"
scope: "project"
owner: "doc"
status: active
---
# 项目管理索引

本文件由项目初始化流程创建。后续任务执行中，Doc 负责维护 `project/`，Lead 按 security/project-policy.md 检查是否需要更新目标项目上下文、需求、计划、命令、架构、验证、风险、规则和项目图谱。

所有 Agent 执行项目类任务前和关键阶段切换前，都必须频繁读取本文件、project/PROJECT.md、project/context.md、project/change-log.md、project/project-profile.md、project/rules/index.md、project/imported-rules.md、project/commands.md、project/verification.md、project/risks.md 和 project/graph.md。
EOF
  fi
  if [[ ! -f "project/change-log.md" ]]; then
    cat > "project/change-log.md" <<'EOF'
---
id: "project-change-log"
title: "目标项目代码提交变化"
type: "project-state"
scope: "project"
owner: "doc"
status: active
---
# 目标项目代码提交变化

每次需求进入时由 `UserPromptSubmit` 阶段的 `git-activity-watch` 增量刷新。只记录有限提交元数据、变更文件名和影响分类，不读取 diff、提交正文、历史代码或敏感文件内容。

<!-- AI-TEAMS:git-project-sync:BEGIN -->
## 最近一次需求前 Git 同步

- 状态：等待首次需求前同步。
<!-- AI-TEAMS:git-project-sync:END -->
EOF
  fi
  if [[ ! -f "project/context.md" ]]; then
    cat > "project/context.md" <<'EOF'
---
id: "project-context"
title: "目标项目运行期上下文"
type: "project-state"
scope: "project"
owner: "doc"
status: active
---
# 目标项目运行期上下文

本文件记录当前 AI-Teams 正在管理的目标项目路径、初始化状态和运行期上下文。Doc 负责维护，Lead 负责确认路径和关闭检查。
EOF
  fi
  if [[ ! -f "project/ui-style.md" ]]; then
    cat > "project/ui-style.md" <<'EOF'
---
id: "project-ui-style"
title: "目标项目前端 UI 画像"
type: "project-doc"
scope: "project"
owner: "doc"
status: active
---
# 目标项目前端 UI 画像

本文件记录目标项目现有 UI 依赖、样式入口、布局结构、设计令牌和需要保持一致的交互状态。自动扫描只提供线索，最终事实由前端 Agent 复核，Doc 合并维护。

## 必须维护的内容

- 设计系统、组件库和图标库。
- 颜色、字体、间距、圆角、阴影、栅格和响应式断点来源。
- 页面布局、导航、表单、按钮、表格、卡片、弹窗和反馈组件模式。
- 加载态、空态、错误态、禁用态、权限态和移动端适配方式。
- 与接口字段直接相关的展示、校验、默认值和回退行为。

未验证内容必须标记为“待确认”，不得根据框架名称猜测视觉规范。

## UI 线索登记

| 类型 | 路径/来源 | 已确认内容 | 待确认内容 |
|---|---|---|---|
| 设计令牌 | 待初始化 | 待确认 | 颜色、字体、间距、圆角、阴影 |
| 组件库 | 待初始化 | 待确认 | 表单、按钮、表格、卡片、弹窗 |
| 页面结构 | 待初始化 | 待确认 | 布局、导航、响应式、权限态 |
| 交互状态 | 待初始化 | 待确认 | 加载态、空态、错误态、禁用态 |

## 页面小细节清单

前端 Agent、QA 和 Doc 复核页面时必须检查：

1. 页面首屏是否有明确加载态，慢接口时不出现闪烁、错位或空白误判。
2. 空数据是否有空态文案、操作入口和权限解释。
3. 错误态是否区分网络错误、权限错误、业务错误和服务端异常。
4. 表单是否有必填提示、格式提示、服务端校验错误回填和重复提交保护。
5. 表格、列表、分页、筛选、排序是否与接口契约一致。
6. 超长文本、空字段、未知枚举、金额、时间、ID 和图片失败是否有降级。
7. 移动端、窄屏、弹窗遮挡、滚动容器和固定按钮是否不重叠。
8. 权限态、禁用态和不可操作原因是否可理解，不只隐藏按钮。

## 接口字段相关 UI 规则

- 页面字段必须能追溯到 project/api-contracts 或 shared/contracts/index。
- UI 文案、展示格式、默认值和校验规则不得与接口契约冲突。
- 前端需要的字段在契约中不存在时，必须回流给 PD、Plan-PM、后端 Dev 和 QA，不得用临时假数据绕过。
- 后端返回字段比页面多时，前端不得把未声明字段当成稳定依赖。
EOF
  fi
  if [[ ! -f "project/api-contracts.md" ]]; then
    cat > "project/api-contracts.md" <<'EOF'
---
id: "project-api-contracts"
title: "目标项目接口契约索引"
type: "project-doc"
scope: "project"
owner: "doc"
status: active
---
# 目标项目接口契约索引

本文件记录目标项目中已确认的接口契约来源、前后端调用入口、字段模型和待确认缺口。自动扫描只记录路径，不推断或虚构字段。

## 契约来源优先级

1. 已生效的 OpenAPI、Swagger、Proto 或项目正式接口文档。
2. 后端路由、Controller、DTO、Schema、Model 与实际序列化代码。
3. 前端 API Client、类型定义和已通过测试的调用代码。
4. 用户明确确认并写入 shared/contracts/index 的契约记录。

来源冲突时不得自行选择，必须由 Lead 调度 PD、前后端 Dev 与 QA 完成确认和回流。

## 当前契约登记

| 场景/页面 | 契约文件 | 前端入口 | 后端入口 | 状态 | Owner | QA 证据 |
|---|---|---|---|---|---|---|
| 待初始化 | shared/contracts/index | 待登记 | 待登记 | 待确认 | Doc | 待验证 |

状态只允许使用：`待确认`、`draft`、`review`、`approved`、`deprecated`、`archived`。没有进入 `approved` 的契约不能作为发布放行依据。

## 字段防错清单

前后端对接、页面展示、表单提交或接口变更时，必须逐项确认：

| 检查项 | 必须确认的问题 | 不允许的做法 |
|---|---|---|
| 字段名 | 传输字段名、前端 ViewModel 字段名和后端 DTO/Schema 字段名是否有映射 | 凭记忆猜字段、临时改前端适配后端 |
| 类型 | 字符串、数字、布尔、对象、数组、时间、金额、ID 的精确类型 | 用 `any`、`object` 或隐式生成掩盖不一致 |
| 必填/可空 | 缺失、`null`、空字符串、空数组的语义是否分别定义 | 把缺失和空值当成同一种情况 |
| 默认值 | 默认值由前端、后端还是配置提供 | 两端都填默认值或两端都不管 |
| 枚举 | 当前枚举、未知值处理、新增枚举兼容策略 | 前端只写已知 happy path |
| 分页/排序/过滤 | 参数、默认排序、边界页、总数语义 | 前后端各自定义分页口径 |
| 鉴权/权限 | 登录态、角色、资源权限、越权响应 | 只验证管理员或成功路径 |
| 错误结构 | 错误码、展示消息、追踪 ID、重试动作 | 解析自然语言错误消息驱动逻辑 |

## 前后端映射矩阵

当页面字段与后端字段不完全一致时，在这里登记映射，不允许只散落在聊天记录或临时代码里。

| 页面/组件 | UI 字段 | 请求字段 | 响应字段 | 后端语义 | 前端展示/校验 | 待确认 |
|---|---|---|---|---|---|---|
| 待登记 | 待登记 | 待登记 | 待登记 | 待登记 | 待登记 | 待确认 |

## 小细节防遗漏门禁

以下任一项未检查，QA 不得把前后端对接标为完成：

1. 加载态、空态、错误态、权限态和禁用态是否有页面行为。
2. 字段缺失、`null`、空字符串、空数组、未知枚举和超长文本是否有降级。
3. 时间、金额、ID、精度、时区和排序是否符合契约。
4. 表单提交是否处理重复点击、后端校验错误、网络失败和部分成功。
5. 后端新增字段是否不会破坏旧前端；后端删除/改名/改类型是否有迁移方案。
6. 前端所需字段如果后端没有，必须回流契约，不得在前端硬编码假数据。
EOF
  fi
  if [[ ! -f "project/rules/index.md" ]]; then
    cat > "project/rules/index.md" <<'EOF'
---
id: "project-rules-index"
title: "项目规则索引"
type: "project-rule-index"
scope: "project"
owner: "doc"
status: active
---
# 项目规则索引

本文件由项目初始化流程创建，用于索引目标项目规则、验证口径和升级状态。Doc 负责维护。
EOF
  fi
  if [[ ! -f "project/requirements/index.md" ]]; then
    cat > "project/requirements/index.md" <<'EOF'
---
id: "project-requirements-index"
title: "项目需求索引"
type: "project-index"
scope: "project"
owner: "doc"
status: active
---
# 项目需求索引

本目录由 Doc 维护索引，PD 提供目标项目需求分析、业务边界、验收标准和待确认问题。
EOF
  fi
  if [[ ! -f "project/plans/index.md" ]]; then
    cat > "project/plans/index.md" <<'EOF'
---
id: "project-plans-index"
title: "项目计划索引"
type: "project-index"
scope: "project"
owner: "doc"
status: active
---
# 项目计划索引

本目录由 Doc 维护索引，Plan-PM 提供目标项目执行计划、里程碑、依赖关系和多 Agent 分工。
EOF
  fi
  if [[ ! -f "project/graph.md" ]]; then
    cat > "project/graph.md" <<'EOF'
---
id: "project-graph"
title: "项目知识图谱"
type: "knowledge-graph"
scope: "project"
owner: "doc"
status: active
---
# 项目知识图谱

本文件由项目初始化流程创建，用于记录目标项目在 AI-Teams 管理空间中的项目级知识关系。它不替代 kb/graph.md 的全局工程知识图谱。
EOF
  fi

  tmp="$(mktemp)"
  cat > "$tmp" <<EOF
## 自动扫描画像

- 更新时间：$(ai_teams_now)
- 目标项目：$target
- Git 辅助扫描：$git_assist
- 主要语言：$language
- 框架：$framework
- 包管理器：$package_manager
- CodeGraph 索引：$codegraph_index
- CodeGraph 命令：$codegraph_command
EOF
  ai_teams_update_section "project/project-profile.md" "init-profile" "$tmp"
  ai_teams_update_section "project/PROJECT.md" "init-profile" "$tmp"
  ai_teams_update_section "index/PROJECT.md" "init-profile" "$tmp"
  rm -f "$tmp"

  tmp="$(mktemp)"
  cat > "$tmp" <<EOF
## 自动初始化上下文

- 更新时间：$(ai_teams_now)
- AI-Teams harness 工程：$(pwd)
- 目标项目：$target
- 初始化状态：已初始化
- Git 辅助扫描：$git_assist
- 主要语言：$language
- 框架：$framework
- 包管理器：$package_manager
- CodeGraph 索引：$codegraph_index
- 项目管理规则：security/project-policy.md
- 前端 UI 画像：project/ui-style.md
- 接口契约索引：project/api-contracts.md

## 后续任务规则

- Lead 每次非平凡任务前读取本文件和 project/PROJECT.md。
- Doc 每次非平凡项目任务中并行维护 project/ 项目事实、项目状态、风险、规则和图谱。
- Dev / QA / PD / Plan-PM / Security-Reviewer 发现稳定项目事实时，先写入 shared/handoffs/、任务单、执行方案或验证记录，再由 Doc 合并到 project/。
- Memory 并行判断是否需要生成恢复点、记忆候选或上下文压缩材料。
- Doc 更新 project/graph.md 后检查 kb/graph.md 和 index/NAVIGATION.md。
EOF
  ai_teams_update_section "project/context.md" "init-context" "$tmp"
  rm -f "$tmp"

  tmp="$(mktemp)"
  {
    printf "## 自动识别命令\n\n"
    printf -- "- 更新时间：%s\n\n" "$(ai_teams_now)"
    printf "%s\n" "$commands"
  } > "$tmp"
  ai_teams_update_section "project/commands.md" "init-commands" "$tmp"
  rm -f "$tmp"

  tmp="$(mktemp)"
  cat > "$tmp" <<EOF
## 自动识别技术栈

- 更新时间：$(ai_teams_now)
- 主要语言：$language
- 框架：$framework
- 包管理器：$package_manager

### 识别依据

$stack_markers
EOF
  ai_teams_update_section "project/stack.md" "init-stack" "$tmp"
  rm -f "$tmp"

  tmp="$(mktemp)"
  cat > "$tmp" <<EOF
## 自动识别依赖

- 更新时间：$(ai_teams_now)

$dependencies

## 使用规则

- 本区块只记录依赖入口和可安全读取的依赖名称，不读取 .env、密钥、证书、token、credentials 等敏感内容。
- Dev / QA 执行任务前，应结合目标项目实际 lockfile 和安装命令确认依赖版本。
EOF
  ai_teams_update_section "project/dependencies.md" "init-dependencies" "$tmp"
  rm -f "$tmp"

  tmp="$(mktemp)"
  cat > "$tmp" <<EOF
## 自动识别验证方式

- 更新时间：$(ai_teams_now)

$verification_entries

## 使用规则

- Dev 完成实现后必须记录实际运行的验证命令。
- QA 验收时优先使用本区块命令；未识别项需要人工确认替代验证。
EOF
  ai_teams_update_section "project/verification.md" "init-verification" "$tmp"
  rm -f "$tmp"

  tmp="$(mktemp)"
  cat > "$tmp" <<EOF
## 自动识别风险

- 更新时间：$(ai_teams_now)

$risks
EOF
  ai_teams_update_section "project/risks.md" "init-risks" "$tmp"
  rm -f "$tmp"

  tmp="$(mktemp)"
  {
    printf "## 自动识别入口、目录与文档\n\n"
    printf "### 项目入口\n\n%s\n\n" "$entries"
    printf "### 项目目录结构\n\n%s\n\n" "$project_directories"
    printf "### 文档入口\n\n%s\n" "$docs"
  } > "$tmp"
  ai_teams_update_section "project/architecture.md" "init-entries" "$tmp"
  ai_teams_update_section "index/FILES.md" "init-files" "$tmp"
  rm -f "$tmp"

  tmp="$(mktemp)"
  cat > "$tmp" <<EOF
## 自动识别 UI 画像

- 更新时间：$(ai_teams_now)
- 说明：本区块仅记录可安全识别的路径和依赖线索，不替代前端 Agent 对实际页面、组件和视觉一致性的复核。

$ui_style_entries

## 前端 Agent 复核要求

- 记录实际颜色、字体、间距、圆角、阴影、栅格和响应式断点来源。
- 记录页面布局、导航、表单、按钮、表格、卡片、弹窗和反馈组件的既有模式。
- 对加载态、空态、错误态、禁用态和权限态逐页复核，不得只记录技术栈。
- 复核表单必填、服务端校验回填、重复提交保护、超长文本、未知枚举、图片失败和移动端遮挡。
- 页面字段必须能追溯到 project/api-contracts 或 shared/contracts/index，不得用临时假数据绕过契约缺口。
- 复核结果由 Doc 合并；未验证内容必须标记为“待确认”。
EOF
  ai_teams_update_section "project/ui-style.md" "init-ui-style" "$tmp"
  rm -f "$tmp"

  tmp="$(mktemp)"
  cat > "$tmp" <<EOF
## 自动识别接口契约入口

- 更新时间：$(ai_teams_now)
- 说明：本区块只记录契约、路由、Controller、DTO、Schema、Model、客户端请求和迁移入口，不读取敏感配置，不虚构接口字段。

$api_contract_entries

## 对接规则

- 前后端任务开始前读取 security/interface-contract-policy 和 shared/contracts/index。
- 字段、可空性、默认值、枚举、分页、鉴权和错误结构必须以代码、OpenAPI、Proto、用户确认或已批准契约为来源。
- 发现前端所需字段缺失、后端字段变化或页面状态遗漏时，先更新契约记录并回流对应 Dev，不允许各自猜测修补。
- QA 必须逐项检查字段名、类型、必填、可空、默认值、未知枚举、时间/金额/ID、错误码、加载态、空态、错误态和权限态。
- PD 只确认业务字段和验收口径；Plan-PM 只登记 Owner、契约文件、执行顺序、锁范围和 QA 节点，默认不扩写长篇流程。
EOF
  ai_teams_update_section "project/api-contracts.md" "init-api-contracts" "$tmp"
  rm -f "$tmp"

  tmp="$(mktemp)"
  write_imported_rules_content "$rule_docs" > "$tmp"
  ai_teams_update_section "project/imported-rules.md" "init-imported-rules" "$tmp"
  rm -f "$tmp"

  tmp="$(mktemp)"
  cat > "$tmp" <<EOF
## 自动项目图谱

- 更新时间：$(ai_teams_now)
- 目标项目：$target
- 主要语言：$language
- 框架：$framework
- 包管理器：$package_manager
- CodeGraph 索引：$codegraph_index

\`\`\`mermaid
graph TD
  Target["目标项目"] --> Profile["project/project-profile.md"]
  Target --> Context["project/context.md"]
  Target --> ChangeLog["project/change-log.md"]
  Target --> Stack["project/stack.md"]
  Target --> Dependencies["project/dependencies.md"]
  Target --> Requirements["project/requirements/index.md"]
  Target --> Plans["project/plans/index.md"]
  Target --> Architecture["project/architecture.md"]
  Target --> UIStyle["project/ui-style.md"]
  Target --> APIContracts["project/api-contracts.md"]
  APIContracts --> SharedContracts["shared/contracts/index.md"]
  Target --> Commands["project/commands.md"]
  Target --> Verification["project/verification.md"]
  Target --> Risks["project/risks.md"]
  Target --> ImportedRules["project/imported-rules.md"]
  Target --> ProjectRules["project/rules/index.md"]
  Target --> RuleRouter["rule/project/index.md"]
  RuleRouter --> RuleStructure["rule/project/structure.md"]
  RuleRouter --> RuleFiles["rule/project/files.md"]
  RuleRouter --> FrontendRules["rule/project/frontend/index.md"]
  RuleRouter --> BackendRules["rule/project/backend/index.md"]
  Target --> ProjectGraph["project/graph.md"]
  ProjectGraph --> KBGraph["kb/graph.md"]
  ProjectGraph --> Navigation["index/NAVIGATION.md"]
  ProjectGraph --> CodeGraph["index/CODEGRAPH.md"]
  ProjectGraph --> ProjectPolicy["security/project-policy.md"]
\`\`\`

### 常用命令

$commands

### 技术栈线索

$stack_markers

### 依赖线索

$dependencies

### 验证方式

$verification_entries

### 项目入口

$entries

### 项目目录结构

$project_directories

### 前端 UI 与布局线索

$ui_style_entries

### 后端与接口契约线索

$api_contract_entries

### 文档入口

$docs

### 已有 AI/编码规则入口

$rule_docs

### 风险线索

$risks

### Agent 复核节点

- Doc：复核 project/ 全量项目事实、规则、图谱和文档入口。
- PD：复核需求材料。
- Plan-PM：复核计划和执行阶段。
- QA：复核验证方式。
- Security-Reviewer：复核敏感边界和规则风险。
- Memory：复核长期恢复事实候选。
EOF
  ai_teams_update_section "project/graph.md" "init-project-graph" "$tmp"
  rm -f "$tmp"

  tmp="$(mktemp)"
  cat > "$tmp" <<'EOF'
## 项目知识图谱

- 项目图谱：project/graph.md
- 图谱模板：templates/project-graph/template.md
- 全局知识图谱：kb/graph.md
- 标准 Markdown 导航：index/NAVIGATION.md
EOF
  ai_teams_update_section "index/PROJECT.md" "init-project-graph-link" "$tmp"
  rm -f "$tmp"

  if command -v node >/dev/null 2>&1 && [[ -f "tools/bin/ai-teams-rule-refresh.mjs" ]]; then
    node tools/bin/ai-teams-rule-refresh.mjs --root "$PWD" --target "$target" --write
  else
    echo "提示：未找到 Node.js 或规则刷新脚本，跳过 rule/ 目录索引生成；不阻塞项目初始化。" >&2
  fi

  tmp="$(mktemp)"
  cat > "$tmp" <<EOF
## 初始化候选记忆

- 日期：$day
- 目标项目：$target
- 语言 / 框架 / 包管理器：$language / $framework / $package_manager
- CodeGraph：$codegraph_index
- 既有规则入口：$rule_doc_count
- UI 画像入口：project/ui-style.md（由前端 Agent 复核后，Memory 再判断是否形成长期恢复事实）
- 接口契约入口：project/api-contracts.md（字段事实以代码或已确认契约为准）
- 来源日志：$report
EOF
  ai_teams_update_section "memory/MEMORY.md" "init-memory" "$tmp"
  rm -f "$tmp"

  ai_teams_write_status_event "项目初始化扫描已完成：$target"
fi

cat "$report"
if [[ -n "$plan_report_tmp" ]]; then
  rm -f "$plan_report_tmp"
fi
