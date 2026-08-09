---
id: "skills-agents-dev-backend-systems-index"
title: "Dev-Backend-Systems Skills 安装索引"
type: "skills-index"
scope: "agent"
owner: "role"
status: active
---
# Dev-Backend-Systems Skills 安装索引

本文件登记 Dev-Backend-Systems 当前可用 Skills。所有已引用 Skills 已复制到 AI-Teams 工程内，发布时不依赖外部目录。

| Skill | 用途 | 工程内路径 | 状态 |
| --- | --- | --- | --- |
| tdd | 系统后端和 Java/C/C++ 改动的测试先行流程 | `skills/agents/dev-backend-systems/tdd` | installed-local-copy |
| diagnose | 复杂构建、性能、并发或回归问题定位 | `skills/agents/dev-backend-systems/diagnose` | installed-local-copy |
| improve-codebase-architecture | 识别架构改进点和边界问题 | `skills/agents/dev-backend-systems/improve-codebase-architecture` | installed-local-copy |
| karpathy-guidelines | 降低编码、重构和评审中的常见错误 | `skills/agents/dev-backend-systems/karpathy-guidelines` | installed-local-copy |
| code-documentation | 生成或改进接口、模块和构建文档 | `skills/agents/dev-backend-systems/code-documentation` | installed-local-copy |

## 使用规则

1. 按 Lead 任务单判断是否启用 Skill。
2. 启用前读取工程内 Skill 的 `SKILL.md`，只读取完成当前任务所需内容。
3. 不读取 Skill 目录下的敏感配置、token、credentials、证书或私有环境变量。
4. 新增、移除或替换 Skill 后更新 `skills/registry.json`、本文件、`agents/dev-backend-systems/skills.md` 和 `kb/graph.md`。
