#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { constants, closeSync, fstatSync, lstatSync, openSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const MANIFEST_NAME = 'upgrade-manifest.json';
const ROOT = '.claude/ai-teams/';
const TOP_FILES = new Set(['.mcp.json', 'CLAUDE.md', '.claude/CLAUDE.md', '.claude/settings.json', '.claude/manifest.json', '.claude/settings.local.example.json']);
const CONFIG_FILES = new Set(['.mcp.json', 'CLAUDE.md', '.claude/CLAUDE.md', '.claude/settings.json']);
const RUNTIME_CONFIG = new Set(['prompts/registry.json', 'mcp/registry.json', 'mcp/claude-project.mcp.json', 'mcp/optional-servers.mcp.example.json', 'skills/registry.json']);
const OFFICIAL_AGENTS = new Set([
  'lead', 'pd', 'plan-pm', 'dev-frontend-web', 'dev-frontend-miniapp',
  'dev-backend-systems', 'dev-backend-service', 'qa', 'memory', 'doc', 'role', 'security-reviewer',
]);
const INITIAL_KB_FILES = new Set([
  'index.md', '00-index.md', '01-source-map.md', '02-engineering-rules.md',
  '03-code-style.md', '04-review-checklist.md', '05-do-not.md',
]);

// Mixed directories are opt-in by exact path, never by extension or basename.
const MIXED_SYSTEM_FILES = new Set([
  'memory/context-compression.md', 'memory/refresh-rules.md', 'memory/retention-policy.md',
  'kb/shared/agent-collaboration-protocol.md', 'kb/shared/engineering-brain.md',
  'kb/shared/markdown-document-standard.md', 'kb/shared/memory-and-compression.md',
  'kb/shared/shared-workspace-protocol.md',
  'shared/protocol.md', 'shared/broadcasts/BROADCAST_PROTOCOL.md',
  'shared/contracts/API_CONTRACT_TEMPLATE.md', 'shared/decisions/DECISION_TEMPLATE.md',
  'shared/escalations/ESCALATION_TEMPLATE.md', 'shared/escalations/retry-flowback.md',
  'shared/events/EVENT_TEMPLATE.md', 'shared/handoffs/HANDOFF_TEMPLATE.md',
  'shared/locks/LOCK_TEMPLATE.md', 'shared/supervision/SUPERVISION_TEMPLATE.md',
  'shared/supervision/heartbeat.md',
  'shared/tasks/EXECUTION_PLAN_TEMPLATE.md', 'shared/tasks/TASK_TEMPLATE.md',
  'shared/transactions/TRANSACTION_TEMPLATE.md',
  'shared/prompt-evolution/candidates/PROMPT_CANDIDATE_TEMPLATE.md',
  'shared/prompt-evolution/events/PROMPT_EVENT_TEMPLATE.md',
  'shared/prompt-evolution/reviews/PROMPT_REVIEW_TEMPLATE.md',
]);
const GENERATED_FILES = new Set([
  'index/FILES.md', 'index/PROJECT.md', 'index/STATUS.md', 'index/REQUIREMENTS.md',
  'project/graph.md', 'kb/graph.md', 'prompts/graph.md',
]);
const SYSTEM_FILES = new Set([
  'VERSION', 'MANIFEST.json', 'README.md', 'README.en.md', 'THIRD_PARTY_NOTICES.md',
  'playbook.md', 'index/AGENTS.md', 'index/INDEX.md', 'index/CODEGRAPH.md',
  'index/READING-MODES.md', 'index/README.md', 'index/NAVIGATION.md', 'index/COMMANDS.md',
  'index/ENTRY.md', 'prompts/index.md', 'prompts/common/retry-guard.prompt.md',
  'prompts/common/task-contract.prompt.md', 'prompts/common/system-core.prompt.md',
  'prompts/schemas/prompt.schema.json', 'prompts/schemas/result.schema.json',
  'prompts/schemas/variables.schema.json', 'prompts/schemas/eval-case.schema.json',
  'skills/index.md', 'skills/shared/index.md',
  'mcp/index.md', 'mcp/agents/index.md', 'mcp/shared/index.md',
  'mcp/codegraph/index.md', 'mcp/codegraph/agent-policy.md', 'mcp/codegraph/tools.md',
  'kb/index.md', 'kb/agents/index.md', 'kb/shared/index.md',
]);
// Exact bundled assets reviewed against v1.0.0/v1.1.0 and source on 2026-09-08.
// This catalog is frozen here; generation never trusts a live project registry.
const SKILL_ASSETS = {
  "build-mcp-server": {
    agents: ["dev-backend-service"],
    files: [
      "SKILL.md",
      "references/auth.md",
      "references/deploy-cloudflare-workers.md",
      "references/elicitation.md",
      "references/remote-http-scaffold.md",
      "references/resources-and-prompts.md",
      "references/server-capabilities.md",
      "references/tool-design.md",
      "references/versions.md",
    ],
  },
  "code-documentation": {
    agents: ["dev-backend-service","dev-backend-systems","dev-frontend-miniapp","doc"],
    files: [
      "SKILL.md",
    ],
  },
  "diagnose": {
    agents: ["dev-backend-service","dev-backend-systems","lead","plan-pm","qa","security-reviewer"],
    files: [
      "SKILL.md",
      "scripts/hitl-loop.template.sh",
    ],
  },
  "improve-codebase-architecture": {
    agents: ["dev-backend-service","dev-backend-systems"],
    files: [
      "DEEPENING.md",
      "INTERFACE-DESIGN.md",
      "LANGUAGE.md",
      "SKILL.md",
    ],
  },
  "karpathy-guidelines": {
    agents: ["dev-backend-service","dev-backend-systems"],
    files: [
      "SKILL.md",
    ],
  },
  "tdd": {
    agents: ["dev-backend-service","dev-backend-systems","dev-frontend-miniapp","dev-frontend-web","qa"],
    files: [
      "SKILL.md",
      "deep-modules.md",
      "interface-design.md",
      "mocking.md",
      "refactoring.md",
      "tests.md",
    ],
  },
  "claude-anthropic-webapp-testing": {
    agents: ["dev-frontend-miniapp","dev-frontend-web","qa"],
    files: [
      "LICENSE.txt",
      "SKILL.md",
      "examples/console_logging.py",
      "examples/element_discovery.py",
      "examples/static_html_automation.py",
      "scripts/with_server.py",
    ],
  },
  "frontend-design": {
    agents: ["dev-frontend-miniapp","dev-frontend-web"],
    files: [
      "LICENSE.txt",
      "SKILL.md",
    ],
  },
  "vercel-react-best-practices": {
    agents: ["dev-frontend-web"],
    files: [
      "AGENTS.md",
      "README.md",
      "SKILL.md",
      "metadata.json",
      "rules/_sections.md",
      "rules/_template.md",
      "rules/advanced-effect-event-deps.md",
      "rules/advanced-event-handler-refs.md",
      "rules/advanced-init-once.md",
      "rules/advanced-use-latest.md",
      "rules/async-api-routes.md",
      "rules/async-cheap-condition-before-await.md",
      "rules/async-defer-await.md",
      "rules/async-dependencies.md",
      "rules/async-parallel.md",
      "rules/async-suspense-boundaries.md",
      "rules/bundle-analyzable-paths.md",
      "rules/bundle-barrel-imports.md",
      "rules/bundle-conditional.md",
      "rules/bundle-defer-third-party.md",
      "rules/bundle-dynamic-imports.md",
      "rules/bundle-preload.md",
      "rules/client-event-listeners.md",
      "rules/client-localstorage-schema.md",
      "rules/client-passive-event-listeners.md",
      "rules/client-swr-dedup.md",
      "rules/js-batch-dom-css.md",
      "rules/js-cache-function-results.md",
      "rules/js-cache-property-access.md",
      "rules/js-cache-storage.md",
      "rules/js-combine-iterations.md",
      "rules/js-early-exit.md",
      "rules/js-flatmap-filter.md",
      "rules/js-hoist-regexp.md",
      "rules/js-index-maps.md",
      "rules/js-length-check-first.md",
      "rules/js-min-max-loop.md",
      "rules/js-request-idle-callback.md",
      "rules/js-set-map-lookups.md",
      "rules/js-tosorted-immutable.md",
      "rules/rendering-activity.md",
      "rules/rendering-animate-svg-wrapper.md",
      "rules/rendering-conditional-render.md",
      "rules/rendering-content-visibility.md",
      "rules/rendering-hoist-jsx.md",
      "rules/rendering-hydration-no-flicker.md",
      "rules/rendering-hydration-suppress-warning.md",
      "rules/rendering-resource-hints.md",
      "rules/rendering-script-defer-async.md",
      "rules/rendering-svg-precision.md",
      "rules/rendering-usetransition-loading.md",
      "rules/rerender-defer-reads.md",
      "rules/rerender-dependencies.md",
      "rules/rerender-derived-state-no-effect.md",
      "rules/rerender-derived-state.md",
      "rules/rerender-functional-setstate.md",
      "rules/rerender-lazy-state-init.md",
      "rules/rerender-memo-with-default-value.md",
      "rules/rerender-memo.md",
      "rules/rerender-move-effect-to-event.md",
      "rules/rerender-no-inline-components.md",
      "rules/rerender-simple-expression-in-memo.md",
      "rules/rerender-split-combined-hooks.md",
      "rules/rerender-transitions.md",
      "rules/rerender-use-deferred-value.md",
      "rules/rerender-use-ref-transient-values.md",
      "rules/server-after-nonblocking.md",
      "rules/server-auth-actions.md",
      "rules/server-cache-lru.md",
      "rules/server-cache-react.md",
      "rules/server-dedup-props.md",
      "rules/server-hoist-static-io.md",
      "rules/server-no-shared-module-state.md",
      "rules/server-parallel-fetching.md",
      "rules/server-parallel-nested-fetching.md",
      "rules/server-serialization.md",
    ],
  },
  "academic-paper-review": {
    agents: ["doc"],
    files: [
      "SKILL.md",
    ],
  },
  "claude-claude-md-management-claude-md-improver": {
    agents: ["doc"],
    files: [
      "SKILL.md",
      "references/quality-criteria.md",
      "references/templates.md",
      "references/update-guidelines.md",
    ],
  },
  "claude-claude-code-setup-claude-automation-recommender": {
    agents: ["lead","role"],
    files: [
      "SKILL.md",
      "references/hooks-patterns.md",
      "references/mcp-servers.md",
      "references/plugins-reference.md",
      "references/skills-reference.md",
      "references/subagent-templates.md",
    ],
  },
  "handoff": {
    agents: ["lead","memory"],
    files: [
      "SKILL.md",
    ],
  },
  "triage": {
    agents: ["lead","plan-pm","qa"],
    files: [
      "AGENT-BRIEF.md",
      "OUT-OF-SCOPE.md",
      "SKILL.md",
    ],
  },
  "zoom-out": {
    agents: ["lead","memory"],
    files: [
      "SKILL.md",
    ],
  },
  "claude-session-report-session-report": {
    agents: ["memory"],
    files: [
      "SKILL.md",
      "analyze-sessions.mjs",
      "template.html",
    ],
  },
  "consulting-analysis": {
    agents: ["pd"],
    files: [
      "SKILL.md",
    ],
  },
  "deep-research": {
    agents: ["pd"],
    files: [
      "SKILL.md",
    ],
  },
  "grill-me": {
    agents: ["pd"],
    files: [
      "SKILL.md",
    ],
  },
  "grill-with-docs": {
    agents: ["pd"],
    files: [
      "ADR-FORMAT.md",
      "CONTEXT-FORMAT.md",
      "SKILL.md",
    ],
  },
  "to-prd": {
    agents: ["pd"],
    files: [
      "SKILL.md",
    ],
  },
  "prototype": {
    agents: ["plan-pm"],
    files: [
      "LOGIC.md",
      "SKILL.md",
      "UI.md",
    ],
  },
  "to-issues": {
    agents: ["plan-pm"],
    files: [
      "SKILL.md",
    ],
  },
  "claude-plugin-dev-agent-development": {
    agents: ["role"],
    files: [
      "SKILL.md",
      "examples/agent-creation-prompt.md",
      "examples/complete-agent-examples.md",
      "references/agent-creation-system-prompt.md",
      "references/system-prompt-design.md",
      "references/triggering-examples.md",
      "scripts/validate-agent.sh",
    ],
  },
  "setup-matt-pocock-skills": {
    agents: ["role"],
    files: [
      "SKILL.md",
      "domain.md",
      "issue-tracker-github.md",
      "issue-tracker-gitlab.md",
      "issue-tracker-local.md",
      "triage-labels.md",
    ],
  },
  "skill-creator": {
    agents: ["role"],
    files: [
      "LICENSE.txt",
      "SKILL.md",
      "agents/analyzer.md",
      "agents/comparator.md",
      "agents/grader.md",
      "assets/eval_review.html",
      "eval-viewer/generate_review.py",
      "eval-viewer/viewer.html",
      "references/output-patterns.md",
      "references/schemas.md",
      "references/workflows.md",
      "scripts/aggregate_benchmark.py",
      "scripts/generate_report.py",
      "scripts/improve_description.py",
      "scripts/init_skill.py",
      "scripts/package_skill.py",
      "scripts/quick_validate.py",
      "scripts/run_eval.py",
      "scripts/run_loop.py",
      "scripts/utils.py",
    ],
  },
  "write-a-skill": {
    agents: ["role"],
    files: [
      "SKILL.md",
    ],
  },
  "claude-anthropic-mcp-builder": {
    agents: ["security-reviewer"],
    files: [
      "LICENSE.txt",
      "SKILL.md",
      "reference/evaluation.md",
      "reference/mcp_best_practices.md",
      "reference/node_mcp_server.md",
      "reference/python_mcp_server.md",
      "scripts/connections.py",
      "scripts/evaluation.py",
      "scripts/example_evaluation.xml",
      "scripts/requirements.txt",
    ],
  },
  "claude-hookify-writing-rules": {
    agents: ["security-reviewer"],
    files: [
      "SKILL.md",
    ],
  },
  "claude-plugin-dev-hook-development": {
    agents: ["security-reviewer"],
    files: [
      "SKILL.md",
      "examples/load-context.sh",
      "examples/validate-bash.sh",
      "examples/validate-write.sh",
      "references/advanced.md",
      "references/migration.md",
      "references/patterns.md",
      "scripts/README.md",
      "scripts/hook-linter.sh",
      "scripts/test-hook.sh",
      "scripts/validate-hook-schema.sh",
    ],
  },
  "claude-plugin-dev-mcp-integration": {
    agents: ["security-reviewer"],
    files: [
      "SKILL.md",
      "examples/http-server.json",
      "examples/sse-server.json",
      "examples/stdio-server.json",
      "references/authentication.md",
      "references/server-types.md",
      "references/tool-usage.md",
    ],
  },
};
const STATIC_SKILL_FILES = new Set(Object.entries(SKILL_ASSETS).flatMap(([slug, { agents, files }]) =>
  agents.flatMap((agent) => files.map((file) => `skills/agents/${agent}/${slug}/${file}`))));
