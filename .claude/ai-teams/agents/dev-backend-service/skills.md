---
id: "agents-dev-backend-service-skills"
title: "Dev-Backend-Service Skills 指针"
type: "agent-skills-link"
scope: "agent"
owner: "role"
status: active
---
# Dev-Backend-Service Skills 指针

本文件记录 Dev-Backend-Service 与 Skills 的连接关系。Agent 主入口保留为 `agents/dev-backend-service/dev-backend-service.md`。

## 已登记 Skills

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| tdd | Python / Go / Node.js / TypeScript 服务端功能和缺陷修复的测试先行流程 | `skills/agents/dev-backend-service/tdd` | installed-local-copy |
| diagnose | 服务端异常、接口回归和性能问题定位 | `skills/agents/dev-backend-service/diagnose` | installed-local-copy |
| improve-codebase-architecture | 服务边界、模块耦合和演进建议 | `skills/agents/dev-backend-service/improve-codebase-architecture` | installed-local-copy |
| karpathy-guidelines | 控制实现复杂度并减少编码常见错误 | `skills/agents/dev-backend-service/karpathy-guidelines` | installed-local-copy |
| code-documentation | 记录 API、服务模块和运维命令 | `skills/agents/dev-backend-service/code-documentation` | installed-local-copy |
| build-mcp-server | Node.js / TypeScript 与 Python MCP 服务端、API wrapper 和 Claude 集成设计 | `skills/agents/dev-backend-service/build-mcp-server` | installed-local-copy |

## Registry

- 总表：`skills/registry.json`
- Agent 安装索引：[index](../../skills/agents/dev-backend-service/index.md)
- 工程内 Skills 目录：`skills/agents/dev-backend-service/`

## 使用规则

- 按 Lead 任务单确认是否需要启用相关能力。
- 启用前读取对应工程内 Skill 的 `SKILL.md`，并只读取完成任务所需的最小材料。
- 安装或更新 Skills 前先检查安全边界，必要时交由 Security-Reviewer 审查。
- 本文件只维护 Agent 结构内的导航和边界说明。
