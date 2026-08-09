---
id: "shared-supervision-heartbeat-current"
title: "多 Agent 心跳状态"
type: "shared-status"
scope: "project"
owner: "lead"
status: active
---
# 多 Agent 心跳状态

- 最近巡检：未运行
- 巡检周期：10 秒
- 运行中或待接管：0

| Agent | 状态 | 最近活动 | 最近工具 | 最近目标 | 错误/停滞原因 | Lead 接管 |
|---|---|---|---|---|---|---|
| 当前无活动 Agent | idle | - | - | - | - | 否 |

## Lead 每次巡检

1. Agent 是否仍在处理本次任务，是否访问无关文件或扩大范围。
2. 是否出现工具错误、权限拒绝、锁/所有权冲突或安全阻断。
3. 是否连续 30 秒没有 Hook 活动，存在卡断、等待或无响应。
4. 是否已有可验证交接；没有证据的停止不得标记完成。
5. 发现异常时立即按 shared/escalations/retry-flowback 接管，不等待多轮自主重试。
