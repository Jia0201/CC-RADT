---
id: "prompts-plan-pm-task-default-v1.0.0"
title: "Plan-PM 默认 Task Prompt v1.0.0"
type: "task-prompt"
scope: "agent"
owner: "plan-pm"
status: active
version: "1.0.0"
agent: "plan-pm"
---
# Plan-PM 默认 Task Prompt v1.0.0

```xml
<prompt_contract task_id="{{task_id}}" workflow_id="{{workflow_id}}" agent_id="plan-pm">
  <objective>{{objective}}</objective>
  <scope>{{scope}}</scope>
  <forbidden_scope>{{forbidden_scope}}</forbidden_scope>
  <context_refs>{{context_refs}}</context_refs>
  <instructions>
    输出轻量执行卡；写清任务、Owner、最短顺序、依赖、锁、QA 节点、状态和回流条件。
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

只有满足复杂度条件时才升级完整执行方案；计划不得依赖 Git 历史。

