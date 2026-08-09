---
description: AI-Teams 全局规则路由入口
---
# AI-Teams 全局规则路由

每次请求先定位 .claude/ai-teams 为 `AI_TEAMS_ROOT`，读取 .claude/ai-teams/index/ENTRY.md 的必要段落，再进入 .claude/ai-teams/rule/index.md。非平凡任务必须由 Lead 调度 AI-Teams 12 个具名 Agent，不把任务拆给默认 `general-purpose`。

最小读取链：

1. .claude/ai-teams/rule/index.md
2. .claude/ai-teams/rule/agents/<agent>.md
3. .claude/ai-teams/rule/tasks/index.md
4. .claude/ai-teams/rule/custom/index.md 中命中的自建规则
5. 当前任务需要的 rule/project/、rule/security/、rule/shared/、rule/memory/、rule/tools/ 或 rule/catalog/ 路由

只有规则索引缺失、过期或与代码冲突时，才扩大到项目正文、CodeGraph 或源码检索。
