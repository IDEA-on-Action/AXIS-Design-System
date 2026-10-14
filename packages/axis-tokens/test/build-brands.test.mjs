/**
 * 브랜드 CSS 빌드 경로 테스트 (WI-0025 M2, build-tokens.mjs 5단계)
 *
 * brands.test.mjs 가 순수 함수만 보는 것과 달리, 여기서는 scripts/build-brands.mjs 를 실제로 돌려
 * SD 필터 · css/axis-brand 포맷 · 선택자 · shadcn 결합 · brand.json 복사 · 잔여 산출물 삭제 ·
 * 임시 디렉터리 정리를 확인한다. 마지막 묶음은 build-tokens.mjs 를 패키지 사본에서 통째로 실행해
 * 5단계 배선(검증 실패 시 rc 1)까지 본다.
 *
 * dist 를 읽지 않는다(turbo test 는 build 에 의존하지 않음). 모든 산출물은 OS 임시 디렉터리에 쓴다.
 * 실행: node --test test/build-brands.test.mjs
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildBrands } from '../scripts/build-brands.mjs';
import { brandExportEntries, brandSelectors, SHADCN_KEYS } from '../scripts/brands.mjs';

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(pkgDir, 'src');
const fixtures = join(pkgDir, 'test', 'fixtures', 'brands');

/** 4단계 산출물 대신 쓰는 shadcn-compat.css :root 블록(SHADCN_KEYS 드리프트 검사 통과용) */
const SHADCN_CSS = `:root {\n${SHADCN_KEYS.map(k => `  --${k}: 0 0% 0%;`).join('\n')}\n}\n`;

function pkgFor(...names) {
  return { exports: Object.assign({}, ...names.map(brandExportEntries)) };
}

let work;
before(() => { work = mkdtempSync(join(tmpdir(), 'axis-brands-test-')); });
after(() => { rmSync(work, { recursive: true, force: true }); });

/** 테스트마다 새 dist · 임시 부모 디렉터리를 만든다 */
function scratch(label) {
  const dir = join(work, label);
  const distDir = join(dir, 'dist');
  const tmpParent = join(dir, 'tmp');
  mkdirSync(distDir, { recursive: true });
  mkdirSync(tmpParent, { recursive: true });
  return { dir, distDir, tmpParent };
}

/** CSS 에서 선택자로 시작하는 블록 본문을 꺼낸다(없으면 undefined) */
function blockOf(css, selectors) {
  const head = `${selectors.join(',\n')} {\n`;
  const start = css.indexOf(head);
  if (start < 0) return undefined;
  const end = css.indexOf('\n}\n', start);
  return css.slice(start + head.length, end);
}

function writeBrand(brandsDir, name, { light, dark }) {
  const dir = join(brandsDir, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'light.json'), JSON.stringify(light));
  writeFileSync(join(dir, 'dark.json'), JSON.stringify(dark));
  writeFileSync(join(dir, 'brand.json'), JSON.stringify({
    name, description: 'test', themes: ['light', 'dark'], a11y: {},
  }));
}

