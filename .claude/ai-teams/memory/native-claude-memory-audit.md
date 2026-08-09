---
id: "native-claude-memory-audit"
title: "Claude Code 原生记忆审计"
type: "memory-audit"
scope: "project"
owner: "memory"
status: "pending"
---
# Claude Code 原生记忆审计

<!-- AI-TEAMS:native-memory-audit:BEGIN -->

- 状态：待运行时审计。
- 触发：Claude Code `SessionStart` Hook 调用 `native-claude-memory-audit`。
- 输出：运行后更新本文件，并写入 shared/events/native-claude-memory-audit.json。
- 策略：Claude Code 原生 auto memory 目录采用 `audit-and-ignore`，不得作为 AI-Teams 事实来源。
- 内容边界：审计只读取目录和文件元数据，不读取原生记忆内容。

<!-- AI-TEAMS:native-memory-audit:END -->
