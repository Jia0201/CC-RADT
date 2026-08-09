---
id: "templates-kb-file-readme"
title: "知识库文件模板"
type: "template"
scope: "project"
owner: "doc"
status: active
---
# 知识库文件模板

## 用途

用于创建正式知识库条目，并支持 标准 Markdown frontmatter 和标准 Markdown 链接图谱。

## 所有者

Doc Agent 负责维护，Memory Agent 可提供候选事实。

## 使用方式

复制 `template.md` 或 `markdown-template.md` 后填写标题、范围、来源、验证状态和必要的标准 Markdown 关联链接。

## 输出

生成 `kb/` 或 `kb/agents/<agent-name>/` 下的知识库条目，并更新 `kb/graph.md`。
