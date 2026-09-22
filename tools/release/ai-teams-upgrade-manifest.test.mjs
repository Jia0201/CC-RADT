import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, cpSync, existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { canonicalPayload, classifyPath, computeBuildId, generateManifest, isManagedPath, validatePath } from './ai-teams-upgrade-manifest.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const script = join(repo, 'tools/release/ai-teams-upgrade-manifest.mjs');
const legacy = join(repo, 'tools/bin/ai-teams-upgrade.sh');
const H = '.claude/ai-teams/';
const STATIC_EXAMPLES = [
  'prompts/agents/lead/system/v1.0.0.prompt.md',
  'prompts/agents/lead/system/1.0.1.prompt.md',
  'prompts/agents/doc/task/default.v1.0.0.prompt.md',
  'prompts/agents/qa/retry/v1.0.0.prompt.md',
  'prompts/agents/qa/evals/cases.json',
  'prompts/agents/doc/index.md',
  'skills/agents/lead/triage/SKILL.md',
  'skills/agents/lead/triage/AGENT-BRIEF.md',
  'skills/agents/qa/claude-anthropic-webapp-testing/scripts/with_server.py',
  'skills/agents/memory/claude-session-report-session-report/analyze-sessions.mjs',
  'skills/agents/role/skill-creator/scripts/run_eval.py',
  'skills/agents/dev-frontend-web/vercel-react-best-practices/rules/js-index-maps.md',
  'mcp/shared/index.md', 'mcp/codegraph/tools.md', 'mcp/agents/doc/index.md',
  'kb/agents/doc/01-source-map.md', 'kb/agents/lead/02-engineering-rules.md',
  'kb/shared/index.md', 'shared/supervision/heartbeat.md',
];
const STATIC_CONFIG_EXAMPLES = ['prompts/registry.json', 'skills/registry.json', 'mcp/registry.json', 'mcp/claude-project.mcp.json', 'mcp/optional-servers.mcp.example.json'];
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
function put(root, path, bytes, mode = 0o644) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), bytes);
  chmodSync(join(root, path), mode);
}
function fixture(t, extra = {}) {
  const base = mkdtempSync(join(tmpdir(), 'cc-radt-manifest-'));
  const root = join(base, 'package');
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const payload = {
    [`${H}VERSION`]: '1.1.0\n',
    [`${H}MANIFEST.json`]: '{"version":"1.1.0"}\n',
    [`${H}hooks/start.sh`]: '#!/bin/sh\nexit 0\n',
    [`${H}memory/refresh-rules.md`]: 'official policy\n',
    [`${H}memory/MEMORY.md`]: 'project memory\n',
    [`${H}project/project-profile.md`]: 'user profile\n',
    [`${H}project/graph.md`]: 'generated graph\n',
    [`${H}shared/protocol.md`]: 'official protocol\n',
    [`${H}shared/task-plan.md`]: 'project task\n',
    [`${H}kb/shared/engineering-brain.md`]: 'official knowledge\n',
    [`${H}kb/shared/customer.md`]: 'customer knowledge\n',
    '.claude/manifest.json': '{"version":"1.1.0","file_count":0}\n',
    '.claude/settings.json': '{}\n',
    '.claude/settings.local.example.json': '{}\n',
    '.claude/agents/lead.md': 'official adapter\n',
    '.claude/rules/entry.md': 'official rule adapter\n',
    '.claude/CLAUDE.md': 'managed instructions\n',
    '.mcp.json': '{}\n',
    'CLAUDE.md': 'project instructions\n',
    'README.md': 'business README must stay outside the manifest\n',
    'VERSION': 'business VERSION must not determine the harness version\n',
    'checksums.txt': 'old checksum bytes\n',
    'RELEASE_RECORD.md': 'old release record\n',
    'src/app.js': 'business source\n',
    '.claude/settings.local.json': 'private config never read\n',
    ...extra,
  };
  for (const [path, bytes] of Object.entries(payload)) put(root, path, bytes);
  chmodSync(join(root, H, 'hooks/start.sh'), 0o755);
  return { base, root };
}
function snapshot(root) {
  const result = {};
  const walk = (directory, prefix = '') => {
    for (const name of readdirSync(directory).sort()) {
      const path = prefix ? `${prefix}/${name}` : name;
      const absolute = join(directory, name);
      const stat = lstatSync(absolute);
      result[path] = { mode: stat.mode, mtime: stat.mtimeMs, size: stat.isDirectory() ? 0 : stat.size, hash: stat.isFile() ? hash(readFileSync(absolute)) : stat.isSymbolicLink() ? readlinkSync(absolute) : '' };
      if (stat.isDirectory()) walk(absolute, path);
    }
  };
  walk(root);
  return result;
}
const cli = (args, cwd = repo) => spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });
function runCLI(root, extra = []) {
  const result = cli(['--package', root, ...extra]);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('complete managed scope, fixed schema, system VERSION and permissions', (t) => {
  const { root } = fixture(t);
  const before = snapshot(root);
  const manifest = generateManifest({ packageRoot: root });
  assert.deepEqual(snapshot(root), before);
  assert.deepEqual(Object.keys(manifest), ['schemaVersion', 'product', 'version', 'buildId', 'dataSchema', 'minimumUpdaterVersion', 'files', 'migrations']);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.product, 'CC-RADT');
  assert.equal(manifest.version, '1.1.0');
  assert.equal(manifest.dataSchema, 1);
  assert.equal(manifest.minimumUpdaterVersion, '0.1.0');
  assert.deepEqual(manifest.migrations, []);
  const files = new Map(manifest.files.map((f) => [f.path, f]));
  for (const file of manifest.files) {
    assert.deepEqual(Object.keys(file), ['path', 'sha256', 'size', 'mode', 'policy']);
    assert.equal(file.sha256, hash(readFileSync(join(root, file.path))));
    assert.equal(file.size, lstatSync(join(root, file.path)).size);
  }
  assert.equal(files.get(`${H}VERSION`).policy, 'system');
  assert.equal(files.get(`${H}hooks/start.sh`).mode, 493);
  assert.equal(files.get(`${H}VERSION`).mode, 420);
  for (const path of ['README.md', 'VERSION', 'src/app.js', 'checksums.txt', 'RELEASE_RECORD.md', 'upgrade-manifest.json', '.claude/settings.local.json']) assert.ok(!files.has(path), path);
  for (const path of ['.mcp.json', 'CLAUDE.md', '.claude/CLAUDE.md', '.claude/settings.json']) assert.equal(files.get(path).policy, 'config');
  assert.equal(files.get('.claude/settings.local.example.json').policy, 'system');
  assert.equal(isManagedPath('.claude/agents/nested/custom.md'), false);
});

