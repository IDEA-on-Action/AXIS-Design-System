/**
 * 브랜드 토큰 순수 함수 테스트 (WI-0025 M2, FR-4 · FR-5)
 *
 * dist 를 읽지 않는다(turbo test 는 build 에 의존하지 않음). 기본 집합은 src 에서 직접 읽고,
 * 브랜드는 test/fixtures/brands 의 fixture 를 쓴다(src/brands 에 두면 배포된다).
 * 실행: node --test test/brands.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { V1_PALETTE } from './ontology-pairs.mjs';

import {
  cssVarName,
  listBrands,
  loadBrand,
  collectBasePaths,
  validateBrand,
  checkBrandExports,
  brandExportEntries,
  brandIndex,
  BRAND_INDEX_EXPORT,
  brandSelectors,
  renderShadcnBlock,
  hexToHslTriple,
  parseShadcnRootKeys,
  SHADCN_KEYS,
} from '../scripts/brands.mjs';

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = join(pkgDir, 'test', 'fixtures', 'brands');
const base = collectBasePaths(join(pkgDir, 'src'));

/** 유효 fixture 를 깊은 복사해 일부만 바꾼 음성 케이스를 만든다 */
function sample(mutate) {
  const brand = structuredClone(loadBrand(join(fixtures, 'valid'), 'sample'));
  if (mutate) mutate(brand);
  return brand;
}

function rules(errors) {
  return [...new Set(errors.map(e => /\] (V\d|B\d)/.exec(e)?.[1]))];
}

describe('cssVarName', () => {
  test('경로를 --axis- 접두로 잇고 세그먼트 안의 점을 하이픈으로 바꾼다', () => {
    assert.equal(cssVarName(['surface', 'default']), '--axis-surface-default');
    assert.equal(cssVarName(['space', '2.5']), '--axis-space-2-5');
  });
});

describe('collectBasePaths', () => {
  test('기본 변수명 집합이 src 에서 읽힌다(양성 대조군)', () => {
    assert.ok(base.varNames.has('--axis-surface-default'));
    assert.ok(base.varNames.has('--axis-button-bg-default'));
    assert.ok(base.varNames.has('--axis-color-blue-500'));
    assert.ok(base.semanticTops.has('surface'));
    assert.ok(base.componentTops.has('button'));
    assert.ok(base.varNames.size > 100, `기본 변수 수가 너무 적습니다: ${base.varNames.size}`);
  });

  test('M3 G1 신규 변수(흰 글자 짝 토큰 6개 · FR-7)가 기본 집합에 든다', () => {
    for (const name of [
      '--axis-status-success-contrast',
      '--axis-status-running-contrast',
      '--axis-status-error-contrast',
      '--axis-status-neutral-muted-contrast',
      '--axis-agent-message-user-text',
      '--axis-agent-avatar-text',
      '--axis-plan-card-accent-width',
      '--axis-plan-card-reject-hover-text',
    ]) {
      assert.ok(base.varNames.has(name), `기본 집합에 없음: ${name}`);
    }
    assert.ok(base.componentTops.has('plan-card'));
  });

  test('M3 G3 신규 변수(그림자 primitive 2개 · card-shadow)가 기본 집합에 들고 1.2.1 변수는 남는다', () => {
    for (const name of ['--axis-shadow-sm', '--axis-shadow-lg', '--axis-card-shadow', '--axis-card-shadow-default']) {
      assert.ok(base.varNames.has(name), `기본 집합에 없음: ${name}`);
    }
    assert.ok(base.componentTops.has('card-shadow'));
    // U3: 기본값은 shadow.sm 참조, 1.2.1 card.shadow.default 값은 그대로(U1)
    assert.equal(base.refs.get('card-shadow'), '{shadow.sm}');
    assert.equal(base.refs.get('card.shadow.default'), '0 1px 3px 0 rgb(0 0 0 / 0.1)');
  });

  test('card.shadow.default 는 폐기 예정 마커를 가지고 대체 대상은 card-shadow (U23)', () => {
    const comp = JSON.parse(readFileSync(join(pkgDir, 'src', 'component', 'components.json'), 'utf-8'));
    // 폐기 예정 표기는 메타만 더한다: 값과 테마 마커는 1.2.1 그대로(U1)
    assert.deepEqual(comp.card.shadow.default, {
      value: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      $extensions: { axis: { themeIndependent: true, deprecated: 'card-shadow' } },
    });
    // 대체 대상은 Card 가 실제로 참조하는 공개 조정점이고, 그 자신은 폐기 예정이 아니다
    assert.ok(base.refs.has('card-shadow'));
    assert.equal(comp['card-shadow'].$extensions?.axis?.deprecated, undefined);
  });

  test('브랜드가 shadow.sm · shadow.lg · card-shadow 를 라이트에만 덮어써도 위반 0건 (V3 · V4 · V7)', () => {
    const brand = sample(b => {
      b.light.shadow = {
        sm: { value: '0 1px 2px 0 rgb(15 23 36 / 0.06)' },
        lg: { value: '0 8px 24px -6px rgb(15 23 36 / 0.16)' },
      };
      b.light['card-shadow'] = { value: '0 0 #0000' };
    });
    assert.deepEqual(validateBrand(brand, base), []);
  });
});

