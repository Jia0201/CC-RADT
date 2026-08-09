---
id: "rule-agents-index"
title: "Agent 规则路由索引"
type: "rule-index"
scope: "project"
owner: "role"
status: active
---
# Agent 规则路由索引

每个 Agent 启动后先读自己的规则路由，不再默认读取整个工程地图。

每个专属路由必须直接连接以下五个按需入口：

1. [index](../tasks/index.md)：选择当前任务类型。
2. [index](../project/index.md)：读取目标项目结构、文件、前后端、决策和方案。
3. [index](../shared/index.md)：定位当前任务、执行方案、锁、状态和交接。
4. [index](../security/index.md)：按风险选择动作规则。
5. [index](../custom/index.md)：只在触发条件命中时追加自建规则。

涉及目标项目时还必须连接 [index](../../project/index.md)；Agent 不得跳过路由直接扫描整个工程或目标项目。

| Agent | 规则路由 |
|---|---|
| Lead | [lead](./lead.md) |
| PD | [pd](./pd.md) |
| Plan-PM | [plan-pm](./plan-pm.md) |
| Dev-Frontend-Web | [dev-frontend-web](./dev-frontend-web.md) |
| Dev-Frontend-Miniapp | [dev-frontend-miniapp](./dev-frontend-miniapp.md) |
| Dev-Backend-Systems | [dev-backend-systems](./dev-backend-systems.md) |
| Dev-Backend-Service | [dev-backend-service](./dev-backend-service.md) |
| QA | [qa](./qa.md) |
| Memory | [memory](./memory.md) |
| Doc | [doc](./doc.md) |
| Role | [role](./role.md) |
| Security-Reviewer | [security-reviewer](./security-reviewer.md) |
