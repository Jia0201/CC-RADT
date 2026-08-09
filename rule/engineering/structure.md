---
id: "rule-engineering-structure"
title: "Harness 工程结构规则"
type: "rule"
scope: "project"
owner: "doc"
status: active
---
# Harness 工程结构规则

| 目录 | 本体职责 | 默认 Owner |
|---|---|---|
| `agents/` | Agent 职责和组件 | Role |
| `rule/` | 规则路由、目录和按需读取索引 | Doc / Role |
| `project/` | 当前目标项目事实 | Doc |
| `shared/` | 当前任务协作状态 | 对应任务 Owner |
| `security/` | 安全和动作规则本体 | Security-Reviewer |
| `memory/` | 正式记忆和恢复材料 | Memory |
| `kb/` | 可复用知识 | Doc |
| `tools/` | 指令和可执行工具 | 对应工具 Owner |
| `hooks/` | Claude Code 事件自动化 | Security-Reviewer |
| `skills/`、`mcp/` | Agent 能力绑定 | Doc / Security-Reviewer |
| `index/` | 人类和 标准 Markdown 全局导航 | Doc |

精确目录和文件位置通过 [index](../catalog/index.md) 查询，不重复遍历仓库。
