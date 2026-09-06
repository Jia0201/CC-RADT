const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const time = value => value ? new Date(value).toLocaleTimeString('zh-CN', { hour12: false }) : '未记录';
const fullTime = value => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '未记录';
const short = value => value ? value.slice(0, 10) : '未关联';
const params = new URLSearchParams(location.hash.slice(1));
let key = params.get('key') || sessionStorage.getItem('cc-radt-observer-key') || '';
if (params.has('key')) sessionStorage.setItem('cc-radt-observer-key', key);
let selectedSession = params.get('session') || '';
let page = params.get('page') || 'overview';
let data;
let selection = null;
let requestId = 0;
let evidenceRequest = 0;
let busy = false;
const pages = {
  overview: ['概览与会话', '让执行过程有迹可循。按会话查看活动，再沿证据回溯。', '活动时间线'],
  tasks: ['任务记录', '任务单是事实来源。这里阅读计划与状态，不创建或调度任务。', '项目任务档案'],
  logs: ['活动日志', '从一次工具活动开始，检查关联记录与已留存的源日志。', '可回溯记录'],
  reviews: ['证据与审查', '查看已经记录的审查意见与交接证据。决定仍在 CC CLI 中完成。', '审查与交接文件'],
  config: ['团队与配置', '读取角色定义与已观测的版本。磁盘配置不等于会话实际加载状态。', '角色定义档案'],
};
const eventNames = { SessionStart: '会话进入', SessionEnd: '会话结束', UserPromptSubmit: '用户请求进入', PreToolUse: '工具调用开始', PostToolUse: '工具调用完成', PostToolUseFailure: '工具调用失败', PermissionDenied: '权限被拒绝', SubagentStart: '子 Agent 进入', SubagentStop: '子 Agent 输出结束', TaskCompleted: '任务完成事件', Stop: '本轮输出结束', StopFailure: '本轮输出异常', Notification: 'CC 通知事件', SourceObserved: '首次观测到文件', SourceChanged: '观测到文件变化' };
const failed = item => ['PostToolUseFailure', 'PermissionDenied', 'StopFailure'].includes(item.event);
if (!pages[page]) page = 'overview';

function writeLocation() {
  const p = new URLSearchParams({ page });
  if (selectedSession) p.set('session', selectedSession);
  history.replaceState(null, '', '#' + p);
}
writeLocation();

async function api(url) {
  const response = await fetch(url, { headers: { Authorization: 'Bearer ' + key }, cache: 'no-store' });
  if (!response.ok) { const error = new Error(response.status === 401 ? '请重新使用 CC 提示的完整链接' : '观察服务暂不可用'); error.status = response.status; throw error; }
  return response.json();
}

async function refresh() {
  if (busy) return;
  busy = true;
  const id = ++requestId;
  try {
    const result = await api('/api/state?session=' + encodeURIComponent(selectedSession));
    if (id !== requestId) return;
    data = result;
    $('#locked').hidden = true;
    $('#workspace').hidden = false;
    $('#connection').textContent = !data.scannedAt ? '等待首次采集' : data.scanError ? '部分采集异常' : '观察服务已连接';
    $('#connection-dot').classList.toggle('offline', !!data.scanError);
    render();
  } catch (error) {
    if (id !== requestId) return;
    $('#connection').textContent = error.message;
    $('#connection-dot').classList.add('offline');
    if (!data || error.status === 401) { $('#locked').hidden = false; $('#workspace').hidden = true; }
  } finally { busy = false; }
}

function matches(text) { return text.toLowerCase().includes($('#search').value.trim().toLowerCase()); }
function visibleEvents() { return (data?.events || []).filter(item => matches([item.event, eventNames[item.event], item.sessionId, item.agentId, item.agentType, item.tool, item.target, item.taskId].join(' ')) && (!$('#errors-only').checked || failed(item))); }
function visibleSources() {
  return (data?.sources || []).filter(item => {
    const correct = page === 'tasks' ? item.category === 'task' : page === 'config' ? item.category === 'config' : page === 'reviews' ? item.category === 'review' || item.source.startsWith('shared/handoffs/') : page === 'logs' ? item.category === 'log' : item.category === 'state';
    return correct && matches(item.source) && !$('#errors-only').checked;
  });
}

