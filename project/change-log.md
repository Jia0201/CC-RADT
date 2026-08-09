---
id: "project-change-log"
title: "目标项目代码提交变化"
type: "project-state"
scope: "project"
owner: "doc"
status: active
---
# 目标项目代码提交变化

本文件由 `UserPromptSubmit` 阶段的 `git-activity-watch` 在每次需求进入时刷新，供所有 Agent 在开始工作前了解目标项目最近变化。

只记录有限数量的提交元数据、变更文件名、影响分类和远端待同步状态，不保存 diff、提交正文、历史代码或敏感文件内容。Git 不可用、没有仓库、权限不足或远端检查失败时静默跳过，不阻塞需求执行。

远端待同步提交尚未进入当前工作树，只能作为提醒；合入后才可作为当前项目事实。

<!-- AI-TEAMS:git-project-sync:BEGIN -->
## 最近一次需求前 Git 同步

- 状态：尚未执行目标项目 Git 同步。
<!-- AI-TEAMS:git-project-sync:END -->
