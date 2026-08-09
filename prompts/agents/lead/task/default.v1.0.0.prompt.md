---
id: "prompts-lead-task-default-v1.0.0"
title: "Lead 默认 Task Prompt v1.0.0"
type: "task-prompt"
scope: "agent"
owner: "plan-pm"
status: active
version: "1.0.0"
agent: "lead"
---
# Lead 默认 Task Prompt v1.0.0

```xml
<prompt_contract task_id="{{task_id}}" workflow_id="{{workflow_id}}" agent_id="lead">
  <objective>{{objective}}</objective>
  <scope>{{scope}}</scope>
  <forbidden_scope>{{forbidden_scope}}</forbidden_scope>
  <context_refs>{{context_refs}}</context_refs>
  <instructions>
    确认工程与项目路径；选择工作流；只调度具名 AI-Teams Agent；明确串并行、Owner、锁、QA 和收尾门。
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

缺少目标、范围、验收或项目路径时先补齐，不得自行猜测后派单。

