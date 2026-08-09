---
id: "rule-agent-qa"
title: "QA 规则路由"
type: "agent-rule-route"
scope: "agent"
owner: "role"
status: active
---
# QA 规则路由

## 执行前最短读取链

1. 读取 [qa](../../agents/qa/qa.md) 和 [index](../tasks/index.md) 中的 QA 路由。
2. 读取 [index](../project/index.md)、[index](../../project/index.md)、[verification](../../project/verification.md) 和 [change-log](../../project/change-log.md)。
3. 通过 [index](../shared/index.md) 定位当前需求、任务单、执行方案、接口契约和 Dev 交接。
4. 通过 [index](../security/index.md) 读取验收、接口契约和安全复核规则；仅在命中时读取 [index](../custom/index.md)。

## 专业路由

- UI 验证：[ui](../project/frontend/ui.md)；接口验证：[api](../project/backend/api.md)。
- 文件与影响范围：[files](../project/files.md)、[CODEGRAPH](../../index/CODEGRAPH.md)。
- 专业知识：[index](../../kb/agents/qa/index.md)；验收必须覆盖用户要求和变更影响，不只检查语法。
