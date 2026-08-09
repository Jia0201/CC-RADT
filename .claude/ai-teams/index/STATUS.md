---
id: "index-status"
title: "AI-Teams 状态"
type: "index"
scope: "target-project"
owner: "doc"
status: active
---
# AI-Teams 状态

## 当前状态

- 阶段：AI-Teams 已安装，等待目标项目初始化
- 活动任务：无
- 目标项目画像：未初始化

## 下一步

在目标项目根目录执行：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

Windows PowerShell：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write
```
