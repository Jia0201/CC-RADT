# CC-RADT 二次开发指南

本文面向维护 CC-RADT Harness 本体的开发者。使用 CC-RADT 参与业务项目研发，请阅读根 `README.md`；修改 Agent、规则、Hooks、Skills、MCP、提示词、记忆机制或构建链路时，再使用本文。

## 1. 分支与产物边界

| 分支或产物 | 用途 | 允许内容 |
|---|---|---|
| `main` | 用户可直接安装的稳定运行版 | `.claude/`、`.mcp.json`、安装文档和运行所需文件 |
| `dev` | CC-RADT 主开发工程 | 完整 Agent、规则、工具、模板、实验室、测试与打包链路 |
| GitHub Release | 带版本号的用户安装包 | 由打包脚本生成并通过自检的 ZIP 与校验值 |

不要手工把 `dev` 的目录复制到 `main`。稳定安装版必须由 `tools/bin/ai-teams-package.sh` 生成，避免把研发日志、实验内容、本地状态、敏感配置或构建脚本带给用户。

## 2. 开发环境

- Git。
- Node.js 18 或更高版本，用于 Hooks、提示词和规则工具。
- macOS / Linux：Bash、Python 3。
- Windows：PowerShell 7；执行 Bash 工具时使用 Git Bash 或 WSL。
- Claude Code，用于验证项目级 subagent、rules、settings、Hooks、Skills 和 MCP 的实际加载行为。

```bash
git clone https://github.com/Jia0201/CC-RADT.git
cd Claude-Code-Research-and-Development-Teams
git switch dev
bash tools/bin/ai-teams-check.sh
```

本工程不要求统一安装一个应用依赖包。每个工具应优先使用系统已有的 Bash、Node.js、Python 或 PowerShell，并在缺少可选依赖时给出可理解的降级结果。

## 3. 开发前读取顺序

1. `CLAUDE.md`：Claude Code 主地图和强制入口。
2. `index/ENTRY.md`：工程大脑入口。
3. `index/STATUS.md`：当前状态、已知边界和待办。
4. `playbook.md`：Lead 调度、工作流和关闭门禁。
5. `security/index.md`：动作规则与安全门禁。
6. 与当前修改相关的 Agent、规则、项目、记忆、知识库或工具索引。

非平凡修改默认由 Lead 选择最小必要 Agent 组合。开发中产生的任务、执行方案、锁、交接、状态和回流记录写入 `shared/`，不要只保存在聊天上下文。

## 4. 主目录职责

| 路径 | 主要 Owner | 二次开发重点 |
|---|---|---|
| `.claude/` | Role + Security-Reviewer | Claude Code 官方适配层，不作为工程规则正文的第二份副本 |
| `agents/` | Role | 12 个 Agent 的角色、工作流、记忆、KB、Skills、MCP 与 playbook 指针 |
| `prompts/` | Role + 对应 Agent | system、task、retry 提示词及候选、评测、激活、回滚 |
| `rule/` | Doc + Security-Reviewer | 低 token 路由，只引用规则和知识正文 |
| `project/` | Doc | 被管理业务项目的事实、架构、接口、UI、命令、状态和 ADR |
| `memory/` | Memory | 共享记忆、Agent 记忆、恢复材料和上下文压缩 |
| `kb/` | Doc | 稳定可复用知识，不保存实时动作规则 |
| `shared/` | Plan-PM + 对应 Owner | 任务、计划、锁、状态、交接、广播、监督和回流 |
| `security/` | Security-Reviewer | 敏感文件、删除、权限、所有权、锁、状态和高风险动作规则 |
| `hooks/` | Security-Reviewer | Claude Code 事件自动化与输出协议 |
| `skills/`、`mcp/` | Role + Doc + Security-Reviewer | 可移植能力、注册表、来源、许可证和安全边界 |
| `tools/` | 对应命令 Owner | 指令文档、脚本、跨平台包装和验证工具 |
| `templates/` | Doc + Role | 新增 Agent、项目、规则、Hook 等标准模板 |
| `lab/` | Lead | 未进入稳定运行版的实验功能，打包时必须排除 |