describe('buildBrands 유효 fixture', () => {
  let result, css, s;
  before(async () => {
    s = scratch('valid');
    // 잔여 산출물: 이전 빌드에 있던 브랜드가 지워졌다고 가정
    mkdirSync(join(s.distDir, 'css', 'brands'), { recursive: true });
    writeFileSync(join(s.distDir, 'css', 'brands', 'old.css'), '/* stale */');
    mkdirSync(join(s.distDir, 'brands', 'old'), { recursive: true });
    writeFileSync(join(s.distDir, 'brands', 'old', 'brand.json'), '{}');

    result = await buildBrands({
      srcDir,
      brandsDir: join(fixtures, 'valid'),
      distDir: s.distDir,
      pkg: pkgFor('sample'),
      shadcnCss: SHADCN_CSS,
      tmpParent: s.tmpParent,
    });
    css = readFileSync(join(s.distDir, 'css', 'brands', 'sample.css'), 'utf-8');
  });

  test('위반 0건, 산출물 2개', () => {
    assert.deepEqual(result.violations, []);
    assert.deepEqual(result.brands, ['sample']);
    assert.equal(result.files.length, 2);
  });

  test('라이트 블록: 선택자 1개, 브랜드 토큰만, 참조가 풀린 값', () => {
    const light = blockOf(css, brandSelectors('sample').light);
    assert.ok(light, css);
    for (const name of [
      '--axis-surface-default', '--axis-surface-secondary', '--axis-text-primary', '--axis-border-focus',
      '--axis-button-bg-default', '--axis-button-bg-hover', '--axis-card-shadow-default',
      '--axis-radius-md', '--axis-font-family-sans',
    ]) {
      assert.ok(light.includes(`  ${name}: `), `${name} 없음\n${light}`);
    }
    // 브랜드에 없는 기본 토큰은 내지 않는다(SD 필터)
    assert.ok(!light.includes('--axis-color-blue-500'), light);
    assert.ok(!light.includes('--axis-text-secondary'), light);
    assert.ok(!light.includes('{'), `참조가 풀리지 않았습니다\n${light}`);
  });

  test('라이트 블록: shadcn 섹션 결합(hex 는 HSL 로, radius 는 그대로)', () => {
    const light = blockOf(css, brandSelectors('sample').light);
    assert.ok(light.includes('  --background: 210 22% 96%;'), light);
    assert.ok(light.includes('  --primary: 180 81% 43%;'), light);
    assert.ok(light.includes('  --radius: 12px;'), light);
  });

  test('다크 블록: 선택자 3개, 다크 토큰과 shadcn, component 참조가 풀림', () => {
    const dark = blockOf(css, brandSelectors('sample').dark);
    assert.ok(dark, css);
    assert.ok(dark.includes('  --axis-border-focus: '), dark);
    assert.ok(dark.includes('  --axis-button-bg-hover: '), dark);
    assert.ok(dark.includes('  --background: 217 41% 10%;'), dark);
    assert.ok(!dark.includes('--axis-radius-md'), '라이트 전용 토큰이 다크에 나왔습니다');
    assert.ok(!dark.includes('{'), dark);
  });

  test('brand.json 을 바이트 그대로 복사', () => {
    const copied = readFileSync(join(s.distDir, 'brands', 'sample', 'brand.json'));
    const original = readFileSync(join(fixtures, 'valid', 'sample', 'brand.json'));
    assert.ok(copied.equals(original));
  });

  test('이전 빌드 잔여 산출물 삭제', () => {
    assert.deepEqual(readdirSync(join(s.distDir, 'css', 'brands')), ['sample.css']);
    assert.deepEqual(readdirSync(join(s.distDir, 'brands')), ['sample']);
  });

  test('임시 디렉터리 정리', () => {
    assert.deepEqual(readdirSync(s.tmpParent), []);
  });
});

describe('buildBrands 0토큰 테마 (회귀: SD 가 output 을 비워 돌려줌)', () => {
  test('shadcn 만 있는 다크 테마도 블록이 나온다', async () => {
    const s = scratch('shadcn-only');
    const brandsDir = join(s.dir, 'brands');
    writeBrand(brandsDir, 'sample', {
      light: { radius: { md: { value: '10px' } }, shadcn: { background: '210 22% 96%' } },
      dark: { shadcn: { background: '217 41% 10%' } },
    });
    const result = await buildBrands({
      srcDir, brandsDir, distDir: s.distDir, pkg: pkgFor('sample'), shadcnCss: SHADCN_CSS, tmpParent: s.tmpParent,
    });
    assert.deepEqual(result.violations, []);
    const css = readFileSync(join(s.distDir, 'css', 'brands', 'sample.css'), 'utf-8');
    const dark = blockOf(css, brandSelectors('sample').dark);
    assert.ok(dark !== undefined, `다크 블록이 빠졌습니다\n${css}`);
    assert.equal(dark, '  --background: 217 41% 10%;');
    const light = blockOf(css, brandSelectors('sample').light);
    assert.ok(light.includes('  --axis-radius-md: 10px;'), light);
    assert.ok(light.includes('  --background: 210 22% 96%;'), light);
  });

  test('선언이 하나도 없는 테마는 빈 블록을 만들지 않는다', async () => {
    const s = scratch('light-only-radius');
    const brandsDir = join(s.dir, 'brands');
    writeBrand(brandsDir, 'sample', {
      light: { radius: { md: { value: '10px' } } },
      dark: {},
    });
    const result = await buildBrands({
      srcDir, brandsDir, distDir: s.distDir, pkg: pkgFor('sample'), shadcnCss: SHADCN_CSS, tmpParent: s.tmpParent,
    });
    assert.deepEqual(result.violations, []);
    const css = readFileSync(join(s.distDir, 'css', 'brands', 'sample.css'), 'utf-8');
    assert.equal(blockOf(css, brandSelectors('sample').dark), undefined, css);
    assert.ok(blockOf(css, brandSelectors('sample').light).includes('--axis-radius-md'));
  });
});

