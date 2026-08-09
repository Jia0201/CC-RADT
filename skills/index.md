---
id: "skills-index"
title: "Skills 管理"
type: "skills-doc"
scope: "project"
owner: "doc"
status: active
---
# Skills 管理

Skills 用于保存可复用能力、流程和领域知识。

## 目录

- `skills/shared/`：共享级 Skills 绑定入口。
- `skills/agents/`：Agent 级 Skills 安装索引。
- `skills/agents/<agent>/index.md`：单个 Agent 的 Skills 绑定清单。

## Registry

见 `skills/registry.json`。

Registry 的 `mode` 固定为 `vendored-local-copy`，表示 Skill 本体已经复制到 AI-Teams 内部，不依赖安装机器上的用户目录。`canonical_root` 固定为 `skills/agents`，所有 `path` 和 `skill_file` 都相对于 `AI_TEAMS_ROOT` 解析。

## 当前绑定

| Agent | Skills 索引 |
|---|---|
| Lead | [index](./agents/lead/index.md) |
| PD | [index](./agents/pd/index.md) |
| Plan-PM | [index](./agents/plan-pm/index.md) |
| Dev-Frontend-Web | [index](./agents/dev-frontend-web/index.md) |
| Dev-Frontend-Miniapp | [index](./agents/dev-frontend-miniapp/index.md) |
| Dev-Backend-Systems | [index](./agents/dev-backend-systems/index.md) |
| Dev-Backend-Service | [index](./agents/dev-backend-service/index.md) |
| QA | [index](./agents/qa/index.md) |
| Memory | [index](./agents/memory/index.md) |
| Doc | [index](./agents/doc/index.md) |
| Role | [index](./agents/role/index.md) |
| Security-Reviewer | [index](./agents/security-reviewer/index.md) |

## 使用规则

1. 默认读取工程内 Skills 目录 `skills/agents/<agent>/<skill>/`。
2. Agent 启用 Skill 前先看 `skills/registry.json` 和自身 `skills/agents/<agent>/index.md`。
3. 当前已引用的 Skill 必须复制到工程内相对路径，不写死本机绝对路径，不自动执行未知脚本。
4. 新增、移除或替换绑定后更新 `agents/<agent>/skills.md`、`skills/registry.json`、`skills/agents/<agent>/index.md` 和 [graph](../kb/graph.md)。

## 发现与验证

AI-Teams 不依赖 Claude Code 对本目录进行隐式扫描。Agent 先通过自身定义和 `skills/registry.json` 发现可用 Skill，再按任务需要读取对应 `SKILL.md`。

```bash
bash tools/bin/ai-teams-skills-verify.sh
```

验证必须覆盖：12 个 Agent、Registry 模式、相对路径、Skill frontmatter、物理文件、Agent Skills 指针和单 Agent 索引。垂直行业能力后续也必须以工程内副本登记，不能写死安装机器路径。
