import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { context, recordHook, ensureService, probe, delay } from './runtime.mjs';
import { parseTranscript, buildSession, NativeReader } from './native.mjs';
import { Catalog } from './catalog.mjs';
import { WorktreeReader } from './worktree.mjs';
import { readLocal } from './local-data.mjs';

const tmp=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'cc-radt-native-test-')));
const root=path.join(tmp,'project');fs.mkdirSync(root);
process.env.AI_TEAMS_OBSERVER_DATA_DIR=path.join(tmp,'state');
process.env.CLAUDE_CONFIG_DIR=path.join(tmp,'claude');
const ctx=context({root,project:root});
const write=(base,file,text)=>{const target=path.join(base,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text);};
const row=(type,content,extra={})=>({type,cwd:root,sessionId:'session-A',uuid:crypto.randomUUID(),timestamp:new Date().toISOString(),message:{role:type,content},...extra});
const assistant=(content,id,usage)=>row('assistant',content,{message:{id,content,usage}});
const tool=(id,name,input)=>({type:'tool_use',id,name,input});
const result=(id,content,extra={})=>row('user',[{type:'tool_result',tool_use_id:id,content}],extra);
const jsonl=rows=>rows.map(r=>JSON.stringify(r)).join('\n')+'\n';
const parse=(rows,actorId='main')=>parseTranscript(jsonl(rows),{ctx,sessionId:'session-A',actorId,source:'fixture.jsonl'});
const mainRows=[
  row('user','实现蓝色按钮',{uuid:'turn-1'}),
  assistant([{type:'thinking',thinking:'HIDDEN_REASONING'},{type:'text',text:'我会修改按钮并请 QA 检查。'}],'m1',{input_tokens:100,output_tokens:2,cache_read_input_tokens:50,cache_creation_input_tokens:0}),
  assistant([tool('edit-1','Edit',{file_path:'src/button.js',old_string:'color: red',new_string:'color: blue'})],'m1',{input_tokens:100,output_tokens:12,cache_read_input_tokens:50,cache_creation_input_tokens:0}),
  result('edit-1','File updated successfully'),
  assistant([tool('agent-1','Agent',{subagent_type:'qa',description:'检查按钮',prompt:'只读审查按钮'})],'m2',{input_tokens:60,output_tokens:8}),
  result('agent-1','审查完成',{toolUseResult:{agentId:'child-qa'}}),
  row('user','再确认一下',{uuid:'turn-2'}),
  assistant([tool('ask-1','AskUserQuestion',{questions:[{question:'是否采用蓝色？'}]})],'m3',{}),
  row('user','<command-name>/exit</command-name>'),
  row('user','<local-command-stdout>Bye</local-command-stdout>'),
];
const childRows=[row('user','只读审查按钮'),assistant([tool('skill-1','Skill',{skill:'webapp-testing'})],'s1',{input_tokens:30,output_tokens:3}),result('skill-1','Skill loaded'),assistant([tool('mcp-1','mcp__chrome__snapshot',{})],'s2',{input_tokens:40,output_tokens:5}),result('mcp-1','按钮可用'),assistant([{type:'text',text:'QA 检查通过'}],'s3',{input_tokens:5,output_tokens:4})];

test('native turns, public conversation, deduplicated streaming usage and explicit child ownership',()=>{
  const main=parse(mainRows),child=parse(childRows,'child-qa');
  assert.equal(main.turns.length,2);assert.equal(main.usage.input_tokens,160);assert.equal(main.usage.output_tokens,20);assert.equal(main.usage.cache_read_input_tokens,50);
  assert.doesNotMatch(JSON.stringify(main),/HIDDEN_REASONING|local-command/);
  const s=buildSession(ctx,'session-A',[main,child],[]);
  const qa=s.actors.find(a=>a.id==='child-qa');assert.equal(qa.parentId,'main');assert.equal(qa.type,'qa');assert.equal(qa.usage.input_tokens,75);
  assert.deepEqual(qa.skills,['webapp-testing']);assert.deepEqual(qa.mcp,['mcp__chrome__snapshot']);
  assert.ok(s.calls.filter(c=>c.actorId==='child-qa').every(c=>c.turnId==='turn-1'));
  assert.equal(s.edges[0].to,'child-qa');assert.equal(s.changes[0].confirmed,true);
  assert.deepEqual(s.changes[0].patches,[{before:'color: red',after:'color: blue'}]);
  assert.equal(s.reviews[0].kind,'人类决策问题');assert.match(s.reviews[0].status,/未记录答复/);
});

