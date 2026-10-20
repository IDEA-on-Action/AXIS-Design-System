/**
 * Tailwind 공유 코어 (WI-0042)
 *
 * 원본은 `packages/axis-cli/src/template/tailwind-core.ts` 이고, `packages/axis-mcp/src/tools/tailwind-core.ts` 에
 * 바이트 단위로 같은 사본을 둡니다. 사본 동일성은 MCP 테스트가 막습니다(brand-core 와 같은 방식).
 * 두 패키지에서 똑같이 컴파일되도록 Node 내장 모듈만 씁니다.
 *
 * - Tailwind major 판정(`detectTailwind` 등): WI-0038 에서 `init/init.ts` 에 만든 것을 옮겼습니다. `init.ts` 는 다시 내보냅니다.
 * - `checkTailwindSetup`: `axis check` · MCP `axis.check_project` 의 tailwind.config 항목. Tailwind 4 이상은 설정 파일 없이
 *   CSS(`@import "tailwindcss"`)로 구성하므로 설정 파일 대신 CSS 진입점을 봅니다(2026-10-20 사용자 결정).
 *   WI-0044(FR-4)부터 같은 CSS 에 AXIS 토큰 진입점(`@axis-ds/tokens/css/tailwind4`) import 가 없으면 warn 입니다.
 *   진입점이 없으면 `bg-primary` · `rounded-md` 같은 AXIS 매핑이 만들어지지 않기 때문입니다.
 *   보정 2차(2026-10-20 사용자 결정): 선언된 ui-react · agentic-ui 의 `tailwind.css` import 누락(B1), 진입점이 있는데 남은
 *   create-next-app 기본 정의(B2), 진입점이 있는데 `@axis-ds/tokens` 선언이 1.4.0 조건에 걸림(A4)도 같은 항목의 WARN 입니다.
 *   여럿이면 한 문구에 우선순위 순서로 잇습니다(C, `tailwind4Issues`). Tailwind 3 은 preset 참조도 pass 로 인정합니다(B3).
 *   WARN 끝에는 package.json 의 AXIS 패키지 선언이 1.4.0 미만이면 「1.4.0 이상 필요」, 판정할 수 없으면 「설치된 버전이
 *   1.4.0 이상인지 확인하세요」를 붙입니다(A1, `workspace:` 는 제외).
 * - `checkGlobalsCss`: globals.css 항목(WI-0044 보정). 변수를 직접 정의하지 않아도 tokens CSS import 가 있으면 pass 입니다.
 * - `axisPackagesBelowTailwind4`: `axis init` 의 Tailwind 4 버전 안내와 위 WARN 이 같은 판정을 씁니다.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** `package.json` 의 dependencies 다음 devDependencies 에서 선언 범위를 찾습니다(theme-add 의 `hasDependency` 와 같은 동작). */
