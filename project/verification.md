---
id: "project-verification"
title: "验证"
type: "project-rule"
scope: "project"
owner: "doc"
status: active
---
# 验证

开发工作标记完成前，应尽可能运行可用检查：

1. lint 检查
2. 类型检查
3. 测试
4. 构建
5. 冒烟测试

如果某项检查不存在，需要说明原因，并给出最小替代验证。

Doc 负责维护本文件，QA 负责提供验证事实、缺陷模式和验收缺口。Lead 关闭任务前检查本文件是否需要更新。

## 当前主工程检查

```bash
bash tools/bin/ai-teams-check.sh
bash tools/bin/ai-teams-status.sh
```

## 验收记录要求

- 记录执行的命令。
- 记录通过、失败或不可用原因。
- 记录剩余风险。
- 关键开发任务需进入 QA 复查。

