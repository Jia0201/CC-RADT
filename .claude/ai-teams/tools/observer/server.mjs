import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import { context, optionsFromArgs, initStorage, MODULE_ROOT, VERSION, atomicJSON, readJSON } from './runtime.mjs';
import { RETENTION } from './collector.mjs';

const ctx = context(optionsFromArgs());
initStorage(ctx);
const instanceId = randomUUID();
const lockFile = path.join(ctx.dataDir, 'server.lock');
try {
  const old = readJSON(lockFile);
  if (old) {
    let alive = true;
    try { process.kill(old.pid, 0); } catch (error) { alive = error.code !== 'ESRCH'; }
    if (!alive) fs.unlinkSync(lockFile);
  }
  fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid, instanceId }), { flag: 'wx', mode: 0o600 });
} catch { process.exit(0); }

// Filesystem and redaction work must never delay SessionStart health probes.
let state = { project: { id: ctx.projectId, name: ctx.name, root: ctx.project }, sessions: [], events: [], agents: [], sources: [], snapshots: [], scannedAt: null, limited: false, retention: RETENTION, scanError: '等待首次采集', coverage: '采集器正在读取允许的来源，不影响 CC 执行。' };
const pending = new Map();
const worker = new Worker(new URL('./collector-worker.mjs', import.meta.url), { workerData: ctx });
worker.on('message', message => {
  if (message.type === 'state') state = message.state;
  if (message.type === 'evidence') pending.get(message.requestId)?.(message.evidence);
});
worker.on('error', () => { state = { ...state, scanError: '采集线程异常，保留上次有效记录；CC 不受影响' }; });
function readEvidence(id) {
  return new Promise(resolve => {
    const requestId = randomUUID();
    const timer = setTimeout(() => { pending.delete(requestId); resolve(undefined); }, 5000);
    pending.set(requestId, evidence => { clearTimeout(timer); pending.delete(requestId); resolve(evidence); });
    try { worker.postMessage({ type: 'evidence', id, requestId }); }
    catch { clearTimeout(timer); pending.delete(requestId); resolve(undefined); }
  });
}
const token = randomBytes(32).toString('hex');
const staticFiles = new Map([['/', ['index.html', 'text/html']], ['/app.js', ['app.js', 'text/javascript']], ['/style.css', ['style.css', 'text/css']]]);
let port;
let stopping = false;
const server = http.createServer(async (req, res) => {
  const origin = `http://127.0.0.1:${port}`;
  const headers = {
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store', 'Cross-Origin-Resource-Policy': 'same-origin',
  };
  const reply = (status, body, type = 'application/json') => { res.writeHead(status, { ...headers, 'Content-Type': type + '; charset=utf-8' }); res.end(type === 'application/json' ? JSON.stringify(body) : body); };
  if (req.headers.host !== `127.0.0.1:${port}` || (req.headers.origin && req.headers.origin !== origin) || req.headers['sec-fetch-site'] === 'cross-site') return reply(403, { error: '仅允许本机同源访问' });
  if (req.method !== 'GET') return reply(405, { error: '观察台只有读取接口' });
  let url;
  try { url = new URL(req.url, origin); } catch { return reply(400, { error: '无效地址' }); }
  if (staticFiles.has(url.pathname)) {
    const [file, type] = staticFiles.get(url.pathname);
    return reply(200, fs.readFileSync(path.join(MODULE_ROOT, 'web', file), 'utf8'), type);
  }
  const received = Buffer.from((req.headers.authorization || '').replace(/^Bearer /, ''));
  const expected = Buffer.from(token);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return reply(401, { error: '请使用 CC 启动提示中的完整观察台链接' });
  if (url.pathname === '/api/health') return reply(200, { version: VERSION, pid: process.pid, projectId: ctx.projectId, instanceId });
  if (url.pathname === '/api/state') {
    const selectedSession = url.searchParams.get('session') || '';
    return reply(200, { ...state, selectedSession,
      events: state.events.filter(e => !selectedSession || e.sessionId === selectedSession),
      agents: state.agents.filter(e => !selectedSession || e.sessionId === selectedSession),
      scanError: state.scannedAt && Date.now() - Date.parse(state.scannedAt) > 10000 ? '采集超过 10 秒未刷新，以下为最后已知数据' : state.scanError,
    });
  }
  if (url.pathname.startsWith('/api/evidence/')) {
    const id = url.pathname.slice('/api/evidence/'.length);
    const evidence = await readEvidence(id);
    if (evidence === undefined) return reply(503, { error: '证据采集繁忙，请稍后再试' });
    return evidence ? reply(200, evidence) : reply(404, { error: '证据版本未留存或已超出保留范围' });
  }
  return reply(404, { error: '没有此读取接口' });
});

server.requestTimeout = 5000;
server.headersTimeout = 5000;
server.on('error', error => { console.error('Observer HTTP error:', error.code); shutdown(); });
server.listen(0, '127.0.0.1', () => {
  port = server.address().port;
  atomicJSON(path.join(ctx.dataDir, 'service.json'), { version: VERSION, projectId: ctx.projectId, pid: process.pid, instanceId, port, token, startedAt: new Date().toISOString() });
});

function shutdown() {
  if (stopping) return;
  stopping = true;
  worker.terminate();
  for (const file of [lockFile, path.join(ctx.dataDir, 'service.json')]) {
    if (readJSON(file)?.instanceId === instanceId) { try { fs.unlinkSync(file); } catch {} }
  }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
