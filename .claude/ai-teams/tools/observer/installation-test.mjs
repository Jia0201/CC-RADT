// Read and smoke-test a generated, isolated claude-subdir package; never runs a model.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const project = fs.realpathSync(process.argv[2]);
const root = path.join(project, '.claude', 'ai-teams');
const settings = JSON.parse(fs.readFileSync(path.join(project, '.claude', 'settings.json'), 'utf8'));
const requiredEvents = ['SessionStart', 'SessionEnd', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'PermissionDenied', 'SubagentStart', 'SubagentStop', 'TaskCompleted', 'StopFailure', 'Stop'];
for (const event of requiredEvents) {
  const hooks = settings.hooks[event].flatMap(group => group.hooks).filter(item => item.args?.[0]?.endsWith('/observer-hook.mjs'));
  assert.equal(hooks.length, 1, event + ' must have exactly one observer hook');
  const target = hooks[0].args[0].replace('${CLAUDE_PROJECT_DIR}', project);
  assert.ok(fs.existsSync(target));
  assert.equal(target, path.join(root, 'hooks', 'scripts', 'observer-hook.mjs'));
}
const audit = settings.hooks.SessionStart.flatMap(g => g.hooks).filter(h => h.args?.includes('native-claude-memory-audit'));
assert.equal(audit.length, 1, 'observer must not duplicate existing SessionStart audit');
const privateData = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-radt-install-observer-'));
process.env.AI_TEAMS_OBSERVER_DATA_DIR = privateData;
const runtime = await import(pathToFileURL(path.join(root, 'tools', 'observer', 'runtime.mjs')).href);
const ctx = runtime.context({ root, project });
const hook = path.join(root, 'hooks', 'scripts', 'observer-hook.mjs');
function start(id) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [hook], { cwd: project, env: { ...process.env, AI_TEAMS_ROOT: root, CLAUDE_PROJECT_DIR: project } });
    let stdout = '', stderr = '';
    child.stdout.on('data', x => { stdout += x; }); child.stderr.on('data', x => { stderr += x; });
    child.on('error', reject); child.on('exit', code => { try { assert.equal(code, 0, stderr); resolve(JSON.parse(stdout)); } catch (error) { reject(error); } });
    child.stdin.end(JSON.stringify({ session_id: id, hook_event_name: 'SessionStart', source: 'startup' }));
  });
}
let service;
try {
  const results = await Promise.all([start('installed-test-window-a'), start('installed-test-window-b')]);
  results.forEach(x => assert.match(x.systemMessage, /127\.0\.0\.1/));
  service = await runtime.probe(ctx); assert.ok(service);
  const url = `http://127.0.0.1:${service.port}`;
  const headers = { Authorization: `Bearer ${service.token}` };
  let state;
  for (let i = 0; i < 60; i++) {
    state = await (await fetch(url + '/api/state', { headers })).json();
    if (state.sessions.length === 2) break;
    await runtime.delay(100);
  }
  assert.equal(state.sessions.length, 2);
  assert.equal(state.project.root, project);
  for (const asset of ['/', '/app.js', '/style.css']) assert.equal((await fetch(url + asset)).status, 200);
  console.log(JSON.stringify({ passed: true, packageRoot: project, verifiedHooks: requiredEvents.length, installedSessions: 2, dataOutsidePackage: !ctx.dataDir.startsWith(project + path.sep) }));
} finally {
  service = service || await runtime.probe(ctx);
  if (service) process.kill(service.pid, 'SIGTERM');
}