function render() {
  $('#project-name').textContent = data.project.name;
  $('#project-name').title = data.project.root;
  $('#page-title').textContent = pages[page][0];
  $('#page-description').textContent = pages[page][1];
  $('#section-title').textContent = pages[page][2];
  $('#scope-label').textContent = ['tasks', 'reviews', 'config'].includes(page) ? '项目共享文件 · 不推测会话归属' : selectedSession ? '会话 ' + short(selectedSession) + ' · 项目文件仍为共享证据' : '全部会话 · 项目共享证据单独列出';
  $('#last-scan').textContent = data.scannedAt ? '最后成功采集 ' + time(data.scannedAt) : '首次采集尚未完成';
  $('#session-count').textContent = data.sessions.length;
  $('#session-total').textContent = data.sessions.length;
  $('#event-count').textContent = data.events.length;
  $('#source-count').textContent = data.sources.filter(item => item.available).length;
  $('#all-sessions').classList.toggle('selected', !selectedSession);
  document.querySelectorAll('[data-page]').forEach(item => { item.classList.toggle('active', item.dataset.page === page); item.setAttribute('aria-current', item.dataset.page === page ? 'page' : 'false'); });
  $('#sessions').innerHTML = data.sessions.map((s, i) => `<button class="session-card ${s.id === selectedSession ? 'selected' : ''}" data-session="${escapeHTML(s.id)}" aria-pressed="${s.id === selectedSession}"><div class="session-name">会话 ${String(i + 1).padStart(2, '0')} <span class="muted">↗</span></div><div class="session-id" title="${escapeHTML(s.id)}">${escapeHTML(s.id)}</div><div class="session-meta"><span class="session-state">${escapeHTML(s.status)}</span><span>${time(s.lastSeenAt)}</span></div></button>`).join('') || '<p class="no-sessions">尚无 CC 会话记录。<br>下一次启动 CC 后，已接入的会话会出现在这里。</p>';
  let html = '';
  if (['overview', 'logs'].includes(page)) {
    const events = visibleEvents();
    if (events.length) html += `<div class="day-label">HOOK EVENTS / 观测时间 · ${events.length} 条${events.length > 200 ? '（展示最近 200 条；搜索覆盖留存记录）' : ''}</div>` + events.slice(0, 200).map(eventRow).join('');
    else html += empty($('#search').value || $('#errors-only').checked ? '没有匹配的活动' : '等待 CC 的下一次活动', '这里不会模拟在线 Agent。启动 CC、调用工具或结束会话后，真实的 Hook 元信息会出现在时间线上。');
  }
  const sources = visibleSources();
  if (sources.length) html += `<div class="source-group-label">项目共享文件 / ${sources.length} 份 · 不受会话筛选影响</div>` + sources.map(sourceRow).join('');
  else if (!['overview', 'logs'].includes(page)) html += empty('尚未发现可读取的记录', '只展示真实文件；模板、索引与未产生的历史不会用演示数据填充。');
  $('#record-list').innerHTML = html;
  $('#coverage').textContent = (data.scanError ? data.scanError + '。' : '') + data.coverage + (data.limited ? ' 本轮达到采集上限，部分来源未覆盖。' : '') + ` 留存上限：${data.retention.days} 天 / ${data.retention.events} 条活动 / ${data.retention.snapshots} 份文件快照。`;
}

function empty(title, description) { return `<div class="empty"><span class="empty-icon">⌁</span><h3>${escapeHTML(title)}</h3><p>${escapeHTML(description)}</p></div>`; }
function eventRow(e) {
  return `<button data-event="${escapeHTML(e.id)}" class="event-row ${failed(e) ? 'failure' : ''} ${selection === e.id ? 'selected' : ''}"><span class="event-time">${time(e.observedAt)}</span><span class="event-node"></span><span><span class="event-title"><strong>${escapeHTML(eventNames[e.event] || e.event)}</strong>${e.tool ? `<span class="badge ${failed(e) ? 'error' : ''}">${escapeHTML(e.tool)}</span>` : ''}</span><span class="event-detail">${escapeHTML(e.agentType || 'CC')} / ${escapeHTML(short(e.sessionId))}${e.target ? ' · ' + escapeHTML(e.target) : ''}</span></span></button>`;
}
function sourceRow(s) {
  return `<button data-evidence="${escapeHTML(s.id || '')}" class="source-row ${selection === s.id ? 'selected' : ''}" ${s.id ? '' : 'disabled'}><span class="source-title"><span>${escapeHTML(s.source.split('/').pop())}</span><span class="badge snapshot">${s.available ? '文件观测' : '来源不可用'}</span></span><span class="source-path">${escapeHTML(s.source)}</span><div class="source-time">${s.observedAt ? '内容观测于 ' + fullTime(s.observedAt) : escapeHTML(s.error)}${s.truncated ? ' · 内容截断' : ''}</div></button>`;
}

