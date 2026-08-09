---
id: "agents-plan-pm-skills"
title: "Plan-PM Skills 指针"
type: "agent-skills-link"
scope: "agent"
owner: "role"
status: active
---
# Plan-PM Skills 指针

本文件记录 Plan-PM 与 Skills 的连接关系。Agent 主入口保留为 `agents/plan-pm/plan-pm.md`。

## 已登记 Skills

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| to-issues | 把 PRD 或计划拆成可执行任务 | `skills/agents/plan-pm/to-issues` | installed-local-copy |
| triage | 任务优先级、状态和阻塞分流 | `skills/agents/plan-pm/triage` | installed-local-copy |
| prototype | 在正式实现前做轻量验证方案 | `skills/agents/plan-pm/prototype` | installed-local-copy |
| diagnose | 计划失败、依赖阻塞和回流分析 | `skills/agents/plan-pm/diagnose` | installed-local-copy |

## Registry

- 总表：`skills/registry.json`
- Agent 安装索引：[index](../../skills/agents/plan-pm/index.md)
- 工程内 Skills 目录：`skills/agents/plan-pm/`

## 使用规则

- 按 Lead 任务单确认是否需要启用相关能力。
- 启用前读取对应工程内 Skill 的 `SKILL.md`，并只读取完成任务所需的最小材料。
- 安装或更新 Skills 前先检查安全边界，必要时交由 Security-Reviewer 审查。
- 本文件只维护 Agent 结构内的导航和边界说明。
