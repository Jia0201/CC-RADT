# CC-RADT 发布来源记录

- 生成时间：2026-08-09T15:23:53.178Z

## 版本与 Git 来源

- 版本：1.0.0
- dev 源分支：dev
- dev 源提交：9331b798f3f77783c20433616bfc779f464f8dd1
- dev 短提交：9331b79
- 变更基线：cae3eb3d19a2eeba172ca9399f044974ada62683
- 工作区：clean

## Dev 提交

- 9331b79 fix(package): remove source-only runtime references
- 6780f42 chore(release): add git and version governance
- 23f88c5 fix: preserve runtime state directories in packages
- 182e769 docs: migrate public readme and generated diagrams
- 4e3fb41 docs: add secondary development guide
- b860372 Fix runtime packaging and installation guide

## 变更分类

### Git / Version Governance

- `.github/PULL_REQUEST_TEMPLATE.md`
- `.gitmessage`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `security/version-control-policy.md`
- `templates/version-control/commit-message.md`
- `templates/version-control/development-change-record.md`
- `templates/version-control/release-checklist.md`
- `templates/version-control/release-record.md`
- `tools/release/README.md`
- `tools/release/ai-teams-version-report.mjs`

### Agent / Prompt

- 无

### Security / Rule / Playbook / ADR

- `security/index.md`
- `security/version-control-policy.md`

### Hook / Tool / Init

- `tools/bin/ai-teams-check.sh`
- `tools/bin/ai-teams-package.sh`
- `tools/commands/ai/package-formal.md`
- `tools/release/README.md`
- `tools/release/ai-teams-version-report.mjs`

### Skill / MCP

- 无

### Project / Memory / KB / Shared / Index

- `index/FILES.md`
- `index/INDEX.md`
- `index/STATUS.md`

### README / Install / Compatibility

- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `README.en.md`
- `README.md`
- `templates/package/formal/INSTALL.md`
- `templates/package/formal/README.en.md`
- `templates/package/formal/README.md`

## 验证与安装包

- VERSION / MANIFEST：一致
- Changelog 版本条目：存在
- 安装包文件数量：956
- manifest：.claude/manifest.json
- checksum：checksums.txt

## 门禁结论

- 通过
