/**
 * AXIS Design System - 브랜드 토큰 순수 함수 모듈 (WI-0025 M2, FR-4 · FR-5)
 *
 * build-tokens.mjs 는 최상위 await 스크립트라 import 하는 순간 빌드가 실행된다.
 * 그래서 브랜드 검증 · 선택자 · shadcn 블록 생성처럼 파일을 쓰지 않는 로직은 이 모듈에 두고,
 * build-tokens.mjs(scripts/build-brands.mjs 경유)와 test/brands.test.mjs 가 함께 import 한다.
 * 이 모듈은 파일을 읽기만 하고 쓰지 않는다.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// --- CSS 변수명 안전화: path 세그먼트의 점(.)을 하이픈(-)으로 치환 ---
// CSS 커스텀 프로퍼티명에 escape 안 된 점은 유효 ident가 아니라 Turbopack 파싱이 깨진다.
// (예: space.2.5 -> --axis-space-2-5) 핸드오프 가이드(health-pt-manager docs/31) 계약과 일치
// build-tokens.mjs 에서 옮겨 왔다(plan 3절 결정 10). 기본 산출물 sha256 불변이 이동 조건이다.
export function cssVarName(path) {
  return `--axis-${path.map(seg => String(seg).replace(/\./g, '-')).join('-')}`;
}

/** 브랜드 디렉터리 이름 규칙 (V1) */
export const BRAND_NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** 브랜드 JSON 의 최상위 예약 키. shadcn HSL 호환 층 값을 담는다 */
export const SHADCN_KEY = 'shadcn';

/**
 * build-tokens.mjs `buildShadcnVars` 가 내는 shadcn 변수 이름 25개 (V8).
 * 4단계 코드를 고치지 않으려고 복제했다. 드리프트는 두 곳에서 막는다.
 * - 빌드: 브랜드가 있으면 생성된 shadcn-compat.css 의 :root 이름과 이 배열을 대조해 다르면 실패
 * - 테스트: build-tokens.mjs 원문에서 이름을 뽑아 이 배열과 대조
 */
export const SHADCN_KEYS = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
  'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input', 'ring',
  'radius', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
];

/** 테마와 무관해 라이트에만 있어도 되는 primitive 범위 (V4 · V7) */
export const PRIMITIVE_ALLOW_PREFIXES = [['radius'], ['font', 'family'], ['shadow']];

const BRAND_FILES = ['light.json', 'dark.json', 'brand.json'];
const THEMES = ['light', 'dark'];

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isLeaf(node) {
  return isPlainObject(node) && Object.prototype.hasOwnProperty.call(node, 'value');
}

/** 경로 배열의 식별 키. 세그먼트 안에 점이 있을 수 있어(space.2.5) 점 결합 대신 JSON 문자열을 쓴다 */
export function pathKey(path) {
  return JSON.stringify(path.map(String));
}

