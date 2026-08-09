---
id: "tools-commands-ai-self-learn"
title: "自学习指令"
type: "command"
scope: "project"
owner: "lead"
status: planned
---
# 自学习指令

## 用途

自学习体系属于 v2 能力。v1.0 运行包不包含工程实验室，也不自动修改 Agent、Security、Skills、MCP 或记忆规则。

本指令在安装包中只作为只读占位：用于说明当前不执行自动自学习闭环。

## 允许动作

1. 读取 index/INDEX.md。
2. 读取 `logs/` 索引和任务摘要。
3. 输出人工可读的改进建议。

## 禁止动作

1. 不写入工程实验室，安装包不包含实验室目录。
2. 不自动修改 Agent、规则、Skills、MCP、Hooks 或安全策略。
3. 不把敏感信息写入日志、记忆或知识库。

## 输出

- 当前安装包不启用自学习自动写入。
- 如需沉淀可复用知识，由 Doc 按 `kb/` 规则处理；如需长期恢复事实，由 Memory 按 `memory/` 规则处理。
