# CC-RADT 外部升级包契约

状态：首版开发契约，2026-09-08。本文件约束生成器与 Go 内核之间的数据，不代表已发布升级器、签名分发或任何平台已验收。Go 模块独立于 Harness；不在 Hook、Lead 或工程内脚本中执行升级。

## 清单 Schema

包根清单名称为 `upgrade-manifest.json`，UTF-8 JSON。旧公开包使用包外 sidecar，文件内容相同，不能修改旧 ZIP、附件、checksum、版本或标签。拒绝重复 JSON 键；未知 schema、policy、迁移操作必须 fail-closed。

| 字段 | 类型与约束 |
|---|---|
| `schemaVersion` | 整数，固定 `1` |
| `product` | 字符串，固定 `CC-RADT` |
| `version` | 明确稳定版本 `x.y.z`，各部分无前导零且不大于 uint32；必须等于 `.claude/ai-teams/VERSION` |
| `buildId` | 下述 canonical payload 的 SHA-256，64 位小写十六进制 |
| `dataSchema` | 正整数；生成器首版固定 `1` |
| `minimumUpdaterVersion` | 必填稳定版本；生成器首版固定 `0.1.0`，不是 `minimumVersion` |
| `files` | 非空文件数组，最多 100000 项；按 path 排序，无重复和大小写碰撞 |
| `migrations` | 路由数组；生成器首版固定 `[]`，不捏造跨版本迁移路线 |

每个 `files` 对象仅输出下列五个字段，顺序固定；首版不输出 `merge`。JSON 字段顺序不参与 buildId。

| 字段 | 类型与约束 |
|---|---|
| `path` | 相对业务项目根的 POSIX 路径；不是相对 `.claude/ai-teams` |
| `sha256` | 原始文件字节的 SHA-256，64 位小写十六进制 |
| `size` | 原始字节数，非负整数，单文件不超过 512 MiB，payload 总量不超过 2 GiB |
| `mode` | Unix 权限整数 `0..511`，不包含文件类型或特殊位；例如 `0644` 输出为 `420`，`0755` 输出为 `493` |
| `policy` | `system`、`data`、`config`、`generated` 之一 |

清单最大 8 MiB。符号链接、硬链接、特殊文件以及 setuid/setgid/sticky 文件不能由生成器封装成普通文件。拒绝路径越界、绝对路径、反斜杠、控制字符、Windows 保留名、末尾点/空格、非 NFC 名称和大小写碰撞，不静默规范化后认领。内核必须独立执行路径与平台验证，不能把生成器前置校验当作不可信包的信任依据。

## Canonical BuildId

1. `files` 按 `path` 的 UTF-8 字节序升序排列，不用 locale 排序。ASCII 路径即 ASCII 顺序；Go 字符串比较与 Node `Buffer.compare` 一致。
2. 每文件输出 `path + NUL + sha256 + NUL + size + NUL + mode + NUL + policy + LF`。数值用无前导零的十进制 ASCII，NUL 是字节 `0x00`，LF 是字节 `0x0a`，不是字面量反斜杠。
3. 对这些记录的 UTF-8 拼接字节计算 SHA-256。空格、JSON 缩进、对象字段顺序及文件时间戳不参与算法。

```js
const canonical = [...files]
  .sort((a, b) => Buffer.compare(Buffer.from(a.path), Buffer.from(b.path)))
  .map(f => `${f.path}\0${f.sha256}\0${f.size}\0${f.mode}\0${f.policy}\n`)
  .join('');
const buildId = createHash('sha256').update(canonical, 'utf8').digest('hex');
```

`upgrade-manifest.json` 自身、包根 checksum、签名、发布记录和 sidecar 不在 `files` 中。包根 README/VERSION 也不在其中。`.claude/manifest.json` 与 `.claude/ai-teams/MANIFEST.json` 是受管安装内容，必须在生成清单之前定稿。buildId 只标识 payload，不证明来源；用于用户信任确认的 **manifest SHA-256** 对清单原始完整字节计算，涵盖版本、schema、迁移声明，不能用 buildId 替代。

