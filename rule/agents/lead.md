---
id: "rule-agent-lead"
title: "Lead 规则路由"
type: "agent-rule-route"
scope: "agent"
owner: "role"
status: active
---
# Lead 规则路由

## 执行前最短读取链

1. 读取 [lead](../../agents/lead/lead.md) 和 [playbook](../../playbook.md)，确认唯一调度者边界。
2. 读取 [index](../tasks/index.md)，选择本轮主要任务路由。
3. 涉及目标项目时读取 [index](../project/index.md)、[index](../../project/index.md)、[context](../../project/context.md) 和 [change-log](../../project/change-log.md)。
4. 通过 [index](../shared/index.md) 定位当前任务单、执行方案、锁、状态和交接，不读取无关历史任务。
5. 通过 [index](../security/index.md) 选择当前风险对应规则；仅在命中触发条件时读取 [index](../custom/index.md) 中的具体规则。

需求分析和任务分派前，确认 `UserPromptSubmit` 已刷新 [change-log](../../project/change-log.md)。Hook 未运行时只允许调用 `git-activity-watch` 兜底一次；Git 不可用或失败时直接跳过。

## 按需读取

- 需求：[pd](./pd.md)；计划：[plan-pm](./plan-pm.md)。
- 项目文件：[index](../project/index.md)；工程结构：[index](../engineering/index.md)。
- 精确定位：[index](../catalog/index.md)；知识：[index](../knowledge/index.md)。
- 实时状态：[task-plan](../../shared/task-plan.md)、[pipeline-status](../../shared/pipeline-status.md)；异常接管：[index](../../shared/supervision/index.md)。

## 禁止

- 不默认加载全部 Agent、KB、Security 或 project 文件；先路由再读取。
