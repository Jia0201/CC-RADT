import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const VERSION = 1;
export const MODULE_ROOT = path.dirname(fileURLToPath(import.meta.url));
export const HARNESS_ROOT = path.resolve(MODULE_ROOT, '../..');
export const hash = value => createHash('sha256').update(String(value)).digest('hex');
export const inside = (root, file) => file === root || (!path.relative(root, file).startsWith('..' + path.sep) && path.relative(root, file) !== '..' && !path.isAbsolute(path.relative(root, file)));
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
export const readJSON = file => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
export const label = (value, limit = 140) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, limit);

export function sensitive(file) {
  return String(file).replaceAll('\\', '/').split('/').some(part => /^(?:\.env(?:\..*)?|\.?(?:credentials?|secrets?|tokens?)(?:\..*)?|id_rsa|id_ed25519|service-account.*\.json)$/i.test(part) || /\.(pem|key|p12|pfx)$/i.test(part) || ['.ssh', '.gnupg', 'node_modules', '.git'].includes(part));
}

export function redact(text) {
  return String(text)
    .replace(/-----BEGIN [^-]*(?:PRIVATE KEY|CERTIFICATE)-----[\s\S]*?(?:-----END [^-]+-----|$)/g, '[敏感内容已隐藏]')
    .replace(/\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{16,}|github_pat_[A-Za-z0-9_]+|AKIA[A-Z0-9]{16})\b/g, '[凭据已隐藏]')
    .replace(/\bBearer\s+[^\s"'<>]+/gi, 'Bearer [已隐藏]')
    .replace(/((?:\b[\w.-]{0,48}(?:api[-_]?key|access[-_]?key|token|secret|password|passwd|authorization|credential)[\w.-]{0,32})["']?\s*[:=]\s*)(?:"[^"\n]*"|'[^'\n]*'|[^\s,;\n]+)/gi, '$1[已隐藏]')
    .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/g, '$1[凭据已隐藏]@');
}

export function context(options = {}) {
  const root = fs.realpathSync(options.root || process.env.AI_TEAMS_ROOT || HARNESS_ROOT);
  const installed = path.basename(root) === 'ai-teams' && path.basename(path.dirname(root)) === '.claude';
  const project = fs.realpathSync(options.project || process.env.CLAUDE_PROJECT_DIR || (installed ? path.resolve(root, '../..') : root));
  const projectId = hash(root + '\0' + project).slice(0, 24);
  const base = process.env.AI_TEAMS_OBSERVER_DATA_DIR || (process.platform === 'win32'
    ? path.join(process.env.LOCALAPPDATA || os.homedir(), 'CC-RADT', 'observer')
    : process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support', 'CC-RADT', 'observer')
      : path.join(process.env.XDG_STATE_HOME || path.join(os.homedir(), '.local', 'state'), 'cc-radt', 'observer'));
  const dataDir = path.resolve(base, projectId);
  // Runtime history must never make its own project dirty or enter a formal package.
  let ancestor = dataDir;
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  const resolvedData = path.resolve(fs.realpathSync(ancestor), path.relative(ancestor, dataDir));
  if (inside(root, resolvedData) || inside(project, resolvedData)) throw new Error('观察器数据目录必须位于项目和 Harness 之外');
  return { root, project, projectId, dataDir: resolvedData, name: label(path.basename(project)) };
}

export function initStorage(ctx) {
  for (const name of ['', 'events', 'notices', 'snapshots']) fs.mkdirSync(path.join(ctx.dataDir, name), { recursive: true, mode: 0o700 });
}

export function atomicJSON(file, value) {
  const tmp = file + '.' + randomUUID() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(value), { mode: 0o600, flag: 'wx' });
  try { fs.renameSync(tmp, file); } finally { try { fs.unlinkSync(tmp); } catch {} }
}

export function recordHook(ctx, data) {
  if (!data || typeof data.session_id !== 'string' || !data.session_id || data.session_id.length > 200) return null;
  const sessionId = label(data.session_id, 200);
  const event = label(data.hook_event_name, 60);
  const supported = ['SessionStart', 'SessionEnd', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'PermissionDenied', 'SubagentStart', 'SubagentStop', 'TaskCompleted', 'Stop', 'StopFailure', 'Notification'];
  if (!supported.includes(event)) return null;
  initStorage(ctx);
  let target = data.tool_input?.file_path || data.tool_input?.path;
  if (typeof target === 'string') {
    const absolute = path.resolve(ctx.project, target);
    target = sensitive(absolute) ? '[敏感路径]' : inside(ctx.project, absolute) ? label(path.relative(ctx.project, absolute), 220) : '[项目外路径]';
  } else target = '';
  const record = {
    id: randomUUID(), projectId: ctx.projectId, sessionId, kind: 'hook', event,
    observedAt: new Date().toISOString(), occurredAt: null,
    agentId: label(data.agent_id, 120) || null, agentType: label(data.agent_type, 80) || null,
    taskId: label(data.task_id || data.tool_input?.task_id, 120) || null,
    tool: label(data.tool_name, 100), toolUseId: label(data.tool_use_id, 120) || null,
    source: label(data.source, 30), reason: label(data.reason, 60), target,
  };
  // One atomic file per event: independent sessions never read/overwrite a shared state file.
  for (const name of ['agentId', 'agentType', 'taskId', 'tool', 'toolUseId', 'source', 'reason', 'target']) if (typeof record[name] === 'string') record[name] = redact(record[name]);
  atomicJSON(path.join(ctx.dataDir, 'events', `${Date.now()}-${record.id}.json`), record);
  return record;
}

export function accessURL(service, sessionId = '') {
  const fragment = new URLSearchParams({ key: service.token });
  if (sessionId) fragment.set('session', sessionId);
  return `http://127.0.0.1:${service.port}/#${fragment}`;
}

export async function probe(ctx) {
  const service = readJSON(path.join(ctx.dataDir, 'service.json'));
  if (!service || service.projectId !== ctx.projectId || !Number.isInteger(service.port) || service.port < 1 || service.port > 65535 || typeof service.token !== 'string') return null;
  try {
    const response = await fetch(`http://127.0.0.1:${service.port}/api/health`, { headers: { Authorization: `Bearer ${service.token}` }, signal: AbortSignal.timeout(300), redirect: 'error' });
    const health = await response.json();
    return response.ok && health.instanceId === service.instanceId && health.projectId === ctx.projectId && health.pid === service.pid && health.version === VERSION ? service : null;
  } catch { return null; }
}

export async function ensureService(ctx) {
  initStorage(ctx);
  const running = await probe(ctx);
  if (running) return running;
  const lockFile = path.join(ctx.dataDir, 'startup.lock');
  const nonce = randomUUID();
  const deadline = Date.now() + 4200;
  let acquired = false;
  while (Date.now() < deadline) {
    const service = await probe(ctx);
    if (service) return service;
    try {
      fs.writeFileSync(lockFile, JSON.stringify({ nonce, pid: process.pid }), { flag: 'wx', mode: 0o600 });
      acquired = true;
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const owner = readJSON(lockFile);
      let alive = true;
      try { if (!owner?.pid) alive = false; else process.kill(owner.pid, 0); } catch (e) { alive = e.code !== 'ESRCH'; }
      try { if (!alive && Date.now() - fs.statSync(lockFile).mtimeMs > 1500) fs.unlinkSync(lockFile); } catch {}
      await delay(80);
    }
  }
  if (!acquired) throw new Error('观察服务启动仍在进行；稍后从终端执行 status 查看地址');
  try {
    const logFile = path.join(ctx.dataDir, 'service.log');
    const fd = fs.openSync(logFile, 'a', 0o600);
    const child = spawn(process.execPath, [path.join(MODULE_ROOT, 'server.mjs'), '--root', ctx.root, '--project', ctx.project], {
      cwd: ctx.root, env: process.env, detached: true, windowsHide: true, stdio: ['ignore', fd, fd],
    });
    fs.closeSync(fd);
    let launchError;
    child.on('error', error => { launchError = error; });
    child.unref();
    while (Date.now() < deadline) {
      if (launchError) throw launchError;
      const service = await probe(ctx);
      if (service) return service;
      await delay(80);
    }
    throw new Error('观察服务未在启动时限内就绪；CC 可继续使用');
  } finally {
    if (readJSON(lockFile)?.nonce === nonce) { try { fs.unlinkSync(lockFile); } catch {} }
  }
}

export function firstNotice(ctx, service, sessionId) {
  const file = path.join(ctx.dataDir, 'notices', hash(sessionId + '\0' + service.instanceId) + '.json');
  try { fs.writeFileSync(file, '{}', { flag: 'wx', mode: 0o600 }); return true; }
  catch (error) { if (error.code === 'EEXIST') return false; throw error; }
}

export function optionsFromArgs(args = process.argv.slice(2)) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (['--root', '--project'].includes(args[i])) options[args[i].slice(2)] = args[++i];
    else throw new Error('未知参数：' + label(args[i]));
  }
  return options;
}
