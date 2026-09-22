import fs from 'node:fs';
import path from 'node:path';
import { hash } from './runtime.mjs';
import { readLocal, localPath, localJSON, cleanText, frontmatter } from './local-data.mjs';

export class Catalog {
  constructor(ctx) { this.ctx = ctx; this.items = []; this.scannedAt = 0; }
  scan() {
    if (Date.now() - this.scannedAt < 15000) return;
    const { root, project } = this.ctx;
    const items = [];
    const addDocument = (kind, base, relative, extra = {}) => {
      try {
        const r = readLocal(base, relative), content = cleanText(r.content, 96000), fm = frontmatter(content);
        const name = extra.name || fm.name || fm.title || content.match(/^#\s+(.+)/m)?.[1] || path.basename(relative, '.md');
        const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '');
        items.push({ id: hash(kind + base + relative).slice(0, 24), kind, name, description: fm.description || body.split('\n').filter(l => l.trim() && !/^#|^\|/.test(l)).slice(0, 2).join(' ').slice(0, 240),
          source: relative, origin: base === root ? 'Harness 内置' : '项目本地', content, truncated: r.truncated, ...extra });
      } catch { /* Missing definitions are not installed capabilities. */ }
    };
    const list = (base, relative) => { try { return fs.readdirSync(localPath(base, relative), { withFileTypes: true }).filter(e => !e.isSymbolicLink()); } catch { return []; } };
    for (const e of list(root, 'agents').filter(e => e.isDirectory())) {
      const rel = `agents/${e.name}/${e.name}.md`;
      const official = localJSON(project, '.claude/settings.json');
      let runtime = '';
      try { runtime = readLocal(project, `.claude/agents/${e.name}.md`).content; } catch {}
      const fm = frontmatter(runtime);
      addDocument('agent', root, rel, { agentType: e.name, runtimeSource: runtime ? `.claude/agents/${e.name}.md` : null,
        runtimeContent: cleanText(runtime, 96000), tools: fm.tools || '继承 CC 权限；定义未显式列出', model: fm.model || '继承会话模型',
        isDefault: official.agent === e.name });
    }
    for (const e of list(project, '.claude/agents').filter(e => e.isFile() && e.name.endsWith('.md'))) {
      const type = e.name.slice(0, -3);
      if (!items.some(i => i.kind === 'agent' && i.agentType === type)) addDocument('agent', project, `.claude/agents/${e.name}`, { agentType: type });
    }
    const reg = localJSON(root, 'skills/registry.json');
    const declared = new Map();
    for (const [agent, entries] of Object.entries(reg.agents || {})) for (const item of entries) if (item.skill_file) declared.set(item.skill_file, { owner: agent, purpose: cleanText(item.purpose || '') });
    const walkSkills = (base, folder, depth = 0) => {
      if (depth > 6 || items.filter(i => i.kind === 'skill').length >= 400) return;
      for (const e of list(base, folder)) {
        const rel = `${folder}/${e.name}`;
        if (e.name === 'SKILL.md' && e.isFile()) addDocument('skill', base, rel, declared.get(rel) || { owner: '项目共享' });
        else if (e.isDirectory() && !e.name.startsWith('.') && !['node_modules', 'assets', 'references', 'scripts'].includes(e.name)) walkSkills(base, rel, depth + 1);
      }
    };
    walkSkills(root, 'skills');
    walkSkills(project, '.claude/skills');
    const registry = localJSON(root, 'mcp/registry.json');
    const defs = Object.values(registry.servers || {});
    const installed = localJSON(project, '.mcp.json', null);
    const config = installed || localJSON(root, 'mcp/claude-project.mcp.json');
    for (const [name, server] of Object.entries(config.mcpServers || {})) {
      const def = defs.find(d => d.config_name === name) || {};
      let endpoint = '';
      try { const u = new URL(server.url); endpoint = u.origin + u.pathname; } catch {}
      const detail = { type: server.type || 'stdio', command: cleanText(server.command || ''), endpoint,
        arguments: (server.args || []).map((a, i, all) => /^--?(?:.*key|.*token|.*secret|.*password)$/i.test(all[i - 1] || '') ? '[已隐藏]' : cleanText(a, 1000)),
        environmentNames: Object.keys(server.env || {}), headerNames: Object.keys(server.headers || {}),
        purpose: cleanText(def.purpose || ''), securityBoundary: cleanText(def.security_boundary || ''), connection: '配置已发现；未发起连接探测' };
      items.push({ id: hash('mcp' + name).slice(0, 24), kind: 'mcp', name, description: detail.purpose || '项目配置的 MCP 服务',
        source: installed ? '.mcp.json' : 'mcp/claude-project.mcp.json', origin: installed ? '项目配置' : 'Harness 模板（未确认安装）',
        configured: !!installed, content: JSON.stringify(detail, null, 2), ...detail });
    }
    try {
      const r = readLocal(root, 'playbook.md');
      for (const line of r.content.split('\n')) {
        if (!/^\| WF-\d{2} \|/.test(line)) continue;
        const cells = line.split('|').slice(1, -1).map(x => x.trim());
        const [code, name, scenario, agents, dispatch, qa, doc, memory, security, outputs] = cells;
        items.push({ id: code, kind: 'workflow', name: `${code} ${name}`, description: scenario, source: 'playbook.md §3.4.2', origin: 'Harness 软链路',
          actors: agents.split(/,\s*/), dispatch, gates: { QA: qa, Doc: doc, Memory: memory, Security: security }, outputs,
          content: cleanText(r.content, 96000), note: '这是声明的协作规则，不是某次会话已经执行的链路。高风险升级规则以 playbook 正文为准。' });
      }
    } catch {}
    this.items = items;
    this.scannedAt = Date.now();
  }
  summary() { return this.items.map(({ content, runtimeContent, ...item }) => item); }
}
