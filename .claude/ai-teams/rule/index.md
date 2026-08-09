---
id: "rule-index"
title: "规则总索引"
type: "rule-index"
scope: "project"
owner: "doc"
status: active
---
# 规则总索引

Agent 不应先扫描整个 AI-Teams 或目标项目。进入任务后先读取本索引，再读取自己的 Agent 路由和当前任务路由，只打开路由中列出的必要文件。

## 最短读取链

1. [index](./index.md)：确认规则域。
2. `rule/agents/<agent>.md`：确认当前 Agent 的最小必读集。
3. [index](./tasks/index.md)：按需求、计划、开发、QA、文档、记忆或安全任务选择路由。
4. 涉及目标项目时读取 [index](./project/index.md)；需要精确文件位置时才读取 [index](./catalog/index.md)。
5. 路由指向的规则正文仍以 `security/`、`project/`、`agents/`、`shared/`、`kb/` 和 `memory/` 为准。

## 规则域

| 规则域 | 入口 | 解决的问题 |
|---|---|---|
| Agent 路由 | [index](./agents/index.md) | 当前 Agent 应读什么、写什么、禁止什么 |
| 任务路由 | [index](./tasks/index.md) | 当前任务需要哪些规则、项目事实和知识 |
| 自建规则 | [index](./custom/index.md) | 运行中新建规则的路由注册、触发条件和读取入口 |
| 工程规则 | [index](./engineering/index.md) | AI-Teams 工程结构、文件、工作流和治理入口 |
| 项目规则 | [index](./project/index.md) | 目标项目结构、文件、前端、UI、后端、接口、决策和方案 |
| 知识路由 | [index](./knowledge/index.md) | 何时读取共享 KB、Agent KB、记忆和 CodeGraph |
| 安全路由 | [index](./security/index.md) | 按风险定位文件、锁、删除、敏感内容、状态和接管规则 |
| 工作区路由 | [index](./shared/index.md) | 任务、执行方案、状态、锁、交接、契约和回流 |
| 记忆路由 | [index](./memory/index.md) | 共享记忆、Agent 记忆、恢复、压缩和归档定位 |
| 工具路由 | [index](./tools/index.md) | 指令、脚本、Hooks、Skills、MCP、CodeGraph 和 Cron |
| 完整目录 | [index](./catalog/index.md) | 精确查找目录和文件，不默认加载 |

## 强制原则

- 索引优先，正文按需；不得为了熟悉项目无差别读取全部文件。
- 项目规则必须来自初始化扫描、当前代码、已确认契约或用户确认，不得凭空生成。
- 路由文件只提供定位和使用条件，不复制大段知识库或安全规则。
- Doc 维护规则目录、项目规则与文件目录；Role 维护 Agent 路由；专业 Agent 提供事实；Security-Reviewer 校验边界。
- 新增、移动或删除工程文件后，运行 `node tools/bin/ai-teams-rule-refresh.mjs --write` 刷新目录索引。
- 新增稳定自建规则时，先读 [rule-policy](../security/rule-policy.md)，再用 `tools/bin/ai-teams-rule-create.mjs` 生成 `rule/custom/` 路由；动作规则仍写入 `security/`。
