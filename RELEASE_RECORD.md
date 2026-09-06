# CC-RADT 发布来源记录

- 生成时间：2026-09-06T15:00:41.644Z

## 版本与 Git 来源

- 版本：1.1.0
- dev 源分支：dev
- dev 源提交：e3073dcd60093ecf0df10e09dbeda1e9f0d96e73
- dev 短提交：e3073dc
- 变更基线：cae3eb3d19a2eeba172ca9399f044974ada62683
- 工作区：clean

## Dev 提交

- e3073dc fix(release): include provenance record in package file count
- 3432214 fix(release): preserve empty ADR directory in source checkouts
- 26e8d06 release: prepare CC-RADT v1.1.0
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
- `tools/release/version-report.test.mjs`

### Agent / Prompt

- `.claude/agents/lead.md`
- `agents/dev-backend-service/dev-backend-service.md`
- `agents/dev-backend-systems/dev-backend-systems.md`
- `agents/dev-frontend-miniapp/dev-frontend-miniapp.md`
- `agents/dev-frontend-web/dev-frontend-web.md`
- `agents/doc/doc.md`
- `agents/lead/lead.md`
- `agents/memory/memory.md`
- `agents/pd/pd.md`
- `agents/plan-pm/plan-pm.md`
- `agents/qa/qa.md`
- `agents/role/role.md`
- `agents/security-reviewer/security-reviewer.md`
- `prompts/agents/lead/system/1.0.1.prompt.md`
- `prompts/registry.json`

### Security / Rule / Playbook / ADR

- `.claude/rules/ai-teams-router.md`
- `playbook.md`
- `project/adr/accepted/ADR-0013-manual-project-initialization.md`
- `project/adr/accepted/ADR-0014-readonly-observer.md`
- `project/adr/index.md`
- `project/adr/rejected/.gitkeep`
- `rule/project/index.md`
- `security/index.md`
- `security/project-policy.md`
- `security/runtime-maintenance-policy.md`
- `security/supervision-policy.md`
- `security/version-control-policy.md`

### Hook / Tool / Init

- `hooks/index.md`
- `hooks/scripts/agent-heartbeat.mjs`
- `hooks/scripts/ai-teams-run-hook.mjs`
- `hooks/scripts/ai-teams-user-prompt-submit.sh`
- `hooks/scripts/observer-hook.mjs`
- `tools/bin/ai-teams-check.sh`
- `tools/bin/ai-teams-e2e-fixtures.sh`
- `tools/bin/ai-teams-heartbeat-test.mjs`
- `tools/bin/ai-teams-init-project.sh`
- `tools/bin/ai-teams-lib.sh`
- `tools/bin/ai-teams-lock.sh`
- `tools/bin/ai-teams-mcp-healthcheck.sh`
- `tools/bin/ai-teams-package.sh`
- `tools/bin/ai-teams-rule-refresh.mjs`
- `tools/commands/ai/init-project.md`
- `tools/commands/ai/package-formal.md`
- `tools/observer/README.md`
- `tools/observer/browser-test.mjs`
- `tools/observer/cli.mjs`
- `tools/observer/collector-worker.mjs`
- `tools/observer/collector.mjs`
- `tools/observer/installation-test.mjs`
- `tools/observer/observer.test.mjs`
- `tools/observer/runtime.mjs`
- `tools/observer/server.mjs`
- `tools/observer/web/app.js`
- `tools/observer/web/index.html`
- `tools/observer/web/style.css`
- `tools/release/README.md`
- `tools/release/ai-teams-version-report.mjs`
- `tools/release/version-report.test.mjs`

### Skill / MCP

- 无

### Project / Memory / KB / Shared / Index

- `index/ENTRY.md`
- `index/FILES.md`
- `index/INDEX.md`
- `index/PROJECT.md`
- `index/STATUS.md`
- `project/PROJECT.md`
- `project/adr/accepted/ADR-0013-manual-project-initialization.md`
- `project/adr/accepted/ADR-0014-readonly-observer.md`
- `project/adr/index.md`
- `project/adr/rejected/.gitkeep`
- `project/upgrade-state.md`
- `shared/supervision/heartbeat.md`

### README / Install / Compatibility

- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `MANIFEST.json`
- `README.en.md`
- `README.md`
- `VERSION`
- `templates/package/formal/INSTALL.md`
- `templates/package/formal/README.en.md`
- `templates/package/formal/README.md`

## 验证与安装包

- VERSION / MANIFEST：一致
- Changelog 版本条目：存在
- 安装包文件数量：975
- manifest：.claude/manifest.json
- checksum：checksums.txt

## 门禁结论

- 通过