describe('listBrands', () => {
  test('디렉터리가 없으면 빈 배열(브랜드 0개)', () => {
    assert.deepEqual(listBrands(join(fixtures, 'no-such-dir')), []);
  });
  test('하위 디렉터리 이름을 정렬해 돌려준다', () => {
    assert.deepEqual(listBrands(join(fixtures, 'invalid')), ['Bad_Name', 'broken-json', 'missing-dark']);
  });
});

describe('loadBrand', () => {
  test('shadcn 최상위 키를 토큰에서 분리한다', () => {
    const brand = loadBrand(join(fixtures, 'valid'), 'sample');
    assert.equal(brand.light.shadcn, undefined);
    assert.equal(brand.shadcn.light.primary, '#15C7C7');
    assert.equal(brand.shadcn.dark.primary, '180 81% 43%');
    assert.deepEqual(brand.missing, []);
    assert.deepEqual(brand.parseErrors, []);
  });
});

describe('validateBrand 양성', () => {
  test('유효 fixture 는 위반 0건', () => {
    assert.deepEqual(validateBrand(sample(), base), []);
  });
});

// FR-8: 실제 배포 브랜드 src/brands/ontology. 값을 추가하는 후속 작업(상태 색 접기 등)과 충돌하지 않게
// 선언 수를 고정하지 않고 「초안 2 이식분이 모두 같은 값으로 들어 있다」(부분집합)로 단언한다.
describe('src/brands/ontology (FR-8)', () => {
  const brandsDir = join(pkgDir, 'src', 'brands');
  const draftPath = join(pkgDir, '..', '..', 'docs', 'workitems', 'WI-0025-brand-theme', 'axis-theme-ontology.css');
  const ontology = loadBrand(brandsDir, 'ontology');

  /** 초안 CSS 의 라이트 · 다크 블록 선언을 이름 -> 값 맵으로 */
  function draftBlocks() {
    const css = readFileSync(draftPath, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
    const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim(), body: m[2] }));
    const decls = sel => new Map(
      [...(blocks.find(b => sel(b.sel))?.body ?? '').matchAll(/(--[A-Za-z0-9-]+)\s*:\s*([^;]+);/g)]
        .map(m => [m[1], m[2].trim()]),
    );
    return {
      light: decls(s => s === '[data-brand="ontology"]'),
      dark: decls(s => s.startsWith('[data-brand="ontology"].dark')),
    };
  }

  /** `{a.b}` 참조를 기본 소스로 끝까지 풀어 hex 로 비교한다(대문자). 참조가 아니면 그대로 */
  function resolveRef(value, depth = 0) {
    const m = /^\{([^{}]+)\}$/.exec(String(value));
    if (!m || depth > 20 || !base.refs.has(m[1])) return depth > 0 ? String(value).toUpperCase() : value;
    return resolveRef(base.refs.get(m[1]), depth + 1);
  }

  /** 브랜드 JSON 을 이름 -> 값 맵으로(--axis-* 는 cssVarName, shadcn 은 --키) */
  function brandDecls(theme) {
    const map = new Map();
    const walk = (node, path) => {
      for (const [k, v] of Object.entries(node)) {
        if (v && typeof v === 'object' && 'value' in v) map.set(cssVarName([...path, k]), v.value);
        else walk(v, [...path, k]);
      }
    };
    walk(ontology[theme], []);
    for (const [k, v] of Object.entries(ontology.shadcn[theme])) map.set(`--${k}`, v);
    return map;
  }

  test('파일 3종이 있고 검증 V1~V8 위반 0건', () => {
    assert.deepEqual(ontology.missing, []);
    assert.deepEqual(ontology.parseErrors, []);
    assert.deepEqual(validateBrand(ontology, base), []);
  });

  // 2026-10-17 D2: 초안 2 는 bad-line 을 destructive 버튼 hover · active 바탕에도 썼어요.
  // 부록 B(prd.md 211행)는 bad-line 을 warning 아이콘에만 허용하므로 bad-light 로 바꿨어요
  // (다크 #F49890/#7A3330 4.16:1 미달 해소). 초안과 다른 값은 이 표에만 둡니다.
  const D2_OVERRIDES = {
    light: { '--axis-button-destructive-bg-hover': '#FDE8E8', '--axis-button-destructive-bg-active': '#FDE8E8' },
    dark: { '--axis-button-destructive-bg-hover': '#3A1A1A', '--axis-button-destructive-bg-active': '#3A1A1A' },
  };

  test('초안 2 선언(bg-muted 제외)이 모두 같은 값으로 들어 있다 (D2 · WI-0079 교체분 제외)', () => {
    const draft = draftBlocks();
    assert.ok(draft.light.size > 90 && draft.dark.size > 80, `초안을 읽지 못했습니다: ${draft.light.size}/${draft.dark.size}`);
    for (const theme of ['light', 'dark']) {
      const mine = brandDecls(theme);
      for (const [name, value] of draft[theme]) {
        if (name === '--axis-bg-muted') continue; // D-f
        const expected = D2_OVERRIDES[theme][name] ?? WI0079_OVERRIDES[theme][name] ?? value;
        assert.equal(resolveRef(mine.get(name)), expected, `${theme} ${name}`);
      }
    }
  });

  // WI-0026 밀도 값(PRD FR-4, 디자인 시스템 v1 실측). WI-0025 초안 2 뒤에 생긴 이름이라 초안에는 없어요.
  // 이 표의 이름만 U18 초안 대조에서 빼고, 아래 테스트가 이 표와 정확히 같은지 봐요(라이트 전용, 테마와 무관한 길이).
  // Toggle 은 Q4 결정으로 덮어쓰지 않아 기본값과 같은 값을 명시해요(D4 결정 36).
  const WI0026_DENSITY = {
    '--axis-radius-control': '8px',
    '--axis-radius-field': '6px',
    '--axis-radius-surface': '12px',
    '--axis-control-h-sm': '27px',
    '--axis-control-h-md': '34px',
    '--axis-control-h-lg': '42px',
    '--axis-control-font-size-sm': '13px',
    '--axis-control-font-size-md': '14px',
    '--axis-control-font-size-lg': '15px',
    '--axis-field-h': '36px',
    '--axis-toggle-h-sm': '2.25rem',
    '--axis-toggle-h-md': '2.5rem',
    '--axis-toggle-h-lg': '2.75rem',
    '--axis-table-font-size': '13.5px',
    '--axis-table-head-font-size': '13px',
  };

  // WI-0063 새 component 토큰(폼 컨트롤 경계 · 트랙, Progress 채움). 1.8.0 은 ontology 에 1.7.0 렌더 값을 그대로 넣었고,
  // WI-0079(2026-10-26 사용자 결정, design-review.md 권장안 + Q3 destructive 분리)에서 v1 팔레트 안의 값으로 바꿨어요.
  // 경계 · 트랙 = 라이트 sub · 다크 muted, Progress success · warning · destructive = ink-2 · bad · bad-dark, default = key(surface-brand 와 같음).
  // 값은 팔레트 이름으로 적어요(hex 를 복제하지 않음). 초안 2 뒤에 생긴 이름이라 초안에는 없어요.
  // 이 표의 이름만 U18 초안 대조에서 빼고, 아래 테스트가 값이 정확히 같은지 봐요.
  const pal = (light, dark) => ({ light: V1_PALETTE[light].light, dark: V1_PALETTE[dark ?? light].dark });
  const WI0079_NAMES = {
    '--axis-form-control-border': pal('sub', 'muted'),
    '--axis-form-control-track': pal('sub', 'muted'),
    '--axis-progress-fill-default': pal('key'),
    '--axis-progress-fill-success': pal('ink-2'),
    '--axis-progress-fill-warning': pal('bad'),
    '--axis-progress-fill-destructive': pal('bad-dark'),
  };
  const WI0063_SAME = Object.fromEntries(['light', 'dark'].map(theme => [
    theme, Object.fromEntries(Object.entries(WI0079_NAMES).map(([n, v]) => [n, v[theme]])),
  ]));

  // WI-0079: 초안 2 에 있는 이름인데 값을 바꾼 것. Input placeholder 는 muted 대신 sub-aa(다크 sub)로,
  // WI-0025 부록 B ②(2026-10-19 디자인 오너 확인 「muted 는 placeholder 에만」)를 철회했어요(부록 B 철회 기록).
  const WI0079_OVERRIDES = {
    light: { '--axis-input-text-placeholder': V1_PALETTE['sub-aa'].light },
    dark: { '--axis-input-text-placeholder': V1_PALETTE['sub-aa'].dark },
  };

  test('WI-0063 · WI-0079: 새 토큰의 ontology 값이 v1 팔레트 결정 값이다(초안에는 없는 이름)', () => {
    const draft = draftBlocks();
    assert.equal(WI0063_SAME.light['--axis-form-control-border'], '#6B7280', '팔레트 표 읽기(양성 대조)');
    for (const theme of ['light', 'dark']) {
      const mine = brandDecls(theme);
      const got = Object.fromEntries(Object.keys(WI0063_SAME[theme]).map(n => [n, resolveRef(mine.get(n))]));
      assert.deepEqual(got, WI0063_SAME[theme], theme);
      // Progress default 는 1.7.0 에서 같은 자리를 칠하던 surface-brand 와 값이 같다(복제 표가 ontology 소스와 어긋나면 실패)
      assert.equal(got['--axis-progress-fill-default'], resolveRef(mine.get('--axis-surface-brand')), `${theme} progress-fill-default = surface-brand`);
      assert.deepEqual(Object.keys(WI0063_SAME[theme]).filter(n => draft[theme].has(n)), []);
    }
  });

  // U18 역반영(2026-10-17) 뒤에는 반대 방향도 성립해야 해요: 브랜드 JSON 선언은 모두 초안에 같은 값으로 있다.
  // 참조(다크 interactive.primary = {color.blue.500})는 기본 소스로 풀어 초안의 hex 와 비교해요.
  test('U18: 브랜드 JSON 선언이 모두 초안에 같은 값으로 있다 (D2 교체분 · WI-0026 밀도 · WI-0063 새 토큰 · WI-0079 placeholder 제외)', () => {
    const draft = draftBlocks();
    for (const theme of ['light', 'dark']) {
      const mine = brandDecls(theme);
      assert.ok(mine.size > 100, `${theme} 브랜드 선언 ${mine.size}개`);
      for (const [name, value] of mine) {
        if (D2_OVERRIDES[theme][name] !== undefined) continue;
        if (WI0026_DENSITY[name] !== undefined) continue;
        if (WI0063_SAME[theme][name] !== undefined) continue;
        if (WI0079_OVERRIDES[theme][name] !== undefined) continue;
        assert.equal(draft[theme].get(name), resolveRef(value), `${theme} ${name}`);
      }
    }
  });

  test('WI-0026: 밀도 값이 FR-4 표와 같고 라이트에만 있다', () => {
    const light = brandDecls('light');
    const dark = brandDecls('dark');
    const isDensity = name => /^--axis-(control|field|toggle|table)-/.test(name) || /^--axis-radius-(control|field|surface)$/.test(name);
    const got = Object.fromEntries([...light].filter(([name]) => isDensity(name)));
    assert.deepEqual(got, WI0026_DENSITY);
    assert.deepEqual([...dark.keys()].filter(isDensity), []);
    // 초안에는 이 이름이 없어야 예외가 필요해요(초안에 같은 이름이 생기면 예외를 지우고 초안 대조로 돌려요)
    const draft = draftBlocks();
    assert.deepEqual(Object.keys(WI0026_DENSITY).filter(n => draft.light.has(n) || draft.dark.has(n)), []);
  });

  test('D2: bad-line 값은 warning 아이콘에만 쓰이고, destructive 버튼 글자는 모든 바탕 상태에서 4.5:1 이상', () => {
    const lum = hex => {
      const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    const BAD_LINE = { light: '#F5C6C6', dark: '#7A3330' };
    for (const theme of ['light', 'dark']) {
      const mine = brandDecls(theme);
      const users = [...mine].filter(([, v]) => String(v).toUpperCase() === BAD_LINE[theme]).map(([k]) => k);
      assert.deepEqual(users, ['--axis-icon-warning'], `${theme} bad-line 사용처`);
      const fg = mine.get('--axis-button-destructive-text-default');
      for (const state of ['default', 'hover', 'active']) {
        const bg = mine.get(`--axis-button-destructive-bg-${state}`);
        const r = ratio(fg, bg);
        assert.ok(r >= 4.5, `${theme} ${state} ${fg}/${bg} = ${r.toFixed(2)}:1`);
      }
    }
  });

  test('bg-muted 는 빠져 있다 (D-f)', () => {
    for (const theme of ['light', 'dark']) {
      assert.equal(brandDecls(theme).has('--axis-bg-muted'), false, theme);
    }
  });

  test('Card 그림자 두 변수 모두 라이트에 0 0 #0000 (U2 · U23 · 2026-10-17 결정)', () => {
    assert.deepEqual(ontology.light['card-shadow'], { value: '0 0 #0000' });
    assert.deepEqual(ontology.light.card.shadow.default, { value: '0 0 #0000' });
  });

  test('shadcn: 라이트에 --radius 12px 포함, 다크는 radius 없음', () => {
    assert.equal(ontology.shadcn.light.radius, '12px');
    assert.equal(ontology.shadcn.dark.radius, undefined);
    assert.equal(ontology.light['plan-card']['accent-width'].value, '1px'); // U8
  });

  test('brand.json: 스키마 필드와 a11y 상태, 개인 이름 없음', () => {
    assert.deepEqual(Object.keys(ontology.meta).sort(), ['a11y', 'description', 'name', 'themes']);
    assert.deepEqual(Object.keys(ontology.meta.a11y).sort(), ['checkedAt', 'gate', 'status']);
    // 자동 게이트 통과와 사람 승인 상태를 함께 적는다(2026-10-18 결정). 디자인 오너 사후 확인은 2026-10-19 에 끝나 status 에 적고,
    // checkedAt 은 a11y 측정일(2026-10-18)을 그대로 둔다(2026-10-19 사용자 결정).
    // 게이트는 문서 사이트 페이지의 기본 상태만 재므로 검사 범위를 문구에 남긴다(컴포넌트 실측 · hover 는 M4)
    assert.match(ontology.meta.a11y.status, /CI a11y 게이트 통과/);
    assert.match(ontology.meta.a11y.status, /문서 사이트 9페이지 기본 상태 기준/);
    assert.match(ontology.meta.a11y.status, /컴포넌트 실측 · hover 미포함/);
    assert.match(ontology.meta.a11y.status, /디자인 오너 사후 확인 완료\(2026-10-19\)/);
    assert.equal(ontology.meta.a11y.checkedAt, '2026-10-18');
    assert.equal(ontology.meta.a11y.gate, 'CI frontend.yml E2E a11y (WI-0025 AC8)');
    assert.doesNotMatch(JSON.stringify(ontology.meta), /책임|가칭/);
  });
});

