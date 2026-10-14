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

import {
  cssVarName,
  listBrands,
  loadBrand,
  collectBasePaths,
  validateBrand,
  checkBrandExports,
  brandExportEntries,
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
});

describe('checkBrandExports (B5)', () => {
  test('명시형 exports 2개가 모두 있으면 통과', () => {
    const pkg = { exports: { ...brandExportEntries('sample') } };
    assert.deepEqual(checkBrandExports(pkg, ['sample']), []);
  });
  test('누락되면 항목마다 위반', () => {
    const pkg = { exports: { './css': './dist/css/variables.css' } };
    assert.equal(checkBrandExports(pkg, ['sample']).length, 2);
  });
  test('브랜드 0개면 검사할 것이 없다', () => {
    assert.deepEqual(checkBrandExports({ exports: {} }, []), []);
  });
});

describe('brandSelectors', () => {
  test('라이트 1개 · 다크 3개 (PRD FR-5)', () => {
    assert.deepEqual(brandSelectors('ontology'), {
      light: ['[data-brand="ontology"]'],
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
