'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const asText = (value) => value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const setText = (id, value) => { $(id).textContent = asText(value); };
  const list = (value) => Array.isArray(value) ? value : [];
  const terminal = new Set(['idle', 'ready', 'planned', 'complete', 'completed', 'done', 'succeeded', 'applied', 'recovered', 'restored', 'rolled_back', 'aborted', 'failed', 'error', 'recovery_required', 'blocked']);
  const successful = new Set(['complete', 'completed', 'done', 'succeeded', 'applied', 'recovered', 'restored', 'rolled_back']);
  const labels = {
    idle: '等待创建升级计划', ready: '计划已就绪', planned: '计划已生成',
    planning: '正在扫描项目与包', applying: '正在执行升级', running: '后台操作进行中',
    preparing: '正在准备升级', backing_up: '正在保护并核对原安装', staging: '正在构建新版副本', switching: '正在切换安装',
    recovering: '正在恢复事务', recovery_required: '需要恢复事务，请勿启动项目写入任务',
    complete: '操作完成', completed: '操作完成', done: '操作完成', succeeded: '操作完成',
    applied: '升级完成', recovered: '事务恢复完成', restored: '原安装已恢复', rolled_back: '事务恢复完成', aborted: '操作已中止',
    failed: '操作失败，请检查后台报告', error: '后台报告错误', blocked: '操作已阻断',
  };
  let token = '';
  try {
    const fragment = new URLSearchParams(location.hash.slice(1));
    token = fragment.get('token') || sessionStorage.getItem('cc-radt-updater-token') || '';
    if (fragment.has('token')) {
      history.replaceState(null, '', location.pathname);
      sessionStorage.setItem('cc-radt-updater-token', token);
    }
  } catch {
    // Memory-only access still works when session storage is unavailable.
  }

  let plan = null;
  let snapshot = null;
  let connected = false;
  let polling = false;
  let submitting = false;
  let pollTimer;
  let generation = 0;
  let lastPlanJSON = '';
  let pathsDirty = false;
  const appliedPlans = new Set();
  const recoveredTransactions = new Set();

  const state = () => String(snapshot?.state || '').toLowerCase().replaceAll('-', '_');
  const busy = () => snapshot != null && !terminal.has(state());
  const needsRecovery = () => state() === 'recovery_required';
  const planReady = () => plan?.ready === true && !!plan?.id && !!plan?.baselineDigest && !!plan?.targetDigest && list(plan?.conflicts).length === 0;

  function resetConfirmations() {
    $('trust-source').checked = false;
    $('stopped-writers').checked = false;
    $('recover-stopped').checked = false;
  }

  function controls() {
    const locked = !connected || submitting || busy();
    $('path-fields').disabled = locked || needsRecovery();
    $('plan-button').textContent = submitting && !plan ? '正在扫描…' : '扫描并预览';
    const canApply = !locked && !needsRecovery() && planReady() && !appliedPlans.has(plan.id) && !successful.has(state());
    $('trust-source').disabled = !canApply;
    $('stopped-writers').disabled = !canApply;
    $('apply-button').disabled = !canApply || !$('trust-source').checked || !$('stopped-writers').checked;
    $('recovery-fields').disabled = locked;
    $('recover-button').disabled = locked || !$('transaction').value.trim() || !$('recover-stopped').checked || recoveredTransactions.has($('transaction').value.trim());
    $('refresh-button').disabled = !token || polling;
    setText('connection', connected ? '本机服务已连接' : token ? '连接未确认 · 写入已锁定' : '缺少本机访问凭据');
    $('connection').classList.toggle('offline', !connected);
    setText('apply-hint', appliedPlans.has(plan?.id) ? '此计划已经提交，请查询状态或重新扫描。' : needsRecovery() ? '先恢复未完成事务。' : '完成两项确认后才可执行。');
  }

  function showError(error) {
    $('error-banner').hidden = false;
    setText('error-detail', error.payload || error.message || error);
  }

  async function request(operation, body) {
    const response = await fetch('/api/' + operation, {
      method: 'POST', mode: 'same-origin', credentials: 'omit', cache: 'no-store', redirect: 'error',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) {
      const error = new Error(asText(payload?.error) || '本机请求失败');
      error.payload = payload;
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function rows(id, items, fields) {
    const fragment = document.createDocumentFragment();
    for (const item of items) {
      const row = document.createElement('tr');
      for (const field of fields) {
        const cell = document.createElement('td');
        cell.textContent = asText(item?.[field]);
        row.append(cell);
      }
      fragment.append(row);
    }
    $(id).replaceChildren(fragment);
  }

  function renderPlan(next) {
    if (!next || typeof next !== 'object' || Array.isArray(next)) return;
    const serialized = JSON.stringify(next);
    if (serialized === lastPlanJSON) return;
    lastPlanJSON = serialized;
    plan = next;
    pathsDirty = false;
    for (const id of ['project', 'baseline', 'package']) {
      if (typeof next[id] === 'string') $(id).value = next[id];
    }
    resetConfirmations();
    $('preview-section').hidden = false;
    setText('plan-project', next.project);
    setText('from-version', next.fromVersion || '未识别');
    setText('to-version', next.toVersion || '未识别');
    setText('preserved-count', next.preserved ?? 0);
    setText('action-count', list(next.actions).length);
    setText('conflict-count', list(next.conflicts).length);
    setText('baseline-digest', next.baselineDigest || '缺少指纹，不能执行');
    setText('target-digest', next.targetDigest || '缺少指纹，不能执行');
    setText('plan-readiness', planReady() ? '预览已通过内核检查。核对变更、包来源与停止写入条件后，可以执行升级。' : '此计划尚不可执行。请检查冲突、警告和完整计划，处理后重新扫描。');
    $('plan-readiness').classList.toggle('warn', !planReady());
    rows('actions', list(next.actions), ['path', 'kind', 'reason']);
    rows('conflicts', list(next.conflicts), ['path', 'reason']);
    $('conflicts-section').hidden = list(next.conflicts).length === 0;
    $('actions-section').hidden = list(next.actions).length === 0;
    $('warnings-section').hidden = list(next.warnings).length === 0;
    const warnings = list(next.warnings).map((warning) => {
      const item = document.createElement('li');
      item.textContent = asText(warning);
      return item;
    });
    $('warnings').replaceChildren(...warnings);
    $('migration-section').hidden = list(next.migrationPath).length === 0;
    setText('migration-path', list(next.migrationPath).map(asText).join(' → '));
    setText('plan-json', next);
    $('step-project').classList.remove('active');
    $('step-preview').classList.add('active');
  }

  function renderSnapshot(next) {
    if (!next || typeof next !== 'object' || typeof next.state !== 'string') {
      throw new Error('后台返回了无法识别的状态，写入保持锁定。');
    }
    snapshot = next;
    if (next.plan && !pathsDirty) renderPlan(next.plan);
    setText('state-label', labels[state()] || '后台状态：' + next.state);
    setText('transaction-value', next.transaction || '尚无事务');
    setText('status-json', next);
    $('snapshot-error').hidden = !next.error;
    setText('snapshot-error-detail', next.error);
    $('failed-note').hidden = state() !== 'failed';
    const step = next.step;
    const total = next.total;
    const measurable = typeof step === 'number' && typeof total === 'number' && Number.isFinite(step) && Number.isFinite(total) && step >= 0 && total > 0 && step <= total;
    $('progress').hidden = !busy() && !measurable;
    if (measurable) {
      $('progress').max = total;
      $('progress').value = step;
      setText('progress-detail', `已完成步骤 ${step} / ${total}`);
    } else {
      $('progress').removeAttribute('value');
      setText('progress-detail', step ? asText(step) : busy() ? '等待后台返回实际进度' : '');
    }
    if (needsRecovery() && typeof next.transaction === 'string' && document.activeElement !== $('transaction')) {
      if ($('transaction').value !== next.transaction) $('recover-stopped').checked = false;
      $('transaction').value = next.transaction;
      recoveredTransactions.delete(next.transaction);
    }
    if (busy() || needsRecovery() || successful.has(state())) {
      $('step-status').classList.add('active');
      $('step-preview').classList.remove('active');
    } else {
      $('step-status').classList.remove('active');
    }
    setText('lifecycle-note', successful.has(state()) ? '后台已报告操作完成。请保留事务记录与恢复材料，核对结果后再启动 Claude Code。' : '关闭或刷新网页不会停止已经提交的操作。操作结束前请保持升级器进程运行。');
  }

  function schedulePoll() {
    clearTimeout(pollTimer);
    if (token) pollTimer = setTimeout(poll, connected ? 1500 : 4000);
  }

  async function poll() {
    if (!token || polling) return;
    polling = true;
    const currentGeneration = generation;
    controls();
    try {
      const next = await request('status', {});
      if (currentGeneration === generation) {
        renderSnapshot(next);
        connected = true;
      }
    } catch (error) {
      if (currentGeneration === generation) {
        connected = false;
        resetConfirmations();
        showError(error);
      }
    } finally {
      polling = false;
      controls();
      schedulePoll();
    }
  }

  async function submit(operation, body) {
    if (submitting || !connected || busy()) return;
    submitting = true;
    generation += 1;
    $('error-banner').hidden = true;
    controls();
    try {
      const result = await request(operation, body);
      if (operation === 'plan') {
        if (!result || typeof result.id !== 'string') throw new Error('后台未返回有效的计划 ID。');
        renderPlan(result);
        renderSnapshot({ state: 'planned', transaction: '', step: 0, total: 0, plan: result });
        $('preview-section').scrollIntoView({ block: 'start', behavior: 'auto' });
      } else {
        renderSnapshot(result);
        $('status-section').scrollIntoView({ block: 'start', behavior: 'auto' });
      }
    } catch (error) {
      // A lost response is not evidence that a mutation did not start. Never
      // retry it automatically; status or a newly scanned plan resolves it.
      if (error.payload?.snapshot) {
        try { renderSnapshot(error.payload.snapshot); } catch { /* Show the full error below. */ }
      }
      if (!error.status || error.status === 401 || error.status === 403) connected = false;
      if (operation === 'recover' && error.status) recoveredTransactions.delete(body.transaction);
      resetConfirmations();
      showError(error);
    } finally {
      submitting = false;
      generation += 1;
      controls();
      schedulePoll();
    }
  }

  $('plan-form').addEventListener('input', () => {
    pathsDirty = true;
    plan = null;
    lastPlanJSON = '';
    $('preview-section').hidden = true;
    resetConfirmations();
    controls();
  });
  $('plan-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    for (const key of Object.keys(body)) {
      body[key] = body[key].trim();
      if (!body[key]) delete body[key];
    }
    if (!body.project || !body.baseline || !body.package) return;
    pathsDirty = true;
    plan = null;
    lastPlanJSON = '';
    $('preview-section').hidden = true;
    resetConfirmations();
    submit('plan', body);
  });
  $('apply-button').addEventListener('click', () => {
    if ($('apply-button').disabled || !planReady()) return;
    const body = { planId: plan.id, acknowledgeStopped: true, trustBaseline: plan.baselineDigest, trustTarget: plan.targetDigest };
    appliedPlans.add(plan.id);
    resetConfirmations();
    submit('apply', body);
  });
  $('recover-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if ($('recover-button').disabled) return;
    const transaction = $('transaction').value.trim();
    recoveredTransactions.add(transaction);
    resetConfirmations();
    submit('recover', { transaction, acknowledgeStopped: true });
  });
  for (const id of ['trust-source', 'stopped-writers', 'recover-stopped']) $(id).addEventListener('change', controls);
  $('transaction').addEventListener('input', () => { $('recover-stopped').checked = false; controls(); });
  $('refresh-button').addEventListener('click', () => { clearTimeout(pollTimer); poll(); });
  resetConfirmations();
  controls();
  if (token) poll();
  else showError(new Error('请使用升级器终端给出的完整本机链接打开本页。访问凭据只在链接片段中传入，不是项目路径。'));
})();