describe('validateBrand 음성', () => {
  test('V1 kebab-case 가 아닌 이름', () => {
    const brand = loadBrand(join(fixtures, 'invalid'), 'Bad_Name');
    assert.deepEqual(rules(validateBrand(brand, base)), ['V1']);
  });

  test('V2 파일 누락', () => {
    const brand = loadBrand(join(fixtures, 'invalid'), 'missing-dark');
    const errors = validateBrand(brand, base);
    assert.ok(errors.some(e => e.includes('V2') && e.includes('dark.json')), errors.join('\n'));
  });

  test('V2 JSON 문법 오류', () => {
    const brand = loadBrand(join(fixtures, 'invalid'), 'broken-json');
    const errors = validateBrand(brand, base);
    assert.ok(errors.some(e => e.includes('V2') && e.includes('light.json')), errors.join('\n'));
  });

  test('V2 brand.json name 불일치', () => {
    const errors = validateBrand(sample(b => { b.meta.name = 'other'; }), base);
    assert.deepEqual(rules(errors), ['V2']);
  });

  test('V2 brand.json themes 가 실제 파일과 다름', () => {
    const errors = validateBrand(sample(b => { b.meta.themes = ['light']; }), base);
    assert.deepEqual(rules(errors), ['V2']);
  });

  test('V2 brand.json description · a11y 누락', () => {
    const errors = validateBrand(sample(b => { delete b.meta.description; delete b.meta.a11y; }), base);
    assert.equal(errors.filter(e => e.includes('V2')).length, 2);
  });

  test('V3 기본 토큰에 없는 경로', () => {
    const errors = validateBrand(sample(b => {
      b.light.surface.nonexistent = { value: '#FFFFFF' };
      b.dark.surface.nonexistent = { value: '#000000' };
    }), base);
    assert.ok(rules(errors).includes('V3'), errors.join('\n'));
  });

  test('V4 primitive color 덮어쓰기 거부', () => {
    const errors = validateBrand(sample(b => {
      b.light.color = { blue: { 500: { value: '#000000' } } };
      b.dark.color = { blue: { 500: { value: '#000000' } } };
    }), base);
    assert.deepEqual(rules(errors), ['V4']);
  });

  test('V4 primitive space 덮어쓰기 거부', () => {
    const errors = validateBrand(sample(b => {
      b.light.space = { 4: { value: '2rem' } };
    }), base);
    assert.deepEqual(rules(errors), ['V4']);
  });

  test('V5 leaf 형태 위반(값이 객체가 아닌 문자열)', () => {
    const errors = validateBrand(sample(b => {
      b.light.text.secondary = '#5E6975';
      b.dark.text.secondary = '#9AA5B1';
    }), base);
    assert.deepEqual(rules(errors), ['V5']);
  });

  test('V5 기본 집합에 없는 참조', () => {
    const errors = validateBrand(sample(b => {
      b.light.border.focus = { value: '{color.teal.500}' };
    }), base);
    assert.deepEqual(rules(errors), ['V5']);
  });

  test('V6 서로 다른 경로가 같은 변수명을 만듦', () => {
    // space.2.5 와 space["2"]["5"] 는 모두 --axis-space-2-5 가 된다(V4 · V3 도 함께 걸린다)
    const errors = validateBrand(sample(b => {
      b.light.space = { '2.5': { value: '1px' }, 2: { 5: { value: '2px' } } };
    }), base);
    assert.ok(errors.some(e => e.includes('V6') && e.includes('같은 변수명')), errors.join('\n'));
  });

  test('V7 semantic 키가 라이트에만 있음', () => {
    const errors = validateBrand(sample(b => { delete b.dark.text.primary; }), base);
    assert.deepEqual(rules(errors), ['V7']);
  });

  test('V7 component 색 값이 라이트에만 있음', () => {
    const errors = validateBrand(sample(b => { delete b.dark.button.bg.hover; }), base);
    assert.deepEqual(rules(errors), ['V7']);
  });

  test('V7 shadcn 색 키가 라이트에만 있음', () => {
    const errors = validateBrand(sample(b => { delete b.shadcn.dark.background; }), base);
    assert.deepEqual(rules(errors), ['V7']);
  });

  test('V7 테마 무관 값(radius · font.family · 그림자 · shadcn radius)은 라이트에만 있어도 통과', () => {
    const brand = sample();
    assert.equal(brand.dark.radius, undefined);
    assert.equal(brand.dark.font, undefined);
    assert.equal(brand.dark.card, undefined);
    assert.equal(brand.shadcn.dark.radius, undefined);
    assert.deepEqual(validateBrand(brand, base), []);
  });

  test('V8 허용되지 않은 shadcn 변수', () => {
    const errors = validateBrand(sample(b => {
      b.shadcn.light.sidebar = '0 0% 100%';
      b.shadcn.dark.sidebar = '0 0% 0%';
    }), base);
    assert.deepEqual(rules(errors), ['V8']);
  });

  test('V8 3자리 hex 거부', () => {
    const errors = validateBrand(sample(b => { b.shadcn.light.primary = '#FFF'; }), base);
    assert.deepEqual(rules(errors), ['V8']);
  });

  test('V8 radius 에 색 형식 값 거부', () => {
    const errors = validateBrand(sample(b => { b.shadcn.light.radius = '0 0% 0%'; }), base);
    assert.deepEqual(rules(errors), ['V8']);
  });

  test('V8 소수 퍼센트 HSL 허용(AC6 결정, U14)', () => {
    const brand = sample(b => {
      b.shadcn.light.primary = '220 69.4% 52.5%';
      b.shadcn.light.background = '1.9 62.6% 48.2%';
      b.shadcn.dark.primary = '219.7 81.6% 68%';
    });
    assert.deepEqual(validateBrand(brand, base), []);
  });

  test('V8 정수 HSL 은 계속 통과', () => {
    const brand = sample(b => {
      b.shadcn.light.primary = '220 69% 52%';
      b.shadcn.light.background = '0 0% 100%';
      b.shadcn.dark.primary = '360 100% 0%';
    });
    assert.deepEqual(validateBrand(brand, base), []);
  });

  for (const bad of [
    '220 69.% 52%',     // 소수점 뒤 숫자 없음
    '220 .4% 52%',      // 소수점 앞 숫자 없음
    '220 69,4% 52%',    // 쉼표 소수점
    '220 69.4 52.5%',   // % 누락
    '220.1.2 69% 52%',  // 소수점 두 번
    '220 69.4%  52.5%', // 공백 두 칸
    'hsl(220 69.4% 52.5%)',
  ]) {
    test(`V8 형식 위반 거부: "${bad}"`, () => {
      const errors = validateBrand(sample(b => { b.shadcn.light.primary = bad; }), base);
      assert.deepEqual(rules(errors), ['V8']);
    });
  }

  test('소수 HSL 은 renderShadcnBlock 이 그대로 낸다', () => {
    assert.equal(renderShadcnBlock({ primary: '220 69.4% 52.5%' }), '  --primary: 220 69.4% 52.5%;');
  });
});

