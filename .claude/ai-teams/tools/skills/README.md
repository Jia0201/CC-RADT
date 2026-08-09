---
id: "tools-skills-readme"
title: "Skills 工具"
type: "tool-doc"
scope: "project"
owner: "lead"
status: active
---
# Skills 工具

## 用途

保存 Skills 查询、受控安装和 Agent 级 Skills 管理说明。

## 状态

v1.0 已提供最小查询与本地安装脚本。

## 可执行入口

```bash
bash tools/bin/ai-teams-skills-list.sh
bash tools/bin/ai-teams-skills-install.sh --name <名称> --agent <Agent> --source <本地Skill目录> --plan
```

## 安全边界

- 默认把通过审查的 Skill 复制到工程内 `skills/agents/<agent>/<skill>/` 或 `skills/shared/<skill>/`。
- registry 只登记工程内相对路径，发布时不依赖外部目录。
- 不自动拉取未知第三方 GitHub 代码。
- 不执行 Skill 中的脚本。
- 不读取敏感文件内容。
