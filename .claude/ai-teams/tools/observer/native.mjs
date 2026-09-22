import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { hash, inside, sensitive } from './runtime.mjs';
import { readLocal, localPath, cleanText, cleanObject } from './local-data.mjs';

export const NATIVE_LIMITS = { sessions: 30, transcripts: 100, fileBytes: 8 * 1024 * 1024, scanBytes: 40 * 1024 * 1024, messages: 3000 };
const validID = v => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,200}$/.test(v);
const textBlocks = value => typeof value === 'string' ? value : Array.isArray(value) ? value.filter(b => b.type === 'text').map(b => b.text || '').join('\n') : '';
const finite = v => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
const usageFields = ['input_tokens', 'output_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens'];
const blankUsage = () => Object.fromEntries(usageFields.map(k => [k, null]));
function sameProject(cwd, project) {
  if (typeof cwd !== 'string') return false;
  if (path.resolve(cwd) === project) return true;
  try { return fs.realpathSync(cwd) === project; } catch { return false; }
}

export function fileTarget(ctx, value) {
  if (typeof value !== 'string' || !value) return '';
  const absolute = path.resolve(ctx.project, value);
  if (sensitive(absolute)) return '[敏感路径]';
  if (!inside(ctx.project, absolute)) return '[项目外路径]';
  try { if (fs.existsSync(absolute) && !inside(ctx.project, fs.realpathSync(absolute))) return '[项目外路径]'; } catch {}
  return cleanText(path.relative(ctx.project, absolute), 600);
}

export function parseTranscript(raw, { ctx, sessionId, actorId = 'main', source, truncated = false }) {
  const rows = [], seen = new Set();
  let malformed = 0;
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let row;
    try { row = JSON.parse(line); } catch { malformed++; continue; }
    // CWD is mandatory: an encoded-directory collision is not permission to read another project.
    if (!sameProject(row.cwd, ctx.project) || (row.sessionId && row.sessionId !== sessionId)) continue;
    if (!['user', 'assistant'].includes(row.type)) continue;
    if (row.uuid && seen.has(row.uuid)) continue;
    seen.add(row.uuid);
    rows.push(row);
  }
  const turns = [], messages = [], calls = new Map(), requests = new Map(), results = new Map(), turnByMessage = new Map();
  let turnId = null;
  for (const [index, row] of rows.entries()) {
    const id = row.uuid || hash(source + index).slice(0, 24);
    const timestamp = Number.isFinite(Date.parse(row.timestamp)) ? row.timestamp : null;
    const content = row.message?.content;
    const blocks = Array.isArray(content) ? content : [{ type: 'text', text: content }];
    const isResult = blocks.some(b => b.type === 'tool_result');
    const text = cleanText(textBlocks(content));
    if (actorId === 'main' && row.parentUuid && turnByMessage.has(row.parentUuid)) turnId = turnByMessage.get(row.parentUuid);
    const localCommand = /^\s*<(?:command-name|local-command-stdout|local-command-stderr|local-command-caveat)>/.test(text);
    if (row.type === 'user' && !isResult && !row.isMeta && !localCommand && text) {
      if (actorId === 'main') { turnId = id; turns.push({ id, sessionId, prompt: text, timestamp, source }); }
      messages.push({ id, sessionId, actorId, turnId, role: actorId === 'main' ? 'user' : 'assignment', text, timestamp, source, parentUuid: row.parentUuid || null });
    }
    turnByMessage.set(id, turnId);
    if (row.type === 'assistant') {
      // Streaming chunks repeat usage for the same message ID. Last available field wins once.
      const request = row.message?.id || row.requestId;
      if (request) {
        const old = requests.get(request) || blankUsage();
        for (const key of usageFields) if (finite(row.message?.usage?.[key]) !== null) old[key] = row.message.usage[key];
        requests.set(request, old);
      }
      if (text) messages.push({ id, sessionId, actorId, turnId, role: 'assistant', text, timestamp, source, parentUuid: row.parentUuid || null });
      for (const b of blocks) {
        if (b.type !== 'tool_use' || !b.id || !b.name) continue;
        const target = fileTarget(ctx, b.input?.file_path || b.input?.path || b.input?.notebook_path);
        const hidden = ['[敏感路径]', '[项目外路径]'].includes(target);
        const previous = calls.get(b.id);
        calls.set(b.id, { id: `${actorId}:${b.id}`, toolUseId: b.id, actorId, sessionId, turnId: previous?.turnId || turnId,
          name: cleanText(b.name, 200), target, timestamp, source, status: '未观察到结果',
          input: hidden ? { file_path: target, content: '[受保护的文件输入已隐藏]' } : cleanObject(b.input || {}), hidden });
      }
    }
    for (const b of blocks) {
      if (b.type !== 'tool_result' || !b.tool_use_id) continue;
      const result = textBlocks(b.content);
      const child = row.toolUseResult?.agentId || result.match(/\bagentId:\s*([a-zA-Z0-9_-]+)/)?.[1];
      results.set(b.tool_use_id, { output: cleanText(result), resultAt: timestamp, isError: b.is_error === true,
        childId: validID(child) ? child : null,
        before: typeof row.toolUseResult?.originalFile === 'string' ? cleanText(row.toolUseResult.originalFile) : null });
    }
  }
  for (const [id, c] of calls) {
    const result = results.get(id);
    if (result) Object.assign(c, result, { output: c.hidden ? '[受保护的文件输出已隐藏]' : result.output, before: c.hidden ? null : result.before, status: result.isError ? '执行失败 / 被拒绝' : 'CC 已返回结果' });
  }
  const usage = blankUsage();
  for (const u of requests.values()) for (const key of usageFields) if (u[key] !== null) usage[key] = (usage[key] || 0) + u[key];
  return { sessionId, actorId, source, turns, messages: messages.slice(-NATIVE_LIMITS.messages), calls: [...calls.values()], usage,
    requests: requests.size, usageCoverage: truncated ? '截断范围内的已记录用量' : '按模型消息 ID 去重；仅统计记录提供的字段',
    partial: truncated || malformed > 0 || messages.length > NATIVE_LIMITS.messages, malformed };
}