test('unknown usage, failed/pending edits and permissions without IDs do not become fake approvals',()=>{
  const rows=[row('user','修改'),assistant([tool('pending','Write',{file_path:'new.js',content:'new code'})],'u1',{}),assistant([tool('failed','Edit',{file_path:'old.js',old_string:'a',new_string:'b'})],'u2',{}),result('failed','denied',{message:{content:[{type:'tool_result',tool_use_id:'failed',content:'denied',is_error:true}]}})];
  const events=[{id:'permission-1',sessionId:'session-A',event:'PermissionRequest',tool:'Write',observedAt:new Date().toISOString(),reviewInput:{file_path:'new.js'}}];
  const s=buildSession(ctx,'session-A',[parse(rows)],events);
  assert.equal(s.actors[0].usage.input_tokens,null);assert.ok(s.changes.every(c=>!c.confirmed));
  assert.match(s.reviews[0].status,/结果未知/);assert.match(s.reviews[0].note,/未提供 tool_use_id/);
  assert.equal(s.changes[0].patches[0].before,null);
});

test('cross-project rows, hidden thinking, sensitive tool bodies, secrets and symlinks are excluded',()=>{
  const records=[row('user','PRIVATE_OTHER_PROJECT',{cwd:tmp}),row('user','api_key=PRIVATE_CREDENTIAL'),assistant([tool('secret','Read',{file_path:'.env'})],'x',{}),result('secret','PRIVATE_ENV_BODY'),assistant([tool('outside','Edit',{file_path:path.join(tmp,'other.js'),old_string:'PRIVATE_OLD',new_string:'PRIVATE_NEW'})],'y',{})];
  const value=parse(records);
  assert.doesNotMatch(JSON.stringify(value),/PRIVATE_OTHER_PROJECT|PRIVATE_CREDENTIAL|PRIVATE_ENV_BODY|PRIVATE_OLD|PRIVATE_NEW/);
  const malformed=parseTranscript(jsonl(mainRows)+'{"partial":',{ctx,sessionId:'session-A',source:'fixture'});assert.equal(malformed.partial,true);
  write(tmp,'outside.txt','PRIVATE_SYMLINK');fs.symlinkSync(path.join(tmp,'outside.txt'),path.join(root,'link.txt'));
  assert.throws(()=>readLocal(root,'link.txt'));assert.throws(()=>readLocal(root,'../outside.txt'));
});

test('native discovery is project scoped; child IDs are isolated between sessions; no transcript copies on disk',()=>{
  const slug=root.replace(/[^a-zA-Z0-9]/g,'-');
  write(ctx.claudeDir,`projects/${slug}/session-A.jsonl`,jsonl(mainRows));
  write(ctx.claudeDir,`projects/${slug}/session-A/subagents/agent-child-qa.jsonl`,jsonl(childRows));
  write(ctx.claudeDir,`projects/${slug}/session-B.jsonl`,jsonl(mainRows.map(r=>({...r,sessionId:'session-B'}))));
  write(ctx.claudeDir,`projects/${slug}/session-B/subagents/agent-child-qa.jsonl`,jsonl(childRows.map(r=>({...r,sessionId:'session-B'}))));
  write(ctx.claudeDir,'projects/another-project/session-C.jsonl',jsonl([row('user','PRIVATE_OUTSIDE_PROJECT')]));
  const n=new NativeReader(ctx);n.scan([]);assert.equal(n.sessions.length,2);assert.notEqual(n.sessions[0].actors[1].key,n.sessions[1].actors[1].key);
  assert.ok(!JSON.stringify(n.sessions).includes('PRIVATE_OUTSIDE_PROJECT'));
  process.env.AI_TEAMS_OBSERVER_TRANSCRIPTS='0';n.scan([]);assert.equal(n.sessions.length,0);delete process.env.AI_TEAMS_OBSERVER_TRANSCRIPTS;
});

