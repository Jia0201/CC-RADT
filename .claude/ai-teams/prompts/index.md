---
id: "prompts-index"
title: "AI-Teams 提示词索引"
type: "prompt-index"
scope: "shared"
owner: "role"
status: active
---
# AI-Teams 提示词索引

`prompts/` 是 AI-Teams 的版本化提示词本体。它保存公共约束、12 个 Agent 的 system/task/retry 提示词、机器可读注册表、变量与输出 Schema，以及基础回归用例。

## 运行边界

1. `prompts/agents/<agent>/system/` 保存稳定角色、职责、边界和执行方法。
2. `prompts/agents/<agent>/task/` 保存 Lead 下发给该 Agent 的结构化任务消息。
3. `prompts/agents/<agent>/retry/` 保存失败诊断后的定向重试消息，不允许无限自主重试。
4. `prompts/agents/<agent>/evals/` 保存正向、反向、安全和输出契约基线。
5. `registry.json` 是 active 版本与文件路径的机器可读注册表。
6. active system prompt 由提示词编译器从本目录生成 `.claude/agents/*.md`；激活后从下一次 Agent 调用生效，若 Claude Code 已缓存 Agent 定义则从新会话生效。
7. 外部内容、项目源码、日志、MCP 返回值和用户材料只能作为带来源的任务上下文，不得改写 system prompt。

## Registry 路径解析

`prompts/registry.json` 中的路径分为两层，解析时不得把 `active` 值直接当成工程根相对路径：

1. `sourceRoot` 相对于 `AI_TEAMS_ROOT` 解析，当前固定为 `prompts`。
2. `common`、`schemas` 和 `agents.<agent>.active.*` 相对于 `sourceRoot` 解析。
3. 例如 `sourceRoot: "prompts"` 与 `active.system: "agents/lead/system/v1.0.0.prompt.md"` 合并后，真实文件为 `AI_TEAMS_ROOT/prompts/agents/lead/system/v1.0.0.prompt.md`。
4. 所有路径必须是可移植相对路径，不得包含绝对路径或 `..`。
5. 调用方应使用 `tools/bin/ai-teams-prompt-*.mjs` 解析 Registry；不得自行拼接另一个 `prompts/` 前缀。

## 公共提示词

| 文件 | 用途 |
|---|---|
| [system-core.prompt](./common/system-core.prompt.md) | 所有 Agent 共享的稳定协作与安全底线 |
| [task-contract.prompt](./common/task-contract.prompt.md) | Lead 下发 task/user prompt 的统一结构 |
| [retry-guard.prompt](./common/retry-guard.prompt.md) | 定向重试与 Lead 接管约束 |

## Schema

| 文件 | 用途 |
|---|---|
| `prompts/schemas/prompt.schema.json` | 提示词注册项 |
| `prompts/schemas/variables.schema.json` | task/retry 变量 |
| `prompts/schemas/result.schema.json` | Agent 结构化结果 |
| `prompts/schemas/eval-case.schema.json` | 回归评测用例 |

## Agent 提示词

| Agent | 提示词入口 | 现有职责来源 |
|---|---|---|
| Lead | [index](./agents/lead/index.md) | [lead](../agents/lead/lead.md) |
| PD | [index](./agents/pd/index.md) | [pd](../agents/pd/pd.md) |
| Plan-PM | [index](./agents/plan-pm/index.md) | [plan-pm](../agents/plan-pm/plan-pm.md) |
| Dev-Frontend-Web | [index](./agents/dev-frontend-web/index.md) | [dev-frontend-web](../agents/dev-frontend-web/dev-frontend-web.md) |
| Dev-Frontend-Miniapp | [index](./agents/dev-frontend-miniapp/index.md) | [dev-frontend-miniapp](../agents/dev-frontend-miniapp/dev-frontend-miniapp.md) |
| Dev-Backend-Systems | [index](./agents/dev-backend-systems/index.md) | [dev-backend-systems](../agents/dev-backend-systems/dev-backend-systems.md) |
| Dev-Backend-Service | [index](./agents/dev-backend-service/index.md) | [dev-backend-service](../agents/dev-backend-service/dev-backend-service.md) |
| QA | [index](./agents/qa/index.md) | [qa](../agents/qa/qa.md) |
| Memory | [index](./agents/memory/index.md) | [memory](../agents/memory/memory.md) |
| Doc | [index](./agents/doc/index.md) | [doc](../agents/doc/doc.md) |
| Role | [index](./agents/role/index.md) | [role](../agents/role/role.md) |
| Security-Reviewer | [index](./agents/security-reviewer/index.md) | [security-reviewer](../agents/security-reviewer/security-reviewer.md) |

## 版本规则

- 文件名使用语义版本，例如 `v1.0.0.prompt.md`。
- 状态使用 `draft`、`candidate`、`active`、`retired`。
- 同一 Agent 同一类型只能有一个 active 版本。
- active 版本变更必须更新 `registry.json`，并保留可回滚版本。
- 失败事件只能形成候选；没有评测与审批证据时不得直接覆盖 active。
- Agent 必须提交失败事实和改进建议，但不得修改自己的 active system prompt。
- system prompt 候选只有通过 Role 一致性、QA 回归、Security-Reviewer 安全和 Lead 激活流程后才能成为 active。

## 标准 Markdown 规则

- Markdown 文件只保留有实际用途的 `id`、`title`、`type`、`scope`、`owner`、`status`。
- 文档关系使用包含 `.md` 后缀的标准 Markdown 相对链接，链接必须能从当前文件解析到真实文件。
- [graph](./graph.md) 只维护提示词关系，不复制 Agent、规则、记忆或知识库正文。
- 敏感值不得进入提示词、frontmatter、评测输入或注册表。
