/**
 * 브랜드 공유 코어 (WI-0028 plan 4.1)
 *
 * 원본은 `packages/axis-cli/src/theme/brand-core.ts` 이고, `packages/axis-mcp/src/tools/brand-core.ts` 에
 * 바이트 단위로 같은 사본을 둡니다(U1). 사본 동일성은 MCP 테스트가 막습니다.
 * 두 패키지에서 똑같이 컴파일되도록 Node 내장 모듈과 공유 코어(@axis-ds/registry-core, 두 패키지가 번들)만 쓰고,
 * 출력 문자열은 만들지 않고 구조화된 값만 돌려줍니다. 전역 CSS 후보는 init 과 같이 쓰려고 공유 코어에 둡니다(WI-0065).
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve, sep } from "node:path";
import { GLOBAL_CSS_CANDIDATES, ROOT_LAYOUT_FILES, selectGlobalCss } from "@axis-ds/registry-core/project";
import { packageVersionGate, type PackageVersionGate } from "@axis-ds/registry-core/tailwind-core";

/** 브랜드를 담는 패키지 이름 */
export const TOKENS_PACKAGE = "@axis-ds/tokens";

/** 브랜드 이름 규칙. `packages/axis-tokens/scripts/brands.mjs` 의 `BRAND_NAME_PATTERN` 과 같은 정규식입니다. */
export const BRAND_NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** 브랜드 산출물(`./brands` exports)이 처음 들어간 `@axis-ds/tokens` 버전 */
export const MIN_BRAND_TOKENS_VERSION = "1.3.0";

/**
 * `axis theme add` 가 package.json 에 기록하고 설치 안내에 쓰는 `@axis-ds/tokens` 하한(WI-0065 D7, 종전 1.3.0).
 * linked 현행 버전이고, theme add 가 넣는 기본 토큰 CSS(Tailwind 4 진입점은 1.4.0 부터)와 agentic-ui 1.6.0 이 쓰는 변수
 * (이슈 #175 서술, 미측정)를 담습니다. 설치본 업그레이드 안내 기준은 `MIN_BRAND_TOKENS_VERSION` 그대로입니다.
 */
export const TOKENS_DEPENDENCY_MIN_VERSION = "1.6.0";

/** `axis theme info` · `axis.get_brand` 가 보여 주는 주요 토큰(U4, 라이트 · 다크 각각 브랜드 CSS 에 있는 것만) */
export const KEY_TOKENS = [
  "--primary",
  "--primary-foreground",
  "--background",
  "--foreground",
  "--ring",
  "--radius",
  "--axis-surface-default",
  "--axis-text-primary",
  "--axis-text-brand",
  "--axis-button-bg-default",
  "--axis-border-focus",
  "--axis-font-family-sans",
] as const;

/** 보정 내역의 근거 문서(U3 (A): 보정 전 · 후 값은 후속 WI, 이번에는 a11y 메타와 근거 문서 안내만) */
export const BRAND_ADJUSTMENT_REFERENCE = "WI-0025 PRD 부록 B (docs/workitems/WI-0025-brand-theme/prd.md)";

/**
 * 대상 프로젝트의 `@axis-ds/tokens` 상태
 * - `ok`: 브랜드 목록(`@axis-ds/tokens/brands`)을 읽을 수 있음
 * - `not-installed`: 패키지가 없음
 * - `unsupported`: 패키지는 있지만 `./brands` exports 가 없음(1.2.1 이하)
 * - `not-built`: exports 는 있지만 대상 파일이 없음(워크스페이스 링크 뒤 빌드 전 등)
 */
export type TokensStatus = "ok" | "not-installed" | "unsupported" | "not-built";

export interface TokensResolution {
  status: TokensStatus;
  /** 찾은 `@axis-ds/tokens/package.json` 의 version (`not-installed` 면 없음) */
  version?: string;
  /** 브랜드 목록 파일 절대 경로 (`ok` 일 때만) */
  indexPath?: string;
}

/** `dist/brands/index.json` 항목 (tokens 1.3.0 공개 API) */
export interface BrandIndexEntry {
  name: string;
  /** exports 하위 경로, 예 `./css/brands/<b>` */
  css: string;
  /** exports 하위 경로, 예 `./brands/<b>/brand.json` */
  meta: string;
}