describe('checkBrandExports (B5)', () => {
  test('명시형 exports 2개와 목록 파일 ./brands 가 모두 있으면 통과', () => {
    const pkg = { exports: { ...BRAND_INDEX_EXPORT, ...brandExportEntries('sample') } };
    assert.deepEqual(checkBrandExports(pkg, ['sample']), []);
  });
  test('누락되면 항목마다 위반(브랜드별 2개 + 목록 파일 1개)', () => {
    const pkg = { exports: { './css': './dist/css/variables.css' } };
    assert.equal(checkBrandExports(pkg, ['sample']).length, 3);
    assert.equal(checkBrandExports(pkg, ['a', 'b']).length, 5);
  });
  test('목록 파일 ./brands 만 빠져도 위반 (plan 3 결정 2 A안)', () => {
    const pkg = { exports: { ...brandExportEntries('sample') } };
    const errors = checkBrandExports(pkg, ['sample']);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /B5 .*"\.\/brands": "\.\/dist\/brands\/index\.json"/);
  });
  test('brandIndex 는 이름순 정렬, exports 하위 경로를 담는다', () => {
    assert.deepEqual(brandIndex(['zeta', 'alpha']), {
      brands: [
        { name: 'alpha', css: './css/brands/alpha', meta: './brands/alpha/brand.json' },
        { name: 'zeta', css: './css/brands/zeta', meta: './brands/zeta/brand.json' },
      ],
    });
  });
  test('브랜드 0개면 검사할 것이 없다', () => {
    assert.deepEqual(checkBrandExports({ exports: {} }, []), []);
  });
});

