import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { hash, sensitive } from './runtime.mjs';
import { localPath, readLocal, cleanText } from './local-data.mjs';

export class WorktreeReader {
  constructor(ctx) { this.ctx = ctx; this.state = { files: [], note: '等待读取' }; this.last = 0; }
  scan() {
    if (Date.now() - this.last < 8000) return;
    this.last = Date.now();
    const deadline = Date.now() + 1500;
    const git = args => execFileSync('git', ['-c', 'core.fsmonitor=false', '-C', this.ctx.project, ...args], { encoding: 'utf8', timeout: Math.max(1, deadline - Date.now()), maxBuffer: 512 * 1024, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_PAGER: 'cat' }, stdio: ['ignore', 'pipe', 'pipe'] });
    try {
      if (path.resolve(git(['rev-parse', '--show-toplevel']).trim()) !== this.ctx.project) throw Error('项目不是 Git 根目录');
      const entries = git(['status', '--porcelain=v1', '-z', '--untracked-files=normal']).split('\0');
      const files = []; let excluded = 0;
      for (let i = 0; i < entries.length; i++) {
        const row = entries[i]; if (!row) continue;
        const status = row.slice(0, 2), name = row.slice(3);
        const oldName = /[RC]/.test(status) ? entries[++i] : null;
        if (sensitive(name) || (oldName && sensitive(oldName)) || name.endsWith('/') || /(?:^|\/)(?:\.claude|logs|shared)\//.test(name)) { excluded++; continue; }
        if (files.length >= 80 || Date.now() >= deadline) { excluded++; continue; }
        try {
          // Avoid diffing symlinks and binary payloads; deletion has no current file to read.
          if (fs.existsSync(path.join(this.ctx.project, name))) localPath(this.ctx.project, name);
          let diff;
          if (status === '??') {
            const r = readLocal(this.ctx.project, name, 64000);
            if (r.content.includes('\0')) { excluded++; continue; }
            diff = '+++ 未跟踪文件（当前内容；无历史基线）\n' + r.content.split('\n').map(l => '+' + l).join('\n') + (r.truncated ? '\n[截断]' : '');
          } else diff = git(['diff', '--no-ext-diff', '--no-textconv', '--no-color', 'HEAD', '--', name]);
          files.push({ id: hash(name).slice(0, 24), file: cleanText(name, 600), status, diff: cleanText(diff, 96000), oldFile: oldName ? cleanText(oldName, 600) : null });
        } catch { files.push({ id: hash(name).slice(0, 24), file: cleanText(name, 600), status, diff: '[文件不可读、二进制、超过限制或 Git 无 HEAD 基线]' }); }
      }
      this.state = { files, excluded, observedAt: new Date().toISOString(), note: '当前工作区相对 HEAD 的差异，包含其他人及会话改动，不能归因到选中的任务或 Agent。未跟踪目录、敏感路径与 Harness 运行日志不展开。' + (excluded ? ` ${excluded} 项因安全边界或采集数量 / 时间上限未展开。` : '') };
    } catch { this.state = { files: [], error: '当前项目 Git 差异不可用（非独立仓库或读取失败）', note: '仍可查看 CC 工具记录的修改片段。' }; }
  }
}
