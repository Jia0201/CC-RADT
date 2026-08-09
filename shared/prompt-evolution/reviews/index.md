---
id: "shared-prompt-evolution-reviews-index"
title: "提示词评审索引"
type: "shared-index"
scope: "project"
owner: "qa"
status: active
---
# 提示词评审索引

评审记录证明候选是否满足根因、质量、安全、权限和回滚门禁。评测通过不自动激活；Lead 仍需执行受控激活。

## 命名

```text
PE-REVIEW-YYYYMMDD-<candidate-id>-<reviewer>.md
```

## 评审表

| 评审 ID | 候选 | 评审类型 | 评审者 | 结论 | 时间 |
|---|---|---|---|---|---|

## 必需评审

- QA：原始失败、基线、反向、输出契约和稳定性。
- Security-Reviewer：注入、敏感内容、工具、权限和能力扩张。
- Role：system 提示词职责一致性。
- Plan-PM：task/user 提示词变量、范围和验收结构。
- Lead：激活条件、运行窗口和回滚目标。

E3 候选必须具备 Role、QA、Security-Reviewer 和 Lead 的明确批准；按风险需要用户确认。
