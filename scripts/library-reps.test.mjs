/**
 * library 대표 선택 테스트 (WI-0083 AC1~AC5)
 *
 * 실행: node --test scripts/library-reps.test.mjs (`pnpm check-library-links` 가 함께 돌린다)
 * 대상: apps/web/e2e/library-reps.cjs 의 pickLibraryReps(publicDir), a11y-routes.cjs 의 listA11yRoutes
 * 픽스처: 실제 apps/web/public/library 를 임시 디렉터리에 복사해 고친 사본과, 같은 항목 판정용 작은 합성 데이터.
 * 읽기 횟수는 fs.readFileSync 를 감싸 `library/components/` 아래 읽기만 센다.
 */
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'apps', 'web');
const require = createRequire(import.meta.url);
const { pickLibraryReps } = require(join(WEB, 'e2e', 'library-reps.cjs'));

const tmpDirs = [];
after(() => { for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true }); });

/** 실제 library 데이터 사본(publicDir)을 만든다 */
function copyPublic() {
  const dir = fs.mkdtempSync(join(tmpdir(), 'axis-library-reps-'));
  tmpDirs.push(dir);
  fs.cpSync(join(WEB, 'public', 'library'), join(dir, 'library'), { recursive: true });
  return dir;
}

function detailFile(publicDir, id) {
  return join(publicDir, 'library', 'components', `${id}.json`);
}

function editDetail(publicDir, id, fn) {
  const f = detailFile(publicDir, id);
  const j = JSON.parse(fs.readFileSync(f, 'utf-8'));
  fn(j);
  fs.writeFileSync(f, JSON.stringify(j));
}

/** fn 실행 동안 상세 JSON(library/components/ 아래) readFileSync 횟수를 센다 */
function countDetailReads(fn) {
  const orig = fs.readFileSync;
  const marker = `${sep}library${sep}components${sep}`;
  let n = 0;
  fs.readFileSync = function (p, ...rest) {
    if (String(p).includes(marker)) n++;
    return orig.call(this, p, ...rest);
  };
  try {
    const value = fn();
    return { n, value };
  } finally {
    fs.readFileSync = orig;
  }
}

const summary = (reps) => Object.fromEntries(Object.entries(reps).map(([k, r]) => [k, r.id]));

/** 지금 데이터의 대표(WI-0078 이후 같은 값, AC5) */
const CURRENT = { code: 'axis-accordion', renamed: 'shadcn-accordion', existing: 'monet-hero-with-image' };

describe('pickLibraryReps (실제 데이터)', () => {
  test('대표 3개가 종전과 같다 (AC5)', () => {
    const reps = pickLibraryReps();
    assert.deepEqual(summary(reps), CURRENT);
    assert.ok(reps.code.detail.code.files.length > 0);
    assert.equal(reps.existing.detail.code.files.length, 0);
    assert.equal(reps.code.pagePath, '/library/ui/accordion/');
    assert.equal(reps.code.dataPath, '/library/components/axis-accordion.json');
  });

  test('상세 JSON 은 대표 3개만 읽는다 (AC1, 수정 전 129회)', () => {
    const { n, value } = countDetailReads(() => pickLibraryReps(copyPublic()));
    assert.deepEqual(summary(value), CURRENT);
    assert.equal(n, 3);
  });

  test('계측 대조: 같은 계측이 상세 JSON 읽기를 실제로 센다', () => {
    const dir = copyPublic();
    const { n } = countDetailReads(() => fs.readFileSync(detailFile(dir, 'axis-accordion'), 'utf-8'));
    assert.equal(n, 1);
  });

  test('a11y-routes 한 번 계산도 상세 JSON 을 3번만 읽는다 (AC1, 수정 전 258회)', () => {
    const modPath = join(WEB, 'e2e', 'a11y-routes.cjs');
    delete require.cache[require.resolve(modPath)];
    const { n, value } = countDetailReads(() => require(modPath).listA11yRoutes());
    assert.equal(n, 3);
    const lib = value.filter((r) => r.route.startsWith('library/['));
    assert.deepEqual(lib.map((r) => r.path).sort(), ['/library/ui/', '/library/ui/accordion/']);
  });
});