describe('brandSelectors', () => {
  // 라이트는 속성 두 번으로 (0,2,0). import 순서와 상관없이 기본 · 소비자 :root (0,1,0)를 이기고,
  // :root 를 쓰지 않아 하위 컨테이너(<div data-brand>)에도 맞는다 (2026-10-19 사용자 결정, WI-0028 U2 대안 2)
  test('라이트 1개 · 다크 3개 (PRD FR-5), 라이트 명시도 (0,2,0)', () => {
    assert.deepEqual(brandSelectors('ontology'), {
      light: ['[data-brand="ontology"][data-brand="ontology"]'],
      dark: [
        '[data-brand="ontology"].dark',
        '[data-brand="ontology"][data-theme="dark"]',
        '.dark [data-brand="ontology"]',
      ],
    });
  });
});

describe('renderShadcnBlock', () => {
  test('SHADCN_KEYS 순서로 내고 hex 는 HSL 로 바꾸며 radius 는 그대로 둔다', () => {
    const out = renderShadcnBlock({ radius: '12px', primary: '#15C7C7', background: '210 22% 96%' });
    assert.equal(out, [
      '  --background: 210 22% 96%;',
      '  --primary: 180 81% 43%;',
      '  --radius: 12px;',
    ].join('\n'));
  });
  test('빈 섹션은 빈 문자열', () => {
    assert.equal(renderShadcnBlock({}), '');
  });
  test('hexToHslTriple 은 기본 shadcn 값과 같은 계산', () => {
    assert.equal(hexToHslTriple('#FFFFFF'), '0 0% 100%');
    assert.equal(hexToHslTriple('#111827'), '221 39% 11%');
  });
});

describe('SHADCN_KEYS 드리프트', () => {
  test('build-tokens.mjs buildShadcnVars 가 내는 이름과 같다', () => {
    const source = readFileSync(join(pkgDir, 'build-tokens.mjs'), 'utf-8');
    const fn = /function buildShadcnVars[\s\S]*?\n}\n/.exec(source);
    assert.ok(fn, 'buildShadcnVars 를 찾지 못했습니다');
    const names = [...fn[0].matchAll(/`\s*--([a-z0-9-]+):/g)].map(m => m[1]);
    assert.deepEqual(names, SHADCN_KEYS);
  });
  test('parseShadcnRootKeys 는 :root 블록 이름만 읽는다', () => {
    const css = ':root {\n  --background: 0 0% 100%;\n  --radius: 0.5rem;\n}\n.dark {\n  --card: 0 0% 0%;\n}';
    assert.deepEqual(parseShadcnRootKeys(css), ['background', 'radius']);
  });
});
