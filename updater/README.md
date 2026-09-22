# CC-RADT 独立升级器

此目录是独立 Go 模块。程序在目标项目之外运行，升级、恢复不依赖 Claude Code、Agent、Hooks 或旧版脚本。首版默认使用本地已解压的正式包，完整升级需要旧包和新包的可核对清单。

## 构建与使用

开发构建需要 Go 1.24 或更新的受支持工具链；用户运行编译好的程序不需要 Go。
本轮本机构建锁定 Go 1.27.1；升级器版本为 0.1.0，和 Harness 的 1.x 产品版本分开管理。

```sh
cd updater
go build -o /path/out/cc-radt-updater ./cmd/cc-radt-updater
/path/out/cc-radt-updater ui
```

无桌面环境使用相同程序的 CLI。网页资源内嵌，打开程序输出的本机地址即可；地址包含临时访问凭据，请勿转发。Windows 的 exe 构建目标已经接入，但本轮未完成 NTFS 元数据保全与原生验收，写入升级保持禁用，不可当作可用的 Windows 升级器分发。

```sh
cc-radt-updater plan --project /path/project \
  --baseline /path/formal-v1.0.0 --package /path/formal-v1.1.0

cc-radt-updater apply --project /path/project \
  --baseline /path/formal-v1.0.0 --package /path/formal-v1.1.0 \
  --stopped --trust-baseline <旧清单SHA256> --trust-target <新清单SHA256>

cc-radt-updater status --transaction /path/.cc-radt-upgrades/project-id/transaction-id
cc-radt-updater recover --transaction /path/.cc-radt-upgrades/project-id/transaction-id --stopped
```

路径包含空格时用引号包裹。先关闭目标项目 Claude Code、子 Agent、观察器及其他写入任务。`--stopped` 是明确的维护窗口确认，不是工具已经阻止所有外部进程写入的保证。系统锁只能阻止另一个升级器，检测到活动写入者或文件变化会停止。

## 从 Release 下载

在线功能目前由 CLI 提供；网页使用下载并解压后的本地路径。只读取指定仓库的公开、稳定 Release，不从 main/dev 分支执行升级，也不读取 GitHub 凭据。

```sh
cc-radt-updater releases --version v1.1.0
cc-radt-updater download --version v1.1.0 \
  --asset "CC-RADT-v1.1.0.zip" --output "/path/to/new-download-directory"
```

`--output` 必须不存在且父目录已存在。下载器要求 GitHub API 提供该附件的 SHA-256，并独立核对 ZIP 字节；无摘要、重定向异常、路径越界、重复路径或解压超限即拒绝。失败残留只留在本次新建目录，不覆盖用户资料。下载不自动安装；将返回的 `directory` 用作 UI/CLI 的包路径。

首版在线下载上限为 ZIP 256 MiB、展开 1 GiB、单文件 128 MiB、20000 项；附件名及 ZIP 内路径仅接受 ASCII，下载输出目录支持中文。该约束不等于项目目录只能用英文。GitHub 摘要不是发布者数字签名，签名密钥的建立和发布仍由发布流程单独完成。
仓库展示名为 `Jia0201/CC-RADT`，API 固定到已核对的仓库 ID `1298234222`，不依赖可被重新注册的旧仓库名，也不接受任意 API 重定向。

## 旧版首次接入

已发布包不回写、不重算公开校验值。通过源工程的 `tools/release/ai-teams-upgrade-manifest.mjs` 将兼容清单输出到独立路径，再用 `--baseline-manifest`、`--package-manifest` 指定。清单必须针对可信原始正式包生成，不能针对已经长期使用的安装来伪造“原始基线”。

产品版本相同不代表内容相同。升级器验证整份 payload 指纹；显式认可两份清单指纹仅表示用户认可所选来源，并不等于官方数字签名。发布者可以提供独立 Ed25519 签名并通过公开可信渠道提供公钥；离线签名验证见 `verify-signature` 命令。

## 保留和冲突

- 项目画像、记忆、任务、会话、本地扩展按数据策略保留；不读取业务源码。
- 官方文件按旧基线、本地和目标三方比较；同名新增冲突、双方修改文本、修改后停用的文件均阻止整个升级。
- JSON 对互不冲突的对象键进行三方合并；数组双边变更阻断，避免错误拼接 Hooks 或权限。
- 本地配置 `settings.local.json` 不在管理范围；MCP 参数只在本机合并，报告不打印值。
- 敏感路径不读入哈希清单或备份，保持原地不动；不以“完整备份”为理由打开凭据。仅在本地处理必须合并的受管配置，不输出其正文。
- 配置引用和受管文件候选先检查，VERSION 最后切换。正式包既有模板不能重置运行期数据。
- 新版停用文件退出活动目录，原件及备份保留。恢复原件不会自动清理。

## 恢复方式

每次执行会在项目同卷同级的 `.cc-radt-upgrades/<项目指纹>/<事务ID>/` 留存 original、candidate、retired、journal 和 record.json。恢复不调用网络或 Harness 脚本。

项目指纹绑定目录的文件对象身份，不以路径大小写区分同一项目。原件和新版文件使用不同复制规则：前者保全本地元数据；后者只采用包内容和清单权限，不继承发布机的用户/用户组。事务记录按大小门禁校验后原子发布，事件使用单调递增序号，终态不依赖电脑墙钟排序。
替换已有文件及合并 JSON 时，候选继承本地原件的 UID/GID 并复核；分配失败则在切换前停止。真正新增文件使用本地创建归属。

发生切换中断后，先用外部工具 `recover` 恢复一致状态，再启动 Claude Code。重复恢复不会重复覆盖。发现升级后新写入内容时原地保留并停止恢复，需要人工核对；不以恢复旧快照为由抹掉新工作。

准备副本阶段失败时原安装未切换，可重新预览。切换阶段出现未完成事务时不能开启第二次升级。已完成并运行一段时间后的历史降级不在首版自动恢复范围。
界面尚未提供执行中的取消按钮；关闭网页不会中止后端。需要恢复的失败由内核明确标记，不靠是否生成备份目录推测。

## 支持边界

Windows/macOS/Linux 分平台实现文件锁、磁盘条件、元数据和写入者检查。路径内部的符号链接、硬链接、特殊文件和无法保真的元数据按不支持拒绝，不复制成普通文件。

首版按普通本地文件验证；NTFS/APFS/ext4 以平台模块声明为准。不得用交叉编译成功代替对应 OS 原生测试。目录锁不是沙箱，断电持久性需额外 VM/实机测试。当前测试结果与未完成验收见 [验证记录](VERIFICATION.md)。

当前 Windows 写入未开放；Linux 实现仍需原生 ext4 验收。macOS 的复制/锁/恢复实现也不代表通过断电测试。对不支持的 ACL、文件系统和活动写入者检查明确阻断，不提供强制跳过保护的开关。

## 开发验证

```sh
go test ./...
go test -race ./internal/engine ./internal/web
go vet ./...
```

`integration/formal-smoke.mjs` 可验证两份已有正式包在隔离安装上的升级；需要 Node 作为开发测试工具，不是升级器运行依赖。输入包不会改写，兼容清单和故障材料保留在新建 fixture 中。

测试仅使用隔离 fixture，包括多年数据、自定义配置、停用文件、路径冲突、清单篡改、每个切换阶段中断、恢复再次中断及新增内容保护。真实项目不能作为故障注入的写入目标。

参考：[实施方案](../lab/proposals/2026-09-08-external-updater-plan.md)、[升级包契约](CONTRACT.md)、[安全规则](../security/upgrade-policy.md)。