文件写入前先检查 `security/file-ownership.md` 和 `security/lock-policy.md`。跨 Owner 修改必须留下交接和复核记录。

## 5. 标准修改流程

1. 明确问题、目标、非目标、影响范围和验收标准。
2. 读取当前项目事实与相关索引，确认是否需要 ADR。
3. 在 `shared/` 创建或更新任务单和执行方案；多 Agent 修改重叠文件时先申请锁。
4. 只修改当前能力的唯一正文，其他位置使用链接或短路由，避免规则复制。
5. 更新受影响的索引、Agent 指针、知识关系图和状态文件。
6. 执行针对性测试，再运行全局自检。
7. 生成隔离安装包并在全新目录中验证，不直接修改既有安装包。
8. 提交到 `dev`；稳定发布时再由维护者生成 `main` 内容和 Release 资产。

以下长期结构变化应写 ADR：Agent 主体位置或职责变化、核心目录变化、指令组织变化、记忆层级变化、Hooks/MCP/Skills 核心机制变化，以及锁、索引、重试、提示词治理等协议变化。ADR 入口为 `project/adr/index.md`。

## 6. 常见扩展

### 6.1 新增或修改 Agent

1. 更新 `agents/<agent>/` 的主文档、`role.md`、`workflow.md`、`memory.md`、`kb.md`、`skills.md`、`mcp.md` 和 `playbook.md`。
2. 更新 Claude Code 适配定义 `.claude/agents/<agent>.md`，frontmatter 必须符合官方 subagent 规范。
3. 更新 `agents/index.md`、`index/AGENTS.md`、`kb/graph.md`、角色注册表和自检断言。
4. 检查提示词、Skills、MCP、记忆和知识库路径是否存在且使用相对工程路径。

### 6.2 新增 Hook

1. 从 `templates/hooks/` 选择模板，在 `hooks/scripts/` 编写跨目录可运行的实现。
2. 路径通过 `CLAUDE_PROJECT_DIR` 或运行时解析获得，禁止写本机绝对路径。
3. 为 Windows 提供 Node.js 或 PowerShell 兼容入口；不要依赖仅 macOS 存在的命令。
4. 更新 `hooks/index.md`、settings Hook 声明、安全规则和自检脚本。
5. Hook 输出必须符合当前 Claude Code 事件的 JSON schema；`Stop` 事件不得返回只适用于其他事件的 `hookSpecificOutput`。

### 6.3 新增指令或工具

1. 在 `tools/commands/ai/` 增加指令文档，在 `tools/bin/` 增加实现。
2. 提供输入、预览或 plan、写入边界、失败行为、输出和验收方式。
3. 更新 `tools/commands/index.md`、`index/COMMANDS.md`、`index/FILES.md` 和自检计数。
4. 高风险操作必须保留 dry-run 或 plan；禁止用间接脚本绕过删除、敏感文件或权限规则。

### 6.4 新增 Skill 或 MCP

1. Skill 需要工程内可移植副本、来源、许可证、mode 和 Agent 分配；更新 `skills/registry.json`。
2. MCP 使用可迁移命令、URL 或环境变量；禁止保存 token、密码和本机绝对路径。
3. 更新对应 Agent 的 `skills.md` / `mcp.md`、总索引、`.mcp.json` 模板和健康检查。
4. 需要浏览器扩展、账号授权或数据库的服务必须在文档中明确前置条件和降级行为。

### 6.5 修改提示词

不要直接让运行中的 Agent 自改 active 提示词。使用候选、评测、审批、激活和回滚链路：

