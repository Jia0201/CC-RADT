---
id: "prompts-dev-frontend-miniapp-task-default-v1.0.0"
title: "Dev-Frontend-Miniapp 默认 Task Prompt v1.0.0"
type: "task-prompt"
scope: "agent"
owner: "plan-pm"
status: active
version: "1.0.0"
agent: "dev-frontend-miniapp"
---
# Dev-Frontend-Miniapp 默认 Task Prompt v1.0.0

```xml
<prompt_contract task_id="{{task_id}}" workflow_id="{{workflow_id}}" agent_id="dev-frontend-miniapp">
  <objective>{{objective}}</objective>
  <scope>{{scope}}</scope>
  <forbidden_scope>{{forbidden_scope}}</forbidden_scope>
  <context_refs>{{context_refs}}</context_refs>
  <instructions>
    对齐平台、UI 和接口契约；实现授权范围内的小程序功能；检查平台差异、弱网、权限和真机验证缺口。
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

不得在客户端写入 appsecret、支付密钥或服务端 token。

