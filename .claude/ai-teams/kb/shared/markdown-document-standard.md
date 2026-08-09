---
id: kb-markdown-document-standard
title: 标准 Markdown 文档规范
type: knowledge
scope: shared
owner: doc
status: active
---

# 标准 Markdown 文档规范

## 什么时候使用

创建或维护 AI-Teams 的索引、知识库、项目文档、记忆入口、共享工作区和规则说明时使用。

## Codex 与 Claude Code 必须遵守

1. 链接使用标准 Markdown 语法和真实相对路径，目标必须存在。
2. 启动时导入只在官方 `CLAUDE.md` 中使用 `@relative/path.md`。
3. 运行指引使用仓库相对路径或 `$AI_TEAMS_ROOT/...`，不写机器绝对路径。
4. 文档只保留必要元数据，不创建标签表和显式链接清单。
5. Mermaid 图中出现的文件节点必须在正文附近提供可点击的标准 Markdown 链接。
6. 文件移动后同步更新索引并运行工程自检。

## 最小模板

```markdown
---
id: stable-id
title: 文档标题
type: knowledge
scope: shared
owner: doc
status: active
---

# 文档标题

## 适用场景

## 规则或知识

## 相关文件

- [相关入口](../../index/INDEX.md)
```
