// @ts-check
/**
 * Tailwind 4 진입점 테스트 (WI-0044 FR-1)
 *
 * dist/css/tailwind4.css 의 @theme inline 매핑이 Tailwind 3 preset(src/tailwind-preset.ts)과 어긋나지 않는지 본다.
 * - 생성기(scripts/tailwind4.mjs)와 다른 코드로 preset 을 직접 펼쳐 기대값을 만들고, 생성 결과를 파싱해 대조한다.
 *   같은 함수로 기대값과 실제값을 만들면 둘이 같이 틀려도 통과하므로 펼치기를 여기서 따로 구현한다.
 * - build-tokens.mjs 를 패키지 사본에서 실제로 실행해 파일이 만들어지고 CSS import 대상이 같은 디렉터리에 있는지 본다.
 *   dist 를 읽지 않는다(turbo test 는 build 에 의존하지 않음). 산출물은 OS 임시 디렉터리에 쓴다.
 *
 * 실행: node --test test/tailwind4.test.mjs
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTailwind4Css, loadPresetFromSource } from '../scripts/tailwind4.mjs';

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const presetPath = join(pkgDir, 'src', 'tailwind-preset.ts');

/** preset 의 theme.extend 키와 Tailwind 4 테마 변수 접두사 (Tailwind 4 테마 변수 이름 규칙) */
const EXPECTED_NAMESPACES = { colors: 'color', borderRadius: 'radius', fontFamily: 'font' };

/** 정의에서 정한 개수 (PRD FR-1: 색 24 · radius 3 · 글꼴 3) */
const EXPECTED_COUNTS = { color: 24, radius: 3, font: 3 };

/**
 * 테스트 쪽 독립 구현: 중첩 키를 Tailwind 4 이름으로 펼친다(DEFAULT 는 부모 이름).
 * @param {string} prefix
 * @param {Record<string, unknown>} obj
 * @param {Map<string, string>} out
 */
function expand(prefix, obj, out) {
  for (const [k, v] of Object.entries(obj)) {
    const name = k === 'DEFAULT' ? prefix : `${prefix}-${k}`;
    if (typeof v === 'string') out.set(name, v);
    else expand(name, /** @type {Record<string, unknown>} */ (v), out);
  }
}

/**
 * 생성 결과에서 `@theme inline { ... }` 블록의 선언을 읽는다. 블록 안의 모든 줄은 선언이어야 한다.
 * @param {string} css
 * @returns {Map<string, string>}
 */
function parseThemeInline(css) {
  const m = /^@theme inline \{\n([\s\S]*?)\n\}$/m.exec(css);
  assert.ok(m, '@theme inline 블록이 없습니다');
  const out = new Map();
  for (const line of m[1].split('\n')) {
    const d = /^ {2}(--[a-z0-9-]+): (.+);$/i.exec(line);
    assert.ok(d, `해석할 수 없는 줄: ${line}`);
    assert.ok(!out.has(d[1]), `중복 선언: ${d[1]}`);
    out.set(d[1], d[2]);
  }
  return out;
}

