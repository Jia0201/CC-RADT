---
id: "shared-escalations-index"
title: "升级与回流索引"
type: "shared-doc"
scope: "project"
owner: "lead"
status: active
---
# 升级与回流索引

本目录保存 attempt >= 4 后的回流、升级和 Lead 仲裁记录。

AI-Teams 不在 Claude Code 配置目录保存工程本体；活动回流写入 `shared/escalations/pending/`，关闭归档写入 `shared/escalations/resolved/`。

## 目录

- `shared/escalations/retry-flowback.md`：重试与回流协议。
- `shared/escalations/ESCALATION_TEMPLATE.md`：回流记录模板。
- `shared/escalations/pending/`：待复核或待仲裁。
- `shared/escalations/resolved/`：已复核并关闭。

## 文件要求

每个 escalation 文件应包含：

- 任务 ID。
- 原 Owner。
- attempt 记录。
- 失败摘要。
- 回流目标。
- 复核三问结果。
- Lead 仲裁结论。
- 任务是否修订、撤销或重开。
