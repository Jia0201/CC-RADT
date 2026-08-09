---
id: "kb-agents-memory-02-engineering-rules"
title: "Memory 工程知识"
type: "knowledge"
scope: "agent"
owner: "doc"
status: active
---
# Memory 工程知识

## 共享记忆

- 什么时候使用：对整个团队长期有用的项目事实、用户偏好、恢复线索。
- Codex 要遵守：写入 `memory/MEMORY.md` 前必须有来源、稳定性和非敏感确认。

## Agent 独立记忆

- 什么时候使用：只对某个 Agent 的长期行为有用的偏好、经验、恢复点。
- Codex 要遵守：写入 `memory/agents/<agent>/MEMORY.md`，不要污染共享记忆。

## 候选记忆

- 什么时候使用：当前可能重要但尚未稳定的事实。
- Codex 要遵守：进入 `memory/candidates/`，等待 Memory 判断。

## 上下文压缩

- 什么时候使用：Hook 提示阈值达到、用户要求压缩、长任务要交接。
- Codex 要遵守：压缩结果优先进入 `memory/conversations/compact/` 和恢复点，再判断是否进入候选记忆。

## 运行期记忆维护

- 什么时候使用：出现长期恢复事实、用户偏好、关键决策、中断恢复材料、Hook 压缩提示、记忆写入或记忆替代关系变化。
- Codex 要遵守：读取 [runtime-maintenance-policy](../../../security/runtime-maintenance-policy.md)、[context-compression](../../../memory/context-compression.md) 和 [refresh-rules](../../../memory/refresh-rules.md)；写入后同步 `memory/index.md`、对应 Agent 记忆入口、`memory/conversations/` 或 `memory/archive/index.md`。
- 边界：项目事实交 Doc 合并到 `project/`；可复用技术知识交 Doc 进入知识候选；Memory 只保留恢复和长期协作真正需要的非敏感事实。
