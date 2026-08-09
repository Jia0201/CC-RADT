---
id: ADR-0009
title: 规则路由与按需读取
type: adr
status: accepted
date: 2026-06-14
owner: doc
decision_by: lead
---
# ADR-0009：规则路由与按需读取

## 1. 背景

AI-Teams 文件数量持续增长。Agent 如果每次任务都读取全局索引、全部项目画像、安全规则、知识库和组件文档，会造成定位缓慢、上下文噪声和 token 浪费，也容易把无关历史带入当前任务。

## 2. 决策

> 我们决定：在 AI-Teams 工程根目录维护 `rule/` 作为规则路由和完整文件目录；Claude Code 原生 `.claude/rules/` 只保存轻量自动加载适配文件。Agent 必须先读取自己的规则路由和任务路由，再按需读取本体文件。

## 3. 原因

- `rule/` 可以随 AI-Teams 安装包一起迁移，并由 Doc、Role 按职责维护。
- `.claude/rules/` 符合 Claude Code 的项目规则加载方式，可按路径注入最小提示。
- 规则路由不复制安全、知识、记忆或项目事实，避免形成第二套本体。
- 初始化可以自动生成目标项目目录、文件、前端、后端和接口入口。

## 4. 影响范围

- 目录：`rule/`、`.claude/rules/`、`project/`、`index/`。
- Agent：12 个官方 Agent 入口和 12 个组件主文件。
- 规则：按需读取、规则刷新、项目初始化和运行期维护。
- 工具：`tools/bin/ai-teams-rule-refresh.mjs`、项目初始化和打包脚本。
- 文档：`CLAUDE.md`、文档关系图、全局知识图谱、项目图谱。

## 5. 后果

### 正面影响

- Agent 先定位再读取，减少无关上下文。
- 工程和目标项目文件都有可刷新目录。
- 项目 UI、前端语法、后端、接口、决策和方案有稳定入口。

### 负面影响

- 文件移动后必须刷新规则目录。
- 安装包需要同时生成 `.claude/rules/` 适配层并重置目标项目规则快照。

### 需要注意

- `rule/` 不是知识库，也不是安全规则本体。
- 索引与实际代码冲突时，以代码和已确认项目事实为准，并立即刷新索引。

## 6. 关联

- 相关规则：[routing](../../../rule/routing.md), [runtime-maintenance-policy](../../../security/runtime-maintenance-policy.md)。
- 相关目录：`rule/`、`.claude/rules/`。
- 相关 Agent：Lead、Doc、Role、所有执行 Agent。
- 相关工具：`tools/bin/ai-teams-rule-refresh.mjs`。
- 替代关系：扩展 [ADR-0007-lightweight-index](./ADR-0007-lightweight-index.md)，不替代其全局轻量索引定位。
