---
id: "tools-commands-ai-self-learn"
title: "自学习指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 自学习指令

## 用途

生成自学习改进建议。v2 实现，v1.0 只保留建议输出，不自动修改 Agent、Rules、Skills、MCP。

## 输入

- 任务日志范围。
- 失败复盘或重复任务来源。

## 流程

1. 读取 `index/INDEX.md`。
2. 读取任务日志摘要。
3. 读取失败复盘。
4. 生成改进建议。
5. 写入 `lab/proposals/`。
6. 写入日志。
7. 输出结果。

## 读取文件

- `index/INDEX.md`
- `logs/`
- `memory/candidates/`
- `kb/candidates/`
- `index/STATUS.md`

## 修改文件

- `lab/proposals/`
- `logs/command/`

## 安全边界

- v1.0 不自动修改核心 Agent、规则、Skills 或 MCP。
- 不得把敏感信息写入建议。

## 输出

- 用户响应中的执行结果摘要。
- 指令对应目录中的产物、日志或报告。
- 需要人工确认时，输出明确的确认项和风险。

## 验证方式

- 建议应包含来源、问题、建议、影响范围和是否需要人工确认。

## 日志

- `logs/command/`
