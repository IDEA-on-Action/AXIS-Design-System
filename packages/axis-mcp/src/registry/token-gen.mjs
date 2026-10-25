/**
 * AXIS Design System MCP - 토큰 데이터 생성기 (WI-0076)
 *
 * MCP 의 axis.list_tokens · axis.get_token 이 읽는 dist/data/tokens.json 을 @axis-ds/tokens 의 빌드 산출물에서 만듭니다.
 * 손으로 적은 사본(1.3.5 까지의 src/registry/data/tokens.json)이 tokens 값을 따라가지 못한 결함을 막으려는 것이라
 * 값은 한 글자도 여기에 적지 않습니다. 원천은 아래 세 파일이고, 모두 tokens 패키지 exports 로 찾습니다.
 *
 *   - `@axis-ds/tokens/json`        dist/json/tokens.json      (284개, 라이트 값)
 *   - `@axis-ds/tokens/css`         dist/css/variables.css     (:root 라이트 · .dark 다크, --axis-* 이름)
 *   - `@axis-ds/tokens/css/shadcn`  dist/css/shadcn-compat.css (:root · .dark, shadcn 이름 25개)
 *
 * 경로 규칙
 *   - shadcn 변수: `colors.<이름>`(끝의 `-foreground` 는 `.foreground`), `--radius` 는 `radius`
 *   - --axis-* 변수: 접두를 떼고 `-` 를 `.` 로(예: --axis-control-h-md → control.h.md)
 *   - 1.3.5 까지 쓰던 경로 36개는 그대로 path 로 두고(호환), 같은 계열(space · font-*)은 그 체계를 이어 씁니다
 *     (예: --axis-space-5 → spacing.5). 이때 위 규칙 경로(space.5)는 aliases 로 함께 받습니다.
 *     1.3.5 의 41개 가운데 tokens 에 대응이 없는 5개(shadow.md · animation.*)는 내지 않습니다(PRD D3).
 *
 * 원천이 예상과 다르면(블록 없음 · 짝 없음 · 모르는 접두 · 값 불일치) 조용히 넘기지 않고 throw 합니다.
 *
 * 사용(빌드): node src/registry/token-gen.mjs dist/data/tokens.json
 */
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** 생성본이 쓰는 카테고리(src/types.ts TOKEN_CATEGORIES 와 같아야 하며 테스트가 대조합니다) */
export const GENERATED_CATEGORIES = ["color", "typography", "spacing", "radius", "shadow", "density", "component"];

/**
 * --axis-* 변수의 첫 이름 조각 → 카테고리. 여기에 없는 접두가 tokens 에 생기면 생성이 실패해 분류를 강제합니다.
 * 밀도(density)는 WI-0026 의 control · field · toggle · table 과 radius-control · field · surface 입니다.
 */
const PREFIX_CATEGORY = {
  color: "color",
  surface: "color",
  text: "color",
  border: "color",
  icon: "color",
  interactive: "color",
  status: "color",
  diff: "color",
  agent: "color",
  font: "typography",
  space: "spacing",
  radius: "radius",
  shadow: "shadow",
  button: "component",
  input: "component",
  card: "component",
  badge: "component",
  dialog: "component",
  plan: "component",
  form: "component",
  progress: "component",
  control: "density",
  field: "density",
  toggle: "density",
  table: "density",
};
const DENSITY_RADIUS = new Set(["--axis-radius-control", "--axis-radius-field", "--axis-radius-surface"]);

/**
 * 1.3.5 까지의 경로(호환 유지). 값은 적지 않고 원천 변수 이름만 적습니다. 설명은 값이 아니라 안내 문구라 여기 둡니다.
 * @type {Array<[path: string, cssVariable: string, description: string]>}
 */
