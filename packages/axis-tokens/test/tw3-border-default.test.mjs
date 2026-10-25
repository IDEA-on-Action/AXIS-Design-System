// @ts-check
/**
 * Tailwind 3 preset 의 기본 테두리색 테스트 (WI-0077)
 *
 * Tailwind 3 preflight 는 `*, ::before, ::after { border: 0 solid theme('borderColor.DEFAULT') }` 를 낸다.
 * 1.8.0 이하 preset 은 DEFAULT 를 정하지 않아 gray-200(#e5e7eb)이 되고, quick-start 예시처럼 `@axis-ds/tokens/css/shadcn` 을
 * `@tailwind` 앞에 import 하면 preflight 가 뒤에 와서 그 파일의 `* { border-color: hsl(var(--border)) }` 를 이겼다.
 * 그래서 색 없는 `border` · `border-t` · `hr` 가 다크 · 브랜드에서도 회색이었다.
 *
 * 여기서는 설치된 Tailwind 3(tokens 의 peer, cjs-preset 테스트와 같은 설치본)으로 preset 을 실제로 컴파일해 preflight 의
 * border-color 를 본다. 같은 컴파일을 borderColor 를 뺀 preset 으로도 돌려 음성 대조군을 둔다.
 * fallback 값이 Tailwind 의 gray-200 과 같은 색인지도 Tailwind 가 가진 값으로 계산해 대조한다(--border 를 정의하지 않은 앱의 종전 색).
 *
 * 실행: node --test test/tw3-border-default.test.mjs
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadPresetFromSource } from '../scripts/tailwind4.mjs';

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const presetPath = join(pkgDir, 'src', 'tailwind-preset.ts');
const require = createRequire(join(pkgDir, 'package.json'));
const tailwindPkg = require.resolve('tailwindcss/package.json');
const twRequire = createRequire(tailwindPkg);
const tailwindcss = twRequire('tailwindcss');
const postcss = twRequire('postcss');
const tailwindColors = twRequire('tailwindcss/colors');

/** preset 이 정하는 기본 테두리색 (fallback 은 gray-200 의 HSL) */
const EXPECTED_DEFAULT = 'hsl(var(--border, 220 13% 91%))';

/**
 * preset 으로 `@tailwind base` 만 컴파일해 `*, ::before, ::after` preflight 규칙의 border-color 를 돌려준다.
 * @param {Record<string, any>} preset
 */
async function preflightBorderColor(preset) {
  const config = { presets: [preset], content: [{ raw: '<div class="border"></div>', extension: 'html' }] };
  const result = await postcss([tailwindcss(config)]).process('@tailwind base;', { from: undefined });
  /** @type {string[]} */
  const found = [];
  result.root.walkRules((/** @type {{ selector: string, walkDecls: Function }} */ rule) => {
    const sel = rule.selector.replace(/\s+/g, ' ');
    if (!/^\*, ?::before, ?::after$/.test(sel)) return;
    rule.walkDecls('border-color', (/** @type {{ value: string }} */ d) => { found.push(d.value); });
  });
  return found;
}

/** @param {string} hex */
function hexToRgb(hex) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  assert.ok(m, `hex 가 아닙니다: ${hex}`);
  return [1, 2, 3].map(i => parseInt(m[i], 16));
}

/** CSS Color 4 의 hsl → rgb (0~255 반올림) */
function hslToRgb(/** @type {number} */ h, /** @type {number} */ s, /** @type {number} */ l) {
  s /= 100; l /= 100;
  const f = (/** @type {number} */ n) => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)].map(v => Math.round(v * 255));
}

describe('Tailwind 3 preflight 의 기본 테두리색이 AXIS --border 를 따른다', () => {
  /** @type {Record<string, any>} */
  let preset;

  before(async () => {
    preset = await loadPresetFromSource(presetPath);
  });

  test('측정 도구가 Tailwind 3 이다', () => {
    assert.match(twRequire('tailwindcss/package.json').version, /^3\./);
  });

  test('preset 의 theme.extend.borderColor.DEFAULT 가 fallback 포함 hsl(var(--border)) 이다', () => {
    assert.deepEqual(preset.theme.extend.borderColor, { DEFAULT: EXPECTED_DEFAULT });
  });

  test('컴파일한 preflight 의 border-color 가 preset 값 하나뿐이다', async () => {
    assert.deepEqual(await preflightBorderColor(preset), [EXPECTED_DEFAULT]);
  });

  test('음성 대조: borderColor 를 뺀 preset 은 preflight 가 gray-200(#e5e7eb) 이다 (1.8.0 이하 동작)', async () => {
    const p = structuredClone(preset);
    delete p.theme.extend.borderColor;
    assert.deepEqual(await preflightBorderColor(p), [tailwindColors.gray[200]]);
    assert.equal(tailwindColors.gray[200], '#e5e7eb');
  });

  test('fallback 이 Tailwind 3 gray-200 과 같은 rgb 다 (--border 를 정의하지 않은 앱은 종전 색)', () => {
    const m = /^hsl\(var\(--border, (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)% (\d+(?:\.\d+)?)%\)\)$/.exec(EXPECTED_DEFAULT);
    assert.ok(m, EXPECTED_DEFAULT);
    const rgb = hslToRgb(Number(m[1]), Number(m[2]), Number(m[3]));
    assert.deepEqual(rgb, hexToRgb(tailwindColors.gray[200]));
    assert.deepEqual(rgb, [229, 231, 235]);
  });

  test('음성 대조: fallback 이 다르면 위 비교가 잡는다 (계산기 자기 검사)', () => {
    assert.notDeepEqual(hslToRgb(220, 13, 80), hexToRgb(tailwindColors.gray[200]));
  });
});
