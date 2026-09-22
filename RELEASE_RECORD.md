# CC-RADT 发布来源记录

- 生成时间：2026-09-22T13:40:51.199Z

## 版本与 Git 来源

- 版本：1.2.0
- dev 源分支：dev
- dev 源提交：dcd8e96611eff7bda023e3d95e2b8723c0e9fd33
- dev 短提交：dcd8e96
- 变更基线：dev-v1.1.0
- 工作区：clean

## Dev 提交

- dcd8e96 fix(release): exclude worktree git pointers
- d15dc76 release: prepare CC-RADT v1.2.0
- 3f577cf fix(docs): preserve project-root commands in packaged readmes
- ae3c729 docs(observer): showcase screenshots and version branch navigation
- 54b9f5d release: record v1.1.0 publication

## 变更分类

### Git / Version Governance

- `CHANGELOG.md`
- `tools/release/README.md`
- `tools/release/ai-teams-upgrade-manifest.mjs`
- `tools/release/ai-teams-upgrade-manifest.test.mjs`
- `tools/release/fixture-copy.test.mjs`
- `tools/release/publications/v1.1.0.md`

### Agent / Prompt

- 无

### Security / Rule / Playbook / ADR

- `project/adr/accepted/ADR-0014-readonly-observer.md`
- `security/index.md`
- `security/upgrade-policy.md`

### Hook / Tool / Init

- `hooks/index.md`
- `tools/bin/ai-teams-check.sh`
- `tools/bin/ai-teams-e2e-fixtures.sh`
- `tools/bin/ai-teams-package.sh`
- `tools/bin/ai-teams-upgrade.sh`
- `tools/commands/ai/upgrade-existing.md`
- `tools/commands/index.md`
- `tools/observer/README.md`
- `tools/observer/browser-test.mjs`
- `tools/observer/catalog.mjs`
- `tools/observer/cli.mjs`
- `tools/observer/collector-worker.mjs`
- `tools/observer/collector.mjs`
- `tools/observer/installation-test.mjs`
- `tools/observer/local-data.mjs`
- `tools/observer/native.mjs`
- `tools/observer/native.test.mjs`
- `tools/observer/observer.test.mjs`
- `tools/observer/runtime.mjs`
- `tools/observer/server.mjs`
- `tools/observer/web/app.js`
- `tools/observer/web/index.html`
- `tools/observer/web/markdown.js`
- `tools/observer/web/style.css`
- `tools/observer/web/vendor/README.md`
- `tools/observer/web/vendor/dompurify.LICENSE`
- `tools/observer/web/vendor/dompurify.LICENSE-MPL`
- `tools/observer/web/vendor/marked.LICENSE`
- `tools/observer/web/vendor/marked.js`
- `tools/observer/web/vendor/purify.js`
- `tools/observer/worktree.mjs`
- `tools/release/README.md`
- `tools/release/ai-teams-upgrade-manifest.mjs`
- `tools/release/ai-teams-upgrade-manifest.test.mjs`
- `tools/release/fixture-copy.test.mjs`
- `tools/release/publications/v1.1.0.md`
- `tools/upgrade/README.md`

### Skill / MCP

- 无

### Project / Memory / KB / Shared / Index

- `index/COMMANDS.md`
- `index/FILES.md`
- `index/PROJECT.md`
- `index/STATUS.md`
- `project/PROJECT.md`
- `project/adr/accepted/ADR-0014-readonly-observer.md`

### README / Install / Compatibility

- `CHANGELOG.md`
- `MANIFEST.json`
- `README.en.md`
- `README.md`
- `VERSION`
- `templates/package/formal/README.en.md`
- `templates/package/formal/README.md`

## 验证与安装包

- VERSION / MANIFEST：一致
- Changelog 版本条目：存在
- 安装包文件数量：999
- manifest：.claude/manifest.json
- checksum：checksums.txt

## 门禁结论

- 通过
