---
id: "project-context"
title: "目标项目运行期上下文"
type: "project-doc"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目运行期上下文

尚未初始化目标项目。

## 下一步

在目标项目根目录执行：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

Windows PowerShell：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write
```
