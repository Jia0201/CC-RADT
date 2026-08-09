---
id: "tools-commands-ai-memory-refresh"
title: "刷新记忆指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 刷新记忆指令

## 用途

清理过时记忆、合并重复记忆、标记不确定记忆，并从任务摘要中提取候选记忆。

## 输入

- 刷新范围。
- 候选记忆来源。
- 是否只生成刷新建议。

## 流程

1. 读取 `index/INDEX.md`。
2. 读取记忆候选。
3. 清理过时记忆。
4. 合并重复记忆。
5. 标记不确定记忆。
6. 更新正式记忆。
7. 更新索引。
8. 写入日志。
9. 输出结果。

## 读取文件

- `index/INDEX.md`
- `memory/MEMORY.md`
- `memory/agents/`
- `memory/candidates/`
- `logs/task/`
- `memory/conversations/compact/`

## 修改文件

- `memory/`
- `memory/candidates/`
- `memory/archive/`
- `index/STATUS.md`
- `logs/command/`

## 安全边界

- 正式记忆只保存长期稳定事实。
- 不保存原始日志、大段代码或敏感信息。
- 不确定内容先标记，不直接覆盖。

## 输出

- 用户响应中的执行结果摘要。
- 指令对应目录中的产物、日志或报告。
- 需要人工确认时，输出明确的确认项和风险。

## 验证方式

- 确认记忆文件仍可读。
- 确认移除和合并项有记录。
- 确认索引状态更新。

## 日志

- `logs/command/`
