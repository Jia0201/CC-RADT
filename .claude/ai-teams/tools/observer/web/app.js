const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const time = v => v ? new Date(v).toLocaleTimeString('zh-CN', { hour12: false }) : '未提供';
const date = v => v ? new Date(v).toLocaleString('zh-CN', { hour12: false }) : '未提供';
const short = v => v ? String(v).slice(0, 10) : '未关联';
const number = n => n === null || n === undefined ? '—' : n.toLocaleString('zh-CN');
const params = new URLSearchParams(location.hash.slice(1));
const key = params.get('key') || sessionStorage.getItem('cc-radt-observer-key') || '';
if (params.has('key')) sessionStorage.setItem('cc-radt-observer-key', key);
let selectedSession = params.get('session') || '', page = params.get('page') || 'overview';
let data, selection = null, detailData = null, detailTab = 'conversation', generation = 0, detailGeneration = 0, busy = false;
const pages = {
  overview: ['概览与会话', '按会话掌握每个 Agent 的最近动作、用量和实际协作。', 'Agent 状态总览'],
  tasks: ['任务记录', '从用户下达的每一条任务，展开原始对话、内部协作与实际工具操作。', '会话任务'],
  changes: ['文件变更', '查看操作了哪些文件、修改了什么；工具修改与当前工作区差异分开呈现。', '代码与文件'],
  logs: ['活动日志', '保留按时间回溯的 Hook 活动与原始项目日志。', '活动时间线'],
  reviews: ['证据与审查', '集中阅读权限请求、计划确认、人类问题与任务修改。所有决定仍在 CC CLI。', '决策与变更记录'],
  config: ['团队与配置', '项目完整 Agent 名册：职责、能力与定义。不是某个会话的运行实例。', 'Agent 能力目录'],
  skills: ['Skills', '当前项目与 Harness 内置技能，按实际 SKILL.md 文件计数。', '已发现的 Skills'],
  mcp: ['MCP', '查看项目 MCP 配置、用途、传输方式与安全边界；不主动连接服务。', 'MCP 服务目录'],
  workflows: ['软链路规则', '阅读 Harness 声明的工作流组合、适用场景和检查关口。', '工作流规则库'],
};
const catalogKinds = { config: 'agent', skills: 'skill', mcp: 'mcp', workflows: 'workflow' };
// Keep unchanged DOM nodes alive during polling: selection, focus and expanded tools belong to the reader.
const markupCache = new WeakMap();
function stableMarkup(node, html) {
  if (markupCache.get(node) === html) return;
  const scroll = node.scrollTop;
  const expanded = new Set([...node.querySelectorAll('details[open][data-expand]')].map(d => d.dataset.expand));
  const focus = node.contains(document.activeElement) ? document.activeElement : null;
  const focusAttrs = focus ? ['data-open','data-id','data-sid','data-session','data-detail-tab','data-expand'].filter(k=>focus.hasAttribute(k)).map(k=>[k,focus.getAttribute(k)]) : [];
  node.innerHTML = html;
  markupCache.set(node, html);
  node.querySelectorAll('details[data-expand]').forEach(d => { d.open = expanded.has(d.dataset.expand); });
  if (focusAttrs.length) [...node.querySelectorAll('button,summary,details')].find(el=>el.tagName===focus.tagName&&focusAttrs.every(([k,v])=>el.getAttribute(k)===v))?.focus({preventScroll:true});
  node.scrollTop = scroll;
}
const eventNames = { SessionStart:'会话进入', SessionEnd:'会话结束', UserPromptSubmit:'用户请求进入', PreToolUse:'工具调用开始', PostToolUse:'工具调用完成', PostToolUseFailure:'工具调用失败', PermissionRequest:'请求权限决策', PermissionDenied:'权限被拒绝', SubagentStart:'子 Agent 进入', SubagentStop:'子 Agent 输出结束', TaskCompleted:'任务完成事件', Stop:'本轮输出结束', StopFailure:'本轮输出异常', Notification:'CC 通知' };
const failed = e => ['PostToolUseFailure','PermissionDenied','StopFailure'].includes(e.event);
if (!pages[page]) page = 'overview';
function writeLocation() { const p = new URLSearchParams({ page }); if (selectedSession) p.set('session', selectedSession); history.replaceState(null, '', '#' + p); }
writeLocation();
async function api(url) {
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + key }, cache: 'no-store' });
  if (!r.ok) { const e = new Error(r.status === 401 ? '请使用 CC 的完整入口重新连接' : r.status === 404 ? '记录未在当前覆盖范围内' : '读取暂不可用，请稍后重试'); e.status = r.status; throw e; }
  return r.json();
}
async function refresh() {
  if (busy) return;
  busy = true;
  const current = generation;
  try {
    const next = await api('/api/state?session=' + encodeURIComponent(selectedSession));
    if (current !== generation) return;
    data = next;
    $('#locked').hidden = true; $('#workspace').hidden = false;
    $('#connection').textContent = !data.scannedAt ? '等待首次采集' : data.scanError ? '部分采集异常' : '观察服务已连接';
    $('#connection-dot').classList.toggle('offline', !!data.scanError);
    render();
    if (selection?.sessionId) await loadDetail(true);
  } catch (e) {
    if (current !== generation) return;
    $('#connection').textContent = e.message; $('#connection-dot').classList.add('offline');
    if (!data || e.status === 401) { $('#locked').hidden = false; $('#workspace').hidden = true; }
  } finally { if (current === generation) busy = false; }
}
const sessions = () => data?.native?.sessions || [];
const matches = value => JSON.stringify(value).toLowerCase().includes($('#search').value.trim().toLowerCase());
const empty = (title, text = '只展示真实记录；尚未产生的内容不会用演示值代替。') => `<div class="empty"><span class="empty-icon">⌁</span><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
const badge = (text, error = false) => `<span class="badge ${error ? 'error' : ''}">${esc(text)}</span>`;
const pre = (text, cls = '') => `<pre class="evidence-content ${cls}">${esc(typeof text === 'string' ? text : JSON.stringify(text, null, 2))}</pre>`;
const markdown = (text, frontmatter = false, cls = '') => `<div class="markdown-body ${cls}">${ObserverMarkdown.render(text, { frontmatter })}</div>`;
const markdownPath = source => /\.(?:md|markdown|mdown)(?:$|[\s#?])/i.test(source || '');
const fileContent = (text, source) => markdownPath(source) ? markdown(text, true) : pre(text);
function toolOutput(c) {
  if (c.name !== 'Read' || !markdownPath(c.target) || !c.resultAt || c.isError || c.hidden || !c.output) return pre(c.output || '未观察到返回结果');
  // Claude's Read output can carry display-only cat -n prefixes. Do not strip
  // unnumbered content or error output; they are not file contents.
  const lines = c.output.split('\n');
  const numbered = lines.some(line => /^\s*\d+(?:→|\t)/.test(line));
  const body = numbered ? lines.map(line => line.replace(/^\s*\d+(?:→|\t)/, '')).join('\n') : c.output;
  return markdown(body, true);
}
const notice = text => `<div class="detail-notice">${esc(text)}</div>`;
const meta = rows => `<dl class="detail-meta">${rows.map(([k,v]) => `<dt>${esc(k)}</dt><dd>${esc(v ?? '未提供')}</dd>`).join('')}</dl>`;
const tags = values => values.length ? `<div class="tag-list">${values.map(t => badge(t)).join('')}</div>` : '<span class="muted">未记录</span>';
function section(title, content, note = '') { return `<section class="content-section"><div class="section-label"><h3>${esc(title)}</h3>${note ? `<span>${esc(note)}</span>` : ''}</div>${content}</section>`; }
function action(kind, id, sessionId, body, cls = '') { return `<button class="content-card ${cls}" data-open="${kind}" data-id="${esc(id)}" aria-expanded="${selection?.kind===kind&&selection.id===id&&selection.sessionId===(sessionId||undefined)}" ${sessionId ? `data-sid="${esc(sessionId)}"` : ''}>${body}</button>`; }
function render() {
  const list = $('#record-list');
  $('#project-name').textContent = data.project.name; $('#project-name').title = data.project.root;
  $('#page-title').textContent = pages[page][0]; $('#page-description').textContent = pages[page][1]; $('#section-title').textContent = pages[page][2];
  $('#last-scan').textContent = data.scannedAt ? '最后采集 ' + time(data.scannedAt) : '等待首次采集';
  const catalog = !!catalogKinds[page];
  $('#scope-label').textContent = catalog ? '项目级目录 · 不受会话筛选影响 · 不等于已加载或已连接' : selectedSession ? `会话 ${short(selectedSession)} · 本机原生记录` : '全部会话 · 各自独立归属';
  $('#workspace').classList.toggle('catalog-view', catalog);
  $('#workspace').classList.toggle('detail-open', !!selection);
  $('#workspace').dataset.view = page;
  $('#session-total').textContent = data.sessions.length;
  $('#all-sessions').classList.toggle('selected', !selectedSession);
  document.querySelectorAll('[data-page]').forEach(b => { b.classList.toggle('active', b.dataset.page === page); b.setAttribute('aria-current', b.dataset.page === page ? 'page' : 'false'); });
  stableMarkup($('#sessions'), data.sessions.map((s, i) => `<button class="session-card ${s.id === selectedSession ? 'selected' : ''}" data-session="${esc(s.id)}" aria-pressed="${s.id === selectedSession}"><div class="session-name">会话 ${String(i + 1).padStart(2,'0')} <span>↗</span></div><div class="session-title">${esc(s.title || short(s.id))}</div><div class="session-id" title="${esc(s.id)}">${esc(short(s.id))}</div><div class="session-meta"><span>${esc(s.status)}</span><span>${time(s.lastSeenAt)}</span></div></button>`).join('') || '<p class="no-sessions">尚未发现此项目的 CC 会话。</p>');
  const actors = sessions().flatMap(s => s.actors), taskCount = sessions().reduce((n,s) => n + s.turnCount, 0);
  let metrics = [['已登记会话', data.sessions.length], ['Agent 实例', actors.length], ['用户任务', taskCount]];
  if (catalog) {
    const items = (data.catalog || []).filter(i => i.kind === catalogKinds[page]);
    metrics = [['项目目录条目', items.length], [page === 'skills' ? '去重技能名称' : '定义来源', page === 'skills' ? new Set(items.map(i=>i.name)).size : new Set(items.map(i=>i.origin)).size], ['会话过滤', '不适用']];
  } else if (page === 'changes') metrics = [['工具修改请求', sessions().reduce((n,s)=>n+s.changeCount,0)], ['工作区文件', data.worktree?.files?.length || 0], ['归因方式', '分开展示']];
  else if (page === 'logs') metrics = [['会话', data.sessions.length], ['Hook 活动', data.events.length], ['可读证据源', data.sources.filter(s=>s.available).length]];
  else if (page === 'reviews') metrics = [['会话', data.sessions.length], ['决策 / 变更记录', sessions().reduce((n,s)=>n+s.reviewCount,0)], ['执行入口', 'CC CLI']];
  for (let i=0;i<3;i++) { $(`#metric-${['one','two','three'][i]}`).textContent=metrics[i][0]; $(`#${['session-count','event-count','source-count'][i]}`).textContent=number(metrics[i][1]); }
  $('.error-filter').hidden = page !== 'logs';
  $('#search').placeholder = catalog ? '搜索名称、职责、用途或来源' : page === 'tasks' ? '搜索会话与任务内容' : '搜索当前页面记录';
  stableMarkup(list, catalog ? renderCatalog() : page === 'overview' ? renderOverview() : page === 'tasks' ? renderTasks() : page === 'changes' ? renderChanges() : page === 'reviews' ? renderReviews() : renderLogs());
  $('#coverage').textContent = [data.scanError, data.native?.error, data.coverage, data.native?.limited ? '原生记录达到读取上限或含未完成行，当前展示不完整。' : '', data.limited ? '文件采集达到上限。' : ''].filter(Boolean).join(' ');
}
function usageBlock(a) {
  const u = a.usage || {};
  return `<div class="usage-grid"><div><small>输入</small><b>${number(u.input_tokens)}</b></div><div><small>输出</small><b>${number(u.output_tokens)}</b></div><div><small>缓存读取</small><b>${number(u.cache_read_input_tokens)}</b></div><div><small>缓存写入</small><b>${number(u.cache_creation_input_tokens)}</b></div></div>`;
}
function actorCard(a) {
  return action('actor', a.id, a.sessionId, `<div class="card-top"><span class="avatar">${esc(a.type.slice(0,2).toUpperCase())}</span><div><h3>${esc(a.type)}</h3><small>${esc(a.id === 'main' ? '主会话' : short(a.id))}</small></div>${badge(a.status)}</div><p class="card-description">${esc(a.summary)}</p>${usageBlock(a)}<div class="card-bottom"><span>${a.tools.length} 工具 · ${a.skills.length} Skills · ${a.mcp.length} MCP 调用名</span><span>查看执行 ↗</span></div>`, 'agent-card');
}
function edgeList(edges) {
  return edges.length ? `<div class="edge-list">${edges.map(e => `<div class="edge"><span class="node-tag">${esc(e.from)}</span><span class="edge-arrow">${e.kind === 'message' ? '⇢' : '→'}</span><span class="node-tag">${esc(e.to)}</span><span>${esc(e.label)}</span>${!e.confirmed ? badge('仅派发请求，子实例未关联') : ''}</div>`).join('')}</div>` : '<p class="inline-empty">当前记录没有可确认的 Agent 派发或消息，不推测协作链路。</p>';
}
function renderOverview() {
  return sessions().filter(s=>matches(s)).map(s => section(s.title || '会话 ' + short(s.id), `<div class="cards-grid">${s.actors.map(actorCard).join('')}</div><details class="collaboration" data-expand="${esc(s.id)}"><summary>协作链路 <span>${s.edges.length} 条已记录关系 · 点击展开</span></summary>${edgeList(s.edges)}</details>`, `${short(s.id)} · ${s.status}${s.partial ? ' · 记录不完整' : ''}`)).join('') || empty('尚无可展示的 Agent 实例', '读取此项目 CC 会话记录，或启动已接入 Hook 的 CC。团队定义请到“团队与配置”查看。');
}
function renderTasks() {
  let html = '';
  for (const s of sessions()) {
    const turns = s.turns.filter(t=>matches([t,s.id]));
    if (!turns.length) continue;
    html += section(`会话 ${short(s.id)}`, turns.map((t,i) => action('task',t.id,s.id, `<div class="card-top"><span class="task-index">${String(i+1).padStart(2,'0')}</span><span>${date(t.timestamp)}</span>${badge('用户任务')}</div><p class="task-prompt">${esc(t.prompt)}</p><div class="card-bottom"><span>${s.edges.filter(e=>e.turnId===t.id).length} 协作关系 · ${s.changes.filter(c=>c.turnId===t.id).length} 修改请求</span><span>展开对话与操作 ↗</span></div>`, 'task-card')).join(''), `${s.turnCount} 条任务${s.partial ? ' · 部分记录' : ''}`);
  }
  return html || empty('未找到用户任务正文', data.native?.error || '旧 Hook 只记录链路；需要此项目的 CC 原生会话记录才能展示实际任务。');
}
function renderChanges() {
  const changes = sessions().flatMap(s=>s.changes).filter(matches).sort((a,b)=>(b.timestamp||'').localeCompare(a.timestamp||''));
  const recorded = changes.map(c=>action('change',c.id,c.sessionId,`<div class="card-top"><h3 class="file-name">${esc(c.file)}</h3>${badge(c.confirmed ? 'CC 报告完成' : c.status, !c.confirmed)}</div><div class="card-bottom"><span>${esc(c.tool)} · ${esc(c.actorId)} · ${short(c.sessionId)}</span><span>${time(c.timestamp)} · 查看片段 ↗</span></div>`,'change-card')).join('') || '<p class="inline-empty">此范围没有 Edit / Write 等修改请求。Read 等文件读取在任务的“工具”中查看。</p>';
  const files = (data.worktree?.files || []).filter(matches);
  return section('会话中的文件修改', recorded, `${changes.length} 条 · 通过 CC 调用 ID 归属`) + section('当前 Git 工作区', notice(data.worktree?.note || '') + (files.map(f=>action('worktree',f.id,null,`<div class="card-top">${badge(f.status)}<h3 class="file-name">${esc(f.file)}</h3></div><div class="card-bottom"><span>项目共享差异 · 不归因到当前会话</span><span>查看 diff ↗</span></div>`)).join('') || `<p class="inline-empty">${esc(data.worktree?.error || '没有可展示的工作区差异')}</p>`), '始终为项目级，不受会话过滤影响');
}
function renderReviews() {
  const items = sessions().flatMap(s=>s.reviews).filter(matches).sort((a,b)=>(b.timestamp||'').localeCompare(a.timestamp||''));
  return section('需要核对的决策记录', notice('本页不批准、不拒绝、不执行。历史上出现请求不等于当前仍等待；没有明确关联结果时显示未知。') + (items.map(r=>action('review',r.id,r.sessionId,`<div class="card-top">${badge(r.kind)}<span>${time(r.timestamp)}</span></div><h3>${esc(r.title)}</h3><p class="card-description">${esc(r.status)}</p><div class="card-bottom"><span>${esc(r.actorId)} · ${short(r.sessionId)}</span><span>查看依据 ↗</span></div>`,'review-card')).join('') || empty('尚无权限请求或任务修改记录', '新权限请求由 PermissionRequest / Notification Hook 记录；提问、计划确认和任务修改来自 CC 工具日志。'))) + sourceGroup('已有项目审查文件', data.sources.filter(s=>s.category==='review'&&matches(s)));
}
function renderCatalog() {
  const items=(data.catalog||[]).filter(i=>i.kind===catalogKinds[page]&&matches(i));
  return `<div class="catalog-intro">${page==='config' ? '点击卡片查看职责、工作边界和 CC 主定义。这里的 Agent 是配置名册，不代表全部正在运行。' : page==='skills' ? '按安装文件计数，同名 Skill 在多个 Agent 下可能有多个副本；目录不代表全部已被 CC 激活。' : page==='mcp' ? '只读配置，不启动 MCP、不做网络探测；环境变量与请求头仅展示名称，凭据隐藏。' : '规则来自当前 playbook 的工作流组合表，不硬编码 12 个模拟状态。'}</div><div class="cards-grid catalog-grid">${items.map(i=>action('catalog',i.id,null,`<div class="card-top"><span class="catalog-symbol">${{agent:'◫',skill:'✧',mcp:'⌘',workflow:'⇢'}[i.kind]}</span>${badge(i.kind==='skill'?i.owner:i.kind==='mcp'?i.type:i.origin)}</div><h3>${esc(i.name)}</h3><p class="card-description">${esc(i.purpose||i.description)}</p>${i.kind==='workflow'?`<div class="workflow-path">${i.actors.map(a=>`<span>${esc(a)}</span>`).join('<i>→</i>')}</div>`:''}<div class="card-bottom"><span>${esc(i.kind==='mcp'?i.connection:i.source)}</span><span>详情 ↗</span></div>`, 'catalog-card')).join('')}</div>${!items.length?empty('没有匹配的目录条目'):''}`;
}
function visibleEvents() { return (data.events||[]).filter(e=>matches([e,eventNames[e.event]])&&(!$('#errors-only').checked||failed(e))); }
function eventRow(e) { return `<button class="event-row ${failed(e)?'failure':''}" data-open="event" data-id="${esc(e.id)}"><span class="event-time">${time(e.observedAt)}</span><span class="event-node"></span><span><span class="event-title"><strong>${esc(eventNames[e.event]||e.event)}</strong>${e.tool?badge(e.tool,failed(e)):''}</span><span class="event-detail">${esc(e.agentType||'CC')} / ${short(e.sessionId)}${e.target?' · '+esc(e.target):''}</span></span></button>`; }
function sourceGroup(title, sources) { return sources.length ? section(title,sources.map(s=>action('evidence',s.id,null,`<div class="card-top"><h3>${esc(s.source.split('/').pop())}</h3>${badge(s.available?'文件观测':'来源不可用')}</div><small>${esc(s.source)}</small>`,'source-row')).join(''),'项目共享 · 不推断会话归属') : ''; }
function renderLogs() { const events=visibleEvents();return (events.length?`<div class="day-label">HOOK EVENTS / ${events.length} 条 · 展示最近 200 条</div>`+events.slice(0,200).map(eventRow).join(''):empty('没有匹配的活动'))+(!$('#errors-only').checked?sourceGroup('项目日志',data.sources.filter(s=>s.category==='log'&&matches(s))):''); }

