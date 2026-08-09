---
id: "security-agent-playbook-dev-frontend-web"
title: "Dev-Frontend-Web 前端 Web Agent Playbook 规则"
type: "security-playbook"
scope: "agent"
owner: "security-reviewer"
status: active
---
# Dev-Frontend-Web 前端 Web Agent Playbook 规则

本文件是 Dev-Frontend-Web 前端 Web Agent 的安全治理侧 playbook 本体。Agent 目录下的 `agents/dev-frontend-web/playbook.md` 只作为指针文件。

## 执行前检查

- 先读取 [dev-frontend-web](../../agents/dev-frontend-web/dev-frontend-web.md)、[role](../../agents/dev-frontend-web/role.md)、[workflow](../../agents/dev-frontend-web/workflow.md)、[development-policy](../development-policy.md)、[development-frontend-web-policy](../development-frontend-web-policy.md) 和本文件。
- 确认任务单、文件所有权、锁状态和敏感文件边界。
- 涉及代码结构、调用关系或影响范围时，按 [CODEGRAPH](../../index/CODEGRAPH.md) 判断是否使用 CodeGraph。
- 涉及知识沉淀、记忆写入或共享广播时，分别交给 Doc、Memory 或 Lead 管理。


## 项目与契约入口

- 执行项目类任务前必须读取 [index](../../project/index.md)、[context](../../project/context.md)、[change-log](../../project/change-log.md)、[ui-style](../../project/ui-style.md)、[api-contracts](../../project/api-contracts.md) 和 [index](../../shared/contracts/index.md)。
- UI 风格、接口字段、契约、项目规则或项目画像发生变化时，先写交接或事件，由 Doc 合并到 project/；不得把动作规则写入 KB。

## 专属动作规范

- 遵守 [development-policy](../development-policy.md) 和 [development-frontend-web-policy](../development-frontend-web-policy.md) 中的开发规则、禁区、语法要求和验证要求。
- 只处理 Lead 或任务单明确分配给 Dev-Frontend-Web 的职责范围。
- 执行前确认任务单、执行方案、锁、状态板和禁止范围。
- 需要跨 Owner 写入时，先交给 Lead 或 Plan-PM 重排，不自行扩大权限。
- 产生记忆候选时交给 Memory；产生文档或图谱候选时交给 Doc；产生安全风险时交给 Security-Reviewer。

## 失败与 Lead 接管

- 首次失败、权限拒绝、锁/Owner 冲突、安全阻断、卡断或跑偏时，立即停止扩大尝试并通知 Lead。
- Lead 检查错误原文、权限、环境、任务范围、锁、Owner、安全边界和验证证据。
- 只有根因明确、风险可控且验证方式清楚时，允许一次定向重试。
- 定向重试再次失败后，由 Lead 改派、拆分、降级、等待用户或停止；不得连续自主重试。
- 接管动作遵循 [retry-flowback](../../shared/escalations/retry-flowback.md)、[escalation-policy](../escalation-policy.md) 和 [supervision-policy](../supervision-policy.md)。
- 多 Agent 运行时状态见 [heartbeat-current](../../shared/supervision/heartbeat-current.md)。

## 禁止事项

- 不把 escalation 写入 `.claude/`。
- 不读取或记录敏感文件内容。
- 不在 attempt 4+ 后继续扩大修改范围。
- 不绕过 [task-plan](../../shared/task-plan.md) 和 [pipeline-status](../../shared/pipeline-status.md) 记录状态。
- 不违反开发禁区、语法要求或验证要求。
