---
id: "rule-project-backend-api"
title: "项目后端接口规则"
type: "rule"
scope: "project"
owner: "doc"
status: active
---
# 项目后端接口规则

- 接口路径、方法、字段名、类型、必填、可空、默认值、枚举、分页、鉴权和错误结构以代码、OpenAPI、Proto 或已确认契约为准。
- 前后端修改前读取 [api-contracts](../../../project/api-contracts.md) 和对应 `shared/contracts/` 契约。
- 前端需要但后端不存在的字段必须回流契约，不得在任一端猜测或用假数据掩盖。
- 改变 API 契约必须记录兼容策略、调用方、迁移方式和 QA 证据。

<!-- AI-TEAMS:project-rule-api:BEGIN -->
## 接口契约与路由入口

- 文件数量：7
- 展示上限：200

- `prompts/schemas/eval-case.schema.json`
- `prompts/schemas/prompt.schema.json`
- `prompts/schemas/result.schema.json`
- `prompts/schemas/variables.schema.json`
- `rule/project/backend/api.md`
- `rule/project/backend/index.md`
- `rule/project/backend/syntax.md`
<!-- AI-TEAMS:project-rule-api:END -->
