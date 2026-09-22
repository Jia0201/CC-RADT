# 版本与发布工具

- [夹具复制边界回归](fixture-copy.test.mjs)：验证私有配置、凭据、软链接和独立升级器构建材料不会被 Harness 测试夹具复制。
- [升级清单生成器](ai-teams-upgrade-manifest.mjs)、[fixture 测试](ai-teams-upgrade-manifest.test.mjs)、[外部升级契约](../../updater/CONTRACT.md)：只封装可校验 metadata，旧包使用包外 sidecar，不签名或自动授权 apply。

## 已发布版本

- [v1.1.0 发布映射与验证](publications/v1.1.0.md)：源提交、运行提交、版本标签、Release 与归档校验。

`ai-teams-version-report.mjs` 只读取 Git 元数据、版本文件和可选安装包元数据，不读取 diff 或敏感文件内容。

预览当前 dev 变化：

```bash
node tools/release/ai-teams-version-report.mjs --version "$(tr -d '[:space:]' < VERSION)"
```

指定上一源标签并写入记录：

```bash
node tools/release/ai-teams-version-report.mjs \
  --version 1.1.0 \
  --base-ref dev-v1.0.0 \
  --package-dir "$HOME/CC-RADT-dist/formal" \
  --output "$HOME/CC-RADT-dist/formal/RELEASE_RECORD.md"
```

`--strict` 会在非 `dev` 分支、工作区不干净、版本不一致、Changelog 缺少版本或包元数据缺失时失败。正式发布前必须使用严格模式。
