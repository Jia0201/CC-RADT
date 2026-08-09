---
id: ADR-0006
title: 轻量锁机制
type: adr
scope: project
status: accepted
date: 2026-06-02
owner: doc
decision_by: lead
---
# ADR-0006：轻量锁机制

## 1. 背景

AI-Teams 多 Agent 并行工作时，需要避免多个 Agent 同时写同一份共享文件或受保护文件。但 v1.0 非目标明确不实现复杂权限系统和复杂锁状态机。

## 2. 决策

> 我们决定：AI-Teams v1.0 使用轻量锁机制，锁记录集中在 `shared/locks/LOCKS.md`，文件所有权集中在 `security/file-ownership.md`。

锁用于协作提醒和冲突避免，不承担复杂事务能力。

## 3. 原因

- 轻量锁符合 v1.0 清晰可执行的目标。
- 复杂状态机会增加维护成本，不适合主工程创建阶段。
- 文件所有权和锁分开记录，既能说明长期边界，也能记录当前占用。

## 4. 影响范围

- 目录：`shared/locks/`, `security/`。
- Agent：Lead, Security-Reviewer, 所有写文件的 Agent。
- 规则：写受保护范围前检查锁和 Owner。
- 工具：Hook 可检查受保护文件锁状态。
- 安全：删除和高风险修改仍需要用户确认或 Lead 仲裁。

## 5. 后果

### 正面影响

- 协作冲突可见。
- 锁机制轻量，便于人工和 Agent 共同理解。

### 负面影响

- 不保证复杂并发事务。
- 需要 Agent 自觉遵守写入前检查。

### 需要注意

- 锁不是权限系统。
- 发现冲突时停止写入并交给 Lead 复判。

## 6. 关联

- 相关规则：[LOCKS](../../../shared/locks/LOCKS.md), [file-ownership](../../../security/file-ownership.md)
- 相关目录：`shared/locks/`, `security/`
- 相关 Agent：Lead, Security-Reviewer
- 相关任务：共享工作区与安全边界补充
- 替代关系：无
