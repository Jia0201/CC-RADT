---
id: "shared-locks-lock-template"
title: "锁记录模板"
type: "shared-template"
scope: "project"
owner: "lead"
status: active
---
# 锁记录模板

## 锁信息

- 锁 ID：
- 文件范围：
- 持有人：
- 关联任务：
- 状态：active / released / expired / cancelled
- 创建时间：
- 过期时间：
- 释放时间：

## 锁原因

说明为什么需要锁，是否涉及多 Agent 并行写入、受保护文件、状态板或共享模板。

## 等待关系

| 等待方 | 等待文件 | 被谁持有 | 预计释放 | 风险 |
|---|---|---|---|---|

## 死锁检查

- 是否存在 A 等待 B、B 等待 A：
- 是否存在多文件循环等待：
- 是否需要 Lead 释放、拆分或重排：

## 释放条件

- 完成的文件：
- 验证记录：
- 交接记录：
- Lead 确认：
