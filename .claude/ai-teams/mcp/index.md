---
id: "mcp-index"
title: "MCP 索引"
type: "mcp-index"
scope: "project"
owner: "doc"
status: active
---
# MCP 索引

AI-Teams 的 MCP 采用可迁移项目配置：Claude Code 项目级 MCP 配置文件是目标项目根目录的 `.mcp.json`。AI-Teams 只在 `mcp/registry.json` 记录服务器用途、Agent 绑定、安全边界和可选配置模板，不记录本机绝对路径、密钥、token 或证书。

## 配置文件

| 文件 | 用途 |
|---|---|
| `.mcp.json` | Claude Code 项目级 MCP 配置，打包后位于目标项目根目录。 |
| `mcp/claude-project.mcp.json` | AI-Teams 维护的项目级 MCP 标准配置副本。 |
| `mcp/optional-servers.mcp.example.json` | 可选 MCP 示例，使用环境变量占位符，不保存密钥值。 |
| `mcp/registry.json` | MCP registry，记录 Agent 绑定和安全边界。 |
| `security/mcp-policy.md` | MCP 安装、启用、密钥和权限边界规则。 |

## 项目级默认配置服务器

| MCP | 配置名 | 状态 | 密钥 | 配置文件 | 用途 |
|---|---|---|---|---|---|
| `chrome` | `ai-teams-chrome` | 默认配置 | 无需密钥 | `.mcp.json` | Chrome MCP 浏览器自动化、页面检查、回归验证、截图、网络观察和当前 Chrome 会话辅助。 |
| `context7` | `ai-teams-context7` | 默认配置 | 无需密钥 | `.mcp.json` | 框架、库、API 和版本文档辅助查询。 |
| `shadcn` | `ai-teams-shadcn` | 默认配置 | 无需密钥 | `.mcp.json` | Web 前端组件参考和 UI 实现辅助。 |
| `filesystem` | `ai-teams-filesystem` | 默认配置 | 无需密钥 | `.mcp.json` | 受限路径文件访问。 |
| `figma` | `ai-teams-figma` | 默认配置 | 需要环境变量/用户授权 | `.mcp.json` | 设计稿结构读取、图片导出和 UI 对齐。 |
| `mysql` | `ai-teams-mysql` | 默认配置 | 需要环境变量/用户授权 | `.mcp.json` | 数据库结构、迁移校验、服务端数据访问问题定位或 QA 数据验证。 |
| `github` | `ai-teams-github` | 默认配置 | 需要环境变量/用户授权 | `.mcp.json` | 仓库元信息、Issue/PR 协作和代码评审上下文。 |
| `codegraph` | `ai-teams-codegraph` | 默认配置 | 无需密钥 | `.mcp.json` | 代码图谱、调用关系、影响分析和大范围代码理解。 |
| `puppeteer` | `ai-teams-puppeteer-fallback` | 默认配置 | 无需密钥 | `.mcp.json` | Chrome MCP 不可用时的历史浏览器自动化 fallback。 |
| `canva` | `ai-teams-canva-remote` | 默认配置 | 需要环境变量/用户授权 | `.mcp.json` | Canva 设计资产协作。 |

## 可选模板

`mcp/optional-servers.mcp.example.json` 保留为扩展模板和用户自定义参考。AI-Teams 内置共享 MCP 默认进入项目级 `.mcp.json`。

## Agent 绑定入口

- 总索引：[index](./agents/index.md)
- 共享配置说明：[index](./shared/index.md)
- CodeGraph：[index](./codegraph/index.md)

## 使用规则

1. AI-Teams 共享 MCP 必须默认写入目标项目根目录 `.mcp.json`。
2. 需要密钥或远程授权的 MCP 只写环境变量占位符，密钥由用户本机私有环境变量或本地私有配置提供。
3. Agent 使用 MCP 前先读取自己的 `agents/<agent>/mcp.md` 和 `mcp/agents/<agent>/index.md`。
4. QA 浏览器自动化优先使用 `ai-teams-chrome`。
5. 大范围代码理解和调用关系分析优先检查 CodeGraph 是否可用；未启用时按 `mcp/codegraph/agent-policy.md` 使用本地扫描替代。
