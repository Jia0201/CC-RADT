---
description: AI-Teams 全局规则路由入口
---
# AI-Teams 规则路由

- 进入会话后先定位 `AI_TEAMS_ROOT`：目标项目使用 `.claude/ai-teams`，源工程使用当前仓库根目录；标志文件是 `index/ENTRY.md`。
- 每个请求先读取 `$AI_TEAMS_ROOT/index/ENTRY.md` 的必要段落。非平凡任务由 Lead 调度 AI-Teams 具名 Agent，不得改用 `general-purpose`。
- 非平凡任务先读取 `rule/index.md`，再读取 `rule/agents/<当前-agent>.md` 和 `rule/tasks/index.md`。
- 涉及目标项目时从 `rule/project/index.md` 进入；只有精确找文件时才读取 `rule/project/files.md` 或 `rule/catalog/files.md`。
- 涉及安全、共享状态、记忆或工具时，分别从 `rule/security/index.md`、`rule/shared/index.md`、`rule/memory/index.md`、`rule/tools/index.md` 进入。
- 规则路由只负责定位；安全、项目、Agent、知识、记忆和共享状态的正文仍以其本体目录为准。
- 项目初始化只在用户明确要求时执行；未初始化时不得自动询问或执行初始化，只读取当前任务必需的项目文件并标记未验证事实。
- 新增、移动或删除文件后由 Doc/Role 刷新 `rule/` 索引和标准 Markdown 链接。
