---
id: "kb-agents-memory-03-code-style"
title: "Memory 写作格式"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Memory 写作格式

## 正式记忆格式

- 什么时候使用：写入共享或 Agent 长期记忆。
- Codex 要遵守：每条记忆包含事实、来源、适用范围、更新时间、复核触发条件。

## 压缩摘要格式

- 什么时候使用：会话过长、任务需要恢复、Hook 提示压缩。
- Codex 要遵守：写当前目标、已完成、未完成、关键文件、验证结果、风险、下一步，不复制大段原文。

## 候选格式

- 什么时候使用：事实未稳定但可能长期有用。
- Codex 要遵守：标明为什么可能重要、需要谁复核、何时转正或丢弃。
