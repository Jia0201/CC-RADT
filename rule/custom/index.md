---
id: "rule-custom-index"
title: "自建规则索引"
type: "rule-index"
scope: "project"
owner: "doc"
status: active
---
# 自建规则索引

本目录登记 AI-Teams 运行过程中新增的自建规则路由。它只保存“什么时候读哪个规则、由谁维护、影响哪些文件”的路由信息，不保存长期知识，不替代 `security/` 的动作规则。

## 使用边界

- 自建路由规则放在 `rule/custom/`。
- 动作规则、安全规则、禁区和命令边界放在 `security/`。
- 目标项目导入的开发规范和项目约定放在 `project/rules/`。
- 知识沉淀放在 `kb/`，不得把动作规则写入知识库。
- 需要 Claude Code 自动感知时，由 `.claude/rules/ai-teams-custom.md` 指向本索引，不为每条规则单独创建官方适配文件。

## 分类入口

| 分类 | 入口 | 说明 |
|---|---|---|
| Agent 自建规则 | [index](./agents/index.md) | Agent 读取顺序、协作边界、任务触发条件的补充路由 |
| 项目自建规则 | [index](./project/index.md) | 目标项目接入后新增的项目级路由和读取约束 |
| 安全自建规则 | [index](./security/index.md) | 指向 `security/` 中新增或增强的动作规则 |

## 创建流程

1. 先读 [rule-policy](../../security/rule-policy.md) 判断是否真的需要新增自建规则。
2. 使用 `tools/bin/ai-teams-rule-create.mjs --id <id> --title <标题> --scope <agents|project|security> --owner <agent> --trigger <触发条件> --write` 创建路由草案。
3. Doc 更新本索引和 文档关系图；Role 检查 Agent 指引；Security-Reviewer 检查是否误放动作规则。
4. 若规则影响长期结构、职责边界或核心机制，Doc 追加 ADR。

## 当前注册规则

<!-- AI_TEAMS_CUSTOM_RULES_START -->

尚未注册运行期自建规则。

<!-- AI_TEAMS_CUSTOM_RULES_END -->
