/**
 * check-library-links.mjs 테스트 (WI-0083 D2: 7. code 모양 판정)
 *
 * 실행: node --test scripts/check-library-links.test.mjs (`pnpm check-library-links` 가 함께 돌린다)
 * 실제 apps/web/public/library 사본을 고쳐 스크립트를 새 프로세스로 돌리고 종료 코드와 위반 문구를 본다.
 * 대표 선택(e2e/library-reps.cjs)이 대표 3개만 읽게 된 뒤로, 나머지 항목의 파일 결손 · code 모양은 이 검사만 본다.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, 'scripts', 'check-library-links.mjs');
const LIBRARY = join(ROOT, 'apps', 'web', 'public', 'library');
const APP = join(ROOT, 'apps', 'web', 'src', 'app');
const { pickLibraryReps } = createRequire(import.meta.url)(join(ROOT, 'apps', 'web', 'e2e', 'library-reps.cjs'));

const tmpDirs = [];
after(() => { for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true }); });

function copyLibrary() {
  const dir = fs.mkdtempSync(join(tmpdir(), 'axis-library-links-'));
  tmpDirs.push(dir);
  // routeExists 는 <library>/.. 아래 정적 파일도 실재로 보므로 public 구조(public/library)를 유지한다
  const lib = join(dir, 'public', 'library');
  fs.cpSync(LIBRARY, lib, { recursive: true });
  // 디렉터리는 junction(Windows 에서 권한 없이 만들 수 있음), 파일은 복사한다(파일 symlink 는 Windows 에서 권한이 필요)
  for (const e of fs.readdirSync(join(LIBRARY, '..'), { withFileTypes: true })) {
    if (e.name === 'library') continue;
    const src = join(LIBRARY, '..', e.name);
    if (e.isDirectory()) fs.symlinkSync(src, join(dir, 'public', e.name), 'junction');
    else fs.copyFileSync(src, join(dir, 'public', e.name));
  }
  return lib;
}

function run(lib) {
  const r = spawnSync(process.execPath, [SCRIPT, '--library', lib, '--app', APP], { encoding: 'utf-8' });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

function edit(lib, id, fn) {
  const f = join(lib, 'components', `${id}.json`);
  const j = JSON.parse(fs.readFileSync(f, 'utf-8'));
  fn(j);
  fs.writeFileSync(f, JSON.stringify(j));
}

/**
 * 변이 대상: 대표(e2e/library-reps.cjs)가 아니면서 코드 파일이 1개 이상 있는 마지막 항목.
 * id 를 박지 않고 index 에서 고른다(데이터가 바뀌어도 ENOENT 가 아니라 이 규칙으로 다시 고름). 없으면 멈춘다
 */
function pickVictim() {
  const repIds = new Set(Object.values(pickLibraryReps(join(LIBRARY, '..'))).map((r) => r.id));
  const index = JSON.parse(fs.readFileSync(join(LIBRARY, 'index.json'), 'utf-8'));
  const victim = index.components.findLast((e) => {
    if (repIds.has(e.id)) return false;
    const j = JSON.parse(fs.readFileSync(join(LIBRARY, 'components', `${e.id}.json`), 'utf-8'));
    return Array.isArray(j.code?.files) && j.code.files.length > 0;
  });
  assert.ok(victim, '대표가 아니면서 코드 파일이 있는 항목이 없어요 (code 모양 변이가 성립하지 않음)');
  return victim.id;
}
const VICTIM = pickVictim();

test('양성 대조: 원본 사본은 위반 0건이고 컴포넌트 파일을 검사한다', () => {
  const { status, out } = run(copyLibrary());
  assert.equal(status, 0, out);
  assert.match(out, /컴포넌트 파일 \d+개/);
  assert.match(out, /위반 0건/);
  assert.doesNotMatch(out, /code 모양 불일치/);
});

test('비대표 항목의 상세 JSON 결손은 이 검사가 잡는다 (대표 선택에서 옮겨 온 판정)', () => {
  const lib = copyLibrary();
  fs.rmSync(join(lib, 'components', `${VICTIM}.json`));
  const { status, out } = run(lib);
  assert.equal(status, 1, out);
  assert.match(out, new RegExp(`components/${VICTIM}\\.json 이 없습니다`));
});

const CASES = [
  ['code 필드 없음', (j) => { delete j.code; }, 'code 가 객체가 아닙니다'],
  ['code.files 가 배열이 아님', (j) => { j.code.files = {}; }, 'code\\.files 가 배열이 아닙니다'],
  ['code.files[0].path 가 문자열이 아님', (j) => { j.code.files[0].path = 1; }, 'code\\.files\\[0\\]\\.path 가 문자열이 아닙니다'],
  ['code.files[0].content 없음', (j) => { delete j.code.files[0].content; }, 'code\\.files\\[0\\]\\.content 가 문자열이 아닙니다'],
  ['code.dependencies 없음', (j) => { delete j.code.dependencies; }, 'code\\.dependencies 가 배열이 아닙니다'],
  ['code.registryDeps 가 문자열', (j) => { j.code.registryDeps = 'button'; }, 'code\\.registryDeps 가 배열이 아닙니다'],
  ['code.registryDeps 에 숫자', (j) => { j.code.registryDeps = [1]; }, 'code\\.registryDeps 에 문자열이 아닌 값이 있습니다'],
];

for (const [label, mutate, message] of CASES) {
  test(`code 모양: ${label} 이면 위반 (수정 전 rc 0)`, () => {
    const lib = copyLibrary();
    edit(lib, VICTIM, mutate);
    const { status, out } = run(lib);
    assert.equal(status, 1, out);
    assert.match(out, /\[code 모양 불일치\] 1건/);
    assert.match(out, new RegExp(`components/${VICTIM}\\.json: ${message}`));
  });
}

test('code 모양: 상세 화면이 읽지 않는 devDependencies 는 보지 않는다', () => {
  const lib = copyLibrary();
  edit(lib, VICTIM, (j) => { delete j.code.devDependencies; });
  const { status, out } = run(lib);
  assert.equal(status, 0, out);
});
