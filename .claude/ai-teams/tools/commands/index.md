---
id: tools-commands-index
title: 指令主索引
type: command-index
scope: project
owner: lead
status: active
---

# 指令主索引

安装包只包含项目运行与维护指令，不包含安装包/精简安装包打包指令。

| No. | 指令能力 | 指令说明 |
|---:|---|---|
| 1 | 项目初始化 | tools/commands/ai/init-project.md |
| 2 | 外部升级器操作说明（工程内不执行） | tools/commands/ai/upgrade-existing.md |
| 3 | 多余日志清除指令 | tools/commands/ai/logs-clean.md |
| 4 | 自学习指令 | tools/commands/ai/self-learn.md |
| 5 | MCP 查询指令 | tools/commands/ai/mcp-list.md |
| 6 | Skills 查询指令 | tools/commands/ai/skills-list.md |
| 7 | 安装 Skills 指令 | tools/commands/ai/skills-install.md |
| 8 | 安装 MCP 指令 | tools/commands/ai/mcp-install.md |
| 9 | 查询 Hooks 指令 | tools/commands/ai/hooks-list.md |
| 10 | 查询定时任务指令 | tools/commands/ai/cron-list.md |
| 11 | 查询所有 Agent，Agent 状态指令 | tools/commands/ai/agents-status.md |
| 12 | 回滚指令 | tools/commands/ai/rollback.md |
| 13 | 读取记忆指令 | tools/commands/ai/memory-read.md |
| 14 | 刷新记忆指令 | tools/commands/ai/memory-refresh.md |
| 15 | 上下文压缩指令 | tools/commands/ai/context-compact.md |
| 16 | 自建规则创建指令 | tools/commands/ai/rule-create.md |
| 17 | 提示词状态 | tools/commands/ai/prompt-status.md |
| 18 | 提示词进化候选 | tools/commands/ai/prompt-evolve.md |
| 19 | 提示词差异 | tools/commands/ai/prompt-diff.md |
| 20 | 提示词评测 | tools/commands/ai/prompt-eval.md |
| 21 | 提示词激活 | tools/commands/ai/prompt-activate.md |
| 22 | 提示词回滚 | tools/commands/ai/prompt-rollback.md |
| 23 | 提示词历史 | tools/commands/ai/prompt-history.md |

## 边界

- tools/commands/ai/ 保存指令说明。
- tools/bin/ 保存可执行脚本。
- `.claude/` 不保存指令说明或脚本。
- 安装包不包含打包安装包和精简安装包的发布维护指令。
- 自建规则创建指令只写 rule/custom/ 路由和索引；动作规则仍写 `security/`。
