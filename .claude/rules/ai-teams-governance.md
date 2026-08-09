---
paths:
  - "agents/**"
  - "rule/**"
  - "security/**"
  - "shared/**"
  - "memory/**"
  - "kb/**"
  - "project/**"
  - "hooks/**"
  - "tools/**"
  - ".claude/**"
  - "CLAUDE.md"
---
# AI-Teams 工程治理规则路由

修改 AI-Teams 工程文件前读取 `rule/engineering/index.md`、当前 Agent 路由和对应的 `rule/security/`、`rule/shared/`、`rule/memory/` 或 `rule/tools/` 入口。结构变化后必须刷新 `rule/catalog/`、Agent 路由与知识图谱。