const SYSTEM_SCOPES = ['agents/', 'hooks/', 'security/', 'templates/', 'third_party/', 'tools/'];
const POLICIES = new Set(['system', 'data', 'config', 'generated']);
const HASH = /^[a-f0-9]{64}$/;
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const comparePaths = (a, b) => Buffer.compare(Buffer.from(a.path, 'utf8'), Buffer.from(b.path, 'utf8'));

export function validatePath(path) {
  if (typeof path !== 'string' || !path || path !== path.normalize('NFC') || /[\x00-\x1f\x7f\\:<>"|?*]/.test(path)) throw new Error(`Invalid portable path: ${JSON.stringify(path)}`);
  for (const part of path.split('/')) {
    if (!part || part === '.' || part === '..' || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)) throw new Error(`Invalid portable path: ${JSON.stringify(path)}`);
  }
  return path;
}

export function isManagedPath(path) {
  return typeof path === 'string' && (path.startsWith(ROOT) || TOP_FILES.has(path) || /^\.claude\/(agents|rules)\/[^/]+\.md$/.test(path));
}

function isOfficialRoleAsset(path) {
  const match = /^(prompts|skills|mcp|kb)\/agents\/([^/]+)\/(.+)$/.exec(path);
  if (!match || !OFFICIAL_AGENTS.has(match[2])) return false;
  const [, kind, , file] = match;
  if (kind === 'kb') return INITIAL_KB_FILES.has(file);
  if (file === 'index.md') return true;
  if (kind !== 'prompts') return false;
  if (file === 'evals/cases.json') return true;
  const prompt = /^(?:system\/|retry\/|task\/default\.)v?(.+)\.prompt\.md$/.exec(file);
  return Boolean(prompt && VERSION.test(prompt[1]));
}

export function classifyPath(path) {
  validatePath(path);
  if (!isManagedPath(path)) throw new Error(`Unmanaged path: ${path}`);
  if (CONFIG_FILES.has(path)) return 'config';
  if (!path.startsWith(ROOT)) return 'system';
  const local = path.slice(ROOT.length);
  if (RUNTIME_CONFIG.has(local)) return 'config';
  if (GENERATED_FILES.has(local)) return 'generated';
  if (local.split('/').some((part) => ['.runtime', '.cache', '.codegraph', 'node_modules', 'snapshots', 'user', 'runtime'].includes(part)) || local.startsWith('tools/rollback/')) return 'data';
  if (MIXED_SYSTEM_FILES.has(local) || SYSTEM_FILES.has(local) || STATIC_SKILL_FILES.has(local) || isOfficialRoleAsset(local)) return 'system';
  if (/^(memory|project|kb|shared|prompts|skills|mcp|logs|cron)\//.test(local)) return 'data';
  if (/^rule\/(custom|project)\//.test(local)) return 'data';
  if (local.startsWith('rule/') || SYSTEM_SCOPES.some((prefix) => local.startsWith(prefix))) return 'system';
  return 'data';
}

export function canonicalPayload(files) {
  const seen = new Set();
  return [...files].sort(comparePaths).map((file) => {
    validatePath(file.path);
    const key = file.path.toLowerCase();
    if (!isManagedPath(file.path) || seen.has(key)) throw new Error(`Duplicate or unmanaged path: ${file.path}`);
    seen.add(key);
    if (!HASH.test(file.sha256) || !Number.isSafeInteger(file.size) || file.size < 0 || !Number.isInteger(file.mode) || file.mode < 0 || file.mode > 0o777 || !POLICIES.has(file.policy)) throw new Error(`Invalid file metadata: ${file.path}`);
    return `${file.path}\0${file.sha256}\0${file.size}\0${file.mode}\0${file.policy}\n`;
  }).join('');
}

export const computeBuildId = (files) => sha256(Buffer.from(canonicalPayload(files), 'utf8'));

function statOrNull(path) {
  try { return lstatSync(path); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function requireDirectory(path) {
  if (!lstatSync(path).isDirectory()) throw new Error(`Not a plain directory: ${path}`);
}

function readPlainFile(path) {
  const before = lstatSync(path);
  if (!before.isFile() || before.nlink !== 1 || (before.mode & 0o7000)) throw new Error(`Not a plain single-link file: ${path}`);
  const fd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const stat = fstatSync(fd);
    if (stat.dev !== before.dev || stat.ino !== before.ino) throw new Error(`File changed while reading: ${path}`);
    const bytes = readFileSync(fd);
    const after = fstatSync(fd);
    if (stat.size !== bytes.length || after.size !== stat.size || after.mtimeMs !== stat.mtimeMs || after.ctimeMs !== stat.ctimeMs) throw new Error(`File changed while reading: ${path}`);
    return { bytes, mode: stat.mode & 0o777 };
  } finally { closeSync(fd); }
}

function checkPayloadPath(path) {
  validatePath(path);
  const local = path.slice(ROOT.length);
  if (path.startsWith(ROOT) && /^(updater|lab|tools\/release)(\/|$)/.test(local)) throw new Error(`Development source in runtime payload: ${path}`);
  if (path.split('/').some((part) => /^(\.env(?:\..*)?|\.?credentials?(?:\..*)?|\.?secrets?(?:\..*)?|id_rsa|id_ed25519|service-account.*\.json|settings\.local\.json)$/i.test(part) || /\.(pem|key|p12|pfx)$/i.test(part))) throw new Error(`Sensitive file in runtime payload: ${path}`);
}

export function collectFiles(packageRoot) {
  requireDirectory(packageRoot);
  requireDirectory(join(packageRoot, '.claude'));
  requireDirectory(join(packageRoot, ROOT));
  const files = [];
  const seen = new Set();
  let total = 0;
  const visit = (path) => {
    checkPayloadPath(path);
    const key = path.toLowerCase();
    if (seen.has(key)) throw new Error(`Case collision: ${path}`);
    seen.add(key);
    const absolute = join(packageRoot, path);
    const stat = lstatSync(absolute);
    if (stat.isSymbolicLink()) throw new Error(`Symlink in runtime payload: ${path}`);
    if (stat.isDirectory()) {
      for (const name of readdirSync(absolute).sort()) visit(`${path}/${name}`);
    } else {
      if (!stat.isFile() || stat.size > 512 * 1024 ** 2) throw new Error(`Invalid or oversized payload file: ${path}`);
      const { bytes, mode } = readPlainFile(absolute);
      total += bytes.length;
      if (total > 2 * 1024 ** 3 || files.length >= 100000) throw new Error('Runtime payload exceeds updater limits');
      files.push({ path, sha256: sha256(bytes), size: bytes.length, mode, policy: classifyPath(path) });
    }
  };
  visit(ROOT.slice(0, -1));
  for (const path of TOP_FILES) if (statOrNull(join(packageRoot, path))) {
    if (lstatSync(join(packageRoot, path)).isDirectory()) throw new Error(`Managed entry must be a file: ${path}`);
    visit(path);
  }
  for (const directory of ['.claude/agents', '.claude/rules']) {
    if (!statOrNull(join(packageRoot, directory))) continue;
    requireDirectory(join(packageRoot, directory));
    for (const name of readdirSync(join(packageRoot, directory))) if (name.endsWith('.md')) {
      const path = `${directory}/${name}`;
      if (lstatSync(join(packageRoot, path)).isDirectory()) throw new Error(`Adapter must be a file: ${path}`);
      visit(path);
    }
  }
  return files.sort(comparePaths);
}

export function generateManifest({ packageRoot, version }) {
  const root = resolve(packageRoot);
  const files = collectFiles(root);
  const versionPath = `${ROOT}VERSION`;
  if (!files.some((file) => file.path === versionPath)) throw new Error(`Missing system VERSION: ${versionPath}`);
  const packageVersion = readPlainFile(join(root, versionPath)).bytes.toString('utf8').trim();
  const selectedVersion = version ?? packageVersion;
  if (!VERSION.test(selectedVersion) || selectedVersion.split('.').some((part) => Number(part) > 0xffffffff) || selectedVersion !== packageVersion) throw new Error('Version must match system VERSION and use stable x.y.z syntax');
  for (const path of [`${ROOT}MANIFEST.json`, '.claude/manifest.json']) {
    if (files.some((file) => file.path === path)) {
      const metadata = JSON.parse(readPlainFile(join(root, path)).bytes.toString('utf8'));
      if (metadata.version !== selectedVersion) throw new Error(`Version mismatch: ${path}`);
    }
  }
  return { schemaVersion: 1, product: 'CC-RADT', version: selectedVersion, buildId: computeBuildId(files), dataSchema: 1, minimumUpdaterVersion: '0.1.0', files, migrations: [] };
}

const HELP = `Usage: node tools/release/ai-teams-upgrade-manifest.mjs --package <dir> [--version <version>] [--output <external-file>]
Creates upgrade-manifest.json for a claude-subdir package. Existing files are never overwritten.
For a published package, --output MUST point outside that immutable package; the package is only read.
No signature or trust is granted. Unsigned manifests are preview-only until the user explicitly trusts both manifest SHA-256 fingerprints in the external updater.
`;

export function main(args = process.argv.slice(2)) {
  if (args.length === 1 && ['-h', '--help'].includes(args[0])) { process.stdout.write(HELP); return; }
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i];
    if (!['--package', '--version', '--output'].includes(name) || options[name] !== undefined || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Invalid or duplicate argument: ${name}`);
    options[name] = args[i + 1];
  }
  if (!options['--package']) throw new Error('--package is required');
  requireDirectory(resolve(options['--package']));
  const root = realpathSync(resolve(options['--package']));
  const output = resolve(options['--output'] ?? join(root, MANIFEST_NAME));
  const actualOutput = join(realpathSync(dirname(output)), basename(output));
  const inside = relative(root, actualOutput);
  if (options['--output'] && (!inside || (!inside.startsWith(`..${sep}`) && inside !== '..' && !isAbsolute(inside)))) throw new Error('--output sidecar must be outside the package');
  if (statOrNull(actualOutput)) throw new Error(`Output already exists; refusing overwrite: ${actualOutput}`);
  const manifest = generateManifest({ packageRoot: root, version: options['--version'] });
  const bytes = `${JSON.stringify(manifest, null, 2)}\n`;
  if (Buffer.byteLength(bytes) > 8 * 1024 ** 2) throw new Error('Manifest exceeds updater size limit');
  writeFileSync(actualOutput, bytes, { encoding: 'utf8', flag: 'wx', mode: 0o644 });
  process.stdout.write(`${JSON.stringify({ output: actualOutput, files: manifest.files.length, buildId: manifest.buildId, manifestSha256: sha256(bytes), signed: false, trusted: false })}\n`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { main(); }
  catch (error) { process.stderr.write(`生成升级清单失败：${error.message}\n`); process.exitCode = 1; }
}
