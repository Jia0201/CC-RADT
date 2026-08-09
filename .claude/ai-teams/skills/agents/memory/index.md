---
id: "skills-agents-memory-index"
title: "Memory Skills 安装索引"
type: "skills-index"
scope: "agent"
owner: "role"
status: active
---
# Memory Skills 安装索引

本文件登记 Memory 当前可用 Skills。所有已引用 Skills 已复制到 AI-Teams 工程内，发布时不依赖外部目录。

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| handoff | 将会话压缩为可恢复交接材料 | `skills/agents/memory/handoff` | installed-local-copy |
| session-report | 生成会话使用和上下文报告 | `skills/agents/memory/claude-session-report-session-report` | installed-local-copy |
| zoom-out | 从长上下文中提取高层恢复线索 | `skills/agents/memory/zoom-out` | installed-local-copy |

## 使用规则

1. 按 Lead 任务单判断是否启用 Skill。
2. 启用前读取工程内 Skill 的 `SKILL.md`，只读取完成当前任务所需内容。
3. 不读取 Skill 目录下的敏感配置、token、credentials、证书或私有环境变量。
4. 新增、移除或替换 Skill 后更新 `skills/registry.json`、本文件、`agents/memory/skills.md` 和 `kb/graph.md`。
