---
id: "rule-agent-plan-pm"
title: "Plan-PM 规则路由"
type: "agent-rule-route"
scope: "agent"
owner: "role"
status: active
---
# Plan-PM 规则路由

## 执行前最短读取链

1. 读取 [plan-pm](../../agents/plan-pm/plan-pm.md) 和 [index](../tasks/index.md) 中的计划与方案路由。
2. 读取 [index](../project/index.md)、[index](../../project/index.md)、[index](../../project/requirements/index.md)、[plans](../project/plans.md)、[architecture](../../project/architecture.md) 和 [risks](../../project/risks.md)。
3. 通过 [index](../shared/index.md) 定位当前任务单、执行方案、依赖、锁和状态板。
4. 通过 [index](../security/index.md) 读取任务、锁和状态规则；仅在命中时读取 [index](../custom/index.md)。

## 专业路由

- 定位文件和目录：[structure](../project/structure.md)、[files](../project/files.md)。
- 锁与状态：[lock-policy](../../security/lock-policy.md)、[state-policy](../../security/state-policy.md)、[task-policy](../../security/task-policy.md)。
- 专业知识：[index](../../kb/agents/plan-pm/index.md)；不读取历史 Git 提交正文，不扩写与当前执行无关的长计划。
