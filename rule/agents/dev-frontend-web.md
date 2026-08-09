---
id: "rule-agent-dev-frontend-web"
title: "Dev-Frontend-Web 规则路由"
type: "agent-rule-route"
scope: "agent"
owner: "role"
status: active
---
# Dev-Frontend-Web 规则路由

## 执行前最短读取链

1. 读取 [dev-frontend-web](../../agents/dev-frontend-web/dev-frontend-web.md) 和 [index](../tasks/index.md) 中的 Web 前端路由。
2. 读取 [index](../project/index.md)、[index](../../project/index.md)、[index](../project/frontend/index.md) 和 [change-log](../../project/change-log.md)。
3. 通过 [index](../shared/index.md) 定位当前任务单、执行方案、接口契约、锁和交接。
4. 通过 [index](../security/index.md) 读取文件所有权、接口契约和前端开发规则；仅在命中时读取 [index](../custom/index.md)。

## 专业路由

- 文件定位：[files](../project/files.md)；UI：[ui](../project/frontend/ui.md)；语法：[syntax](../project/frontend/syntax.md)。
- 接口：[api](../project/backend/api.md)；验证：[verification](../../project/verification.md)；命令：[commands](../../project/commands.md)。
- 专业知识：[00-index](../../kb/agents/dev-frontend-web/00-index.md)；只读取任务涉及的框架章节。
