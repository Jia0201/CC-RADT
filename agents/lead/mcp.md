---
id: agents-lead-mcp
title: "Lead 主 Agent MCP 指引"
type: agent-mcp
scope: project
owner: role
status: active
---
# Lead 主 Agent MCP 指引

## 具体索引

- Agent MCP 索引：[index](../../mcp/agents/lead/index.md)
- 全局 MCP 索引：[index](../../mcp/index.md)
- 共享 MCP 配置：[index](../../mcp/shared/index.md)
- MCP registry：[registry](../../mcp/registry.json)
- MCP 安全规则：[mcp-policy](../../security/mcp-policy.md)

## 当前绑定

- `context7`（`ai-teams-context7`）：默认启用，配置文件 `.mcp.json`。框架、库、API 和版本文档辅助查询。
- `filesystem`（`ai-teams-filesystem`）：可选启用，配置文件 `mcp/optional-servers.mcp.example.json`。受限路径文件访问。
- `github`（`ai-teams-github`）：可选启用，配置文件 `mcp/optional-servers.mcp.example.json`。仓库元信息、Issue/PR 协作和代码评审上下文。
- `codegraph`（`ai-teams-codegraph`）：可选启用，配置文件 `mcp/optional-servers.mcp.example.json`。代码图谱、调用关系、影响分析和大范围代码理解。

## 执行要求

1. 使用 MCP 前先确认任务是否需要该 MCP，避免为简单任务增加工具复杂度。
2. 默认 MCP 来自目标项目根目录 `.mcp.json`；可选 MCP 从 `mcp/optional-servers.mcp.example.json` 复制片段后由用户授权启用。
3. 不在 AI-Teams 文件、Claude Code settings 或日志中保存 MCP 密钥值。
4. MCP 不可用时，把缺失原因写入交接，回到 Lead 或 Security-Reviewer 决策。
