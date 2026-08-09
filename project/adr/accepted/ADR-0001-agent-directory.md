---
id: ADR-0001
title: Agent 目录结构
type: adr
scope: project
status: accepted
date: 2026-06-02
owner: doc
decision_by: lead
---
# ADR-0001：Agent 目录结构

## 1. 背景

AI-Teams 需要清晰表达 12 个 Agent 的职责、边界、工作流、记忆、知识库、Skills、MCP 和 playbook。早期如果把 Agent 主体混入 `.claude/` 或只放一个长篇索引，会让 Claude Code、Codex 和 标准 Markdown 都难以判断工程大脑的真实位置。

如果不记录这个决策，后续容易再次出现 `.claude/` 与 `agents/` 双套 Agent 定义、单 Agent index 滥用、职责边界分散等问题。

## 2. 决策

> 我们决定：AI-Teams 的 Agent 本体统一放在 `agents/`，每个 Agent 使用 `agents/<agent>/<agent>.md` 作为主文件，并使用 `role.md`、`workflow.md`、`memory.md`、`kb.md`、`skills.md`、`mcp.md`、`playbook.md` 作为组件文件。

团队级索引只保留 `agents/index.md`。单个 Agent 不再新增 `agents/<agent>/index.md`。

## 3. 原因

- 该结构符合“AI-Teams 主工程才是工程大脑”的边界。
- 主文件和组件文件分离，便于 Claude Code 按需读取，减少上下文浪费。
- `playbook.md` 作为 Agent 指针，规则本体放在 `security/agent-playbooks/`，避免安全规则和角色说明混在一起。
- 不使用 per-agent `index.md`，可以减少入口歧义。

## 4. 影响范围

- 目录：`agents/`、`security/agent-playbooks/`。
- Agent：全部 12 个 Agent。
- 指令：Agent 查询和状态查询应指向 `agents/index.md` 与主文件。
- 规则：Agent 职责边界由 Role 管理，安全规则由 Security-Reviewer 管理。
- 记忆：Agent 记忆指针文件指向 `memory/agents/<agent>/MEMORY.md`。
- 知识库：Agent 知识指针文件指向 `kb/agents/<agent>/index.md`。
- 工具：自检脚本必须检查该结构。
- 安全：`.claude/` 不保存 Agent 本体。

## 5. 后果

### 正面影响

- Agent 边界更清晰。
- 文档关系图能按主文件和组件文件建立关系。
- 自检脚本能发现结构漂移。

### 负面影响

- 文件数量增加，需要索引保持同步。

### 需要注意

- 新增 Agent 时必须同步创建 8 个 Agent 文件和对应安全 playbook。
- 不得在 Claude Code 配置目录下恢复 Agent 工程本体副本，也不得恢复 per-agent `index.md`。

## 6. 关联

- 相关规则：[file-ownership](../../../security/file-ownership.md), [index](../../../security/agent-playbooks/index.md)
- 相关目录：`agents/`, `security/agent-playbooks/`
- 相关 Agent：Role, Lead, Security-Reviewer
- 相关任务：Agent 目录归位与 标准 Markdown 索引修复
- 替代关系：无
