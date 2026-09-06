---
id: "adr-index"
title: "ADR Index"
type: "adr-index"
scope: "project"
owner: "doc"
status: active
---
# ADR Index

ADR 记录影响 AI-Teams 长期工程结构的关键决策原因。普通任务过程写入 `logs/`，当前协作状态写入 `shared/`，长期记忆写入 `memory/`，可复用知识写入 `kb/`。

## Accepted

| ADR | 标题 | 日期 | 影响范围 |
|---|---|---|---|
| [ADR-0001-agent-directory](./accepted/ADR-0001-agent-directory.md) | Agent 目录结构 | 2026-06-02 | `agents/`, `security/agent-playbooks/`, `CLAUDE.md` |
| [ADR-0002-command-location](./accepted/ADR-0002-command-location.md) | 指令位置归入 tools | 2026-06-02 | `tools/commands/`, `tools/bin/`, `.claude/` |
| [ADR-0003-memory-layering](./accepted/ADR-0003-memory-layering.md) | 记忆分层 | 2026-06-02 | `memory/`, `memory/conversations/`, `kb/`, `shared/` |
| [ADR-0012-standard-markdown-navigation](./accepted/ADR-0012-standard-markdown-navigation.md) | 标准 Markdown 导航与单一入口 | 2026-06-02 | `CLAUDE.md`, `index/ENTRY.md`, `index/NAVIGATION.md`, `kb/graph.md` |
| [ADR-0005-retry-flowback](./accepted/ADR-0005-retry-flowback.md) | 错误处理与重试回流 | 2026-06-02 | `playbook.md`, `docs/governance/`, `shared/`, `agents/` |
| [ADR-0006-lightweight-lock](./accepted/ADR-0006-lightweight-lock.md) | 轻量锁机制 | 2026-06-02 | `shared/locks/`, `security/file-ownership.md`, `hooks/` |
| [ADR-0007-lightweight-index](./accepted/ADR-0007-lightweight-index.md) | 轻量索引 | 2026-06-02 | `index/`, `kb/graph.md`, `CLAUDE.md`, `agents/index.md` |
| [ADR-0008-lead-takeover-heartbeat](./accepted/ADR-0008-lead-takeover-heartbeat.md) | Lead 即时接管与多 Agent 心跳 | 2026-06-14 | `playbook.md`, `shared/supervision/`, `shared/escalations/`, `security/`, `hooks/`, `.claude/settings.json` |
| [ADR-0009-rule-routing](./accepted/ADR-0009-rule-routing.md) | 规则路由与按需读取 | 2026-06-14 | `rule/`, `.claude/rules/`, Agent 入口、初始化、打包和图谱 |
| [ADR-0010-workflow-selector](./accepted/ADR-0010-workflow-selector.md) | 工作流选择器 | 2026-06-27 | `playbook.md`, `agents/`, `shared/`, `memory/`, `kb/graph.md`, `project/graph.md` |
| [ADR-0011-prompt-evolution-system](./accepted/ADR-0011-prompt-evolution-system.md) | 提示词版本化与失败驱动进化 | 2026-07-19 | `prompts/`, `.claude/agents/`, `shared/prompt-evolution/`, `security/`, `hooks/`, `tools/` |
| [ADR-0013-manual-project-initialization](./accepted/ADR-0013-manual-project-initialization.md) | 项目初始化改为用户主动操作 | 2026-09-06 | `.claude/settings.json`, `hooks/`, `security/project-policy.md`, `playbook.md`, `tools/` |
| [ADR-0014-readonly-observer](./accepted/ADR-0014-readonly-observer.md) | 内置只读观察台与多会话接入 | 2026-09-06 | `tools/observer/`, `hooks/`, `.claude/settings.json` |

## Rejected

| ADR | 标题 | 日期 | 拒绝原因 |
|---|---|---|---|
