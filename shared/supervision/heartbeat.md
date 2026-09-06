---
id: "shared-supervision-heartbeat"
title: "多 Agent 心跳与 Lead 接管协议"
type: "shared-protocol"
scope: "project"
owner: "lead"
status: active
---
# 多 Agent 心跳与 Lead 接管协议

多 Agent 启动后，Lead 仍然是主动协调者，不能派单后等待所有 Agent 自行结束。Hook 运行器维护机器可读状态，Lead 按 10 秒节奏检查状态、范围、错误、权限和安全风险。

## 运行链

1. `SubagentStart` 登记 Agent 并启动后台心跳监控。
2. `PostToolUse` 更新 Agent 最近工具、目标和活动时间。
3. 后台监控每 10 秒刷新 `shared/supervision/heartbeat-current.md`。
4. 连续 30 秒没有 Hook 活动时标记 `idle-review`，提示 Lead 区分正常思考、等待与真实停滞；只有确认异常后才升级为 `takeover-required` 并生成接管事件。
5. `PostToolUseFailure`、`PermissionDenied`、`StopFailure` 立即要求 Lead 接管，不等待超时。
6. `SubagentStop`、`TaskCompleted`、`TeammateIdle` 要求 Lead 检查交接和验证，不把“停止”自动等同于“完成”。
7. 会话停止时仍有待接管 Agent，首次 `Stop` 使用顶层 `decision: "block"` 和 `reason` 让 Lead 继续处理。
8. 再次停止时若输入含 `stop_hook_active: true`，Hook 必须放行，避免反复阻断。

## 每次检查内容

- Agent 是否仍在处理本次任务，是否扩大范围或访问无关文件。
- 是否出现报错、权限拒绝、锁冲突、Owner 冲突或安全阻断。
- 最近 30 秒是否没有 Hook 活动；这只是复核信号，不自动等同于失败或卡断。
- 当前产出是否有文件、验证或交接证据。
- 是否需要 Lead 立即接管、一次定向重试、改派、拆分或停止。

## 官方能力边界

Claude Code Hook 是事件驱动机制，不能让主模型脱离事件自行“思考”。AI-Teams 使用后台进程每 10 秒检查并落盘；在失败、权限拒绝和 Agent 生命周期事件发生时，把接管上下文立即反馈给 Lead。Lead 还必须在调度动作中主动轮询任务状态，不能只依赖 Hook 文件。

不同 Claude Code 版本的 Hook JSON Schema 存在差异。AI-Teams 的 `Stop` 统一使用顶层 `decision` 与 `reason`，事件输出由 `hooks/scripts/hook-output.mjs` 分流，禁止把一种事件的专属字段套用到另一种事件。

## 状态文件

- 当前可读状态：`shared/supervision/heartbeat-current.md`
- 运行时状态：`shared/supervision/.runtime/heartbeat-state.json`
- 接管事件：`shared/events/*-lead-takeover-*.md`
- 规则本体：[supervision-policy](../../security/supervision-policy.md)

`.runtime/` 是可重建运行状态，不进入正式记忆或知识库。
