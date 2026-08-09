---
id: "kb-agents-pd-source-map"
title: "PD 权威来源"
type: "knowledge-source-map"
scope: "agent"
owner: "doc"
status: active
---
# PD 权威来源

`01-source-map.md` 只登记产品需求与工程内规范来源，不放随机博客、个人经验贴或未验证模板。

| 来源 | 地址 | 什么时候使用 | Codex 生成内容时要遵守什么 |
|---|---|---|---|
| Agile Alliance User Stories | https://www.agilealliance.org/glossary/user-stories/ | 编写用户故事、角色、目标和收益时 | 用户故事必须表达用户、目标和价值，不用实现细节替代用户价值 |
| Scrum Guide | https://scrumguides.org/ | 描述 Product Goal、Product Backlog、验收和迭代边界时 | 需求条目应支持排序、澄清和验收；不把未承诺事项写成确定交付 |
| IEEE 29148 Requirements Engineering | https://standards.ieee.org/standard/29148-2018.html | 需求质量、需求属性、可验证性和需求文档结构审查时 | 需求必须清晰、可验证、无歧义，并能追溯到目标或约束 |
| Gherkin Reference | https://cucumber.io/docs/gherkin/reference/ | 编写 Given / When / Then 验收场景时 | 场景表达业务行为和可观察结果，不写内部实现步骤 |
| Nielsen Norman Group UX Research | https://www.nngroup.com/articles/ | 用户路径、可用性、信息架构和交互需求描述时 | 只沉淀可验证的用户行为和问题，不把主观偏好写成普遍结论 |
| WCAG 2.2 | https://www.w3.org/TR/WCAG22/ | 需求涉及可访问性、表单、视觉、键盘或辅助技术时 | 可访问性要求必须写入验收标准，避免只写“体验友好” |
| OpenAPI Specification | https://spec.openapis.org/oas/latest.html | 需求影响 API 契约、字段、状态码或错误模型时 | PD 只描述业务契约和兼容诉求，不臆造接口实现 |
| 工程需求上下文 | `project/context.md` | 项目背景、目标用户、业务约束和长期上下文需要对齐时 | 生成需求时保持上下文一致，冲突处标为待确认 |
| 项目画像 | `project/project-profile.md` | 判断产品形态、技术栈、业务域和交付边界时 | 不引入与项目画像冲突的角色、渠道或平台假设 |
| 项目规则索引 | `project/rules/index.md` | 需求受工程规则、合规约束、命名或流程约束影响时 | 需求必须体现已知工程约束，并把不确定规则列入待确认 |
| Agent 协作索引 | `agents/index.md` | 需求需要交给 Plan-PM、Lead、QA、Doc 或 Dev 时 | 交接内容应能被下游直接理解，不夹带调度命令 |
