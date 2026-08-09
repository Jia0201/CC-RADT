---
id: "templates-rule-create-readme"
title: "自建规则创建模板"
type: "template"
scope: "project"
owner: "doc"
status: active
---
# 自建规则创建模板

## 用途

用于创建 `rule/custom/` 下的自建规则路由。它帮助 Agent 在新增稳定规则时登记触发条件、读取顺序、写入范围和验证方式。

## 边界

- 自建规则路由写入 `rule/custom/`。
- 动作规则和安全边界写入 `security/`。
- 目标项目规则正文写入 `project/rules/`。
- 知识沉淀写入 `kb/`，不得把动作规则写进知识库。

## 推荐方式

优先使用：

```bash
node tools/bin/ai-teams-rule-create.mjs --id <kebab-id> --title "<中文标题>" --scope <agents|project|security> --owner <agent> --trigger "<触发条件>" --write
```

手工创建时，先复制 `template.md`，再更新 `rule/custom/index.md`、分类索引、[graph](../../kb/graph.md)、[FILES](../../index/FILES.md) 和 [导航规范](../../index/NAVIGATION.md)。
