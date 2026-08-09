---
id: "tools-commands-ai-skills-install"
title: "安装 Skills 指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 安装 Skills 指令

## 用途

为指定 Agent 安装 Skill。

## 输入

- Skill 来源地址或本地路径。
- 目标 Agent。
- 安装范围：共享或 Agent 专属。

## 可执行入口

```bash
bash tools/bin/ai-teams-skills-install.sh --name <名称> --agent <Agent名称> --source <本地Skill目录> --plan
bash tools/bin/ai-teams-skills-install.sh --name <名称> --scope shared --source <本地Skill目录> --plan
```

## 流程

1. 读取 `index/INDEX.md`。
2. 读取用户提供的 GitHub 地址或本地目录。
3. 检查 `SKILL.md`。
4. 检查目录结构。
5. 检查安全风险。
6. 安装到目标 Agent。
7. 更新 `skills/registry.json`。
8. 更新 Agent 索引。
9. 写入日志。
10. 输出结果。

## 读取文件

- `index/INDEX.md`
- `skills/registry.json`
- `index/AGENTS.md`
- `security/sensitive-files.md`
- 待安装 Skill 的 `SKILL.md`

## 修改文件

- `skills/`
- `skills/registry.json`
- `index/AGENTS.md`
- `logs/command/`

## 安全边界

- 未知第三方 Skill 不自动安装。
- 安装前检查脚本风险和敏感信息。
- 不得覆盖用户私有 Skill。
- 默认安装目录为工程内 `skills/agents/<agent>/<skill>/`；共享安装目录为 `skills/shared/<skill>/`。
- registry 只登记工程内相对路径，发布时不依赖外部目录。
- 远程 URL 默认只生成计划，不自动拉取未知第三方代码。

## 输出

- 用户响应中的执行结果摘要。
- 指令对应目录中的产物、日志或报告。
- 需要人工确认时，输出明确的确认项和风险。

## 验证方式

- 确认 `SKILL.md` 存在。
- 确认 registry 更新。
- 确认目标 Agent 可查询到该 Skill。

## 日志

- `logs/command/`
