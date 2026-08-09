---
id: "kb-shared-engineering-brain"
title: "AI-Teams 工程大脑边界"
type: "knowledge"
scope: "shared"
owner: "doc"
status: active
---

# AI-Teams 工程大脑边界

AI-Teams 主工程本身是工程大脑。`.claude/` 只保存 Claude Code settings，用于告诉 Claude Code 进入后从哪里读取主工程。

## 稳定结论

- Agent 本体在 `agents/`。
- Agent 调度规则在 [lead](../../agents/lead/lead.md)。
- 指令说明在 [index](../../tools/commands/index.md)。
- 正式记忆在 [index](../../memory/index.md)。
- 正式知识库在 [index](../index.md)。
- 安全边界在 [index](../../security/index.md)。
- 全局导航在 [INDEX](../../index/INDEX.md)，但全局导航不替代本体索引。

## 禁止误用

- 不在 `.claude/` 下创建 Agent、指令、规则、工作流或 Skills 副本。
- 不把日志当记忆。
- 不把记忆当知识库。
- 不把 `index/` 当第二知识库。

## 验证来源

- 用户明确要求：AI-Teams 才是 harness 工程大脑。
- 当前结构：[CLAUDE](../../CLAUDE.md)、[index](../../agents/index.md)、[lead](../../agents/lead/lead.md)、[index](../../tools/commands/index.md)、[index](../../memory/index.md)、[graph](../graph.md)。
