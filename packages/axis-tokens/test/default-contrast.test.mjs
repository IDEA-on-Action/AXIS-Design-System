/**
 * 기본 테마(브랜드 미지정) 글자 대비 (WI-0029 PRD 2.1 · 2.2 · AC3)
 *
 * - dist/css/variables.css 의 :root · .dark 값을 읽어 WI-0029 가 바꾼 짝의 대비를 계산한다.
 *   dist 가 없으면 건너뛰지 않고 실패한다(미측정 0 금지). dist 가 낡았는지는 baseline-1.2.1.test.mjs 의 stale 가드가 본다.
 * - 대비는 WCAG 2.x 상대 휘도로 계산하고, 모든 짝이 4.5:1 이상이어야 한다.
 * - prd 가 있는 행은 PRD 2.1 · 2.2 표의 계산값(소수 둘째 자리 버림)과 같은지도 본다(표와 산출물이 어긋나면 실패).
 * - bg 가 { mix, pct, over } 이면 `color-mix(in srgb, var(mix) pct%, transparent)` 를 over 위에 합성해 8bit 로 양자화한 색이다.
 * - bg 가 '#RRGGBB' 이면 토큰이 아닌 고정 바탕이다(문서 사이트 다크 바탕 #09090B, PRD 1.1 P6).
 * - WI-0062 · 0063: ontology 짝 표(test/ontology-pairs.mjs CONTRAST_PAIRS)를 기본 브랜드 라이트 · 다크에도 적용한다(D2).
 *   글자 행은 행의 min, kind: 'icon' 행은 WCAG 1.4.11 비텍스트 3:1 로 본다. 표에 둘 수 없는 기본 전용 짝
 *   (ontology 가 승인 예외이거나 shadcn 변수인 짝)은 DEFAULT_ONLY 에 둔다.
 *
 * 실행: node --test test/default-contrast.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONTRAST_PAIRS } from './ontology-pairs.mjs';

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const varsPath = join(pkgDir, 'dist', 'css', 'variables.css');
const shadcnPath = join(pkgDir, 'dist', 'css', 'shadcn-compat.css');

/**
 * 최상위 블록(:root · .dark)을 선택자별 Map(변수 이름 -> 값)으로 읽는다.
 * baseline-1.2.1.test.mjs 의 parseBlocks 를 import 하면 그 파일의 테스트까지 함께 등록돼 여기서는 따로 둔다.
 */
function readBlocks(css) {
  const blocks = new Map();
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/^(\S[^{\n]*?)\s*\{\n([^}]*)\n\}/gm)) {
    const vars = new Map();
    for (const d of m[2].matchAll(/^ {2}(--[A-Za-z0-9-]+): (.+);$/gm)) vars.set(d[1], d[2]);
    blocks.set(m[1], vars);
  }
  return blocks;
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
const floor2 = r => Math.floor(r * 100) / 100;
const mixOver = (fg, under, pct) => '#' + [1, 3, 5].map(i => Math.round(
  parseInt(fg.slice(i, i + 2), 16) * (pct / 100) + parseInt(under.slice(i, i + 2), 16) * (1 - pct / 100),
).toString(16).padStart(2, '0')).join('').toUpperCase();

const BOTH = ['light', 'dark'];
const SELECTOR = { light: ':root', dark: '.dark' };
const REJECT_HOVER_BG = { mix: '--axis-status-error', pct: 10, over: '--axis-surface-secondary' };

