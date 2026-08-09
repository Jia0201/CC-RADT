---
id: "prompts-common-task-contract-v1.0.0"
title: "AI-Teams Task Prompt 契约"
type: "task-prompt"
scope: "shared"
owner: "plan-pm"
status: active
version: "1.0.0"
---
# AI-Teams Task Prompt 契约

Lead 下发给具名 Agent 的 task/user prompt 必须渲染为以下结构。变量定义见 `prompts/schemas/variables.schema.json`，结果定义见 `prompts/schemas/result.schema.json`。

```xml
<prompt_contract task_id="{{task_id}}" workflow_id="{{workflow_id}}" agent_id="{{agent_id}}">
  <objective>{{objective}}</objective>
  <scope>{{scope}}</scope>
  <forbidden_scope>{{forbidden_scope}}</forbidden_scope>
  <context_refs>{{context_refs}}</context_refs>
  <instructions>{{instructions}}</instructions>
  <acceptance_criteria>{{acceptance_criteria}}</acceptance_criteria>
  <verification>{{verification}}</verification>
  <risk_level>{{risk_level}}</risk_level>
  <lock_refs>{{lock_refs}}</lock_refs>
  <handoff_target>{{handoff_target}}</handoff_target>
  <output_contract>{{output_contract}}</output_contract>
</prompt_contract>
```

## 渲染要求

1. 不得省略目标、范围、禁止范围、验收标准、交接对象和输出契约。
2. `context_refs` 每项必须说明路径、用途和信任等级。
3. 不把完整日志、全量历史或无关文档拼入 prompt；只传最小必要引用。
4. 不把密钥、token、证书、环境变量值或敏感文件内容写进变量。
5. Agent 遇到缺失变量时应返回缺口，不得自行猜测。
