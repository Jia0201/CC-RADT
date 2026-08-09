---
id: "templates-project-graph-readme"
title: "项目知识图谱模板说明"
type: "template-doc"
scope: "project"
owner: "doc"
status: active
---
# 项目知识图谱模板说明

`templates/project-graph/template.md` 用于初始化目标项目时创建 `project/graph.md`。该图谱描述目标项目与 AI-Teams 项目管理文件、知识图谱、标准 Markdown 入口和 CodeGraph 状态之间的关系。

## 使用者

- Lead：确认初始化是否完成。
- Doc：维护项目图谱、标准 Markdown 链接和文档关系。
- Memory：只读取图谱中的恢复线索，不把图谱当作正式记忆。

## 边界

- 不写动作规则。
- 不写敏感内容。
- 不替代 `kb/graph.md`，只作为当前目标项目的局部图谱。
