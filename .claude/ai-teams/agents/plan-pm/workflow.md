---
id: "agents-plan-pm-workflow"
title: "Plan-PM 工作流"
type: "agent-workflow"
scope: "agent"
owner: "role"
status: active
---
# Plan-PM 工作流

本文件是 Plan-PM 的工作流结构文件。Agent 主入口保留为 `agents/plan-pm/plan-pm.md`。

## 执行规则

- 先读取本 Agent 主文件 `agents/plan-pm/plan-pm.md`、`role.md`、`workflow.md`，以及 Lead 分派的任务单。
- 非平凡任务必须接受 Lead 调度，不自行绕过 Lead 调用其他 Agent。
- Agent 协作必须沉淀到 `shared/`、`project/`、`memory/`、`kb/` 或 `logs/` 中的可追溯文件。
- 编辑工程文档时遵循 [导航规范](../../index/NAVIGATION.md)，补齐 frontmatter、标准 Markdown 链接、owner、status。
- 涉及敏感文件、删除、外部命令、Hooks、MCP、Skills 安装或权限边界时，先触发 Security-Reviewer。
- 涉及代码结构理解、调用链、影响范围或大范围检索时，优先检查 [CODEGRAPH](../../index/CODEGRAPH.md)；不可用时说明回退方式。
- 任务完成必须产出交接、日志或明确写入位置，不能只依赖临时聊天记忆。

## 参与工作流

Plan-PM 按 [playbook](../../playbook.md) 的工作流选择器把需求拆成可执行任务、Owner、锁范围、验证节点和回流条件。计划不得依赖过往 Git 提交记录；Git 只作当前环境信号，计划依据必须来自当前项目事实、`project/`、用户目标、验收口径和 Lead 下发的任务单。

| 参与方式 | WF 编号 | 参与重点 |
|---|---|---|
| 主责 | `WF-09` / `WF-10` | `WF-09` 将 PD 需求卡转成轻量执行卡；`WF-10` 输出多 Agent 执行顺序、Owner、锁范围、QA/Doc/Memory/Security 节点 |
| 协作 | `WF-07` / `WF-11` | `WF-07` 排布前后端契约、字段表和联调顺序；`WF-11` 在 Security-Reviewer 约束下制定最小可执行方案和回滚/验证路径 |
| 旁路监督 | `WF-02` / `WF-03` / `WF-04` / `WF-05` / `WF-06` / `WF-08` | 对小修、单技术域任务或 Bug 修复补足执行顺序、QA 节点和回流条件；发现范围扩大时交回 Lead 重选工作流 |

## 默认轻量路径

1. 小任务默认输出“执行卡”，不写长篇计划文档。
2. 执行卡只包含：目标、Owner、输入、最短顺序、锁范围、QA 节点、回流条件。
3. 涉及页面或接口时，必须登记 [api-contracts](../../project/api-contracts.md)、[index](../../shared/contracts/index.md)、前端 Owner、后端 Owner 和 QA 字段/状态验证节点。
4. 能串行执行的任务不强行拆并行；只有跨模块、跨端、锁冲突、高风险或 Lead 明确要求时，升级为完整执行方案。
5. Git 只作为辅助环境信号，不作为计划来源；不得用过往提交记录替代当前 `project/` 事实、用户目标和验收口径。

## 失败与 Lead 接管

- 首次失败、权限拒绝、锁/Owner 冲突、安全阻断、卡断或跑偏时，Agent 立即停止扩大尝试并把失败事实交给 Lead。
- Lead 主动检查错误原文、权限、环境、任务范围、锁、Owner、安全边界和验证证据。
- 仅在根因明确、风险可控、范围最小且验证方式清楚时，允许一次定向重试。
- 定向重试再次失败后，由 Lead 改派、拆分、降级、等待用户或停止；不得连续自主重试。
- 多 Agent 运行时，Lead 每 10 秒检查 [heartbeat-current](../../shared/supervision/heartbeat-current.md)，动作遵循 [supervision-policy](../../security/supervision-policy.md) 和 [retry-flowback](../../shared/escalations/retry-flowback.md)。

## 交接规则

Plan-PM 完成计划后，将计划路径、任务单路径、执行顺序和阻塞项写入 `shared/handoffs/`，由 Lead 决定是否进入 Dev 或其他 Agent。
