---
id: "PE-CANDIDATE-YYYYMMDD-agent-type-vX.Y.Z"
title: "提示词候选模板"
type: "prompt-candidate"
scope: "project"
owner: "role"
status: candidate
---
# 提示词候选：Agent / 类型 / 版本

## 元信息

| 字段 | 内容 |
|---|---|
| 候选 ID | PE-CANDIDATE-YYYYMMDD-agent-type-vX.Y.Z |
| 来源事件 |  |
| 关联任务 |  |
| Agent |  |
| 提示词类型 | system / task-user / routing / retry / output-contract |
| 演进等级 | E1 / E2 / E3 |
| 主 Owner | Role / Plan-PM |
| 当前版本 |  |
| 候选版本 |  |
| 当前内容哈希 |  |
| 候选内容哈希 |  |
| 状态 | candidate / reviewing / evaluated / approved / rejected / active / rolled-back |

## 根因与目标

- 已确认根因：
- 为什么属于 Prompt：
- 不改 Prompt 的替代方案：
- 排除替代方案的证据：
- 预期改善：

## 目标文件

| 文件 | 当前 Owner | 允许变更范围 | 是否涉及权限或安全边界 |
|---|---|---|---|

## 最小差异

```diff
# 只放必要的脱敏差异，不粘贴平台隐藏 system 提示词。
```

每一处差异必须关联：

| 差异 | 来源证据 | 预期作用 | 潜在副作用 |
|---|---|---|---|

## 评测计划

- 原始失败转回归：
- 既有基线：
- 反向用例：
- 注入与敏感内容：
- 输出契约：
- 工具与权限：
- 模型与运行次数：
- token 变化：

## 门禁

| 门禁 | 必需 | 状态 | 负责人 | 证据 |
|---|---|---|---|---|
| 根因确认 | 是 | pending | Lead + QA |  |
| Owner 评审 | 是 | pending | Role / Plan-PM |  |
| QA 评测 | 是 | pending | QA |  |
| 安全评审 | 是 | pending | Security-Reviewer |  |
| Lead 激活 | 是 | pending | Lead |  |
| 用户确认 | E3 按风险 | not-required | User |  |

## 激活与回滚

- 生效时间：下一次 Agent 调用 / 新会话
- 上一 active 版本：
- 回滚来源：
- 监控窗口：
- 触发回滚的条件：

## 敏感内容检查

- 未包含密钥、token、证书、credentials 或隐私：是 / 否
- 未包含完整工具输出或攻击载荷：是 / 否
- 未泄漏平台隐藏 system 提示：是 / 否
