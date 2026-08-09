---
id: "rule-agent-pd"
title: "PD 规则路由"
type: "agent-rule-route"
scope: "agent"
owner: "role"
status: active
---
# PD 规则路由

## 执行前最短读取链

1. 读取 [pd](../../agents/pd/pd.md) 和 [index](../tasks/index.md) 中的需求解析路由。
2. 读取 [index](../project/index.md)、[index](../../project/index.md)、[context](../../project/context.md)、[change-log](../../project/change-log.md)、[index](../../project/requirements/index.md) 和 [imported-rules](../../project/imported-rules.md)。
3. 通过 [index](../shared/index.md) 定位当前任务单、需求交接和待确认问题。
4. 通过 [index](../security/index.md) 读取任务、敏感内容和项目事实规则；仅在命中时读取 [index](../custom/index.md)。

## 专业路由

- 涉及页面体验：[index](../project/frontend/index.md)；涉及字段和业务接口：[api](../project/backend/api.md)。
- 专业知识：[index](../../kb/agents/pd/index.md)；任务动作：[pd](../../security/agent-playbooks/pd.md)。
- 只分析当前项目和当前需求，不读取过往 Git 提交正文，不替 Dev 决定技术实现。
