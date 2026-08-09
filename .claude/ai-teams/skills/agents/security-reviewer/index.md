---
id: "skills-agents-security-reviewer-index"
title: "Security-Reviewer Skills 安装索引"
type: "skills-index"
scope: "agent"
owner: "role"
status: active
---
# Security-Reviewer Skills 安装索引

本文件登记 Security-Reviewer 当前可用 Skills。所有已引用 Skills 已复制到 AI-Teams 工程内，发布时不依赖外部目录。

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| diagnose | 安全失败、命令风险和异常行为复盘 | `skills/agents/security-reviewer/diagnose` | installed-local-copy |
| hook-development | 审查和设计 Hook 安全边界 | `skills/agents/security-reviewer/claude-plugin-dev-hook-development` | installed-local-copy |
| warn-env-file-edits | 编写或审查 hookify 规则 | `skills/agents/security-reviewer/claude-hookify-writing-rules` | installed-local-copy |
| mcp-integration | 审查 MCP 集成和配置风险 | `skills/agents/security-reviewer/claude-plugin-dev-mcp-integration` | installed-local-copy |
| mcp-builder | 评估 MCP 服务设计安全性 | `skills/agents/security-reviewer/claude-anthropic-mcp-builder` | installed-local-copy |

## 使用规则

1. 按 Lead 任务单判断是否启用 Skill。
2. 启用前读取工程内 Skill 的 `SKILL.md`，只读取完成当前任务所需内容。
3. 不读取 Skill 目录下的敏感配置、token、credentials、证书或私有环境变量。
4. 新增、移除或替换 Skill 后更新 `skills/registry.json`、本文件、`agents/security-reviewer/skills.md` 和 `kb/graph.md`。
