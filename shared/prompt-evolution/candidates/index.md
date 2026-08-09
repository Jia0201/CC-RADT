---
id: "shared-prompt-evolution-candidates-index"
title: "提示词候选索引"
type: "shared-index"
scope: "project"
owner: "role"
status: active
---
# 提示词候选索引

候选是尚未激活的最小变更。system 候选由 Role 主责，task/user 候选由 Plan-PM 主责；Lead、QA 和 Security-Reviewer分别完成决策、评测与安全门禁。

## 命名

```text
PE-CANDIDATE-YYYYMMDD-<agent>-<prompt-type>-vX.Y.Z.md
```

## 候选表

| 候选 ID | Agent | 类型 | 等级 | Owner | 状态 | 来源事件 | 目标版本 |
|---|---|---|---|---|---|---|---|

## 规则

- 使用 [PROMPT_CANDIDATE_TEMPLATE](./PROMPT_CANDIDATE_TEMPLATE.md)。
- 候选必须引用来源事件、当前版本、目标文件、最小差异、评测计划和回滚目标。
- 候选不得直接覆盖 active。
- 候选不得包含敏感内容或完整隐藏 system 提示词。
- 候选被拒绝或回滚后保留记录，不删除证据链。
- KB 不保存候选及其动作规则。