async function openDetail(kind,id,sessionId) {
  if(selection?.kind===kind&&selection.id===id&&selection.sessionId===sessionId)return;
  selection={kind,id,sessionId}; detailTab='conversation'; detailData=null; render();
  stableMarkup($('#inspector'),'<p class="inline-empty" role="status">读取真实记录……</p>');
  $('.inspector').scrollTop=0;
  await loadDetail();
}
async function loadDetail(quiet=false) {
  if(!selection)return;
  const current=++detailGeneration, chosen=selection;
  try {
    const item=chosen.sessionId?await api('/api/session/'+encodeURIComponent(chosen.sessionId)):chosen.kind==='event'?data.events.find(e=>e.id===chosen.id):await api(`/api/${chosen.kind}/${encodeURIComponent(chosen.id)}`);
    if(current!==detailGeneration||selection!==chosen)return;
    if(!item)throw Error('此记录已不在留存范围内');
    const scroll=$('.inspector').scrollTop;
    if(quiet&&JSON.stringify(item)===JSON.stringify(detailData))return;
    detailData=item; renderDetail(); if(quiet)$('.inspector').scrollTop=scroll;
  } catch(e) { if(current===detailGeneration&&!quiet)stableMarkup($('#inspector'),notice(e.message)); }
}
function detailHeading(title, info='') { $('#detail-title').textContent='记录详情'; return `<div class="detail-heading"><h3>${esc(title)}</h3>${info?`<p>${esc(info)}</p>`:''}</div>`; }
function callView(c) { return `<details class="tool-call" data-expand="call:${esc(c.id)}"><!-- public tool record --><summary data-expand="call:${esc(c.id)}">${badge(c.name)} <span>${esc(c.target||c.input.description||c.input.skill||c.id)}</span> <small>${esc(c.status)}</small></summary>${meta([['Agent',c.actorId],['时间',date(c.timestamp)],['来源',c.source],['调用 ID',c.toolUseId]])}<h4>工具输入</h4>${pre(c.input)}<h4>CC 返回</h4>${toolOutput(c)}</details>`; }
function patchView(c) { return notice(c.note)+meta([['文件',c.file],['状态',c.status],['工具',c.tool],['会话 / Agent',`${c.sessionId} / ${c.actorId}`]])+(c.patches.length?c.patches.map(p=>`<div class="diff-pair"><section><h4>修改前 ${p.before===null?'· 未提供完整基线':''}</h4>${pre(p.before??'没有记录修改前内容，不推测或伪造。','diff-before')}</section><section><h4>修改后 ${!c.confirmed?'· 请求内容，未确认落盘':''}</h4>${pre(p.after??'未提供','diff-after')}</section></div>`).join(''):notice('敏感或项目外文件的内容已隐藏。')); }
function renderDetail() {
  if(!selection||!detailData)return;
  const {kind,id}=selection,d=detailData;
  let html='';
  if(kind==='catalog') {
    html=detailHeading(d.name,d.source)+notice(d.note||'这是当前磁盘定义，不等同某次会话实际加载的配置。');
    if(d.kind==='workflow')html+=section('声明的协作组合',`<div class="workflow-path large">${d.actors.map(a=>`<span>${esc(a)}</span>`).join('<i>→</i>')}</div>`)+meta([['适用场景',d.description],['调度方式',d.dispatch],['检查关口',Object.entries(d.gates).map(([k,v])=>k+': '+v).join(' / ')],['产出物',d.outputs]]);
    if(d.kind==='agent')html+=meta([['角色 ID',d.agentType],['模型',d.model||'未显式指定'],['工具权限',d.tools||'查看定义正文']]);
    html+=d.kind==='mcp'?pre(d.content):markdown(d.content,true);
    if(d.runtimeContent)html+=`<details class="tool-call" data-expand="runtime:${esc(d.id)}"><summary data-expand="runtime:${esc(d.id)}">查看 CC 实际主定义 ${esc(d.runtimeSource)}</summary>${fileContent(d.runtimeContent,d.runtimeSource)}</details>`;
  } else if(kind==='worktree') html=detailHeading(d.file,'当前工作区 · 不能自动归因到会话')+notice(data.worktree.note)+pre(d.diff,'git-diff');
  else if(kind==='event')html=detailHeading(eventNames[d.event]||d.event,'Hook 元信息')+meta([['会话',d.sessionId],['Agent',d.agentId||'未提供'],['角色',d.agentType||'未提供'],['工具',d.tool],['目标',d.target],['观测时间',date(d.observedAt)],['调用 ID',d.toolUseId||'未提供']])+notice('完整对话、工具输入输出在“任务记录”查看。此处保留原始活动回溯。');
  else if(kind==='evidence') {
    html=detailHeading(d.source,'已留存项目证据')+meta([['观测时间',date(d.observedAt)],['版本',d.version?.slice(0,20)],['范围','项目共享，未确定会话归属']])+fileContent(d.content,d.source);
    const previous=data.snapshots.find(s=>s.source===d.source&&s.version===d.previousVersion);
    if(previous)html+=`<button class="text-button" data-previous="${esc(previous.id)}">查看上一留存版本</button><div id="previous-version"></div>`;
  } else if(kind==='change') {
    const c=d.changes.find(c=>c.id===id);html=c?detailHeading(c.file,'CC 修改片段')+patchView(c):empty('修改记录已不在覆盖范围');
  } else if(kind==='review') {
    const r=d.reviews.find(r=>r.id===id);html=r?detailHeading(r.title,r.kind)+notice(r.note)+meta([['当前证据结论',r.status],['来源',r.source],['Agent',r.actorId],['时间',date(r.timestamp)]])+'<h4>请求 / 任务变更</h4>'+pre(r.input)+'<h4>已记录结果</h4>'+pre(r.output||'无可确认结果；请在 CC CLI 查看与决策。'):empty('此决策记录尚未采集');
  } else if(kind==='actor') {
    const a=d.actors.find(a=>a.id===id);
    if(a)html=detailHeading(a.type,`${a.id} · ${a.status}`)+usageBlock(a)+notice(a.usageCoverage+'；— 表示未提供，不是 0。')+meta([['当前 / 最近动作',a.summary],['上级 Agent',a.parentId||'未关联 / 主会话'],['来源',a.source]])+section('实际 Skill 工具调用',tags(a.skills))+section('读取过的 Skill 文档',tags(a.skillReads),'读取不等同技能激活')+section('实际 MCP 调用',tags(a.mcp))+section('全部工具',tags(a.tools))+section('此 Agent 的公开对话',conversation(d.messages.filter(m=>m.actorId===id)))+section('工具操作',d.calls.filter(c=>c.actorId===id).map(callView).join(''));
  } else if(kind==='task') {
    const t=d.turns.find(t=>t.id===id);
    if(t) {
      const calls=d.calls.filter(c=>c.turnId===id),messages=d.messages.filter(m=>m.turnId===id),changes=d.changes.filter(c=>c.turnId===id),edges=d.edges.filter(e=>e.turnId===id);
      html=detailHeading('任务对话与执行',`${short(d.id)} · ${date(t.timestamp)}`)+`<div class="detail-tabs">${[['conversation','对话',messages.length],['collaboration','协作',edges.length],['tools','工具',calls.length],['changes','文件',changes.length]].map(([key,label,n])=>`<button data-detail-tab="${key}" class="${detailTab===key?'active':''}">${label} ${n}</button>`).join('')}</div>`;
      if(detailTab==='conversation')html+=conversation(messages);
      if(detailTab==='collaboration')html+=edgeList(edges)+notice('仅按 CC 返回的 agentId 关联子会话。无法关联的子 Agent 可在概览中单独查看，不强行分配到本任务。');
      if(detailTab==='tools')html+=calls.map(callView).join('')||empty('没有工具调用');
      if(detailTab==='changes')html+=changes.map(c=>section(c.file,patchView(c))).join('')||empty('这条任务没有记录文件修改');
      html+=notice(d.note+(d.partial?' 当前记录已截断或有未完成行。':''));
    }
  }
  stableMarkup($('#inspector'),`<div class="detail-body">${html||empty('记录暂不可用')}</div>`);
}
function conversation(messages) {
  return messages.length?`<div class="conversation">${messages.map(m=>`<article class="chat-message ${m.role==='user'?'user-message':''}"><div class="chat-meta"><strong>${esc(m.role==='user'?'用户':m.role==='assignment'?'派发任务':m.actorId==='main'?'主 Agent':m.actorId)}</strong><span>${time(m.timestamp)}</span></div>${markdown(m.text,false,'chat-text')}</article>`).join('')}</div>`:empty('没有公开对话文本','隐藏思考、系统注入与图片二进制不展示。工具操作请切换到“工具”。');
}
function clearDetail() { ++detailGeneration; selection=null; detailData=null; if(data)render(); }
document.addEventListener('click',async event=>{
  const nav=event.target.closest('[data-page]');
  if(nav&&nav.dataset.page!==page){page=nav.dataset.page;$('#search').value='';$('#errors-only').checked=false;clearDetail();writeLocation();$('#record-list').scrollTop=0;}
  const session=event.target.closest('[data-session]');if(session)chooseSession(session.dataset.session);
  const item=event.target.closest('[data-open]');if(item&&item.dataset.id)openDetail(item.dataset.open,item.dataset.id,item.dataset.sid);
  const tab=event.target.closest('[data-detail-tab]');if(tab){detailTab=tab.dataset.detailTab;renderDetail();}
  const previous=event.target.closest('[data-previous]');if(previous){const current=detailGeneration;try{const old=await api('/api/evidence/'+previous.dataset.previous);if(current===detailGeneration)$('#previous-version').innerHTML=fileContent(old.content,old.source);}catch{if(current===detailGeneration)$('#previous-version').textContent='上一版本已不可用';}}
});
function chooseSession(value){if(selectedSession===value)return;selectedSession=value;++generation;busy=false;clearDetail();if(data){data={...data,events:[],native:{...data.native,sessions:[]}};render();}writeLocation();refresh();}
$('#all-sessions').onclick=()=>chooseSession('');$('#close-detail').onclick=clearDetail;$('#refresh').onclick=refresh;
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&selection){const chosen=selection;clearDetail();[...document.querySelectorAll('[data-open]')].find(el=>el.dataset.open===chosen.kind&&el.dataset.id===chosen.id&&el.dataset.sid===chosen.sessionId)?.focus({preventScroll:true});}});
$('#search').oninput=()=>data&&render();$('#errors-only').onchange=()=>data&&render();
$('#export').onclick=()=>{if(!data)return;const exportData={exportedAt:new Date().toISOString(),project:data.project.name,page,session:catalogKinds[page]?null:selectedSession||null,coverage:data.coverage,records:page==='logs'?visibleEvents():catalogKinds[page]?(data.catalog||[]).filter(i=>i.kind===catalogKinds[page]&&matches(i)):sessions()};const blob=new Blob([JSON.stringify(exportData,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='cc-radt-observer-view.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
refresh();setInterval(()=>{if(!document.hidden)refresh();},2500);
