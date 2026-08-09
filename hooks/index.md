---
id: "hooks-index"
title: "Hooks"
type: "hook-doc"
scope: "project"
owner: "lead"
status: active
---
# Hooks

AI-Teams 使用 Claude Code 官方生命周期 Hook，将安全拦截、Lead 运行守卫、上下文压缩和多 Agent 监督接入实际运行时。

## Hook 清单

| Hook | 用途 |
|---|---|
| ai-teams-run-hook | Hook 跨平台运行器，Node 原生执行，保留 Bash / PowerShell 包装入口 |
| ai-teams-user-prompt-submit | 每次用户 prompt 进入前注入 AI-Teams Lead / 多 Agent 运行守卫 |
| protected-file-check | 修改高风险文件前提醒或阻断 |
| sensitive-file-check | 阻止读取敏感文件内容 |
| delete-check | 删除文件前检查风险 |
| daily-log-compress | 每日压缩普通日志 |
| external-change-check | 启动时检查外部修改 |
| git-activity-watch | 每次需求前增量记录提交元数据、变更文件、upstream 与工作区状态并刷新 project；不读取 diff 或历史代码 |
| native-claude-memory-audit | 审计 Claude Code 原生 auto memory 残留，采用 audit-and-ignore |
| protected-file-lock-check | 修改受保护文件前检查锁 |
| index-stale-mark | 关键文件修改后标记索引为可能过期 |
| context-compression-check | 检测上下文材料是否达到压缩阈值，并在 Compact 生命周期生成恢复候选 |
| lock-timeout-check | 检测共享锁是否超过过期时间或默认 TTL |
| agent-heartbeat | 监听 Agent 生命周期、工具失败和权限拒绝；每 10 秒刷新心跳并触发 Lead 接管 |
| prompt-evolution-event | 将失败、权限拒绝、停止异常和可识别的失败完成事件写为脱敏 E0 提示词进化事实；不修改 prompt |
| prompt-contract-check | 在调用命名 AI-Teams Agent 前校验结构化 user/task prompt 合同 |

## 已启用事件

- `SessionStart`：注入 AI-Teams 根目录、安全、记忆和监督上下文，并审计 Claude Code 原生 auto memory。
- `UserPromptSubmit`：注入 Lead 与默认多 Agent 守卫。
- `PreToolUse`：敏感文件、受保护文件、锁和删除检查。
- `PostToolUse`：更新索引状态和 Agent 心跳活动。
- `PostToolUseFailure`、`PermissionDenied`、`StopFailure`：立即要求 Lead 接管。
- `SubagentStart`、`SubagentStop`、`TeammateIdle`、`TaskCompleted`：登记 Agent 生命周期并检查交接。
- `PostToolUseFailure`、`PermissionDenied`、`StopFailure`：同时调用 `hooks/scripts/prompt-evolution-event.mjs` 记录脱敏 E0 事实。
- `SubagentStop`、`TaskCompleted`：仅在输出包含失败、阻塞、权限、错误或未完成信号时记录提示词进化事件。
- `PreToolUse: Agent`：调用 `hooks/scripts/prompt-contract-check.mjs`，拒绝缺少版本、任务 ID、目标、项目上下文、范围、输出合同和验收条件的命名 Agent 派单。
- `PreCompact`、`PostCompact`：在 Claude 自动或手动压缩前后生成恢复候选。
- `Stop`：补充上下文阈值、锁超时、Git 辅助状态和心跳检查。

## 用户 Prompt 入口 Hook

- 运行器：`hooks/scripts/ai-teams-run-hook.mjs`
- Bash 包装：`hooks/scripts/ai-teams-run-hook.sh`
- PowerShell 包装：`hooks/scripts/ai-teams-run-hook.ps1`
- 脚本：`hooks/scripts/ai-teams-user-prompt-submit.sh`
- 触发：Claude Code `UserPromptSubmit` 阶段。
- 作用：通过 JSON `additionalContext` 把 AI-Teams runtime guard 注入当前请求上下文，明确“非平凡任务默认多 Agent”“不要等待用户说开启多 Agent”“不要把 AI-Teams 任务交给 `general-purpose`”“先解析 AI_TEAMS_ROOT 与目标项目路径”。
- 可见性：Hook 不把完整守卫正文展示给用户；如需展示入口状态，只显示“读取 AI 团队详情”。
- 处理者：Lead 仍是调度者；Hook 只负责注入运行守卫，不直接创建任务、不写记忆、不改项目文件。
- 维护者：Security-Reviewer 负责 Hook 安全边界，Role 负责 Agent 入口与 runtime guard 的一致性，Doc 负责索引与图谱。

## 上下文压缩 Hook