test('mixed directories use exact system paths and otherwise fail closed', () => {
  for (const path of ['memory/refresh-rules.md', 'memory/retention-policy.md', 'kb/shared/engineering-brain.md', 'shared/protocol.md', 'shared/tasks/TASK_TEMPLATE.md']) assert.equal(classifyPath(H + path), 'system', path);
  for (const path of [
    'memory/MEMORY.md', 'memory/agents/lead/MEMORY.md', 'memory/new.md', 'memory/native-claude-memory-audit.md',
    'memory/archive/refresh-rules.md', 'memory/conversations/index.md', 'memory/conversations/sessions/one.jsonl',
    'project/PROJECT.md', 'project/project-profile.md', 'project/adr/accepted/ADR-0001.md', 'project/index.md', 'project/rules/index.md',
    'kb/shared/new.md', 'kb/shared/TASK_TEMPLATE.md', 'kb/agents/doc/customer-project.md',
    'shared/tasks/one.md', 'shared/protocol.json', 'shared/tasks/NEW_TEMPLATE.md', 'shared/task-plan.md', 'shared/locks/LOCKS.md',
    'shared/supervision/current.md', 'shared/prompt-evolution/history.json', 'shared/prompt-evolution/candidates/one.prompt.md',
    'rule/custom/security/local.md', 'rule/project/backend/api.md', 'skills/shared/local/SKILL.md', 'mcp/shared/local.json',
    'prompts/agents/lead/system/custom.prompt.md', 'logs/events.jsonl', 'tools/observer/.runtime/events.jsonl', 'user/notes.md', 'unknown.md',
  ]) assert.equal(classifyPath(H + path), 'data', path);
  for (const path of ['project/graph.md', 'kb/graph.md', 'index/FILES.md', 'index/PROJECT.md']) assert.equal(classifyPath(H + path), 'generated', path);
  for (const path of ['prompts/registry.json', 'skills/registry.json', 'mcp/registry.json']) assert.equal(classifyPath(H + path), 'config', path);
});

