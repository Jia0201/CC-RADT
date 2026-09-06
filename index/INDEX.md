---
id: "index-index"
title: "AI-Teams 总索引"
type: "index"
scope: "project"
owner: "doc"
status: active
---
# AI-Teams 总索引

## 使用规则

1. 非平凡任务先读 [规则总索引](../rule/index.md)，再按 Agent 和任务类型进入最小读取集合；本文件用于全局导航。
2. 根据任务类型进入对应专题索引。
3. 使用索引定位后再读取目标文件。
4. 按 [Agent 分级读取策略](./READING-MODES.md) 选择 quick、task 或 governance，不让简单任务过度消耗上下文。
5. 涉及代码理解、影响分析、调用关系或架构问题时，先看 [CodeGraph 调用索引](./CODEGRAPH.md)。
6. 涉及知识库、图谱、标准 Markdown 链接或 标准 Markdown 时，先看 [文档关系图索引](./NAVIGATION.md)。
7. 涉及验收、缺口或需求对齐时，先看 [需求验收索引](./REQUIREMENTS.md)。
8. 涉及长期结构性决策、目录归位、协议取舍或反复争论的设计原因时，先看 [ADR 索引](../project/adr/index.md)。
9. 涉及目标项目分析、开发、测试、重构、审计或文档治理时，先看 [项目管理索引](../project/index.md)、[项目上下文](../project/context.md)、[需求前代码变化](../project/change-log.md)、[UI 画像](../project/ui-style.md)、[接口契约索引](../project/api-contracts.md)、[项目规则索引](../project/rules/index.md) 和 [项目管理规则](../security/project-policy.md)。
10. 涉及 MCP 启用、安装、浏览器自动化、数据库、GitHub、Figma 或远程 MCP 时，先看 [MCP 管理](../mcp/index.md)、[Agent MCP 绑定](../mcp/agents/index.md) 和 [MCP 安全规则](../security/mcp-policy.md)。
11. 非平凡任务必须读取 [运行期维护规则](../security/runtime-maintenance-policy.md)，确认 Doc、Memory、Role、Security-Reviewer 是否需要并行维护 `project/`、记忆、索引、图谱、Agent 指引和风险状态。
12. 修改 Agent、shared、security、memory、kb、tools、mcp、skills、project 入口后，检查 [全局知识图谱](../kb/graph.md)、[项目知识图谱](../project/graph.md) 和 [文档关系维护](../security/runtime-maintenance-policy.md)。
13. 多 Agent 运行期间，Lead 每 10 秒检查 [心跳状态](../shared/supervision/heartbeat-current.md)；失败、权限、跑偏或停滞按 [监督与接管规则](../security/supervision-policy.md) 处理。
14. 涉及新增规则、规则固化或重复遗漏修复时，先看 [自建规则索引](../rule/custom/index.md) 和 [自建规则管理规范](../security/rule-policy.md)。
15. 涉及任务路由、Agent 组合、QA/Doc/Memory/Security/Role 档位或收尾门时，先看 [工作流选择器](../playbook.md#3.4-工作流选择器)，再进入 [Lead 工作流](../agents/lead/workflow.md) 和对应 `agents/<agent>/workflow.md`。
16. 涉及 Agent system prompt、user/task prompt、模型调用合同、失败驱动优化、提示词评测或回滚时，先看 [提示词总索引](../prompts/index.md)、[提示词规则](../security/prompt-policy.md)、[提示词进化规则](../security/prompt-evolution-policy.md) 和 [进化工作区](../shared/prompt-evolution/index.md)。

## 根入口

- `README.md`
- `README.en.md`
- `USAGE.md`
- `UPGRADE.md`
- `RELEASE_NOTES.md`
- `DEVELOPMENT.md`
- `DEVELOPMENT.en.md`
- `CLAUDE.md`
- `index/ENTRY.md`
- `VERSION`
- `MANIFEST.json`

## 核心索引

- `index/README.md`
- `index/PROJECT.md`
- `index/READING-MODES.md`
- `index/AGENTS.md`
- `index/COMMANDS.md`
- `index/FILES.md`
- `index/STATUS.md`
- `index/NAVIGATION.md`
- `index/REQUIREMENTS.md`
- `index/CODEGRAPH.md`

## 工作流选择器入口

- 全局选择器：[playbook.md 3.4 工作流选择器](../playbook.md#3.4-工作流选择器)，定义 `WF-01` 到 `WF-12`、M0-M3 Memory 收尾门、QA/Doc/Security/Role 分档和下发机制。
- Agent 工作流：[Lead 工作流](../agents/lead/workflow.md) 是调度入口；具体执行读取 `agents/<agent>/workflow.md` 和 [Agent Playbook 规则索引](../security/agent-playbooks/index.md)。
- 关系图谱：[全局工作流图谱](../kb/graph.md#工作流选择器图谱) 展示 WF、Agent、shared、memory、security、project 的关系；[项目运行时工作流关系](../project/graph.md#项目运行时工作流关系) 展示 `project/` 如何参与工作流读取。
- 设计原因：[ADR-0010 工作流选择器](../project/adr/accepted/ADR-0010-workflow-selector.md) 记录为什么不再所有任务都走完整重流程。

## 主题导航

| 主题 | 优先入口 | 关联文件 |
|---|---|---|
| 项目状态 | [状态索引](./STATUS.md) | `project/PROJECT.md`, [graph](../project/graph.md), `logs/audit/creation-report-v1.0.md` |
| 二次开发 | [二次开发指南](../DEVELOPMENT.md) | [English guide](../DEVELOPMENT.en.md), `tools/bin/ai-teams-check.sh`, `tools/bin/ai-teams-package.sh` |
| 规则按需读取 | [规则总索引](../rule/index.md) | [index](../rule/agents/index.md), [index](../rule/tasks/index.md), [index](../rule/project/index.md), [index](../rule/catalog/index.md) |
| 自建规则 | [自建规则索引](../rule/custom/index.md) | [rule-policy](../security/rule-policy.md), [rule-create](../tools/commands/ai/rule-create.md) |
| 目标项目管理 | [项目管理索引](../project/index.md) | [context](../project/context.md), [change-log](../project/change-log.md), [PROJECT](../project/PROJECT.md), [project-profile](../project/project-profile.md), [index](../project/rules/index.md), [project-policy](../security/project-policy.md) |
| UI 与接口画像 | [UI 画像](../project/ui-style.md), [接口契约索引](../project/api-contracts.md) | [index](../shared/contracts/index.md), [interface-contract-policy](../security/interface-contract-policy.md), [graph](../project/graph.md) |
| 运行期维护 | [运行期维护规则](../security/runtime-maintenance-policy.md) | [current](../shared/supervision/current.md), [doc](../agents/doc/doc.md), [memory](../agents/memory/memory.md), [role](../agents/role/role.md), [graph](../kb/graph.md), [graph](../project/graph.md) |
| 多 Agent 心跳 | [心跳协议](../shared/supervision/heartbeat.md) | [heartbeat-current](../shared/supervision/heartbeat-current.md), [supervision-policy](../security/supervision-policy.md), `hooks/scripts/agent-heartbeat.mjs` |
| Agent 团队 | `agents/index.md` | `agents/`, [Agent 导航](./AGENTS.md) |
| Agent Playbook | [Agent Playbook 规则索引](../security/agent-playbooks/index.md) | `agents/*/playbook.md`, `playbook.md`, [retry-flowback](../shared/escalations/retry-flowback.md) |
| 工作流选择器 | [工作流选择器](../playbook.md#3.4-工作流选择器) | [workflow](../agents/lead/workflow.md), `agents/*/workflow.md`, [AGENTS](./AGENTS.md), [graph](../kb/graph.md), [ADR-0010-workflow-selector](../project/adr/accepted/ADR-0010-workflow-selector.md) |
| 提示词管理 | [提示词总索引](../prompts/index.md) | [graph](../prompts/graph.md), `prompts/registry.json`, [prompt-policy](../security/prompt-policy.md), [index](../shared/prompt-evolution/index.md), [ADR-0011-prompt-evolution-system](../project/adr/accepted/ADR-0011-prompt-evolution-system.md) |
| 提示词自进化 | [进化规则](../security/prompt-evolution-policy.md) | [prompt-injection-policy](../security/prompt-injection-policy.md), `shared/prompt-evolution/events/`, `tools/bin/ai-teams-prompt-evolve.mjs`, `tools/bin/ai-teams-prompt-eval.mjs` |
| ADR | [ADR 索引](../project/adr/index.md) | [adr](../security/adr.md), [导航规范](../index/NAVIGATION.md) |
| 用户指令 | `tools/commands/index.md` | `tools/commands/ai/`, `tools/bin/`, [指令导航](./COMMANDS.md) |
| 文件地图 | [文件索引](./FILES.md) | `security/file-ownership.md`, `shared/locks/LOCKS.md` |
| Lead 调度规则 | `agents/lead/lead.md` | `index/ENTRY.md`, `agents/lead/workflow.md` |
| 需求验收 | [需求验收索引](./REQUIREMENTS.md) | `logs/audit/requirements-gap-remediation-report.md` |
| 文档关系图 | [文档关系图索引](./NAVIGATION.md) | [graph](../kb/graph.md), [graph](../project/graph.md), [运行期维护策略](../security/runtime-maintenance-policy.md), [导航规范](../index/NAVIGATION.md), `index/NAVIGATION.md` |
| CodeGraph | [CodeGraph 调用索引](./CODEGRAPH.md) | `mcp/codegraph/`, `tools/codegraph/`, `agents/lead/lead.md` |
| 记忆 | `memory/index.md` | `memory/MEMORY.md`, `memory/agents/*/MEMORY.md`, `memory/candidates/`, `memory/conversations/`, [native-claude-memory-audit](../memory/native-claude-memory-audit.md) |
| 知识库 | `kb/index.md` | `kb/shared/`, `kb/agents/`, `kb/candidates/`, `kb/graph.md` |
| 上下文压缩 | [上下文压缩规则](../memory/context-compression.md) | [context-compression-policy](../security/context-compression-policy.md), `hooks/scripts/context-compression-check.sh`, `tools/commands/ai/context-compact.md`, `tools/bin/ai-teams-memory-audit.mjs` |
| 共享协作协议 | [共享协议](../shared/protocol.md) | `shared/tasks/`, `shared/handoffs/`, `shared/broadcasts/`, `shared/decisions/`, `shared/escalations/`, `shared/` |
| 任务与执行方案 | [任务规则](../security/task-policy.md) | `shared/tasks/TASK_TEMPLATE.md`, `shared/tasks/EXECUTION_PLAN_TEMPLATE.md`, `shared/task-plan.md` |
| 锁、状态与事务 | [锁规则](../security/lock-policy.md) | [state-policy](../security/state-policy.md), [state-transaction-policy](../security/state-transaction-policy.md), [index](../shared/events/index.md), [index](../shared/transactions/index.md), `shared/locks/LOCKS.md`, `shared/pipeline-status.md` |
| 接管与回流 | [Lead 接管规则](../security/escalation-policy.md) | [retry-flowback](../shared/escalations/retry-flowback.md), [supervision-policy](../security/supervision-policy.md), `shared/escalations/ESCALATION_TEMPLATE.md` |
| 安全 | `security/index.md` | `security/file-ownership.md`, `security/sensitive-files.md`, `security/delete-policy.md`, `security/*-policy.md` |
| 模板 | `templates/index.md` | `templates/registry.json`, `templates/project-graph/template.md` |
| Skills | [Skills 管理](../skills/index.md) | `skills/registry.json`, `skills/agents/*/index.md`, `agents/*/skills.md` |
| MCP | [MCP 管理](../mcp/index.md) | [index](../mcp/shared/index.md), [index](../mcp/agents/index.md), `mcp/registry.json`, [mcp-policy](../security/mcp-policy.md) |

## 核心目录

- `agents/`
- `prompts/`
- `project/`
- `memory/`
- `kb/`
- `shared/`
- `security/`
- `hooks/`
- `cron/`
- `logs/`
- `templates/`
- `skills/`
- `mcp/`
- `tools/`
- `lab/`
