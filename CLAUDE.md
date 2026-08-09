# CC-RADT Claude Code 入口

@index/ENTRY.md

## 源工程约束

- 当前仓库是 CC-RADT Harness 源工程，v1 运行命名空间保留为 `ai-teams`，工程地图以 `index/ENTRY.md` 为准。
- Claude Code 官方规则由 `.claude/rules/*.md` 加载，具名子 Agent 由 `.claude/agents/*.md` 加载。
- 非平凡任务默认由 Lead 调度 AI-Teams 具名 Agent，不使用 `general-purpose` 替代团队成员。
- 修改源工程前读取当前 Agent 路由、任务路由和必要安全规则，不一次性加载全部文档。
- 敏感文件默认不读取；删除、不可逆命令、权限、Hooks、MCP、Skills 和生产配置变更先经 Security-Reviewer。
- 目标项目事实写入 `project/`，协作状态写入 `shared/`，正式记忆写入 `memory/`，稳定知识写入 `kb/`。
- 新增、移动或删除文件后更新标准 Markdown 链接、目录索引和必要关系图，并运行工程自检。
