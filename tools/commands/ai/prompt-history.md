---
id: "tools-commands-ai-prompt-history"
title: "提示词历史查询指令"
type: "command"
scope: "project"
owner: "doc"
status: active
---
# 提示词历史查询指令

## 调用

```text
/ai:prompt-history [agent|all] [--type system|task-user|routing|retry|output-contract] [--limit <n>]
```

## 执行目标

按 Agent、Prompt 类型和时间展示事件、候选、评审、激活、监控和回滚历史。该指令只读，不把运行记录迁入 KB 或正式记忆。

## 执行步骤

1. 读取提示词演进工作区的三个索引和活动状态。
2. 按事件时间、候选版本和评审关系建立时间线。
3. 校验每个 active 或 rolled-back 版本是否具有来源事件、候选、评审、Owner 和回滚目标。
4. 标记缺失链接、孤立候选、未关闭评审和未结束监控。
5. 默认输出摘要；只在用户指定时展开脱敏差异和评测证据。

## 输出

| 时间 | Agent | 类型 | 版本 | 动作 | 等级 | Owner | 结论 | 证据 |
|---|---|---|---|---|---|---|---|---|

同时输出：

- 当前 active 与上一可回滚版本。
- 被拒绝和已回滚候选。
- 重复失败模式及是否已解决。
- 证据链缺口和待处理 Owner。

## 安全边界

- 不输出完整 system 提示词、敏感内容或完整攻击载荷。
- 不把历史事件当作正式记忆。
- 不把动作规则、候选、评审或运行历史写入 KB。
- 不修改事件、候选、评审、active 或任何提示词资产。
