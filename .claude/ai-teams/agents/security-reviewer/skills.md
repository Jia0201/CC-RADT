---
id: "agents-security-reviewer-skills"
title: "Security-Reviewer Skills 指针"
type: "agent-skills-link"
scope: "agent"
owner: "role"
status: active
---
# Security-Reviewer Skills 指针

本文件记录 Security-Reviewer 与 Skills 的连接关系。Agent 主入口保留为 `agents/security-reviewer/security-reviewer.md`。

## 已登记 Skills

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| diagnose | 安全失败、命令风险和异常行为复盘 | `skills/agents/security-reviewer/diagnose` | installed-local-copy |
| hook-development | 审查和设计 Hook 安全边界 | `skills/agents/security-reviewer/claude-plugin-dev-hook-development` | installed-local-copy |
| warn-env-file-edits | 编写或审查 hookify 规则 | `skills/agents/security-reviewer/claude-hookify-writing-rules` | installed-local-copy |
| mcp-integration | 审查 MCP 集成和配置风险 | `skills/agents/security-reviewer/claude-plugin-dev-mcp-integration` | installed-local-copy |
| mcp-builder | 评估 MCP 服务设计安全性 | `skills/agents/security-reviewer/claude-anthropic-mcp-builder` | installed-local-copy |

## Registry

- 总表：`skills/registry.json`
- Agent 安装索引：[index](../../skills/agents/security-reviewer/index.md)
- 工程内 Skills 目录：`skills/agents/security-reviewer/`

## 使用规则

- 按 Lead 任务单确认是否需要启用相关能力。
- 启用前读取对应工程内 Skill 的 `SKILL.md`，并只读取完成任务所需的最小材料。
- 安装或更新 Skills 前先检查安全边界，必要时交由 Security-Reviewer 审查。
- 本文件只维护 Agent 结构内的导航和边界说明。
