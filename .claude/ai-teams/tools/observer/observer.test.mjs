import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { context, recordHook, redact, sensitive, initStorage, probe, ensureService, delay, MODULE_ROOT } from './runtime.mjs';
import { Collector, safeRead, RETENTION } from './collector.mjs';

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-radt-observer-test-'));
const root = path.join(fixture, 'project with spaces');
const runtime = path.join(fixture, 'private-runtime');
fs.mkdirSync(root);
process.env.AI_TEAMS_OBSERVER_DATA_DIR = runtime;
const ctx = context({ root, project: root });
const hook = path.resolve(MODULE_ROOT, '../../hooks/scripts/observer-hook.mjs');

function write(relative, value) { const file = path.join(root, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); }
write('shared/task-plan.md', '# Tasks\n| 当前无活动任务 | TODO |');
write('shared/pipeline-status.md', '# Roles\n| qa | idle |');
write('shared/supervision/heartbeat-current.md', '# Heartbeat\n未运行');
write('shared/events/EVENT_TEMPLATE.md', '# Not a real event');
write('shared/tasks/TASK_TEMPLATE.md', '# Not a real task');
write('shared/tasks/T-001.md', '---\nid: T-001\nstatus: REVIEW\n---\n# Export\n');
write('logs/task/one.md', '# Log\npassword=secret-password\n<img src=x onerror=alert(1)>');
write('logs/task/.env', 'DO_NOT_READ_PRIVATE_FILE=true');
write('agents/qa/qa.md', '# QA definition');

function runHook(data, override = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [hook], { env: { ...process.env, AI_TEAMS_ROOT: root, CLAUDE_PROJECT_DIR: root, ...override }, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('exit', code => resolve({ code, stdout, stderr }));
    child.stdin.end(typeof data === 'string' ? data : JSON.stringify(data));
  });
}
async function until(fn) {
  for (let i = 0; i < 80; i++) { const result = await fn(); if (result) return result; await delay(100); }
  throw new Error('condition timed out');
}
async function get(service, route, options = {}) {
  return fetch(`http://127.0.0.1:${service.port}${route}`, { ...options, headers: { Authorization: `Bearer ${service.token}`, ...options.headers } });
}
const tree = () => { const out = {}; function walk(dir) { for (const item of fs.readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, item.name); if (item.isDirectory()) walk(f); else if (item.isFile()) out[path.relative(root, f)] = fs.readFileSync(f, 'utf8'); } } walk(root); return out; };

