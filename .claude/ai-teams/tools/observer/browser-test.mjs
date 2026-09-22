// Optional QA dependency: NODE_PATH must resolve a test-only Playwright installation.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { context, recordHook, ensureService, accessURL, delay, probe } from './runtime.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const fixture = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cc-radt-browser-test-')));
const root = path.join(fixture, 'UI验证样例-非真实会话');
const output = process.env.OBSERVER_SCREENSHOTS || path.join(fixture, 'screenshots');
fs.mkdirSync(root); fs.mkdirSync(output, { recursive: true });
process.env.AI_TEAMS_OBSERVER_DATA_DIR = path.join(fixture, 'runtime');
process.env.CLAUDE_CONFIG_DIR = path.join(fixture, 'claude');
const ctx = context({ root, project: root });
const markdownSample = ['---','name: qa','description: 文档排版回归','---','# QA 文档预览','','检查任务结果与来源证据。**重点核对**与 `inline()`。','','## 检查步骤','','1. 第一项','   - 嵌套检查','2. 第二项','','- [x] 已核验','- [ ] 待核验','','> 只读证据，不执行命令。','','| 项目 | 状态 |','| --- | --- |','| 表格内容 | 通过 |','','```js','const literal = "<script>alert(1)</script>";','```','','[正常链接](https://example.com/observer-docs)','[危险链接](javascript:alert%281%29)','[实体链接](javascript&#58;alert%281%29)','[文件链接](file:///etc/passwd)','[相对引用](../another.md)','![说明图片](https://example.com/do-not-load.png)','','<img src=x onerror=alert(1)>','<button data-page="mcp">不可注入操作</button>'].join('\n');
for (const [file, text] of Object.entries({
  'shared/task-plan.md': '# 当前任务\n| T-042 | REVIEW |',
  'shared/pipeline-status.md': '# 团队状态\nQA：已记录评审',
  'shared/supervision/heartbeat-current.md': '# 最近活动\n来源状态：等待核对',
  'shared/tasks/T-042.md': '# 导出结果复核（测试样例）\n\n验收依据：测试报告。',
  'shared/prompt-evolution/reviews/R-12.md': '# 审查记录（测试样例）\n\n结论：changes-required',
  'logs/task/export.md': '# 日志测试\npassword=PRIVATE_PASSWORD\n<img src=x onerror=alert(1)>',
  'agents/qa/qa.md': markdownSample,
  '.claude/agents/qa.md': '---\nname: qa\n---\n# 实际主定义\n\n这是 **运行定义**。',
  'skills/agents/qa/check/SKILL.md': '---\nname: check\ndescription: 页面检查\n---\n# 页面检查技能\n运行只读检查。',
  '.mcp.json': JSON.stringify({ mcpServers: { chrome: { type: 'http', url: 'http://localhost:9999/mcp', headers: { Authorization: 'PRIVATE_MCP_HEADER' } } } }),
  'playbook.md': '| WF-01 | 快速问答流 | 只读问答 | Lead | 单点 | Q0 | D0 | M0 | S0 | 直接回答 |\n| WF-11 | 高风险变更流 | Hooks 修改 | Lead, Security, QA | 串行 | Q2 | D1 | M1 | S2 | 审查证据 |',
})) { const f = path.join(root, file); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); }
const nativeDir=path.join(ctx.claudeDir,'projects',root.replace(/[^a-zA-Z0-9]/g,'-'));fs.mkdirSync(nativeDir,{recursive:true});
for(const sessionId of ['sample-session-a','sample-session-b']){
  const make=(type,content,extra={})=>({type,sessionId,cwd:root,uuid:crypto.randomUUID(),timestamp:new Date().toISOString(),message:{content},...extra});
  const rows=[make('user','将按钮从红色改为蓝色，并请 QA 检查。'),make('assistant',[{type:'text',text:'我会先修改按钮。<img src=x onerror=alert(1)>'},{type:'thinking',thinking:'PRIVATE_THINKING'},{type:'tool_use',id:'edit-1',name:'Edit',input:{file_path:'src/button.js',old_string:'color: red',new_string:'color: blue'}}],{message:{id:'msg-1',usage:{input_tokens:120,output_tokens:15},content:[{type:'text',text:'我会先修改按钮。<img src=x onerror=alert(1)>'},{type:'tool_use',id:'edit-1',name:'Edit',input:{file_path:'src/button.js',old_string:'color: red',new_string:'color: blue'}}]}}),make('user',[{type:'tool_result',tool_use_id:'edit-1',content:'成功修改'}]),make('assistant',[{type:'tool_use',id:'agent-1',name:'Agent',input:{subagent_type:'qa',description:'检查按钮',prompt:'只读检查按钮'}}]),make('user',[{type:'tool_result',tool_use_id:'agent-1',content:'QA 完成'}],{toolUseResult:{agentId:'qa-instance'}}),make('assistant',[{type:'tool_use',id:'ask-1',name:'AskUserQuestion',input:{questions:[{question:'是否采用蓝色？'}]}}])];
  rows.push(make('assistant', [{type:'tool_use',id:'read-md',name:'Read',input:{file_path:path.join(root,'agents/qa/qa.md')}}]), make('user',[{type:'tool_result',tool_use_id:'read-md',content:markdownSample.split('\n').map((line,i)=>`${i+1}→${line}`).join('\n')}]), make('assistant',[{type:'text',text:'## 核验结论\n\n**检查完成**，见 `qa.md`。'}]));
  fs.writeFileSync(path.join(nativeDir,sessionId+'.jsonl'),rows.map(r=>JSON.stringify(r)).join('\n'));
  const subdir=path.join(nativeDir,sessionId,'subagents');fs.mkdirSync(subdir,{recursive:true});
  fs.writeFileSync(path.join(subdir,'agent-qa-instance.jsonl'),[make('user','只读检查按钮'),make('assistant',[{type:'text',text:'QA 已核验按钮。'},{type:'tool_use',id:'skill-1',name:'Skill',input:{skill:'check'}},{type:'tool_use',id:'mcp-1',name:'mcp__chrome__snapshot',input:{}}],{message:{id:'qa-msg',usage:{input_tokens:30,output_tokens:8},content:[{type:'text',text:'QA 已核验按钮。'},{type:'tool_use',id:'skill-1',name:'Skill',input:{skill:'check'}},{type:'tool_use',id:'mcp-1',name:'mcp__chrome__snapshot',input:{}}]}})].map(r=>JSON.stringify(r)).join('\n'));
}
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
  const externalRequests = [];
  for (const p of [first, second]) { p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => { errors.push('Unexpected dialog'); d.dismiss(); }); p.on('request', r=>{if(!r.url().startsWith(`http://127.0.0.1:${service.port}/`))externalRequests.push(r.url());}); }
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
    navigation: 'rgb(249, 249, 249)', canvas: 'rgb(255, 255, 255)',
    active: 'rgb(237, 237, 237)', activeText: 'rgb(23, 23, 23)',
  }, 'Minimal black / white / grey theme must reach the rendered UI');
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
  assert.equal(await first.locator('nav [data-page]').count(),9,'Beautify in place; never add a Markdown menu');
  await first.locator('.agent-card').first().waitFor();
  assert.equal(await first.locator('.agent-card').count(),2);
  assert.equal(await first.locator('.event-row').count(),0,'overview must not repeat the log timeline');
  await first.locator('#all-sessions').click(); await first.waitForFunction(() => document.querySelectorAll('.agent-card').length === 4);
  assert.equal(await second.locator('.agent-card').count(),2);
  assert.ok(second.url().includes('sample-session-b'));
  await first.screenshot({ path: path.join(output, 'observer-multi-session.png'), fullPage: true });
  await first.locator('[data-page="tasks"]').click();
  assert.equal(await first.locator('.task-card').count(),2);
  await first.locator('.task-card').first().click();
  await first.locator('.chat-text').filter({hasText:'QA 已核验按钮'}).waitFor();
  assert.equal(await first.locator('.chat-text h2').filter({hasText:'核验结论'}).count(),1);
  assert.equal(await first.locator('.chat-text strong').filter({hasText:'检查完成'}).count(),1);
  assert.equal(await first.locator('#inspector img').count(),0);
  assert.doesNotMatch(await first.locator('#inspector').innerText(),/PRIVATE_THINKING/);
  await first.screenshot({ path: path.join(output, 'observer-task-evidence.png'), fullPage: true });
  await first.locator('[data-detail-tab="tools"]').click();
  const readMarkdown = first.locator('.tool-call').filter({has:first.locator('summary .badge').filter({hasText:/^Read$/})});
  await readMarkdown.locator('summary').first().click();
  assert.equal(await readMarkdown.locator('.markdown-body h1').innerText(),'QA 文档预览');
  assert.equal(await readMarkdown.locator('.markdown-body table').count(),1);
  assert.doesNotMatch(await readMarkdown.locator('.markdown-body').innerText(),/\d+→/);
  await readMarkdown.locator('summary').first().click();
  await first.locator('.tool-call').filter({hasText:'Edit'}).locator('summary').click();
  assert.match(await first.locator('#inspector').innerText(),/color: red/);
  const expandedTool = first.locator('.tool-call[open]').first();
  const toolKey = await expandedTool.getAttribute('data-expand');
  const inspectedSession = await first.locator('.task-card').first().getAttribute('data-sid');
  const messageCount = Number((await first.locator('[data-detail-tab="conversation"]').innerText()).match(/\d+/)[0]);
  // Trigger a genuine new record, not just a timer, while the user is inspecting a tool.
  const extraRow={type:'assistant',sessionId:inspectedSession,cwd:root,uuid:crypto.randomUUID(),timestamp:new Date().toISOString(),message:{id:'later-public-message',content:[{type:'text',text:'刷新保留展开项验证'}]}};
  fs.appendFileSync(path.join(nativeDir,inspectedSession+'.jsonl'),'\n'+JSON.stringify(extraRow)+'\n');
  await first.waitForFunction(count=>document.querySelector('[data-detail-tab="conversation"]')?.textContent.includes(String(count)),messageCount+1,{timeout:15000});
  assert.equal(await first.locator('.tool-call[open]').first().getAttribute('data-expand'),toolKey,'Live data must not collapse inspected tools');
  assert.equal(await first.evaluate(()=>document.activeElement.tagName),'SUMMARY','Polling keeps focus on the expanded tool');
  await first.keyboard.press('Escape');
  assert.equal(await first.locator('.inspector').isVisible(),false);
  assert.equal(await first.locator('.task-card:focus').count(),1,'Closing details restores keyboard focus');
  await first.keyboard.press('Enter');
  await first.locator('[data-detail-tab="changes"]').waitFor();
  await first.locator('[data-detail-tab="changes"]').click();
  assert.match(await first.locator('.diff-after').innerText(),/color: blue/);
  await first.locator('[data-page="changes"]').click();
  await first.locator('.change-card').first().click();
  await first.locator('.diff-before').filter({hasText:'color: red'}).waitFor();
  await first.screenshot({path:path.join(output,'observer-code-changes.png'),fullPage:true});
  await first.locator('[data-page="reviews"]').click();
  await first.locator('.review-card').first().click();
  await first.locator('#inspector').filter({hasText:'是否采用蓝色'}).waitFor();
  await first.screenshot({ path: path.join(output, 'observer-review.png'), fullPage: true });
  await first.locator('[data-page="config"]').click();
  assert.equal(await first.locator('.session-panel').isVisible(),false);
  await first.locator('.catalog-card').first().click();
  await first.locator('#inspector').filter({ hasText: '检查任务结果' }).waitFor();
  const documentBody = first.locator('#inspector .markdown-body').first();
  assert.equal(await documentBody.locator('h1').innerText(),'QA 文档预览');
  assert.equal(await documentBody.locator('h2').innerText(),'检查步骤');
  assert.equal(await documentBody.locator('ol > li').count(),2);
  assert.equal(await documentBody.locator('ol ul li').count(),1);
  assert.equal(await documentBody.locator('.md-check').count(),2);
  assert.equal(await documentBody.locator('input,script,img,button,iframe,style').count(),0);
  assert.equal(await documentBody.locator('a').count(),1);
  assert.equal(await documentBody.locator('a').getAttribute('rel'),'noopener noreferrer');
  assert.match(await documentBody.locator('pre code').innerText(),/<script>/);
  assert.equal(await documentBody.locator('th').count(),2);
  assert.equal(await documentBody.locator('.md-frontmatter[open]').count(),0);
  await documentBody.locator('.md-frontmatter summary').click();
  assert.match(await documentBody.locator('.md-frontmatter').innerText(),/description: 文档排版回归/);
  await documentBody.locator('.md-frontmatter summary').click();
  await first.getByText(/查看 CC 实际主定义/).click();
  assert.equal(await first.locator('.tool-call .markdown-body h1').innerText(),'实际主定义');
  await first.screenshot({path:path.join(output,'observer-markdown.png'),fullPage:true});
  await first.setViewportSize({width:390,height:844});
  assert.ok(await first.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Markdown must not overflow mobile layout');
  await first.screenshot({path:path.join(output,'observer-markdown-mobile.png'),fullPage:true});
  await first.setViewportSize({width:1500,height:1020});
  for(const nav of ['skills','mcp','workflows']){
    await first.locator(`[data-page="${nav}"]`).click();
    await first.locator('.catalog-card').first().click();
    await first.locator(nav==='mcp'?'#inspector pre.evidence-content':'#inspector .markdown-body').first().waitFor();
    if(nav==='skills')assert.equal(await first.locator('#inspector .markdown-body h1').innerText(),'页面检查技能');
    if(nav==='mcp')assert.equal(await first.locator('#inspector .markdown-body').count(),0,'MCP JSON stays code');
    assert.equal(await first.locator('.session-panel').isVisible(),false);
    assert.doesNotMatch(await first.locator('#inspector').innerText(),/PRIVATE_MCP_HEADER/);
    await first.screenshot({path:path.join(output,`observer-${nav}.png`),fullPage:true});
  }
  await first.locator('[data-page="logs"]').click();
  await second.locator('[data-page="logs"]').click();
  assert.equal(await first.locator('.event-row.failure').count(),1);
  assert.equal(await second.locator('.event-row').count(),3);
  await first.getByRole('button', { name: /export.md 文件观测/ }).click();
  await first.locator('#inspector .markdown-body h1').filter({ hasText: '日志测试' }).waitFor();
  assert.doesNotMatch(await first.locator('#inspector').innerText(), /PRIVATE_PASSWORD/);
  assert.match(await first.locator('#inspector').innerText(), /<img/);
  assert.equal(await first.locator('#inspector img').count(), 0);
  fs.writeFileSync(path.join(root,'logs/task/export.md'),'# 日志更新\n\n**新版本**');
  for(let attempt=0;attempt<60;attempt++){
    const state=await fetch(`http://127.0.0.1:${service.port}/api/state`,{headers:{Authorization:'Bearer '+service.token}}).then(r=>r.json());
    if(state.snapshots.filter(s=>s.source==='logs/task/export.md').length>=2)break;
    await delay(200);
  }
  await first.locator('#refresh').click();
  await first.locator('#close-detail').click();
  await first.getByRole('button', { name: /export.md 文件观测/ }).click();
  await first.locator('#inspector .markdown-body h1').filter({hasText:'日志更新'}).waitFor();
  await first.getByRole('button',{name:'查看上一留存版本'}).click();
  await first.locator('#previous-version .markdown-body h1').filter({hasText:'日志测试'}).waitFor();
  assert.equal(externalRequests.length,0,'Markdown must not automatically load remote resources');
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
  console.log(JSON.stringify({ passed: true, checks: ['compact desktop and short-window layout', 'minimal black white grey palette', 'two independent windows', 'nine distinct pages', 'native conversations and collaboration', 'before-after code changes', 'decision records', 'agents skills MCP workflow catalog', 'redaction and XSS', 'search and failures', 'export', 'mobile overflow', 'live session end', 'preserved expanded tools and keyboard focus', 'Markdown headings lists tables code and frontmatter', 'Markdown in conversation Read and runtime definitions', 'Markdown evidence and previous snapshot', 'no remote Markdown resources or unsafe navigation'], desktopLayout, shortLayout, screenshots: output }));
} finally {
  if (browser) await browser.close();
  const running = await probe(ctx);
  if (running) process.kill(running.pid, 'SIGTERM');
  await delay(200);
}
