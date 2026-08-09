---
id: "agents-lead-skills"
title: "Lead Skills 指针"
type: "agent-skills-link"
scope: "agent"
owner: "role"
status: active
---
# Lead Skills 指针

本文件记录 Lead 与 Skills 的连接关系。Agent 主入口保留为 `agents/lead/lead.md`。

## 已登记 Skills

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| triage | 任务分诊、优先级判断和路由决策 | `skills/agents/lead/triage` | installed-local-copy |
| diagnose | 复杂失败的复盘、定位和恢复路径设计 | `skills/agents/lead/diagnose` | installed-local-copy |
| zoom-out | 跨模块任务时进行高层上下文检查 | `skills/agents/lead/zoom-out` | installed-local-copy |
| handoff | 长任务或交接前生成可恢复摘要 | `skills/agents/lead/handoff` | installed-local-copy |
| claude-automation-recommender | 评估 hooks、subagents、skills、MCP 的自动化建议 | `skills/agents/lead/claude-claude-code-setup-claude-automation-recommender` | installed-local-copy |

## Registry

- 总表：`skills/registry.json`
- Agent 安装索引：[index](../../skills/agents/lead/index.md)
- 工程内 Skills 目录：`skills/agents/lead/`

## 使用规则

- 按 Lead 任务单确认是否需要启用相关能力。
- 启用前读取对应工程内 Skill 的 `SKILL.md`，并只读取完成任务所需的最小材料。
- 安装或更新 Skills 前先检查安全边界，必要时交由 Security-Reviewer 审查。
- 本文件只维护 Agent 结构内的导航和边界说明。
