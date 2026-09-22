---
id: "tools-upgrade-readme"
title: "升级工具（旧入口已退役）"
type: "tool-doc"
scope: "project"
owner: "lead"
status: active
---
# 升级工具（旧入口已退役）

## 用途

本页保留旧升级入口的退役说明。已安装项目的升级由 Harness 外部的独立 `cc-radt-updater` 负责；工程内不再执行文件同步或跨版本升级。

## 状态

`tools/bin/ai-teams-upgrade.sh` 已退役，仅输出中文迁移说明，不加载公共库、不扫描项目、不创建目录或快照，也不修改配置、manifest、日志和状态。

## 旧参数行为

- 单独 `--help` 或 `-h`：输出退役说明，退出码 0；不表示升级成功。
- `--package`、`--dry-run`、`--apply`、无参数及错误参数：输出退役说明，退出码 2。
- 所有入口均零写入；旧版会创建快照的 dry-run 和 rsync apply 都已停用。不要继续调用旧公开包内的覆盖脚本。

## 外部入口

1. 阅读 [外部升级器操作说明](../commands/ai/upgrade-existing.md) 与 [外部升级安全规则](../../security/upgrade-policy.md)。开发源码说明在仓库根 `updater/README.md`；`updater/` 源码不随 Harness payload 分发，用户需取得另行交付并验收的独立程序。
2. 将升级器放在目标项目之外，先关闭目标项目的 Claude Code、Agent、Hook、观察台及其他后台写入任务。
3. 在外部 UI/CLI 选择项目、可信旧基线与明确版本的新包，先只读预览。旧公开包缺清单时使用包外 sidecar，不修改已发布包、版本、checksum 或标签。
4. 未签名清单默认仅可预览；apply 前必须由用户亲自核对并明确认可旧、新清单完整 SHA-256 指纹。生成清单不等于官方签名，也不自动授权升级。
5. 冲突、兼容性不足或需要恢复时停止，按外部升级器实际状态处理。验证完成且无需恢复后，才重新启动 Claude Code。

## 输出与边界

- 旧入口只输出终端说明，不再创建 `tools/rollback/snapshots/upgrade-*`、`logs/upgrade/upgrade-*.md`，也不更新 `project/upgrade-state.md` 或 `index/STATUS.md`。
- 外部升级器独立管理计划、原件、候选、报告与事务恢复；原件留存不能替代独立备份。
- 用户资料、自装扩展与本地定制不按目录覆盖。已知官方静态 prompt、Skill 代码、MCP 指引和初始化 KB 按 system/config 三方比较：未改官方文件可更新，双边修改冲突阻断，仅本地修改且上游未变时保留。未知文件和真实运行资料仍为 data；不能把“文件保留”或“事务完成”当成所有组件均已更新。
- 未验收的平台、真实升级路线和发布签名不得仅凭文档、原型或构建成功声明支持。
