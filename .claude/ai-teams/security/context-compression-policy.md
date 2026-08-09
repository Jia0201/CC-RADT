---
id: "security-context-compression-policy"
title: "上下文压缩安全规则"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# 上下文压缩安全规则

## 原则

- Hook 只检测上下文压缩触发条件并生成恢复候选，不直接写正式记忆。
- 手动指令可生成压缩摘要、恢复材料、记忆候选和知识候选。
- 正式记忆仍由 Memory 管理。
- 敏感文件内容不得进入压缩摘要。

## 自动检测

`.claude/settings.json` 必须启用 Claude Code 官方 `PreCompact` 与 `PostCompact` Hook，并可在 `Stop` 阶段补充按阈值检测。Hook 按 `transcript_path`、字符数、文件大小或会话材料数量生成 `memory/conversations/compact/*-memory-recovery-candidate.md`，不自动修改正式记忆。

`autoMemoryEnabled` 关闭是有意设计：AI-Teams 不让 Claude Code 在工程外维护一套未受 Memory Agent 管理的自动记忆。四层记忆由 `.claude/rules/` 和 `index/ENTRY.md` 的入口路由、Memory Agent、正式记忆文件和 Compact Hooks 共同启用。

`SessionStart` 必须运行 `native-claude-memory-audit`，审计 `~/.claude/projects/*/memory` 是否存在原生 auto memory 残留。审计只读取目录和文件元数据，不读取内容；发现残留时采用 `audit-and-ignore`，不得把原生 auto memory 作为 AI-Teams 事实来源。

Hook 只负责监听、审计和生成恢复候选。是否进入共享记忆、Agent 独立记忆或项目事实，由 Memory 按 [context-compression](../memory/context-compression.md)、[refresh-rules](../memory/refresh-rules.md) 和 [retention-policy](../memory/retention-policy.md) 判断。

## Memory 写入时检查

Memory 在写入正式记忆、处理候选记忆或整理恢复点时，必须检查：

- 是否已有 Hook 提示未处理。
- 是否需要生成上下文压缩摘要。
- 是否需要把旧恢复材料按保留策略归档。
- 是否有项目事实应交给 Doc 合并到 `project/`。
- 是否有可复用知识应交给 Doc 进入知识候选。
- 是否包含敏感内容；包含时必须拒绝写入或只保留非敏感摘要。

## 手动压缩

手动指令必须写清：

- 来源材料。
- 当前目标。
- 已完成与未完成。
- 禁止范围。
- 验证结果。
- 候选记忆。
- 候选知识。

## 禁止事项

- 不读取 `.env`、密钥、证书、token、credentials 内容。
- 不把大段原始聊天复制为正式记忆。
- 不把压缩摘要当作任务完成证据。
- 不读取 Claude Code 原生 auto memory 内容。
- 不把 Claude Code 原生 auto memory 残留当作 AI-Teams 事实。
