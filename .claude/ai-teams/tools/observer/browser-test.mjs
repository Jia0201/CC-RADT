// Optional QA dependency: NODE_PATH must resolve a test-only Playwright installation.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { context, recordHook, ensureService, accessURL, delay, probe } from './runtime.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-radt-browser-test-'));
const root = path.join(fixture, 'UI验证样例-非真实会话');
const output = process.env.OBSERVER_SCREENSHOTS || path.join(fixture, 'screenshots');
fs.mkdirSync(root); fs.mkdirSync(output, { recursive: true });
process.env.AI_TEAMS_OBSERVER_DATA_DIR = path.join(fixture, 'runtime');
const ctx = context({ root, project: root });
for (const [file, text] of Object.entries({
  'shared/task-plan.md': '# 当前任务\n| T-042 | REVIEW |',
  'shared/pipeline-status.md': '# 团队状态\nQA：已记录评审',
  'shared/supervision/heartbeat-current.md': '# 最近活动\n来源状态：等待核对',
  'shared/tasks/T-042.md': '# 导出结果复核（测试样例）\n\n验收依据：测试报告。',
  'shared/prompt-evolution/reviews/R-12.md': '# 审查记录（测试样例）\n\n结论：changes-required',
  'logs/task/export.md': '# 日志测试\npassword=PRIVATE_PASSWORD\n<img src=x onerror=alert(1)>',
  'agents/qa/qa.md': '# QA\n\n检查任务结果与来源证据。',
})) { const f = path.join(root, file); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); }
for (const id of ['sample-session-a', 'sample-session-b']) {
  recordHook(ctx, { session_id: id, hook_event_name: 'SessionStart', source: 'startup' });
  recordHook(ctx, { session_id: id, hook_event_name: 'SubagentStart', agent_id: 'qa-instance', agent_type: 'qa' });
}
recordHook(ctx, { session_id: 'sample-session-a', hook_event_name: 'PostToolUse', tool_name: 'Read', agent_id: 'qa-instance', agent_type: 'qa', tool_input: { file_path: 'shared/tasks/T-042.md' } });
recordHook(ctx, { session_id: 'sample-session-b', hook_event_name: 'PostToolUseFailure', tool_name: 'Bash', agent_id: 'qa-instance', agent_type: 'qa' });
let service;
let browser;
try {
  service = await ensureService(ctx);
  browser = await chromium.launch({ headless: true, ...(process.env.OBSERVER_TEST_BROWSER ? { executablePath: process.env.OBSERVER_TEST_BROWSER } : {}) });
  const first = await browser.newPage({ viewport: { width: 1500, height: 1020 } });
  const second = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  const errors = [];
  for (const p of [first, second]) { p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => { errors.push('Unexpected dialog'); d.dismiss(); }); }
  await first.goto(accessURL(service, 'sample-session-a')); await first.waitForLoadState('networkidle');
  await second.goto(accessURL(service, 'sample-session-b')); await second.waitForLoadState('networkidle');
  await first.locator('#connection').filter({ hasText: '观察服务已连接' }).waitFor();
  const palette = await first.evaluate(() => ({
    navigation: getComputedStyle(document.querySelector('.navigation')).backgroundColor,
    canvas: getComputedStyle(document.body).backgroundColor,
    active: getComputedStyle(document.querySelector('.nav-item.active')).backgroundColor,
    activeText: getComputedStyle(document.querySelector('.nav-item.active')).color,
  }));
  assert.deepEqual(palette, {
    navigation: 'rgb(255, 255, 255)', canvas: 'rgb(245, 246, 248)',
    active: 'rgb(237, 244, 252)', activeText: 'rgb(64, 111, 165)',
  }, 'White / grey / soft-blue theme must reach the rendered UI');
  const measureLayout = () => {
    const workspace = document.querySelector('#workspace').getBoundingClientRect();
    return { workspaceTop: workspace.top, workspaceBottom: workspace.bottom,
      height: window.innerHeight, scrollHeight: document.documentElement.scrollHeight };
  };
  const desktopLayout = await first.evaluate(measureLayout);
  assert.ok(desktopLayout.workspaceTop <= 150, 'Header, description and counters must remain compact');
  assert.ok(desktopLayout.scrollHeight <= desktopLayout.height + 1, 'Desktop panels should fit the viewport');
  await second.setViewportSize({ width: 1440, height: 640 });
  const shortLayout = await second.evaluate(measureLayout);
  assert.ok(shortLayout.workspaceTop <= 150);
  assert.ok(shortLayout.workspaceBottom <= shortLayout.height - 25, 'Keep the footer outside scrolling panels');
  assert.ok(shortLayout.scrollHeight <= shortLayout.height + 1, 'Short desktop windows should not force page scrolling');
  await second.setViewportSize({ width: 1440, height: 980 });
  const titles = await first.locator('h1,h2').allTextContents(); assert.ok(titles.includes('概览与会话'));
  assert.equal(await first.locator('.event-row.failure').count(), 0);
  assert.equal(await second.locator('.event-row.failure').count(), 1);
  await first.locator('#all-sessions').click(); await first.waitForFunction(() => document.querySelectorAll('.event-row').length === 6);
  assert.equal(await first.locator('.event-row.failure').count(), 1);
  assert.equal(await second.locator('.event-row').count(), 3);
  assert.ok(second.url().includes('sample-session-b'));
  await first.screenshot({ path: path.join(output, 'observer-multi-session.png'), fullPage: true });
  await first.locator('[data-page="tasks"]').click();
  await first.getByRole('button', { name: /T-042.md 文件观测/ }).click();
  await first.locator('#evidence-text').filter({ hasText: '导出结果复核' }).waitFor();
  await first.locator('[data-page="reviews"]').click();
  await first.getByRole('button', { name: /R-12.md 文件观测/ }).click();
  await first.locator('#evidence-text').filter({ hasText: 'changes-required' }).waitFor();
  await first.locator('[data-page="config"]').click();
  await first.getByRole('button', { name: /qa.md 文件观测/ }).click();
  await first.locator('#evidence-text').filter({ hasText: '检查任务结果' }).waitFor();
  await first.locator('[data-page="logs"]').click();
  await first.getByRole('button', { name: /export.md 文件观测/ }).click();
  await first.locator('#evidence-text').filter({ hasText: '日志测试' }).waitFor();
  assert.doesNotMatch(await first.locator('#evidence-text').innerText(), /PRIVATE_PASSWORD/);
  assert.match(await first.locator('#evidence-text').innerText(), /<img/);
  assert.equal(await first.locator('#inspector img').count(), 0);
  await first.locator('#search').fill('不存在的搜索内容');
  assert.equal(await first.locator('.event-row').count(), 0);
  await first.locator('#search').fill('');
  await first.locator('#errors-only').check();
  assert.equal(await first.locator('.event-row').count(), 1);
  const downloadPromise = first.waitForEvent('download'); await first.locator('#export').click();
  const download = await downloadPromise; assert.equal(download.suggestedFilename(), 'cc-radt-observer-view.json');
  await first.locator('[data-page="overview"]').click();
  await first.setViewportSize({ width: 390, height: 844 });
  assert.ok(await first.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await first.screenshot({ path: path.join(output, 'observer-mobile.png'), fullPage: true });
  recordHook(ctx, { session_id: 'sample-session-b', hook_event_name: 'SessionEnd' });
  await second.locator('[data-session="sample-session-b"]').filter({ hasText: '会话已结束' }).waitFor({ timeout: 10000 });
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log(JSON.stringify({ passed: true, checks: ['compact desktop and short-window layout', 'white grey soft-blue palette', 'two independent windows', 'five pages', 'evidence', 'redaction and XSS', 'search and failures', 'export', 'mobile overflow', 'live session end'], desktopLayout, shortLayout, screenshots: output }));
} finally {
  if (browser) await browser.close();
  if (service && await probe(ctx)) process.kill(service.pid, 'SIGTERM');
  await delay(200);
}
