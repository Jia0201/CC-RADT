---
id: "shared-broadcasts-protocol"
title: "广播协议"
type: "shared-doc"
scope: "project"
owner: "lead"
status: active
---
# 广播协议

广播用于向多个 Agent 同步同一条重要状态或约束。它解决的是“所有相关 Agent 都必须知道”的信息，不用于普通交接。

## 适用场景

- 用户改变关键需求或禁止范围。
- Lead 暂停、恢复或重排多 Agent 任务。
- Security-Reviewer 发布安全冻结、敏感路径限制或高风险命令限制。
- Doc 发布索引迁移、标准 Markdown 标准变化或知识库结构调整。
- Memory 发布记忆刷新、恢复点或上下文压缩状态。
- CodeGraph、MCP、Skills、Hooks 的可用性状态影响多个 Agent。

## 不适用场景

- 单个 Agent 的普通任务结果，写入 `shared/handoffs/`。
- 单次命令输出，写入 `logs/`。
- 长期事实，交给 Memory 判断是否进入正式记忆。
- 稳定可复用知识，交给 Doc 判断是否进入知识库。

## 广播字段

广播文件应包含：

- `title`：广播标题。
- `status`：active / expired / archived。
- `owner`：发起 Agent。
- `audience`：影响的 Agent 或目录。
- `started_at`：生效时间。
- `expires_when`：过期条件。
- `summary`：一句话说明。
- `required_action`：相关 Agent 必须执行或避免的动作。
- `related_files`：关联任务、决策、日志或索引。

## 文件模板

```markdown
---
id: "broadcast-YYYYMMDD-topic"
title: "广播标题"
type: "broadcast"
scope: "project"
owner: "lead"
status: active
---
# 广播标题

## 摘要

说明这条广播为什么存在。

## 影响范围

列出受影响的 Agent、目录或任务。

## 必须动作

列出执行前必须遵守的动作。

## 过期条件

说明什么时候可以标记为 expired。

## 关联文件

列出任务单、交接、决策、日志或索引。
```

## 生命周期

1. 创建广播并标记 `status: active`。
2. Lead 或相关 Agent 在任务执行前读取有效广播。
3. 条件满足后，将状态改为 `expired` 或 `archived`。
4. 不直接删除历史广播，除非用户明确要求。
