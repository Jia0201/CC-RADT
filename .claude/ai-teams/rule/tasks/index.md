---
id: "rule-tasks-index"
title: "任务规则路由"
type: "rule-index"
scope: "project"
owner: "plan-pm"
status: active
---
# 任务规则路由

## 需求执行前置动作

每次用户需求进入时，先由 `UserPromptSubmit` Hook 执行 `git-activity-watch`，再由 Lead 读取 [change-log](../../project/change-log.md)。已合入的同事提交可用于提示本轮受影响文件和项目画像复核范围；远端未合入提交只作提醒。Git 不可用或检查失败时跳过，不得阻塞任务，也不得回退为读取完整 Git 历史。

| 任务类型 | 主 Agent | 必读规则 | 项目事实 | 知识入口 |
|---|---|---|---|---|
| 需求解析 | PD | [pd](../agents/pd.md), [task-policy](../../security/task-policy.md) | [context](../../project/context.md), [change-log](../../project/change-log.md), [index](../../project/requirements/index.md) | [index](../../kb/agents/pd/index.md) |
| 计划与方案 | Plan-PM | [plan-pm](../agents/plan-pm.md), [lock-policy](../../security/lock-policy.md) | [architecture](../../project/architecture.md), [index](../../project/plans/index.md), [risks](../../project/risks.md) | [index](../../kb/agents/plan-pm/index.md) |
| Web 前端 | Dev-Frontend-Web | [dev-frontend-web](../agents/dev-frontend-web.md), [index](../project/frontend/index.md) | UI、接口、命令、验证 | [00-index](../../kb/agents/dev-frontend-web/00-index.md) |
| 小程序 | Dev-Frontend-Miniapp | [dev-frontend-miniapp](../agents/dev-frontend-miniapp.md), [index](../project/frontend/index.md) | UI、接口、平台规则 | [00-index](../../kb/agents/dev-frontend-miniapp/00-index.md) |
| 服务端 | Dev-Backend-Service | [dev-backend-service](../agents/dev-backend-service.md), [index](../project/backend/index.md) | 架构、接口、依赖、验证 | [00-index](../../kb/agents/dev-backend-service/00-index.md) |
| 系统后端 | Dev-Backend-Systems | [dev-backend-systems](../agents/dev-backend-systems.md), [index](../project/backend/index.md) | 架构、构建、接口、验证 | [00-index](../../kb/agents/dev-backend-systems/00-index.md) |
| QA | QA | [qa](../agents/qa.md), [interface-contract-policy](../../security/interface-contract-policy.md) | 验证、UI、接口、风险 | [index](../../kb/agents/qa/index.md) |
| 文档与索引 | Doc | [doc](../agents/doc.md), [index](../catalog/index.md) | project、graph、index | [index](../../kb/agents/doc/index.md) |
| 记忆与压缩 | Memory | [memory](../agents/memory.md), [context-compression-policy](../../security/context-compression-policy.md) | 任务交接和恢复事实 | [index](../../kb/agents/memory/index.md) |
| 角色结构 | Role | [role](../agents/role.md), [structure](../engineering/structure.md) | Agent 与入口变化 | [index](../../kb/agents/role/index.md) |
| 安全审查 | Security-Reviewer | [security-reviewer](../agents/security-reviewer.md), [index](../../security/index.md) | 风险、锁、命令、权限 | [index](../../kb/agents/security-reviewer/index.md) |
