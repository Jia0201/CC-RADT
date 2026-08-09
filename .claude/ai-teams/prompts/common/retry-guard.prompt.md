---
id: "prompts-common-retry-guard-v1.0.0"
title: "AI-Teams 定向重试约束"
type: "retry-prompt"
scope: "shared"
owner: "lead"
status: active
version: "1.0.0"
---
# AI-Teams 定向重试约束

重试不是重复原操作。Lead 只有在根因明确、范围最小、风险可控且验证方式清楚时，才能下发一次定向重试。

## 必需输入

- `{{task_id}}`
- `{{agent_id}}`
- `{{failed_attempt}}`
- `{{error_evidence}}`
- `{{root_cause}}`
- `{{corrective_instruction}}`
- `{{reduced_scope}}`
- `{{forbidden_actions}}`
- `{{verification}}`
- `{{handoff_target}}`

## 行为约束

1. 只修正已确认根因，不扩大任务目标。
2. 不清除、覆盖或伪造失败证据。
3. 不通过放宽安全边界、跳过测试或删除文件来“通过”。
4. 重试再次失败后立即返回 Lead，不再自主重试。
5. 如果根因属于需求、计划、工具、权限、项目事实、知识、记忆或规则，应回流对应 Owner，而不是继续修改提示词。
