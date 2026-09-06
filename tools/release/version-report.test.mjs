import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

test('package count includes a new report exactly once and ignores an external report', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'cc-radt-release-count-'));
  const packageRoot = join(fixture, 'package');
  mkdirSync(join(packageRoot, '.claude'), { recursive: true });
  writeFileSync(join(packageRoot, '.claude', 'manifest.json'), '{"version":"1.1.0"}\n');
  writeFileSync(join(packageRoot, 'checksums.txt'), '');
  const script = resolve('tools/release/ai-teams-version-report.mjs');
  const run = (output) => {
    execFileSync(process.execPath, [script, '--version', '1.1.0', '--package-dir', packageRoot, '--output', output], { stdio: 'pipe' });
    return readFileSync(output, 'utf8');
  };
  const record = join(packageRoot, 'RELEASE_RECORD.md');
  assert.match(run(record), /安装包文件数量：3\n/u);
  assert.match(run(record), /安装包文件数量：3\n/u);
  assert.match(run(join(fixture, 'external.md')), /安装包文件数量：3\n/u);
});
