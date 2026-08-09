---
id: "agents-dev-backend-systems-playbook"
title: "Dev-Backend-Systems Playbook 指针"
type: "agent-playbook"
scope: "agent"
owner: "role"
status: active
---
# Dev-Backend-Systems Playbook 指针

本文件仅作为 Agent 目录内的 playbook 索引/指针，不承载规则本体。

## 规则来源

- Agent 专属规则：[dev-backend-systems](../../security/agent-playbooks/dev-backend-systems.md)
- 根 Playbook 动作链：[playbook](../../playbook.md)
- 开发规则与禁区：[development-policy](../../security/development-policy.md)
- 专属开发规则：[development-backend-systems-policy](../../security/development-backend-systems-policy.md)


## 项目读取入口

- 项目任务执行前读取 [index](../../project/index.md)、[context](../../project/context.md)、[change-log](../../project/change-log.md)、[ui-style](../../project/ui-style.md)、[api-contracts](../../project/api-contracts.md) 和 [index](../../shared/contracts/index.md)。
- UI、接口契约、项目画像或目标项目规则变化时，交给 Doc 合并到 project/，并由 Memory 判断是否需要记忆候选。

## 使用规则

- 执行任务前先读取根 Playbook、Agent 专属规则、安全总入口和共享工作区任务文件。
- 开发任务必须额外读取 [development-policy](../../security/development-policy.md) 和 [development-backend-systems-policy](../../security/development-backend-systems-policy.md)，确认开发规范、语法要求、禁区和验证要求。
- 本文件不复制规则本体；规则修订以 `security/agent-playbooks/dev-backend-systems.md`、`security/index.md` 和根 `playbook.md` 为准。
