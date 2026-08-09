---
id: "shared-prompt-evolution-events-index"
title: "提示词演进事件索引"
type: "shared-index"
scope: "project"
owner: "lead"
status: active
---
# 提示词演进事件索引

事件目录采用追加式写入。Agent、QA、Lead、用户纠正处理器和 Hook 可以提交事件；Hook 只能采集、脱敏和写入，不得生成候选或修改 active 提示词。

## 命名

```text
PE-EVENT-YYYYMMDD-HHMMSS-<agent>-<slug>.md
```

使用 [PROMPT_EVENT_TEMPLATE](./PROMPT_EVENT_TEMPLATE.md) 创建事件。事件不得覆盖其他 Agent 已写文件。

## 事件表

| 事件 ID | 时间 | Agent | 类型 | 等级建议 | 状态 | 来源任务 |
|---|---|---|---|---|---|---|

## 写入要求

- 记录预期、实际、脱敏证据路径、失败类型和重复次数。
- 明确当前只是信号还是已由 Lead/QA 确认的根因。
- 不复制完整工具输出、攻击载荷、system 提示词或敏感内容。
- 事件可以路由到 Prompt、项目事实、工具、Skills、MCP、Memory、Security 或工作流。
- 进入候选后在事件中补充候选路径；未进入候选时记录 E0 或非 Prompt 根因。
