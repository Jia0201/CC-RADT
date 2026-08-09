---
id: "tools-commands-ai-memory-read"
title: "读取记忆指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 读取记忆指令

## 用途

读取共享记忆或指定 Agent 记忆，并输出来源和更新时间。

## 输入

- 记忆范围：共享或指定 Agent。
- 可选主题关键词。

## 流程

1. 读取 `index/INDEX.md`。
2. 读取 `memory/MEMORY.md`。
3. 按需要读取 `memory/shared/`。
4. 按需要读取 `memory/agents/{agent}/`。
5. 输出记忆摘要、来源和更新时间。
6. 输出结果。

## 读取文件

- `index/INDEX.md`
- `memory/MEMORY.md`
- `memory/shared/`
- `memory/agents/`

## 修改文件

- `logs/command/`

## 安全边界

- 不读取敏感文件内容。
- 不把日志全文当记忆输出。

## 输出

- 用户响应中的执行结果摘要。
- 指令对应目录中的产物、日志或报告。
- 需要人工确认时，输出明确的确认项和风险。

## 验证方式

- 确认目标记忆文件存在。
- 确认 Agent 名称存在。

## 日志

- `logs/command/`
