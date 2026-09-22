import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('Harness fixtures exclude private files, symlinks and independent build artifacts', () => {
  const script = fs.readFileSync(fileURLToPath(new URL('../bin/ai-teams-e2e-fixtures.sh', import.meta.url)), 'utf8');
  const match = script.match(/<<'NODE_COPY'\n([\s\S]*?)\nNODE_COPY/);
  assert.ok(match, 'test the exact production fixture-copy implementation');
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-radt-fixture-copy-'));
  const source = path.join(base, 'source');
  const destination = path.join(base, 'copy');
  const excluded = [
    '.claude/settings.local.json', '.env', '.env.local', 'config/credentials.json',
    'config/private.pem', 'config/token.json', '.ssh/config',
    '.git/config', 'updater/artifacts/result.md', 'lab/draft.md',
  ];
  const included = ['index/ENTRY.md', '.claude/settings.local.example.json', '.claude/agents/lead.md'];
  for (const relative of [...excluded, ...included]) {
    const file = path.join(source, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'synthetic fixture only\n');
  }
  fs.symlinkSync(path.join(source, '.env'), path.join(source, 'linked-document.md'));
  const result = spawnSync(process.execPath, ['-', source, destination], {
    input: match[1], encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  for (const relative of excluded) assert.equal(fs.existsSync(path.join(destination, relative)), false, relative);
  assert.equal(fs.existsSync(path.join(destination, 'linked-document.md')), false);
  for (const relative of included) {
    assert.equal(fs.readFileSync(path.join(destination, relative), 'utf8'), 'synthetic fixture only\n');
  }
});