function changeFor(call) {
  if (!['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(call.name) || !call.target) return null;
  const patches = call.hidden ? [] : call.name === 'Edit' ? [{ before: call.input.old_string ?? null, after: call.input.new_string ?? null }]
    : call.name === 'MultiEdit' ? (call.input.edits || []).map(p => ({ before: p.old_string ?? null, after: p.new_string ?? null }))
      : [{ before: call.before ?? null, after: call.input.content ?? call.input.new_source ?? null }];
  return { id: call.id, sessionId: call.sessionId, actorId: call.actorId, turnId: call.turnId, toolUseId: call.toolUseId,
    file: call.target, tool: call.name, timestamp: call.timestamp, status: call.status, confirmed: !!call.resultAt && !call.isError,
    patches, source: call.source, note: 'CC 工具记录中的修改片段；不等同当前磁盘版本。无结果仅代表修改请求，未确认写入。' };
}

export function buildSession(ctx, sessionId, transcripts, events) {
  const turns = transcripts.find(t => t.actorId === 'main')?.turns || [];
  const calls = transcripts.flatMap(t => t.calls.map(c => ({ ...c })));
  const messages = transcripts.flatMap(t => t.messages.map(m => ({ ...m })));
  const edges = [], assignments = new Map();
  for (const c of calls) {
    if (['Task', 'Agent'].includes(c.name)) {
      edges.push({ id: c.id, from: c.actorId, to: c.childId || `request:${c.toolUseId}`, label: c.input.description || c.input.subagent_type || c.name,
        kind: 'dispatch', confirmed: !!c.childId, turnId: c.turnId, callId: c.id, timestamp: c.timestamp });
      if (c.childId) assignments.set(c.childId, c);
    } else if (c.name === 'SendMessage') edges.push({ id: c.id, from: c.actorId, to: cleanText(c.input.recipient || c.input.to || '未提供接收者', 200),
      label: cleanText(c.input.summary || c.input.type || 'Agent 消息', 200), kind: 'message', confirmed: !!c.resultAt, turnId: c.turnId, callId: c.id, timestamp: c.timestamp });
  }
  // Parent identity comes only from CC's explicit returned agentId, never matching timestamps/names.
  const resolveTurn = (actor, seen = new Set()) => {
    if (seen.has(actor)) return null;
    seen.add(actor);
    const a = assignments.get(actor);
    return a?.turnId || (a ? resolveTurn(a.actorId, seen) : null);
  };
  for (const collection of [calls, messages]) for (const item of collection) if (!item.turnId && item.actorId !== 'main') item.turnId = resolveTurn(item.actorId);
  for (const edge of edges) if (!edge.turnId) edge.turnId = resolveTurn(edge.from);
  const sorted = [...events].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  const life = sorted.filter(e => ['SessionEnd', 'SessionStart'].includes(e.event)).at(-1);
  const ended = life?.event === 'SessionEnd';
  const allActors = new Set(['main', ...transcripts.map(t => t.actorId), ...sorted.filter(e => e.agentId && ['SubagentStart', 'SubagentStop'].includes(e.event)).map(e => e.agentId)]);
  const actors = [...allActors].map(id => {
    const native = transcripts.find(t => t.actorId === id), assignment = assignments.get(id);
    const ev = sorted.filter(e => id === 'main' ? !e.agentId || !allActors.has(e.agentId) : e.agentId === id).at(-1);
    const ownCalls = calls.filter(c => c.actorId === id);
    const latest = ownCalls.at(-1);
    const msg = messages.filter(m => m.actorId === id).at(-1);
    const lastSeenAt = [ev?.observedAt, latest?.resultAt, latest?.timestamp, msg?.timestamp].filter(Boolean).sort().at(-1) || null;
    const stale = !lastSeenAt || Date.now() - Date.parse(lastSeenAt) > 120000;
    const status = ended ? '会话已结束' : ev?.event === 'SubagentStop' ? '子 Agent 已结束' : stale ? '活动未确认'
      : ['PermissionRequest', 'PermissionDenied'].includes(ev?.event) ? '出现权限决策请求'
        : ev?.event === 'Stop' ? '本轮输出结束' : latest && !latest.resultAt ? (latest.name === 'AskUserQuestion' ? '等待用户答复' : latest.name === 'ExitPlanMode' ? '计划确认待返回' : '工具结果待返回') : '最近有活动';
    const skills = ownCalls.filter(c => c.name === 'Skill').map(c => c.input.skill || c.input.name).filter(Boolean);
    const skillReads = ownCalls.filter(c => c.name === 'Read' && /(?:^|\/)SKILL\.md$/.test(c.target)).map(c => c.target);
    const mcp = ownCalls.filter(c => c.name.startsWith('mcp__')).map(c => c.name);
    return { id, key: `${sessionId}:${id}`, sessionId, type: cleanText(assignment?.input.subagent_type || ev?.agentType || (id === 'main' ? '主 Agent' : '未提供角色'), 160),
      status, lastSeenAt, summary: latest ? `${latest.name} ${latest.target || latest.input.description || ''}`.trim() : (msg?.text || assignment?.input.description || '尚无可读的执行内容').slice(0, 160),
      assignment: assignment?.input.prompt || '', parentId: assignment?.actorId || null, turnId: resolveTurn(id),
      usage: native?.usage || blankUsage(), usageCoverage: native?.usageCoverage || '未找到可关联的用量记录', requests: native?.requests || 0,
      tools: [...new Set(ownCalls.map(c => c.name))], skills: [...new Set(skills)], skillReads: [...new Set(skillReads)], mcp: [...new Set(mcp)], source: native?.source || 'Hook 元信息' };
  });
  const reviews = calls.filter(c => ['AskUserQuestion', 'ExitPlanMode', 'TaskUpdate', 'TaskCreate', 'TodoWrite'].includes(c.name)).map(c => ({
    id: c.id, sessionId, actorId: c.actorId, turnId: c.turnId, timestamp: c.timestamp,
    kind: ['TaskUpdate', 'TaskCreate', 'TodoWrite'].includes(c.name) ? '任务变更记录' : c.name === 'ExitPlanMode' ? '计划确认请求' : '人类决策问题',
    title: c.input.subject || c.input.description || c.name, status: c.resultAt ? (c.isError ? '返回失败 / 拒绝结果' : '已记录 CC 返回；审批人未提供') : ended ? '会话已结束，未记录结果' : '未记录答复，请在 CC 确认',
    input: c.input, output: c.output || '', callId: c.id, source: c.source,
    note: '任务变更不自动等于需要人类批准；工具返回也不推断是谁作出决定。' }));
  for (const e of sorted.filter(e => ['PermissionRequest', 'PermissionDenied'].includes(e.event) || (e.event === 'Notification' && e.notificationType === 'permission_prompt'))) {
    const c = e.toolUseId ? calls.find(c => c.toolUseId === e.toolUseId && (!e.agentId || c.actorId === e.agentId)) : null;
    reviews.push({ id: e.id, sessionId, actorId: e.agentId || 'main', turnId: c?.turnId || null, timestamp: e.observedAt, kind: '命令 / 工具权限决策',
      title: e.tool || 'CC 权限通知', input: e.reviewInput || {}, output: c?.output || '', source: 'Hook ' + e.event,
      status: e.event === 'PermissionDenied' ? '权限被拒绝' : c?.resultAt ? '关联工具已有返回；批准人未知' : ended ? '会话已结束，审批结果未知' : '曾请求决策，结果未知',
      note: e.toolUseId ? '仅按实际 tool_use_id 关联。请在 CC CLI 决策。' : '该事件未提供 tool_use_id，不按相似命令或时间猜测审批结果。请在 CC CLI 核对。' });
  }
  messages.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
  const lastSeenAt = [...actors.map(a => a.lastSeenAt), ...sorted.map(e => e.observedAt)].filter(Boolean).sort().at(-1);
  return { id: sessionId, title: turns[0]?.prompt.replace(/\s+/g, ' ').slice(0, 70) || '仅 Hook 会话', turns, calls, messages, actors,
    changes: calls.map(changeFor).filter(Boolean), edges, reviews, ended, lastSeenAt, status: ended ? '会话已结束' : actors.find(a => a.id === 'main')?.status || '活动未确认',
    partial: transcripts.some(t => t.partial), source: 'Claude Code 本地 JSONL + Harness Hooks',
    note: '只显示用户、助手公开文本与工具记录；不采集隐藏思考。Token 为记录提供的统计，不是账单或上下文占用。' };
}

export class NativeReader {
  constructor(ctx) { this.ctx = ctx; this.cache = new Map(); this.sessions = []; this.limited = false; this.error = null; }
  scan(events) {
    const ctx = this.ctx;
    this.limited = false; this.error = null;
    if (process.env.AI_TEAMS_OBSERVER_TRANSCRIPTS === '0') { this.sessions = []; this.error = '已通过环境开关关闭原生对话读取'; return; }
    const config = ctx.claudeDir || process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
    const projects = path.join(config, 'projects');
    const slug = ctx.project.replace(/[^a-zA-Z0-9]/g, '-');
    const directories = new Set([slug]);
    // A Hook can supply the exact native directory, but cannot escape the configured projects root.
    for (const e of events) if (typeof e.transcriptPath === 'string') {
      const rel = path.relative(projects, e.transcriptPath);
      if (inside(projects, e.transcriptPath) && rel.split(path.sep).length === 2 && path.basename(rel) === `${e.sessionId}.jsonl`) directories.add(path.dirname(rel));
    }
    let files = [];
    for (const dir of directories) {
      try {
        const base = localPath(projects, dir);
        files.push(...fs.readdirSync(base, { withFileTypes: true }).filter(e => e.isFile() && /^[a-zA-Z0-9_-]+\.jsonl$/.test(e.name)).map(e => ({ rel: path.join(dir, e.name), id: e.name.slice(0, -6), mtime: fs.statSync(path.join(base, e.name)).mtimeMs })));
      } catch { /* No native log for this project yet. */ }
    }
    files.sort((a, b) => b.mtime - a.mtime);
    if (files.length > NATIVE_LIMITS.sessions) this.limited = true;
    let bytes = 0, count = 0;
    const loaded = new Map(), used = new Set();
    const read = (rel, sessionId, actorId) => {
      if (++count > NATIVE_LIMITS.transcripts) { this.limited = true; return null; }
      try {
        const stat = fs.statSync(localPath(projects, rel));
        bytes += Math.min(stat.size, NATIVE_LIMITS.fileBytes);
        if (bytes > NATIVE_LIMITS.scanBytes) { this.limited = true; return null; }
        const stamp = `${stat.mtimeMs}:${stat.size}`;
        used.add(rel);
        const old = this.cache.get(rel);
        if (old?.stamp === stamp) { if (old.value.partial) this.limited = true; return old.value; }
        const r = readLocal(projects, rel, NATIVE_LIMITS.fileBytes, true);
        const value = parseTranscript(r.content, { ctx, sessionId, actorId, source: `CC projects/${rel}`, truncated: r.truncated });
        this.cache.set(rel, { stamp, value });
        if (value.partial) this.limited = true;
        return value;
      } catch { this.limited = true; return null; }
    };
    for (const file of files.slice(0, NATIVE_LIMITS.sessions)) {
      const main = read(file.rel, file.id, 'main');
      if (!main || (!main.messages.length && !main.calls.length)) continue;
      const group = [main], subdir = path.join(path.dirname(file.rel), file.id, 'subagents');
      try {
        for (const e of fs.readdirSync(localPath(projects, subdir), { withFileTypes: true }).filter(e => e.isFile() && /^agent-[a-zA-Z0-9_-]+\.jsonl$/.test(e.name))) {
          const sub = read(path.join(subdir, e.name), file.id, e.name.slice(6, -6));
          if (sub) group.push(sub);
        }
      } catch {}
      loaded.set(file.id, group);
    }
    for (const e of events) if (validID(e.sessionId) && !loaded.has(e.sessionId)) loaded.set(e.sessionId, []);
    this.sessions = [...loaded].map(([id, transcripts]) => buildSession(ctx, id, transcripts, events.filter(e => e.sessionId === id))).sort((a, b) => (b.lastSeenAt || '').localeCompare(a.lastSeenAt || ''));
    for (const key of this.cache.keys()) if (!used.has(key)) this.cache.delete(key);
  }
  summary() { return this.sessions.map(({ messages, calls, turns, changes, edges, reviews, ...s }) => ({ ...s,
    turnCount: turns.length, messageCount: messages.length, callCount: calls.length, changeCount: changes.length, reviewCount: reviews.length,
    turns: turns.map(t => ({ ...t, prompt: t.prompt.slice(0, 300) })), changes: changes.map(({ patches, ...c }) => c), reviews: reviews.map(({ input, output, ...r }) => r), edges })); }
}