test('catalog enumerates actual files, keeps scopes clear and never emits MCP credentials',()=>{
  write(root,'agents/qa/qa.md','# QA\n\n负责测试与回归。');write(root,'.claude/agents/qa.md','---\nname: qa\ntools: Read, Glob\n---\n# QA 主定义');
  write(root,'skills/agents/qa/check/SKILL.md','---\nname: check\ndescription: 检查页面\n---\n# 如何检查\n实际内容');
  write(root,'.claude/skills/local/SKILL.md','---\nname: local\n---\n# 项目技能');
  write(root,'.mcp.json',JSON.stringify({mcpServers:{chrome:{type:'http',url:'https://user:PRIVATE_URL_PASSWORD@localhost/mcp?token=PRIVATE_QUERY',headers:{Authorization:'PRIVATE_HEADER'},env:{SECRET:'PRIVATE_ENV'},args:['--api-key','PRIVATE_ARG']}}}));
  write(root,'playbook.md','| WF-01 | 快速问答流 | 问答 | Lead | 单点 | Q0 | D0 | M0 | S0 | 回复 |\n| WF-12 | 文档与知识图谱流 | 文档 | Lead, Doc | 扇出 | Q1 | D2 | M2 | S1 | 更新 |');
  const c=new Catalog(ctx);c.scan();assert.equal(c.items.filter(i=>i.kind==='skill').length,2);assert.equal(c.items.filter(i=>i.kind==='workflow').length,2);
  assert.doesNotMatch(JSON.stringify(c.items),/PRIVATE_URL_PASSWORD|PRIVATE_QUERY|PRIVATE_HEADER|PRIVATE_ENV|PRIVATE_ARG/);
  assert.ok(c.items.some(i=>i.kind==='agent'&&i.runtimeContent.includes('QA 主定义')));
});

test('worktree reports real HEAD diff separately and leaves tracked files unchanged',()=>{
  const git=args=>execFileSync('git',['-C',root,...args],{stdio:'pipe'});
  git(['init']);write(root,'code.js','const color = "red";\n');git(['add','code.js']);git(['-c','user.name=Observer fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture baseline']);
  write(root,'code.js','const color = "blue";\n');write(root,'.env','PRIVATE_ENV');
  const w=new WorktreeReader(ctx);w.scan();const file=w.state.files.find(f=>f.file==='code.js');assert.match(file.diff,/-const color = "red"/);assert.match(file.diff,/\+const color = "blue"/);
  assert.ok(!w.state.files.some(f=>f.file==='.env'));assert.equal(fs.readFileSync(path.join(root,'code.js'),'utf8'),'const color = "blue";\n');
});

test('native/catalog/diff APIs stay authenticated and read-only; decision Hook returns no approval',async()=>{
  recordHook(ctx,{session_id:'session-A',hook_event_name:'PermissionRequest',tool_name:'Bash',tool_input:{command:'printf safe',api_key:'PRIVATE_HOOK_KEY'}});
  let service;
  try{
    service=await ensureService(ctx);
    const base=`http://127.0.0.1:${service.port}`;const headers={Authorization:'Bearer '+service.token};
    let state;
    for(let i=0;i<80;i++){state=await(await fetch(base+'/api/state',{headers})).json();if(state.native?.sessions.length)break;await delay(100);}
    const scoped=await(await fetch(base+'/api/state?session=session-A',{headers})).json();assert.equal(scoped.native.sessions.length,1);
    const detail=await(await fetch(base+'/api/session/session-A',{headers})).json();assert.equal(detail.turns.length,2);assert.ok(detail.reviews.some(r=>r.kind==='命令 / 工具权限决策'));
    assert.equal((await fetch(base+'/api/session/session-A')).status,401);
    assert.equal((await fetch(base+'/api/session/session-A',{method:'POST',headers})).status,405);
    assert.equal((await fetch(base+'/api/session/session-C',{headers})).status,404);
    const mcp=state.catalog.find(c=>c.kind==='mcp');const config=await(await fetch(base+'/api/catalog/'+mcp.id,{headers})).json();assert.doesNotMatch(JSON.stringify(config),/PRIVATE_/);
    const eventFiles=fs.readdirSync(path.join(ctx.dataDir,'events')).map(f=>fs.readFileSync(path.join(ctx.dataDir,'events',f),'utf8')).join('');assert.doesNotMatch(eventFiles,/PRIVATE_HOOK_KEY|实现蓝色按钮|HIDDEN_REASONING/);
  }finally{service=await probe(ctx);if(service)process.kill(service.pid,'SIGTERM');}
  console.log('Native V2 fixture:',tmp);
});