## 受管路径

- `.claude/ai-teams/**`，其中 `.claude/ai-teams/VERSION` 必须存在且为 `system`。
- `.claude/agents/*.md` 和 `.claude/rules/*.md`，仅扁平文件。
- `.claude/settings.json`、`.claude/settings.local.example.json`、`.claude/manifest.json`、`.claude/CLAUDE.md`。
- 项目根 `.mcp.json` 和 `CLAUDE.md`。

根 `README.md`、根 `VERSION`、业务源码、`.claude/settings.local.json`、`.env`、私钥和凭据不受管，不读取业务正文来生成清单。scope 是可检查范围，不是覆盖授权。未知本地文件不得仅因位于此范围就自动认领。仅支持 `claude-subdir` 安装布局；`root`/`simplify` 不生成升级清单。

## 文件策略

| Policy | 首版行为边界 |
|---|---|
| `system` | 仅对可信旧基线确认的官方文件做三方比较；本地删除、双方修改、同名不同内容必须显式处理，不能目录级 rsync 覆盖 |
| `data` | 当前已有内容按字节保留，不用新包默认模板覆盖；数据迁移只能来自显式受信任路由 |
| `config` | 需具备归属依据的三方处理；不能丢字段、整表覆盖权限/Hooks/MCP，也不声明已经实现所有配置的自动合并 |
| `generated` | 首版没有 smart 图谱/人工区块合并或自动重建；本地与新版同时修改时保守阻断，仅本地改而上游未变时保留，不能用“可重建”当覆盖理由 |

`memory/project/kb/shared` 混合目录中，只有生成器逐路径列明的协议、规则、模板，以及已知角色的有限初始化 KB 文件集为 system；不按文件名后缀、任意 `index.md` 或大写模板名泛化。所有其他文件默认 data，除 `GENERATED_FILES` 明确列出的图谱等生成文件。项目画像、记忆、会话、任务、项目追加知识、共享运行状态、提示词演进记录均为 data。

`rule/custom`、`rule/project`、未列明的 Skills/MCP/提示词文件和运行资料同样默认 data。已知官方静态资产为 system，已明确列出的可迁移注册表和配置为 config，不把整个混合目录归为 system 或 data。官方 Agent 编译文件与 prompt/Skill 源文件都通过旧/当前/新比较：仅本地改且上游未变时保留，双方改出不同内容时整次升级冲突阻断，不以“官方”名义覆盖自进化内容。

### 分类复查与取舍

本轮补齐已知官方静态资产的 system/config 归属，不增加新的 policy 或引擎合并行为。分类清单与语义规则来自对源码及 `refs/tags/v1.0.0`、`refs/tags/v1.1.0` 包结构的只读核对，不从用户当前安装的 registry、文件名相似性或本地 Git 状态推导官方归属。

