---
id: "security-supervision-policy"
title: "多 Agent 监督与 Lead 接管规则"
type: "security-doc"
scope: "project"
owner: "security-reviewer"
status: active
---
# 多 Agent 监督与 Lead 接管规则

## 强制规则

1. Lead 派出多个 Agent 后必须保持主动协调，每 10 秒检查一次心跳汇总或 Agent 状态。
2. 工具报错、权限拒绝、安全阻断、锁/Owner 冲突、无响应或任务跑偏时，Lead 立即接管诊断。
3. 接管先检查：错误原文、失败工具、目标路径、权限、锁、文件所有权、安全规则、任务边界和验证证据。
4. 未定位原因前不得连续重复相同命令，不得用提权、禁用 Hook、跳过权限或扩大文件范围绕过问题。
5. 仅允许一次有明确根因、有边界、有验证方式的定向重试；再次失败由 Lead 改派、拆分、降级或向用户说明阻塞。
6. Agent 停止、空闲或返回文本不等于任务完成；Lead 必须检查交接、文件、测试和未完成项。
7. 心跳运行状态不得写入正式记忆；经复核的稳定教训才交给 Memory 或 Doc 判断。
8. `Stop` 事件需要阻止会话结束以便 Lead 接管时，AI-Teams 只返回新旧 Claude Code 共同支持的顶层 `decision: "block"` 与 `reason`，不返回兼容性不一致的 `hookSpecificOutput.additionalContext`。
9. 首次 `Stop` 阻断后，Claude Code 会以 `stop_hook_active: true` 再次执行停止 Hook；此时必须放行，禁止无限循环。

## 立即接管条件

- `PostToolUseFailure`、`PermissionDenied`、`StopFailure`。
- 连续 30 秒没有 Hook 活动时先标记 `idle-review`；Lead 复核 Agent 状态、进程和最近目标，只有确认卡断、无响应或跑偏后才升级为接管。
- Agent 修改无关范围、偏离任务目标或未按项目规则执行。
- 敏感文件、删除、不可逆命令、锁或文件所有权冲突。
- Agent 需要用户权限、外部认证或环境条件才能继续。

## Lead 接管输出

Lead 必须写明：

- 当前失败事实和错误原因。
- 权限、安全、锁和 Owner 检查结论。
- 原 Agent 是否停止、是否保留现场。
- 下一动作：一次定向重试、改派、拆分、等待用户或终止。
- 验证方式和关闭条件。

记录写入 `shared/events/` 或 `shared/escalations/`，实时状态同步到 `shared/supervision/heartbeat-current.md`。

## Hook 输出边界

- 可向主上下文注入附加内容的事件统一经 `hooks/scripts/hook-output.mjs` 适配。
- `Stop`、`SubagentStop`、`TaskCompleted`、`TeammateIdle`、`PermissionDenied`、`PreCompact`、`PostCompact`、`StopFailure` 不得伪装成 `UserPromptSubmit` 或 `PostToolUse` 输出。
- 事件专属输出不受支持时，Hook 仅完成状态落盘并返回通用成功 JSON；Lead 从监督状态和 Agent 结果继续协调。
- 修改输出结构后必须通过 `tools/bin/ai-teams-hook-output-test.mjs`。
