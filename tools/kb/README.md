---
id: "tools-kb-readme"
title: "知识库工具"
type: "tool-doc"
scope: "project"
owner: "lead"
status: active
---
# 知识库工具

## 用途

保存知识库沉淀、标准 Markdown 链接和图谱维护说明。

## 状态

v1.0 已补齐 标准 Markdown 入口、frontmatter 模板和图谱索引。

## 输入

- 经验证的技术结论。
- 任务复盘中可复用的知识。
- `templates/kb-file/markdown-template.md`。

## 输出

- `kb/` 下的正式知识条目。
- `kb/graph.md` 的标准 Markdown 链接关系。
- `index/NAVIGATION.md` 的知识库入口。

## 安全边界

- 不保存聊天记录全文。
- 不保存原始日志。
- 不保存敏感文件内容。
- CodeGraph 输出需经 Doc 验证后才能沉淀为正式知识。

## 后续增强

- 增加知识库候选自动整理脚本。
- 增加过期知识检查。
- 增加 标准 Markdown 链接完整性检查。
