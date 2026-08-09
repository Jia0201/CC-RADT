---
id: "PE-REVIEW-YYYYMMDD-candidate-reviewer"
title: "提示词评审模板"
type: "prompt-review"
scope: "project"
owner: "qa"
status: reviewing
---
# 提示词评审：候选 ID

## 元信息

| 字段 | 内容 |
|---|---|
| 评审 ID | PE-REVIEW-YYYYMMDD-candidate-reviewer |
| 候选 ID |  |
| 来源事件 |  |
| 演进等级 | E1 / E2 / E3 |
| 评审类型 | QA / Role / Plan-PM / Security / Lead / User |
| 评审者 |  |
| 评测环境 |  |
| 开始时间 |  |
| 结束时间 |  |
| 结论 | approved / changes-required / rejected |

## 根因复核

- Prompt 根因证据充分：是 / 否
- 是否存在更正确的非 Prompt 路由：
- 候选是否保持最小差异：是 / 否
- 说明：

## 评测结果

| 用例组 | 用例数 | 旧版本 | 候选版本 | 结论 | 证据 |
|---|---:|---|---|---|---|
| 原始失败转回归 |  |  |  |  |  |
| 既有基线 |  |  |  |  |  |
| 反向用例 |  |  |  |  |  |
| 输出契约 |  |  |  |  |  |
| 工具与权限 |  |  |  |  |  |
| 注入与敏感内容 |  |  |  |  |  |

## 质量与风险

- 是否产生职责漂移：
- 是否扩大工具或数据权限：
- 是否增加误拒绝或误路由：
- token 变化：
- 模型依赖：
- 未解决风险：

## 敏感内容检查

- 事件、候选和用例均已脱敏：是 / 否
- 未保存密钥、token、证书、credentials 或隐私：是 / 否
- 未复制完整攻击载荷或隐藏 system 提示：是 / 否

## 激活建议

- 建议：批准 / 修改后复评 / 拒绝
- 允许生效时间：下一次调用 / 新会话 / 不允许
- 监控条件：
- 回滚条件：
- 用户确认是否必需：

## 签署

- QA：
- Role：
- Plan-PM：
- Security-Reviewer：
- Lead：
- User（如需）：

任何空缺的必需签署均视为未通过，不得激活。