test('known official prompts, exact Skill assets, MCP guides and initial KB use three-way policies', () => {
  for (const path of STATIC_EXAMPLES) assert.equal(classifyPath(H + path), 'system', path);
  for (const path of STATIC_CONFIG_EXAMPLES) assert.equal(classifyPath(H + path), 'config', path);
  for (const path of [
    'prompts/agents/lead/system/custom.prompt.md', 'prompts/agents/local/system/v1.0.0.prompt.md',
    'prompts/agents/lead/system/v01.0.0.prompt.md', 'prompts/agents/lead/evals/results.json',
    'prompts/agents/lead/system/v1.0.0.prompt.md.notes',
    'skills/agents/lead/my-skill/SKILL.md', 'skills/agents/local/triage/SKILL.md',
    'skills/agents/doc/triage/SKILL.md', 'skills/agents/lead/triage/project-notes.md',
    'skills/agents/role/skill-creator/scripts/local.py',
    'skills/agents/role/skill-creator/history.json', 'skills/agents/role/skill-creator/evals/results.json',
    'skills/agents/role/skill-creator/workspace/run/output.md',
    'skills/agents/dev-frontend-web/vercel-react-best-practices/rules/project-rule.md',
    'mcp/shared/private-server.json', 'mcp/shared/local.md', 'mcp/agents/local/index.md',
    'kb/agents/doc/customer-project.md', 'kb/agents/local/01-source-map.md', 'kb/shared/project-lessons.md',
    'project/requirements/customer.md', 'memory/agents/lead/MEMORY.md', 'shared/prompt-evolution/history.json',
  ]) assert.equal(classifyPath(H + path), 'data', path);
});

test('old-layout sidecar uses package paths and frozen rules, not latest registry or source files', (t) => {
  const { root, base } = fixture(t, {
    [`${H}VERSION`]: '1.0.0\n', [`${H}MANIFEST.json`]: '{"version":"1.0.0"}\n',
    '.claude/manifest.json': '{"version":"1.0.0"}\n',
    [`${H}prompts/agents/lead/system/v1.0.0.prompt.md`]: 'old official prompt\n',
    [`${H}skills/agents/lead/triage/SKILL.md`]: 'old official Skill\n',
    [`${H}skills/agents/lead/triage/legacy-unknown.md`]: 'unknown old artifact\n',
    [`${H}skills/agents/lead/private-skill/SKILL.md`]: 'not official\n',
    [`${H}skills/registry.json`]: '{"agents":{"lead":[{"slug":"private-skill","path":"skills/agents/lead/private-skill"}]}}\n',
    [`${H}mcp/shared/index.md`]: 'old portable guide\n',
    [`${H}kb/agents/doc/01-source-map.md`]: 'old official knowledge\n',
  });
  const before = snapshot(root);
  const out = join(base, 'v1.0.0-sidecar.json');
  runCLI(root, ['--output', out]);
  const manifest = JSON.parse(readFileSync(out));
  const byPath = new Map(manifest.files.map((file) => [file.path, file]));
  for (const path of ['prompts/agents/lead/system/v1.0.0.prompt.md', 'skills/agents/lead/triage/SKILL.md', 'mcp/shared/index.md', 'kb/agents/doc/01-source-map.md']) assert.equal(byPath.get(H + path).policy, 'system');
  assert.equal(byPath.get(`${H}skills/agents/lead/private-skill/SKILL.md`).policy, 'data');
  assert.equal(byPath.get(`${H}skills/agents/lead/triage/legacy-unknown.md`).policy, 'data');
  assert.ok(!byPath.has(`${H}prompts/agents/lead/system/1.0.1.prompt.md`));
  assert.deepEqual(snapshot(root), before);
});

