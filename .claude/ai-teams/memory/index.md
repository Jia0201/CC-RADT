---
id: memory-index
title: 记忆索引
type: memory-index
scope: project
owner: memory
status: active
---

# 记忆索引

记忆用于保存长期有用、可恢复、经过筛选的事实。它服务于团队恢复、任务续接、长期偏好和稳定约束，不保存原始聊天、完整日志、大段代码或敏感内容。

AI-Teams 采用四层记忆边界。知识图谱只负责导航，不算第五层，也不替代任何记忆内容：

| 层级 | 位置 | 管理者 | 说明 |
|---|---|---|---|
| L1 会话恢复 | `memory/conversations/` | Memory | 当前会话摘要、恢复点、压缩前后材料；不作为长期事实 |
| L2 团队共享记忆 | `memory/MEMORY.md` | Memory | 所有 Agent 都必须长期恢复的稳定事实、用户偏好和全局约束 |
| L3 Agent 独立记忆 | `memory/agents/<agent>/MEMORY.md` | Memory | 单个 Agent 长期需要的职责事实、执行偏好和已验证教训 |
| L4 知识库 | `kb/` | Doc | 可复用、已验证、与一次会话无关的知识；不是任务记忆 |

`kb/graph.md`、`project/graph.md` 和 标准 Markdown 链接只建立上述内容与 Agent、项目、工作区之间的关系。

## 目录

- `memory/MEMORY.md`
- `memory/shared/`
- `memory/agents/`
- `memory/candidates/`
- `memory/archive/`
- `memory/conversations/`
- `memory/context-compression.md`
- `memory/native-claude-memory-audit.md`
- `memory/refresh-rules.md`
- `memory/retention-policy.md`

## Claude Code 原生记忆边界

Claude Code 的上下文窗口、`CLAUDE.md` 导入、Hooks、rules 和 subagent 运行链路不能被 AI-Teams 完全替换。AI-Teams 的做法是使用官方入口介入，并把正式记忆收敛到本工程：

- `.claude/settings.json` 必须设置 `autoMemoryEnabled: false`。
- `ai_teams.memory_governance.native_claude_memory_policy` 必须为 `audit-and-ignore`。
- `tools/bin/ai-teams-memory-audit.mjs` 在 `SessionStart` 审计 `~/.claude/projects/*/memory`，只读取目录和文件元数据，不读取内容。
- 审计报告写入 `memory/native-claude-memory-audit.md` 和 `shared/events/native-claude-memory-audit.json`。
- Claude Code 原生 auto memory 残留不得作为 AI-Teams 事实来源；需要长期保存的事实必须由 Memory 筛选后写入 `memory/`。

## 记忆类型

| 类型 | 写入位置 | 写入条件 |
|---|---|---|
| 共享记忆 | `memory/MEMORY.md` | 所有 Agent 都需要长期恢复的事实、用户长期偏好、全局边界 |
| Agent 独立记忆 | `memory/agents/<agent>/MEMORY.md` | 仅某个 Agent 长期需要的职责偏好、执行边界、恢复信息 |
| 候选记忆 | `memory/candidates/` | 来自任务结论、上下文压缩、失败复盘或初始化扫描，尚未筛选 |
| 归档记忆 | `memory/archive/` | 已过期、被替换或不再作为当前恢复依据的记忆 |
| 会话恢复材料 | `memory/conversations/` | 原始会话阶段材料、上下文压缩摘要和恢复点 |

## 共享记忆规则

- 只写所有 Agent 都需要知道的长期事实。
- 只写经过用户指令、文件状态或验证结果支撑的内容。
- 不写单次任务过程、命令长输出、临时聊天。
- 不写 Agent 个性化执行细节。

## Agent 独立记忆规则

- 只写对应 Agent 长期需要的职责、偏好、恢复点和已验证教训。
- 不写团队全局规则；团队全局规则应进入共享记忆或安全规则。
- Agent 独立记忆必须保留来源任务或来源文件。

## 写入边界

- 正式记忆只能由 Memory 管理。
- Lead 可以提出记忆候选，但不得直接写正式记忆。
- Doc 管理知识库，不替代 Memory 写正式记忆。
- 日志用于追溯，不等于记忆。
- 知识库用于复用，不等于记忆。
- 会话恢复材料用于重启和上下文恢复，不等于正式记忆。
- 敏感文件、密钥、证书、token、credentials、`.env` 内容不得进入记忆。
- Hook 和手动压缩只生成恢复材料或候选；正式记忆由 Memory 筛选写入。
- `.claude/settings.json` 不复制记忆正文。项目设置关闭 Claude Code 独立 Auto Memory，避免形成 Memory Agent 无法治理的第二套记忆；AI-Teams 通过 `CLAUDE.md` 的 `@memory/index.md`、Session/Compact Hooks 和 Memory Agent 启用四层体系。

## 记忆候选来源

- 用户明确偏好、长期约束或反复强调的规则。
- 项目初始化、项目升级、重要修复、架构调整后的稳定事实。
- 上下文压缩产生的恢复要点。
- 失败重试后的可复用教训。
- MCP、Skills、CodeGraph 等工具状态中对后续任务有长期影响的事实。

## 正式记忆筛选标准

一条候选记忆必须同时满足：

1. 对未来恢复或决策有明显价值。
2. 不是临时过程、短期日志或单次命令输出。
3. 已被当前文件、任务结果或用户指令验证。
4. 不包含敏感内容。
5. 能用一句或少量要点表达清楚。

## 会话材料边界

`memory/conversations/` 保存会话记录、上下文压缩摘要和恢复点，由 Memory 管控。它是恢复材料，不是正式记忆；进入正式记忆前必须经过筛选和摘要。

## 关联文档

- [context-compression](./context-compression.md)
- [index](./conversations/index.md)
- [refresh-rules](./refresh-rules.md)
- [retention-policy](./retention-policy.md)
- [memory](../agents/memory/memory.md)
- [memory-and-compression](../kb/shared/memory-and-compression.md)
- [context-compression-policy](../security/context-compression-policy.md)
