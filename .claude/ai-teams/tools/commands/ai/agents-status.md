---
id: "tools-commands-ai-agents-status"
title: "查询所有 Agent，Agent 状态指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 查询所有 Agent，Agent 状态指令

## 用途

展示所有 Agent 的职责、状态、当前任务、关联 Skills、关联 MCP、最近异常、记忆和知识库路径。

## 输入

- 可选 Agent 名称。
- 是否展示详细路径。

## 流程

1. 读取 `index/INDEX.md`。
2. 读取 `index/AGENTS.md`。
3. 读取 `agents/`。
4. 读取当前任务状态。
5. 读取 Agent 关联 Skills / MCP。
6. 输出 Agent 状态。

## 读取文件

- `index/INDEX.md`
- `index/AGENTS.md`
- `agents/`
- `shared/tasks/`
- `skills/registry.json`
- `mcp/registry.json`

## 修改文件

- `logs/command/`

## 安全边界

- 不读取敏感内容。
- 只展示公开 registry 和路径信息。

## 输出

- 用户响应中的执行结果摘要。
- 指令对应目录中的产物、日志或报告。
- 需要人工确认时，输出明确的确认项和风险。

## 验证方式

- 确认 12 个 Agent 文档存在。
- 确认每个 Agent 有记忆和知识库目录。

## 日志

- `logs/command/`
