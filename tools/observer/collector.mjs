import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { inside, sensitive, redact, hash, atomicJSON, readJSON } from './runtime.mjs';
import { NativeReader, NATIVE_LIMITS } from './native.mjs';
import { Catalog } from './catalog.mjs';
import { WorktreeReader } from './worktree.mjs';

export const RETENTION = { days: 7, events: 5000, snapshots: 300, sourceFiles: 240, fileBytes: 96 * 1024, scanBytes: 3 * 1024 * 1024 };
const folders = ['shared/tasks', 'shared/events', 'shared/handoffs', 'shared/transactions', 'shared/prompt-evolution/reviews', 'shared/prompt-evolution/events', 'logs'];
const fixed = ['shared/task-plan.md', 'shared/pipeline-status.md', 'shared/supervision/heartbeat-current.md'];
const ignore = name => /^index\./i.test(name) || /template/i.test(name) || name.startsWith('.');

export function safeRead(root, relative, maxBytes = RETENTION.fileBytes, previous = null) {
  if (sensitive(relative)) throw new Error('敏感来源，不读取');
  const target = path.resolve(root, relative);
  if (!inside(root, target) || !inside(root, fs.realpathSync(target))) throw new Error('来源越界');
  if (fs.lstatSync(target).isSymbolicLink()) throw new Error('符号链接来源未接入');
  const fd = fs.openSync(target, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    const before = fs.fstatSync(fd);
    if (!before.isFile()) throw new Error('不是普通文件');
    const fingerprint = hash(['text-v2', before.dev, before.ino, before.size, before.mtimeMs, before.ctimeMs, maxBytes].join(':'));
    // Revalidate path and descriptor on every poll, but do not re-read/redact unchanged evidence.
    if (previous?.fingerprint === fingerprint && typeof previous.content === 'string') {
      if (!inside(root, fs.realpathSync(target))) throw new Error('来源在读取时发生变化');
      return { content: previous.content, truncated: previous.truncated, size: before.size, mtime: new Date(before.mtimeMs).toISOString(), fingerprint };
    }
    const buffer = Buffer.alloc(maxBytes + 1);
    const bytes = fs.readSync(fd, buffer, 0, buffer.length, 0);
    const after = fs.fstatSync(fd);
    if (before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || before.size !== after.size) throw new Error('文件正在写入，稍后重读');
    if (!inside(root, fs.realpathSync(target))) throw new Error('来源在读取时发生变化');
    return { content: redact(buffer.subarray(0, Math.min(bytes, maxBytes)).toString('utf8')), truncated: bytes > maxBytes || before.size > maxBytes, size: before.size, mtime: new Date(before.mtimeMs).toISOString(), fingerprint };
  } finally { fs.closeSync(fd); }
}

function candidates(ctx) {
  const files = [...fixed];
  let limited = false;
  function walk(relative, depth = 0) {
    if (files.length >= RETENTION.sourceFiles) { limited = true; return; }
    const dir = path.join(ctx.root, relative);
    if (!fs.existsSync(dir) || fs.lstatSync(dir).isSymbolicLink() || !inside(ctx.root, fs.realpathSync(dir))) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => b.name.localeCompare(a.name))) {
      if (ignore(entry.name) || entry.isSymbolicLink() || sensitive(entry.name)) continue;
      if (files.length >= RETENTION.sourceFiles) { limited = true; break; }
      const next = relative + '/' + entry.name;
      if (entry.isDirectory() && depth < 3) walk(next, depth + 1);
      else if (entry.isFile() && /\.(md|txt|log|json|jsonl)$/i.test(entry.name)) files.push(next);
    }
  }
  for (const folder of folders) walk(folder);
  const agents = path.join(ctx.root, 'agents');
  if (fs.existsSync(agents) && !fs.lstatSync(agents).isSymbolicLink()) {
    for (const item of fs.readdirSync(agents, { withFileTypes: true })) if (item.isDirectory() && !sensitive(item.name)) files.push(`agents/${item.name}/${item.name}.md`);
  }
  return { files, limited };
}

function category(file) {
  if (file.startsWith('agents/')) return 'config';
  if (file.includes('/reviews/')) return 'review';
  if (file.startsWith('logs/')) return 'log';
  if (file.startsWith('shared/tasks/') || file === 'shared/task-plan.md') return 'task';
  return 'state';
}

export function readRecords(ctx, directory, limit, cache = null) {
  const dir = path.join(ctx.dataDir, directory);
  const names = fs.readdirSync(dir).filter(name => /^\d+-[a-f0-9-]+\.json$/.test(name)).sort().reverse();
  const records = [];
  const used = new Set();
  for (const name of names.slice(0, limit)) {
    const file = path.join(dir, name);
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > RETENTION.fileBytes * 7) continue;
    const stamp = [stat.dev, stat.ino, stat.size, stat.mtimeMs, stat.ctimeMs].join(':');
    const cached = cache?.get(name);
    const item = cached?.stamp === stamp ? cached.item : readJSON(file);
    if (cache && item) { cache.set(name, { stamp, item }); used.add(name); }
    if (item?.projectId === ctx.projectId) records.push(item);
  }
  if (cache) for (const name of cache.keys()) if (!used.has(name)) cache.delete(name);
  return records;
}

export function prune(ctx, directory, maxCount) {
  const dir = path.join(ctx.dataDir, directory);
  const names = fs.readdirSync(dir).filter(name => /^\d+-[a-f0-9-]+\.json$/.test(name)).sort().reverse();
  const cutoff = Date.now() - RETENTION.days * 86400000;
  for (const [index, name] of names.entries()) {
    if (index >= maxCount || Number(name.split('-')[0]) < cutoff) fs.unlinkSync(path.join(dir, name));
  }
}

