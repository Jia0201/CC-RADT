---
id: "project-graph-template"
title: "项目知识图谱模板"
type: "template"
scope: "project"
owner: "doc"
status: active
---
# 项目知识图谱模板

本模板用于项目初始化时创建或更新 `project/graph.md`。它记录目标项目在 AI-Teams 内部的知识节点关系，不替代 `project/PROJECT.md`、`project/project-profile.md`、`project/architecture.md`、`project/commands.md` 等项目管理文件。

## 基础信息

- 更新时间：YYYY-MM-DD HH:mm
- 目标项目：`<target-project-path>`
- 主要语言：`<language>`
- 框架：`<framework>`
- 包管理器：`<package-manager>`
- CodeGraph 索引：`<present|missing>`

## 图谱

```mermaid
graph TD
  Target["目标项目"] --> Profile["project/project-profile.md"]
  Target --> Architecture["project/architecture.md"]
  Target --> Commands["project/commands.md"]
  Target --> Verification["project/verification.md"]
  Target --> Risks["project/risks.md"]
  Target --> Graph["project/graph.md"]
  Graph --> KBGraph["kb/graph.md"]
  Graph --> 标准 Markdown["index/NAVIGATION.md"]
  Graph --> CodeGraph["index/CODEGRAPH.md"]
```

## 项目入口

- `<entry>`

## 文档入口

- `<doc>`

## 常用命令

- `<command>`

## 维护规则

1. 初始化脚本只写 AI-Teams 管理文件，不修改目标项目业务代码。
2. 图谱节点优先使用 标准 Markdown 链接，执行路径使用代码路径。
3. CodeGraph 可用时，项目图谱记录索引状态，不把调用细节复制到本文。
4. 敏感文件只记录存在或风险，不记录内容。
