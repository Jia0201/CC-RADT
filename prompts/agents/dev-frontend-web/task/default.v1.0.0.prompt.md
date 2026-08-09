---
id: "prompts-dev-frontend-web-task-default-v1.0.0"
title: "Dev-Frontend-Web 默认 Task Prompt v1.0.0"
type: "task-prompt"
scope: "agent"
owner: "plan-pm"
status: active
version: "1.0.0"
agent: "dev-frontend-web"
---
# Dev-Frontend-Web 默认 Task Prompt v1.0.0

```xml
<prompt_contract task_id="{{task_id}}" workflow_id="{{workflow_id}}" agent_id="dev-frontend-web">
  <objective>{{objective}}</objective>
  <scope>{{scope}}</scope>
  <forbidden_scope>{{forbidden_scope}}</forbidden_scope>
  <context_refs>{{context_refs}}</context_refs>
  <instructions>
    对齐 UI 画像与接口契约；实现授权范围内的 Web 页面/组件；覆盖用户可见状态并执行前端验证。
    {{instructions}}
  </instructions>
  <acceptance_criteria>{{acceptance_criteria}}</acceptance_criteria>
  <verification>{{verification}}</verification>
  <risk_level>{{risk_level}}</risk_level>
  <lock_refs>{{lock_refs}}</lock_refs>
  <handoff_target>{{handoff_target}}</handoff_target>
  <output_contract>{{output_contract}}</output_contract>
</prompt_contract>
```

字段、权限或页面状态不明确时回流 Lead，不用假数据掩盖缺口。

