---
id: "tools-commands-ai-prompt-rollback"
title: "提示词回滚指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 提示词回滚指令

## 调用

```text
/ai:prompt-rollback <candidate-id|activation-id> [--reason "<原因>"] [--confirm]
```

## 执行目标

将受管提示词恢复到候选中登记的上一 active 版本，保留完整事件、候选和评审证据。回滚不是删除历史，也不得凭记忆重写旧版本。

## 触发条件

- 原始失败在监控期复现。
- 基线、反向、路由、输出契约或安全检查出现退化。
- 出现职责漂移、权限扩张、敏感泄漏或注入风险。
- 激活内容超出候选声明差异。
- Lead、Security-Reviewer 或用户要求停止当前版本。

## 执行步骤

1. 读取激活记录、候选、评审、当前哈希和上一 active 版本。
2. 验证回滚目标与候选登记一致。
3. 取得目标文件和 [active-run](../../../shared/prompt-evolution/active-run.md) 的文件级锁。
4. 恢复上一 active 版本；不得使用未验证的手工拼接内容。
5. 运行核心基线、安全和结构校验。
6. 使用 [PROMPT_EVENT_TEMPLATE](../../../shared/prompt-evolution/events/PROMPT_EVENT_TEMPLATE.md) 创建脱敏回滚事件。
7. 将候选状态标记为 `rolled-back`，活动状态进入监控或 `idle`。
8. 重新判断根因是否应路由到项目事实、工具、工作流、权限或模型。

## 输出

- 回滚原因和触发证据。
- 回滚前后版本与哈希。
- 受影响 Agent 和生效时机。
- 验证结果、残余风险和下一 Owner。
- 保留的候选、评审和事件路径。

## 安全边界

- 不删除失败版本、事件或评审记录。
- 不读取或写入敏感内容。
- E3 回滚必须由 Lead 与 Security-Reviewer共同确认；涉及用户权限时通知用户。
- 回滚只处理提示词资产，不借机回滚无关项目文件。
- KB 不保存回滚动作规则或运行记录。
