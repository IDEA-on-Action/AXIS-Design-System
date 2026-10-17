/**
 * ontology 접기 값 테스트 (WI-0025 M3, D-6 · U15 · U16 · D2 · plan 5.3)
 *
 * - 완전성: 기본 소스(semantic · component)의 모든 변수 이름이 ontology 라이트에 값을 가진다.
 *   이름 목록을 복제하지 않고 collectBasePaths 로 소스에서 뽑으므로, 기본 토큰이 늘면 이 테스트가 먼저 빨개진다.
 *   dist 대조는 check-token-refs 와 같은 정규식(`--[A-Za-z0-9_-]+`, 대문자 허용)으로 블록 선언을 읽는다.
 * - 값: 접기 결정(warning 단계 · 아바타 3색 · overlay · 다크 interactive · D2)과 v1 팔레트 폐쇄성.
 * - 대비: test/ontology-pairs.mjs 짝 표를 라이트 · 다크 값으로 끝까지 풀어 WCAG 대비를 계산한다.
 *
 * 실행: node --test test/ontology-values.test.mjs (dist 대조는 빌드 뒤에만 의미가 있고, dist 가 없으면 실패한다)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectBasePaths, cssVarName, loadBrand, validateBrand } from '../scripts/brands.mjs';
import { CONTRAST_PAIRS, V1_PALETTE } from './ontology-pairs.mjs';

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(pkgDir, 'src');
const base = collectBasePaths(srcDir);
const ontology = loadBrand(join(srcDir, 'brands'), 'ontology');

/**
 * 완전성 제외 목록. 이유 없이 늘리지 않는다(시작값 빈 배열, 2026-10-17 D4 결정 36: 기본값과 같은 값도 명시).
 * @type {{ name: string, why: string }[]}
 */
const COMPLETENESS_EXCLUDE = [];

/** 기본 소스의 semantic · component 변수 이름 (primitive 제외) */
function baseNonPrimitiveNames() {
  const names = new Set();
  for (const key of base.paths) {
    const path = JSON.parse(key);
    if (base.semanticTops.has(path[0]) || base.componentTops.has(path[0])) names.add(cssVarName(path));
  }
  return names;
}

/** 브랜드 트리 -> 변수 이름 Map(이름 -> 값) */
function brandMap(tree) {
  const map = new Map();
  const walk = (node, path) => {
    for (const [k, v] of Object.entries(node)) {
      if (v && typeof v === 'object' && 'value' in v) map.set(cssVarName([...path, k]), v.value);
      else if (v && typeof v === 'object') walk(v, [...path, k]);
    }
  };
  walk(tree, []);
  return map;
}

const light = brandMap(ontology.light);
const dark = brandMap(ontology.dark);

/** `{a.b}` 참조를 기본 소스로 끝까지 푼다 */
function resolveRef(value, depth = 0) {
  const m = /^\{([^{}]+)\}$/.exec(String(value));
  if (!m) return value;
  assert.ok(depth < 20 && base.refs.has(m[1]), `풀 수 없는 참조 ${value}`);
  return resolveRef(base.refs.get(m[1]), depth + 1);
}

/** 테마별 실제 적용 값: 다크는 다크 선언, 없으면 라이트 선언(문서 안내대로 tokens CSS 뒤에 import 할 때) */
function effective(theme, name) {
  const v = theme === 'dark' ? (dark.get(name) ?? light.get(name)) : light.get(name);
  assert.ok(v !== undefined, `${theme} ${name} 값 없음`);
  return String(resolveRef(v)).toUpperCase();
}

