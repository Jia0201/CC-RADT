---
id: "rule-readme"
title: "AI-Teams 规则路由说明"
type: "rule-guide"
scope: "project"
owner: "doc"
status: active
---
# AI-Teams 规则路由说明

`rule/` 是 AI-Teams 的规则导航与按需读取层。它告诉 Agent 当前任务需要读取哪些工程规则、项目事实、工作流、知识、决策和方案，不复制或替代这些文件的正文。

## 边界

- `rule/`：负责定位、分流和最小读取集合。
- `security/`：保存安全与动作规则本体。
- `project/`：保存当前目标项目事实和项目规则。
- `agents/`：保存 Agent 职责与组件说明。
- `kb/`：保存经过验证的可复用知识。
- `memory/`：保存恢复所需记忆。
- `shared/`：保存当前任务、计划、锁、状态和交接。

Claude Code 原生入口位于 `.claude/rules/`；该目录只保存轻量适配规则，规则本体仍由 `rule/` 管理。
