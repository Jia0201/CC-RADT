---
id: "agents-qa-skills"
title: "QA Skills 指针"
type: "agent-skills-link"
scope: "agent"
owner: "role"
status: active
---
# QA Skills 指针

本文件记录 QA 与 Skills 的连接关系。Agent 主入口保留为 `agents/qa/qa.md`。

## 已登记 Skills

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| webapp-testing | Web 端回归、截图和交互验证 | `skills/agents/qa/claude-anthropic-webapp-testing` | installed-local-copy |
| tdd | 检查测试覆盖与红绿重构闭环 | `skills/agents/qa/tdd` | installed-local-copy |
| diagnose | 复现、最小化和定位缺陷 | `skills/agents/qa/diagnose` | installed-local-copy |
| triage | 缺陷分级、阻塞判断和验收状态管理 | `skills/agents/qa/triage` | installed-local-copy |

## Registry

- 总表：`skills/registry.json`
- 第三方来源与许可证：`THIRD_PARTY_NOTICES.md`
- Agent 安装索引：[index](../../skills/agents/qa/index.md)
- 工程内 Skills 目录：`skills/agents/qa/`

## 使用规则

- 按 Lead 任务单确认是否需要启用相关能力。
- 启用前读取对应工程内 Skill 的 `SKILL.md`，并只读取完成任务所需的最小材料。
- 安装或更新 Skills 前先检查安全边界，必要时交由 Security-Reviewer 审查。
- 本文件只维护 Agent 结构内的导航和边界说明。