const LEGACY_PATHS = [
  ["colors.background", "--background", "기본 배경색"],
  ["colors.foreground", "--foreground", "기본 전경색 (텍스트)"],
  ["colors.primary", "--primary", "주요 브랜드 색상"],
  ["colors.primary.foreground", "--primary-foreground", "주요 색상 위 텍스트"],
  ["colors.secondary", "--secondary", "보조 색상"],
  ["colors.secondary.foreground", "--secondary-foreground", "보조 색상 위 텍스트"],
  ["colors.muted", "--muted", "음소거/비활성 배경색"],
  ["colors.muted.foreground", "--muted-foreground", "음소거 텍스트 색상"],
  ["colors.accent", "--accent", "강조 배경색"],
  ["colors.accent.foreground", "--accent-foreground", "강조 텍스트 색상"],
  ["colors.destructive", "--destructive", "위험/삭제 작업 색상"],
  ["colors.destructive.foreground", "--destructive-foreground", "위험 색상 위 텍스트"],
  ["colors.border", "--border", "테두리 색상"],
  ["colors.ring", "--ring", "포커스 링 색상"],
  ["typography.fontFamily.sans", "--axis-font-family-sans", "기본 산세리프 폰트"],
  ["typography.fontFamily.mono", "--axis-font-family-mono", "모노스페이스 폰트"],
  ["typography.fontSize.xs", "--axis-font-size-xs", "아주 작은 텍스트 (12px)"],
  ["typography.fontSize.sm", "--axis-font-size-sm", "작은 텍스트 (14px)"],
  ["typography.fontSize.base", "--axis-font-size-base", "기본 텍스트 (16px)"],
  ["typography.fontSize.lg", "--axis-font-size-lg", "큰 텍스트 (18px)"],
  ["typography.fontSize.xl", "--axis-font-size-xl", "더 큰 텍스트 (20px)"],
  ["typography.fontSize.2xl", "--axis-font-size-2xl", "제목 텍스트 (24px)"],
  ["spacing.0", "--axis-space-0", "0 간격"],
  ["spacing.1", "--axis-space-1", "4px 간격"],
  ["spacing.2", "--axis-space-2", "8px 간격"],
  ["spacing.3", "--axis-space-3", "12px 간격"],
  ["spacing.4", "--axis-space-4", "16px 간격"],
  ["spacing.6", "--axis-space-6", "24px 간격"],
  ["spacing.8", "--axis-space-8", "32px 간격"],
  ["radius.none", "--axis-radius-none", "모서리 없음"],
  ["radius.sm", "--axis-radius-sm", "작은 모서리 (2px)"],
  ["radius.md", "--axis-radius-md", "중간 모서리 (6px)"],
  ["radius.lg", "--axis-radius-lg", "큰 모서리 (8px)"],
  ["radius.full", "--axis-radius-full", "완전한 원형"],
  ["shadow.sm", "--axis-shadow-sm", "작은 그림자"],
  ["shadow.lg", "--axis-shadow-lg", "큰 그림자"],
];

const HSL_TRIPLE = /^\d+(\.\d+)? \d+(\.\d+)?% \d+(\.\d+)?%$/;

/**
 * CSS 텍스트에서 선택자 블록 하나의 `--이름: 값;` 을 순서대로 읽습니다.
 * @param {string} css
 * @param {string} selector `:root` 또는 `.dark`
 * @param {string} label 오류 문구용 파일 이름
 * @returns {Map<string, string>}
 */