test('canonical bytes match Go string ordering, independent of JSON order', () => {
  const a = { path: `${H}VERSION`, sha256: '0'.repeat(64), size: 6, mode: 420, policy: 'system' };
  const b = { policy: 'data', mode: 493, size: 9, sha256: 'f'.repeat(64), path: `${H}project/中文.md` };
  const expected = `${a.path}\0${a.sha256}\0${a.size}\0${a.mode}\0${a.policy}\n${b.path}\0${b.sha256}\0${b.size}\0${b.mode}\0${b.policy}\n`;
  assert.equal(canonicalPayload([b, a]), expected);
  assert.equal(computeBuildId([b, a]), hash(Buffer.from(expected, 'utf8')));
  assert.equal(computeBuildId([a, b]), computeBuildId([b, a]));
  for (const change of [{ mode: 493 }, { size: 7 }, { policy: 'data' }, { sha256: 'f'.repeat(64) }]) assert.notEqual(computeBuildId([{ ...a, ...change }, b]), computeBuildId([a, b]));
  const unicode = ['\u{10000}', '\ue000'].map((name) => ({ ...a, path: `${H}project/${name}.md` }));
  assert.ok(canonicalPayload(unicode).startsWith(`${H}project/\ue000.md`));
  assert.throws(() => computeBuildId([a, a]), /Duplicate/);
  assert.throws(() => computeBuildId([{ ...a, mode: 0o100644 }]), /metadata/);
});

test('new package manifest excludes itself and repeated sidecars are byte-identical', (t) => {
  const { base, root } = fixture(t, { [`${H}project/中文 空格.md`]: '中文数据\n' });
  const result = runCLI(root);
  assert.equal(result.signed, false);
  assert.equal(result.trusted, false);
  const bytes = readFileSync(join(root, 'upgrade-manifest.json'));
  assert.equal(result.manifestSha256, hash(bytes));
  const before = snapshot(root);
  const sidecar = join(base, 'old-sidecar.json');
  runCLI(root, ['--output', sidecar, '--version', '1.1.0']);
  assert.deepEqual(readFileSync(sidecar), bytes);
  assert.deepEqual(snapshot(root), before);
  const overwrite = cli(['--package', root]);
  assert.notEqual(overwrite.status, 0);
  assert.match(overwrite.stderr, /refusing overwrite/);
  assert.deepEqual(snapshot(root), before);
});

test('external sidecar leaves immutable package bytes, modes and mtimes unchanged', (t) => {
  const { base, root } = fixture(t);
  const before = snapshot(root);
  const out = join(base, 'external.json');
  runCLI(root, ['--output', out]);
  assert.deepEqual(snapshot(root), before);
  assert.equal(existsSync(join(root, 'upgrade-manifest.json')), false);
  const outBefore = readFileSync(out);
  assert.notEqual(cli(['--package', root, '--output', out]).status, 0);
  assert.deepEqual(readFileSync(out), outBefore);
  for (const output of [join(root, 'metadata.json'), join(root, H, 'metadata.json')]) {
    const result = cli(['--package', root, '--output', output]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /outside the package/);
  }
  symlinkSync(root, join(base, 'alias'));
  assert.notEqual(cli(['--package', root, '--output', join(base, 'alias/sidecar.json')]).status, 0);
  assert.deepEqual(snapshot(root), before);
});