/** 토큰 트리를 순회해 leaf 와 형태 위반(leaf 가 아닌 값)을 모은다 */
function walkTokens(tree, visit, path = []) {
  for (const [key, node] of Object.entries(tree)) {
    const next = [...path, key];
    if (isLeaf(node)) {
      visit({ path: next, node });
    } else if (isPlainObject(node)) {
      walkTokens(node, visit, next);
    } else {
      visit({ path: next, node, malformed: true });
    }
  }
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

/** `src/brands` 아래 브랜드 디렉터리 이름 목록. 디렉터리가 없으면 빈 배열 */
export function listBrands(brandsDir) {
  if (!existsSync(brandsDir)) return [];
  return readdirSync(brandsDir)
    .filter(name => statSync(join(brandsDir, name)).isDirectory())
    .sort();
}

/**
 * 브랜드 디렉터리를 읽는다. 예외를 던지지 않고 누락 · 파싱 오류를 기록해 돌려준다.
 * `shadcn` 최상위 키는 토큰에서 분리한다.
 */
export function loadBrand(brandsDir, name) {
  const dir = join(brandsDir, name);
  const brand = {
    name,
    dir,
    light: {},
    dark: {},
    shadcn: { light: {}, dark: {} },
    meta: undefined,
    missing: [],
    parseErrors: [],
  };

  for (const file of BRAND_FILES) {
    const full = join(dir, file);
    if (!existsSync(full)) {
      brand.missing.push(file);
      continue;
    }
    let json;
    try {
      json = readJson(full);
    } catch (e) {
      brand.parseErrors.push(`${file}: ${e.message.split('\n')[0]}`);
      continue;
    }
    if (file === 'brand.json') {
      brand.meta = json;
      continue;
    }
    const theme = file.replace('.json', '');
    if (!isPlainObject(json)) {
      brand.parseErrors.push(`${file}: 최상위가 객체가 아닙니다`);
      continue;
    }
    const { [SHADCN_KEY]: shadcn, ...tokens } = json;
    brand[theme] = tokens;
    if (shadcn !== undefined) brand.shadcn[theme] = shadcn;
  }

  return brand;
}

/**
 * 기본 토큰 집합을 소스에서 직접 읽는다(목록을 복제하지 않는다, plan 3.3).
 * 기본 집합 = primitives + semantic/light.json + component (V3)
 */
export function collectBasePaths(srcDir) {
  const sources = [];
  const primitivesDir = join(srcDir, 'primitives');
  for (const f of readdirSync(primitivesDir).filter(f => f.endsWith('.json')).sort()) {
    sources.push({ kind: 'primitive', json: readJson(join(primitivesDir, f)) });
  }
  const semantic = readJson(join(srcDir, 'semantic', 'light.json'));
  sources.push({ kind: 'semantic', json: semantic });
  const componentDir = join(srcDir, 'component');
  const componentTops = new Set();
  for (const f of readdirSync(componentDir).filter(f => f.endsWith('.json')).sort()) {
    const json = readJson(join(componentDir, f));
    Object.keys(json).forEach(k => componentTops.add(k));
    sources.push({ kind: 'component', json });
  }

  const paths = new Set();
  const refs = new Map(); // 점 결합 경로 -> 원래 값 (참조 해석용)
  const varNames = new Set();
  for (const { json } of sources) {
    walkTokens(json, ({ path, node, malformed }) => {
      if (malformed) return;
      paths.add(pathKey(path));
      refs.set(path.join('.'), node.value);
      varNames.add(cssVarName(path));
    });
  }

  return {
    paths,
    refs,
    varNames,
    semanticTops: new Set(Object.keys(semantic)),
    componentTops,
    shadcnKeys: new Set(SHADCN_KEYS),
  };
}

const REF_PATTERN = /\{([^{}]+)\}/g;

function referencesOf(value) {
  return [...String(value).matchAll(REF_PATTERN)].map(m => m[1]);
}

/** 참조를 기본 집합으로 끝까지 풀어 본다. 풀 수 없으면 undefined */
function resolveValue(value, base, depth = 0) {
  if (depth > 20) return undefined;
  const m = /^\{([^{}]+)\}$/.exec(String(value));
  if (!m) return value;
  if (!base.refs.has(m[1])) return undefined;
  return resolveValue(base.refs.get(m[1]), base, depth + 1);
}

const COLOR_LITERAL = /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(.*\))$/i;

