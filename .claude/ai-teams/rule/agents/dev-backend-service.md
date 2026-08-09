---
id: "rule-agent-dev-backend-service"
title: "Dev-Backend-Service 规则路由"
type: "agent-rule-route"
scope: "agent"
owner: "role"
status: active
---
# Dev-Backend-Service 规则路由

## 执行前最短读取链

1. 读取 [dev-backend-service](../../agents/dev-backend-service/dev-backend-service.md) 和 [index](../tasks/index.md) 中的服务端路由。
2. 读取 [index](../project/index.md)、[index](../../project/index.md)、[index](../project/backend/index.md) 和 [change-log](../../project/change-log.md)。
3. 通过 [index](../shared/index.md) 定位当前任务单、执行方案、接口契约、锁和交接。
4. 通过 [index](../security/index.md) 读取文件所有权、接口契约和服务端开发规则；仅在命中时读取 [index](../custom/index.md)。

## 专业路由

- 文件定位：[files](../project/files.md)；工程语法：[syntax](../project/backend/syntax.md)；接口：[api](../project/backend/api.md)。
- 数据库、配置、命令和验证：[dependencies](../../project/dependencies.md)、[commands](../../project/commands.md)、[verification](../../project/verification.md)。
- 专业知识：[00-index](../../kb/agents/dev-backend-service/00-index.md)；按 Python、Go 或 Node.js/TypeScript 任务读取对应章节。
