---
id: "tools-codegraph-readme"
title: "CodeGraph 工具区域"
type: "tool-doc"
scope: "project"
owner: "lead"
status: active
---
# CodeGraph 工具区域

## 用途

该目录保存 CodeGraph 检测、初始化、状态同步、MCP 配置和 Agent 调用机制的工具说明。

## 状态

v1.0 记录机制、调用规则和最小检测脚本已创建。

## 输入

- 目标项目路径。
- `.codegraph/` 是否存在。
- `mcp/registry.json` 中的 CodeGraph 状态。
- CodeGraph CLI / MCP 是否可用。

## 输出

- `index/FILES.md` 中的 CodeGraph 状态。
- `mcp/registry.json` 中的 CodeGraph 配置。
- `logs/command/` 或 `logs/audit/` 中的检测记录。
- Dev / QA 任务报告中的 CodeGraph 使用记录。

## 可执行入口

```bash
bash tools/bin/ai-teams-codegraph-status.sh --target /path/to/project --write-index
```

## 安全边界

- 不读取敏感文件内容。
- `.codegraph/` 不进入正式版发布包。
- CodeGraph 查询结果不直接写入正式知识库，需 Doc 验证。
- MCP 配置不得写入密钥、token 或私有凭据。

## 后续增强

- 检测 `.codegraph/` 是否过期。
- 检测 MCP 是否可用。
- 将检测结果同步写入 `mcp/registry.json`。
- 为 Dev / QA 输出可复制的 CodeGraph 查询建议。
