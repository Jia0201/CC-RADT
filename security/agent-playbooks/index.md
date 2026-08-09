---
id: "security-agent-playbooks-index"
title: "Agent Playbook 规则索引"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# Agent Playbook 规则索引

本目录保存每个 Agent 的 playbook 规则本体。Agent 目录下的 `agents/<agent>/playbook.md` 只是索引指针，不承载规则本体。

## Agent 规则

| Agent | 安全侧规则 | Agent 指针 |
|---|---|---|
| Lead | [lead](./lead.md) | [playbook](../../agents/lead/playbook.md) |
| PD | [pd](./pd.md) | [playbook](../../agents/pd/playbook.md) |
| Plan-PM | [plan-pm](./plan-pm.md) | [playbook](../../agents/plan-pm/playbook.md) |
| Dev-Frontend-Web | [dev-frontend-web](./dev-frontend-web.md) | [playbook](../../agents/dev-frontend-web/playbook.md) |
| Dev-Frontend-Miniapp | [dev-frontend-miniapp](./dev-frontend-miniapp.md) | [playbook](../../agents/dev-frontend-miniapp/playbook.md) |
| Dev-Backend-Systems | [dev-backend-systems](./dev-backend-systems.md) | [playbook](../../agents/dev-backend-systems/playbook.md) |
| Dev-Backend-Service | [dev-backend-service](./dev-backend-service.md) | [playbook](../../agents/dev-backend-service/playbook.md) |
| QA | [qa](./qa.md) | [playbook](../../agents/qa/playbook.md) |
| Memory | [memory](./memory.md) | [playbook](../../agents/memory/playbook.md) |
| Doc | [doc](./doc.md) | [playbook](../../agents/doc/playbook.md) |
| Role | [role](./role.md) | [playbook](../../agents/role/playbook.md) |
| Security-Reviewer | [security-reviewer](./security-reviewer.md) | [playbook](../../agents/security-reviewer/playbook.md) |

## 维护规则

- Security-Reviewer 负责规则本体。
- Role 负责 Agent 目录中的 `playbook.md` 指针。
- Lead 负责在任务调度时要求相关 Agent 读取 playbook。
- `.claude/` 不保存 playbook 规则。

## 提示词运行规则

- 每个 Agent 执行前从 [index](../../prompts/index.md) 和 `prompts/registry.json` 确认自己的活动 system/task prompt 版本。
- Lead 下发的任务必须使用结构化 user/task prompt，至少包含版本、任务 ID、目标、项目上下文、允许范围、禁止范围、输出合同和验收条件。
- Agent 发现失败、遗漏、越权、工具错误或用户纠正时，只提交脱敏事实与改进建议到 `shared/prompt-evolution/events/`；不得编辑自己的活动 system prompt。
- 单次失败不进入长期记忆。只有跨任务重复出现、经复核稳定且有长期恢复价值的模式，才交 Memory 判断。
- 提示词候选、评测、审批、激活和回滚遵循 [prompt-evolution-policy](../prompt-evolution-policy.md)；运行中的 Agent 不热替换，新版本从下一次调用或新会话生效。

## 项目与契约入口

- 执行项目类任务前必须读取 [index](../../project/index.md)、[context](../../project/context.md)、[change-log](../../project/change-log.md)、[ui-style](../../project/ui-style.md)、[api-contracts](../../project/api-contracts.md) 和 [index](../../shared/contracts/index.md)。
- UI 风格、接口字段、契约、项目规则或项目画像发生变化时，先写交接或事件，由 Doc 合并到 project/；不得把动作规则写入 KB。