export class Collector {
  constructor(ctx) {
    this.ctx = ctx;
    this.recordCaches = { events: new Map(), snapshots: new Map() };
    this.sources = new Map();
    this.events = [];
    this.snapshots = readRecords(ctx, 'snapshots', RETENTION.snapshots, this.recordCaches.snapshots);
    this.scannedAt = null;
    this.limited = false;
    this.scanError = null;
    this.tick = 0;
    this.native = new NativeReader(ctx);
    this.catalog = new Catalog(ctx);
    this.worktree = new WorktreeReader(ctx);
    for (const snapshot of [...this.snapshots].reverse()) this.sources.set(snapshot.source, { ...snapshot, available: false });
  }

  scan() {
    try {
      ++this.tick;
      prune(this.ctx, 'events', RETENTION.events);
      this.events = readRecords(this.ctx, 'events', RETENTION.events, this.recordCaches.events);
      this.native.scan(this.events);
      this.catalog.scan();
      this.worktree.scan();
      const discovered = candidates(this.ctx);
      this.limited = discovered.limited;
      let total = 0;
      const present = new Set();
      for (const file of discovered.files) {
        present.add(file);
        const previous = this.sources.get(file);
        if (total >= RETENTION.scanBytes) { this.limited = true; if (previous) previous.available = false; continue; }
        try {
          const result = safeRead(this.ctx.root, file, RETENTION.fileBytes, previous);
          total += Math.min(result.size, RETENTION.fileBytes);
          const version = previous?.fingerprint === result.fingerprint ? previous.version : hash(result.content);
          let record = previous;
          if (!previous || previous.version !== version) {
            record = {
              id: randomUUID(), kind: 'snapshot', event: previous ? 'SourceChanged' : 'SourceObserved',
              projectId: this.ctx.projectId, source: file, category: category(file),
              version, previousVersion: previous?.version || null,
              observedAt: new Date().toISOString(), occurredAt: null,
              ...result,
            };
            atomicJSON(path.join(this.ctx.dataDir, 'snapshots', `${Date.now()}-${record.id}.json`), record);
          }
          this.sources.set(file, { ...record, ...result, available: true, lastReadAt: new Date().toISOString(), error: null });
        } catch (error) {
          this.sources.set(file, { ...(previous || { source: file, category: category(file), content: '' }), available: false, error: error.code === 'ENOENT' ? '来源尚不存在' : '来源暂不可读或超出安全边界' });
        }
      }
      for (const [file, record] of this.sources) if (!present.has(file)) this.sources.set(file, { ...record, available: false, error: '来源已移除或不在本轮覆盖内' });
      prune(this.ctx, 'snapshots', RETENTION.snapshots);
      this.snapshots = readRecords(this.ctx, 'snapshots', RETENTION.snapshots, this.recordCaches.snapshots);
      this.scannedAt = new Date().toISOString();
      this.scanError = null;
    } catch { this.scanError = '本轮采集未完成，以下为上次有效数据'; }
  }

  view(sessionId = '') {
    const sessions = new Map();
    const agents = new Map();
    for (const e of [...this.events].sort((a, b) => a.observedAt.localeCompare(b.observedAt) || a.id.localeCompare(b.id))) {
      if (!e.sessionId) continue;
      const old = sessions.get(e.sessionId);
      const ended = e.event === 'SessionEnd' ? true : e.event === 'SessionStart' ? false : old?.ended || false;
      sessions.set(e.sessionId, {
        id: e.sessionId, firstSeenAt: old?.firstSeenAt || e.observedAt, lastSeenAt: e.observedAt,
        eventCount: (old?.eventCount || 0) + 1, ended, lastEvent: e.event, lastTool: e.tool || old?.lastTool || '',
        status: ended ? '会话已结束' : Date.now() - Date.parse(e.observedAt) > 120000 ? '活动未确认' : e.event === 'Stop' ? '本轮输出结束' : '最近有活动',
      });
      if (e.agentId && (!sessionId || sessionId === e.sessionId)) agents.set(e.sessionId + '\0' + e.agentId, { id: e.agentId, sessionId: e.sessionId, type: e.agentType || '未记录角色', lastSeenAt: e.observedAt, event: e.event });
    }
    const nativeSessions = this.native.summary();
    for (const s of nativeSessions) {
      const old = sessions.get(s.id);
      sessions.set(s.id, { ...old, id: s.id, title: s.title, lastSeenAt: s.lastSeenAt || old?.lastSeenAt, ended: s.ended,
        status: s.status, eventCount: old?.eventCount || 0, turnCount: s.turnCount, actorCount: s.actors.length });
    }
    const events = this.events.filter(e => !sessionId || e.sessionId === sessionId);
    const sources = [...this.sources.values()].map(({ content, ...item }) => item);
    const snapshots = this.snapshots.map(({ content, ...item }) => item);
    return {
      project: { id: this.ctx.projectId, name: this.ctx.name, root: this.ctx.project },
      scannedAt: this.scannedAt, scanError: this.scanError, limited: this.limited, retention: RETENTION,
      selectedSession: sessionId, sessions: [...sessions.values()].sort((a, b) => (b.lastSeenAt || '').localeCompare(a.lastSeenAt || '')),
      agents: [...agents.values()], events, sources, snapshots,
      native: { sessions: nativeSessions.filter(s => !sessionId || s.id === sessionId), limited: this.native.limited, error: this.native.error, limits: NATIVE_LIMITS },
      catalog: this.catalog.summary(),
      worktree: { ...this.worktree.state, files: this.worktree.state.files.map(({ diff, ...f }) => f) },
      coverage: 'CC 原生记录提供对话、工具与已报告用量；隐藏思考不采集。Hook 时间为观测时间。工作区差异与静态配置不推断会话归属。',
    };
  }
}
