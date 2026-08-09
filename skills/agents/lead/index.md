---
id: "skills-agents-lead-index"
title: "Lead Skills 安装索引"
type: "skills-index"
scope: "agent"
owner: "role"
status: active
---
# Lead Skills 安装索引

本文件登记 Lead 当前可用 Skills。所有已引用 Skills 已复制到 AI-Teams 工程内，发布时不依赖外部目录。

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| triage | 任务分诊、优先级判断和路由决策 | `skills/agents/lead/triage` | installed-local-copy |
| diagnose | 复杂失败的复盘、定位和恢复路径设计 | `skills/agents/lead/diagnose` | installed-local-copy |
| zoom-out | 跨模块任务时进行高层上下文检查 | `skills/agents/lead/zoom-out` | installed-local-copy |
| handoff | 长任务或交接前生成可恢复摘要 | `skills/agents/lead/handoff` | installed-local-copy |
| claude-automation-recommender | 评估 hooks、subagents、skills、MCP 的自动化建议 | `skills/agents/lead/claude-claude-code-setup-claude-automation-recommender` | installed-local-copy |

## 使用规则

1. 按 Lead 任务单判断是否启用 Skill。
2. 启用前读取工程内 Skill 的 `SKILL.md`，只读取完成当前任务所需内容。
3. 不读取 Skill 目录下的敏感配置、token、credentials、证书或私有环境变量。
4. 新增、移除或替换 Skill 后更新 `skills/registry.json`、本文件、`agents/lead/skills.md` 和 `kb/graph.md`。
