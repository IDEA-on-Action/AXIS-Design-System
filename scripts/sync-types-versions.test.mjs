/**
 * typesVersions 생성 · 검사 테스트 (WI-0053 FR-1 · FR-2)
 *
 * 실행: node --test scripts/sync-types-versions.test.mjs
 * 변이: 실제 package.json 사본에서 exports 항목을 더하거나 빼거나 타깃을 바꾸면 --check 가 드리프트로
 * 잡아야 하고, 쓰기 모드로 다시 생성하면 통과해야 합니다.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTypesVersions, applyTypesVersions, syncPackage, TARGET_PACKAGES } from './sync-types-versions.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, 'scripts', 'sync-types-versions.mjs');
const tmpDirs = [];
after(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }); });

/** 실제 패키지의 package.json 을 임시 디렉터리에 복사하고 고친다 */
function copyPackage(rel, mutate) {
  const dir = mkdtempSync(join(tmpdir(), 'axis-tv-'));
  tmpDirs.push(dir);
  const pkg = JSON.parse(readFileSync(join(ROOT, rel, 'package.json'), 'utf8'));
  if (mutate) mutate(pkg);
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
  return dir;
}
const runCli = (args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });

test('생성 규칙: types 조건 · JSON 문자열만, 루트 · CSS 제외', () => {
  const tv = buildTypesVersions({
    '.': { types: './dist/index.d.ts', import: './dist/index.mjs' },
    './button': { types: './dist/button/index.d.ts', import: './dist/button/index.mjs' },
    './json': './dist/json/tokens.json',
    './css': './dist/css/variables.css',
    './tailwind.css': './tailwind.css',
    './no-types': { import: './dist/x.mjs' },
  });
  assert.deepEqual(tv, { '*': { button: ['./dist/button/index.d.ts'], json: ['./dist/json/tokens.json'] } });
});

test('생성할 항목이 없으면 null(루트만 있는 theme)', () => {
  assert.equal(buildTypesVersions({ '.': { types: './dist/index.d.ts' } }), null);
  assert.equal(buildTypesVersions(undefined), null);
});

test('와일드카드 exports 키는 거부(node10 루트 재매핑 함정)', () => {
  assert.throws(() => buildTypesVersions({ './*': { types: './dist/*.d.ts' } }), /지원하지 않는 exports 키/);
});

test('typesVersions 는 exports 바로 뒤에 두고, null 이면 뺀다', () => {
  const pkg = { name: 'x', exports: {}, sideEffects: false, typesVersions: { '*': {} } };
  assert.deepEqual(Object.keys(applyTypesVersions(pkg, { '*': { a: ['b'] } })), ['name', 'exports', 'typesVersions', 'sideEffects']);
  assert.deepEqual(Object.keys(applyTypesVersions(pkg, null)), ['name', 'exports', 'sideEffects']);
});

test('저장소 4패키지: --check 통과, 키 수가 0 으로 무너지지 않음', () => {
  const r = runCli(['--check']);
  assert.equal(r.status, 0, r.stderr);
  const keys = Object.fromEntries([...r.stdout.matchAll(/OK (@axis-ds\/\S+) - 키 (\d+)개/g)].map((m) => [m[1], Number(m[2])]));
  assert.equal(Object.keys(keys).length, TARGET_PACKAGES.length);
  assert.ok(keys['@axis-ds/ui-react'] > 0 && keys['@axis-ds/agentic-ui'] > 0 && keys['@axis-ds/tokens'] > 0);
  assert.equal(keys['@axis-ds/theme'], 0);
});

test('저장소 패키지: typesVersions 와 exports 가 1:1(생성기와 독립 검산)', () => {
  for (const rel of TARGET_PACKAGES) {
    const pkg = JSON.parse(readFileSync(join(ROOT, rel, 'package.json'), 'utf8'));
    const map = pkg.typesVersions?.['*'] ?? {};
    const expected = {};
    for (const [k, v] of Object.entries(pkg.exports)) {
      if (k === '.') continue;
      if (typeof v === 'object' && v.types) expected[k.slice(2)] = v.types;
      else if (typeof v === 'string' && v.endsWith('.json')) expected[k.slice(2)] = v;
    }
    assert.deepEqual(Object.keys(map).sort(), Object.keys(expected).sort(), rel);
    for (const [k, v] of Object.entries(map)) assert.deepEqual(v, [expected[k]], `${rel} ${k}`);
    // 루트는 node10 이 types 필드로 찾으므로 typesVersions 키가 아니어야 한다
    assert.ok(!('' in map) && !('.' in map) && !('*' in map), rel);
  }
});

test('변이: exports 항목 추가 · 삭제 · 타깃 변경은 드리프트, 다시 생성하면 통과', () => {
  const added = copyPackage('packages/axis-ui-react', (p) => {
    p.exports['./new-thing'] = { types: './dist/new-thing/index.d.ts', import: './dist/new-thing/index.mjs' };
  });
  const removed = copyPackage('packages/axis-agentic-ui', (p) => { delete p.exports['./agent-avatar']; });
  const retarget = copyPackage('packages/axis-tokens', (p) => { p.exports['./json'] = './dist/json/other.json'; });
  const themeExtra = copyPackage('packages/axis-theme', (p) => { p.typesVersions = { '*': { x: ['./dist/x.d.ts'] } }; });

  const expect = { [added]: /빠짐 new-thing/, [removed]: /남음 agent-avatar/, [retarget]: /값 다름 json/, [themeExtra]: /남음 x/ };
  for (const [dir, re] of Object.entries(expect)) {
    const r = syncPackage(dir, { check: true });
    assert.equal(r.status, 'drift', dir);
    assert.match(r.message, re);
    const cli = runCli(['--check', '--only', dir]);
    assert.equal(cli.status, 1, cli.stdout + cli.stderr);
    // 쓰기 모드로 다시 생성하면 통과
    assert.equal(syncPackage(dir).status, 'updated');
    assert.equal(syncPackage(dir, { check: true }).status, 'ok');
    assert.equal(runCli(['--check', '--only', dir]).status, 0);
  }
});

test('측정 실패: package.json 없는 디렉터리는 exit 2', () => {
  const dir = mkdtempSync(join(tmpdir(), 'axis-tv-empty-'));
  tmpDirs.push(dir);
  assert.equal(runCli(['--check', '--only', dir]).status, 2);
});
