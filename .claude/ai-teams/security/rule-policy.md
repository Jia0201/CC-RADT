---
id: "security-rule-policy"
title: "自建规则管理规范"
type: "security-policy"
scope: "project"
owner: "security-reviewer"
status: active
---
# 自建规则管理规范

本规范定义 AI-Teams 如何新增、审查、启用和维护自建 rules。自建 rules 的目标是减少重复扫描和重复解释，让 Agent 在任务开始时能更快找到正确文件。

## 放置规则

| 内容 | 放置位置 | Owner |
|---|---|---|
| 规则路由、触发条件、读取入口 | `rule/custom/` | Doc / Role |
| 动作规则、安全边界、禁区、命令要求 | `security/` | Security-Reviewer |
| 目标项目导入规则正文 | `project/rules/` | Doc |
| 可复用知识、经验总结、参考来源 | `kb/` | Doc |
| Claude Code 官方规则适配器 | `.claude/rules/` | Lead / Security-Reviewer |

KB 是知识库，不放动作规则。`rule/` 是路由层，不放大段知识和安全正文。

## 创建条件

满足以下任一条件才创建自建规则：

1. 某类任务反复需要同一组读取入口。
2. Agent 多次遗漏同一类项目事实、接口字段、UI 状态、验证步骤或安全边界。
3. 项目初始化吸收了稳定项目规范，需要进入按需读取链。
4. 新增安全规则、Hook、MCP、Skills 或工具后，需要给 Agent 一个稳定入口。
5. 规则影响多个 Agent，但暂不适合写进单个 Agent 主文档。

普通一次性任务、临时讨论、未验证猜测和知识摘要不创建自建规则。

## 必填内容

每条自建规则必须包含：

- `id`：kebab-case，不能包含路径分隔符。
- `title`：中文标题。
- `owner`：负责维护的 Agent。
- `status`：draft / active / deprecated。
- `trigger`：什么时候使用。
- `read_order`：Codex 或 Claude Code 应按什么顺序读文件。
- `write_scope`：允许写入的文件范围。
- `forbidden`：禁止事项。
- `validation`：规则生效后需要如何自检。

## 创建命令

```bash
node tools/bin/ai-teams-rule-create.mjs --id <规则id> --title <标题> --scope <agents|project|security> --owner <agent> --trigger <触发条件> --write
```

低侵入安装布局中：

```bash
node .claude/ai-teams/tools/bin/ai-teams-rule-create.mjs --id <规则id> --title <标题> --scope <agents|project|security> --owner <agent> --trigger <触发条件> --write
```

命令只生成 `rule/custom/` 路由文档和索引，不自动修改 `security/` 正文，也不写入 KB。

## 审查流程

1. Lead 判断是否需要新增规则。
2. Doc 创建或更新 `rule/custom/` 路由。
3. Role 检查相关 Agent 主文档、`.claude/agents/<agent>.md` 和 Agent playbook 是否需要同步。
4. Security-Reviewer 检查是否误放敏感内容、动作规则位置是否正确、是否需要新增 `security/*-policy.md`。
5. Doc 更新 [graph](../kb/graph.md)、[导航规范](../index/NAVIGATION.md)、[FILES](../index/FILES.md)、[index](../rule/index.md) 和必要索引。
6. 影响长期结构时，Doc 创建 ADR，Lead 决策。

## 禁止事项

- 不把动作规则写入 KB。
- 不把密钥、token、证书、`.env` 内容写入规则。
- 不通过自建规则绕过 Lead 调度、Security 审查、锁或用户确认。
- 不在 `.claude/rules/` 为每条自建规则生成散乱文件；官方适配层保持少量稳定入口。
- 不把未验证项目事实注册成 active 规则。

## 验收

新增自建规则后至少检查：

1. `rule/custom/index.md` 能找到该规则。
2. 对应分类索引能找到该规则。
3. `security/rule-policy.md`、[index](../rule/index.md)、[graph](../kb/graph.md)、[导航规范](../index/NAVIGATION.md) 和 [FILES](../index/FILES.md) 引用一致。
4. Claude Code 官方适配器 `.claude/rules/ai-teams-custom.md` 指向 `rule/custom/index.md`。
5. `bash tools/bin/ai-teams-check.sh` 通过。
