---
id: "security-workspace-policy"
title: "共享工作区规则"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# 共享工作区规则

## 目录职责

- `shared/tasks/`：任务单和执行方案。
- `shared/handoffs/`：Agent 阶段交接。
- `shared/broadcasts/`：多 Agent 广播。
- `shared/decisions/`：当前协作取舍。
- `shared/escalations/`：回流、升级和 resolved 归档。
- `shared/locks/`：锁登记和锁模板。
- `shared/workspace/`：任务临时共享材料。
- `shared/`：协作入口、实时状态和维护结果。

## 写入规则

1. 共享工作区不保存敏感文件内容。
2. 实时状态只写 `shared/`，不写入 KB。
3. 共享区文件关闭或归档时保留可追溯记录。
4. 跨 Agent 协作必须通过任务单、执行方案、交接或广播衔接。
5. 共享工作区规则由 `security/` 管理，本文件为安全入口。
