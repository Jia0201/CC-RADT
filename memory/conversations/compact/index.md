---
id: "memory-conversations-compact-index"
title: "上下文压缩"
type: "memory"
scope: "project"
owner: "memory"
status: active
---
# 上下文压缩

## 用途

保存长任务、多 Agent 协作、阶段完成、即将 QA、即将升级、即将打包或会话结束时生成的上下文压缩摘要。

## 写入规则

- 只保存恢复任务所需的摘要。
- 不保存敏感信息。
- 不直接作为正式记忆。
- 可生成记忆候选到 `memory/candidates/`。
- 可生成知识库候选到 `kb/candidates/`。