test('invalid arguments, missing output parent and failed validation create no output', (t) => {
  const { root, base } = fixture(t);
  const before = snapshot(root);
  for (const args of [[], ['--package'], ['--package', root, '--version'], ['--package', root, '--package', root], ['--package', root, '--force'], ['--package', root, '--migrations', 'anything'], ['--package', root, '--version', '2.0.0'], ['--package', root, '--output', join(base, 'missing/out.json')]]) assert.notEqual(cli(args).status, 0, JSON.stringify(args));
  assert.equal(cli(['--help'], base).status, 0);
  assert.deepEqual(snapshot(root), before);
  assert.equal(existsSync(join(base, 'missing')), false);
});

test('versions are stable, internally consistent and never inferred from business root', (t) => {
  const { root } = fixture(t);
  assert.throws(() => generateManifest({ packageRoot: root, version: '1.1.0-rc.1' }), /Version/);
  put(root, '.claude/manifest.json', '{"version":"1.0.0"}');
  assert.throws(() => generateManifest({ packageRoot: root }), /Version mismatch/);
  rmSync(join(root, H, 'VERSION'));
  assert.throws(() => generateManifest({ packageRoot: root }), /Missing system VERSION/);
});

test('portable path validation rejects traversal, reserved names and normalization collisions', () => {
  for (const path of ['/absolute', '../outside', '.claude/ai-teams/../outside', 'C:/drive', 'a\\b', 'a//b', 'a/./b', 'a/NUL.txt', 'a/COM1', 'a/trailing.', 'a/trailing ', 'a/tab\t.md', 'a/new\nline', 'a/zero\0', 'a/e\u0301.md', 'a/colon:stream']) assert.throws(() => validatePath(path), /Invalid portable path/, path);
});

for (const name of ['.env', '.env.local', 'secret.pem', 'private.key', 'credentials.json', 'secrets.json', 'settings.local.json', 'id_rsa', 'service-account-prod.json']) {
  test(`sensitive payload rejected: ${name}`, (t) => {
    const { root } = fixture(t, { [`${H}project/${name}`]: 'not to be packaged' });
    const before = snapshot(root);
    assert.throws(() => generateManifest({ packageRoot: root }), /Sensitive/);
    assert.deepEqual(snapshot(root), before);
  });
}

for (const directory of ['updater', 'lab', 'tools/release']) {
  test(`development-only content rejected in runtime: ${directory}`, (t) => {
    const { root } = fixture(t, { [`${H}${directory}/source.txt`]: 'development source' });
    assert.throws(() => generateManifest({ packageRoot: root }), /Development source/);
  });
}

test('symlink payload, symlink adapter parent and hardlink payload are rejected', (t) => {
  const { root, base } = fixture(t);
  const link = join(root, H, 'memory/link.md');
  symlinkSync(join(root, H, 'VERSION'), link);
  assert.throws(() => generateManifest({ packageRoot: root }), /Symlink/);
  rmSync(link);
  linkSync(join(root, H, 'VERSION'), link);
  assert.throws(() => generateManifest({ packageRoot: root }), /single-link/);
  rmSync(link);
  rmSync(join(root, '.claude/agents'), { recursive: true });
  mkdirSync(join(base, 'agents'));
  symlinkSync(join(base, 'agents'), join(root, '.claude/agents'));
  assert.throws(() => generateManifest({ packageRoot: root }), /plain directory/);
});

test('case collisions fail independently of host case sensitivity', (t) => {
  const { root } = fixture(t);
  const a = { path: `${H}memory/A.md`, sha256: '0'.repeat(64), size: 0, mode: 420, policy: 'data' };
  assert.throws(() => computeBuildId([a, { ...a, path: `${H}memory/a.md` }]), /Duplicate/);
  put(root, `${H}Case/a.md`, 'one');
  put(root, `${H}case/b.md`, 'two');
  if (readdirSync(join(root, H)).includes('case') && readdirSync(join(root, H)).includes('Case')) assert.throws(() => generateManifest({ packageRoot: root }), /Case collision/);
});

