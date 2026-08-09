---
id: "custom-rule-<kebab-id>"
title: "<规则标题>"
type: "custom-rule-route"
scope: "<agents|project|security>"
owner: "<agent>"
status: draft
---
# <规则标题>

## 触发条件

说明什么时候必须读取这条规则。

## 读取顺序

1. 先读 [index](../../rule/index.md) 和当前 Agent 的 `rule/agents/<agent>.md`。
2. 再读对应的 `rule/custom/<scope>/index.md`。
3. 只读取本规则列出的必要文件；缺失事实时才扩大检索。

## 写入范围

说明允许更新哪些文件或索引。

## 禁止事项

- 不读取或写入敏感文件内容。
- 不把动作规则写进 KB。
- 不绕过 Lead、Security、锁、状态事务或用户确认。

## 验证方式

- 检查 `rule/custom/index.md` 和分类索引。
- 检查 [graph](../../kb/graph.md)、[FILES](../../index/FILES.md)、[导航规范](../../index/NAVIGATION.md)。
- 运行 `bash tools/bin/ai-teams-check.sh`。
