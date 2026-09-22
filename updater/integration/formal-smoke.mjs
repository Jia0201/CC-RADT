import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { constants, chmodSync, copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { generateManifest } from '../../tools/release/ai-teams-upgrade-manifest.mjs';

// This test never installs into either input package. All mutations are scoped
// to an exclusive fixture directory retained for inspection after the test.
const [binaryArg, baselineArg, targetArg, parentArg] = process.argv.slice(2);
if (!binaryArg || !baselineArg || !targetArg || !parentArg) {
  throw new Error('Usage: node updater/integration/formal-smoke.mjs BINARY OLD_PACKAGE NEW_PACKAGE EXISTING_ARTIFACT_PARENT');
}
const [binary, baseline, target, parent] = [binaryArg, baselineArg, targetArg, parentArg].map(value => resolve(value));
const work = mkdtempSync(join(parent, 'formal-smoke-'));
const h = '.claude/ai-teams';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const baseManifest = generateManifest({ packageRoot: baseline });
const nextManifest = generateManifest({ packageRoot: target });
const hadManifests = [baseline, target].map(root => existsSync(join(root, 'upgrade-manifest.json')));
const baselineManifest = join(work, 'baseline-sidecar.json');
const packageManifest = join(work, 'target-sidecar.json');
for (const [file, data] of [[baselineManifest, baseManifest], [packageManifest, nextManifest]]) {
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
}
const put = (root, file, text) => {
  const path = join(root, file);
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, text, { mode: 0o600 });
};
function makeProject(name) {
  const project = join(work, name);
  mkdirSync(project, { mode: 0o700 });
  for (const f of baseManifest.files) {
    const dst = join(project, f.path);
    mkdirSync(dirname(dst), { recursive: true, mode: 0o700 });
    copyFileSync(join(baseline, f.path), dst, constants.COPYFILE_EXCL);
    chmodSync(dst, f.mode);
  }
  put(project, `${h}/memory/MEMORY.md`, 'fixture: 多年共享记忆，不得重置\n');
  put(project, `${h}/project/fixture-project.md`, 'fixture: 用户接口与项目资料\n');
  put(project, `${h}/shared/tasks/fixture-task.md`, 'fixture: 历史任务\n');
  put(project, `${h}/skills/local-fixture/SKILL.md`, 'fixture: 本地自定义 Skill\n');
  put(project, '.claude/settings.local.json', '{"env":{"LOCAL_FIXTURE":"keep"}}\n');
  put(project, 'src/business.txt', 'fixture: 业务代码\n');
  const config = JSON.parse(readFileSync(join(project, '.claude/settings.json'), 'utf8'));
  config.env = { ...config.env, CC_RADT_SMOKE_SENTINEL: 'local-preserved' };
  put(project, '.claude/settings.json', JSON.stringify(config, null, 2) + '\n');
  return project;
}
function snapshot(root) {
  const out = {};
  function walk(path, rel) {
    for (const name of readdirSync(path).sort()) {
      const sub = rel ? `${rel}/${name}` : name;
      const file = join(path, name);
      const st = lstatSync(file);
      if (st.isDirectory()) walk(file, sub);
      else {
        assert.ok(st.isFile(), `Unexpected special fixture file ${sub}`);
        out[sub] = { sha256: hash(readFileSync(file)), mode: st.mode & 0o777 };
      }
    }
  }
  walk(root, '');
  return out;
}
function cli(command, project, extra = []) {
  return JSON.parse(execFileSync(binary, [command, '--project', project, '--baseline', baseline, '--package', target,
    '--baseline-manifest', baselineManifest, '--package-manifest', packageManifest, ...extra],
  { encoding: 'utf8', timeout: 600000, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }));
}
const project = makeProject('project 中文 with spaces');
const before = snapshot(project);
const plan = cli('plan', project);
assert.deepEqual(snapshot(project), before, 'Preview changed the installation');
assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
let done;
try {
  done = cli('apply', project, ['--stopped', '--trust-baseline', plan.baselineDigest, '--trust-target', plan.targetDigest]);
} catch (error) {
  const status = JSON.parse(error.stdout || '{}');
  const unchanged = JSON.stringify(snapshot(project)) === JSON.stringify(before);
  writeFileSync(join(work, 'failure.json'), JSON.stringify({ project, beforeSwitchUnchanged: unchanged, status }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  throw new Error(`Fixture upgrade stopped: ${status.error || error.message}; evidence retained at ${work}`);
}
assert.equal(done.state, 'complete');
assert.ok(isAbsolute(done.transaction));
assert.equal(readFileSync(join(project, h, 'VERSION'), 'utf8').trim(), nextManifest.version);
const after = snapshot(project);
for (const name of [`${h}/memory/MEMORY.md`, `${h}/project/fixture-project.md`, `${h}/shared/tasks/fixture-task.md`, `${h}/skills/local-fixture/SKILL.md`, '.claude/settings.local.json', 'src/business.txt']) {
  assert.deepEqual(after[name], before[name], `Lost local data ${name}`);
}
assert.equal(JSON.parse(readFileSync(join(project, '.claude/settings.json'), 'utf8')).env.CC_RADT_SMOKE_SENTINEL, 'local-preserved');
const conflictProject = makeProject('conflict-project');
const changed = plan.actions.find(a => a.kind === 'replace' && a.path.endsWith('.md') && nextManifest.files.find(f => f.path === a.path)?.policy === 'system');
assert.ok(changed, 'Expected an upstream Markdown system change in this release pair');
put(conflictProject, changed.path, 'fixture: 用户已修改同一个官方文件，禁止覆盖\n');
const conflictBefore = snapshot(conflictProject);
const blocked = cli('plan', conflictProject);
assert.equal(blocked.ready, false);
assert.ok(blocked.conflicts.some(c => c.path === changed.path));
assert.deepEqual(snapshot(conflictProject), conflictBefore);
assert.deepEqual([baseline, target].map(root => existsSync(join(root, 'upgrade-manifest.json'))), hadManifests);
assert.deepEqual(generateManifest({ packageRoot: baseline }), baseManifest, 'Original baseline package changed');
assert.deepEqual(generateManifest({ packageRoot: target }), nextManifest, 'Original target package changed');
const result = { work, project, transaction: done.transaction, fromVersion: plan.fromVersion, toVersion: plan.toVersion,
  baselineDigest: plan.baselineDigest, targetDigest: plan.targetDigest, actions: plan.actions.length, preserved: plan.preserved,
  protectedFixtureFiles: 6, conflictBlocked: changed.path, originalPackagesUnchanged: true };
writeFileSync(join(work, 'result.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify(result, null, 2));
