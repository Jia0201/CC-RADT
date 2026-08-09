---
description: AI-Teams 自建规则路由入口
paths:
  - "rule/custom/**"
  - "project/rules/**"
  - "security/**"
---
# AI-Teams 自建规则路由

需要新增、审查或使用自建规则时，先读 `rule/custom/index.md` 和 `security/rule-policy.md`。

- `rule/custom/` 只保存规则路由、触发条件和读取入口。
- `security/` 保存动作规则、安全边界、禁区和命令要求。
- `project/rules/` 保存目标项目规则正文或导入索引。
- `kb/` 只保存知识，不保存动作规则。

不得为每条自建规则在 `.claude/rules/` 下创建散乱适配文件；Claude Code 官方入口统一从本文件回到 AI-Teams 工程规则层。
