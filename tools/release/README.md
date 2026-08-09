# 版本与发布工具

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