| 范围 | 当前分类与理由 |
|---|---|
| 系统 VERSION、MANIFEST、运行说明及显式静态 index 文件 | system；只针对 Harness 内部路径，业务根 README/VERSION 不在清单 |
| 官方包中的扁平 Agent/Rule 适配文件、`.claude/manifest.json`、本地配置示例 | system；来源须来自受信任原始包，不能把现用项目扫描成官方基线；本地编译/激活改动仍受三方比较保护 |
| `agents/`、`hooks/`、`security/`、`templates/`、`third_party/`、`tools/` 及非 custom/project 的 `rule/` | 系统组件范围默认 system，已列明 runtime/缓存/用户目录与 `tools/rollback/` 例外为 data；这是包内组件归属，不是覆盖所有本地同目录文件的授权 |
| `memory/project/kb/shared` | 显式协议、规则、模板和 KB 主导航为 system；已知 12 角色的 `index.md`、`00-index.md` 到 `05-do-not.md` 这七个确切初始化文件为 system；项目追加知识/任务/状态为 data，显式图谱为 generated |
| `prompts/agents/<已知角色>/` | `system/[v]x.y.z.prompt.md`、`retry/[v]x.y.z.prompt.md`、`task/default.[v]x.y.z.prompt.md`、`evals/cases.json` 和 `index.md` 为 system；未知角色、非约定文件、运行结果为 data。方括号表示可选 v，不是路径字面量 |
| `skills/agents/` | `SKILL_ASSETS` 固定枚举角色、内置 slug 与每个静态资产相对路径，仅匹配项为 system，包括 SKILL、代码、规则、示例与许可证；不按扩展名或整个 Skill 目录认领。已知角色索引为 system，registry 为 config，未知 Skill/新增本地文件/运行输出为 data |
| `mcp/` | 明确列出的共享/CodeGraph/已知角色指引与索引为 system；`registry.json`、`claude-project.mcp.json`、`optional-servers.mcp.example.json` 为 config。只针对原始包的公开配置与环境占位符，不纳入私有值，未知本地 server 配置与资料默认 data |
| `prompts/` 公共部分 | 显式公共 prompt、schema 与主索引为 system，`registry.json` 为 config，`graph.md` 为 generated，其余 data |
| 指定外层 settings/MCP/CLAUDE 文件 | config；只说明需要受控配置处理，不宣称已实现按领域语义、权限归属或 Markdown 区块智能合并 |
| 显式生成索引/图谱 | generated；保守三方比较，不自动重建或覆盖人工关联 |
| `cron/`、`logs/`、自建/项目 rule、未列明路径 | data；包括未细分的官方说明、调度模板与回滚工具说明，属于保守不更新的已知限制 |

**未修改的官方文件能否更新：** 当前被标为 system/config/generated 的文件，在本地字节和有效权限仍等于可信旧基线、上游内容有变时可采用新版。标为 data 的文件没有“未修改官方模板”例外：无论本地是否等于旧基线，已有路径均保留；旧基线有而本地已删的路径也不自动补回。仅新版新增、旧基线与本地都不存在的 data 路径会补入；若本地已有同名 data，保留本地，不将其解释为已成功安装新版内容。

已知官方 prompt/Skill/MCP/初始化 KB 同路径更新现在进入三方比较，不再因整个目录被视为 data 而永久停留旧版。静态文件上新增的本地定制不是永久 data 标记：本地与上游均修改时应冲突，单方本地修改且上游未变时保留。未知本地新增文件由引擎保留；新版新增官方路径碰上不同本地内容时必须报冲突。

新增官方角色、Skill、静态附件或新旧布局变体须先补清单与 fixture；未知结构仍保守 data，不能因此宣布相应组件已升级。发布验收须确认所需静态文件均获得正确 policy，并检查注册表引用、编译 Agent、Skill 内容和依赖一致；分类/哈希/plan ready 本身不是完整功能验收。

### 旧包 Sidecar

生成器只枚举 `--package` 实际存在的文件，对这些文件原字节计算哈希。内置分类清单包含已核对的旧包资产与命名规则，不要求旧包具备最新 registry，不读取当前源码的 registry 或自动把当前静态文件补到旧包。例如旧包只有 `prompts/agents/lead/system/v1.0.0.prompt.md` 时，只输出该路径，不凭最新源码增加 `1.0.1.prompt.md`。已知 Skill 精确静态列表同时覆盖核对过的两版结构；未识别旧文件仍 data，必须先评审才能承诺它的升级。

兼容清单是对可信原始旧包的显式归属说明，不是对任意旧版本保证兼容。只能用包外 `--output` 生成新文件，原包、旧附件、checksum 和版本均不修改；不能以“更新 policy”为名重打旧包。对旧、新原始包采用同一已审核兼容规则后，由用户重新核对相应 sidecar 指纹。

