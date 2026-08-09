---
id: "shared-locks-locks"
title: "锁登记表"
type: "shared-doc"
scope: "project"
owner: "lead"
status: active
---
# 锁登记表

| 锁 ID | 文件范围 | 持有人 | 任务 | 状态 | 创建时间 | 过期时间 | 释放时间 | 说明 |
|---|---|---|---|---|---|---|---|---|

## 状态值

- active
- released
- expired
- cancelled

## 受保护范围

- `memory/`
- `kb/`
- `project/`
- `shared/tasks/`
- `shared/handoffs/`
- `security/`
- `hooks/`
- `tools/commands/`
- `tools/bin/`
- `.claude/settings.json`
- `.claude/settings.local.example.json`
- `CLAUDE.md`
- `index/`

## 规则

1. 修改受保护范围前登记锁。
2. 多文件锁按 [lock-policy](../../security/lock-policy.md) 处理。
3. 完成受保护编辑后释放锁。
4. 过期锁由 Lead 检查。
5. 每日日志压缩时同步检查锁状态。
6. 潜在死锁必须停止写入并交给 Lead 重排。
