---
id: "shared-contracts-index"
title: "接口契约索引"
type: "shared-doc"
scope: "project"
owner: "doc"
status: active
---
# 接口契约索引

本目录保存跨前端、后端、QA、Mock、SDK 和文档使用的正式接口契约。治理规则见 [interface-contract-policy](../../security/interface-contract-policy.md)，新契约从 [API_CONTRACT_TEMPLATE](./API_CONTRACT_TEMPLATE.md) 创建。

## 契约登记表

| 契约 | 接口 Owner | 消费方 | 版本 | 状态 | 最后更新 | 替代/迁移 |
|---|---|---|---|---|---|---|
| 暂无 | 待指定 | 待登记 | - | - | - | - |

状态只使用：

- `draft`：字段或行为仍在讨论，不可作为发布依据。
- `review`：已提交前端、后端、QA、Security-Reviewer 和 Doc 评审。
- `approved`：确认项和 QA 门禁已满足，可作为实现与发布依据。
- `deprecated`：仍在兼容窗口内，但已有替代版本和停止日期。
- `archived`：不再提供服务，仅保留历史和迁移关系。

## 新建规则

1. 复制 [API_CONTRACT_TEMPLATE](./API_CONTRACT_TEMPLATE.md) 的结构，新文件使用稳定、可识别的接口名称。
2. 指定接口 Owner、前端消费方、QA 和 Doc；多人协作时先按 [lock-policy](../../security/lock-policy.md) 检查写入冲突。
3. 填写字段级请求、响应、错误、兼容性和验证证据，不保留含糊占位语句。
4. 将契约加入上方登记表，并与对应 Schema、实现、项目架构和验证文档建立 标准 Markdown 链接。
5. 契约获批、弃用、替代或归档后，由 Doc 更新状态、版本、日期和迁移链接。

## 使用约束

- 前后端、Mock、SDK、Schema 和 QA 用例必须引用同一契约版本。
- `draft` 或 `review` 不得被标记为已完成发布门禁。
- 契约冲突、字段漂移和破坏性变更按 [interface-contract-policy](../../security/interface-contract-policy.md) 阻断并回流。
- 历史契约不直接删除；使用 `deprecated` 或 `archived` 并指向替代契约。

## Doc 维护检查

- 登记表中的链接、Owner、消费方、版本、状态和日期是否完整。
- 契约 frontmatter、正文、Schema、QA 证据和迁移链接是否一致。
- [architecture](../../project/architecture.md)、[verification](../../project/verification.md) 及相关索引是否需要同步。
- 任务关闭时是否已给出“已更新 / 无需更新 / 待确认 / blocked”结论。
