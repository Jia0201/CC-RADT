---
id: "mcp-agents-doc-index"
title: "Doc 文档管理 Agent MCP 索引"
type: "mcp-index"
scope: "project"
owner: "doc"
status: active
---
# Doc 文档管理 Agent MCP 索引

## 读取顺序

1. [doc](../../../agents/doc/doc.md)
2. [mcp](../../../agents/doc/mcp.md)
3. [index](./index.md)
4. [mcp-policy](../../../security/mcp-policy.md)
5. [registry](../../registry.json)

## MCP 绑定

| MCP | 配置名 | 状态 | 配置文件 | 使用场景 | 安全边界 |
|---|---|---|---|---|---|
| `context7` | `ai-teams-context7` | 默认启用 | `.mcp.json` | 框架、库、API 和版本文档辅助查询。 | 只作为文档和库参考查询；不得替代目标项目本地规则和官方文档验证。 |
| `figma` | `ai-teams-figma` | 可选启用 | `mcp/optional-servers.mcp.example.json` | 设计稿结构读取、图片导出和 UI 对齐。 | Figma API Key 只允许保存在用户本机私有配置或环境变量中，工程只保存占位符。 |
| `canva` | `ai-teams-canva-remote` | 可选启用 | `mcp/optional-servers.mcp.example.json` | Canva 设计资产协作。 | 远程 MCP 默认禁用，必须由用户明确确认 URL、账号、授权范围和是否允许外部网络调用。 |
| `filesystem` | `ai-teams-filesystem` | 可选启用 | `mcp/optional-servers.mcp.example.json` | 受限路径文件访问。 | 必须限制 allowed paths；敏感文件仍按 security/sensitive-files.md 只检测存在，不读取内容。 |
| `codegraph` | `ai-teams-codegraph` | 可选启用 | `mcp/optional-servers.mcp.example.json` | 代码图谱、调用关系、影响分析和大范围代码理解。 | 只索引授权目标项目；敏感文件仍按 security/sensitive-files.md 处理。 |

## 使用要求

- 默认启用的 MCP 应在目标项目根目录 `.mcp.json` 中可用。
- 可选 MCP 只有在任务明确需要且用户提供必要授权后才启用。
- 任何 MCP 返回内容都不能覆盖目标项目本地事实、测试结果和安全规则。
- 发现 MCP 缺失时，记录到任务交接或回流，不要假装工具已可用。
