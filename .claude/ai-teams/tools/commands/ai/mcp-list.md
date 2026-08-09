---
id: "tools-commands-ai-mcp-list"
title: "MCP 查询指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# MCP 查询指令

## 用途

查询当前工程登记的项目级 MCP、默认 MCP、可选 MCP、Agent 绑定和 CodeGraph 状态。

## 输入

- 可选 Agent 名称。
- 可选 MCP 配置是否需要人工启用。

## 可执行入口

```bash
bash tools/bin/ai-teams-mcp-list.sh
bash tools/bin/ai-teams-mcp-list.sh --agent <Agent名称>
```

## 流程

1. 读取 `index/INDEX.md`。
2. 读取 `mcp/registry.json`。
3. 查询 `.mcp.json` 和 `mcp/claude-project.mcp.json` 中登记的默认项目 MCP。
4. 查询 `mcp/optional-servers.mcp.example.json` 中登记的可选 MCP 模板。
5. 查询 `mcp/agents/<agent>/index.md` 中登记的 Agent 绑定。
6. 查询 CodeGraph MCP 配置说明。
7. 输出 MCP 状态报告。

## 读取文件

- `index/INDEX.md`
- `mcp/index.md`
- `mcp/shared/index.md`
- `mcp/agents/index.md`
- `mcp/registry.json`
- `.mcp.json`
- `mcp/claude-project.mcp.json`
- `mcp/optional-servers.mcp.example.json`
- `index/AGENTS.md`
- `index/FILES.md`
- `security/mcp-policy.md`

## 修改文件

- `logs/command/`

## 安全边界

- 不读取 MCP 私有密钥或本地凭据。
- 只展示 registry 中允许展示的配置名、包名、环境变量名和安全边界。
- 可选 MCP 模板不得被解释为已启用；必须由用户确认授权范围后再启用。
- 不展示或写入本机用户目录绝对路径。

## 输出

- 用户响应中的执行结果摘要。
- 指令对应目录中的产物、日志或报告。
- 需要人工确认时，输出明确的确认项和风险。

## 验证方式

- 确认 JSON 可解析。
- 确认 `.mcp.json` 包含 `mcp/registry.json` 中登记的全部共享 MCP。
- 确认 Agent 名称存在。
- 确认 QA 绑定中包含 `chrome`。

## 日志

- `logs/command/`