export interface BrandA11y {
  status?: unknown;
  checkedAt?: unknown;
  gate?: unknown;
  [key: string]: unknown;
}

export interface BrandSummary {
  name: string;
  description: string;
  themes: string[];
  a11y: BrandA11y;
  /** CSS 에 넣을 import 경로, 예 `@axis-ds/tokens/css/brands/<b>` */
  importPath: string;
}

export interface BrandTokens {
  light: Record<string, string>;
  dark: Record<string, string>;
}

export interface BrandAdjustments {
  a11y: BrandA11y;
  reference: string;
}

export interface BrandDetail extends BrandSummary {
  /** `KEY_TOKENS` 가운데 브랜드 CSS 에 있는 것만, `KEY_TOKENS` 순서 */
  tokens: BrandTokens;
  providerExample: string;
  adjustments: BrandAdjustments;
}

export interface BrandListResult {
  status: TokensStatus;
  version?: string;
  brands: BrandSummary[];
}

export interface BrandGetResult {
  status: TokensStatus;
  version?: string;
  /** 브랜드를 찾지 못했거나 `status` 가 `ok` 가 아니면 `null` */
  brand: BrandDetail | null;
  /** 설치된 브랜드 이름(이름순) */
  available: string[];
}

function readJsonFile(file: string): unknown {
  return JSON.parse(readFileSync(file, "utf8"));
}

function errorCode(err: unknown): string | undefined {
  return typeof err === "object" && err !== null && "code" in err
    ? String((err as { code: unknown }).code)
    : undefined;
}

