---
id: "kb-agents-lead-02-engineering-rules"
title: "Lead 工程调度知识"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Lead 工程调度知识

## 任务路由

- 什么时候使用：用户提出需求、修复、审计、架构、文档治理、初始化、升级、回滚。
- Codex 要遵守：默认多 Agent；Lead 分派任务，但不把所有工作吞回 Lead 单点执行。

## 并行监督

- 什么时候使用：任何非平凡任务。
- Codex 要遵守：Doc、Memory、Security-Reviewer 必须作为并行监督角色进入 `shared/supervision/current.md`，结论为 `done`、`blocked` 或 `skipped`。

## 状态板

- 什么时候使用：任务开始、阶段切换、失败重试、完成收口。
- Codex 要遵守：`shared/task-plan.md` 记录任务状态，`shared/pipeline-status.md` 记录 Agent 状态；状态变更必须有来源。

## 回流

- 什么时候使用：尝试次数达到 4 次、跨域阻塞、安全合规失败、QA/Dev 闭环失败。
- Codex 要遵守：按 [retry-flowback](../../../shared/escalations/retry-flowback.md) 路由，Lead 仲裁修订、撤销或重新分派。

## 关闭任务

- 什么时候使用：准备向用户汇报前。
- Codex 要遵守：检查任务单、执行方案、QA、Doc、Memory、Security、锁、索引、图谱、自检结果。
