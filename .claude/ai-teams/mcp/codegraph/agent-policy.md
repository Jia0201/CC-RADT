---
id: "mcp-codegraph-agent-policy"
title: "CodeGraph Agent 策略"
type: "mcp-doc"
scope: "project"
owner: "doc"
status: active
---
# CodeGraph Agent 策略

## Lead

- 识别代码理解、影响分析、架构定位任务时，要求 Dev / QA 优先使用 CodeGraph。
- 在任务单中记录 CodeGraph 是否可用。

## Dev Agents

- 修改代码前先用 CodeGraph 定位相关符号和调用关系。
- 如果 CodeGraph 不可用，说明回退原因，并使用 `index/` 与 `rg`。
- 大范围修改前使用 `codegraph_impact` 或等效影响分析。

## QA

- 评审时检查 Dev 是否使用 CodeGraph 或说明未使用原因。
- 对高风险改动使用调用方、被调用方和影响范围查询。

## Doc

- 根据 CodeGraph 验证结果更新架构文档或知识库候选。
- 不保存未验证的推断。

## Security-Reviewer

- 检查 CodeGraph 初始化和 MCP 配置是否包含敏感路径、密钥或私有 token。
- CodeGraph 索引目录 `.codegraph/` 不应进入安装包发布包。
