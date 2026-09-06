# CC-RADT

**Claude Code Research and Development Teams**  
**中文名：基于 Claude Code 的全流程研发团队**

[简体中文](README.md) | [English](README.en.md) | [GitHub 仓库](https://github.com/Jia0201/CC-RADT)

> **开发分支说明**：当前 `dev` 分支保存 CC-RADT 主开发工程，用于维护 Agent、规则、Hooks、Skills、MCP、提示词和安装包构建链路。普通用户请使用 [`main`](https://github.com/Jia0201/CC-RADT/tree/main) 或 [Releases](https://github.com/Jia0201/CC-RADT/releases) 中的安装版。参与二次开发前请先阅读 [`DEVELOPMENT.md`](DEVELOPMENT.md)。

CC-RADT 是一套面向 Claude Code 的多 Agent 软件研发 Harness。它把需求分析、任务规划、前后端开发、测试、安全审查、项目文档、工程记忆和角色治理组织成一个可以放进真实项目、持续更新并可追溯的研发团队。

它不是一组静态提示词，也不替代你的业务项目。CC-RADT 负责维护团队、规则、上下文与协作状态；你的项目代码仍保留在原来的目录中。

> 当前版本：`v1.1.0`。Claude Code 是当前优先运行环境；Codex 和 OpenCode 适配保留在后续路线中。

## v1.1.0 更新

新增本机只读研发观察台，支持多会话筛选、任务与日志阅读和文件版本留存。项目初始化改为用户主动操作；Lead system prompt 升至 `1.0.1`，修复固定首轮提示、心跳误接管、敏感文件误拦截和安装态自检问题。

[发布说明与 v1.0.0 对比](RELEASE_NOTES.md) · [详细使用说明](USAGE.md) · [v1.0.0 升级指南](UPGRADE.md) · [下载 v1.1.0](https://github.com/Jia0201/CC-RADT/releases/tag/v1.1.0)

升级时保留现有项目画像与记忆，并合并更新 Hook 和权限规则。完整步骤见升级指南。

## 为什么使用 CC-RADT

- **默认多 Agent**：Lead 根据任务选择具名 Agent 和工作流，不使用通用 Agent 冒充团队成员。
- **覆盖研发全流程**：PD、Plan-PM、四个开发 Agent、QA、Memory、Doc、Role 和 Security-Reviewer 分工协作。
- **项目越做越熟**：初始化和后续任务都会维护 `project/`，持续记录架构、接口、UI、命令、风险和验证方式。
- **可恢复的工程记忆**：共享记忆、Agent 独立记忆、项目上下文和稳定知识分层保存。
- **按需加载规则**：通过 `rule/` 路由当前任务需要的内容，避免把整套工程一次性塞进上下文。
- **安全与可追溯**：敏感文件、删除、文件所有权、锁、状态事务、重试回流和 ADR 都有明确边界。
- **可治理的提示词**：12 个 Agent 拥有版本化 system、task 和 retry 提示词，支持评测、审批、激活与回滚。
- **可迁移工具链**：Skills 以工程内副本交付，MCP 使用相对配置和环境变量，不绑定开发者机器路径。

## 5 分钟开始

### 1. 环境要求

- 已安装近期稳定版 [Claude Code](https://code.claude.com/docs/en/overview)。
- Node.js 18 或更高版本，用于原生 Hooks 和提示词工具。
- macOS / Linux：Bash 与 Python 3。
- Windows：PowerShell 7，并准备 Git Bash 或 WSL 运行 Bash 工具；Hooks 本身使用 Node.js。
- Git 是辅助能力，不是初始化项目的必要条件。

### 2. 把安装包合并到项目根目录

下载生成好的 CC-RADT 安装包，将其中内容合并到目标项目根目录。推荐形态如下：

```text
target-project/
├── .mcp.json
├── CLAUDE.md                    # 项目已有文件，CC-RADT 不创建或覆盖
└── .claude/
    ├── settings.json
    ├── settings.local.example.json
    ├── agents/                  # Claude Code 官方 subagent 扫描目录
    ├── rules/                   # Claude Code 官方规则适配层
    ├── manifest.json
    └── ai-teams/                # CC-RADT v1 稳定运行命名空间
        ├── index/ENTRY.md
        ├── agents/
        ├── project/
        ├── memory/
        ├── kb/
        ├── shared/
        ├── security/
        └── tools/
```

`CC-RADT` 是项目名称；`.claude/ai-teams/` 与 `ai-teams-*` 是 v1 为兼容现有升级、Hooks 和工具链保留的运行命名空间。

已有 `.claude/settings.json` 或 `.mcp.json` 时请合并配置，不要直接覆盖。`settings.local.example.json` 只是本地配置示例，不覆盖用户的私有设置。

### 3. 验证安装

在目标项目根目录执行：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-check.sh
```

Windows：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-check.ps1
```

### 4. 初始化项目画像

初始化是用户主动操作，不会在 Claude Code 启动、恢复会话或收到普通需求时自动询问或执行。需要建立持久项目画像时再运行：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

Windows：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write
```

手动初始化会扫描当前项目，写入 CC-RADT 自己管理的 `project/`、`rule/project/`、索引和记忆候选区。它会识别技术栈、目录、接口、UI 风格、命令、验证方式、项目规则和风险线索；不会把 Git 历史当作项目事实的唯一来源，也不会读取敏感文件内容或修改业务代码。

### 5. 直接提出需求

重新进入 Claude Code 后，可以直接描述任务：

```text
检查登录页与登录接口的字段契约，修复联调问题并完成回归测试。
```

Lead 会选择工作流、调用对应 Agent、检查交接并汇总结果。只有在你明确要求“单 Agent”“不要多 Agent”或“只回答”时，才会跳过默认团队协作。

## 本机可视化观察台

Harness 内置只读观察台。加载本次 Hook 配置后的 CC 会话会自动检测服务，并在首次进入时提示本机地址；同项目的多个 CC 会话共享服务，但活动与页面筛选分别隔离。网页查看任务、活动日志、审查证据与角色定义，执行和审批仍完全在 CC CLI。

手动启动 / 查看地址：`node tools/observer/cli.mjs start`、`node tools/observer/cli.mjs status`。安装态改用 `.claude/ai-teams/tools/observer/cli.mjs`。无需 npm 安装；历史存储在项目外，不进入正式包。配置、禁用及当前范围见 [观察台说明](tools/observer/README.md)。

## 工作原理

![CC-RADT 多 Agent 执行链路](assets/readme/cc-radt-workflow-zh.png)

Lead 是唯一调度者。子 Agent 使用独立上下文，任务通过结构化 task prompt 下发；任务目标、范围、禁止范围、输入、输出和验收标准必须完整。协作状态、锁、交接、回流和项目事实都会落到文件，而不是只保存在临时对话里。

## 研发团队

| Agent | 主要职责 | 典型任务 |
|---|---|---|
| Lead | 意图识别、工作流选择、调度、接管、验收 | 选择 Agent 组合，处理阻塞并向用户汇报 |
| PD | 产品与需求分析 | PRD、用户价值、业务规则、范围和验收口径 |
| Plan-PM | 计划与任务编排 | 任务拆分、依赖、排期、锁范围和执行方案 |
| Dev-Frontend-Web | Vue、React、Angular | 页面、组件、状态、路由、表单、权限和 Web 测试 |
| Dev-Frontend-Miniapp | 微信、支付宝、uni-app | 登录、授权、支付、分包、平台差异和包体积 |
| Dev-Backend-Systems | C、C++、Java | 强约束后端、并发、资源安全、构建和稳定性 |
| Dev-Backend-Service | Python、Go、Node.js / TypeScript | API、数据库、迁移、日志、配置和云原生服务 |
| QA | 代码审查与测试 | 复现、自动化测试、回归、接口与 UI 验收 |
| Memory | 工程记忆管理 | 共享记忆、Agent 记忆、恢复点和上下文压缩 |
| Doc | 项目与知识治理 | `project/`、知识库、索引、关系图、日志和 ADR |
| Role | Agent 治理 | 角色边界、Agent 文件、Skills 和能力调整 |
| Security-Reviewer | 持续安全监督 | 敏感文件、删除、权限、Hooks、MCP、锁和越界审查 |

Agent 总索引位于 [`agents/index.md`](agents/index.md)，Claude Code 识别的主定义位于 `.claude/agents/`。

## 工作流选择

CC-RADT 不强制所有任务经过一条冗长流水线。Lead 会在 12 套工作流中选择最小可用组合：

| 工作流 | 场景 | 核心组合 |
|---|---|---|
| WF-01 快速问答 | 解释、只读咨询 | Lead |
| WF-02 小修快跑 | 低风险小改动 | Lead + 对应 Agent + 轻量 QA |
| WF-03 前端单任务 | Web 页面与交互 | Lead + Web Dev + QA |
| WF-04 小程序单任务 | 小程序功能与适配 | Lead + Miniapp Dev + QA |
| WF-05 后端服务 | Python / Go / Node.js | Lead + Service Dev + QA |
| WF-06 系统后端 | Java / C / C++ | Lead + Systems Dev + QA |
| WF-07 前后端联调 | 字段、接口、页面契约 | 前端 Dev + 后端 Dev + QA + Doc |
| WF-08 Bug 修复 | 有复现路径的缺陷 | QA → Dev → QA |
| WF-09 需求澄清 | 目标或验收不清 | PD → Plan-PM |
| WF-10 复杂功能 | 跨模块新功能 | PD + Plan-PM + 多 Dev + QA |
| WF-11 高风险变更 | 权限、迁移、生产、安全 | Lead + Security + 专业 Agent + QA |
| WF-12 文档与知识治理 | 文档、规则、索引、记忆 | Doc + Memory + Role + Security |

完整选择条件和关闭门禁见 [`playbook.md`](playbook.md)。

## 工程大脑与项目边界

![CC-RADT 工程大脑与项目边界](assets/readme/cc-radt-architecture-zh.png)

- `project/`：当前业务项目事实，所有 Agent 在工作前都要按需读取；由 Doc 持续维护。
- `memory/`：需要跨会话恢复和长期记住的事实；由 Memory 管理。
- `kb/`：稳定、可复用的知识；不保存实时动作规则。
- `shared/`：任务单、执行方案、锁、状态、交接、广播和回流记录。
- `security/`：动作规则、文件边界和风险门禁。
- `rule/`：只负责低 token 路由，不复制知识正文。

## 四层记忆

| 层级 | 内容 | 位置 |
|---|---|---|
| L1 当前上下文 | 当前任务、计划、锁、交接和状态 | `shared/` |
| L2 项目记忆 | 项目画像、架构、接口、UI、命令和风险 | `project/` |
| L3 团队记忆 | 共享长期记忆与 Agent 独立记忆 | `memory/MEMORY.md`、`memory/agents/` |
| L4 稳定知识 | 可复用工程与领域知识 | `kb/` |

上下文压缩 Hook 只检测并生成恢复材料，正式记忆仍由 Memory Agent 筛选。日志、记忆、项目事实和知识库互不替代。

## 安全与治理

| 能力 | 入口 | 规则摘要 |
|---|---|---|
| 敏感文件 | `security/sensitive-files.md` | `.env`、密钥、证书、token、credentials 默认不读取内容 |
| 删除保护 | `security/delete-policy.md` | 禁止未经确认的删除，也禁止借其他脚本绕过 |
| 文件所有权 | `security/file-ownership.md` | 明确目录 Owner、协作写入和复核边界 |
| 文件锁 | `security/lock-policy.md` | 多 Agent 修改重叠文件前检查锁，处理等待和死锁 |
| 任务状态 | `security/task-policy.md`、`security/state-transaction-policy.md` | 状态变更使用事件和事务化写入 |
| 失败接管 | `security/supervision-policy.md` | Agent 报错、无权限、跑偏或停滞时由 Lead 接管 |
| 接口契约 | `security/interface-contract-policy.md` | 前后端不得单边猜测字段或擅改 API 契约 |
| ADR | `security/adr.md`、`project/adr/` | 长期结构性决策记录原因，普通任务不写 ADR |
| 提示词治理 | `security/prompt-*.md` | 候选、评测、审批、激活、回滚全程可追溯 |

CC-RADT 不自动提交 Git、不自动发布外部产物、不自动安装未知第三方 MCP / Skills，也不自动删除用户项目文件。

## 提示词管理

每个 Agent 都有独立的 system、task 和 retry 提示词：

```text
prompts/agents/<agent>/
├── system/
├── task/
├── retry/
└── evals/
```

活动版本由 `prompts/registry.json` 管理。运行失败、用户纠正或验收未通过时，系统只记录脱敏事实并创建候选；候选经过 QA 回归、Role 一致性检查、Security 审查和 Lead 审批后才能激活。任何 Agent 都不能直接修改自己的活动 system prompt。

## Skills 与 MCP

- `skills/registry.json` 登记工程内置的本地副本，按 Agent 职责分配，发布后不依赖开发者机器上的全局 Skills 目录。
- `.mcp.json` 和 `mcp/claude-project.mcp.json` 当前登记 10 个 MCP 入口，包括 Chrome、Context7、shadcn、Filesystem、Figma、MySQL、GitHub、CodeGraph、Puppeteer fallback 和 Canva remote。
- 需要账号、数据库或浏览器扩展的 MCP 仍需用户在本机提供环境变量或完成官方安装；配置中不携带密钥。
- Chrome 自动化推荐 [hangwin/mcp-chrome](https://github.com/hangwin/mcp-chrome)，使用前按项目说明安装浏览器扩展。

查看实际可用情况：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-skills-list.sh
bash .claude/ai-teams/tools/bin/ai-teams-mcp-list.sh
```

## 常用指令

安装包包含 23 个运行与维护指令。常用入口如下：

| 目标 | 命令 |
|---|---|
| 项目初始化 | `bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write` |
| 工程自检 | `bash .claude/ai-teams/tools/bin/ai-teams-check.sh` |
| 查看状态 | `bash .claude/ai-teams/tools/bin/ai-teams-status.sh` |
| MCP 查询 | `bash .claude/ai-teams/tools/bin/ai-teams-mcp-list.sh` |
| Skills 查询 | `bash .claude/ai-teams/tools/bin/ai-teams-skills-list.sh` |
| 上下文压缩预览 | `bash .claude/ai-teams/tools/bin/ai-teams-context-compact.sh --dry-run` |
| 提示词状态 | `node .claude/ai-teams/tools/bin/ai-teams-prompt-status.mjs --json` |
| 日志清理计划 | `bash .claude/ai-teams/tools/bin/ai-teams-logs-clean.sh --before YYYY-MM-DD --plan` |
| 回滚计划 | `bash .claude/ai-teams/tools/bin/ai-teams-rollback.sh --snapshot <路径> --plan` |

完整指令见 [`tools/commands/index.md`](tools/commands/index.md)。高风险工具默认要求先执行 plan 或 dry-run。

## 目录导航

| 目录 | 用途 |
|---|---|
| `.claude/` | Claude Code settings、官方 Agent 与规则适配层 |
| `agents/` | 12 个 Agent 的职责、工作流和能力组件 |
| `prompts/` | 版本化提示词、评测和注册表 |
| `rule/` | Agent、任务和项目的按需读取路由 |
| `project/` | 被管理项目的画像和持续事实 |
| `memory/` | 共享记忆、Agent 记忆和恢复材料 |
| `kb/` | 共享及 Agent 独立知识库 |
| `shared/` | 实时协作工作区 |
| `security/` | 安全与动作规则 |
| `hooks/`、`cron/` | 事件自动化与定时维护 |
| `skills/`、`mcp/` | 可移植能力和工具配置 |
| `tools/` | 指令说明与执行脚本 |
| `templates/` | Agent、项目、规则、Hook 等标准模板 |

完整地图从 [`index/ENTRY.md`](index/ENTRY.md) 开始。

## 从源码构建安装包

以下命令仅适用于源码仓库维护者，生成的运行包不会再包含打包脚本：

```bash
git clone https://github.com/Jia0201/CC-RADT.git
cd Claude-Code-Research-and-Development-Teams
```

```bash
bash tools/bin/ai-teams-package.sh formal \
  --install-layout claude-subdir \
  --output "$HOME/CC-RADT-dist/formal" \
  --verify
```

主工程自检：

```bash
bash tools/bin/ai-teams-check.sh
```

## 二次开发

源码开发、目录所有权、扩展方式、验证门禁和发布边界见 [`DEVELOPMENT.md`](DEVELOPMENT.md)。开发者应从 `dev` 分支开始工作，不要直接把主工程目录推送到 `main`；`main` 只接收通过打包脚本生成并验证的安装版内容。

## 当前状态与路线

`v1.1.0` 已具备主工程、12 Agent、12 套工作流、四层记忆、项目初始化、提示词治理、安全规则、Hooks、MCP、Skills、升级、回滚、正式安装包验证链路和只读研发观察台。

后续计划包括真实项目长期回归、GitHub 开源工程治理、精简版，以及 Codex / OpenCode 适配。当前状态详见 [`index/STATUS.md`](index/STATUS.md)，用户可感知变化见 [`CHANGELOG.md`](CHANGELOG.md)。

## 文档依据

CC-RADT 的 Claude Code 接入遵循官方文档：

- [Custom subagents](https://code.claude.com/docs/en/sub-agents)
- [Project memory and CLAUDE.md](https://code.claude.com/docs/en/memory)
- [Hooks reference](https://code.claude.com/docs/en/hooks)
- [Settings](https://code.claude.com/docs/en/settings)
- [Permissions](https://code.claude.com/docs/en/permissions)

内置第三方 Skills 的来源、许可证和未纳入公开仓库的内容见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。贡献流程见 [`CONTRIBUTING.md`](CONTRIBUTING.md)，版本变化见 [发布说明](RELEASE_NOTES.md)。项目级 LICENSE 尚未选定，本次版本不改变许可状态。
