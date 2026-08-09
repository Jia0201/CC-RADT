---
id: "agents-memory-skills"
title: "Memory Skills 指针"
type: "agent-skills-link"
scope: "agent"
owner: "role"
status: active
---
# Memory Skills 指针

本文件记录 Memory 与 Skills 的连接关系。Agent 主入口保留为 `agents/memory/memory.md`。

## 已登记 Skills

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| handoff | 将会话压缩为可恢复交接材料 | `skills/agents/memory/handoff` | installed-local-copy |
| session-report | 生成会话使用和上下文报告 | `skills/agents/memory/claude-session-report-session-report` | installed-local-copy |
| zoom-out | 从长上下文中提取高层恢复线索 | `skills/agents/memory/zoom-out` | installed-local-copy |

## Registry

- 总表：`skills/registry.json`
- Agent 安装索引：[index](../../skills/agents/memory/index.md)
- 工程内 Skills 目录：`skills/agents/memory/`

## 使用规则

- 按 Lead 任务单确认是否需要启用相关能力。
- 启用前读取对应工程内 Skill 的 `SKILL.md`，并只读取完成任务所需的最小材料。
- 安装或更新 Skills 前先检查安全边界，必要时交由 Security-Reviewer 审查。
- 本文件只维护 Agent 结构内的导航和边界说明。
