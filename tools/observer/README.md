# Harness 内置只读观察台

本模块随 Harness 交付，不是执行器。网页只用于会话监控、Hook 活动回溯、项目日志、任务文件、已有审查记录、角色定义及留存版本阅读。任务执行、审批、返工、配置修改始终在 CC CLI。

## 自动接入与多会话

重启 CC 以加载新增的 Hook 配置。SessionStart 会启动或复用当前项目的观察服务，并通过 `systemMessage` 显示完整本机地址，同时将简短提示加入首次回复上下文。它不会自行打开浏览器。

- “首次”按 **CC session_id + 当前观察服务实例** 去重。每个新会话各提示一次；同会话重复 SessionStart、resume、compact 不反复提示。观察器重启、访问凭据变化后允许重新提示一次。
- 同一规范化项目目录与 Harness 组合只运行一个观察服务，用启动锁处理多个 CC 窗口同时启动。不同项目 / worktree 使用独立数据目录和自动分配端口；第一版不提供跨项目聚合导航。
- 每条 Hook 记录独立原子落盘，带 session_id；Agent 实例使用 session_id + agent_id 区分。没有标识的数据不推断归属。
- 浏览器地址携带当前会话筛选；不同标签页的筛选独立。切换筛选不会影响 CC 或其他观察窗口。
- SessionEnd 只记录该会话结束，不关闭共享观察器。Stop 仅表示本轮输出结束，不等同整个会话退出；强制关闭没有结束事件时只能显示“活动未确认”。
- 观察台异常不阻断 CC；Hook 不返回阻断决定，不同步等待任何模型或外部服务。

Hook 使用 Claude Code 官方 exec-form、session_id、SessionStart 与 systemMessage 契约：[Hooks reference](https://code.claude.com/docs/en/hooks)。当前自动化测试验证了 Hook JSON 输出；不同 CC 版本下聊天区域的具体展示位置仍应以实际客户端为准。

## 本机运行

沿用 Harness 的 Node.js 18+ 前提，零 npm 运行依赖。程序在 `tools/observer/`，入口 Hook 在 `hooks/scripts/observer-hook.mjs`。正式包的通用 Hook 路径转换会将它们接入 `.claude/ai-teams/` 安装布局。

开发源目录：

```sh
node tools/observer/cli.mjs start
node tools/observer/cli.mjs status
node tools/observer/cli.mjs stop
```

业务项目安装态：

```sh
node .claude/ai-teams/tools/observer/cli.mjs start
node .claude/ai-teams/tools/observer/cli.mjs status
node .claude/ai-teams/tools/observer/cli.mjs stop
```

`start` 输出完整访问链接；`status` 输出服务状态、链接和数据目录；`stop` 核对已认证的观察器实例后只停止该观察器，不终止 CC。下一次 SessionStart 可再次拉起。

可用 `--project <业务项目路径>` 指定项目；程序默认识别开发源或 `.claude/ai-teams/` 安装位置。自动 Hook 优先使用 CC 提供的 CLAUDE_PROJECT_DIR。路径包含空格也通过参数数组传递，不拼接 shell。

启动 CC 前设置 `AI_TEAMS_OBSERVER=0` 可禁用自动启动和活动记录，不影响原有 Harness Hook。该开关不停止已运行的观察器；需要时另执行 stop。重新开启须在后续 CC 进程中恢复环境设置。

默认只监听 `127.0.0.1`，由操作系统选择空闲端口。完整链接的 fragment 包含随机本机访问凭据；网页加载后将凭据保存在该标签页的 sessionStorage，并从可见地址移除。请勿把完整入口链接分享给无关人员；复制已经移除凭据的地址到全新标签页时，请从 CC 提示或 status 重新获取完整链接。

## 数据与只读边界

运行数据位于用户私有状态目录，每项目单独分区：

- macOS：用户目录下 `Library/Application Support/CC-RADT/observer/`。
- Linux：XDG_STATE_HOME 下 `cc-radt/observer/`，默认用户目录下 `.local/state/cc-radt/observer/`。
- Windows：LOCALAPPDATA 下 `CC-RADT/observer/`。
- 可通过 `AI_TEAMS_OBSERVER_DATA_DIR` 指定外置根目录；拒绝将它放在业务项目或 Harness 内。

第一版用限额内的原子 JSON 记录保存 Hook 元信息及脱敏文件快照，不依赖 SQLite。采集每 2 秒执行，页面每 2.5 秒刷新；这是轮询实现，不宣称已实现 V3 提案中的 SSE。

文件读取与脱敏在独立 Worker 线程中执行，HTTP 服务与 CC 启动探测不等待整轮扫描。数据超过 10 秒未刷新时标注陈旧；证据读取超时只影响本次查看，不阻断 CC。

默认保留最近 7 天，最多 5000 条 Hook 活动、300 份文件快照；两者取先达到的上限。每个来源最多读取 96 KiB，每轮最多读取约 3 MiB，超限显示截断 / 覆盖不足。只读当前版本仍可能可见，但被淘汰的历史版本不可恢复。源文件和项目日志不会被清理。

记录字段限定为：会话 / Agent / 已提供任务标识、事件名、工具名、已提供工具调用标识、项目内文件目标、观测时间。**不保存用户 prompt、聊天 transcript、完整 shell 命令、工具输入输出正文或隐藏模型思考。** 来源字段缺失就显示未提供。文件来源遵循敏感文件排除，并在落盘前做规则脱敏；规则不能识别一切业务隐私，不宜将观察数据公开分享。

项目文件只读取固定状态文件和允许目录中的文本记录：`shared/tasks/`、`shared/events/`、`shared/handoffs/`、`shared/transactions/`、提示词评审及事件、`logs/`，以及 Agent 主定义。模板和索引不会伪装成真实业务记录。压缩归档、业务源码任意预览、完整 task/session 自动关联、Git 基线差异和测试版本有效性判断尚未接入。

“证据与审查”是已有记录阅读；“上一留存版本”是文件文本对照，不代表本任务造成的改动。磁盘上的角色定义也不代表某次会话实际加载的配置。不存在的记录、费用与精确运行状态不使用模拟值填充。

HTTP 仅有读取接口，要求随机访问凭据、合法 Host 与同源请求；没有执行、审批、配置写入或停止服务的 Web API。内容按转义文本呈现，禁止远程资源与脚本执行。观察器进程和项目使用同一 OS 用户时，这不是操作系统级沙箱；需要硬隔离时应额外使用只读挂载或受限账号。

## 验证

```sh
node --test tools/observer/observer.test.mjs
node tools/bin/ai-teams-hook-output-test.mjs
bash tools/bin/ai-teams-check.sh
```

观察器测试在临时 fixture 中运行，覆盖并发启动、提示去重、会话 / Agent 隔离、生命周期、重启恢复、认证、只读接口、模板与敏感文件排除、版本留存及路径边界。fixture 证据保留在测试输出的临时目录，不写入真实项目。

浏览器测试需测试环境提供 Playwright（不是运行依赖）；Windows 实机与 CC 交互式聊天展示需要额外实测。打包验证使用隔离输出目录，不执行发布或远程推送。
