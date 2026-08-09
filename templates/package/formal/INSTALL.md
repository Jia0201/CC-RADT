# CC-RADT 安装与配置合并指南

本文说明如何把 CC-RADT 安装到一个全新项目或已经使用 Claude Code 的项目中。

## 1. 安装前检查

在目标项目根目录确认以下文件是否已经存在：

```text
.claude/settings.json
.claude/settings.local.json
.claude/agents/
.claude/rules/
.mcp.json
CLAUDE.md
```

如果存在，先在项目外保存一份备份。CC-RADT 不需要替换根 `CLAUDE.md`，也绝不能覆盖 `.claude/settings.local.json`。

## 2. 下载到临时目录

推荐从 GitHub 下载 ZIP 并解压到项目外。也可以执行：

```bash
git clone --depth 1 https://github.com/Jia0201/Claude-Code-Research-and-Development-Teams.git cc-radt
```

不要把 `cc-radt/` 整个目录嵌套到目标项目；需要合并的是仓库内的 `.claude/` 和 `.mcp.json` 等根文件。

## 3. 新项目安装

当目标项目没有 `.claude/settings.json` 和 `.mcp.json` 时，把下载目录内的全部内容复制到目标项目根目录即可。

复制后至少应存在：

```text
.claude/ai-teams/index/ENTRY.md
.claude/agents/lead.md
.claude/rules/ai-teams-router.md
.claude/settings.json
.claude/manifest.json
.mcp.json
```

## 4. 已有 Claude Code 配置的项目

### 4.1 可以直接复制或合并的目录

| 来源 | 目标 | 操作 |
|---|---|---|
| `.claude/ai-teams/` | `<项目>/.claude/ai-teams/` | 复制整个目录 |
| `.claude/agents/*.md` | `<项目>/.claude/agents/` | 合并；同名文件先备份 |
| `.claude/rules/*.md` | `<项目>/.claude/rules/` | 合并；同名文件先备份 |
| `.claude/manifest.json` | `<项目>/.claude/manifest.json` | 复制 |
| `.claude/settings.local.example.json` | `<项目>/.claude/settings.local.example.json` | 可复制，仅作示例 |

### 4.2 合并 `.claude/settings.json`

不要直接替换现有文件。把安装包配置中的以下内容并入项目配置：

| 字段 | 合并规则 |
|---|---|
| `agent` | 设为 `lead`，使新会话由 Lead 接收请求 |
| `minimumVersion` | 保留两个配置中要求更高的版本 |
| `autoMemoryEnabled` | 使用安装包的 `false`，由 CC-RADT 记忆体系负责长期记忆 |
| `includeGitInstructions` | 使用安装包的 `false`，Git 只作为辅助信息 |
| `ai_teams` | 整个对象加入配置；已有同名对象时逐项合并 |
| `permissions.deny` | 与项目已有 deny 规则取并集，不删除原规则 |
| `hooks` | 按事件追加 CC-RADT Hook，不删除项目已有 Hook |
| `disableAllHooks` | 必须为 `false`，否则 CC-RADT Hook 不会执行 |

合并完成后用 Node.js 验证 JSON：

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8')); console.log('settings.json OK')"
```

### 4.3 合并 `.mcp.json`

如果项目已有 `.mcp.json`，保留它的其他顶层字段，并把安装包 `mcpServers` 中的服务器逐项加入现有 `mcpServers`。同名服务器应先比较配置，不要静默覆盖。

```bash
node -e "JSON.parse(require('fs').readFileSync('.mcp.json','utf8')); console.log('.mcp.json OK')"
```

带环境变量的 MCP 不会携带密钥。未配置对应变量时，该 MCP 可以保持登记状态，但在实际调用前需要用户完成授权或环境配置。

## 5. 运行自检

macOS / Linux：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-check.sh
```

Windows PowerShell：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-check.ps1
```

自检失败时先处理缺失文件、JSON 语法或 Hook 路径问题，不要继续初始化。

## 6. 初始化项目画像

在目标项目根目录执行，不要先进入 `.claude/ai-teams/`：

macOS / Linux：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

Windows PowerShell：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write
```

`--target` 必须指向业务项目根目录。初始化结果写入 `.claude/ai-teams/project/`、项目规则、索引和记忆候选区，不修改业务代码。

## 7. 首次启动确认

1. 完全退出并重新进入目标项目的 Claude Code 会话，让 Agent、规则、settings 和 Hooks 重新加载。
2. 执行 `/agents`，确认 Lead、PD、Plan-PM、四个 Dev、QA、Memory、Doc、Role 和 Security-Reviewer 均可见。
3. 提交一个非平凡任务，确认 Lead 使用具名 Agent，而不是 `general-purpose`。
4. 查看 `.claude/ai-teams/shared/`，确认任务、状态和交接按流程写入。

## 8. 常见问题

### Agent 没有出现

- 确认定义位于项目根的 `.claude/agents/*.md`，不是只放在 `.claude/ai-teams/agents/`。
- 确认安装后已经重启 Claude Code 会话。
- 检查 Agent 文件 YAML frontmatter 是否完整。

### Hook 报路径不存在

- 必须从目标项目根目录启动 Claude Code。
- 检查 `.claude/ai-teams/hooks/scripts/` 是否完整。
- 检查 settings 中 Hook 参数是否以 `${CLAUDE_PROJECT_DIR}/.claude/ai-teams/` 开头。

### 初始化写错目录

- 不要在 `.claude/ai-teams/` 中把 `$PWD` 作为目标。
- 回到业务项目根目录，再使用 `--target "$PWD" --write`。

### MCP 无法启动

- 先运行 `bash .claude/ai-teams/tools/bin/ai-teams-mcp-list.sh` 查看配置。
- 检查 Node.js、`npx`、浏览器扩展和服务所需环境变量。
- 不要把 token 或密钥直接写入仓库配置。
