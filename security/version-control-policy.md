# Git 与项目版本管理规则

本规则管理 CC-RADT Harness 本体的分支、提交、版本、打包记录、发布和回滚。它不把目标业务项目的 Git 历史当作需求来源，也不授权 Agent 自动修改远程仓库。

## 1. 唯一事实源

| 事实 | 唯一来源 |
|---|---|
| 当前开发版本 | `VERSION` 与 `MANIFEST.json`，两者必须一致 |
| 待发布用户变化 | `CHANGELOG.md` 的 `Unreleased` |
| 开发实现历史 | `dev` 提交和 PR |
| 已发布源基线 | `dev-vX.Y.Z` 注释标签 |
| 用户可安装内容 | `main` 的独立运行提交 |
| 公开版本 | `vX.Y.Z` 注释标签与 GitHub Release |
| 包内容与来源 | `RELEASE_RECORD.md`、`.claude/manifest.json`、`checksums.txt` |
| 构建过程 | `logs/package/package-formal-*.md` |

不得用 README、记忆、聊天或临时日志维护第二套版本事实。

## 2. 分支职责

| 分支 | 用途 | 规则 |
|---|---|---|
| `dev` | Harness 主开发工程 | Agent、规则、Hooks、Skills、MCP、提示词、测试、模板和打包链路的唯一开发主线 |
| `feature/*` | 新能力 | 从 `dev` 创建，经验证后合入 `dev` |
| `fix/*` | 缺陷修复 | 从 `dev` 创建，包含复现和回归证据 |
| `docs/*` | 纯文档 | 不混入运行逻辑变化 |
| `chore/*` | 工程维护 | 构建、索引、治理和依赖维护 |
| `main` | 用户可安装运行版 | 不接收 `dev` 的普通 merge，只接收由正式包生成并验证的运行内容 |

`main` 与 `dev` 可以拥有不同目录和提交历史。发布记录必须显式保存“dev 源提交 -> main 运行提交 -> 版本标签”的映射。

## 3. 提交规则

提交格式：

```text
<type>(<scope>): <summary>
```

允许的主要类型：`feat`、`fix`、`docs`、`refactor`、`test`、`security`、`chore`、`release`、`revert`。

每个提交必须满足：

1. 只包含一个可解释目标，不混入无关格式化或生成状态。
2. 标题说明行为变化，正文按需写明原因、验证、风险和回滚点。
3. 规则变化列出权威规则文件；Agent 变化列出受影响角色、提示词、Skills 和 MCP。
4. 用户可感知变化同步更新 `CHANGELOG.md` 的 `Unreleased`。
5. 长期结构变化关联 ADR；高风险变化关联 Security-Reviewer 和 QA 证据。
6. 不提交敏感内容、本机绝对路径、缓存、会话、运行日志正文或生成安装包。

提交模板见 [commit-message](../templates/version-control/commit-message.md)。

## 4. 版本规则

采用 `MAJOR.MINOR.PATCH`：

- `MAJOR`：存在不兼容的安装布局、核心协议或升级边界变化。
- `MINOR`：向后兼容的新 Agent 能力、工作流、工具、Hook、Skill、MCP 或治理能力。
- `PATCH`：向后兼容的缺陷、安全修复、文档和小范围规则校正。

发布前必须同时更新 `VERSION`、`MANIFEST.json`、`CHANGELOG.md` 和用户文档中的版本。不得移动或复用已发布标签。

## 5. 开发变更记录

每个准备发布的版本必须能从上一个 `dev-vX.Y.Z` 源标签生成以下清单：

1. dev 提交 ID、作者、时间和标题。
2. Agent 与提示词变化。
3. `security/`、`rule/`、`playbook.md` 和 ADR 变化。
4. Hooks、工具、初始化、Skills、MCP 和跨平台变化。
5. 记忆、知识库、索引、项目画像和共享工作区变化。
6. 用户文档、安装方式和兼容性变化。
7. 测试、E2E、包验证、已知风险和回滚点。

只记录提交元数据和文件路径，不复制 diff、敏感内容或会话原文。开发变更模板见 [development-change-record](../templates/version-control/development-change-record.md)。

## 6. 正式打包门禁

普通 `formal` 打包可用于隔离测试；真正发布必须使用 `--release --verify`，并满足：

1. 当前分支为 `dev`，工作区干净，无未跟踪发布内容。
2. `--version` 与 `VERSION`、`MANIFEST.json`、`CHANGELOG.md` 一致。
3. 指定或自动识别上一 `dev-vX.Y.Z` 源标签。
4. 主工程自检、Fixture E2E、Hook schema、记忆审计和安装态自检通过。
5. 输出目录在仓库外且为空。
6. 正式包不含实验室、构建脚本、研发日志正文、会话、缓存、本地路径和敏感文件。
7. 包根生成 `RELEASE_RECORD.md`，并与 manifest、checksum 一起进入校验范围。

`RELEASE_RECORD.md` 至少包含：版本、源分支、dev 源提交、变更基线、工作区状态、提交清单、规则/Agent/工具等变更分类、验证结果、文件数量、manifest 和 checksum 路径。模板见 [release-record](../templates/version-control/release-record.md)。

## 7. 发布流程

1. 在 `dev` 完成变更、评审和 `Unreleased` 记录。
2. 确定版本并更新四类版本事实，提交 `release: prepare vX.Y.Z`。
3. 在该提交创建注释标签 `dev-vX.Y.Z`，作为不可变源基线。
4. 使用该提交执行严格正式打包并验证全新安装目录。
5. 在独立 `main` 工作树中用生成内容更新运行版，提交 `release: CC-RADT vX.Y.Z`。
6. 在 `main` 运行提交创建注释标签 `vX.Y.Z`。
7. 创建 GitHub Release，上传 ZIP、`checksums.txt` 和必要说明。
8. 将 main 提交、标签和 Release URL 回填到 dev 的发布记录，提交 `release: record vX.Y.Z publication`。

远程 push、tag 和 GitHub Release 必须由用户明确要求。Agent 不得把“允许本地打包”推断为“允许公开发布”。

## 8. 回滚与热修复

- 未发布：在 `dev` 创建新的修复或 `revert` 提交，不改写共享历史。
- 已发布：从对应 `dev-vX.Y.Z` 创建 `fix/*`，发布新的 PATCH 版本。
- `main` 不使用强制推送回退；用新运行提交或新版本恢复。
- 已发布标签、manifest、checksum 和发布记录不可修改；发现错误时发布更正版本并说明替代关系。

## 9. Owner 与复核

- Lead：发布决策、源提交与运行提交映射、最终关闭。
- Plan-PM：发布任务、依赖、门禁和执行顺序。
- Doc：`CHANGELOG.md`、发布记录、索引和 GitHub 文档。
- QA：测试证据、安装验证和回归结论。
- Security-Reviewer：敏感内容、权限、供应链、发布命令和 checksum 复核。
- Role：Agent、提示词、Skills、MCP 能力变化记录。
- Memory：只记长期发布偏好和恢复点，不复制 Git 历史或 Changelog。
