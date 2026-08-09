---
id: "rule-engineering-workflow"
title: "Harness 工程工作流路由"
type: "rule"
scope: "project"
owner: "lead"
status: active
---
# Harness 工程工作流路由

| 阶段 | 主入口 | 产物 |
|---|---|---|
| 收到需求 | [playbook](../../playbook.md), [index](../tasks/index.md) | 路由决策 |
| 需求澄清 | [pd](../agents/pd.md), [index](../../project/requirements/index.md) | 需求材料 |
| 计划拆解 | [plan-pm](../agents/plan-pm.md), [index](../../project/plans/index.md) | 任务单、执行方案 |
| 开发 | 对应 Dev Agent 路由 | 代码、交接、验证结果 |
| QA | [qa](../agents/qa.md), [verification](../../project/verification.md) | QA 证据 |
| 并行维护 | Doc / Memory / Security-Reviewer，结构变化时加 Role | 项目、记忆、风险、索引更新 |
| 关闭 | Lead + [state-policy](../../security/state-policy.md) | 状态关闭和用户报告 |
