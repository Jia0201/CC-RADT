---
id: "memory-archive-index"
title: "记忆归档索引"
type: "memory-index"
scope: "project"
owner: "memory"
status: active
---
# 记忆归档索引

`memory/archive/` 保存已经不再作为当前恢复依据、但仍需保留来源关系的历史记忆材料。

## 使用边界

1. 归档不是删除；删除仍按 [delete-policy](../../security/delete-policy.md)。
2. 归档材料不得包含 `.env`、密钥、证书、token、credentials 等敏感内容。
3. 归档由 Memory Agent 维护；其他 Agent 只能提交候选或交接说明。
4. 被替代的旧事实应说明新事实位置或保留历史原因。

## 当前状态

当前暂无归档记忆。
