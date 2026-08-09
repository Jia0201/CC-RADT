---
id: "memory-context-compression"
title: "上下文压缩规则"
type: "memory"
scope: "project"
owner: "memory"
status: active
---
# 上下文压缩规则

上下文压缩用于让 AI-Teams 在长会话、多 Agent 协作、任务中断或上下文不足时快速恢复。它是恢复材料，不是正式记忆，也不是知识库。

## 压缩处理链

| 层级 | 名称 | 目标 | 输出 |
|---|---|---|---|
| Level 1 | 会话恢复压缩 | 保存当前任务可恢复摘要 | `memory/conversations/compact/` |
| Level 2 | 共享记忆筛选 | 提取所有 Agent 长期需要的事实 | `memory/candidates/` 或 `memory/MEMORY.md` |
| Level 3 | Agent 记忆筛选 | 提取单个 Agent 长期需要的事实 | `memory/agents/<agent>/MEMORY.md` |
| Level 4 | 知识库候选 | 提取与一次会话无关的稳定复用知识 | `kb/candidates/`，由 Doc 复核 |

## 触发时机

- Hook 检测会话恢复材料达到配置阈值。
- 用户执行上下文压缩指令。
- 用户要求“继续”“恢复”“总结上下文”“压缩上下文”。
- Lead 判断当前会话过长，后续任务容易丢失关键约束。
- 多 Agent 阶段完成，即将进入 QA、Doc、Memory 或下一阶段。
- 任务发生中断，重启后需要续接。
- 高风险修改前，需要记录当前文件、约束和未完成项。
- 任务失败达到第二次，需要为第三次或 Lead 复判提供证据。

## 自动检测与手动指令

- 自动检测 Hook：`hooks/scripts/context-compression-check.sh`
- Hook 配置示例：`hooks/configs/context-compression.example.env`
- Hook 提示模板：`hooks/templates/context-compression-notice.md`
- 手动指令文档：[context-compact](../tools/commands/ai/context-compact.md)

Hook 接入 Claude Code 官方 `PreCompact`、`PostCompact` 和 `Stop` 事件。`PreCompact`/`PostCompact` 优先读取传入的 `transcript_path`，生成 `memory/conversations/compact/*-memory-recovery-candidate.md` 恢复候选；`Stop` 只按阈值做补充检查。Hook 不直接写正式记忆。
- 手动脚本：`tools/bin/ai-teams-context-compact.sh`

Hook 默认只生成恢复候选或阈值提示，不直接写正式记忆。正式记忆写入必须经过 Memory 筛选。

## Memory 实时检测职责

Memory 在以下动作发生时必须检查是否需要压缩或归档：

- 写入或刷新正式记忆前。
- 处理 `memory/candidates/` 或任务交接中的候选材料时。
- 任务阶段即将切换到 QA、Doc、Memory 或最终关闭时。
- Hook 输出上下文恢复候选后。
- 会话恢复材料已经足以影响后续任务读取效率时。

检查结果只需要落到正式位置：

- 需要压缩：按本文件生成 `memory/conversations/compact/` 恢复材料。
- 需要恢复点：写入 `memory/conversations/restore-points/`。
- 需要候选记忆：按 [refresh-rules](./refresh-rules.md) 进入候选或正式记忆流程。
- 需要归档：按 [retention-policy](./retention-policy.md) 处理。
- 无需处理：在交接或任务关闭报告中说明“无需上下文压缩/归档”。

`agents/memory/memorys/` 只是 Memory Agent 阅读指引，不保存压缩材料、候选记忆、归档材料或规则本体。

## Level 1 产物结构

上下文压缩摘要应包含：

- 最新用户指令。
- 当前目标和范围。
- 已读取的重要文件。
- 已修改或新增的文件。
- 已完成项。
- 未完成项。
- 明确禁止触碰的内容。
- 验证结果。
- 风险、假设和待确认事项。
- 下一步执行顺序。
- 候选记忆和候选知识。

## Level 2 写入判断

只有满足以下条件的内容才进入记忆候选：

1. 未来任务恢复需要。
2. 对多个任务或 Agent 长期有用。
3. 已经被用户指令、文件状态或验证结果支撑。
4. 能用短句表达。
5. 不包含敏感信息。

不满足条件的内容继续留在压缩摘要或日志中，不进入正式记忆。

## Level 3 知识沉淀判断

只有满足以下条件的内容才进入知识候选：

1. 是稳定可复用的方法、规范、协议、架构事实或工具使用方式。
2. 已经验证，不只是单次任务感受。
3. 可以被多个 Agent 引用。
4. 适合通过 标准 Markdown 链接接入图谱。

## 严格边界

- 上下文压缩不保存密钥、token、证书、`.env` 内容或 credentials。
- 上下文压缩不替代日志；需要追溯命令输出时链接日志。
- 上下文压缩不替代正式记忆；正式记忆必须由 Memory 筛选。
- 上下文压缩不替代知识库；正式知识必须由 Doc 验证。
- 不用大段复制原始聊天，必须摘要成可恢复事实。

## 推荐文件名

- `memory/conversations/compact/YYYYMMDD-HHMM-topic.md`
- `memory/candidates/YYYYMMDD-HHMM-memory-candidates.md`
- `kb/candidates/YYYYMMDD-HHMM-knowledge-candidates.md`

## 标准 Markdown 要求

压缩摘要必须包含 frontmatter，并至少链接：

- [index](./index.md)
- [index](./conversations/index.md)
- 当前任务相关 Agent 索引。
- 如涉及知识沉淀，链接 [index](../kb/index.md)。
