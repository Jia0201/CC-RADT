---
id: ai-teams-entry
title: CC-RADT Harness 地图
type: entry
scope: project
owner: lead
status: active
---

# CC-RADT Harness 地图

本文件是 CC-RADT 工程大脑的稳定导航，不是 Claude Code 的第二份项目指令文件。v1 为兼容既有工具保留 `ai-teams` 运行命名空间。源工程由根 `CLAUDE.md` 导入本文件；安装到目标项目后，官方 `.claude/rules/` 和 `.claude/agents/` 按需读取本文件。

## 根目录定位

1. 目标项目存在 `.claude/ai-teams/index/ENTRY.md` 时，`AI_TEAMS_ROOT=.claude/ai-teams`。
2. AI-Teams 源工程存在 `index/ENTRY.md`、`agents/`、`security/` 和 `tools/` 时，当前工程根目录是 `AI_TEAMS_ROOT`。
3. 不得根据机器绝对路径猜测 Harness 或目标项目位置。
4. 目标项目根目录是 Claude Code 的当前工作目录；Harness 根目录与目标项目根目录必须分别记录。

## 强制原则

1. Lead 是唯一调度者。非平凡任务默认使用 AI-Teams 具名 Agent，除非用户明确要求单 Agent 或只回答。
2. 不得使用默认 `general-purpose` 替代已定义的 AI-Teams Agent。
3. Agent 先读取 `rule/index.md`、`rule/agents/<agent>.md` 和 `rule/tasks/index.md`，再加载当前任务需要的正文。
4. 所有 Agent 通过 `project/` 了解目标项目；项目事实由 Doc 持续维护。
5. Doc、Memory、Security-Reviewer 按工作流档位并行维护；Agent 或入口变化时安排 Role。
6. 敏感文件默认不读取内容；不得保存密钥、token、证书、credentials 或环境变量值。
7. 删除、不可逆命令、权限、Hooks、MCP、Skills、迁移和生产配置变更先进入 Security-Reviewer。
8. 协作必须写入 `shared/`、`project/`、`memory/`、`kb/` 或 `logs/`，不能只依赖临时聊天。
9. 首次失败由 Lead 诊断，只允许一次有根因、有边界、有验证方式的定向重试。

## Lead 动作链

1. 确认用户最新目标、允许范围、禁止范围、Harness 根目录和目标项目路径。
2. 读取 `project/context.md`、`project/change-log.md` 与当前任务相关项目事实。
3. 项目初始化由用户主动发起；未初始化时不询问、不自动执行、不写入初始化画像，只读取当前任务必需的项目文件并标记未验证事实。
4. 按 `playbook.md` 选择 `WF-01` 到 `WF-12`。
5. 需求不清交给 PD；需要拆分、依赖、锁或多 Agent 编排时交给 Plan-PM。
6. 按技术栈选择 Dev；Bug 默认由 QA 先确认失败面。
7. 接口联调读取 `project/api-contracts.md` 与 `shared/contracts/`，禁止单边猜字段。
8. 派单前从 `prompts/registry.json` 解析活动提示词并生成任务合同。
9. 多 Agent 运行时检查 `shared/supervision/heartbeat-current.md`，异常时由 Lead 接管。
10. 关闭前检查 QA、Doc、Memory、Security 和必要的 Role 收尾。

## 主要入口

| 内容 | 文件 |
|---|---|
| Agent | [Agent 总索引](../agents/index.md) |
| 工作流 | [多 Agent Playbook](../playbook.md) |
| 规则路由 | [规则总索引](../rule/index.md) |
| 安全规则 | [安全索引](../security/index.md) |
| 项目画像 | [项目索引](../project/index.md) |
| 任务、锁、状态、交接 | [共享工作区](../shared/index.md) |
| 记忆 | [记忆索引](../memory/index.md) |
| 知识库与关系图 | [知识库](../kb/index.md)、[关系图](../kb/graph.md) |
| 提示词 | [提示词索引](../prompts/index.md) |
| Skills | [Skills 索引](../skills/index.md) |
| MCP | [MCP 索引](../mcp/index.md) |
| 指令与工具 | [指令索引](../tools/commands/index.md) |
| 文档导航 | [导航规范](./NAVIGATION.md) |

## 数据边界

- `project/` 保存目标项目事实，不保存通用动作规则。
- `memory/` 保存恢复与长期事实，不替代日志或知识库。
- `kb/` 保存稳定可复用知识，不保存实时任务动作。
- `shared/` 保存当前协作材料和状态。
- `security/` 保存动作规则、安全边界和 Agent playbook。
- `rule/` 只做最小读取路由。
- 文档关系使用标准 Markdown 相对链接，运行指引使用真实仓库路径。
