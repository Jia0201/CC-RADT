---
id: "tools-commands-ai-skills-list"
title: "Skills 查询指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# Skills 查询指令

## 用途

查询当前工程包含的共享 Skills 和 Agent 独立 Skills。

## 输入

- 可选 Agent 名称。
- 是否显示安装路径。

## 可执行入口

```bash
bash tools/bin/ai-teams-skills-list.sh
bash tools/bin/ai-teams-skills-list.sh --agent <Agent名称>
```

## 流程

1. 读取 `index/INDEX.md`。
2. 读取 `skills/registry.json`。
3. 查询共享 Skills。
4. 查询 Agent 独立 Skills。
5. 输出 Skills 状态报告。

## 读取文件

- `index/INDEX.md`
- `skills/registry.json`
- `index/AGENTS.md`

## 修改文件

- `logs/command/`

## 安全边界

- 不执行 Skill 中的脚本。
- 不读取私有 Skill 配置。

## 输出

- 用户响应中的执行结果摘要。
- 指令对应目录中的产物、日志或报告。
- 需要人工确认时，输出明确的确认项和风险。

## 验证方式

- 确认 registry 可解析。
- 确认路径位于 AI-Teams 管理范围内。

## 日志

- `logs/command/`
