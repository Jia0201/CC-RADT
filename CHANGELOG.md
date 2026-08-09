# CC-RADT 变更日志

本文件记录用户可感知的功能、规则、兼容性和安装变化。开发过程细节保留在 Git 提交与 `logs/`，正式发布证据由安装包根目录的 `RELEASE_RECORD.md`、manifest 和 checksum 共同提供。

格式参考 Keep a Changelog，版本号遵循 Semantic Versioning。

## [Unreleased]

### Added

- 建立 Git 分支、提交、版本、发布记录和回滚治理体系。
- 为中英文 README 增加四张生成式流程与架构图片。

### Changed

- 主分支 README 采用开发分支的完整项目介绍，并补强安装、团队、工作流、记忆、安全、提示词、Skills、MCP 和文档导航。
- 正式包保留 ADR 状态目录和原子锁目录，Git 克隆后可直接通过结构自检。

## [1.0.0] - 2026-08-09

### Added

- 首个公开安装版本。
- 12 个 Claude Code 具名 Agent、12 套工作流、四层记忆、项目初始化、规则路由、安全治理、Hooks、Skills、MCP 和提示词治理。
- `.claude/ai-teams/` 运行布局、项目级 Agent 与 Rules 适配层、安装自检和隔离 Fixture E2E。

[Unreleased]: https://github.com/Jia0201/Claude-Code-Research-and-Development-Teams/compare/v1.0.0...dev
[1.0.0]: https://github.com/Jia0201/Claude-Code-Research-and-Development-Teams/releases/tag/v1.0.0
