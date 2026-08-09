---
id: "tools-commands-ai-logs-clean"
title: "多余日志清除指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 多余日志清除指令

## 用途

清理指定日期之前或之后的多余日志。

## 输入

- 清理日期范围。
- 清理对象目录。
- 是否只生成计划。

## 可执行入口

```bash
bash tools/bin/ai-teams-logs-clean.sh --before YYYY-MM-DD --plan
```

## 流程

1. 读取 `index/INDEX.md`。
2. 读取日志目录。
3. 生成清理计划。
4. 排除审计日志、升级日志、回滚日志、安全日志。
5. 创建清理前快照。
6. 清理指定范围普通日志。
7. 写入清理报告。
8. 更新 `index/STATUS.md`。
9. 输出结果。

## 读取文件

- `index/INDEX.md`
- `logs/index.md`
- `logs/`

## 修改文件

- `logs/`
- `logs/audit/`
- `logs/compressed/`
- `index/STATUS.md`

## 安全边界

- 清理前必须列出文件。
- 审计、升级、回滚和安全日志默认保留。
- 不得删除当天未完成任务日志。

## 输出

- 用户响应中的执行结果摘要。
- 指令对应目录中的产物、日志或报告。
- 需要人工确认时，输出明确的确认项和风险。

## 验证方式

- 确认保留目录未被误删。
- 确认压缩摘要和索引生成。
- 确认审计、升级、安全和压缩目录未参与普通清理。

## 日志

- `logs/command/`
