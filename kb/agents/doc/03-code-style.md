---
id: "kb-agents-doc-03-code-style"
title: "Doc Markdown 格式知识"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Doc Markdown 格式知识

## 标准 Markdown

- 什么时候使用：所有工程文档。
- Codex 要遵守：使用 YAML frontmatter、标准 Markdown 链接、清晰标题；标准 Markdown 链接不写 `.md` 后缀。

## Claude Code 文件引用

- 什么时候使用：需要脚本、Agent 或用户定位文件。
- Codex 要遵守：同时给出真实路径，例如 `project/context.md`；不要只给图谱标准 Markdown 链接。

## Mermaid

- 什么时候使用：流程、决策、图谱、调用链。
- Codex 要遵守：节点 ID 唯一，标签清晰，不把 Mermaid 当作唯一事实来源。

## 中文文档

- 什么时候使用：AI-Teams 工程文档。
- Codex 要遵守：中文为主，避免残留英文占位，如 `TODO`、`Open questions`、`Risk notes`。
