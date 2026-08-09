---
id: "tools-commands-ai-prompt-activate"
title: "提示词受控激活指令"
type: "command"
scope: "project"
owner: "lead"
status: active
---
# 提示词受控激活指令

## 调用

```text
/ai:prompt-activate <candidate-id> [--next-call|--new-session] [--confirm]
```

## 执行目标

仅在所有门禁满足时，由 Lead 将已批准候选受控激活。默认只生成激活检查结果；实际写入必须具备明确候选、审批、回滚目标和用户要求的确认。

## 激活前检查

1. 候选状态为 `approved`，版本、哈希、目标文件和最小差异完整。
2. 根因、原始失败、基线、反向、输出契约和注入评测全部通过。
3. system 候选已由 Role 评审；task/user 候选已由 Plan-PM 评审。
4. QA 与 Security-Reviewer 已明确批准。
5. E3 已取得 Role、QA、Security-Reviewer、Lead 全部批准；按风险取得用户确认。
6. 当前目标文件哈希与候选基线一致，没有未纳入候选的漂移。
7. 上一 active 版本和回滚来源可读、可验证。
8. 已取得目标文件和 [active-run](../../../shared/prompt-evolution/active-run.md) 所需文件级锁。

任一门禁缺失时停止，不得部分激活。

## 激活动作

1. 创建可验证的激活前版本引用，不删除旧版本。
2. 只应用候选声明的最小差异。
3. 更新 active 版本、内容哈希、激活时间、Owner 和候选关系。
4. 重新执行必要静态检查与核心回归。
5. 更新 [active-run](../../../shared/prompt-evolution/active-run.md) 为 `monitored`。
6. 记录监控窗口、回滚阈值和下一次复核时间。
7. system 新版本只对下一次 Agent 调用或新会话生效；不得热替换正在运行的 Agent。

## 输出

- 是否激活及阻断原因。
- 生效版本、目标文件和内容哈希。
- 生效时机：下一次调用或新会话。
- 评审证据、监控窗口和回滚目标。
- 未完成门禁与责任 Owner。

## 安全边界

- 不得仅凭评测通过自动激活。
- 不得扩大候选未声明的职责、工具、权限或数据范围。
- 不得在激活时写入敏感内容。
- 不得让候选 Agent 自己完成审批和激活。
- 不得把激活流程或状态写入 KB。
