---
id: "skills-agents-plan-pm-index"
title: "Plan-PM Skills 安装索引"
type: "skills-index"
scope: "agent"
owner: "role"
status: active
---
# Plan-PM Skills 安装索引

本文件登记 Plan-PM 当前可用 Skills。所有已引用 Skills 已复制到 AI-Teams 工程内，发布时不依赖外部目录。

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| to-issues | 把 PRD 或计划拆成可执行任务 | `skills/agents/plan-pm/to-issues` | installed-local-copy |
| triage | 任务优先级、状态和阻塞分流 | `skills/agents/plan-pm/triage` | installed-local-copy |
| prototype | 在正式实现前做轻量验证方案 | `skills/agents/plan-pm/prototype` | installed-local-copy |
| diagnose | 计划失败、依赖阻塞和回流分析 | `skills/agents/plan-pm/diagnose` | installed-local-copy |

## 使用规则

1. 按 Lead 任务单判断是否启用 Skill。
2. 启用前读取工程内 Skill 的 `SKILL.md`，只读取完成当前任务所需内容。
3. 不读取 Skill 目录下的敏感配置、token、credentials、证书或私有环境变量。
4. 新增、移除或替换 Skill 后更新 `skills/registry.json`、本文件、`agents/plan-pm/skills.md` 和 `kb/graph.md`。