/** V7 색 값 판정: 값 형식(hex · 색 함수 · `{color.*}` 참조)과, 참조를 풀었을 때 색이 되는지로 본다 */
export function isColorValue(value, base) {
  const raw = String(value).trim();
  if (COLOR_LITERAL.test(raw)) return true;
  if (/^\{color\./.test(raw)) return true;
  const resolved = resolveValue(raw, base);
  return resolved !== undefined && resolved !== raw && COLOR_LITERAL.test(String(resolved).trim());
}

function startsWithPath(path, prefix) {
  return prefix.every((seg, i) => path[i] === seg);
}

function inAllowedScope(path, base) {
  const top = path[0];
  if (base.semanticTops.has(top)) return true;
  if (base.componentTops.has(top)) return true;
  return PRIMITIVE_ALLOW_PREFIXES.some(prefix => path.length > prefix.length && startsWithPath(path, prefix));
}

const SHADCN_HSL = /^\d{1,3} \d{1,3}% \d{1,3}%$/;
const SHADCN_HEX = /^#[0-9a-fA-F]{6}$/;
const CSS_LENGTH = /^(0|\d+(\.\d+)?(px|rem))$/;

/**
 * 브랜드 검증 V1~V8. 위반 문자열 배열을 돌려준다(빈 배열 = 통과).
 * @param brand loadBrand 결과
 * @param base collectBasePaths 결과
 */
export function validateBrand(brand, base) {
  const errors = [];
  const at = (rule, msg) => errors.push(`[${brand.name}] ${rule} ${msg}`);

  // V1 kebab-case
  if (!BRAND_NAME_PATTERN.test(brand.name)) {
    at('V1', `브랜드 이름이 kebab-case 가 아닙니다: "${brand.name}"`);
  }

  // V2 파일 3종과 brand.json 메타데이터
  for (const file of brand.missing) at('V2', `파일이 없습니다: ${file}`);
  for (const err of brand.parseErrors) at('V2', `읽을 수 없습니다: ${err}`);
  if (brand.meta !== undefined) {
    const meta = brand.meta;
    if (!isPlainObject(meta)) {
      at('V2', 'brand.json 최상위가 객체가 아닙니다');
    } else {
      if (meta.name !== brand.name) {
        at('V2', `brand.json name("${meta.name}")이 디렉터리 이름과 다릅니다`);
      }
      if (typeof meta.description !== 'string' || meta.description.trim() === '') {
        at('V2', 'brand.json description 이 비어 있거나 문자열이 아닙니다');
      }
      const themes = Array.isArray(meta.themes) ? [...meta.themes].sort() : null;
      if (!themes || themes.join(',') !== [...THEMES].sort().join(',')) {
        at('V2', `brand.json themes 는 실제 파일과 같은 ["light","dark"] 여야 합니다: ${JSON.stringify(meta.themes)}`);
      }
      if (!isPlainObject(meta.a11y)) {
        at('V2', 'brand.json a11y 가 객체가 아닙니다');
      }
    }
  }

  // V3 ~ V6 토큰 파일별 검사
  const leavesByTheme = {};
  for (const theme of THEMES) {
    const file = `${theme}.json`;
    const leaves = [];
    const nameToPath = new Map();
    walkTokens(brand[theme], ({ path, node, malformed }) => {
      const dotted = path.join('.');
      if (malformed) {
        at('V5', `${file} ${dotted}: leaf 는 { "value": string } 형태여야 합니다`);
        return;
      }
      leaves.push({ path, node });

      // V5 leaf 형태와 참조
      if (typeof node.value !== 'string') {
        at('V5', `${file} ${dotted}: value 가 문자열이 아닙니다`);
      } else {
        for (const ref of referencesOf(node.value)) {
          if (!base.refs.has(ref)) {
            at('V5', `${file} ${dotted}: 기본 집합에 없는 참조 {${ref}}`);
          }
        }
      }

      // V4 최상위 범위
      if (!inAllowedScope(path, base)) {
        at('V4', `${file} ${dotted}: 덮어쓸 수 없는 범위입니다(semantic · component · radius · font.family · shadow 만 허용)`);
      }

      // V3 기본 경로 존재
      if (!base.paths.has(pathKey(path))) {
        at('V3', `${file} ${dotted}: 기본 토큰에 없는 경로입니다`);
      }

      // V6 변수명 충돌
      const varName = cssVarName(path);
      if (!base.varNames.has(varName)) {
        at('V6', `${file} ${dotted}: 변수명 ${varName} 이 기본 변수명 집합에 없습니다`);
      }
      const prev = nameToPath.get(varName);
      if (prev !== undefined && prev !== pathKey(path)) {
        at('V6', `${file} ${dotted}: 다른 경로와 같은 변수명 ${varName} 을 만듭니다`);
      }
      nameToPath.set(varName, pathKey(path));
    });
    leavesByTheme[theme] = leaves;

    // V8 shadcn 키와 값 형식
    const shadcn = brand.shadcn[theme];
    if (!isPlainObject(shadcn)) {
      at('V8', `${file} shadcn 섹션이 객체가 아닙니다`);
      continue;
    }
    for (const [key, value] of Object.entries(shadcn)) {
      if (!base.shadcnKeys.has(key)) {
        at('V8', `${file} shadcn.${key}: 허용되지 않은 shadcn 변수입니다`);
        continue;
      }
      if (typeof value !== 'string') {
        at('V8', `${file} shadcn.${key}: 값이 문자열이 아닙니다`);
      } else if (key === 'radius') {
        if (!CSS_LENGTH.test(value.trim())) {
          at('V8', `${file} shadcn.radius: CSS 길이(px · rem)가 아닙니다: "${value}"`);
        }
      } else if (!SHADCN_HSL.test(value.trim()) && !SHADCN_HEX.test(value.trim())) {
        at('V8', `${file} shadcn.${key}: HSL 삼중값("H S% L%") 또는 6자리 hex 가 아닙니다: "${value}"`);
      }
    }
  }

  // V7 라이트/다크 짝 맞춤
  // 라이트에만 있는 키는 다크 화면에서 기본 `.dark` 값을 덮는다(plan 3.2 명시도).
  // 보수적으로, semantic 범주 키와 색 값 키는 모두 다크에도 있어야 한다.
  const darkKeys = new Set((leavesByTheme.dark || []).map(l => pathKey(l.path)));
  for (const { path, node } of leavesByTheme.light || []) {
    if (darkKeys.has(pathKey(path))) continue;
    const semantic = base.semanticTops.has(path[0]);
    const color = typeof node.value === 'string' && isColorValue(node.value, base);
    if (semantic || color) {
      at('V7', `light.json ${path.join('.')}: 다크 짝이 없습니다(${semantic ? 'semantic 범주' : '색 값'})`);
    }
  }
  if (isPlainObject(brand.shadcn.light) && isPlainObject(brand.shadcn.dark)) {
    for (const key of Object.keys(brand.shadcn.light)) {
      if (key === 'radius') continue;
      if (!Object.prototype.hasOwnProperty.call(brand.shadcn.dark, key)) {
        at('V7', `light.json shadcn.${key}: 다크 짝이 없습니다`);
      }
    }
  }

  return errors;
}

/** brand 마다 package.json exports 항목이 있는지 검사 (B5, 명시형 exports) */
export function brandExportEntries(name) {
  return {
    [`./css/brands/${name}`]: `./dist/css/brands/${name}.css`,
    [`./brands/${name}/brand.json`]: `./dist/brands/${name}/brand.json`,
  };
}

export function checkBrandExports(pkg, brandNames) {
  const errors = [];
  const exportsField = isPlainObject(pkg?.exports) ? pkg.exports : {};
  for (const name of brandNames) {
    for (const [key, target] of Object.entries(brandExportEntries(name))) {
      if (exportsField[key] !== target) {
        errors.push(`[${name}] B5 package.json exports 에 "${key}": "${target}" 항목이 없습니다`);
      }
    }
  }
  return errors;
}

/** 브랜드 선택자 (PRD FR-5, plan 3절 결정 4: 다크 3개) */
export function brandSelectors(name) {
  const attr = `[data-brand="${name}"]`;
  return {
    light: [attr],
    dark: [`${attr}.dark`, `${attr}[data-theme="dark"]`, `.dark ${attr}`],
  };
}

/**
 * 6자리 hex -> shadcn HSL 삼중값.
 * build-tokens.mjs `hexToHsl` 과 같은 계산이다(4단계 코드를 고치지 않으려고 복제).
 */
export function hexToHslTriple(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * 브랜드 JSON `shadcn` 섹션을 그대로 CSS 선언 줄로 낸다(plan 3절 결정 3).
 * 순서는 SHADCN_KEYS 순서로 고정해 산출물이 결정적이게 한다. hex 는 HSL 로 바꾼다.
 */
export function renderShadcnBlock(map) {
  if (!isPlainObject(map)) return '';
  return SHADCN_KEYS
    .filter(key => Object.prototype.hasOwnProperty.call(map, key))
    .map(key => {
      const value = String(map[key]).trim();
      const out = key !== 'radius' && SHADCN_HEX.test(value) ? hexToHslTriple(value) : value;
      return `  --${key}: ${out};`;
    })
    .join('\n');
}

/**
 * 브랜드 CSS 블록 하나를 만든다. css/axis-brand 포맷과, SD 가 0건 파일의 output 을 비워 돌려줄 때의
 * 대체 경로가 함께 쓴다. 선언이 하나도 없으면 빈 블록 대신 빈 문자열을 돌려준다.
 * @param selector 선택자(여러 개면 ',\n' 로 이은 문자열)
 * @param tokenLines `  --axis-...: 값;` 형태의 줄 배열
 * @param extra renderShadcnBlock 결과(여러 줄 문자열, 없으면 빈 문자열)
 */
export function renderBrandBlock(selector, tokenLines, extra) {
  const lines = [...tokenLines];
  if (extra) lines.push(extra);
  if (lines.length === 0) return '';
  return `${selector} {\n${lines.join('\n')}\n}\n`;
}

/**
 * 산출물 블록에 브랜드가 적은 선언이 모두 들어갔는지 대조한다. 빠진 항목 이름 배열을 돌려준다.
 * --axis-* 는 SD 가 값을 변환하므로 이름만, shadcn 은 renderShadcnBlock 이 낸 줄 그대로 본다.
 */
export function missingBrandDeclarations(css, { selector, tree, shadcn }) {
  const missing = [];
  const declLines = [];
  walkTokens(tree, ({ path, malformed }) => {
    if (!malformed) declLines.push({ label: cssVarName(path), test: `  ${cssVarName(path)}: ` });
  });
  for (const line of renderShadcnBlock(shadcn).split('\n').filter(Boolean)) {
    declLines.push({ label: line.trim().split(':')[0], test: line });
  }
  if (declLines.length === 0) return missing;
  if (!css.includes(`${selector} {\n`)) missing.push(`선택자 ${selector.replace(/\n/g, ' ')}`);
  for (const { label, test } of declLines) {
    if (!css.includes(test)) missing.push(label);
  }
  return missing;
}

/** 브랜드 토큰 파일에 적힌 leaf 경로 키 집합 (SD 출력 필터용) */
export function brandPathKeys(tree) {
  const keys = new Set();
  walkTokens(tree, ({ path, malformed }) => {
    if (!malformed) keys.add(pathKey(path));
  });
  return keys;
}

/** shadcn-compat.css 의 첫 블록(:root)에서 변수 이름을 뽑는다 (SHADCN_KEYS 드리프트 검사용) */
export function parseShadcnRootKeys(css) {
  const m = /:root\s*\{([^}]*)\}/.exec(css);
  if (!m) return [];
  return [...m[1].matchAll(/--([a-z0-9-]+)\s*:/g)].map(x => x[1]);
}
