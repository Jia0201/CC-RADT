---
id: "hooks-context-compression-notice"
title: "上下文压缩提示模板"
type: "hook-template"
scope: "project"
owner: "memory"
status: active
---
# 上下文压缩提示

## 触发原因

- 检测目标：
- 当前估算：
- 阈值：
- 触发时间：

## 建议动作

运行手动指令：

```bash
bash tools/bin/ai-teams-context-compact.sh --source memory/conversations/sessions --write
```

## 安全边界

- 不读取敏感文件内容。
- 不直接写正式记忆。
- 正式记忆由 Memory 筛选。