```bash
node tools/bin/ai-teams-prompt-status.mjs --json
node tools/bin/ai-teams-prompt-evolve.mjs --agent <agent> --kind <system|task|retry> --version <版本> --from-active --write
node tools/bin/ai-teams-prompt-eval.mjs --agent <agent> --kind <system|task|retry> --version <版本>
node tools/bin/ai-teams-prompt-activate.mjs --agent <agent> --kind <system|task|retry> --version <版本>
```

具体门禁见 `security/prompt-evolution-policy.md` 和 `security/prompt-activation-policy.md`。

## 7. 验证门禁

每次提交前至少执行：

```bash
bash tools/bin/ai-teams-check.sh
bash tools/bin/ai-teams-e2e-fixtures.sh
node tools/bin/ai-teams-hook-output-test.mjs
node tools/bin/ai-teams-memory-audit.mjs --json
```

修改 Shell 脚本时补充 `bash -n <脚本路径>`。修改 JSON 时使用结构化解析器验证；修改 Hooks 时必须覆盖对应事件的输入和输出；修改初始化时必须在无 Git、前端、后端和已有 Claude 配置的隔离 fixture 中验证。

## 8. 构建并验证安装版

输出目录必须在仓库外，并且必须为空：

```bash
bash tools/bin/ai-teams-package.sh formal \
  --version 1.1.0 \
  --install-layout claude-subdir \
  --output "$HOME/CC-RADT-dist/formal" \
  --verify
```

打包完成后确认：

- 用户结构为 `.claude/ai-teams/`、`.claude/agents/`、`.claude/rules/`、`.claude/settings.json` 和根 `.mcp.json`。
- 不包含 `lab/`、开发日志、会话、缓存、本地私有配置、敏感文件、打包脚本或本机绝对路径。
- `project/`、记忆和共享状态是干净模板，不携带开发工程的实时业务内容。
- 12 个具名 Agent、Hooks、23 个运行指令、Skills、MCP 和初始化脚本通过安装版自检。
- 在全新测试项目中启动 Claude Code 后，`/agents` 能发现具名 Agent，非平凡任务由 Lead 默认调度。

## 9. 提交与评审

- 完整分支、提交、版本、正式包记录、标签、发布和回滚规则见 `security/version-control-policy.md`。
- 用户可感知变化先写入 `CHANGELOG.md` 的 `Unreleased`；正式发布时再转为明确版本。
- 一个提交只解决一个清晰问题，避免混入无关重构和生成状态。
- 提交信息说明行为变化，不只写“更新文件”。
- PR 必须包含问题、方案、影响范围、验证结果、风险和回滚方式。
- 不提交 `.env`、凭据、证书、本地数据库、缓存、运行日志、会话材料或生成安装包。
- 不在自动化中提交 Git、发布 Release 或删除用户文件。
- 结构性修改由 Doc 检查索引和关系图，由 Security-Reviewer 检查边界，由 QA 验证行为。

正式发布必须保留 `dev-vX.Y.Z` 源标签、dev 源提交、main 运行提交、`vX.Y.Z` 公开标签、`RELEASE_RECORD.md`、manifest 和 checksum 的完整映射。可用以下命令预览版本记录：

```bash
node tools/release/ai-teams-version-report.mjs --version "$(tr -d '[:space:]' < VERSION)"
```

## 10. 问题定位

报告问题时请提供：操作系统、Claude Code 与 Node.js 版本、所在分支和提交、执行命令、预期结果、实际错误、相关 Hook 事件，以及脱敏后的最小复现。不要上传 `.env`、token、credentials、证书或业务敏感代码。

常见入口：

- 工程状态：`index/STATUS.md`
- 指令索引：`tools/commands/index.md`
- 安全规则：`security/index.md`
- Agent 索引：`agents/index.md`
- Hooks 索引：`hooks/index.md`
- 项目初始化：`tools/commands/ai/init-project.md`
- 打包规则：`tools/commands/ai/package-formal.md`
