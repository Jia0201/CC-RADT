---
id: "rule-agent-dev-backend-systems"
title: "Dev-Backend-Systems 规则路由"
type: "agent-rule-route"
scope: "agent"
owner: "role"
status: active
---
# Dev-Backend-Systems 规则路由

## 执行前最短读取链

1. 读取 [dev-backend-systems](../../agents/dev-backend-systems/dev-backend-systems.md) 和 [index](../tasks/index.md) 中的系统后端路由。
2. 读取 [index](../project/index.md)、[index](../../project/index.md)、[index](../project/backend/index.md) 和 [change-log](../../project/change-log.md)。
3. 通过 [index](../shared/index.md) 定位当前任务单、执行方案、接口契约、锁和交接。
4. 通过 [index](../security/index.md) 读取文件所有权、接口契约和强类型后端开发规则；仅在命中时读取 [index](../custom/index.md)。

## 专业路由

- 文件定位：[files](../project/files.md)；工程语法：[syntax](../project/backend/syntax.md)；接口：[api](../project/backend/api.md)。
- 构建和验证：[commands](../../project/commands.md)、[verification](../../project/verification.md)；架构：[architecture](../../project/architecture.md)。
- 专业知识：[00-index](../../kb/agents/dev-backend-systems/00-index.md)；重点检查内存、资源、并发、异常、构建和兼容性。
