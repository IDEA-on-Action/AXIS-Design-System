/**
 * tokens · mcp changeset 동반 검사 테스트 (WI-0076 후속 규칙)
 *
 * 실행: node --test scripts/check-changeset-mcp-tokens.test.mjs
 * 임시 디렉터리에 changeset 을 만들어 통과 · 위반 · 읽기 실패의 종료 코드를 확인합니다.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, checkChangesetDir } from './check-changeset-mcp-tokens.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'check-changeset-mcp-tokens.mjs');
const tmpDirs = [];
after(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }); });

function makeDir(files) {
  const dir = mkdtempSync(join(tmpdir(), 'axis-cs-'));
  tmpDirs.push(dir);
  writeFileSync(join(dir, 'README.md'), '# Changesets\n');
  writeFileSync(join(dir, 'config.json'), '{}\n');
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  return dir;
}
const cs = (bumps) => `---\n${Object.entries(bumps).map(([p, b]) => `"${p}": ${b}`).join('\n')}\n---\n\n본문\n`;
const run = (dir) => spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' });

test('앞머리 판독: 따옴표 종류 · 따옴표 없음 · 주석 줄', () => {
  assert.deepEqual(
    parseFrontmatter(`---\n"@axis-ds/tokens": patch\n'@axis-ds/mcp': minor\n@axis-ds/cli: major\n# 주석\n---\n`),
    { '@axis-ds/tokens': 'patch', '@axis-ds/mcp': 'minor', '@axis-ds/cli': 'major' },
  );
  assert.equal(parseFrontmatter('앞머리 없음'), null);
});

test('위반: tokens 만 올리면 rc 1', () => {
  const r = run(makeDir({ 'a.md': cs({ '@axis-ds/tokens': 'patch' }) }));
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /@axis-ds\/mcp/);
});

test('위반: linked 패키지와 함께여도 mcp 가 없으면 rc 1', () => {
  const r = run(makeDir({ 'a.md': cs({ '@axis-ds/tokens': 'patch', '@axis-ds/ui-react': 'patch', '@axis-ds/cli': 'minor' }) }));
  assert.equal(r.status, 1, r.stdout + r.stderr);
});

test('통과: 같은 changeset 에 mcp 가 있으면 rc 0', () => {
  const r = run(makeDir({ 'a.md': cs({ '@axis-ds/tokens': 'patch', '@axis-ds/mcp': 'patch' }) }));
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('통과: 다른 changeset 에 mcp 가 있어도 같은 발행에 묶이므로 rc 0', () => {
  const r = run(makeDir({ 'a.md': cs({ '@axis-ds/tokens': 'patch' }), 'b.md': cs({ '@axis-ds/mcp': 'minor' }) }));
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('통과: tokens 를 올리지 않으면 검사 대상 없음 rc 0 (changeset 0개 포함)', () => {
  assert.equal(run(makeDir({ 'a.md': cs({ '@axis-ds/cli': 'patch' }) })).status, 0);
  const empty = run(makeDir({}));
  assert.equal(empty.status, 0);
  assert.match(empty.stdout, /changeset 0개/);
});

test('none 은 올림으로 치지 않음: mcp none 이면 위반', () => {
  const r = checkChangesetDir(makeDir({ 'a.md': cs({ '@axis-ds/tokens': 'patch', '@axis-ds/mcp': 'none' }) }));
  assert.equal(r.violation, true);
});

test('읽기 실패: 디렉터리 없음 · 앞머리 없는 changeset 은 rc 2', () => {
  assert.equal(run(join(tmpdir(), 'axis-cs-없는-디렉터리-zz')).status, 2);
  assert.equal(run(makeDir({ 'a.md': '앞머리 없는 본문\n' })).status, 2);
});
