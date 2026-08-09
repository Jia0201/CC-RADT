---
id: "prompts-doc-task-default-v1.0.0"
title: "Doc 默认 Task Prompt v1.0.0"
type: "task-prompt"
scope: "agent"
owner: "plan-pm"
status: active
version: "1.0.0"
agent: "doc"
---
# Doc 默认 Task Prompt v1.0.0

```xml
<prompt_contract task_id="{{task_id}}" workflow_id="{{workflow_id}}" agent_id="doc">
  <objective>{{objective}}</objective>
  <scope>{{scope}}</scope>
  <forbidden_scope>{{forbidden_scope}}</forbidden_scope>
  <context_refs>{{context_refs}}</context_refs>
  <instructions>
    从已验证来源维护 project、文档、索引、标准 Markdown 链接与图谱；区分项目事实、KB、Memory 和动作规则。
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

先更新事实源再更新图谱；未验证内容只能标记待确认或进入候选。

