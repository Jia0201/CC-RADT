---
id: "tools-init-readme"
title: "项目初始化工具"
type: "tool-doc"
scope: "project"
owner: "lead"
status: active
---
# 项目初始化工具

## 用途

保存项目初始化扫描工具说明。实际脚本位于 `tools/bin/ai-teams-init-project.sh`。

## 状态

v1.0 最小可执行版本已创建。

## 输入

- `--target <路径>`：目标项目路径。
- `--plan`：只生成初始化报告。
- `--write`：合并更新 `project/`、`index/` 和 `memory/` 的自动扫描区块。

## 输出

- `logs/command/init-*.md`
- `project/project-profile.md`
- `project/PROJECT.md`
- `project/commands.md`
- `project/architecture.md`
- `index/PROJECT.md`
- `index/FILES.md`
- `memory/MEMORY.md`

## 安全边界

- 不读取 `.env`、密钥、证书、token、credentials 等敏感内容。
- 不修改目标项目业务代码。
- 已存在文件通过 AI-Teams 标记区块合并更新。

## 使用示例

```bash
bash tools/bin/ai-teams-init-project.sh --target /path/to/project --write
```

低侵入安装时，从目标项目根目录执行：

```bash
bash .claude/ai-teams/tools/bin/ai-teams-init-project.sh --target "$PWD" --write
```
