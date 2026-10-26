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

import { brandSelectors, collectBasePaths, cssVarName, loadBrand, validateBrand } from '../scripts/brands.mjs';
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

/** 테마별 실제 적용 값: 다크는 다크 선언, 없으면 라이트 선언(문서 안내대로 tokens CSS 뒤에 import 할 때). '#RRGGBB' 는 고정 색 */
function effective(theme, name) {
  if (name.startsWith('#')) return name.toUpperCase();
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

/** shadcn-compat.css 와 같은 HSL 세 값(`H S% L%`)을 6자리 hex 로 */
function hslToHex(triple) {
  const m = /^([\d.]+) ([\d.]+)% ([\d.]+)%$/.exec(triple);
  assert.ok(m, `HSL 형식이 아님: ${triple}`);
  const [h, sat, l] = [Number(m[1]), Number(m[2]) / 100, Number(m[3]) / 100];
  const a = sat * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return '#' + [0, 8, 4].map(n => Math.round(f(n) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** shadcn 변수(브랜드 JSON shadcn 블록): 다크는 다크 선언, 없으면 라이트 선언 */
function shadcnValue(theme, name) {
  const key = name.replace(/^--/, '');
  const v = theme === 'dark' ? (ontology.shadcn.dark[key] ?? ontology.shadcn.light[key]) : ontology.shadcn.light[key];
  assert.ok(typeof v === 'string', `${theme} shadcn ${name} 값 없음`);
  return /^#/.test(v) ? v.toUpperCase() : hslToHex(v);
}

function bgOf(theme, bg, bgShadcn = false) {
  if (bgShadcn) return shadcnValue(theme, bg);
  if (typeof bg === 'string') return effective(theme, bg);
  return mixOver(effective(theme, bg.mix), effective(theme, bg.over ?? '--axis-surface-default'), bg.pct);
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
    const brandLight = blockValues(readFileSync(brandPath, 'utf8'), brandSelectors('ontology').light[0]);
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

  test('PlanCard 거절 hover 글자는 bad-dark(status-error-strong), 기본값은 red.700 참조 (리뷰 f1 · WI-0029)', () => {
    // WI-0029(PRD 2.1): 기본값은 status.error(대비 3.01) 대신 라이트 red.700 · 다크 red.400
    assert.equal(base.refs.get('plan-card.reject-hover-text'), '{color.red.700}');
    for (const theme of ['light', 'dark']) {
      assert.equal(effective(theme, '--axis-plan-card-reject-hover-text'), P('bad-dark')[theme]);
      assert.equal(effective(theme, '--axis-plan-card-reject-hover-text'), effective(theme, '--axis-status-error-strong'));
    }
  });

  // WI-0079(2026-10-26 사용자 결정, 확인 문서 design-review.md 권장안 + Q3 destructive 분리): 값은 v1 팔레트 이름으로 단언한다.
  // 다크 경계 · 트랙은 라이트 sub 와 같은 역할이지만 다크 sub(#9CA3AD) 가 아니라 muted 단계를 쓴다(확인 문서 5절 ① B).
  test('WI-0079: 폼 컨트롤 경계 · 트랙 = 라이트 sub · 다크 muted', () => {
    for (const name of ['--axis-form-control-border', '--axis-form-control-track']) {
      assert.equal(effective('light', name), P('sub').light, `light ${name}`);
      assert.equal(effective('dark', name), P('muted').dark, `dark ${name}`);
    }
  });

  test('WI-0079: Progress success = ink-2, warning = bad, destructive = bad-dark (상태 색 접기와 같은 의미)', () => {
    for (const theme of ['light', 'dark']) {
      assert.equal(effective(theme, '--axis-progress-fill-success'), P('ink-2')[theme]);
      assert.equal(effective(theme, '--axis-progress-fill-warning'), P('bad')[theme]);
      assert.equal(effective(theme, '--axis-progress-fill-destructive'), P('bad-dark')[theme]);
      // 상태 색 접기(부록 B ⑥)와 같은 매핑: success = status-success, warning = status-warning, destructive = status-warning-strong
      assert.equal(effective(theme, '--axis-progress-fill-success'), effective(theme, '--axis-status-success'));
      assert.equal(effective(theme, '--axis-progress-fill-warning'), effective(theme, '--axis-status-warning'));
      assert.equal(effective(theme, '--axis-progress-fill-destructive'), effective(theme, '--axis-status-warning-strong'));
      // Q3: warning 과 destructive 가 같은 빨강이 되지 않게 두 단계로 나눈다
      assert.notEqual(effective(theme, '--axis-progress-fill-warning'), effective(theme, '--axis-progress-fill-destructive'), `${theme} warning = destructive`);
    }
  });

  test('WI-0079: Input placeholder = 라이트 sub-aa · 다크 sub (부록 B ② 「muted 는 placeholder 에만」 철회), Textarea placeholder 와 같은 값', () => {
    for (const theme of ['light', 'dark']) {
      assert.equal(effective(theme, '--axis-input-text-placeholder'), P('sub-aa')[theme]);
      assert.notEqual(effective(theme, '--axis-input-text-placeholder'), P('muted')[theme]);
      assert.equal(effective(theme, '--axis-input-text-placeholder'), effective(theme, '--axis-text-tertiary'));
    }
  });

  test('WI-0079: Input 테두리는 부록 B ③ 예외 그대로 line-2 (바꾸지 않음)', () => {
    for (const theme of ['light', 'dark']) assert.equal(effective(theme, '--axis-input-border-default'), P('line-2')[theme]);
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

  test('부모 바탕 근거(parent)가 있는 행은 형식이 맞고 부모 바탕을 적었다 (리뷰 f2, 소스 대조는 check-contrast-pairs)', () => {
    const rows = CONTRAST_PAIRS.filter(p => p.parent);
    assert.ok(rows.length >= 5, `parent 행 ${rows.length}개`);
    for (const p of rows) {
      for (const loc of [p.parent.at, p.parent.fgAt]) assert.match(loc, /^[\w-]+\/index\.tsx:\d+$/, `${p.fg} ${loc}`);
      const parentBg = typeof p.bg === 'string' ? p.bg : p.bg.over;
      assert.match(parentBg ?? '', /^--axis-surface-/, `${p.fg} 부모 바탕 ${parentBg}`);
      assert.ok(p.parent.variant === undefined || /^[a-z-]+:$/.test(p.parent.variant), `${p.fg} variant ${p.parent.variant}`);
    }
  });

  for (const pair of CONTRAST_PAIRS) {
    for (const theme of ['light', 'dark']) {
      const bgLabel = typeof pair.bg === 'string' ? pair.bg : `${pair.bg.mix} ${pair.bg.pct}% over ${pair.bg.over ?? '--axis-surface-default'}`;
      test(`${theme} ${pair.fg} / ${bgLabel} >= ${pair.min}`, () => {
        const fg = effective(theme, pair.fg);
        const bg = bgOf(theme, pair.bg, pair.bgShadcn);
        const r = ratio(fg, bg);
        assert.ok(r >= pair.min, `${fg}/${bg} = ${r.toFixed(2)}:1 (${pair.where})`);
      });
    }
  }
});
