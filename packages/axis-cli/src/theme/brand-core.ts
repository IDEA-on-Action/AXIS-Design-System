/**
 * 브랜드 공유 코어 (WI-0028 plan 4.1)
 *
 * 원본은 `packages/axis-cli/src/theme/brand-core.ts` 이고, `packages/axis-mcp/src/tools/brand-core.ts` 에
 * 바이트 단위로 같은 사본을 둡니다(U1). 사본 동일성은 MCP 테스트가 막습니다.
 * 두 패키지에서 똑같이 컴파일되도록 Node 내장 모듈만 쓰고, 출력 문자열은 만들지 않고 구조화된 값만 돌려줍니다.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

/** 브랜드를 담는 패키지 이름 */
export const TOKENS_PACKAGE = "@axis-ds/tokens";

/** 브랜드 이름 규칙. `packages/axis-tokens/scripts/brands.mjs` 의 `BRAND_NAME_PATTERN` 과 같은 정규식입니다. */
export const BRAND_NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** 브랜드 산출물(`./brands` exports)이 처음 들어간 `@axis-ds/tokens` 버전 */
export const MIN_BRAND_TOKENS_VERSION = "1.3.0";

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

/** `globalCss` 다음으로 보는 후보(PRD FR-2 순서) */
export const GLOBAL_CSS_CANDIDATES = ["app/globals.css", "src/app/globals.css", "globals.css"] as const;

function isFile(file: string): boolean {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

/**
 * 브랜드 import 를 넣거나 검사할 CSS 파일을 찾습니다(PRD FR-2 · A1, plan 4.1 U14 (A)).
 * 후보는 `config.globalCss` → `app/globals.css` → `src/app/globals.css` → 루트 `globals.css` 순이고,
 * `globalCss` 는 키가 없을 때와 키가 가리키는 파일이 없을 때 모두 다음 후보로 넘어갑니다.
 * 파일이 없을 때는 `configuredMissing` 에 그 값을 담아 호출한 쪽이 경고하게 합니다.
 */
export function findGlobalCss(baseDir: string, config: BrandConfigLike | null | undefined): GlobalCssLocation {
  const root = resolve(baseDir);
  const result: GlobalCssLocation = {};
  const configured = config?.globalCss;
  if (typeof configured === "string" && configured.trim() !== "") {
    const file = resolve(root, configured);
    if (isFile(file)) return { path: file };
    result.configuredMissing = configured;
  }
  for (const candidate of GLOBAL_CSS_CANDIDATES) {
    const file = join(root, candidate);
    if (isFile(file)) {
      result.path = file;
      break;
    }
  }
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
  return {
    status: "ok",
    version: tokens.version,
    brands: entries.map((entry) => readSummary(baseDir, entry)),
  };
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

/** Provider 설정 예시(FR-3 · FR-4). `defaultBrand` 는 `@axis-ds/theme` 1.3.0 이상에 있습니다. */
export function providerExample(name: string): string {
  return [
    'import { ThemeProvider } from "@axis-ds/theme";',
    "",
    `<ThemeProvider defaultBrand="${name}">{children}</ThemeProvider>`,
  ].join("\n");
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

  const summary = readSummary(baseDir, entry);
  const cssPath = projectRequire(baseDir).resolve(summary.importPath);
  const parsed = parseBrandCss(readFileSync(cssPath, "utf8"), name);

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
