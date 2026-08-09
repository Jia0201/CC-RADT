---
id: "tools-commands-ai-prompt-evolve"
title: "提示词演进候选指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 提示词演进候选指令

## 调用

```text
/ai:prompt-evolve <event-id|agent> [--level E0|E1|E2|E3] [--prompt-type system|task-user|routing|retry|output-contract]
```

## 执行目标

根据失败、用户纠正或评测证据完成根因分析，并在证据充分时生成最小提示词候选。该指令不得直接修改 active 提示词。

## 执行步骤

1. 读取三份 `security/prompt-*.md` 策略。
2. 定位已有事件；如果只有原始问题，使用 [PROMPT_EVENT_TEMPLATE](../../../shared/prompt-evolution/events/PROMPT_EVENT_TEMPLATE.md) 创建脱敏事件。
3. 由 Lead 与 QA 区分 Prompt 根因和项目事实、知识、记忆、工具、权限、工作流或模型根因。
4. 按 [prompt-evolution-policy](../../../security/prompt-evolution-policy.md) 判断 E0-E3：
   - E0：只记录观察或路由非 Prompt Owner。
   - E1：创建候选，不评测、不激活。
   - E2：创建低风险候选并要求完整评测。
   - E3：创建高风险候选并标记强制多方审批。
5. 根据 Prompt 类型分配 Owner：system 归 Role，task/user 归 Plan-PM，Lead 负责路由与激活决策。
6. 使用 [PROMPT_CANDIDATE_TEMPLATE](../../../shared/prompt-evolution/candidates/PROMPT_CANDIDATE_TEMPLATE.md) 写最小差异、失败转回归、反向用例、风险和回滚目标。
7. 更新事件中的候选引用；如需更新 [active-run](../../../shared/prompt-evolution/active-run.md)，由 Lead 取得文件级锁后汇总。

## 根因门禁

出现以下情况不得生成 Prompt 候选：

- 项目接口、字段、UI 或架构事实错误。
- Skills、MCP、工具、权限、锁、删除或敏感文件门禁错误。
- 证据只来自一次不可复现失败。
- 仅通过追加警告语句掩盖模型能力或工作流问题。

将上述问题路由给正确 Owner，并在事件中说明原因。

## 输出

- 事件 ID 和根因结论。
- 演进等级及判断依据。
- 候选路径或 E0/非 Prompt 路由结果。
- Owner、必需评审、评测计划和回滚目标。
- 明确声明“未修改 active 提示词”。

## 安全边界

- Hook 只能提供事件，不能代替本指令生成候选。
- 不保存敏感内容、完整日志、攻击载荷或隐藏 system 提示词。
- Agent 不得审批自己的候选。
- KB 不保存动作规则、事件、候选或评审。
