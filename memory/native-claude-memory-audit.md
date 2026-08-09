---
id: "native-claude-memory-audit"
title: "Claude Code 原生记忆审计"
type: "memory-audit"
scope: "project"
owner: "memory"
status: "active"
---
# Claude Code 原生记忆审计

<!-- AI-TEAMS:native-memory-audit:BEGIN -->

- 生成时间：2026-07-20 23:39:30
- AI-Teams 根目录：`$HOME/project/Agents/AI-Teams`
- 审计结论：通过
- AI-Teams 记忆策略：`audit-and-ignore`

## Claude Code 项目设置

- 设置文件：`$HOME/project/Agents/AI-Teams/.claude/settings.json`
- autoMemoryEnabled：`false`
- disableAllHooks：`false`
- 状态：enabled-through-ai-teams

## 用户/本地覆盖设置

- `$HOME/project/Agents/AI-Teams/.claude/settings.local.json`
- `$HOME/.claude/settings.json`
- `$HOME/.claude/settings.local.json`

## AI-Teams 正式记忆文件

- 状态：ready
- 必需文件数：17
- 缺失：0
- 空文件：0

## Claude Code 原生 Auto Memory 目录

| 目录 | 文件数 | 字节数 |
|---|---:|---:|
| `$HOME/.claude/projects/<project-1>/memory` | 6 | 5681 |
| `$HOME/.claude/projects/<project-2>/memory` | 10 | 19191 |
| `$HOME/.claude/projects/<project-3>/memory` | 2 | 522 |
| `$HOME/.claude/projects/<project-4>/memory` | 4 | 2295 |
| `$HOME/.claude/projects/<project-5>/memory` | 2 | 944 |
| `$HOME/.claude/projects/<project-6>/memory` | 6 | 7264 |

说明：本审计只读取目录和文件元数据，不读取原生记忆内容。即使发现原生记忆残留，AI-Teams 也不得把它作为事实来源；需要由用户自行决定是否在 Claude Code 外部清理。

## 需要处理的问题

- 无。

## 运行规则

- AI-Teams 正式记忆只来自 `memory/`、Memory Agent、上下文压缩候选和用户确认的项目事实。
- Claude Code 原生 auto memory 目录采用“审计并忽略”策略。
- Hook 和手动压缩只能生成恢复候选；正式记忆必须由 Memory 筛选。
- 不复制敏感文件内容，不读取原生 auto memory 内容。

<!-- AI-TEAMS:native-memory-audit:END -->
