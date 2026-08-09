# 参与 CC-RADT 开发

CC-RADT 的 `dev` 分支保存 Harness 主开发工程，`main` 分支只保存用户可安装的运行内容。请先阅读 [二次开发指南](DEVELOPMENT.md) 和 [版本控制规则](security/version-control-policy.md)。

## 基本流程

1. 从 `dev` 创建 `feature/*`、`fix/*`、`docs/*` 或 `chore/*` 分支。
2. 一个提交只解决一个清晰问题，提交信息使用 `<type>(<scope>): <summary>`。
3. 用户可感知的功能、规则或兼容性变化同步更新 `CHANGELOG.md` 的 `Unreleased`。
4. 结构性变化按需增加 ADR，并更新索引、关系图和自检。
5. 提交 PR 前运行 `bash tools/bin/ai-teams-check.sh`，并填写验证、风险和回滚方式。
6. 不直接把 `dev` 合并到 `main`；`main` 内容由正式包生成并验证后更新。

## 安全边界

- 不提交 `.env`、密钥、token、credentials、证书或业务敏感数据。
- 不提交本地缓存、会话材料、运行日志正文或生成安装包。
- 不执行未经用户明确要求的远程 push、tag、Release、强制更新或删除。
