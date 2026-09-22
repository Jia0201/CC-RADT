import fs from 'node:fs';
import path from 'node:path';
import { inside, sensitive, redact } from './runtime.mjs';

// Only callers with a fixed, trusted root may use this reader. No HTTP path input.
export function localPath(root, relative) {
  const target = path.resolve(root, relative);
  if (!inside(root, target) || sensitive(relative)) throw Error('来源超出允许范围');
  const canonical = fs.realpathSync(root);
  let current = root;
  for (const part of path.relative(root, target).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink()) throw Error('不读取符号链接');
  }
  if (!inside(canonical, fs.realpathSync(target))) throw Error('来源越界');
  return target;
}

export function readLocal(root, relative, limit = 96 * 1024, tail = false) {
  const target = localPath(root, relative);
  const fd = fs.openSync(target, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile()) throw Error('不是普通文件');
    const start = tail ? Math.max(0, stat.size - limit) : 0;
    const buffer = Buffer.alloc(Math.min(limit, stat.size));
    const length = fs.readSync(fd, buffer, 0, buffer.length, start);
    let content = buffer.subarray(0, length).toString('utf8');
    if (start) content = content.slice(content.indexOf('\n') + 1);
    localPath(root, relative);
    return { content, truncated: stat.size > limit, size: stat.size, mtime: stat.mtime.toISOString() };
  } finally { fs.closeSync(fd); }
}

export function localJSON(root, relative, fallback = {}) {
  try { const r = readLocal(root, relative, 2 * 1024 * 1024); return r.truncated ? fallback : JSON.parse(r.content); } catch { return fallback; }
}

export const cleanText = (value, max = 24000) => {
  const text = String(value ?? '');
  return redact(text.slice(0, max)).replace(/(https?:\/\/127\.0\.0\.1:\d+\/#)[^\s)\]<>]+/g, '$1[本机入口凭据已隐藏]') + (text.length > max ? '\n[超过展示上限，已截断]' : '');
};

export function cleanObject(value, depth = 0) {
  if (depth > 8) return '[层级截断]';
  if (typeof value === 'string') return cleanText(value);
  if (Array.isArray(value)) return value.slice(0, 80).map(v => cleanObject(v, depth + 1));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).slice(0, 100).map(([k, v]) => [k,
    /^(env|headers)$|token|password|secret|credential|authorization|api.?key|private.?key/i.test(k) ? '[已隐藏]' : cleanObject(v, depth + 1)]));
  return value;
}

export function frontmatter(content) {
  const block = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fields = {};
  for (const line of (block?.[1] || '').split('\n')) {
    const match = line.match(/^([\w-]+):\s*(.*)$/);
    if (match) fields[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return fields;
}