test('retired shell help, malformed arguments, dry-run and apply perform zero writes', (t) => {
  const { base, root } = fixture(t);
  const standalone = join(base, 'retired.sh');
  cpSync(legacy, standalone);
  const before = snapshot(base);
  for (const args of [[], ['--help'], ['-h'], ['--bad'], ['--package'], ['--apply'], ['--dry-run'], ['--package', root, '--apply'], ['--help', '--apply']]) {
    const run = spawnSync('bash', [standalone, ...args], { cwd: base, encoding: 'utf8' });
    assert.equal(run.status, args.length === 1 && ['--help', '-h'].includes(args[0]) ? 0 : 2);
    assert.match(run.stdout, /工程内升级脚本已停用/);
    assert.match(run.stdout, /外部升级器/);
    assert.deepEqual(snapshot(base), before, JSON.stringify(args));
  }
});

test('formal metadata endpoint counts manifest once and hashes frozen payload', (t) => {
  const { root } = fixture(t);
  rmSync(join(root, 'RELEASE_RECORD.md'));
  const source = readFileSync(join(repo, 'tools/bin/ai-teams-package.sh'), 'utf8');
  assert.match(source, /--exclude "\/updater\/"/);
  assert.match(source, /--exclude "\/upgrade-manifest.json"/);
  const start = source.indexOf('# Reserve only distribution metadata');
  const end = source.indexOf('\nai_teams_display_path()', start);
  assert.ok(start > 0 && end > start);
  const endpoint = source.slice(start, end);
  assert.ok(endpoint.indexOf('manifest.write_text') < endpoint.indexOf('node tools/release/ai-teams-upgrade-manifest.mjs'));
  assert.match(endpoint.trimEnd(), /ai_teams_checksum_tree "\$artifact_root" "\$checksum"$/);
  // Exercise the real final metadata commands, not the full package/release flow.
  const shell = `set -euo pipefail\nsource tools/bin/ai-teams-lib.sh\nsanitize_formal_user_text() { :; }\nassert_formal_portable_paths() { :; }\n${endpoint}`;
  execFileSync('bash', ['-c', shell], { cwd: repo, env: { ...process.env, artifact_root: root, package_manifest: join(root, '.claude/manifest.json'), checksum: join(root, 'checksums.txt'), edition: 'formal', install_layout: 'claude-subdir', version: '1.1.0', release_base: '' }, stdio: 'pipe' });
  const files = Object.keys(snapshot(root)).filter((path) => lstatSync(join(root, path)).isFile());
  assert.equal(JSON.parse(readFileSync(join(root, '.claude/manifest.json'))).file_count, files.length);
  assert.match(readFileSync(join(root, 'RELEASE_RECORD.md'), 'utf8'), new RegExp(`安装包文件数量：${files.length}\\n`));
  const manifest = JSON.parse(readFileSync(join(root, 'upgrade-manifest.json')));
  assert.deepEqual(manifest, generateManifest({ packageRoot: root }));
  const checksums = readFileSync(join(root, 'checksums.txt'), 'utf8');
  assert.ok(checksums.includes(`${hash(readFileSync(join(root, 'upgrade-manifest.json')))}  ./upgrade-manifest.json`));
  execFileSync('shasum', ['-a', '256', '-c', 'checksums.txt'], { cwd: root, stdio: 'pipe' });
});

