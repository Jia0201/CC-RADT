---
id: "tools-commands-ai-prompt-eval"
title: "提示词评测指令"
type: "command"
scope: "project"
owner: "qa"
status: active
---
# 提示词评测指令

## 调用

```text
/ai:prompt-eval <candidate-id> [--runs <n>] [--model <model>] [--security]
```

## 执行目标

由 QA 对候选执行可追溯评测，并写入独立评审记录。评测通过不等于自动激活。

## 执行步骤

1. 读取候选、来源事件、active 版本和 [prompt-evolution-policy](../../../security/prompt-evolution-policy.md)。
2. 验证候选包含版本、哈希、Owner、目标文件、最小差异和回滚目标。
3. 使用相同输入和环境比较旧版本与候选版本。
4. 至少执行：
   - 原始失败转回归用例。
   - 既有基线用例。
   - “不应该触发”的反向用例。
   - 输出契约、路由、工具和权限用例。
   - 注入与敏感内容用例。
5. `--runs` 未提供时根据风险选择可说明的运行次数；不得把单次随机成功当稳定结论。
6. 使用 [PROMPT_REVIEW_TEMPLATE](../../../shared/prompt-evolution/reviews/PROMPT_REVIEW_TEMPLATE.md) 写评测环境、证据、结果、退化和建议。
7. E2/E3 必须请求 Security-Reviewer 评审；system 候选请求 Role，task/user 候选请求 Plan-PM。
8. 仅在 Lead 取得锁后更新活动状态板为 `evaluated` 或 `changes-required`。

## 通过条件

- 候选修复原始失败。
- 基线无不可接受退化。
- 反向用例没有误触发或过度拒绝。
- 权限、删除、锁、工具和敏感边界未弱化。
- 新旧版本与结果可复现、可追溯。

任何条件不满足都不得建议激活。

## 输出

- 评审文件路径。
- 旧版本与候选的结果摘要。
- 失败、退化和残余风险。
- `approved`、`changes-required` 或 `rejected` 建议。
- 明确声明“评测未自动激活提示词”。

## 安全边界

- 评测样本必须脱敏。
- 不复制完整注入载荷、工具输出或隐藏 system 提示词。
- 不为了通过评测删除失败用例或降低标准。
- KB 不保存评测动作规则和运行记录。
