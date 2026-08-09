---
id: "kb-agents-role-index"
title: "Agent 知识库"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Role Agent 知识库

Role 知识库保存 Agent 职责边界、角色调整、能力补强、Skills/MCP 绑定建议和角色健康检查相关的稳定知识。

## 新索引

- [00-index](./00-index.md)

## 文件

| 文件 | 用途 |
|---|---|
| [01-source-map](./01-source-map.md) | Agent 结构、运行维护和工程内规范来源 |
| [02-engineering-rules](./02-engineering-rules.md) | 职责边界、角色变更、能力绑定和同步知识 |
| [03-code-style](./03-code-style.md) | Agent 指引、角色说明和变更说明的写作风格 |
| [04-review-checklist](./04-review-checklist.md) | 可直接用于角色审查的清单 |
| [05-do-not](./05-do-not.md) | Role 角色知识禁区 |

## 什么时候使用

- Agent 多次失误、职责重叠、边界不清。
- 用户要求新增、修改、禁用 Agent。
- 需要给 Agent 安装或调整 Skills/MCP。

## Codex 生成内容时要遵守什么

1. 角色知识要保持 `agents/<agent>/`、`agents/index.md` 和安全 playbook 的职责边界一致。
2. Skills/MCP 知识要保持注册表、Agent 组件和使用风险说明一致。
3. 长期结构调整属于治理知识，可能需要 ADR 或 Doc 沉淀。
4. 不把临时任务失败直接归因于角色缺陷；需要区分任务、计划、上下文、工具和角色因素。

## 运行期 Agent 指引维护

- 什么时候使用：新增规则、新文件、新 MCP/Skills、新 Hook/Tools、project 管理职责变化、Agent 反复找错入口、失败复盘显示职责不清。
- Codex 生成内容时要遵守：运行期维护知识应覆盖触发原因、影响 Agent、相关组件文件、同步关系和裁决需求；不得把临时 workaround 写成永久职责。
