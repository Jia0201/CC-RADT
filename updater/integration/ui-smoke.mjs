import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { generateManifest } from '../../tools/release/ai-teams-upgrade-manifest.mjs';

const [binaryArg, artifactsArg] = process.argv.slice(2);
if (!binaryArg || !artifactsArg) throw new Error('Usage: node updater/integration/ui-smoke.mjs BINARY ARTIFACT_PARENT');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.UPDATER_PLAYWRIGHT_MODULE || 'playwright');
const work = mkdtempSync(join(resolve(artifactsArg), 'ui-smoke-'));
const old = join(work, 'old');
const next = join(work, 'next');
const project = join(work, 'project 中文');
const h = '.claude/ai-teams';
function put(root, path, content) {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  writeFileSync(file, content, { mode: 0o600 });
}
for (const [root, version] of [[old, '1.0.0'], [next, '1.1.0']]) {
  put(root, `${h}/VERSION`, version + '\n');
  put(root, `${h}/MANIFEST.json`, JSON.stringify({ version }));
  put(root, `${h}/security/example.md`, 'official ' + version);
  put(root, `${h}/memory/MEMORY.md`, 'blank');
  put(root, '.claude/settings.json', JSON.stringify({ agent: 'lead', hooks: {} }));
  put(root, 'upgrade-manifest.json', JSON.stringify(generateManifest({ packageRoot: root }), null, 2) + '\n');
}
cpSync(old, project, { recursive: true, errorOnExist: true, force: false });
put(project, `${h}/memory/MEMORY.md`, 'UI fixture memory must survive');
const child = spawn(resolve(binaryArg), ['ui'], { stdio: ['ignore', 'pipe', 'pipe'] });
let stderr = '';
child.stderr.on('data', chunk => { stderr += chunk; });
const exited = new Promise(resolve => child.once('exit', code => resolve(code)));
let browser;
const errors = [];
try {
  const url = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('UI startup timed out: ' + stderr)), 20000);
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+\/#token=[A-Za-z0-9_-]+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
    child.once('exit', code => { clearTimeout(timer); reject(new Error('UI stopped early: ' + code + stderr)); });
  });
  browser = await chromium.launch({ headless: true, ...(process.env.UPDATER_CHROME_EXECUTABLE ? { executablePath: process.env.UPDATER_CHROME_EXECUTABLE } : {}) });
  const page = await browser.newPage({ viewport: { width: 1365, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => !document.getElementById('path-fields').disabled);
  await page.locator('#project').fill(project);
  await page.locator('#baseline').fill(old);
  await page.locator('#package').fill(next);
  await page.locator('#plan-button').click();
  await page.waitForFunction(() => !document.getElementById('trust-source').disabled);
  assert.equal(await page.locator('#conflict-count').textContent(), '0');
  await page.screenshot({ path: join(work, 'preview-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(overflow, false, 'Mobile layout overflows');
  await page.screenshot({ path: join(work, 'preview-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1365, height: 1000 });
  await page.locator('#trust-source').check();
  await page.locator('#stopped-writers').check();
  await page.locator('#apply-button').click();
  await page.waitForFunction(() => document.getElementById('state-label').textContent === '操作完成', null, { timeout: 120000 });
  assert.equal(readFileSync(join(project, h, 'memory/MEMORY.md'), 'utf8'), 'UI fixture memory must survive');
  assert.equal(readFileSync(join(project, h, 'VERSION'), 'utf8').trim(), '1.1.0');
  await page.screenshot({ path: join(work, 'complete-desktop.png'), fullPage: true });
  await page.reload();
  await page.waitForFunction(() => document.getElementById('state-label').textContent === '操作完成');
  assert.equal(await page.locator('#apply-button').isEnabled(), false);
  assert.deepEqual(errors, []);
  const result = { work, fixtureVersion: '1.1.0', memoryUnchanged: true, reconnect: true, mobileOverflow: false, pageErrors: errors };
  writeFileSync(join(work, 'result.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify(result, null, 2));
} finally {
  if (browser) await browser.close();
  child.kill('SIGINT');
  // Busy operations deliberately ignore SIGINT. Never return while the updater
  // is still switching; isolated test failures wait before a second exit request.
  const retry = setInterval(() => child.kill('SIGINT'), 2000);
  await exited;
  clearInterval(retry);
}
