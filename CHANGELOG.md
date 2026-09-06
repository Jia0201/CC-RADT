# CC-RADT 变更日志

本文件记录用户可感知的功能、规则、兼容性和安装变化。开发过程细节保留在 Git 提交与 `logs/`，正式发布证据由安装包根目录的 `RELEASE_RECORD.md`、manifest 和 checksum 共同提供。

格式参考 Keep a Changelog，版本号遵循 Semantic Versioning。

## [Unreleased]

## [1.1.0] - 2026-09-06

### Added

- 内置只读研发观察台：CC 会话首次启动提示本机访问地址，同项目多会话并发复用服务，按会话隔离活动与 Agent 标识；支持项目日志、任务 / 审查文件和角色定义的只读查看与版本留存，不从网页执行任务。
- 建立 Git 分支、提交、版本、发布记录和回滚治理体系。
- 为中英文 README 增加四张生成式流程与架构图片。
- 增加完整使用指南、v1.0.0 → v1.1.0 升级指南与中英文发布说明，随正式包分发。

### Changed

- Lead 主会话不再设置会抢占用户真实需求的 `initialPrompt`；默认 `agent: lead` 保留，入口状态由隐藏 Hook 上下文控制。
- Lead system prompt 升级到 `1.0.1`，强制每次具名 Agent 派发前使用任务提示词渲染器，避免手写合同遗漏验收字段。
- 多 Agent 心跳不再把 Lead 等待或仅有 30 秒 Hook 静默误判为接管失败；已完成 Agent 会清理旧告警，真实工具与权限失败仍立即接管。
- 敏感文件 Hook 改用精确文件名和目录判断，不再误拦截 `TokenUtils.java`、`TokenResult.java`、`AuthFilterToken.java` 等正常鉴权源码。
- 项目初始化新增 `project/.initialized` 运行态标记；自检区分待分发纯净包与已初始化运行态，初始化日志不再被误报为安装包污染。
- 正式包自检脚本改为按脚本位置解析 AI-Teams 根目录，可直接从目标项目根目录调用。
- 项目初始化与 Rule 刷新统一忽略 Maven/Gradle/前端等构建产物目录，避免生成文件污染项目画像和索引。
- 敏感文件权限改为项目根相对的精确文件模式，继续保护环境、凭据、密钥和 token 文件，同时不再误伤 `TokenUtils.java` 等正常源码。
- 项目初始化改为用户主动操作；Claude Code 启动、恢复会话和普通请求不再自动询问、自动执行或写入初始化画像，未初始化时 Git 增量 Hook 静默跳过。
- 主分支 README 采用开发分支的完整项目介绍，并补强安装、团队、工作流、记忆、安全、提示词、Skills、MCP 和文档导航。
- 正式包保留 ADR 状态目录和原子锁目录，Git 克隆后可直接通过结构自检。
- 源工程补充空 ADR 目录占位文件，避免干净克隆因缺少目录而误报 ADR 编号缺失。
- 正式包内部 README 使用运行态说明，并排除源码二次开发指南及版本治理断链。

## [1.0.0] - 2026-08-09

### Added

- 首个公开安装版本。
- 12 个 Claude Code 具名 Agent、12 套工作流、四层记忆、项目初始化、规则路由、安全治理、Hooks、Skills、MCP 和提示词治理。
- `.claude/ai-teams/` 运行布局、项目级 Agent 与 Rules 适配层、安装自检和隔离 Fixture E2E。

[Unreleased]: https://github.com/Jia0201/CC-RADT/compare/v1.1.0...dev
[1.1.0]: https://github.com/Jia0201/CC-RADT/releases/tag/v1.1.0
[1.0.0]: https://github.com/Jia0201/CC-RADT/releases/tag/v1.0.0
