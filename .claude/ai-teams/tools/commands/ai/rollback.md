---
id: "tools-commands-ai-rollback"
title: "回滚指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 回滚指令

## 用途

将工程状态回滚到任务前、升级前、打包前或指定文件状态。

## 输入

- 回滚目标。
- 回滚范围。
- 是否只生成回滚计划。

## 可执行入口

```bash
bash tools/bin/ai-teams-rollback.sh --snapshot <快照路径> --plan
```

## 流程

1. 读取 `index/INDEX.md`。
2. 读取回滚目标。
3. 检查可回滚材料。
4. 生成回滚计划。
5. 创建回滚前快照。
6. 执行回滚。
7. 写入审计日志。
8. 更新索引。
9. 输出结果。

## 读取文件

- `index/INDEX.md`
- `logs/audit/`
- `project/upgrade-state.md`
- `shared/locks/LOCKS.md`
- `tools/rollback/`
- `git diff 或快照材料`

## 修改文件

- `tools/rollback/`
- `logs/audit/`
- `index/STATUS.md`

## 安全边界

- 回滚前必须生成计划。
- 删除或覆盖用户项目文件必须获得用户确认。
- 高风险文件回滚需要 Lead 确认。

## 输出

- 用户响应中的执行结果摘要。
- 指令对应目录中的产物、日志或报告。
- 需要人工确认时，输出明确的确认项和风险。

## 验证方式

- 回滚后运行结构自检。
- 确认回滚范围和计划一致。
- 确认审计日志存在。
- 真正执行回滚必须显式传入 `--apply --yes`。

## 日志

- `logs/audit/`