function showEvent(id) {
  ++evidenceRequest;
  selection = id;
  const e = data.events.find(item => item.id === id);
  if (!e) return;
  render();
  const meta = [['会话', e.sessionId], ['事件', e.event], ['观测时间', fullTime(e.observedAt)], ['来源时间', '未提供'], ['Agent ID', e.agentId || '未提供'], ['角色', e.agentType || '未提供'], ['任务 ID', e.taskId || '未关联'], ['工具', e.tool || '—'], ['工具调用 ID', e.toolUseId || '未提供'], ['目标', e.target || '未采集'], ['启动来源', e.source || '—']];
  $('#inspector').innerHTML = `<div class="evidence-detail"><div class="detail-eyebrow">HOOK METADATA / READ ONLY</div><h3>${escapeHTML(eventNames[e.event] || e.event)}</h3>${metadata(meta)}<div class="detail-notice">这是 Hook 到达时保存的活动元信息，不是完整命令、模型思考或聊天记录。工具失败不等于整个任务失败。</div><div class="detail-actions"><button id="copy-event">复制记录引用</button></div></div>`;
  $('#copy-event').onclick = () => copyText(`${data.project.name} / session ${e.sessionId} / event ${e.id} / ${e.observedAt}`);
}
function metadata(items) { return '<dl class="detail-meta">' + items.map(([k, v]) => `<dt>${escapeHTML(k)}</dt><dd>${escapeHTML(v)}</dd>`).join('') + '</dl>'; }

async function showEvidence(id) {
  selection = id;
  const current = ++evidenceRequest;
  render();
  $('#inspector').innerHTML = '<div class="evidence-detail muted">读取已留存证据……</div>';
  try {
    const e = await api('/api/evidence/' + encodeURIComponent(id));
    if (current !== evidenceRequest) return;
    const previous = data.snapshots.find(item => item.source === e.source && item.version === e.previousVersion);
    $('#inspector').innerHTML = `<div class="evidence-detail"><div class="detail-eyebrow">OBSERVED FILE / SANITIZED</div><h3>${escapeHTML(e.source.split('/').pop())}</h3>${metadata([['来源', e.source], ['观测时间', fullTime(e.observedAt)], ['文件 mtime', fullTime(e.mtime)], ['版本哈希', e.version?.slice(0, 20)], ['关联范围', '项目共享 · 会话归属未知']])}<div class="detail-notice">文件观测时间不是业务发生时间。${e.truncated ? '文件超过读取上限，以下为截断内容。' : '内容已做规则脱敏，仍应注意项目隐私。'}${e.category === 'config' ? ' 未核实该版本是否被某次会话实际加载。' : ''}</div><pre class="evidence-content" id="evidence-text"></pre><div class="detail-actions"><button id="copy-evidence">复制来源引用</button>${previous ? '<button id="compare">对照上一留存版本</button>' : ''}</div><div id="previous-version"></div></div>`;
    $('#evidence-text').textContent = e.content;
    $('#copy-evidence').onclick = () => copyText(`${data.project.name} / ${e.source} / version ${e.version} / observed ${e.observedAt}`);
    if (previous) $('#compare').onclick = async () => {
      try {
        const old = await api('/api/evidence/' + encodeURIComponent(previous.id));
        if (current !== evidenceRequest) return;
        $('#previous-version').innerHTML = '<h3 class="previous-label">上一留存版本（文本对照，不推断任务归属）</h3><pre class="evidence-content"></pre>';
        $('#previous-version pre').textContent = old.content;
      } catch { if (current === evidenceRequest) $('#previous-version').textContent = '上一版本已超出留存范围。'; }
    };
  } catch (error) { if (current === evidenceRequest) $('#inspector').innerHTML = `<div class="evidence-detail notice-error">${escapeHTML(error.message)}</div>`; }
}
async function copyText(text) { try { await navigator.clipboard.writeText(text); } catch { $('#connection').textContent = '浏览器未允许复制，请手动选择内容'; } }

document.addEventListener('click', event => {
  const nav = event.target.closest('[data-page]');
  if (nav) { page = nav.dataset.page; ++evidenceRequest; selection = null; $('#inspector').innerHTML = '<div class="inspector-empty"><h3>选择记录查看对应证据</h3></div>'; $('#errors-only').checked = false; $('#search').value = ''; writeLocation(); if (data) render(); }
  const session = event.target.closest('[data-session]');
  if (session) chooseSession(session.dataset.session);
  const item = event.target.closest('[data-event]');
  if (item) showEvent(item.dataset.event);
  const source = event.target.closest('[data-evidence]');
  if (source?.dataset.evidence) showEvidence(source.dataset.evidence);
});
function chooseSession(value) {
  if (selectedSession === value) return;
  selectedSession = value;
  ++requestId;
  busy = false;
  ++evidenceRequest;
  selection = null;
  if (data) { data = { ...data, events: [], agents: [] }; render(); }
  $('#inspector').innerHTML = '<div class="inspector-empty"><h3>选择此会话的记录查看详情</h3></div>';
  writeLocation();
  refresh();
}
$('#all-sessions').onclick = () => chooseSession('');
$('#refresh').onclick = refresh;
$('#search').addEventListener('input', () => data && render());
$('#errors-only').addEventListener('change', () => data && render());
$('#export').onclick = () => {
  const events = ['overview', 'logs'].includes(page) ? visibleEvents() : [];
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), project: data.project.name, session: selectedSession || null, coverage: data.coverage, events, sources: visibleSources() }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = 'cc-radt-observer-view.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
refresh();
setInterval(() => { if (!document.hidden) refresh(); }, 2500);
