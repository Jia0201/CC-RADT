---
id: "tools-memory-readme"
title: "记忆工具"
type: "tool-doc"
scope: "project"
owner: "lead"
status: active
---
# 记忆工具

## 用途

保存记忆刷新、候选记忆和正式记忆维护说明。

## 状态

v1.0 已定义记忆目录、刷新规则和模板。

## 输入

- 任务摘要。
- 交接记录。
- 上下文压缩摘要。
- `templates/memory-store/template.md`。

## 输出

- `memory/MEMORY.md`
- `memory/agents/*/MEMORY.md`
- `memory/candidates/`

## 安全边界

- 不保存原始日志全文。
- 不保存大段代码。
- 不保存敏感信息。
- 不确定内容先进入候选，不直接写入正式记忆。

## 后续增强

- 增加候选记忆合并脚本。
- 增加过期记忆标记脚本。
- 增加记忆与知识库边界检查。