describe('buildBrands 브랜드 0개 · 검증 실패', () => {
  test('브랜드 디렉터리가 없으면 아무것도 만들지 않고 잔여만 지운다', async () => {
    const s = scratch('none');
    mkdirSync(join(s.distDir, 'css', 'brands'), { recursive: true });
    writeFileSync(join(s.distDir, 'css', 'brands', 'old.css'), '/* stale */');
    const result = await buildBrands({
      srcDir, brandsDir: join(s.dir, 'no-brands'), distDir: s.distDir, pkg: {}, shadcnCss: SHADCN_CSS, tmpParent: s.tmpParent,
    });
    assert.deepEqual(result, { brands: [], violations: [], files: [] });
    assert.equal(existsSync(join(s.distDir, 'css', 'brands')), false);
    assert.equal(existsSync(join(s.distDir, 'brands')), false);
    assert.deepEqual(readdirSync(s.tmpParent), []);
  });

  test('검증 위반이 있으면 파일을 쓰지 않고 위반을 돌려준다', async () => {
    const s = scratch('invalid');
    const result = await buildBrands({
      srcDir, brandsDir: join(fixtures, 'invalid'), distDir: s.distDir, pkg: {}, shadcnCss: SHADCN_CSS, tmpParent: s.tmpParent,
    });
    assert.ok(result.violations.length > 0);
    assert.deepEqual(result.files, []);
    assert.equal(existsSync(join(s.distDir, 'css', 'brands')), false);
    assert.deepEqual(readdirSync(s.tmpParent), []);
  });

  test('B5 exports 누락은 위반', async () => {
    const s = scratch('no-exports');
    const result = await buildBrands({
      srcDir, brandsDir: join(fixtures, 'valid'), distDir: s.distDir, pkg: { exports: {} }, shadcnCss: SHADCN_CSS, tmpParent: s.tmpParent,
    });
    assert.equal(result.violations.filter(v => v.includes('B5')).length, 2, result.violations.join('\n'));
    assert.deepEqual(result.files, []);
  });

  test('SHADCN_KEYS 와 shadcn-compat.css :root 이름이 다르면 위반', async () => {
    const s = scratch('drift');
    const result = await buildBrands({
      srcDir, brandsDir: join(fixtures, 'valid'), distDir: s.distDir, pkg: pkgFor('sample'),
      shadcnCss: ':root {\n  --background: 0 0% 100%;\n}\n', tmpParent: s.tmpParent,
    });
    assert.ok(result.violations.some(v => v.includes('SHADCN_KEYS')), result.violations.join('\n'));
  });
});

describe('build-tokens.mjs 5단계 배선 (패키지 사본에서 실행)', () => {
  let copy;
  before(() => {
    copy = join(work, 'pkg-copy');
    mkdirSync(copy, { recursive: true });
    for (const entry of ['build-tokens.mjs', 'scripts', 'src', 'package.json']) {
      cpSync(join(pkgDir, entry), join(copy, entry), { recursive: true });
    }
    // junction: Windows 에서 관리자 권한 없이 만들 수 있다(Linux 는 type 인자를 무시)
    symlinkSync(join(pkgDir, 'node_modules'), join(copy, 'node_modules'), 'junction');
  });

  function runBuild() {
    return spawnSync(process.execPath, ['build-tokens.mjs'], { cwd: copy, encoding: 'utf-8' });
  }

  test('브랜드 0개: rc 0, 브랜드 산출물 없음', () => {
    rmSync(join(copy, 'src', 'brands'), { recursive: true, force: true });
    const r = runBuild();
    assert.equal(r.status, 0, r.stderr);
    assert.equal(existsSync(join(copy, 'dist', 'css', 'brands')), false);
    assert.ok(existsSync(join(copy, 'dist', 'css', 'variables.css')));
  });

  test('유효 브랜드 + exports: rc 0, 브랜드 CSS 와 brand.json 생성', () => {
    cpSync(join(fixtures, 'valid', 'sample'), join(copy, 'src', 'brands', 'sample'), { recursive: true });
    const pkg = JSON.parse(readFileSync(join(copy, 'package.json'), 'utf-8'));
    Object.assign(pkg.exports, brandExportEntries('sample'));
    writeFileSync(join(copy, 'package.json'), JSON.stringify(pkg, null, 2));

    const r = runBuild();
    assert.equal(r.status, 0, r.stderr);
    assert.ok(r.stdout.includes('✓ brands/sample.css generated'), r.stdout);
    const css = readFileSync(join(copy, 'dist', 'css', 'brands', 'sample.css'), 'utf-8');
    assert.ok(blockOf(css, brandSelectors('sample').light));
    assert.ok(blockOf(css, brandSelectors('sample').dark));
    assert.ok(existsSync(join(copy, 'dist', 'brands', 'sample', 'brand.json')));
  });

  test('검증 위반: rc 1, 위반 출력, 이전 브랜드 산출물 제거', () => {
    const dark = join(copy, 'src', 'brands', 'sample', 'dark.json');
    const json = JSON.parse(readFileSync(dark, 'utf-8'));
    delete json.text;
    writeFileSync(dark, JSON.stringify(json));

    const r = runBuild();
    assert.equal(r.status, 1, r.stdout);
    assert.ok(r.stderr.includes('브랜드 검증 실패') && r.stderr.includes('V7'), r.stderr);
    assert.equal(existsSync(join(copy, 'dist', 'css', 'brands', 'sample.css')), false);
  });
});
