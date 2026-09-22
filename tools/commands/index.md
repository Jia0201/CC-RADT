---
id: tools-commands-index
title: 指令主索引
type: command-index
scope: project
owner: lead
status: active
---

# 指令主索引

AI-Teams 的指令体系归入 `tools/`：指令说明在 `tools/commands/ai/`，可执行脚本在 `tools/bin/`。

| No. | 指令能力 | 指令说明 |
|---:|---|---|
| 1 | 一键打包指令（正式版） | `tools/commands/ai/package-formal.md` |
| 2 | 一键打包指令（精简版） | `tools/commands/ai/package-simplify.md` |
| 3 | 项目初始化 | `tools/commands/ai/init-project.md` |
| 4 | 外部升级器操作说明（工程内不执行） | `tools/commands/ai/upgrade-existing.md` |
| 5 | 多余日志清除指令 | `tools/commands/ai/logs-clean.md` |
| 6 | 自学习指令 | `tools/commands/ai/self-learn.md` |
| 7 | MCP 查询指令 | `tools/commands/ai/mcp-list.md` |
| 8 | Skills 查询指令 | `tools/commands/ai/skills-list.md` |
| 9 | 安装 Skills 指令 | `tools/commands/ai/skills-install.md` |
| 10 | 安装 MCP 指令 | `tools/commands/ai/mcp-install.md` |
| 11 | 查询 Hooks 指令 | `tools/commands/ai/hooks-list.md` |
| 12 | 查询定时任务指令 | `tools/commands/ai/cron-list.md` |
| 13 | 查询所有 Agent，Agent 状态指令 | `tools/commands/ai/agents-status.md` |
| 14 | 回滚指令 | `tools/commands/ai/rollback.md` |
| 15 | 读取记忆指令 | `tools/commands/ai/memory-read.md` |
| 16 | 刷新记忆指令 | `tools/commands/ai/memory-refresh.md` |
| 17 | 上下文压缩指令 | `tools/commands/ai/context-compact.md` |
| 18 | 自建规则创建指令 | `tools/commands/ai/rule-create.md` |
| 19 | 提示词状态 | `tools/commands/ai/prompt-status.md` |
| 20 | 提示词进化候选 | `tools/commands/ai/prompt-evolve.md` |
| 21 | 提示词差异 | `tools/commands/ai/prompt-diff.md` |
| 22 | 提示词评测 | `tools/commands/ai/prompt-eval.md` |
| 23 | 提示词激活 | `tools/commands/ai/prompt-activate.md` |
| 24 | 提示词回滚 | `tools/commands/ai/prompt-rollback.md` |
| 25 | 提示词历史 | `tools/commands/ai/prompt-history.md` |

## 边界

- `tools/commands/ai/` 只保存指令说明。
- `tools/bin/` 保存可执行脚本。
- `.claude/` 不保存指令说明或脚本。
- 自建规则创建指令只写 `rule/custom/` 路由和索引；动作规则仍写 `security/`。
- 提示词指令遵循 `security/prompt-policy.md` 与 `security/prompt-evolution-policy.md`；默认 dry-run，激活前必须评测和审批。