已经发布或被认可的清单不能覆盖或悄悄换 policy。若已有可信旧清单把文件明确标成 data，引擎的 data 转非 data 阻断仍有效，需要另行审核接入/迁移决定；不能重 seal 现用项目或重写原清单绕过。本生成器不执行这种转换，也不自动认可新 sidecar。

## 显式数据改名

将来需要迁移时，路由描述严格为：

```json
{
  "id": "example-route",
  "fromSchema": 1,
  "toSchema": 2,
  "renames": [
    { "from": ".claude/ai-teams/project/old.md", "to": ".claude/ai-teams/project/new.md" }
  ]
}
```

此处仅为 schema 示例，不是实际支持路线。`id` 为非空唯一字符串，schema 为整数。仅支持显式单个 data 文件改名，原始字节守恒；不支持目录、glob、脚本、下载、删除、任意 JSON 转换。迁移只能在 candidate 中执行，来源/目标必须在受管数据范围，目标已有不同内容、缺失路线、循环或歧义均阻断。签名或用户指纹认可必须覆盖迁移声明。当前生成器只输出 `dataSchema: 1` 和空数组。

## 来源与信任

生成器只建立可校验清单，不自动建立官方信任；未来若提供 seal 入口，它同样不等于签名 CLI。当前以实际 `--help` 为准，不把 `updater --seal` 列为已交付命令。没有发布公钥时不能伪造“已验证官方签名”；未签名包仅可 preview/plan。真正 apply 前，UI/CLI 必须展示并要求用户明确输入或确认旧、新清单各自完整 SHA-256，绑定实际计划和再次校验后的清单；Agent 不能替用户默认认可。任何重新生成、字节改变、换包或换项目都不能沿用旧认可。

Ed25519 签名由独立签名/发布链路负责，内核的 `verify-signature` 可验证指定公钥下的独立签名；公钥来源仍需核实，不等于已配置官方发布信任。不在本生成器中加入 `trusted: true`、默认跳过验证或自签冒充官方。用户指纹认可不跳过哈希、权限、路径、冲突、写入者、迁移及恢复检查。

## 生成与打包终点

开发者在所有 fixture 准备后测试，只对隔离候选包操作：

```bash
node tools/release/ai-teams-upgrade-manifest.test.mjs
node tools/release/ai-teams-upgrade-manifest.mjs --package /absolute/new-candidate
node tools/release/ai-teams-upgrade-manifest.mjs --package /absolute/immutable-old-package --output /absolute/sidecars/old-upgrade-manifest.json
```

`--version` 可省略，读取系统 VERSION；指定时必须与包一致，不允许重新标注旧版本。输出父目录须已存在；输出文件必须不存在；sidecar 通过真实父目录检查必须在包外。CLI 输出 buildId、manifestSha256 及 `signed: false`、`trusted: false`，没有自动下载或包内改写。不要把正在使用的项目当官方包 seal 后用于覆盖授权。

正式打包只在验证和运行痕迹清理、目录刷新、发布记录、安装 manifest 最终字段完成后生成升级清单，随后写最终 checksums；之后不能再修改任何 payload。预留清单 metadata 计数位以保证发布记录与安装 manifest 的 file_count 一致，不将占位文件当有效升级清单。`updater/` 源码和 `tools/release/` 排除出 Harness；独立二进制作为另行验收和授权发布的附件，不从 Harness 调用。

## 验收与未交付项

生成器 fixture 覆盖可重复哈希、跨语言 canonical、sidecar 不变性、权限、系统版本、分类、路径和旧脚本零写入；Go 内核负责独立包验证、三方规划、信任、事务与故障恢复测试。生成器测试不能替代 Go 故障注入、真实平台测试或长期使用数据守恒证据。发布签名、真实升级路线与平台支持均须在各自验收后声明。