test('observer read-only integration and multi-session contract', { timeout: 35000 }, async t => {
  let service;
  const original = tree();
  try {
    await t.test('six parallel CC starts share one verified observer and print one link per session', async () => {
      const starts = await Promise.all(Array.from({ length: 6 }, (_, i) => runHook({ session_id: `session-${i}`, hook_event_name: 'SessionStart', source: 'startup' })));
      starts.forEach(result => { assert.equal(result.code, 0); const output = JSON.parse(result.stdout); assert.match(output.systemMessage, /127\.0\.0\.1/); assert.equal(output.hookSpecificOutput.hookEventName, 'SessionStart'); assert.equal(output.decision, undefined); });
      const ports = starts.map(result => JSON.parse(result.stdout).systemMessage.match(/127\.0\.0\.1:(\d+)/)[1]);
      assert.equal(new Set(ports).size, 1);
      service = await probe(ctx);
      assert.ok(service);
    });
    await t.test('same session duplicate startup and compact do not print again', async () => {
      const duplicates = await Promise.all(['resume', 'compact'].map(source => runHook({ session_id: 'session-0', hook_event_name: 'SessionStart', source })));
      duplicates.forEach(result => { assert.equal(result.code, 0); assert.equal(result.stdout, ''); });
      assert.equal((await probe(ctx)).instanceId, service.instanceId);
    });
    await t.test('different project roots do not share service, storage or credentials', async () => {
      const secondRoot = path.join(fixture, 'another-project'); fs.mkdirSync(secondRoot);
      const other = context({ root, project: secondRoot });
      let separate;
      try {
        recordHook(other, { session_id: 'session-0', hook_event_name: 'SessionStart', source: 'startup' });
        separate = await ensureService(other);
        assert.notEqual(other.projectId, ctx.projectId);
        assert.notEqual(separate.port, service.port);
        const view = await until(async () => { const value = await (await get(separate, '/api/state')).json(); return value.sessions.length ? value : null; });
        assert.equal(view.sessions.length, 1);
        assert.equal(view.project.root, fs.realpathSync(secondRoot));
        assert.equal((await get(separate, '/api/state', { headers: { Authorization: `Bearer ${service.token}` } })).status, 401);
      } finally { if (separate) process.kill(separate.pid, 'SIGTERM'); }
    });
    await t.test('tool events preserve session and agent namespaces; never persist prompt or commands', async () => {
      await Promise.all([0, 1].map(i => runHook({ session_id: `session-${i}`, hook_event_name: 'PostToolUse', tool_name: 'Bash', agent_id: 'same-agent', agent_type: 'qa', prompt: 'PRIVATE_CHAT_DO_NOT_STORE', tool_input: { command: 'SECRET_SHELL_COMMAND', task_id: `task-${i}` }, tool_response: 'PRIVATE_RESPONSE_DO_NOT_STORE' })));
      const state = await until(async () => { const s = await (await get(service, '/api/state')).json(); return s.agents.length === 2 ? s : null; });
      assert.equal(state.sessions.length, 6);
      const scoped = await (await get(service, '/api/state?session=session-0')).json();
      assert.ok(scoped.events.every(e => e.sessionId === 'session-0'));
      assert.equal(scoped.agents.length, 1);
      const persisted = fs.readdirSync(path.join(ctx.dataDir, 'events')).map(name => fs.readFileSync(path.join(ctx.dataDir, 'events', name), 'utf8')).join('');
      assert.doesNotMatch(persisted, /PRIVATE_CHAT|SECRET_SHELL|PRIVATE_RESPONSE/);
    });
    await t.test('session end does not stop server or close other sessions; Stop is not SessionEnd', async () => {
      await runHook({ session_id: 'session-0', hook_event_name: 'SessionEnd', reason: 'prompt_input_exit' });
      await runHook({ session_id: 'session-1', hook_event_name: 'Stop' });
      const state = await until(async () => { const s = await (await get(service, '/api/state')).json(); return s.sessions.find(x => x.id === 'session-0')?.ended ? s : null; });
      assert.equal(state.sessions.find(x => x.id === 'session-1').ended, false);
      assert.ok(await probe(ctx));
    });
    await t.test('browser API is authenticated, same-origin, and has no mutation endpoints', async () => {
      assert.equal((await fetch(`http://127.0.0.1:${service.port}/api/state`)).status, 401);
      assert.equal((await get(service, '/api/state', { headers: { Origin: 'https://untrusted.invalid' } })).status, 403);
      for (const route of ['/api/execute', '/api/stop', '/api/config', '/api/reviews']) assert.equal((await get(service, route, { method: 'POST' })).status, 405);
      assert.equal((await get(service, '/api/evidence/..%2F..%2F.env')).status, 404);
      const response = await get(service, '/');
      assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    });
    await t.test('sources are read-only, templates excluded, sensitive files not ingested, content redacted', async () => {
      const state = await (await get(service, '/api/state')).json();
      assert.ok(state.sources.some(x => x.source === 'shared/tasks/T-001.md'));
      assert.ok(!state.sources.some(x => /TEMPLATE|\.env/.test(x.source)));
      const log = state.sources.find(x => x.source === 'logs/task/one.md');
      const evidence = await (await get(service, '/api/evidence/' + log.id)).json();
      assert.doesNotMatch(evidence.content, /secret-password/);
      assert.match(evidence.content, /已隐藏/);
      assert.deepEqual(tree(), original);
    });
    await t.test('shutdown and restart refreshes access link without losing session history', async () => {
      const previousId = service.instanceId;
      process.kill(service.pid, 'SIGTERM');
      await until(async () => !(await probe(ctx)));
      const resumed = await runHook({ session_id: 'session-0', hook_event_name: 'SessionStart', source: 'resume' });
      assert.match(JSON.parse(resumed.stdout).systemMessage, /127\.0\.0\.1/);
      service = await probe(ctx);
      assert.notEqual(service.instanceId, previousId);
      const state = await until(async () => { const value = await (await get(service, '/api/state')).json(); return value.sessions.find(x => x.id === 'session-0')?.ended === false ? value : null; });
      assert.equal(state.sessions.length, 6);
    });
    await t.test('disabled or malformed hook is fail-open and quiet', async () => {
      assert.equal((await runHook('not-json')).code, 0);
      const off = await runHook({ session_id: 'disabled', hook_event_name: 'SessionStart' }, { AI_TEAMS_OBSERVER: '0' });
      assert.equal(off.stdout, ''); assert.equal(off.code, 0);
      const bad = await runHook({ session_id: 'bad-root', hook_event_name: 'SessionStart' }, { AI_TEAMS_ROOT: path.join(fixture, 'missing') });
      assert.equal(bad.code, 0); assert.equal(JSON.parse(bad.stdout).decision, undefined);
    });
  } finally {
    service = await probe(ctx);
    if (service) { process.kill(service.pid, 'SIGTERM'); await until(async () => !(await probe(ctx))); }
  }
});

test('source versions, redaction, traversal and bounded retention', () => {
  assert.ok(sensitive('shared/.env.production'));
  assert.throws(() => safeRead(root, '../outside.md'));
  assert.throws(() => safeRead(root, 'logs/task/.env'));
  assert.doesNotMatch(redact('-----BEGIN PRIVATE KEY-----\nPRIVATE_BODY_WITHOUT_END'), /PRIVATE_BODY/);
  const redactStarted = performance.now();
  redact('x'.repeat(RETENTION.fileBytes));
  assert.ok(performance.now() - redactStarted < 1000, 'long log lines must not cause quadratic redaction work');
  initStorage(ctx);
  const c = new Collector(ctx); c.scan();
  const old = c.sources.get('shared/tasks/T-001.md');
  write('shared/tasks/T-001.md', '# A changed task\nREVIEW'); c.scan();
  const next = c.sources.get('shared/tasks/T-001.md');
  assert.notEqual(next.version, old.version);
  assert.equal(next.previousVersion, old.version);
  assert.equal(next.kind, 'snapshot'); assert.equal(next.occurredAt, null);
  assert.ok(c.snapshots.some(item => item.version === old.version));
  write('logs/task/large.md', 'x'.repeat(RETENTION.fileBytes + 100)); c.scan();
  assert.equal(c.sources.get('logs/task/large.md').truncated, true);
  if (process.platform !== 'win32') {
    fs.symlinkSync(path.join(fixture, 'private-runtime'), path.join(root, 'logs', 'linked'));
    assert.throws(() => safeRead(root, 'logs/linked/' + ctx.projectId + '/service.log'));
    c.scan(); assert.ok(![...c.sources.keys()].some(file => file.includes('linked/')));
  }
  recordHook(ctx, { session_id: 'same-name', hook_event_name: 'PostToolUse', tool_name: 'Read', tool_input: { file_path: '.env' } });
  c.scan(); assert.equal(c.events.find(e => e.sessionId === 'same-name').target, '[敏感路径]');
  console.log('Isolated test evidence retained:', fixture);
});
