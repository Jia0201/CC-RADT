---
id: "agents-dev-backend-systems-skills"
title: "Dev-Backend-Systems Skills 指针"
type: "agent-skills-link"
scope: "agent"
owner: "role"
status: active
---
# Dev-Backend-Systems Skills 指针

本文件记录 Dev-Backend-Systems 与 Skills 的连接关系。Agent 主入口保留为 `agents/dev-backend-systems/dev-backend-systems.md`。

## 已登记 Skills

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| tdd | 系统后端和 Java/C/C++ 改动的测试先行流程 | `skills/agents/dev-backend-systems/tdd` | installed-local-copy |
| diagnose | 复杂构建、性能、并发或回归问题定位 | `skills/agents/dev-backend-systems/diagnose` | installed-local-copy |
| improve-codebase-architecture | 识别架构改进点和边界问题 | `skills/agents/dev-backend-systems/improve-codebase-architecture` | installed-local-copy |
| karpathy-guidelines | 降低编码、重构和评审中的常见错误 | `skills/agents/dev-backend-systems/karpathy-guidelines` | installed-local-copy |
| code-documentation | 生成或改进接口、模块和构建文档 | `skills/agents/dev-backend-systems/code-documentation` | installed-local-copy |

## Registry

- 总表：`skills/registry.json`
- Agent 安装索引：[index](../../skills/agents/dev-backend-systems/index.md)
- 工程内 Skills 目录：`skills/agents/dev-backend-systems/`

## 使用规则

- 按 Lead 任务单确认是否需要启用相关能力。
- 启用前读取对应工程内 Skill 的 `SKILL.md`，并只读取完成任务所需的最小材料。
- 安装或更新 Skills 前先检查安全边界，必要时交由 Security-Reviewer 审查。
- 本文件只维护 Agent 结构内的导航和边界说明。
