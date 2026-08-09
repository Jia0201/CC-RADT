---
id: "rule-security-index"
title: "安全规则路由"
type: "rule-index"
scope: "project"
owner: "security-reviewer"
status: active
---
# 安全规则路由

本文件只帮助 Agent 定位必要安全规则，不复制 `security/` 的动作规则正文。

| 风险类型 | 必读规则 | 触发条件 |
|---|---|---|
| 文件写入边界 | [file-ownership](../../security/file-ownership.md) | 新建、编辑、移动工程或项目文件 |
| 敏感内容 | [sensitive-files](../../security/sensitive-files.md) | 路径可能含密钥、token、证书、环境变量或凭据 |
| 删除与清理 | [delete-policy](../../security/delete-policy.md) | 删除、覆盖、批量移动或清理文件 |
| 多 Agent 冲突 | [lock-policy](../../security/lock-policy.md), [LOCKS](../../shared/locks/LOCKS.md) | 多 Agent 修改相同或关联文件 |
| 任务和状态 | [task-policy](../../security/task-policy.md), [state-policy](../../security/state-policy.md) | 创建任务、改变流水线或任务状态 |
| 状态原子写入 | [state-transaction-policy](../../security/state-transaction-policy.md) | 并发更新状态板、锁或监督记录 |
| 失败与接管 | [escalation-policy](../../security/escalation-policy.md), [supervision-policy](../../security/supervision-policy.md) | 失败、无权限、卡断、跑偏或多 Agent 停滞 |
| 项目事实 | [project-policy](../../security/project-policy.md), [runtime-maintenance-policy](../../security/runtime-maintenance-policy.md) | 初始化或持续维护目标项目画像 |
| 前后端契约 | [interface-contract-policy](../../security/interface-contract-policy.md) | API、DTO、字段、枚举、表单或页面联调 |
| MCP / Hook | [mcp-policy](../../security/mcp-policy.md), [index](../../hooks/index.md) | 安装能力或修改自动化入口 |
| 记忆压缩 | [context-compression-policy](../../security/context-compression-policy.md) | 上下文阈值、压缩、恢复点或记忆写入 |
| 自建规则 | [rule-policy](../../security/rule-policy.md), [index](../custom/index.md) | 新增、审查或启用 `rule/custom/` 路由 |

只读取与当前风险匹配的规则；Security-Reviewer 需要全局审计时才进入 [index](../../security/index.md) 的完整清单。
