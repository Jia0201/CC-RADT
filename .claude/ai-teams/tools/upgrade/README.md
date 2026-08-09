---
id: "tools-upgrade-readme"
title: "升级工具"
type: "tool-doc"
scope: "project"
owner: "lead"
status: active
---
# 升级工具

## 用途

保存已安装项目升级工具说明。实际脚本位于 `tools/bin/ai-teams-upgrade.sh`。

## 状态

v1.0 最小可执行版本已创建。

## 输入

- `--package <路径>`：升级包目录。若存在 `files/` 子目录，则以该子目录作为文件源。
- `--dry-run`：只生成快照和变更清单。
- `--apply`：同步 AI-Teams 管理范围内文件。

## 输出

- `tools/rollback/snapshots/upgrade-*`
- `logs/upgrade/upgrade-*.md`
- `project/upgrade-state.md`
- `index/STATUS.md`

## 安全边界

- 只同步 AI-Teams 管理范围内文件。
- 排除敏感命名文件、缓存和临时目录。
- apply 后运行结构自检。

## 使用示例

```bash
bash tools/bin/ai-teams-upgrade.sh --package /path/to/update --dry-run
```