test('optional Go CLI accepts Node canonical and sidecars in zero-write plan', { skip: !process.env.CC_RADT_UPDATER_BIN }, (t) => {
  const { base, root: next } = fixture(t);
  const old = join(base, 'old');
  const project = join(base, 'project');
  cpSync(next, old, { recursive: true });
  put(old, `${H}VERSION`, '1.0.0\n');
  put(old, `${H}MANIFEST.json`, '{"version":"1.0.0"}\n');
  put(old, '.claude/manifest.json', '{"version":"1.0.0","file_count":0}\n');
  cpSync(old, project, { recursive: true });
  put(project, `${H}memory/MEMORY.md`, 'long-used local data\n');
  const oldSidecar = join(base, 'old.json');
  const nextSidecar = join(base, 'next.json');
  runCLI(old, ['--output', oldSidecar]);
  runCLI(next, ['--output', nextSidecar]);
  const before = snapshot(base);
  const result = spawnSync(process.env.CC_RADT_UPDATER_BIN, ['plan', '--project', project, '--baseline', old, '--package', next, '--baseline-manifest', oldSidecar, '--package-manifest', nextSidecar], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.fromVersion, '1.0.0');
  assert.equal(plan.toVersion, '1.1.0');
  assert.equal(plan.baselineDigest, hash(readFileSync(oldSidecar)));
  assert.equal(plan.targetDigest, hash(readFileSync(nextSidecar)));
  assert.deepEqual(snapshot(base), before);
});

test('optional Go planner updates pristine static assets, blocks dual edits and preserves local-only evolution', { skip: !process.env.CC_RADT_UPDATER_BIN }, (t) => {
  const staticPaths = [...STATIC_EXAMPLES, ...STATIC_CONFIG_EXAMPLES];
  const content = (path, value) => path.endsWith('.json') ? `${JSON.stringify({ value })}\n` : `${value}\n`;
  const { base, root: next } = fixture(t, Object.fromEntries(staticPaths.map((path) => [H + path, content(path, 'official-old')])));
  const old = join(base, 'old');
  const project = join(base, 'project');
  cpSync(next, old, { recursive: true });
  put(old, `${H}VERSION`, '1.0.0\n');
  put(old, `${H}MANIFEST.json`, '{"version":"1.0.0"}\n');
  put(old, '.claude/manifest.json', '{"version":"1.0.0","file_count":0}\n');
  cpSync(old, project, { recursive: true });
  const localPaths = ['memory/MEMORY.md', 'skills/agents/lead/private-skill/SKILL.md', 'skills/agents/lead/triage/project-notes.md', 'shared/prompt-evolution/history.json'];
  for (const path of localPaths) put(project, H + path, content(path, 'local-data'));
  for (const path of staticPaths) put(next, H + path, content(path, 'official-new'));
  const oldSidecar = join(base, 'baseline.json');
  runCLI(old, ['--output', oldSidecar]);
  const plan = (name) => {
    const targetSidecar = join(base, `${name}.json`);
    runCLI(next, ['--output', targetSidecar]);
    const before = snapshot(base);
    const result = spawnSync(process.env.CC_RADT_UPDATER_BIN, ['plan', '--project', project, '--baseline', old, '--package', next, '--baseline-manifest', oldSidecar, '--package-manifest', targetSidecar], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(snapshot(base), before);
    return JSON.parse(result.stdout);
  };
  const pristine = plan('pristine');
  assert.equal(pristine.ready, true, JSON.stringify(pristine.conflicts));
  for (const path of staticPaths) assert.ok(pristine.actions.some((action) => action.path === H + path && action.kind === 'replace'), path);
  for (const path of localPaths) assert.ok(!pristine.actions.some((action) => action.path === H + path), path);
  const evolved = ['prompts/agents/lead/system/v1.0.0.prompt.md', 'skills/agents/lead/triage/SKILL.md', 'kb/agents/doc/01-source-map.md'];
  for (const path of evolved) put(project, H + path, content(path, 'local-evolution'));
  const conflict = plan('dual-edits');
  assert.equal(conflict.ready, false);
  for (const path of evolved) assert.ok(conflict.conflicts.some((item) => item.path === H + path), path);
  for (const path of evolved) put(next, H + path, content(path, 'official-old'));
  const localOnly = plan('local-only');
  assert.equal(localOnly.ready, true, JSON.stringify(localOnly.conflicts));
  for (const path of evolved) assert.ok(!localOnly.actions.some((action) => action.path === H + path), path);
});