/** WI-0029 짝 표. prd: 테마별 PRD 계산값(소수 둘째 자리 버림) */
const PAIRS = [
  { fg: '--axis-button-text-default', bg: '--axis-button-bg-default', themes: BOTH, prd: { light: 5.16, dark: 5.16 } },
  { fg: '--axis-button-text-default', bg: '--axis-button-bg-hover', themes: BOTH, prd: { light: 6.70, dark: 6.70 } },
  { fg: '--axis-button-text-default', bg: '--axis-button-bg-active', themes: BOTH, prd: { light: 8.72, dark: 8.72 } },
  { fg: '--axis-button-destructive-text-default', bg: '--axis-button-destructive-bg-default', themes: BOTH, prd: { light: 4.82, dark: 4.82 } },
  { fg: '--axis-button-destructive-text-default', bg: '--axis-button-destructive-bg-hover', themes: BOTH, prd: { light: 6.47, dark: 6.47 } },
  { fg: '--axis-button-destructive-text-default', bg: '--axis-button-destructive-bg-active', themes: BOTH, prd: { light: 8.31, dark: 8.31 } },
  { fg: '--axis-agent-message-user-text', bg: '--axis-agent-message-user-bg', themes: BOTH, prd: { light: 5.16, dark: 5.16 } },
  { fg: '--axis-status-success-contrast', bg: '--axis-plan-card-approve-bg', themes: BOTH, prd: { light: 5.01, dark: 5.01 } },
  { fg: '--axis-status-success-contrast', bg: '--axis-plan-card-approve-hover-bg', themes: BOTH, prd: { light: 7.13, dark: 7.13 } },
  { fg: '--axis-plan-card-reject-text', bg: '--axis-surface-secondary', themes: BOTH, prd: { light: 5.87, dark: 4.71 } },
  { fg: '--axis-plan-card-reject-hover-text', bg: REJECT_HOVER_BG, themes: BOTH, prd: { light: 5.17, dark: 5.90 } },
  { fg: '--axis-text-tertiary', bg: '--axis-surface-default', themes: ['dark'], prd: { dark: 7.93 } },
  { fg: '--axis-text-tertiary', bg: '#09090B', themes: ['dark'], prd: { dark: 7.83 } },
  { fg: '--axis-text-secondary', bg: '--axis-surface-default', themes: ['dark'] },
  { fg: '--axis-input-text-placeholder', bg: '--axis-input-bg-default', themes: ['dark'] },
];

describe('기본 테마 WI-0029 짝 대비 (dist/css/variables.css)', () => {
  assert.ok(existsSync(varsPath), `${varsPath} 없음: pnpm --filter @axis-ds/tokens build 를 먼저 실행한다`);
  const blocks = readBlocks(readFileSync(varsPath, 'utf8'));
  for (const sel of Object.values(SELECTOR)) assert.ok((blocks.get(sel)?.size ?? 0) > 200, `${sel} 블록 변수 ${blocks.get(sel)?.size ?? 0}개(측정 실패)`);
  const value = (theme, name) => {
    const v = blocks.get(SELECTOR[theme])?.get(name);
    assert.ok(v !== undefined, `${theme} ${name} 값 없음`);
    return v.toUpperCase();
  };
  const bgOf = (theme, bg) => {
    if (typeof bg !== 'string') return mixOver(value(theme, bg.mix), value(theme, bg.over), bg.pct);
    return bg.startsWith('#') ? bg : value(theme, bg);
  };

  test('짝 표가 비어 있지 않다 (양성 대조)', () => {
    assert.ok(PAIRS.length >= 15);
  });

  for (const pair of PAIRS) {
    for (const theme of pair.themes) {
      const bgLabel = typeof pair.bg === 'string' ? pair.bg : `${pair.bg.mix} ${pair.bg.pct}% over ${pair.bg.over}`;
      test(`${theme} ${pair.fg} / ${bgLabel} >= 4.5`, t => {
        const fg = value(theme, pair.fg);
        const bg = bgOf(theme, pair.bg);
        const r = ratio(fg, bg);
        t.diagnostic(`${fg} / ${bg} = ${floor2(r).toFixed(2)}:1`);
        assert.ok(r >= 4.5, `${fg}/${bg} = ${r.toFixed(2)}:1`);
        if (pair.prd?.[theme] !== undefined) assert.equal(floor2(r), pair.prd[theme], `PRD 표 값과 다름: ${fg}/${bg}`);
      });
    }
  }

  test('다크 보조 글자 계층: primary > secondary > tertiary (휘도, PRD D2)', () => {
    const [p, s, t] = ['--axis-text-primary', '--axis-text-secondary', '--axis-text-tertiary'].map(n => lum(value('dark', n)));
    assert.ok(p > s && s > t, `primary ${p} · secondary ${s} · tertiary ${t}`);
  });

  test('다크 input placeholder 는 입력 글자와 다른 값이다 (PRD D2)', () => {
    assert.notEqual(value('dark', '--axis-input-text-placeholder'), value('dark', '--axis-input-text-default'));
  });
});

