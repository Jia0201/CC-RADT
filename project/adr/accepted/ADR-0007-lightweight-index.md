---
id: ADR-0007
title: 轻量索引
type: adr
scope: project
status: accepted
date: 2026-06-02
owner: doc
decision_by: lead
---
# ADR-0007：轻量索引

## 1. 背景

AI-Teams 文件数量较多，如果没有索引，Agent 会反复全文搜索，浪费上下文并容易读错入口。但 v1.0 非目标不包含大型索引数据库。

## 2. 决策

> 我们决定：AI-Teams v1.0 使用轻量 Markdown 索引体系，核心入口在 `index/`，标准 Markdown 知识图谱入口在 `kb/graph.md`。

索引用于提速和减少 token 消耗，不是第二知识库。

## 3. 原因

- Markdown 索引足够轻量，符合当前阶段。
- `index/` 负责导航，`kb/` 负责知识，职责不重叠。
- 标准 Markdown 链接能提供图谱，但不替代工程索引。

## 4. 影响范围

- 目录：`index/`, `kb/`, `agents/`, `project/`。
- Agent：Doc, Lead, 所有需要定位文件的 Agent。
- 知识库：图谱关系写入 `kb/graph.md`。
- 工具：自检脚本检查关键索引存在。

## 5. 后果

### 正面影响

- Agent 更容易从正确入口开始工作。
- 索引和知识库边界清楚。
- 后续可平滑接入 CodeGraph 等工具。

### 负面影响

- 索引需要随着结构变化同步更新。

### 需要注意

- 索引只写入口和路由，不写成长篇手册。
- 新增长期结构后要判断是否需要新增 ADR。

## 6. 关联

- 相关规则：[INDEX](../../../index/INDEX.md), [FILES](../../../index/FILES.md), [导航规范](../../../index/NAVIGATION.md)
- 相关目录：`index/`, `kb/`
- 相关 Agent：Doc, Lead
- 相关任务：工程索引与 文档关系图修复
- 替代关系：无