describe('pickLibraryReps (사본 변이)', () => {
  test('대표가 아닌 항목의 상세 JSON 이 없어도 대표는 그대로다 (AC2, 수정 전 ENOENT)', () => {
    const dir = copyPublic();
    const index = JSON.parse(fs.readFileSync(join(dir, 'library', 'index.json'), 'utf-8'));
    const last = index.components.at(-1).id;
    assert.ok(!Object.values(CURRENT).includes(last), `마지막 항목 ${last} 가 대표예요 (변이가 성립하지 않음)`);
    fs.rmSync(detailFile(dir, last));
    assert.deepEqual(summary(pickLibraryReps(dir)), CURRENT);
  });

  test('대표보다 앞 항목의 code 가 빠져도 대표는 그대로다 (수정 전 TypeError)', () => {
    const dir = copyPublic();
    // index 0~80 은 code 대표(index 81)보다 앞이다. renamed 대표(index 0)는 빼고 그다음 항목을 고친다
    const index = JSON.parse(fs.readFileSync(join(dir, 'library', 'index.json'), 'utf-8'));
    const victim = index.components.find((e) => !Object.values(CURRENT).includes(e.id)).id;
    editDetail(dir, victim, (j) => { delete j.code; });
    assert.deepEqual(summary(pickLibraryReps(dir)), CURRENT);
  });

  for (const kind of Object.keys(CURRENT)) {
    test(`대표 ${kind} 의 상세 JSON 이 없으면 종류와 id 를 담아 멈춘다 (AC3)`, () => {
      const dir = copyPublic();
      fs.rmSync(detailFile(dir, CURRENT[kind]));
      assert.throws(() => pickLibraryReps(dir), new RegExp(`대표 ${kind} ${CURRENT[kind]} 의 상세 JSON.*읽지 못했어요`));
    });

    test(`대표 ${kind} 의 code 가 빠지면 TypeError 가 아니라 종류와 id 를 담아 멈춘다 (AC3)`, () => {
      const dir = copyPublic();
      editDetail(dir, CURRENT[kind], (j) => { delete j.code; });
      assert.throws(() => pickLibraryReps(dir), (err) => {
        assert.ok(!(err instanceof TypeError), String(err));
        assert.match(err.message, new RegExp(`대표 ${kind} ${CURRENT[kind]} 의 상세 JSON.*code\\.files 배열이 없어요`));
        return true;
      });
    });
  }

  test('code 대표에 코드 파일이 없으면 멈춘다(다른 항목으로 조용히 넘어가지 않음)', () => {
    const dir = copyPublic();
    editDetail(dir, CURRENT.code, (j) => { j.code.files = []; });
    assert.throws(() => pickLibraryReps(dir), /대표 code axis-accordion .*코드 파일이 없어요/);
  });

  test('existing 대표에 코드 파일이 있으면 멈춘다', () => {
    const dir = copyPublic();
    editDetail(dir, CURRENT.existing, (j) => { j.code.files = [{ path: 'x.tsx', content: 'x', type: 'registry:ui' }]; });
    assert.throws(() => pickLibraryReps(dir), /대표 existing monet-hero-with-image .*코드 파일이 있어요/);
  });

  test('renamed 대표에 코드가 생겨도 code 대표는 axis 첫 항목이라 서로 다른 항목이다 (수정 전 code=renamed=shadcn-accordion)', () => {
    const dir = copyPublic();
    editDetail(dir, CURRENT.renamed, (j) => { j.code.files = [{ path: 'x.tsx', content: 'x', type: 'registry:ui' }]; });
    const reps = pickLibraryReps(dir);
    assert.deepEqual(summary(reps), CURRENT);
  });
});

describe('pickLibraryReps (같은 항목 금지, AC4)', () => {
  /** 합성 데이터: entries 는 index 항목, files 는 id -> 코드 파일 수 */
  function synth(entries, files) {
    const dir = fs.mkdtempSync(join(tmpdir(), 'axis-library-reps-synth-'));
    tmpDirs.push(dir);
    fs.mkdirSync(join(dir, 'library', 'components'), { recursive: true });
    fs.writeFileSync(join(dir, 'library', 'index.json'), JSON.stringify({ components: entries }));
    for (const e of entries) {
      const n = files[e.id] ?? 0;
      fs.writeFileSync(detailFile(dir, e.id), JSON.stringify({
        id: e.id, slug: e.slug, name: e.id, category: e.category, source: { type: e.source },
        code: { files: Array.from({ length: n }, (_, i) => ({ path: `f${i}.tsx`, content: '', type: 'registry:ui' })), dependencies: [], devDependencies: [], registryDeps: [] },
      }));
    }
    return dir;
  }
  const e = (id, source, slug, category = 'ui') => ({ id, source, slug, category });

  test('합성 양성 대조: 서로 다른 세 항목이면 고른다', () => {
    const dir = synth([e('shadcn-a', 'shadcn', 'shadcn-a'), e('axis-b', 'axis', 'b'), e('monet-c', 'monet', 'c')], { 'axis-b': 1 });
    assert.deepEqual(summary(pickLibraryReps(dir)), { code: 'axis-b', renamed: 'shadcn-a', existing: 'monet-c' });
  });

  test('code 대표와 renamed 대표가 같은 항목이면 멈춘다', () => {
    // axis 첫 항목이 slug 가 바뀐 항목이면 code 와 renamed 가 둘 다 그 항목이 된다
    const dir = synth([e('axis-axis-a', 'axis', 'axis-a'), e('shadcn-b', 'shadcn', 'b'), e('monet-c', 'monet', 'c')], { 'axis-axis-a': 1 });
    assert.throws(() => pickLibraryReps(dir), /대표 code 와 renamed 가 같은 항목이에요 \(axis-axis-a/);
  });

  test('id 가 달라도 상세 주소가 같으면 멈춘다', () => {
    const dir = synth([e('shadcn-x', 'shadcn', 'shadcn-x'), e('axis-y', 'axis', 'shadcn-x'), e('monet-c', 'monet', 'c')], { 'axis-y': 1 });
    assert.throws(() => pickLibraryReps(dir), /대표 code 와 renamed 가 같은 항목이에요/);
  });
});
