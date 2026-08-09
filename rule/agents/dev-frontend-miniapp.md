---
id: "rule-agent-dev-frontend-miniapp"
title: "Dev-Frontend-Miniapp 规则路由"
type: "agent-rule-route"
scope: "agent"
owner: "role"
status: active
---
# Dev-Frontend-Miniapp 规则路由

## 执行前最短读取链

1. 读取 [dev-frontend-miniapp](../../agents/dev-frontend-miniapp/dev-frontend-miniapp.md) 和 [index](../tasks/index.md) 中的小程序路由。
2. 读取 [index](../project/index.md)、[index](../../project/index.md)、[index](../project/frontend/index.md) 和 [change-log](../../project/change-log.md)。
3. 通过 [index](../shared/index.md) 定位当前任务单、执行方案、接口契约、锁和交接。
4. 通过 [index](../security/index.md) 读取文件所有权、接口契约、平台安全和小程序开发规则；仅在命中时读取 [index](../custom/index.md)。

## 专业路由

- 文件定位：[files](../project/files.md)；UI：[ui](../project/frontend/ui.md)；语法和平台规则：[syntax](../project/frontend/syntax.md)、[imported-rules](../../project/imported-rules.md)。
- 接口：[api](../project/backend/api.md)；验证：[verification](../../project/verification.md)。
- 专业知识：[00-index](../../kb/agents/dev-frontend-miniapp/00-index.md)；不得绕过平台审核或把服务端密钥写入前端。
