---
id: "command-context-compact"
title: "上下文压缩指令"
type: "command"
scope: "project"
owner: "memory"
status: active
---
# 上下文压缩指令

## 用途

手动生成当前会话或指定目录的上下文压缩摘要，作为恢复材料或记忆候选来源。

## 命令

```bash
bash tools/bin/ai-teams-context-compact.sh --source memory/conversations/sessions --write
```

## 参数

| 参数 | 说明 |
|---|---|
| `--source <路径>` | 要摘要的会话材料目录或文件 |
| `--output <目录>` | 输出目录，默认 `memory/conversations/compact` |
| `--write` | 写入压缩摘要 |
| `--dry-run` | 只输出计划，不写文件 |

## 规则

- 不读取敏感文件内容。
- 不直接写正式记忆。
- 正式记忆由 Memory 根据 `memory/refresh-rules.md` 筛选。
- 压缩摘要必须链接任务、Agent、Memory 和相关索引。