/** `<baseDir>` 에서 위로 올라가며 `node_modules/@axis-ds/tokens/package.json` 을 찾습니다(심볼릭 링크는 그대로 따라감). */
function findTokensPackageJson(baseDir: string): string | undefined {
  let dir = resolve(baseDir);
  for (;;) {
    const candidate = join(dir, "node_modules", TOKENS_PACKAGE, "package.json");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

function projectRequire(baseDir: string): ReturnType<typeof createRequire> {
  return createRequire(join(resolve(baseDir), "package.json"));
}

/** `@axis-ds/tokens` 뒤에 붙는 exports 하위 경로(`./x/y`)를 패키지 지정자로 바꿉니다. */
function tokensSpecifier(subpath: string): string {
  return `${TOKENS_PACKAGE}/${subpath.replace(/^\.\//, "")}`;
}

/**
 * 대상 프로젝트의 `@axis-ds/tokens` 상태를 판정합니다(plan 3장 5).
 * 설치 여부는 파일을 직접 찾아 보고, exports 해석은 찾았을 때만 합니다.
 * `MODULE_NOT_FOUND` 하나로 「미설치」를 판정하지 않습니다(빌드 전 링크도 같은 코드를 냄).
 */
export function resolveTokens(baseDir: string): TokensResolution {
  const pkgJson = findTokensPackageJson(baseDir);
  if (!pkgJson) return { status: "not-installed" };

  const pkg = readJsonFile(pkgJson) as { version?: unknown };
  const version = typeof pkg.version === "string" ? pkg.version : undefined;

  try {
    const indexPath = projectRequire(baseDir).resolve(tokensSpecifier("./brands"));
    return { status: "ok", version, indexPath };
  } catch (err) {
    const code = errorCode(err);
    if (code === "ERR_PACKAGE_PATH_NOT_EXPORTED") return { status: "unsupported", version };
    if (code === "MODULE_NOT_FOUND") return { status: "not-built", version };
    throw err;
  }
}

/** index 항목에서 CSS import 경로를 만듭니다. FR-2 · FR-4 · FR-5 가 같은 함수를 씁니다. */
export function brandImportPath(entry: Pick<BrandIndexEntry, "css">): string {
  return tokensSpecifier(entry.css);
}

/** `axis.config.json` 가운데 브랜드 기능이 읽는 키(MCP 는 config 를 읽기만 하므로 최소 타입만 둡니다) */
export interface BrandConfigLike {
  globalCss?: unknown;
  brand?: unknown;
}

export interface GlobalCssLocation {
  /** 고른 CSS 파일의 절대 경로. 후보가 모두 없으면 없음 */
  path?: string;
  /** `globalCss` 키가 가리키는데 파일이 없을 때 그 값(설정에 적힌 그대로) */
  configuredMissing?: string;
}

/**
 * `globalCss` 다음으로 보는 후보(PRD FR-2 순서). 원본은 공유 코어(`@axis-ds/registry-core/project`)이고 init 의 탐색과 같은
 * 목록입니다(WI-0065, `styles/globals.css` · `src/styles/globals.css` 추가).
 */
export { GLOBAL_CSS_CANDIDATES };

function isFile(file: string): boolean {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

/**
 * 브랜드 import 를 넣을 CSS 파일을 찾습니다(PRD FR-2 · A1, plan 4.1 U14 (A)). `axis theme add` 가 씁니다.
 * 공유 코어 `selectGlobalCss`(WI-0100a) 위의 얇은 래퍼이고 규칙은 종전 그대로입니다.
 * 후보는 `config.globalCss` → `GLOBAL_CSS_CANDIDATES`(`app/globals.css` → `src/app/globals.css` → `styles/globals.css` →
 * `src/styles/globals.css` → 루트 `globals.css`) 순이고,
 * `globalCss` 는 키가 없을 때와 키가 가리키는 파일이 없을 때 모두 다음 후보로 넘어갑니다.
 * 파일이 없을 때는 `configuredMissing` 에 그 값을 담아 호출한 쪽이 경고하게 합니다.
 * `.css` 가 아닌 파일 · 프로젝트 밖 파일도 그대로 돌려주고, theme add 가 쓰기 직전에 거절합니다(`css-not-stylesheet` ·
 * `css-outside-project`). check 의 brand 항목은 이 함수가 아니라 `selectGlobalCss` 를 `.css` 확인을 켜고 부릅니다(`inspectBrandImport`).
 */
export function findGlobalCss(baseDir: string, config: BrandConfigLike | null | undefined): GlobalCssLocation {
  const selection = selectGlobalCss(resolve(baseDir), config?.globalCss, GLOBAL_CSS_CANDIDATES);
  const result: GlobalCssLocation = {};
  if (selection.configuredMissing !== undefined) result.configuredMissing = selection.configuredMissing;
  if (selection.path !== undefined) result.path = selection.path;
  return result;
}

/**
 * CSS 안의 브랜드 import 이름 목록(나온 순서, 중복 포함). 주석 안의 import 는 세지 않습니다.
 * `@import "..."` · `@import '...'` · `@import url(...)` 세 형태를 읽습니다.
 */
export function findBrandImports(css: string): string[] {
  const names: string[] = [];
  const pattern =
    /@import\s+(?:url\(\s*)?["']?@axis-ds\/tokens\/css\/brands\/([a-z][a-z0-9-]*)(?:\.css)?["']?\s*\)?\s*(?=[;\s]|$)/g;
  for (const m of stripComments(css).matchAll(pattern)) {
    names.push(m[1]);
  }
  return names;
}

/** 설정 파일 이름 */
export const AXIS_CONFIG_FILE_NAME = "axis.config.json";

/**
 * `<baseDir>/axis.config.json` 을 읽습니다(FR-5 검사용).
 * 파일이 없거나, JSON 이 깨졌거나, 최상위가 객체가 아니면 `null` 입니다. 검사기는 이때 brand 항목을 더하지 않습니다.
 */
export function readBrandConfig(baseDir: string): BrandConfigLike | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(join(resolve(baseDir), AXIS_CONFIG_FILE_NAME), "utf8"));
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  return parsed as BrandConfigLike;
}

/**
 * `axis check` · `axis.check_project` 의 brand 검사 결과(FR-5, plan 4.5)
 * - `match`: CSS 에 `brand` import 가 있음
 * - `css-missing`: CSS 후보를 하나도 찾지 못함
 * - `import-missing`: CSS 에 브랜드 import 가 하나도 없음
 * - `other-brand`: 다른 브랜드 import 만 있음
 */
export type BrandImportState = "match" | "css-missing" | "import-missing" | "other-brand";

export interface BrandImportCheck {
  brand: string;
  state: BrandImportState;
  /** 검사한 CSS 파일(`baseDir` 기준 상대 경로, `/` 구분). `css-missing` 이면 없음 */
  cssFile?: string;
  /** `globalCss` 가 가리키는 파일이 없을 때(디렉터리 포함) 그 값(설정에 적힌 그대로) */
  configuredMissing?: string;
  /** `globalCss` 가 `.css` 가 아닌 일반 파일을 가리켜 버리고 후보로 넘어갔을 때 그 값(설정에 적힌 그대로, WI-0100 D10) */
  configuredRejected?: string;
  /** CSS 안의 브랜드 import 이름(나온 순서, 중복 제거) */
  imports: string[];
}

/**
 * `axis.config.json` 의 `brand` 와 CSS 의 브랜드 import 를 대조합니다(FR-5).
 * config 가 없거나 읽을 수 없거나 `brand` 가 비어 있으면 `null` 이고, 검사기는 결과를 추가하지 않습니다(기존 출력 불변).
 * CSS 파일은 공유 코어 `selectGlobalCss`(`globalCss` → `GLOBAL_CSS_CANDIDATES`, theme add 와 같은 순서)로 고르되, check 경로라
 * `globalCss` 가 `.css` 가 아닌 일반 파일이면 버리고 후보로 넘어가 `configuredRejected` 를 담습니다(WI-0100 D10). theme add 는 그때
 * 후보로 넘어가지 않고 오류로 멈추며(`css-not-stylesheet`, 아무것도 쓰지 않음), check 는 후보 파일을 판정하고 버린 사유를 표기합니다.
 * 프로젝트 밖 `globalCss` 는 읽기만 합니다.
 */
export function inspectBrandImport(baseDir: string): BrandImportCheck | null {
  const config = readBrandConfig(baseDir);
  const brand = config?.brand;
  if (typeof brand !== "string" || brand.trim() === "") return null;

  const root = resolve(baseDir);
  const location = selectGlobalCss(root, config?.globalCss, GLOBAL_CSS_CANDIDATES, { requireStylesheet: true });
  const base: Pick<BrandImportCheck, "brand" | "configuredMissing" | "configuredRejected"> = { brand };
  if (location.configuredMissing !== undefined) base.configuredMissing = location.configuredMissing;
  if (location.configuredRejected !== undefined) base.configuredRejected = location.configuredRejected;
  if (!location.path) {
    return { ...base, state: "css-missing", imports: [] };
  }

  const cssFile = relative(root, location.path).split(sep).join("/");
  const imports = [...new Set(findBrandImports(readFileSync(location.path, "utf8")))];
  let state: BrandImportState;
  if (imports.includes(brand)) state = "match";
  else if (imports.length === 0) state = "import-missing";
  else state = "other-brand";
  return { ...base, state, cssFile, imports };
}

/**
 * index 항목이 가리키는 파일(brand.json · CSS)이 없을 때 나는 오류인지 봅니다.
 * index.json 은 있는데 항목 파일이 없는 부분 빌드 상태를 `not-built` 로 돌려주는 데 씁니다(plan 3장 5).
 */
function isMissingBuildFile(err: unknown): boolean {
  const code = errorCode(err);
  return code === "MODULE_NOT_FOUND" || code === "ENOENT";
}

function readBrandIndex(indexPath: string): BrandIndexEntry[] {
  const data = readJsonFile(indexPath) as { brands?: unknown };
  if (!Array.isArray(data.brands)) {
    throw new Error(`${indexPath}: "brands" 배열이 없습니다`);
  }
  return data.brands as BrandIndexEntry[];
}

function readSummary(baseDir: string, entry: BrandIndexEntry): BrandSummary {
  const metaPath = projectRequire(baseDir).resolve(tokensSpecifier(entry.meta));
  const meta = readJsonFile(metaPath) as {
    description?: unknown;
    themes?: unknown;
    a11y?: unknown;
  };
  return {
    name: entry.name,
    description: typeof meta.description === "string" ? meta.description : "",
    themes: Array.isArray(meta.themes) ? meta.themes.map(String) : [],
    a11y:
      typeof meta.a11y === "object" && meta.a11y !== null ? (meta.a11y as BrandA11y) : {},
    importPath: brandImportPath(entry),
  };
}

/**
 * 설치된 브랜드 목록(FR-1). `index.json` 을 읽고 각 항목의 `meta` 로 `brand.json` 을 읽습니다.
 * 순서는 index 순서(이름순)를 그대로 따릅니다. `status` 가 `ok` 가 아니면 빈 목록이 아니라 「측정 못 함」입니다.
 */
export function listBrands(baseDir: string): BrandListResult {
  const tokens = resolveTokens(baseDir);
  if (tokens.status !== "ok" || !tokens.indexPath) {
    return { status: tokens.status, version: tokens.version, brands: [] };
  }
  const entries = readBrandIndex(tokens.indexPath);
  let brands: BrandSummary[];
  try {
    brands = entries.map((entry) => readSummary(baseDir, entry));
  } catch (err) {
    if (isMissingBuildFile(err)) return { status: "not-built", version: tokens.version, brands: [] };
    throw err;
  }
  return { status: "ok", version: tokens.version, brands };
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function parseDeclarations(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/(--[A-Za-z0-9_-]+)\s*:\s*([^;]+);/g)) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

function isDarkSelector(selector: string): boolean {
  return /\.dark\b/.test(selector) || /\[data-theme=["']?dark["']?\]/.test(selector);
}

/**
 * 브랜드 CSS 에서 라이트 · 다크 첫 블록의 사용자 정의 속성을 뽑습니다(FR-3).
 * 선택자 목록에 `.dark` 나 `[data-theme="dark"]` 가 있으면 다크, 그 밖에 `[data-brand="<name>"]` 가 있으면 라이트입니다.
 * 라이트 선택자 형태(`[data-brand]` · 명시도를 올린 `[data-brand][data-brand]`)에 기대지 않습니다.
 */
export function parseBrandCss(css: string, name: string): BrandTokens {
  const result: BrandTokens = { light: {}, dark: {} };
  let lightFound = false;
  let darkFound = false;
  const brandAttr = new RegExp(`\\[data-brand=["']?${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']?\\]`);
  for (const m of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = m[1].split(",").map((s) => s.trim());
    if (!selectors.some((s) => brandAttr.test(s))) continue;
    if (selectors.some(isDarkSelector)) {
      if (!darkFound) {
        result.dark = parseDeclarations(m[2]);
        darkFound = true;
      }
    } else if (!lightFound) {
      result.light = parseDeclarations(m[2]);
      lightFound = true;
    }
  }
  return result;
}

function pickKeyTokens(decls: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of KEY_TOKENS) {
    if (Object.prototype.hasOwnProperty.call(decls, key)) out[key] = decls[key];
  }
  return out;
}

/**
 * ThemeProvider 가 서버 마크업 `<html data-brand>` 를 초기값으로 읽고, `setBrand(undefined)` 로 끈 상태를 새로고침 뒤에도
 * 유지하는 첫 `@axis-ds/theme` 버전(WI-0068). 1.6.2 이하는 브랜드 상태가 비면 마운트 때 마크업 속성을 지웠습니다.
 * 근거는 bump 종류입니다: theme changeset 이 minor 라 linked 4패키지가 1.6.x 에서 1.7.0 으로 오릅니다.
 */
export const THEME_MARKUP_BRAND_MIN_VERSION = "1.7.0";

/**
 * 브랜드를 켜는 예시(FR-3 · FR-4, WI-0065 D7 · WI-0068). 버전과 상관없이 같은 문구이고, 버전 조건을 문구 안에 적습니다.
 * 1. 서버 마크업: 루트 레이아웃의 `<html>` 에 `data-brand` 를 붙입니다(첫 화면부터 적용). ThemeProvider 를 함께 쓰면
 *    `@axis-ds/theme` 1.7.0 이상이어야 마운트 때 지워지지 않습니다(1.6.2 이하는 지움).
 * 2. 사용자가 고르게 하려면 `useTheme().setBrand` 로 켜고 끕니다(저장값으로 유지). 끈 상태가 새로고침 뒤에도 유지되는 것은 1.7.0 부터입니다.
 */
export function providerExample(name: string): string {
  return [
    "// 1) 루트 레이아웃(app/layout.tsx)의 <html> 에 붙입니다(첫 화면부터 적용)",
    `//    ThemeProvider 를 함께 쓰면 @axis-ds/theme ${THEME_MARKUP_BRAND_MIN_VERSION} 이상이 필요합니다(그 아래는 마운트 때 속성을 지움)`,
    `<html lang="ko" data-brand="${name}">`,
    "",
    `// 2) 사용자가 고르게 하려면 setBrand 로 켜고 끕니다(저장돼 유지, setBrand(undefined) 로 끈 상태 유지는 ${THEME_MARKUP_BRAND_MIN_VERSION} 이상)`,
    'import { useTheme } from "@axis-ds/theme";',
    "const { setBrand } = useTheme();",
    `setBrand("${name}");`,
  ].join("\n");
}

/**
 * 브랜드를 켜는 코드(`data-brand` · `setBrand` · `defaultBrand`)를 찾는 파일(앞에서부터, WI-0065 D8).
 * 목록은 globals.css 항목과 같이 쓰려고 공유 코어(`ROOT_LAYOUT_FILES`)로 옮겼습니다(WI-0070).
 */
export const BRAND_ACTIVATION_FILES = ROOT_LAYOUT_FILES;

/** 브랜드를 켜는 코드를 찾은 결과(WI-0065 D8) */
export interface BrandActivationLocation {
  /** `data-brand` · `setBrand(` · `defaultBrand=` 가 있는 첫 파일(`baseDir` 기준 상대 경로, `/` 구분) */
  found?: string;
  /** 읽은 루트 레이아웃 후보. 비어 있으면 레이아웃을 찾지 못한 것입니다 */
  layoutFiles: string[];
  /**
   * 켜는 코드가 마크업 `data-brand` 뿐이고(`setBrand(` · `defaultBrand=` 없음) 같은 레이아웃 · providers 파일에 `ThemeProvider` 가
   * 있는지(WI-0068). 이 구성은 `@axis-ds/theme` 1.6.2 이하에서 마운트 때 브랜드가 지워집니다.
   */
  markupWithProvider?: boolean;
}

export interface BrandActivationCheck extends BrandActivationLocation {
  brand: string;
  /** `markupWithProvider` 일 때만: 설치본(없으면 선언) `@axis-ds/theme` 가 1.7.0 이상인지(WI-0068) */
  theme?: PackageVersionGate;
}

/**
 * 브랜드를 실제로 켜는 코드만 셉니다. `ThemeProvider` 단독은 넣지 않습니다: 브랜드 상태가 비어 있으면 마운트 때
 * `data-brand` 를 지우므로, Provider 만 있는 레이아웃은 브랜드가 꺼진 상태입니다(2026-10-25 WI-0064 검토 실측).
 */
const BRAND_ACTIVATION_PATTERN = /data-brand|setBrand\s*\(|defaultBrand\s*=/;

/** Provider 쪽에서 켜는 코드(`setBrand(` · `defaultBrand=`). 마크업만 있는 구성과 가르려고 따로 봅니다(WI-0068) */
const PROVIDER_ACTIVATION_PATTERN = /setBrand\s*\(|defaultBrand\s*=/;

/** `<ThemeProvider` JSX 사용 */
const THEME_PROVIDER_PATTERN = /<ThemeProvider\b/;

/** JS · TS 의 블록 주석과 줄 주석을 지웁니다(`https://` 같은 문자열 안의 `//` 는 앞 글자로 구분해 남김). */
function stripJsLikeComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
}

/**
 * 루트 레이아웃 후보(`BRAND_ACTIVATION_FILES`)에서 브랜드를 켜는 코드를 찾습니다(WI-0065 D7 · D8, 휴리스틱).
 * Provider 를 다른 파일에서 감싸는 구성(예: `app/providers.tsx`)도 있어, 레이아웃이 import 하는 같은 디렉터리의
 * `./providers` · `./provider` 파일을 한 단계만 더 봅니다. 그보다 깊으면 못 찾을 수 있으므로 검사기는 WARN 만 냅니다.
 */
export function findBrandActivation(baseDir: string): BrandActivationLocation {
  const root = resolve(baseDir);
  const layoutFiles: string[] = [];
  for (const candidate of BRAND_ACTIVATION_FILES) {
    const file = join(root, candidate);
    if (!isFile(file)) continue;
    layoutFiles.push(candidate);
    const text = stripJsLikeComments(readFileSync(file, "utf8"));
    // 레이아웃이 import 하는 같은 디렉터리의 ./providers · ./provider 파일(한 단계)
    const providerTexts: Array<{ rel: string; text: string }> = [];
    for (const m of text.matchAll(/from\s+["']\.\/(providers?)["']/g)) {
      for (const ext of [".tsx", ".jsx", ".ts", ".js"]) {
        const rel = `${dirname(candidate)}/${m[1]}${ext}`;
        const p = join(root, rel);
        if (isFile(p)) providerTexts.push({ rel, text: stripJsLikeComments(readFileSync(p, "utf8")) });
      }
    }
    const all = [text, ...providerTexts.map((x) => x.text)];
    // WI-0068: 마크업 data-brand 만 있고 Provider 쪽 켜는 코드가 없으며 ThemeProvider 를 쓰는 구성인지
    const markupWithProvider =
      !all.some((t) => PROVIDER_ACTIVATION_PATTERN.test(t)) && all.some((t) => THEME_PROVIDER_PATTERN.test(t));
    if (BRAND_ACTIVATION_PATTERN.test(text)) {
      return markupWithProvider ? { found: candidate, layoutFiles, markupWithProvider } : { found: candidate, layoutFiles };
    }
    for (const x of providerTexts) {
      if (BRAND_ACTIVATION_PATTERN.test(x.text)) {
        return markupWithProvider ? { found: x.rel, layoutFiles, markupWithProvider } : { found: x.rel, layoutFiles };
      }
    }
  }
  return { layoutFiles };
}

/** `brand` 가 설정된 프로젝트의 활성화 검사(WI-0065 D8). config 가 없거나 `brand` 가 비어 있으면 `null` 입니다 */
export function inspectBrandActivation(baseDir: string): BrandActivationCheck | null {
  const config = readBrandConfig(baseDir);
  const brand = config?.brand;
  if (typeof brand !== "string" || brand.trim() === "") return null;
  const location = findBrandActivation(baseDir);
  if (!location.markupWithProvider) return { brand, ...location };
  // WI-0068: 마크업 + ThemeProvider 구성은 설치본(없으면 선언) theme 버전으로 가릅니다
  // WI-0091: check 경로라 Plug'n'Play 면 루트에만 선언한 theme 를 「앱에서 해석되지 않음」(unresolved)으로 가립니다
  return {
    brand,
    ...location,
    theme: packageVersionGate(baseDir, readProjectPackageJson(baseDir), THEME_PACKAGE, THEME_MARKUP_BRAND_MIN_VERSION, { appOnlyInPnp: true }),
  };
}

/** ThemeProvider 를 담는 패키지 */
export const THEME_PACKAGE = "@axis-ds/theme";

/** 프로젝트 package.json(읽지 못하면 `undefined`) */
function readProjectPackageJson(baseDir: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(readFileSync(join(resolve(baseDir), "package.json"), "utf8"));
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 브랜드 하나의 상세(FR-3 · FR-4). 없는 이름이면 `brand: null` 과 설치된 이름 목록을 돌려줍니다.
 */
export function getBrand(baseDir: string, name: string): BrandGetResult {
  const tokens = resolveTokens(baseDir);
  if (tokens.status !== "ok" || !tokens.indexPath) {
    return { status: tokens.status, version: tokens.version, brand: null, available: [] };
  }
  const entries = readBrandIndex(tokens.indexPath);
  const available = entries.map((e) => e.name);
  const entry = entries.find((e) => e.name === name);
  if (!entry) {
    return { status: "ok", version: tokens.version, brand: null, available };
  }

  let summary: BrandSummary;
  let parsed: BrandTokens;
  try {
    summary = readSummary(baseDir, entry);
    const cssPath = projectRequire(baseDir).resolve(summary.importPath);
    parsed = parseBrandCss(readFileSync(cssPath, "utf8"), name);
  } catch (err) {
    if (isMissingBuildFile(err)) return { status: "not-built", version: tokens.version, brand: null, available: [] };
    throw err;
  }

  return {
    status: "ok",
    version: tokens.version,
    available,
    brand: {
      ...summary,
      tokens: { light: pickKeyTokens(parsed.light), dark: pickKeyTokens(parsed.dark) },
      providerExample: providerExample(name),
      adjustments: { a11y: summary.a11y, reference: BRAND_ADJUSTMENT_REFERENCE },
    },
  };
}
