---
id: ADR-0013
title: 项目初始化改为用户主动操作
type: adr
status: accepted
date: 2026-09-06
owner: doc
decision_by: lead
---

# ADR-0013：项目初始化改为用户主动操作

## 1. 背景

启动和普通请求阶段自动询问或执行初始化，会打断用户当前目标，并可能在用户尚未决定建立持久项目画像时改写 Harness 管理文件。初始化应是明确、可预期的用户操作。

## 2. 决策

> 我们决定：项目初始化仅在用户明确要求初始化或明确调用初始化指令时执行。

`SessionStart`、`UserPromptSubmit`、Lead 和子 Agent 不得自动询问、自动执行或写入初始化画像。未初始化时，只读取当前任务必需的项目文件并标记未验证事实；`git-activity-watch` 静默跳过。

## 3. 原因

- 避免启动即打断用户或产生非预期写入。
- 保留用户对项目画像建立时机和目标路径的控制。
- 不影响手动初始化后的 Doc、Memory、Security 和 Git 增量维护链路。

## 4. 影响范围

- 配置：`.claude/settings.json`
- Hooks：`hooks/scripts/ai-teams-run-hook.mjs`
- 规则：`security/project-policy.md`、`playbook.md`
- Agent：12 个 Agent 组件入口
- 工具：项目初始化、打包和自检脚本

## 5. 后果

### 正面影响

- 启动与普通请求不再触发初始化话术或初始化写入。
- 用户仍可随时通过跨平台命令主动初始化。

### 负面影响

- 未手动初始化前，持久项目画像和 Git 增量维护不会自动建立。

### 需要注意

- Agent 必须直接核实当前任务需要的项目事实，不得用“未初始化”作为停止普通任务的理由。

## 6. 关联

- 相关规则：[项目管理规则](../../../security/project-policy.md)
- 相关入口：[Harness 地图](../../../index/ENTRY.md)
- 相关指令：[项目初始化](../../../tools/commands/ai/init-project.md)
- 替代关系：替代启动时强制询问并引导初始化的旧策略