- 运行器：`hooks/scripts/ai-teams-run-hook.mjs`
- Bash 包装：`hooks/scripts/ai-teams-run-hook.sh`
- PowerShell 包装：`hooks/scripts/ai-teams-run-hook.ps1`
- 脚本：`hooks/scripts/context-compression-check.sh`
- 配置示例：`hooks/configs/context-compression.example.env`
- 提示模板：`hooks/templates/context-compression-notice.md`
- 安全规则：[context-compression-policy](../security/context-compression-policy.md)
- 手动指令：[context-compact](../tools/commands/ai/context-compact.md)
- 触发：`PreCompact`、`PostCompact`，以及 `Stop` 阶段的阈值补充检查。
- 处理者：Hook 写 `memory/conversations/compact/*-memory-recovery-candidate.md`，不直接写正式记忆；是否进入共享记忆、Agent 独立记忆或知识库候选，由 Memory 按 [context-compression](../memory/context-compression.md) 和 [refresh-rules](../memory/refresh-rules.md) 判断。

## 原生 Claude Memory 审计 Hook

- 运行器：`hooks/scripts/ai-teams-run-hook.mjs`
- Hook 名称：`native-claude-memory-audit`
- 工具：`tools/bin/ai-teams-memory-audit.mjs`
- 触发：`SessionStart`
- 输出：`memory/native-claude-memory-audit.md`、`shared/events/native-claude-memory-audit.json`
- 边界：只读取 `~/.claude/projects/*/memory` 的目录和文件元数据，不读取内容；发现残留时提示 `audit-and-ignore`，不得作为 AI-Teams 事实来源。

## 多 Agent 心跳 Hook

- 脚本：`hooks/scripts/agent-heartbeat.mjs`
- 事件输出适配器：`hooks/scripts/hook-output.mjs`
- 契约测试：`tools/bin/ai-teams-hook-output-test.mjs`
- 提示词事件脚本：`hooks/scripts/prompt-evolution-event.mjs`
- 派单合同脚本：`hooks/scripts/prompt-contract-check.mjs`
- 触发：`SubagentStart`、`PostToolUse`、`PostToolUseFailure`、`PermissionDenied`、`SubagentStop`、`TeammateIdle`、`TaskCompleted`、`StopFailure`。
- 周期：后台监控每 10 秒刷新 [heartbeat-current](../shared/supervision/heartbeat-current.md)；30 秒没有 Hook 活动时生成 Lead 接管事件。
- 即时接管：工具失败、权限拒绝或停止失败无需等待 30 秒。
- 边界：Hook 发现和记录异常，Lead 执行诊断、一次定向重试、改派或停止；规则见 [supervision-policy](../security/supervision-policy.md)。

### 事件输出契约

- `UserPromptSubmit`、`PostToolUse` 等允许补充上下文的事件，使用 `hookSpecificOutput.additionalContext`。
- 为兼容仍使用旧事件 Schema 的 Claude Code 版本，AI-Teams 的 `Stop` 不输出 `hookSpecificOutput.additionalContext`。需要 Lead 继续接管时，首次仅输出新旧版本共同支持的顶层 `decision: "block"` 与 `reason`。
- Claude Code 因阻断再次触发 `Stop` 时会传入 `stop_hook_active: true`；此时 Hook 必须放行，禁止形成无限停止循环。
- `SubagentStop`、`TaskCompleted`、`TeammateIdle`、`PermissionDenied`、`PreCompact`、`PostCompact` 和 `StopFailure` 不得借用其他事件的 `hookSpecificOutput` Schema。它们只落盘状态，或使用对应事件官方支持的字段和退出码。
- 新增或修改 Hook 后，必须运行 `node tools/bin/ai-teams-hook-output-test.mjs` 和全量自检。

## Git 辅助变化监听

- 运行器：`hooks/scripts/ai-teams-run-hook.mjs`
- Hook 模式：`git-activity-watch`（旧模式名 `git-activity-watch.sh` 仅保留兼容，不对应独立脚本）
- 触发：`UserPromptSubmit` 与 `Stop`
- 输出：每次刷新 `shared/events/git-state.json`、`project/change-log.md` 和 `project/context.md`；检测到变化时写入 `logs/hook/` 并更新 `index/STATUS.md`。
- 边界：没有 Git 时直接跳过；远端检查使用非交互短超时；最多读取 20 条增量提交元数据和 200 个变更文件名，不读取 diff、提交正文、历史代码或敏感文件内容。
- 处理：Lead 在规划前读取 `project/change-log.md`；Doc 按 UI、API、依赖、测试、数据库、安全和文档关系复核对应项目画像；远端待同步内容不得视为当前事实。

## 锁超时 Hook

- 运行器：`hooks/scripts/ai-teams-run-hook.mjs`
- Bash 包装：`hooks/scripts/ai-teams-run-hook.sh`
- PowerShell 包装：`hooks/scripts/ai-teams-run-hook.ps1`
- 脚本：`hooks/scripts/lock-timeout-check.sh`
- 触发：Claude Code `Stop` 阶段。
- 安全规则：[lock-policy](../security/lock-policy.md)
- 处理者：Hook 只生成超时报告，不自动释放锁；Lead 按锁规则仲裁，必要时更新 [LOCKS](../shared/locks/LOCKS.md)。