/** shadcn-compat.css 의 HSL 세 값(`H S% L%`)을 6자리 hex 로 */
function hslToHex(triple) {
  const m = /^([\d.]+) ([\d.]+)% ([\d.]+)%$/.exec(triple);
  assert.ok(m, `HSL 형식이 아님: ${triple}`);
  const [h, sat, l] = [Number(m[1]), Number(m[2]) / 100, Number(m[3]) / 100];
  const a = sat * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return '#' + [0, 8, 4].map(n => Math.round(f(n) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

const TEXT = 4.5;
const NON_TEXT = 3;

/**
 * 표에 둘 수 없는 기본 브랜드 전용 짝 (WI-0062).
 * - input placeholder: ontology 라이트(#9AA1AB, 2.60)는 이번 범위에서 값을 바꾸지 않아(ontology 불변) 공용 표에 넣으면 ontology 가 실패한다.
 * - shadcn destructive-foreground / destructive: shadcn-compat.css 의 HSL 변수라 --axis-* 해석기가 읽지 못한다.
 */
const DEFAULT_ONLY = [
  { fg: '--axis-input-text-placeholder', bg: '--axis-input-bg-default', min: TEXT, where: 'ui-react input:24 · select:24 placeholder' },
  { fg: '--destructive-foreground', bg: '--destructive', min: TEXT, shadcn: true, where: 'shadcn-compat destructive 버튼' },
];

/** WI-0062 범위: 글자 행만. 비텍스트 · 아이콘 행은 WI-0063 이 더한다 */
const inScope = p => p.kind !== 'icon' && p.min === TEXT;

describe('기본 브랜드에 ontology 짝 표 적용 (WI-0062 · 0063, D2)', () => {
  assert.ok(existsSync(varsPath), `${varsPath} 없음: pnpm --filter @axis-ds/tokens build 를 먼저 실행한다`);
  assert.ok(existsSync(shadcnPath), `${shadcnPath} 없음: pnpm --filter @axis-ds/tokens build 를 먼저 실행한다`);
  const blocks = readBlocks(readFileSync(varsPath, 'utf8'));
  const shadcn = new Map();
  for (const m of readFileSync(shadcnPath, 'utf8').matchAll(/^(\S[^{\n]*?)\s*\{\n([^}]*)\n\}/gm)) {
    const vars = new Map();
    for (const d of m[2].matchAll(/^ {4}(--[a-z0-9-]+): (.+);$/gm)) vars.set(d[1], d[2]);
    shadcn.set(m[1], vars);
  }
  const value = (theme, name, isShadcn) => {
    const v = isShadcn ? shadcn.get(SELECTOR[theme])?.get(name) : blocks.get(SELECTOR[theme])?.get(name);
    assert.ok(v !== undefined, `${theme} ${name} 값 없음`);
    return isShadcn ? hslToHex(v) : v.toUpperCase();
  };
  const bgOf = (theme, bg, isShadcn) => (typeof bg === 'string'
    ? value(theme, bg, isShadcn)
    : mixOver(value(theme, bg.mix), value(theme, bg.over ?? '--axis-surface-default'), bg.pct));
  const rows = [...CONTRAST_PAIRS.filter(inScope), ...DEFAULT_ONLY];

  test('적용 행이 비어 있지 않고 shadcn 블록을 읽었다 (양성 대조)', () => {
    assert.ok(CONTRAST_PAIRS.filter(inScope).length >= 30, `글자 행 ${CONTRAST_PAIRS.filter(inScope).length}개`);
    for (const sel of Object.values(SELECTOR)) assert.ok((shadcn.get(sel)?.size ?? 0) >= 20, `shadcn ${sel} 블록 변수 ${shadcn.get(sel)?.size ?? 0}개`);
  });

  for (const pair of rows) {
    const min = pair.kind === 'icon' ? NON_TEXT : pair.min;
    for (const theme of BOTH) {
      const bgLabel = typeof pair.bg === 'string' ? pair.bg : `${pair.bg.mix} ${pair.bg.pct}% over ${pair.bg.over ?? '--axis-surface-default'}`;
      test(`기본 ${theme} ${pair.fg} / ${bgLabel} >= ${min} (${pair.where})`, t => {
        const fg = value(theme, pair.fg, pair.shadcn);
        const bg = bgOf(theme, pair.bg, pair.shadcn);
        const r = ratio(fg, bg);
        t.diagnostic(`${fg} / ${bg} = ${floor2(r).toFixed(2)}:1`);
        assert.ok(r >= min, `${fg}/${bg} = ${r.toFixed(2)}:1 (${pair.where})`);
      });
    }
  }
});
