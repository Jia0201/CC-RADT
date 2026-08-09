---
id: "project-project"
title: "目标项目管理入口"
type: "project-doc"
scope: "target-project"
owner: "doc"
status: active
---
# 目标项目管理入口

本文件是安装后的目标项目管理入口。初始化前保持空白，不携带 AI-Teams 主工程的项目画像、任务状态或记忆内容。

## 使用方式

在目标项目根目录执行：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```

Windows PowerShell：

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/ai-teams/tools/bin/ai-teams-init-project.ps1 -Target (Get-Location) -Write
```

初始化会写入自动扫描区块，并吸收目标项目已有的 `CLAUDE.md`、`.qcoder`、`.qwen`、`.cursorrules`、Copilot/Gemini/Windsurf 等非敏感规则入口。

后续业务执行中，Doc 并行维护 `project/`；Lead 关闭非平凡任务前必须检查 Doc 是否已处理或明确跳过 project/context.md、需求、计划、命令、架构、验证、风险、项目规则和项目图谱更新。
