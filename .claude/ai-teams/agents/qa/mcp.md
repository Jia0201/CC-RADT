---
id: agents-qa-mcp
title: "QA 测试与代码评审 Agent MCP 指引"
type: agent-mcp
scope: project
owner: role
status: active
---
# QA 测试与代码评审 Agent MCP 指引

## 具体索引

- Agent MCP 索引：[index](../../mcp/agents/qa/index.md)
- 全局 MCP 索引：[index](../../mcp/index.md)
- 共享 MCP 配置：[index](../../mcp/shared/index.md)
- MCP registry：[registry](../../mcp/registry.json)
- MCP 安全规则：[mcp-policy](../../security/mcp-policy.md)

## 当前绑定

- `chrome`（`ai-teams-chrome`）：默认启用，配置文件 `.mcp.json`。Chrome MCP 浏览器自动化、页面检查、回归验证、截图、网络观察和当前 Chrome 会话辅助。
- `puppeteer`（`ai-teams-puppeteer-fallback`）：可选启用，配置文件 `mcp/optional-servers.mcp.example.json`。Chrome MCP 不可用时的历史浏览器自动化 fallback。
- `mysql`（`ai-teams-mysql`）：可选启用，配置文件 `mcp/optional-servers.mcp.example.json`。数据库结构、迁移校验、服务端数据访问问题定位或 QA 数据验证。
- `github`（`ai-teams-github`）：可选启用，配置文件 `mcp/optional-servers.mcp.example.json`。仓库元信息、Issue/PR 协作和代码评审上下文。
- `context7`（`ai-teams-context7`）：默认启用，配置文件 `.mcp.json`。框架、库、API 和版本文档辅助查询。
- `filesystem`（`ai-teams-filesystem`）：可选启用，配置文件 `mcp/optional-servers.mcp.example.json`。受限路径文件访问。
- `codegraph`（`ai-teams-codegraph`）：可选启用，配置文件 `mcp/optional-servers.mcp.example.json`。代码图谱、调用关系、影响分析和大范围代码理解。

## 执行要求

1. 使用 MCP 前先确认任务是否需要该 MCP，避免为简单任务增加工具复杂度。
2. 默认 MCP 来自目标项目根目录 `.mcp.json`；可选 MCP 从 `mcp/optional-servers.mcp.example.json` 复制片段后由用户授权启用。
3. 不在 AI-Teams 文件、Claude Code settings 或日志中保存 MCP 密钥值。
4. MCP 不可用时，把缺失原因写入交接，回到 Lead 或 Security-Reviewer 决策。
