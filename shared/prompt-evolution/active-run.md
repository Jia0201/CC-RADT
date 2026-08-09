---
id: "shared-prompt-evolution-active-run"
title: "当前提示词演进状态"
type: "shared-state"
scope: "project"
owner: "lead"
status: active
---
# 当前提示词演进状态

该文件是 Lead 汇总的单一活动视图。普通 Agent 和 Hook 不直接抢写本文件；它们先追加事件、候选或评审，Lead 取得文件级锁后再汇总。

## 当前状态

| 字段 | 内容 |
|---|---|
| 运行状态 | idle |
| 任务 ID | 无 |
| 演进 ID | 无 |
| Agent | 无 |
| 等级 | E0 |
| 当前阶段 | 无活动演进 |
| 主 Owner | Lead |
| 候选 | 无 |
| 最新评审 | 无 |
| 上一 active 版本 | 无 |
| 目标版本 | 无 |
| 下一动作 | 等待事件 |
| 更新时间 | 未设置 |

## 活动门禁

| 门禁 | 状态 | 证据 |
|---|---|---|
| 根因确认 | pending |  |
| Owner 确认 | pending |  |
| QA 评测 | pending |  |
| Security 评审 | pending |  |
| Role / Plan-PM 评审 | pending |  |
| Lead 激活决定 | pending |  |
| 用户确认（如需） | not-required |  |
| 回滚目标 | pending |  |

## 并发规则

1. 同一时间只允许一个 Lead 汇总本文件。
2. 修改前按 `security/lock-policy.md` 取得 `shared/prompt-evolution/active-run.md` 文件级锁。
3. 状态必须能追溯到事件、候选和评审路径。
4. 没有活动演进时保持 `idle`，不得保留已结束候选为 active。
5. 激活结束后进入 `monitored`；通过观察窗口后才标记 `stable`。