const lum = hex => {
  assert.match(hex, /^#[0-9A-F]{6}$/, `6자리 hex 가 아님: ${hex}`);
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** color-mix(in srgb, fg pct%, transparent) 를 under 위에 합성 */
const mixOver = (fg, under, pct) => '#' + [1, 3, 5].map(i => Math.round(
  parseInt(fg.slice(i, i + 2), 16) * (pct / 100) + parseInt(under.slice(i, i + 2), 16) * (1 - pct / 100),
).toString(16).padStart(2, '0')).join('').toUpperCase();

function bgOf(theme, bg) {
  if (typeof bg === 'string') return effective(theme, bg);
  return mixOver(effective(theme, bg.mix), effective(theme, '--axis-surface-default'), bg.pct);
}

/** CSS 블록(선택자 정확 일치)의 선언 이름 -> 값. check-token-refs collectBlockValues 와 같은 방식 */
function blockValues(css, selector) {
  const values = new Map();
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blockRe = /(^|[}\s;])([^{}]*?)\{([^{}]*)\}/g;
  let m;
  while ((m = blockRe.exec(text)) !== null) {
    if (!m[2].split(',').map(s => s.trim()).includes(selector)) continue;
    for (const d of m[3].matchAll(/(--[A-Za-z0-9_-]+)\s*:\s*([^;]*);/g)) values.set(d[1], d[2].trim());
  }
  return values;
}

describe('ontology 완전성 (U16 · D4 결정 36)', () => {
  const required = baseNonPrimitiveNames();

  test('기본 소스 이름 집합이 읽힌다 (양성 대조: 0 이면 측정 실패)', () => {
    assert.ok(required.size >= 100, `semantic · component 이름 ${required.size}개`);
    assert.ok(required.has('--axis-status-warning') && required.has('--axis-card-shadow'));
  });

  test('제외 목록 항목은 실제 기본 이름이고 이유가 있다', () => {
    for (const { name, why } of COMPLETENESS_EXCLUDE) {
      assert.ok(required.has(name), `기본에 없는 제외 항목 ${name}`);
      assert.ok(typeof why === 'string' && why.trim() !== '', `${name} 제외 이유 없음`);
    }
  });

  test('기본 semantic · component 이름이 모두 ontology 라이트에 있다', () => {
    const excluded = new Set(COMPLETENESS_EXCLUDE.map(e => e.name));
    const missing = [...required].filter(n => !excluded.has(n) && !light.has(n));
    assert.deepEqual(missing, [], `ontology 라이트 누락 ${missing.length}건`);
  });

  test('semantic 이름은 다크에도 모두 있다 (V7 과 같은 축, 다크 interactive 기본값 유지 포함)', () => {
    const missing = [...required]
      .filter(n => [...base.semanticTops].some(top => n.startsWith(`--axis-${top}-`)))
      .filter(n => !dark.has(n));
    assert.deepEqual(missing, []);
  });

  test('V1~V8 위반 0건', () => {
    assert.deepEqual(validateBrand(ontology, base), []);
  });

  test('dist: ontology.css 라이트 블록이 variables.css :root 의 semantic · component 이름을 모두 덮는다', () => {
    const cssDir = join(pkgDir, 'dist', 'css');
    const varsPath = join(cssDir, 'variables.css');
    const brandPath = join(cssDir, 'brands', 'ontology.css');
    assert.ok(existsSync(varsPath) && existsSync(brandPath), 'dist 가 없습니다(빌드 먼저, 미측정 0 금지)');
    const root = blockValues(readFileSync(varsPath, 'utf8'), ':root');
    const brandLight = blockValues(readFileSync(brandPath, 'utf8'), '[data-brand="ontology"]');
    assert.ok(root.size >= 250 && brandLight.size > 0, `읽은 선언 수 :root ${root.size} · 브랜드 ${brandLight.size}`);
    // dist :root 의 비 primitive 이름 = 소스에서 뽑은 이름 (추출 방식이 이름을 자르지 않는지 함께 본다)
    const primitive = new Set([...base.varNames].filter(n => !required.has(n)));
    const distNonPrimitive = [...root.keys()].filter(n => !primitive.has(n));
    assert.deepEqual(distNonPrimitive.sort(), [...required].sort(), 'dist :root 와 소스 이름 집합 불일치');
    const missing = distNonPrimitive.filter(n => !brandLight.has(n));
    assert.deepEqual(missing, [], `ontology.css 라이트 블록 누락 ${missing.length}건`);
  });
});

describe('ontology 접기 값 (U15 · D4 · D2)', () => {
  const P = name => V1_PALETTE[name];

  test('hex 값은 모두 v1 팔레트 안에서 고른다 (D-6)', () => {
    for (const [theme, map] of [['light', light], ['dark', dark]]) {
      const allowed = new Set(Object.values(V1_PALETTE).map(p => p[theme].toUpperCase()));
      const outside = [...map].filter(([, v]) => /^#/.test(v) && !allowed.has(v.toUpperCase()));
      assert.deepEqual(outside, [], `${theme} 팔레트 밖 값`);
    }
  });

  test('warning = bad, warning-strong = bad-dark, 바탕 역할은 bad-light (D4 결정 31)', () => {
    for (const theme of ['light', 'dark']) {
      assert.equal(effective(theme, '--axis-status-warning'), P('bad')[theme]);
      assert.equal(effective(theme, '--axis-status-warning-strong'), P('bad-dark')[theme]);
      assert.equal(effective(theme, '--axis-surface-warning'), P('bad-light')[theme]);
      assert.equal(effective(theme, '--axis-badge-warning-bg'), P('bad-light')[theme]);
    }
  });

  test('U15: success = ink-2, error = bad, running · info = key, diff.added = 회색', () => {
    for (const theme of ['light', 'dark']) {
      assert.equal(effective(theme, '--axis-status-success'), P('ink-2')[theme]);
      assert.equal(effective(theme, '--axis-status-error'), P('bad')[theme]);
      assert.equal(effective(theme, '--axis-status-running'), P('key')[theme]);
      assert.equal(effective(theme, '--axis-status-info'), P('key')[theme]);
      assert.equal(effective(theme, '--axis-diff-added'), P('sub-aa')[theme]);
    }
  });

  test('아바타: tool = key, assistant = ink-2, system = sub(라이트 sub-aa) (D4 결정 32)', () => {
    for (const theme of ['light', 'dark']) {
      assert.equal(effective(theme, '--axis-agent-avatar-tool'), P('key')[theme]);
      assert.equal(effective(theme, '--axis-agent-avatar-assistant'), P('ink-2')[theme]);
      assert.equal(effective(theme, '--axis-agent-avatar-system'), P('sub-aa')[theme]);
    }
  });

  test('overlay 는 기본값을 라이트 · 다크에 명시 (D4 결정 34)', () => {
    const def = base.refs.get('dialog.overlay.bg');
    assert.equal(light.get('--axis-dialog-overlay-bg'), def);
    assert.equal(dark.get('--axis-dialog-overlay-bg'), def);
  });

  test('U16: 다크 interactive-primary 는 기본 다크 값(참조)을 유지', () => {
    const baseDark = JSON.parse(readFileSync(join(srcDir, 'semantic', 'dark.json'), 'utf8')).interactive.primary.value;
    assert.equal(dark.get('--axis-interactive-primary'), baseDark);
    assert.equal(effective('light', '--axis-interactive-primary'), P('key').light);
  });

  test('D2: muted 는 글자 역할에 쓰지 않고, 테두리는 line-2 또는 bad 이다', () => {
    for (const theme of ['light', 'dark']) {
      assert.notEqual(effective(theme, '--axis-button-text-disabled'), P('muted')[theme]);
      assert.equal(effective(theme, '--axis-button-text-disabled'), P('sub-aa')[theme]);
      for (const border of ['--axis-border-warning', '--axis-status-error-border']) {
        assert.ok([P('line-2')[theme], P('bad')[theme]].includes(effective(theme, border)), `${theme} ${border}`);
      }
    }
  });

  test('라이트에만 두는 값은 테마 무관 값(transparent · 그림자)뿐이다', () => {
    const lightOnly = [...light.keys()].filter(n => !dark.has(n) && n.startsWith('--axis-'));
    for (const n of lightOnly) {
      assert.match(light.get(n), /^(transparent|0 0 #0000|\d|"|0$)/, `${n} = ${light.get(n)}`);
    }
  });
});

describe('ontology 짝 대비 (plan 5.3 검산)', () => {
  test('짝 표가 비어 있지 않다 (양성 대조)', () => {
    assert.ok(CONTRAST_PAIRS.length >= 20);
  });

  for (const pair of CONTRAST_PAIRS) {
    for (const theme of ['light', 'dark']) {
      const bgLabel = typeof pair.bg === 'string' ? pair.bg : `${pair.bg.mix} ${pair.bg.pct}%`;
      test(`${theme} ${pair.fg} / ${bgLabel} >= ${pair.min}`, () => {
        const fg = effective(theme, pair.fg);
        const bg = bgOf(theme, pair.bg);
        const r = ratio(fg, bg);
        assert.ok(r >= pair.min, `${fg}/${bg} = ${r.toFixed(2)}:1 (${pair.where})`);
      });
    }
  }
});
