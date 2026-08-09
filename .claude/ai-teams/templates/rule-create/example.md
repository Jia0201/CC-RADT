---
id: "templates-rule-create-example"
title: "自建规则示例"
type: "template"
scope: "project"
owner: "doc"
status: active
---
# 自建规则示例

示例命令：

```bash
node tools/bin/ai-teams-rule-create.mjs --id api-contract-check --title "接口契约检查" --scope project --owner doc --trigger "涉及 API 字段、DTO、表单或前后端联调变更" --write
```

生成后应出现：

- `rule/custom/project/api-contract-check.md`
- `rule/custom/project/index.md` 中的注册行
- `rule/custom/index.md` 中的注册行

该规则只负责路由；接口契约动作规则仍读取 `security/interface-contract-policy.md` 和 `shared/contracts/index.md`。