function hasDependency(pkg: Record<string, unknown>, name: string): string | undefined {
  for (const field of ["dependencies", "devDependencies"]) {
    const deps = pkg[field];
    if (typeof deps === "object" && deps !== null && name in deps) {
      return String((deps as Record<string, unknown>)[name]);
    }
  }
  return undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Tailwind 버전을 어디서 판정했는지 */
export interface TailwindDetection {
  /** 판정한 major. 판정하지 못하면 없음 */
  major?: number;
  /** `installed`: node_modules 설치본 · `declared`: package.json 선언 범위 · `none`: 판정 불가 */
  source: "installed" | "declared" | "none";
  /** 판정에 쓴 값(설치본 version 이나 선언 범위). 선언은 있으나 판정하지 못한 범위도 담습니다. */
  value?: string;
  /** 설치본으로 판정했는데 설치본 major 가 선언 범위가 허용하는 major 밖일 때 그 선언과 하한 major(F1 (b)) */
  mismatch?: { declared: string; declaredMajor: number };
}

/** 버전 하나(`4` · `4.1` · `4.1.0` · `v4` · `3.4.x` · `4.0.0-beta.1`). 1 · 2 · 3번 그룹이 major · minor · patch 입니다. */
const VERSION = String.raw`v?(\d+)(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?`;

/** 버전 하나의 major · minor · patch. minor · patch 는 없거나 `x` · `*` 일 수 있습니다. */
interface VersionParts {
  major: number;
  minor?: string;
  patch?: string;
}

/**
 * 버전 하나를 나눕니다. `0.0.0-insiders.<hash>` 같은 `0.0.0-*` 은 실제 버전이 아닌 자리표시라
 * 읽지 않습니다(F1 (a)).
 */
function versionParts(token: string): VersionParts | undefined {
  const m = new RegExp(`^${VERSION}$`).exec(token);
  if (!m) return undefined;
  if (/^v?0\.0\.0-/.test(token)) return undefined;
  return { major: Number(m[1]), minor: m[2], patch: m[3] };
}

/** 자리가 없거나 와일드카드(`x` · `X` · `*`)인지 */
const isWild = (part: string | undefined) => part === undefined || /^[xX*]$/.test(part);

/** 선언 범위가 허용하는 Tailwind major 의 구간. `upper` 가 없으면 상한이 없습니다. */
export interface TailwindMajorBounds {
  /** 하한 major(포함) */
  lower: number;
  /** 상한 major(포함). 없으면 상한 없음 */
  upper?: number;
}

/**
 * 비교자 하나가 major 구간에 주는 하한 · 상한입니다(semver 의 부분 버전 규칙).
 * - `>=M...` → 하한 M. `>M` · `>M.x` 는 `>=(M+1).0.0` 이라 하한 M+1, `>M.m` · `>M.m.p` 는 하한 M.
 * - `<=M...` → 상한 M(`<=4` 는 `<5.0.0`, `<=4.1.0` 도 major 4 까지).
 * - `<M` · `<M.x` · `<M.0` · `<M.0.0` → 상한 M-1(`<M.0.0` 이라 M 의 정식 버전은 허용하지 않음),
 *   그 밖의 `<M.m.p` → 상한 M. `<4.0.0-beta` 같은 prerelease 상한도 정식 버전 기준으로 M-1 로 봅니다.
 * - `=M...` → 하한 · 상한 모두 M.
 */
function comparatorBounds(op: string, v: VersionParts): { lower?: number; upper?: number } {
  switch (op) {
    case ">=":
      return { lower: v.major };
    case ">":
      return { lower: isWild(v.minor) ? v.major + 1 : v.major };
    case "<=":
      return { upper: v.major };
    case "<": {
      const zeroOrWild = (part: string | undefined) => isWild(part) || Number(part) === 0;
      return { upper: zeroOrWild(v.minor) && zeroOrWild(v.patch) ? v.major - 1 : v.major };
    }
    default:
      return { lower: v.major, upper: v.major };
  }
}

/**
 * 선언 범위가 허용하는 Tailwind major 의 구간을 읽습니다(prd 1.6, F1 (a) · (b)).
 * 1. 하나의 major 로 정해지는 단순 형태: `4` · `4.1` · `4.1.0` · `^4` · `^4.1.0` · `~3.4` · `=3.4.17` · `v4` · `4.x` · `3.4.0-beta.1`
 *    → 하한 · 상한 모두 그 major.
 * 2. 하이픈 범위 `A - B` → 하한 A 의 major, 상한 B 의 major(B 는 포함).
 * 3. 비교자 집합(`>=3.4 <4` · `>3` · `<5 >=4.1`) → 하한은 하한 비교자 중 가장 높은 것(실제로 걸리는 하한),
 *    상한은 상한 비교자 중 가장 낮은 것. 비교자 하나의 해석은 `comparatorBounds`.
 * 4. 그래도 읽을 수 없으면 `undefined`: 하한이 없음(`<4` · `*`), `||` 로 여러 범위를 고름(`^3 || ^4`, 하한이 하나로
 *    정해지지 않음), 하한이 상한보다 높음(`>=4 <4`), `catalog:` · `workspace:*` · `latest` · `0.0.0-insiders.*` ·
 *    `npm:...` · git · 파일 경로.
 */
export function tailwindMajorBounds(range: string): TailwindMajorBounds | undefined {
  const r = range.trim();
  if (r === "" || r.includes("||")) return undefined;
  const simple = new RegExp(`^(?:\\^|~|=)?\\s*(${VERSION})$`).exec(r);
  if (simple) {
    const v = versionParts(simple[1]);
    return v ? { lower: v.major, upper: v.major } : undefined;
  }
  const hyphen = new RegExp(`^(${VERSION})\\s+-\\s+(${VERSION})$`).exec(r);
  if (hyphen) {
    const tokens = r.split(/\s+-\s+/);
    const a = versionParts(tokens[0]);
    const b = versionParts(tokens[1]);
    return a && b && a.major <= b.major ? { lower: a.major, upper: b.major } : undefined;
  }
  // 비교자 집합: `>=3.4 <4`, `>= 4` 처럼 연산자 뒤 공백도 받습니다.
  const tokens = r.replace(/(>=|<=|>|<|=)\s+/g, "$1").split(/\s+/);
  const lowers: number[] = [];
  const uppers: number[] = [];
  for (const t of tokens) {
    const c = /^(>=|<=|>|<|=)(.+)$/.exec(t);
    if (!c) return undefined;
    const v = versionParts(c[2]);
    if (v === undefined) return undefined;
    const b = comparatorBounds(c[1], v);
    if (b.lower !== undefined) lowers.push(b.lower);
    if (b.upper !== undefined) uppers.push(b.upper);
  }
  if (lowers.length === 0) return undefined;
  const lower = Math.max(...lowers);
  const upper = uppers.length > 0 ? Math.min(...uppers) : undefined;
  if (upper !== undefined && upper < lower) return undefined;
  return upper !== undefined ? { lower, upper } : { lower };
}

/**
 * 선언 범위에서 Tailwind major 를 읽습니다(prd 1.6, F1 (a)). `tailwindMajorBounds` 의 하한입니다.
 * 단순 형태는 그 major, 그렇지 않으면 하한의 major(`>=4` · `>=4.0.0` · `>3` → 4, `>4` → 5, `>=3.4 <4` · `>3.0` → 3,
 * `4 - 4.2` → 4). 읽을 수 없으면 `undefined`.
 */
export function tailwindMajorFromRange(range: string): number | undefined {
  return tailwindMajorBounds(range)?.lower;
}

/** major 가 선언 범위의 major 구간 안인지 */
function majorWithin(major: number, bounds: TailwindMajorBounds): boolean {
  return major >= bounds.lower && (bounds.upper === undefined || major <= bounds.upper);
}

/** 설치본 version(`4.3.3` 같은 정확한 버전)에서 major 를 읽습니다. `0.0.0-*` 은 읽지 않습니다. */
function majorFromVersion(version: unknown): number | undefined {
  if (typeof version !== "string") return undefined;
  const v = version.trim();
  const m = /^v?(\d+)\.\d+\.\d+(?:[-+][0-9A-Za-z.+-]*)?$/.exec(v);
  if (!m || /^v?0\.0\.0-/.test(v)) return undefined;
  return Number(m[1]);
}

/**
 * 프로젝트의 Tailwind major 를 판정합니다(prd 1.6).
 * 1. 설치본 우선: `<baseDir>/node_modules/tailwindcss/package.json` 의 `version`. 실제로 쓰이는 버전이라 선언보다 앞섭니다.
 *    파일이 없거나 읽을 수 없거나 version 이 정확한 버전이 아니면 다음 단계로 갑니다.
 *    선언 범위의 major 구간(`tailwindMajorBounds`)을 읽을 수 있고 설치본 major 가 그 구간 밖이면 `mismatch` 에
 *    담습니다(F1 (b), 경고 줄은 `tailwindWarnings`). `>=3.4` 에 설치본 4.1.0 처럼 범위를 만족하면 다름이 아닙니다.
 * 2. 선언 범위: `package.json` 의 `dependencies` 다음 `devDependencies` 의 `tailwindcss`. `tailwindMajorFromRange` 로 읽습니다.
 * 3. 판정 불가: 둘 다 없거나 읽지 못하면 `source: "none"`(기본값은 `selectUtilsDependencies` 가 정함).
 */
export function detectTailwind(baseDirInput: string, pkg?: Record<string, unknown>): TailwindDetection {
  const baseDir = resolve(baseDirInput);
  const installedFile = join(baseDir, "node_modules", "tailwindcss", "package.json");
  const declared = pkg ? hasDependency(pkg, "tailwindcss") : undefined;
  const bounds = declared !== undefined ? tailwindMajorBounds(declared) : undefined;
  const declaredMajor = bounds?.lower;
  try {
    const installed: unknown = JSON.parse(readFileSync(installedFile, "utf8"));
    const version = isPlainObject(installed) ? installed.version : undefined;
    const major = majorFromVersion(version);
    if (major !== undefined) {
      const found: TailwindDetection = { major, source: "installed", value: String(version) };
      // 설치본 major 가 선언 범위가 허용하는 구간 밖일 때만 다름으로 봅니다(`>=3.4` 에 4.1.0 은 다름이 아님).
      if (declared !== undefined && bounds !== undefined && !majorWithin(major, bounds)) {
        found.mismatch = { declared, declaredMajor: bounds.lower };
      }
      return found;
    }
  } catch {
    // 없음 · 읽을 수 없음: 선언 범위로
  }
  if (declared !== undefined) {
    if (declaredMajor !== undefined) return { major: declaredMajor, source: "declared", value: declared };
    return { source: "none", value: declared };
  }
  return { source: "none" };
}

/** check 항목 하나. CLI · MCP 의 `CheckResult` 와 같은 모양입니다. */
export interface TailwindCheckResult {
  name: "tailwind.config";
  severity: "pass" | "warn" | "fail";
  message: string;
}

/** Tailwind 3 이하에서 찾는 설정 파일(앞에서부터). `.ts` 만 AXIS 토큰 설정을 읽고, 나머지는 존재만 봅니다. */
export const TAILWIND_CONFIG_FILES = [
  "tailwind.config.ts",
  "tailwind.config.js",
  "tailwind.config.mjs",
  "tailwind.config.cjs",
] as const;

/** Tailwind 4 이상에서 `@import "tailwindcss"` 를 찾는 CSS(globals.css 항목과 같은 후보 · 순서) */
export const TAILWIND_CSS_CANDIDATES = [
  "globals.css",
  "app/globals.css",
  "src/app/globals.css",
  "src/globals.css",
  "styles/globals.css",
] as const;

/** `@import "tailwindcss"` · `@import 'tailwindcss' layer(...)` · `@import url("tailwindcss")`. 주석은 미리 지웁니다. */
const TAILWIND_IMPORT = /@import\s+(?:url\(\s*)?["']tailwindcss["']/;

/** CSS 블록 주석을 지웁니다. 주석 안의 import 는 적용되지 않으므로 보지 않습니다. */
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** CSS 에 Tailwind 4 진입 import 가 있는지(블록 주석 안은 보지 않음) */
export function hasTailwindImport(css: string): boolean {
  return TAILWIND_IMPORT.test(stripCssComments(css));
}

/** Tailwind 4 용 AXIS 토큰 진입점(`@axis-ds/tokens` exports 의 `./css/tailwind4`, WI-0044 FR-1) */
export const TOKENS_TAILWIND4_ENTRY = "@axis-ds/tokens/css/tailwind4";

/** 토큰 진입점을 넣는 import 줄. check 의 해결 안내와 init 의 안내에 같이 씁니다. */
export const TOKENS_TAILWIND4_IMPORT_LINE = `@import "${TOKENS_TAILWIND4_ENTRY}";`;

/** `@import "@axis-ds/tokens/css/tailwind4"` · 작은따옴표 · `url()` · 뒤의 `layer(...)` 를 받습니다. */
const TOKENS_TAILWIND4_IMPORT = /@import\s+(?:url\(\s*)?["']@axis-ds\/tokens\/css\/tailwind4["']/;

/** CSS 에 AXIS 토큰 진입점 import 가 있는지(블록 주석 안은 보지 않음) */
export function hasTokensTailwind4Import(css: string): boolean {
  return TOKENS_TAILWIND4_IMPORT.test(stripCssComments(css));
}

/**
 * AXIS 변수(`--background` · `--primary` 등)를 정의하는 tokens CSS 의 import(WI-0044 보정, globals.css 항목).
 * `@axis-ds/tokens/css` · `css/shadcn` · `css/tailwind4` 만 받고, 작은따옴표 · `url()` · 뒤의 `layer(...)` 를 받습니다.
 * 닫는 따옴표까지 맞추므로 `css/brands/ontology` · `tailwind`(Tailwind 3 preset)는 걸리지 않습니다.
 */
const TOKENS_CSS_IMPORT = /@import\s+(?:url\(\s*)?["'](@axis-ds\/tokens\/css(?:\/shadcn|\/tailwind4)?)["']/;

/** CSS 에서 AXIS 변수를 정의하는 tokens CSS import 를 찾아 그 경로를 돌려줍니다(블록 주석 안은 보지 않음). */
export function findTokensCssImport(css: string): string | undefined {
  return TOKENS_CSS_IMPORT.exec(stripCssComments(css))?.[1];
}

/** globals.css 항목. CLI · MCP 의 `CheckResult` 와 같은 모양입니다. */
export interface GlobalsCssCheckResult {
  name: "globals.css";
  severity: "pass" | "warn" | "fail";
  message: string;
}

/**
 * globals.css 항목을 판정합니다(`axis check` · MCP `axis.check_project` 공용, WI-0044 보정).
 * 후보(`TAILWIND_CSS_CANDIDATES`)에서 처음 찾은 파일 하나를 봅니다.
 * 1. 변수를 직접 정의(`--background` 와 `--primary` 문자열이 모두 있음) → 종전 pass 문구.
 * 2. 그렇지 않고 tokens CSS import(`findTokensCssImport`)가 있으면 pass. import 로 인정했다는 것을 문구에 남깁니다.
 *    tokens CSS 가 변수를 정의하므로 import 만 있는 Tailwind 4 진입점 구성이 warn 으로 오탐되던 것을 막습니다.
 * 3. 둘 다 없으면 warn, 후보가 하나도 없으면 fail(종전과 같음).
 */
export function checkGlobalsCss(baseDirInput: string): GlobalsCssCheckResult {
  const baseDir = resolve(baseDirInput);
  for (const candidate of TAILWIND_CSS_CANDIDATES) {
    const file = join(baseDir, candidate);
    if (!existsSync(file)) continue;
    const content = readFileSync(file, "utf8");
    if (content.includes("--background") && content.includes("--primary")) {
      return { name: "globals.css", severity: "pass", message: `${candidate}에 AXIS CSS 변수가 정의되어 있습니다` };
    }
    const imported = findTokensCssImport(content);
    if (imported !== undefined) {
      return { name: "globals.css", severity: "pass", message: `${candidate}에 AXIS CSS 변수가 있습니다 (${imported} import)` };
    }
    return { name: "globals.css", severity: "warn", message: `${candidate}에 AXIS CSS 변수가 없습니다` };
  }
  return { name: "globals.css", severity: "fail", message: "globals.css 파일을 찾을 수 없습니다" };
}

/** Tailwind 4 진입점(토큰 `css/tailwind4` · 컴포넌트 `tailwind.css`)이 처음 들어가는 AXIS 버전(WI-0044 D1, linked minor) */
export const TAILWIND4_MIN_AXIS_VERSION = "1.4.0";

/** Tailwind 4 연동에 1.4.0 이상이 필요한 AXIS 패키지 */
export const TAILWIND4_AXIS_PACKAGES = ["@axis-ds/tokens", "@axis-ds/ui-react", "@axis-ds/agentic-ui"] as const;

/** 범위의 하한 버전. `pre` 는 하한이 prerelease(같은 core 의 정식 버전보다 낮음)인지입니다. */
interface LowerVersion {
  core: [number, number, number];
  pre: boolean;
}

/** 버전 하나를 하한 버전으로 읽습니다. 빠지거나 와일드카드인 자리는 0 입니다. `0.0.0-*` 은 읽지 않습니다. */
function lowerOf(token: string): LowerVersion | undefined {
  const v = versionParts(token);
  if (!v) return undefined;
  const num = (part: string | undefined) => (isWild(part) ? 0 : Number(part));
  const pre = /^v?\d+(?:\.(?:\d+|[xX*]))?(?:\.(?:\d+|[xX*]))?-/.test(token);
  return { core: [v.major, num(v.minor), num(v.patch)], pre };
}

/** 하한 버전 비교(a < b 이면 음수). core 가 같으면 prerelease 가 낮습니다. */
function compareLower(a: LowerVersion, b: LowerVersion): number {
  for (let i = 0; i < 3; i++) {
    if (a.core[i] !== b.core[i]) return a.core[i] - b.core[i];
  }
  return Number(b.pre) - Number(a.pre);
}

/**
 * 선언 범위의 하한 버전을 읽습니다(`tailwindMajorBounds` 와 같은 형태만 받음). 읽을 수 없으면 `undefined`(판정 불가).
 * - 단순 형태(`1.3.0` · `^1.3.0` · `~1.4` · `=1.4.0` · `1.x`) → 그 버전(빠진 자리는 0).
 * - 하이픈 범위 `A - B` → A.
 * - 비교자 집합 → 하한 비교자 중 가장 높은 것. `>M` → (M+1).0.0, `>M.m` → M.(m+1).0, `>M.m.p` → M.m.(p+1).
 *   하한 비교자가 없으면(`<2` · `*`) 판정 불가.
 * - `||` · `catalog:` · `workspace:*` · `latest` · `0.0.0-*` · git · 파일 경로 → 판정 불가.
 */
function rangeLowerVersion(range: string): LowerVersion | undefined {
  const r = range.trim();
  if (r === "" || r.includes("||")) return undefined;
  const simple = new RegExp(`^(?:\\^|~|=)?\\s*(${VERSION})$`).exec(r);
  if (simple) return lowerOf(simple[1]);
  if (new RegExp(`^(${VERSION})\\s+-\\s+(${VERSION})$`).test(r)) {
    const [a, b] = r.split(/\s+-\s+/);
    return lowerOf(b) ? lowerOf(a) : undefined;
  }
  const tokens = r.replace(/(>=|<=|>|<|=)\s+/g, "$1").split(/\s+/);
  let lower: LowerVersion | undefined;
  for (const t of tokens) {
    const c = /^(>=|<=|>|<|=)(.+)$/.exec(t);
    if (!c) return undefined;
    const v = versionParts(c[2]);
    const low = lowerOf(c[2]);
    if (!v || !low) return undefined;
    let candidate: LowerVersion | undefined;
    if (c[1] === ">=" || c[1] === "=") candidate = low;
    else if (c[1] === ">") {
      if (isWild(v.minor)) candidate = { core: [v.major + 1, 0, 0], pre: false };
      else if (isWild(v.patch)) candidate = { core: [v.major, Number(v.minor) + 1, 0], pre: false };
      else candidate = { core: [v.major, Number(v.minor), Number(v.patch) + 1], pre: false };
    }
    if (candidate && (!lower || compareLower(candidate, lower) > 0)) lower = candidate;
  }
  return lower;
}

/**
 * 선언 범위의 하한이 `min` 이상인지. 하한을 읽지 못하면 `undefined`(판정 불가)입니다.
 * 예: `^1.3.2` → false, `^1.4.0` · `>=1.4` · `~1.5.0` → true, `^1.4.0-beta.1` → false, `catalog:` → undefined.
 */
export function rangeLowerAtLeast(range: string, min: string): boolean | undefined {
  const lower = rangeLowerVersion(range);
  const target = lowerOf(min);
  if (!lower || !target) return undefined;
  return compareLower(lower, target) >= 0;
}

/** 1.4.0 조건에 걸린 AXIS 패키지 선언. `below`: 하한이 1.4.0 미만 · `unknown`: 하한을 읽을 수 없음(판정 불가) */
export interface AxisPackageVersionIssue {
  name: string;
  range: string;
  status: "below" | "unknown";
}

/**
 * package.json 에 선언된 AXIS 패키지(`TAILWIND4_AXIS_PACKAGES`) 가운데 1.4.0 조건에 걸린 것을 선언 순서대로 돌려줍니다
 * (2026-10-20 사용자 결정 A1, `axis init` · `axis check` 공용).
 * - 하한이 1.4.0 미만(`^1.3.0` · `1.x` · `^1.4.0-beta.1` · `1.3.0 - 1.5.0`) → `below`. 올리라고 안내합니다.
 * - 하한을 읽을 수 없음(`catalog:` · `latest` · `||` · `<2` · `*` · `npm:` · git · 파일 경로) → `unknown`.
 *   선언을 덮어쓰라고 하지 않고 설치된 버전을 확인하라고 안내합니다.
 * - `workspace:` 프로토콜은 넣지 않습니다. 모노레포 링크를 레지스트리 범위로 덮어쓰지 않게 하려는 것입니다.
 * - 선언이 없는 패키지는 넣지 않습니다.
 */
export function axisPackagesBelowTailwind4(pkg: Record<string, unknown> | undefined): AxisPackageVersionIssue[] {
  if (!pkg) return [];
  const out: AxisPackageVersionIssue[] = [];
  for (const name of TAILWIND4_AXIS_PACKAGES) {
    const range = hasDependency(pkg, name);
    if (range === undefined || range.trim().startsWith("workspace:")) continue;
    const atLeast = rangeLowerAtLeast(range, TAILWIND4_MIN_AXIS_VERSION);
    if (atLeast === false) out.push({ name, range, status: "below" });
    else if (atLeast === undefined) out.push({ name, range, status: "unknown" });
  }
  return out;
}

/** `이름 선언` 을 ` · ` 로 잇습니다. */
const declaredList = (issues: AxisPackageVersionIssue[]) => issues.map((i) => `${i.name} ${i.range}`).join(" · ");

/**
 * Tailwind 4 WARN 끝에 붙이는 버전 안내(A1). 대상이 없으면 빈 문자열입니다.
 * `below` 는 ` (1.4.0 이상 필요: ...)`, `unknown` 은 ` (설치된 버전이 1.4.0 이상인지 확인하세요: ...)` 이고 둘 다 있으면 이 순서로 잇습니다.
 */
export function tailwind4VersionNote(issues: AxisPackageVersionIssue[]): string {
  const below = issues.filter((i) => i.status === "below");
  const unknown = issues.filter((i) => i.status === "unknown");
  let note = "";
  if (below.length > 0) note += ` (${TAILWIND4_MIN_AXIS_VERSION} 이상 필요: ${declaredList(below)})`;
  if (unknown.length > 0) note += ` (설치된 버전이 ${TAILWIND4_MIN_AXIS_VERSION} 이상인지 확인하세요: ${declaredList(unknown)})`;
  return note;
}

/** Tailwind 4 진입점(`./tailwind.css`, `@source` 를 담음)을 내는 컴포넌트 패키지(WI-0044 FR-2) */
export const TAILWIND4_COMPONENT_PACKAGES = ["@axis-ds/ui-react", "@axis-ds/agentic-ui"] as const;

/** 컴포넌트 패키지의 `tailwind.css` import 줄 */
export function componentTailwindImportLine(name: string): string {
  return `@import "${name}/tailwind.css";`;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** CSS 에 `<패키지>/tailwind.css` import 가 있는지(블록 주석 안은 보지 않음, 작은따옴표 · `url()` · `layer()` 받음) */
export function hasComponentTailwindImport(css: string, name: string): boolean {
  const re = new RegExp(`@import\\s+(?:url\\(\\s*)?["']${escapeRegExp(name)}/tailwind\\.css["']`);
  return re.test(stripCssComments(css));
}

/**
 * create-next-app 기본 globals.css 의 특징 정의(B2). create-next-app@15.5.28 이 만든 `app/globals.css` 실물에서 골랐고,
 * AXIS 권장 구성(토큰 진입점 + 컴포넌트 tailwind.css)에는 나오지 않는 줄만 씁니다. 블록 주석 안은 보지 않습니다.
 * - `--background` · `--foreground` 를 색값(`#fff` · `rgb()` · `oklch()` 등)으로 정의: AXIS 는 HSL 삼중값(`0 0% 100%`)이라
 *   `hsl(var(--background))` 가 무효가 됩니다.
 * - `--color-background` · `--color-foreground` 를 `var(--background)` · `var(--foreground)` 로 정의: 진입점의 매핑을 덮습니다.
 * - `--font-sans` · `--font-mono` 를 `var(--font-geist-*)` 로 정의: 진입점의 AXIS 글꼴 매핑을 덮습니다.
 * - `background` · `color` 를 `var(--background)` · `var(--foreground)` 로 직접 씀(body): HSL 삼중값이라 무효입니다.
 */
const CREATE_NEXT_APP_DEFAULTS: { label: string; pattern: RegExp }[] = [
  {
    label: ":root 색값 --background",
    pattern: /(?<![\w-])--(?:background|foreground)\s*:\s*(?:#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\()/,
  },
  {
    label: "@theme --color-background: var(--background)",
    pattern: /(?<![\w-])--color-(?:background|foreground)\s*:\s*var\(\s*--(?:background|foreground)\s*\)/,
  },
  {
    label: "@theme --font-mono: var(--font-geist-mono)",
    pattern: /(?<![\w-])--font-(?:sans|mono)\s*:\s*var\(\s*--font-geist-(?:sans|mono)\s*\)/,
  },
  {
    label: "body background: var(--background)",
    pattern: /(?<![\w-])(?:background|background-color|color)\s*:\s*var\(\s*--(?:background|foreground)\s*\)/,
  },
];

/** CSS 에 남은 create-next-app 기본 정의의 표시 이름(정해진 순서). 없으면 빈 배열입니다. */
export function findCreateNextAppDefaults(css: string): string[] {
  const body = stripCssComments(css);
  return CREATE_NEXT_APP_DEFAULTS.filter((d) => d.pattern.test(body)).map((d) => d.label);
}

/**
 * JS · TS 소스의 `//` · `/* *\/` 주석을 지웁니다. 문자열(`'` · `"` · 템플릿 리터럴) 안의 `//` 는 남깁니다.
 * 정규식 리터럴은 구분하지 않습니다(tailwind.config 에서는 드물고, 틀려도 preset 참조를 못 보는 쪽입니다).
 */
function stripJsComments(src: string): string {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < n && src[j] !== c) {
        if (src[j] === "\\") j++;
        else if (c !== "`" && src[j] === "\n") break;
        j++;
      }
      out += src.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (c === "/" && d === "/") {
      const end = src.indexOf("\n", i);
      i = end === -1 ? n : end;
      continue;
    }
    if (c === "/" && d === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
      out += " ";
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Tailwind 3 preset 경로(`@axis-ds/tokens` exports 의 `./tailwind`) */
export const TOKENS_TAILWIND3_PRESET = "@axis-ds/tokens/tailwind";

/** `require("…")` · `import("…")` · `from "…"` · `import "…"`(큰 · 작은따옴표). 닫는 따옴표까지 맞춰 `tailwind4` 등은 걸리지 않습니다. */
const PRESET_REFERENCE = /(?:\brequire\s*\(\s*|\bimport\s*\(\s*|\bfrom\s*|\bimport\s+)(["'])@axis-ds\/tokens\/tailwind\1/;

/** tailwind.config 소스에 AXIS Tailwind 3 preset 참조가 있는지(주석 안은 보지 않음, B3) */
export function hasTokensPresetReference(source: string): boolean {
  return PRESET_REFERENCE.test(stripJsComments(source));
}

/** preset 참조로 인정한 pass 의 문구 뒷부분(B3). 앞에 설정 파일 이름이 붙습니다. */
const PRESET_PASS_SUFFIX = `에 AXIS 토큰이 설정되어 있습니다 (${TOKENS_TAILWIND3_PRESET} preset)`;

function readPackageJson(baseDir: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(readFileSync(join(baseDir, "package.json"), "utf8"));
    return isPlainObject(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Tailwind 4 CSS 에서 AXIS 연동 문제를 우선순위 순서로 모읍니다(C). `@import "tailwindcss"` 가 있는 CSS 에만 씁니다.
 * 1. 토큰 진입점 import 없음(FR-4) → 넣을 import 줄
 * 2. package.json 에 선언된 ui-react · agentic-ui 의 `tailwind.css` import 없음(B1) → 빠진 import 줄(선언 순서)
 * 3. 진입점이 있는데 create-next-app 기본 정의가 남음(B2) → 남은 정의의 표시 이름
 * 4. 진입점이 있는데 `@axis-ds/tokens` 선언이 1.4.0 조건에 걸림(A4, A1 규칙) → 버전 확인
 * 버전 안내(`tailwind4VersionNote`)는 문제 목록이 아니라 WARN 문구 끝에 한 번 붙습니다.
 */
function tailwind4Issues(css: string, pkg: Record<string, unknown> | undefined, versions: AxisPackageVersionIssue[]): string[] {
  const issues: string[] = [];
  const hasEntry = hasTokensTailwind4Import(css);
  if (!hasEntry) issues.push(`AXIS 토큰 진입점이 없습니다 → ${TOKENS_TAILWIND4_IMPORT_LINE}`);
  const missing = TAILWIND4_COMPONENT_PACKAGES.filter(
    (name) => pkg !== undefined && hasDependency(pkg, name) !== undefined && !hasComponentTailwindImport(css, name)
  );
  if (missing.length > 0) {
    issues.push(`컴포넌트 스캔 경로(tailwind.css)가 없습니다 → ${missing.map(componentTailwindImportLine).join(" ")}`);
  }
  if (hasEntry) {
    const defaults = findCreateNextAppDefaults(css);
    if (defaults.length > 0) issues.push(`create-next-app 기본 정의가 남아 있습니다(${defaults.join(" · ")}) → 지우세요`);
    if (versions.some((v) => v.name === TAILWIND4_AXIS_PACKAGES[0])) {
      issues.push(`AXIS 토큰 진입점이 있지만 ${TAILWIND4_AXIS_PACKAGES[0]} 버전 확인이 필요합니다`);
    }
  }
  return issues;
}

/**
 * tailwind.config 항목을 판정합니다.
 * - Tailwind major 4 이상(`detectTailwind`): 설정 파일을 보지 않고 CSS 후보에서 처음 찾은 파일의 `@import "tailwindcss"` 를
 *   봅니다. 없거나 CSS 를 찾지 못하면 warn(CSS 가 없을 때의 fail 은 globals.css 항목이 냅니다, 문구는 종전과 같음).
 *   있으면 같은 파일에서 `tailwind4Issues` 를 모아 하나도 없을 때만 pass 입니다. 여럿이면 한 항목 안에서 우선순위 순서로
 *   ` / ` 로 잇고, 끝에 버전 안내(A1)를 한 번 붙입니다(C). 문제가 하나면 그 문구만 나옵니다.
 * - 3 이하 · 판정 불가: 종전 규칙. `.ts` 는 AXIS 토큰 설정 여부(pass · warn), `.js` · `.mjs` · `.cjs` 는 warn(TypeScript 권장),
 *   없으면 fail. 여기에 B3: 설정 파일에 `@axis-ds/tokens/tailwind` preset 참조(require · import, 주석 제외)가 있으면
 *   `(@axis-ds/tokens/tailwind preset)` 을 붙인 pass 입니다. `.ts` 가 종전 기준(`--background` · `hsl(var(`)으로 pass 면
 *   종전 문구 그대로입니다.
 */
export function checkTailwindSetup(baseDirInput: string): TailwindCheckResult {
  const baseDir = resolve(baseDirInput);
  const pkg = readPackageJson(baseDir);
  const tailwind = detectTailwind(baseDir, pkg);
  if (tailwind.major !== undefined && tailwind.major >= 4) {
    const label = `Tailwind ${tailwind.major}`;
    for (const candidate of TAILWIND_CSS_CANDIDATES) {
      const file = join(baseDir, candidate);
      if (!existsSync(file)) continue;
      const css = readFileSync(file, "utf8");
      if (!hasTailwindImport(css)) {
        return {
          name: "tailwind.config",
          severity: "warn",
          message: `${label}: ${candidate}에 @import "tailwindcss" 가 없습니다`,
        };
      }
      const versions = axisPackagesBelowTailwind4(pkg);
      const issues = tailwind4Issues(css, pkg, versions);
      if (issues.length > 0) {
        return {
          name: "tailwind.config",
          severity: "warn",
          message: `${label}: ${candidate}에 ${issues.join(" / ")}${tailwind4VersionNote(versions)}`,
        };
      }
      return {
        name: "tailwind.config",
        severity: "pass",
        message: `${label}: ${candidate}에 @import "tailwindcss" 와 AXIS 토큰 진입점이 있습니다`,
      };
    }
    return {
      name: "tailwind.config",
      severity: "warn",
      message: `${label}: @import "tailwindcss" 를 확인할 CSS 파일을 찾지 못했습니다`,
    };
  }

  const [tsFile, ...otherFiles] = TAILWIND_CONFIG_FILES;
  const tsPath = join(baseDir, tsFile);
  if (existsSync(tsPath)) {
    const content = readFileSync(tsPath, "utf8");
    const hasTokens = content.includes("--background") || content.includes("hsl(var(");
    if (hasTokens) {
      return { name: "tailwind.config", severity: "pass", message: "tailwind.config.ts에 AXIS 토큰이 설정되어 있습니다" };
    }
    if (hasTokensPresetReference(content)) {
      return { name: "tailwind.config", severity: "pass", message: `tailwind.config.ts${PRESET_PASS_SUFFIX}` };
    }
    return { name: "tailwind.config", severity: "warn", message: "tailwind.config.ts에 AXIS 토큰 설정이 없습니다" };
  }
  for (const file of otherFiles) {
    const path = join(baseDir, file);
    if (existsSync(path)) {
      if (hasTokensPresetReference(readFileSync(path, "utf8"))) {
        return { name: "tailwind.config", severity: "pass", message: `${file}${PRESET_PASS_SUFFIX}` };
      }
      return { name: "tailwind.config", severity: "warn", message: `${file} 존재 (TypeScript 권장)` };
    }
  }
  return { name: "tailwind.config", severity: "fail", message: "tailwind.config 파일이 없습니다" };
}
