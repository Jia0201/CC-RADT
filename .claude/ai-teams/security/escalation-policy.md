---
id: "security-escalation-policy"
title: "Lead 接管与回流规则"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# Lead 接管与回流规则

## 强制规则

1. 首次执行失败后，执行 Agent 停止扩展尝试并提交失败事实。
2. Lead 立即检查错误、权限、环境、任务范围、锁、Owner 和安全边界。
3. 只有根因明确、风险可控、范围最小且验证方式清楚时，允许一次定向重试。
4. 定向重试再次失败后，不得继续同方向尝试；Lead 必须改派、拆分、降级、等待用户或关闭。
5. 敏感文件、删除、不可逆命令、安全阻断、权限拒绝、锁/Owner 冲突直接进入 Lead + Security-Reviewer 复核，不允许自主重试。
6. Lead 的接管和路由必须写入 `shared/events/`；需要等待、跨 Agent 或未解决阻塞时写入 `shared/escalations/`。

## 状态同步

- 执行失败：Agent 状态改为 `BLOCKED` 或 `TAKEOVER_REQUIRED`。
- Lead 接管：Lead 状态改为 `DIAGNOSING`。
- 定向重试：记录改变的唯一变量和验证方式。
- 回流/改派：同步 `shared/task-plan.md`、`shared/pipeline-status.md` 和 `shared/supervision/heartbeat-current.md`。

## 禁止行为

- 不定位原因就重复相同命令。
- 用提权、禁用 Hook、跳过权限、删除锁或扩大文件范围绕过失败。
- 把无响应、空闲或停止误判为完成。
- 在失败事实未落盘前清理现场。

详细动作见 [retry-flowback](../shared/escalations/retry-flowback.md) 和 [supervision-policy](./supervision-policy.md)。
