---
id: "tools-hooks-readme"
title: "Hook 工具"
type: "tool-doc"
scope: "project"
owner: "lead"
status: active
---
# Hook 工具

## 用途

保存 Hook 工具说明。实际脚本位于 `hooks/scripts/`。

## 状态

v1.0 最小检查脚本已创建。

## 输入

- 待检查文件路径。
- 环境变量确认项，例如 `AI_TEAMS_ALLOW_PROTECTED=1`、`AI_TEAMS_CONFIRM_DELETE=1`。
- 每日日志压缩触发时间。

## 输出

- `logs/hook/*.md`
- `index/STATUS.md` 中的索引过期标记。
- 命令行阻断或通过结果。

## 安全边界

- Hook 不读取敏感文件内容。
- 删除、受保护文件修改和未登记锁默认阻断。
- 自动日志压缩默认只生成计划；设置 `AI_TEAMS_HOOK_APPLY=1` 才执行清理。

## 后续增强

- 与具体编辑器 Hook 事件深度绑定。
- 增加更细的文件所有权判断。
- 增加安全事件聚合报告。