describe('tailwind4.css 매핑이 Tailwind 3 preset 과 같다', () => {
  /** @type {Record<string, any>} */
  let preset;
  /** @type {string} */
  let css;

  before(async () => {
    preset = await loadPresetFromSource(presetPath);
    css = buildTailwind4Css(preset);
  });

  test('preset 의 theme.extend 키가 변환 대상 3종뿐이다', () => {
    assert.deepEqual(Object.keys(preset.theme.extend).sort(), Object.keys(EXPECTED_NAMESPACES).sort());
  });

  test('preset 의 모든 키가 같은 값으로 @theme inline 에 있고, 그 밖의 선언은 없다', () => {
    /** @type {Map<string, string>} */
    const expected = new Map();
    for (const [key, ns] of Object.entries(EXPECTED_NAMESPACES)) {
      expand(`--${ns}`, preset.theme.extend[key], expected);
    }
    const actual = parseThemeInline(css);
    assert.deepEqual([...actual.keys()].sort(), [...expected.keys()].sort());
    for (const [name, value] of expected) assert.equal(actual.get(name), value, name);
  });

  test('개수가 색 24 · radius 3 · 글꼴 3 이다', () => {
    const actual = parseThemeInline(css);
    /** @type {Record<string, number>} */
    const counts = { color: 0, radius: 0, font: 0 };
    for (const name of actual.keys()) {
      const ns = /^--(color|radius|font)-/.exec(name);
      assert.ok(ns, `알 수 없는 접두사: ${name}`);
      counts[ns[1]] += 1;
    }
    assert.deepEqual(counts, EXPECTED_COUNTS);
  });

  test('대표 매핑 값 (bg-primary · rounded-md · font-mono)', () => {
    const actual = parseThemeInline(css);
    assert.equal(actual.get('--color-primary'), 'hsl(var(--primary))');
    assert.equal(actual.get('--color-primary-foreground'), 'hsl(var(--primary-foreground))');
    assert.equal(actual.get('--color-chart-1'), 'hsl(var(--chart-1))');
    assert.equal(actual.get('--radius-lg'), 'var(--radius)');
    assert.equal(actual.get('--radius-md'), 'calc(var(--radius) - 2px)');
    assert.equal(actual.get('--radius-sm'), 'calc(var(--radius) - 4px)');
    assert.match(actual.get('--font-mono') ?? '', /^var\(--axis-font-family-mono, /);
  });

  test("darkMode ['class'] 가 @custom-variant dark (.dark 와 그 자손) 로 옮겨진다", () => {
    assert.deepEqual(preset.darkMode, ['class']);
    assert.match(css, /^@custom-variant dark \(&:where\(\.dark, \.dark \*\)\);$/m);
  });

  test('토큰 CSS 2개를 맨 앞에서 base 레이어로 @import 한다', () => {
    const statements = css.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter(l => l.trim() !== '');
    assert.deepEqual(statements.slice(0, 2), [
      '@import "./variables.css" layer(base);',
      '@import "./shadcn-compat.css" layer(base);',
    ]);
    assert.equal(statements.filter(l => l.startsWith('@import')).length, 2);
  });
});

describe('변환기가 모르는 preset 항목은 조용히 빠뜨리지 않고 실패한다', () => {
  /** @param {(p: any) => void} mutate */
  const mutated = async mutate => {
    const p = structuredClone(await loadPresetFromSource(presetPath));
    mutate(p);
    return p;
  };

  test('theme.extend 에 새 키(spacing)', async () => {
    const p = await mutated(p => { p.theme.extend.spacing = { 18: '4.5rem' }; });
    assert.throws(() => buildTailwind4Css(p), /theme\.extend\.spacing/);
  });

  test("darkMode 가 'media'", async () => {
    const p = await mutated(p => { p.darkMode = 'media'; });
    assert.throws(() => buildTailwind4Css(p), /darkMode/);
  });

  test('extend 밖의 테마 키', async () => {
    const p = await mutated(p => { p.theme.colors = { brand: '#000' }; });
    assert.throws(() => buildTailwind4Css(p), /theme\.colors/);
  });

  test('문자열이 아닌 값', async () => {
    const p = await mutated(p => { p.theme.extend.borderRadius.xl = 4; });
    assert.throws(() => buildTailwind4Css(p), /borderRadius\.xl/);
  });
});

describe('build-tokens.mjs 가 dist/css/tailwind4.css 를 만든다 (패키지 사본에서 빌드)', () => {
  /** @type {string} */
  let work;
  /** @type {string} */
  let copy;
  /** @type {import('node:child_process').SpawnSyncReturns<string>} */
  let build;

  before(() => {
    work = mkdtempSync(join(tmpdir(), 'axis-tailwind4-test-'));
    copy = join(work, 'pkg');
    for (const entry of ['build-tokens.mjs', 'scripts', 'src', 'package.json']) {
      cpSync(join(pkgDir, entry), join(copy, entry), { recursive: true });
    }
    // junction: Windows 에서 관리자 권한 없이 만들 수 있다(Linux 는 type 인자를 무시)
    symlinkSync(join(pkgDir, 'node_modules'), join(copy, 'node_modules'), 'junction');
    build = spawnSync(process.execPath, ['build-tokens.mjs'], { cwd: copy, encoding: 'utf-8' });
  });
  after(() => { rmSync(work, { recursive: true, force: true }); });

  test('build-tokens.mjs 가 rc 0 으로 끝난다', () => {
    assert.equal(build.status, 0, build.stderr);
  });

  test('빌드 산출물이 preset 에서 만든 내용과 같다', async () => {
    const built = readFileSync(join(copy, 'dist', 'css', 'tailwind4.css'), 'utf-8');
    const preset = await loadPresetFromSource(join(copy, 'src', 'tailwind-preset.ts'));
    assert.equal(built, buildTailwind4Css(preset));
  });

  test('@import 대상 파일이 같은 디렉터리에 있다', () => {
    const built = readFileSync(join(copy, 'dist', 'css', 'tailwind4.css'), 'utf-8');
    const targets = [...built.matchAll(/^@import "\.\/([^"]+)"/gm)].map(m => m[1]);
    assert.equal(targets.length, 2);
    for (const t of targets) assert.ok(existsSync(join(copy, 'dist', 'css', t)), `없음: ${t}`);
  });

  test("package.json exports 의 './css/tailwind4' 가 산출물을 가리킨다", () => {
    const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8'));
    assert.equal(pkg.exports['./css/tailwind4'], './dist/css/tailwind4.css');
    assert.ok(existsSync(join(copy, pkg.exports['./css/tailwind4'])));
  });
});
