---
id: "shared-prompt-evolution-index"
title: "提示词自进化工作区"
type: "shared-doc"
scope: "project"
owner: "lead"
status: active
---
# 提示词自进化工作区

本目录保存提示词治理的运行期事实：失败事件、候选变更、评审证据和当前激活流程。安全与动作规则以 `security/prompt-*.md` 为准。

## 目录

| 路径 | 内容 | Owner |
|---|---|---|
| [active-run](./active-run.md) | 当前演进、评测、激活或回滚状态 | Lead |
| [index](./events/index.md) | 追加式失败、纠正和风险事件 | 各 Agent / Hook 采集 |
| [index](./candidates/index.md) | 未激活的最小 Prompt 候选 | Role / Plan-PM |
| [index](./reviews/index.md) | QA、安全和 Owner 评审 | QA / Security-Reviewer |

## 使用顺序

1. Agent 或 Hook 使用 [PROMPT_EVENT_TEMPLATE](./events/PROMPT_EVENT_TEMPLATE.md) 记录脱敏事实。
2. Lead 与 QA 判断根因是否确实属于提示词。
3. E0 只观察；E1-E3 使用 [PROMPT_CANDIDATE_TEMPLATE](./candidates/PROMPT_CANDIDATE_TEMPLATE.md) 创建候选。
4. QA 使用 [PROMPT_REVIEW_TEMPLATE](./reviews/PROMPT_REVIEW_TEMPLATE.md) 记录基线、失败转回归、反向和安全评测。
5. Role 或 Plan-PM 确认候选所有权；Security-Reviewer 完成安全门禁。
6. Lead 仅在审批条件满足时受控激活，并更新 [active-run](./active-run.md)。
7. 监控期间出现退化时，按候选中的上一版本进行回滚。

## 核心边界

- Hook 只采集事件，不修改、评测或激活提示词。
- Candidate 不等于 active；评测通过也不等于自动激活。
- Agent 不得批准或激活自己的候选。
- 所有文件只写脱敏证据和路径，不保存密钥、token、凭据、隐私数据或完整 system 提示词。
- KB 是知识库，不保存本工作区的动作规则、事件、候选、评审或激活状态。
- system 提示词新版本不热替换正在运行的 Agent，只从下一次调用或新会话生效。

## 状态

```text
observed -> candidate -> reviewing -> evaluated -> approved
         -> rejected
approved -> active -> monitored -> stable
                    -> rolled-back
```