function readBlock(css, selector, label) {
  const start = css.search(new RegExp(`(^|\\n)${selector.replace(".", "\\.")}\\s*\\{`));
  if (start < 0) throw new Error(`${label}: ${selector} 블록이 없습니다`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  if (close < 0) throw new Error(`${label}: ${selector} 블록이 닫히지 않았습니다`);
  const vars = new Map();
  for (const m of css.slice(open + 1, close).matchAll(/(--[A-Za-z0-9-]+)\s*:\s*([^;]+);/g)) {
    if (vars.has(m[1])) throw new Error(`${label}: ${selector} 에 ${m[1]} 가 두 번 있습니다`);
    vars.set(m[1], m[2].trim());
  }
  if (vars.size === 0) throw new Error(`${label}: ${selector} 블록에 변수가 없습니다`);
  return vars;
}

/** 대소문자 · 하이픈을 지운 비교 키(json 키 ControlHMd ↔ 변수 --axis-control-h-md) */
const flatKey = (s) => s.replace(/-/g, "").toLowerCase();

/** shadcn 변수 이름 → MCP 경로 */
function shadcnPath(name) {
  if (name === "--radius") return "radius";
  return `colors.${name.slice(2).replace(/-foreground$/, ".foreground")}`;
}

/** --axis-* 변수 이름 → MCP 경로(tokens 이름 기반) */
export function axisPath(name) {
  return name.slice("--axis-".length).split("-").join(".");
}

/**
 * 1.3.5 경로 체계를 이어 쓰는 계열(spacing.* · typography.*)의 경로. 계열 밖이면 undefined.
 * 예: --axis-space-5 → spacing.5, --axis-font-size-3xl → typography.fontSize.3xl
 */
const FAMILY_PATHS = [
  ["--axis-space-", "spacing."],
  ["--axis-font-family-", "typography.fontFamily."],
  ["--axis-font-size-", "typography.fontSize."],
  ["--axis-font-weight-", "typography.fontWeight."],
  ["--axis-font-lineHeight-", "typography.lineHeight."],
];
function familyPath(name) {
  for (const [prefix, to] of FAMILY_PATHS) {
    if (name.startsWith(prefix)) return to + name.slice(prefix.length).split("-").join(".");
  }
  return undefined;
}

function axisCategory(name) {
  if (DENSITY_RADIUS.has(name)) return "density";
  const head = name.slice("--axis-".length).split("-")[0];
  const category = PREFIX_CATEGORY[head];
  if (!category) {
    throw new Error(`모르는 토큰 접두 '${head}'(${name}): token-gen.mjs PREFIX_CATEGORY 에 카테고리를 정해 주세요`);
  }
  return category;
}

/**
 * tokens 산출물 텍스트에서 TokenMeta[] 를 만듭니다(파일을 읽지 않는 순수 함수).
 * @param {{ json: string, variablesCss: string, shadcnCss: string }} sources
 * @returns {import("./token-gen.d.mts").TokenMeta[]}
 */
export function generateTokens({ json, variablesCss, shadcnCss }) {
  const flat = JSON.parse(json);
  if (!flat || typeof flat !== "object" || Array.isArray(flat)) throw new Error("tokens.json: 평면 객체가 아닙니다");
  const axisLight = readBlock(variablesCss, ":root", "variables.css");
  const axisDark = readBlock(variablesCss, ".dark", "variables.css");
  const shadLight = readBlock(shadcnCss, ":root", "shadcn-compat.css");
  const shadDark = readBlock(shadcnCss, ".dark", "shadcn-compat.css");

  // json 키와 --axis-* 변수를 1:1 로 짝짓고 값이 같은지 봅니다(두 산출물이 같은 빌드에서 나왔는지의 대조)
  const byFlat = new Map();
  for (const name of axisLight.keys()) {
    if (!name.startsWith("--axis-")) throw new Error(`variables.css: --axis- 접두가 아닌 변수 ${name}`);
    const key = flatKey(name.slice("--axis-".length));
    if (byFlat.has(key)) throw new Error(`variables.css: ${byFlat.get(key)} 와 ${name} 를 구분할 수 없습니다`);
    byFlat.set(key, name);
  }
  const jsonKeys = Object.keys(flat);
  if (jsonKeys.length !== axisLight.size) {
    throw new Error(`tokens.json ${jsonKeys.length}개와 variables.css :root ${axisLight.size}개가 다릅니다`);
  }
  for (const key of jsonKeys) {
    const name = byFlat.get(key.toLowerCase());
    if (!name) throw new Error(`tokens.json ${key} 에 대응하는 variables.css 변수가 없습니다`);
    if (String(flat[key]) !== axisLight.get(name)) {
      throw new Error(`tokens.json ${key}(${flat[key]}) 와 ${name}(${axisLight.get(name)}) 값이 다릅니다`);
    }
  }

  const legacyByVar = new Map(LEGACY_PATHS.map(([path, cssVariable, description]) => [cssVariable, { path, description }]));
  /** @type {import("./token-gen.d.mts").TokenMeta[]} */
  const tokens = [];

  for (const [name, light] of shadLight) {
    const dark = shadDark.get(name);
    const isRadius = name === "--radius";
    if (!isRadius && !HSL_TRIPLE.test(light)) {
      throw new Error(`shadcn-compat.css ${name}: HSL 삼중값이 아닙니다(${light})`);
    }
    const wrap = (v) => (v === undefined ? undefined : isRadius ? v : `hsl(${v})`);
    const legacy = legacyByVar.get(name);
    const derived = shadcnPath(name);
    tokens.push({
      path: legacy?.path ?? derived,
      value: wrap(light),
      ...(dark !== undefined ? { dark: wrap(dark) } : {}),
      category: isRadius ? "radius" : "color",
      ...(legacy?.description ? { description: legacy.description } : {}),
      cssVariable: name,
      ...(legacy && legacy.path !== derived ? { aliases: [derived] } : {}),
    });
  }

  for (const [name, light] of axisLight) {
    const dark = axisDark.get(name);
    const legacy = legacyByVar.get(name);
    const derived = axisPath(name);
    const family = familyPath(name);
    if (legacy && family && legacy.path !== family) {
      throw new Error(`호환 경로 ${legacy.path} 가 계열 규칙 경로 ${family} 와 다릅니다`);
    }
    const path = legacy?.path ?? family ?? derived;
    tokens.push({
      path,
      value: light,
      ...(dark !== undefined ? { dark } : {}),
      category: axisCategory(name),
      ...(legacy?.description ? { description: legacy.description } : {}),
      cssVariable: name,
      ...(path !== derived ? { aliases: [derived] } : {}),
    });
  }

  // 호환 경로가 전부 원천에 있어야 합니다(tokens 에서 변수가 사라지면 조용히 경로가 빠지지 않게)
  const seenVars = new Set(tokens.map((t) => t.cssVariable));
  const lost = LEGACY_PATHS.filter(([, v]) => !seenVars.has(v)).map(([p, v]) => `${p}(${v})`);
  if (lost.length) throw new Error(`호환 경로의 원천 변수가 tokens 에 없습니다: ${lost.join(", ")}`);

  // 경로 · 별칭이 겹치면 get_token 이 엉뚱한 항목을 돌려주므로 막습니다
  const names = new Map();
  for (const t of tokens) {
    for (const p of [t.path, ...(t.aliases ?? [])]) {
      const k = p.toLowerCase();
      if (names.has(k)) throw new Error(`경로 '${p}' 가 ${names.get(k)} 와 ${t.cssVariable} 에서 겹칩니다`);
      names.set(k, t.cssVariable);
    }
  }
  return tokens;
}

/**
 * 설치된 @axis-ds/tokens 의 원천 파일 경로와 버전을 찾습니다(devDependency workspace 연결 기준).
 * @param {string} [from] 해석 기준 파일(기본: 이 파일)
 */
export function resolveTokenSources(from = import.meta.url) {
  const require = createRequire(from);
  const json = require.resolve("@axis-ds/tokens/json");
  const variablesCss = require.resolve("@axis-ds/tokens/css");
  const shadcnCss = require.resolve("@axis-ds/tokens/css/shadcn");
  // exports 에 ./package.json 이 없어 dist/json/tokens.json 에서 두 단계 올라갑니다
  const pkg = JSON.parse(readFileSync(join(dirname(json), "..", "..", "package.json"), "utf8"));
  if (pkg.name !== "@axis-ds/tokens") throw new Error(`tokens package.json 을 찾지 못했습니다(${pkg.name})`);
  return { json, variablesCss, shadcnCss, version: pkg.version };
}

/** 원천 파일을 읽어 생성본 객체(dist/data/tokens.json 의 내용)를 만듭니다 */
export function buildTokenData(paths = resolveTokenSources()) {
  const tokens = generateTokens({
    json: readFileSync(paths.json, "utf8"),
    variablesCss: readFileSync(paths.variablesCss, "utf8"),
    shadcnCss: readFileSync(paths.shadcnCss, "utf8"),
  });
  return { source: { package: "@axis-ds/tokens", version: paths.version }, tokens };
}

// CLI: 빌드 단계(package.json build)에서 dist/data/tokens.json 을 씁니다
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2];
  if (!out) {
    console.error("사용: node src/registry/token-gen.mjs <출력 경로>");
    process.exit(1);
  }
  const data = buildTokenData();
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(out, JSON.stringify(data, null, 2) + "\n");
  console.log(`[token-gen] @axis-ds/tokens ${data.source.version} 에서 토큰 ${data.tokens.length}개 생성 → ${out}`);
}
