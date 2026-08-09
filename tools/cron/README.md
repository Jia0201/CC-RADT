---
id: "tools-cron-readme"
title: "定时任务工具"
type: "tool-doc"
scope: "project"
owner: "lead"
status: active
---
# 定时任务工具

## 用途

保存定时任务工具说明。当前定时任务计划位于 `cron/schedules.md`。

## 状态

v1.0 已定义计划和可调用日志清理入口。

## 输入

- 定时任务名称。
- 执行频率。
- 对应脚本入口。
- 输出报告位置。

## 输出

- `cron/schedules.md`
- `logs/command/logs-clean-*.md`
- `logs/compressed/*-clean-plan.md`

## 安全边界

- 定时任务不得读取敏感文件内容。
- 自动清理默认保留审计、升级、安全和压缩目录。
- 高风险任务应先生成计划，再由人工或显式配置执行。

## 可执行入口

```bash
bash tools/bin/ai-teams-logs-clean.sh --before "$(date +%Y-%m-%d)" --plan
```
