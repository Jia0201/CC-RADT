# 日志

日志用于追溯执行过程。

## 规则

1. 日志不是记忆。
2. 日志不是知识库。
3. 普通日志每日压缩。
4. 审计、升级、回滚和安全日志默认保留。
5. 压缩对象包括 `logs/agent/`、`logs/task/`、`logs/command/`、`logs/hook/` 和 `logs/package/`。
6. 压缩输出写入 `logs/compressed/`。
7. 当前未完成任务日志不得清理。
