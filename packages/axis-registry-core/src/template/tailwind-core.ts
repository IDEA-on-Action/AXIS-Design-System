/**
 * Tailwind 공유 코어 (WI-0042)
 *
 * 원본은 이 파일 하나입니다(WI-0055 에서 공유 코어 `@axis-ds/registry-core` 로 옮김). `@axis-ds/cli` 는
 * `packages/axis-cli/src/template/tailwind-core.ts` 에서 다시 내보내고, `@axis-ds/mcp` 는 빌드 때 번들합니다. 바이트 사본은 없습니다
 * (cli · mcp 바이트 사본이 남은 것은 `brand-core.ts` 뿐). 두 패키지에서 똑같이 번들되도록 Node 내장 모듈만 씁니다.
 *
 * - Tailwind major 판정(`detectTailwind` 등): WI-0038 에서 `init/init.ts` 에 만든 것을 옮겼습니다. `init.ts` 는 다시 내보냅니다.
 * - `checkTailwindSetup`: `axis check` · MCP `axis.check_project` 의 tailwind.config 항목. Tailwind 4 이상은 설정 파일 없이
 *   CSS(`@import "tailwindcss"`)로 구성하므로 설정 파일 대신 CSS 진입점을 봅니다(2026-10-20 사용자 결정).
 *   WI-0044(FR-4)부터 같은 CSS 에 AXIS 토큰 진입점(`@axis-ds/tokens/css/tailwind4`) import 가 없으면 warn 입니다.
 *   진입점이 없으면 `bg-primary` · `rounded-md` 같은 AXIS 매핑이 만들어지지 않기 때문입니다.
 *   보정 2차(2026-10-20 사용자 결정): 선언된 ui-react · agentic-ui 의 `tailwind.css` import 누락(B1), 진입점이 있는데 남은
 *   create-next-app 기본 정의(B2), 진입점이 있는데 `@axis-ds/tokens` 선언이 1.4.0 조건에 걸림(A4)도 같은 항목의 WARN 입니다.
 *   여럿이면 한 문구에 우선순위 순서로 잇습니다(C, `tailwind4Issues`). Tailwind 3 은 preset 참조도 pass 로 인정합니다(B3).
 *   WARN 끝에는 package.json 에 선언된 AXIS 패키지가 1.4.0 미만이면 「1.4.0 이상 필요」, 판정할 수 없으면 「설치된 버전이
 *   1.4.0 이상인지 확인하세요」를 붙입니다(A1, `workspace:` 는 제외).
 *   보정 3차(2026-10-20 사용자 결정): 버전은 설치본(node_modules) 우선, 다음 선언 하한, 다음 판정 불가 순으로 봅니다. B2 는 실제로
 *   걸린 정의 이름을 표시하고, B1 은 그 패키지를 가리키는 `@source` 가 직접 있으면 내지 않습니다. import 중인 컴포넌트
 *   `tailwind.css` 의 패키지도 A4 와 같은 버전 조건을 봅니다.
 * - `checkGlobalsCss`: globals.css 항목(WI-0044 보정). 변수를 직접 정의하지 않아도 tokens CSS import 가 있으면 pass 입니다.
 * - `axisPackagesBelowTailwind4`: `axis init` 의 Tailwind 4 버전 안내와 위 WARN 이 같은 판정을 씁니다.
 * - 배치 3(WI-0070 · WI-0072): globals.css 는 AXIS 근거(tokens CSS import · `--axis-*` 정의 · 루트 레이아웃의 tokens CSS JS import)가
 *   있을 때만 pass, animation 은 plugins 배열 판독, Tailwind 3 preset 은 CommonJS 형태 + 설치본 tokens 버전으로 판정합니다.
 *   설치본은 `findInstalledPackage`(상위 디렉터리 탐색, project.ts) 하나로 읽습니다.
 * - WI-0074: `detectTailwind` · `axisPackagesBelowTailwind4` 도 같은 `findInstalledPackage` 로 읽습니다(종전에는 `<baseDir>/node_modules`
 *   한 층만 읽어 호이스팅 모노레포에서 설치본을 못 찾고 선언으로 떨어졌습니다. WI-0051 PRD D4 에서 남겼던 것을 해소).
 *   Plug'n'Play(`isPnpProject`)면 설치본을 읽지 않고 선언으로 갑니다(`packageVersionGate` · dependencies 와 같은 규칙).
 *   init · theme add · template apply · axis add 도 같은 함수를 쓰므로 함께 바뀝니다(전이 표는 WI-0074 testplan).
 * - WI-0080: Tailwind 3 content 판정의 패키지 표본 · 제안도 `findInstalledPackage` 로 찾은 설치본 위치(baseDir 기준 상대 경로)를
 *   씁니다(호이스팅이면 `../../node_modules/<pkg>`). 덮음 판정은 `contentGlobCovers`(앞쪽 `../` 개수 비교 · 절대경로 비교)입니다.
 */

import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { ROOT_LAYOUT_FILES, compareExactVersions, findInstalledPackage, isPnpProject } from "../project.js";

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
 * 1. 설치본 우선: `baseDir` 부터 상위로 찾은 첫 `node_modules/tailwindcss/package.json` 의 `version`(`findInstalledPackage`,
 *    WI-0074). 실제로 쓰이는 버전이라 선언보다 앞섭니다. 가장 가까운 설치본에서 멈추므로 앱의 3.x 가 루트의 4.x 보다 앞섭니다.
 *    찾지 못하거나 읽을 수 없거나 version 이 정확한 버전이 아니면 다음 단계로 갑니다. Plug'n'Play(`isPnpProject`)면 설치본을
 *    읽지 않습니다(상위에 남은 node_modules 는 실제로 쓰이는 설치본이 아님).
 *    선언 범위의 major 구간(`tailwindMajorBounds`)을 읽을 수 있고 설치본 major 가 그 구간 밖이면 `mismatch` 에
 *    담습니다(F1 (b), 경고 줄은 `tailwindWarnings`). `>=3.4` 에 설치본 4.1.0 처럼 범위를 만족하면 다름이 아닙니다.
 * 2. 선언 범위: `package.json` 의 `dependencies` 다음 `devDependencies` 의 `tailwindcss`. `tailwindMajorFromRange` 로 읽습니다.
 * 3. 판정 불가: 둘 다 없거나 읽지 못하면 `source: "none"`(기본값은 `selectUtilsDependencies` 가 정함).
 */
export function detectTailwind(baseDirInput: string, pkg?: Record<string, unknown>): TailwindDetection {
  const baseDir = resolve(baseDirInput);
  const declared = pkg ? hasDependency(pkg, "tailwindcss") : undefined;
  const bounds = declared !== undefined ? tailwindMajorBounds(declared) : undefined;
  const declaredMajor = bounds?.lower;
  // 없음 · 읽을 수 없음 · 정확한 버전이 아님 · Plug'n'Play: 선언 범위로
  const version = isPnpProject(baseDir) ? undefined : findInstalledPackage(baseDir, "tailwindcss")?.version;
  const major = majorFromVersion(version);
  if (version !== undefined && major !== undefined) {
    const found: TailwindDetection = { major, source: "installed", value: version };
    // 설치본 major 가 선언 범위가 허용하는 구간 밖일 때만 다름으로 봅니다(`>=3.4` 에 4.1.0 은 다름이 아님).
    if (declared !== undefined && bounds !== undefined && !majorWithin(major, bounds)) {
      found.mismatch = { declared, declaredMajor: bounds.lower };
    }
    return found;
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

/** 루트 레이아웃 JS 의 tokens CSS import(`import "@axis-ds/tokens/css"` · `require(...)`, WI-0070). 주석은 미리 지웁니다. */
const TOKENS_CSS_JS_IMPORT = /(?:\bimport\s+|\bfrom\s+|\brequire\s*\(\s*)(["'])(@axis-ds\/tokens\/css(?:\/shadcn|\/tailwind4)?)\1/;

/** `--axis-*` 사용자 정의 속성 정의(`--axis-color-primary: ...`, WI-0070). 쓰기만(`var(--axis-...)`)은 정의가 아닙니다. */
const AXIS_VARIABLE_DEFINITION = /(?<![\w-])--axis-[\w-]+\s*:/;

/**
 * 루트 레이아웃 후보(`ROOT_LAYOUT_FILES`)에서 tokens CSS 를 JS 로 import 하는 첫 파일과 경로(WI-0070).
 * 가이드(theme-customization 4절 import 순서)가 안내하는 `app/layout.tsx` 의 `import "@axis-ds/tokens/css"` 구성입니다.
 */
export function findLayoutTokensCssImport(baseDirInput: string): { file: string; spec: string } | undefined {
  const baseDir = resolve(baseDirInput);
  for (const candidate of ROOT_LAYOUT_FILES) {
    const file = join(baseDir, candidate);
    if (!existsSync(file)) continue;
    let text: string;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const m = TOKENS_CSS_JS_IMPORT.exec(stripJsComments(text));
    if (m) return { file: candidate, spec: m[2] };
  }
  return undefined;
}

/**
 * globals.css 항목을 판정합니다(`axis check` · MCP `axis.check_project` 공용, WI-0044 보정 · WI-0070).
 * 후보(`TAILWIND_CSS_CANDIDATES`)에서 처음 찾은 파일 하나를 봅니다. pass 는 AXIS 근거가 있을 때만입니다.
 * 1. tokens CSS import(`findTokensCssImport`) → pass(import 로 인정했다는 것을 문구에 남김)
 * 2. `--axis-*` 변수 정의 → pass
 * 3. 루트 레이아웃 JS 의 tokens CSS import(`findLayoutTokensCssImport`) → pass(CSS 에는 근거가 없어도 같은 변수가 들어옴)
 * 4. 자체 `--background` · `--primary` 만 있음 → warn「AXIS 토큰 미사용」. 종전에는 pass 였습니다(거짓 초록, WI-0070).
 *    템플릿 4종(자체 HSL)은 WI-0067 전까지 이 warn 입니다(2026-10-25 사용자 결정, 종료 코드는 그대로).
 * 5. 아무것도 없으면 warn, 후보가 하나도 없으면 fail(종전과 같음).
 * Tailwind 3 이하에서 pass 조건을 채워도 create-next-app 기본 body `font-family: Arial` 이 남아 있으면 warn 입니다
 * (Tailwind 4 는 같은 판정을 tailwind.config 항목 B2 에서 냅니다).
 */
export function checkGlobalsCss(baseDirInput: string): GlobalsCssCheckResult {
  const baseDir = resolve(baseDirInput);
  for (const candidate of TAILWIND_CSS_CANDIDATES) {
    const file = join(baseDir, candidate);
    if (!existsSync(file)) continue;
    const content = readFileSync(file, "utf8");
    const css = stripCssComments(content);
    const imported = findTokensCssImport(content);
    let pass: string | undefined;
    if (imported !== undefined) pass = `${candidate}에 AXIS CSS 변수가 있습니다 (${imported} import)`;
    else if (AXIS_VARIABLE_DEFINITION.test(css)) pass = `${candidate}에 AXIS CSS 변수(--axis-*)가 정의되어 있습니다`;
    else {
      const layout = findLayoutTokensCssImport(baseDir);
      if (layout) pass = `${candidate}에 AXIS CSS 변수가 있습니다 (${layout.file}의 ${layout.spec} import)`;
    }
    if (pass !== undefined) {
      const tailwind = detectTailwind(baseDir, readPackageJson(baseDir));
      const tailwind4 = tailwind.major !== undefined && tailwind.major >= 4;
      if (!tailwind4 && findCreateNextAppDefaults(content).some((d) => d.includes("font-family: Arial"))) {
        return {
          name: "globals.css",
          severity: "warn",
          message: `${pass}. 다만 create-next-app 기본 body font-family: Arial 이 남아 있습니다 → 지우세요(AXIS 글꼴 대신 Arial 이 적용됨)`,
        };
      }
      return { name: "globals.css", severity: "pass", message: pass };
    }
    if (css.includes("--background") && css.includes("--primary")) {
      return {
        name: "globals.css",
        severity: "warn",
        message: `${candidate}에 자체 CSS 변수(--background · --primary)만 있고 AXIS 토큰이 없습니다 → @axis-ds/tokens CSS 를 import 하세요`,
      };
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

/**
 * 1.4.0 조건에 걸린 AXIS 패키지. `below`: 1.4.0 미만 · `unknown`: 판정 불가(설치본이 없고 선언 하한도 읽을 수 없음).
 * `installed` 가 있으면 설치본 version 으로 판정한 것이고(`source: "installed"`), 없으면 선언 하한으로 판정한 것입니다.
 */
export interface AxisPackageVersionIssue {
  name: string;
  /** package.json 의 선언 범위 */
  range: string;
  status: "below" | "unknown";
  /** 판정 근거: `installed`(node_modules 설치본) · `declared`(선언 범위 하한) */
  source: "installed" | "declared";
  /** 설치본 version(`source: "installed"` 일 때만) */
  installed?: string;
}

/**
 * `baseDir` 부터 상위로 찾은 설치본의 정확한 version(`findInstalledPackage`, WI-0074). 찾지 못하거나 읽지 못하거나 정확한 버전이
 * 아니면(`exactVersionOf`, `0.0.0-*` 제외) `undefined`. Plug'n'Play 면 읽지 않습니다(`packageVersionGate` 와 같은 규칙).
 */
function installedAxisVersion(baseDir: string, name: string): string | undefined {
  if (isPnpProject(baseDir)) return undefined;
  return findInstalledPackage(baseDir, name)?.version;
}

/**
 * package.json 에 선언된 AXIS 패키지(`TAILWIND4_AXIS_PACKAGES`) 가운데 1.4.0 조건에 걸린 것을 선언 순서대로 돌려줍니다
 * (2026-10-20 사용자 결정 A1, 보정 3차 설치본 우선. `axis init` · `axis check` 가 같은 결과를 씁니다).
 * 판정 순서는 `detectTailwind` 와 같습니다.
 * 1. 설치본: `baseDir` 가 있으면 `baseDir` 부터 상위로 찾은 첫 `node_modules/<pkg>/package.json` 의 version(정확한 버전일 때만,
 *    WI-0074 상위 탐색 · Plug'n'Play 는 읽지 않음).
 *    1.4.0 이상이면 선언이 `^1.3.0` · `1.x` · `catalog:` 여도 넣지 않고, 미만(`1.4.0-beta.1` 포함)이면 `below`(설치본 표시).
 * 2. 선언 하한: 설치본이 없으면(또는 `baseDir` 가 없으면) 종전 규칙.
 *    하한이 1.4.0 미만(`^1.3.0` · `1.x` · `^1.4.0-beta.1` · `1.3.0 - 1.5.0`) → `below`. 올리라고 안내합니다.
 * 3. 판정 불가: 하한도 읽을 수 없음(`catalog:` · `latest` · `||` · `<2` · `*` · `npm:` · git · 파일 경로) → `unknown`.
 *    선언을 덮어쓰라고 하지 않고 설치된 버전을 확인하라고 안내합니다.
 * - `workspace:` 프로토콜은 설치본과 관계없이 넣지 않습니다. 모노레포 링크를 레지스트리 범위로 덮어쓰지 않게 하려는 것이고,
 *   링크된 설치본의 version 은 배포 전 소스의 version 이라(예: 이 저장소는 changeset 적용 전까지 진입점이 있어도 1.3.0)
 *   1.4.0 미만이어도 진입점이 없다는 증거가 아니기 때문입니다.
 * - 선언이 없는 패키지는 설치본이 있어도 넣지 않습니다(다른 패키지가 끌어온 의존성은 안내 대상이 아님, 종전과 같음).
 */
export function axisPackagesBelowTailwind4(
  pkg: Record<string, unknown> | undefined,
  baseDirInput?: string
): AxisPackageVersionIssue[] {
  if (!pkg) return [];
  const baseDir = baseDirInput !== undefined ? resolve(baseDirInput) : undefined;
  const out: AxisPackageVersionIssue[] = [];
  const min = lowerOf(TAILWIND4_MIN_AXIS_VERSION)!;
  for (const name of TAILWIND4_AXIS_PACKAGES) {
    const range = hasDependency(pkg, name);
    if (range === undefined || range.trim().startsWith("workspace:")) continue;
    const installed = baseDir !== undefined ? installedAxisVersion(baseDir, name) : undefined;
    const installedLower = installed !== undefined ? lowerOf(installed) : undefined;
    if (installed !== undefined && installedLower !== undefined) {
      if (compareLower(installedLower, min) < 0) out.push({ name, range, status: "below", source: "installed", installed });
      continue;
    }
    const atLeast = rangeLowerAtLeast(range, TAILWIND4_MIN_AXIS_VERSION);
    if (atLeast === false) out.push({ name, range, status: "below", source: "declared" });
    else if (atLeast === undefined) out.push({ name, range, status: "unknown", source: "declared" });
  }
  return out;
}

/** 버전 안내에 쓰는 패키지 표시: 선언으로 판정하면 `이름 선언`, 설치본으로 판정하면 `이름 설치본 <version>` 입니다. */
export function axisPackageVersionLabel(issue: AxisPackageVersionIssue): string {
  return issue.source === "installed" ? `${issue.name} 설치본 ${issue.installed}` : `${issue.name} ${issue.range}`;
}

/** 표시를 ` · ` 로 잇습니다. */
const declaredList = (issues: AxisPackageVersionIssue[]) => issues.map(axisPackageVersionLabel).join(" · ");

/**
 * Tailwind 4 WARN 끝에 붙이는 버전 안내(A1). 대상이 없으면 빈 문자열입니다.
 * `below` 는 ` (1.4.0 이상 필요: ...)`, `unknown` 은 ` (설치된 버전이 1.4.0 이상인지 확인하세요: ...)` 이고 둘 다 있으면 이 순서로 잇습니다.
 * 패키지 표시는 `axisPackageVersionLabel`(설치본으로 판정했으면 `이름 설치본 <version>`)입니다.
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
 * CSS 에 그 패키지를 가리키는 `@source` 가 직접 있는지(보정 3차, 2026-10-20 사용자 결정). 블록 주석 안은 보지 않습니다.
 * - `@source "<경로>"` · `@source '<경로>'` 의 경로 문자열에 `@axis-ds/<pkg>` 가 들어 있으면 그 패키지를 가리킨다고 봅니다
 *   (`../node_modules/@axis-ds/ui-react` · `../node_modules/@axis-ds/ui-react/dist` · 다른 상대 경로 모두).
 *   이름 바로 뒤는 경로 끝 · `/` · `\` 여야 합니다(`@axis-ds/ui-react-extra` 는 다른 패키지라 인정하지 않음).
 * - `@source not "..."`(스캔 제외) · `@source inline(...)` 은 스캔 경로가 아니라 인정하지 않습니다.
 * - 경로가 `@axis-ds/` 로 시작하는 패키지 이름 그대로(`@source "@axis-ds/ui-react"`)는 인정하지 않습니다. `@source` 는
 *   CSS 파일 기준 상대 경로라 이 표기는 node_modules 를 가리키지 않습니다(PRD V2 와 같은 상태를 PASS 로 놓치지 않게).
 * - 경로가 실제로 있는지는 보지 않습니다(문자열 판정).
 */
export function hasComponentSource(css: string, name: string): boolean {
  const re = new RegExp(`@source\\s+(["'])(?!@axis-ds/)[^"'\\n]*${escapeRegExp(name)}(?:[/\\\\][^"'\\n]*)?\\1`);
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
 * 표시 이름(보정 3차, 2026-10-20 사용자 결정)은 특징마다 `prefix` 뒤에 실제로 걸린 정의를 CSS 에 나온 순서로, 중복 없이
 * `, ` 로 잇습니다. `item` 이 매치에서 정의를 공백 없이 다시 씁니다(`--font-sans:var(...)` 도 `--font-sans: var(...)` 로 표시).
 * 예: `--font-sans` 만 남았으면 `@theme --font-sans: var(--font-geist-sans)` 이고 `--font-mono` 는 말하지 않습니다.
 */
const CREATE_NEXT_APP_DEFAULTS: { prefix: string; pattern: RegExp; item: (m: RegExpMatchArray) => string }[] = [
  {
    prefix: ":root 색값",
    pattern: /(?<![\w-])(--(?:background|foreground))\s*:\s*(?:#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\()/g,
    item: (m) => m[1],
  },
  {
    prefix: "@theme",
    pattern: /(?<![\w-])(--color-(?:background|foreground))\s*:\s*var\(\s*(--(?:background|foreground))\s*\)/g,
    item: (m) => `${m[1]}: var(${m[2]})`,
  },
  {
    prefix: "@theme",
    pattern: /(?<![\w-])(--font-(?:sans|mono))\s*:\s*var\(\s*(--font-geist-(?:sans|mono))\s*\)/g,
    item: (m) => `${m[1]}: var(${m[2]})`,
  },
  {
    prefix: "body",
    // WI-0070: create-next-app 의 body `font-family: Arial, Helvetica, sans-serif` 도 같은 특징으로 봅니다. 레이어 밖 규칙이라
    // AXIS 글꼴(Pretendard, html 에 적용)을 이기고 Button 등이 `font-family: inherit` 로 Arial 을 물려받습니다.
    pattern: /(?<![\w-])(?:(background|background-color|color)\s*:\s*var\(\s*(--(?:background|foreground))\s*\)|font-family\s*:\s*Arial\b)/g,
    item: (m) => (m[1] !== undefined ? `${m[1]}: var(${m[2]})` : "font-family: Arial"),
  },
];

/**
 * CSS 에 남은 create-next-app 기본 정의의 표시 이름(특징 순서, 특징 하나에 한 이름). 없으면 빈 배열입니다.
 * 각 이름은 그 특징의 `prefix` 와 걸린 정의(나온 순서 · 중복 없음)입니다.
 */
export function findCreateNextAppDefaults(css: string): string[] {
  const body = stripCssComments(css);
  const labels: string[] = [];
  for (const d of CREATE_NEXT_APP_DEFAULTS) {
    const items: string[] = [];
    for (const m of body.matchAll(d.pattern)) {
      const item = d.item(m);
      if (!items.includes(item)) items.push(item);
    }
    if (items.length > 0) labels.push(`${d.prefix} ${items.join(", ")}`);
  }
  return labels;
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

/**
 * CommonJS 의 `require("@axis-ds/tokens/tailwind")` 가 preset 자체를 돌려주는 첫 `@axis-ds/tokens` 버전(WI-0072).
 * 근거는 버전 예측이 아니라 이번 변경의 bump 종류입니다: theme changeset 이 minor 라 linked 4패키지(tokens 포함)가
 * 현재 최고 버전 1.6.x 에서 1.7.0 으로 함께 오릅니다(changesets linked 규칙). Release PR 의 version-packages 결과와 대조합니다.
 */
export const TOKENS_CJS_PRESET_FIXED_VERSION = "1.7.0";

/** CommonJS 로 preset 을 받는 안내 형태(모든 버전에서 동작, WI-0072). ESM · TS 는 `import axisPreset from` 입니다. */
export const TOKENS_TAILWIND3_CJS_REQUIRE = `require("${TOKENS_TAILWIND3_PRESET}").default`;

/** `@axis-ds/tokens/tailwind` 를 받는 require 호출(WI-0072) */
const PRESET_REQUIRE_CALL = /\brequire\s*\(\s*(["'])@axis-ds\/tokens\/tailwind\1\s*\)/g;
/** 바로 뒤에 `.default` · `["default"]` 가 붙는지(문자열 맨 앞에서 봄) */
const DEFAULT_ACCESS_AHEAD = /^\s*(?:\.\s*default\b|\[\s*["']default["']\s*\])/;

/**
 * `.default` 없이 preset 을 쓰는 bare require 가 있는지(WI-0072). 주석은 미리 지운 소스를 받습니다.
 * - `require(X).default` · `require(X)["default"]` 는 bare 가 아닙니다
 * - 구조분해(`const { default: preset } = require(X)`)는 bare 가 아닙니다. 이름 내보내기만 받는 구조분해도 preset 자체를 쓰지 않아 넣지 않습니다
 * - 변수에 받으면(`const preset = require(X)`) 그 식별자를 `.default` 없이 쓰는 곳이 하나라도 있을 때만 bare 입니다
 * - 그 밖(`presets: [require(X)]` 등)은 bare 입니다
 */
export function hasBareCjsPresetRequire(code: string): boolean {
  for (const m of code.matchAll(PRESET_REQUIRE_CALL)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    if (DEFAULT_ACCESS_AHEAD.test(code.slice(end))) continue;
    const before = code.slice(0, start);
    if (/\b(?:const|let|var)\s*\{[^{}]*\}\s*=\s*$/.test(before)) continue;
    const bound = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*$/.exec(before);
    if (!bound) return true;
    const ident = escapeRegExp(bound[1]);
    const rest = code.slice(0, bound.index) + code.slice(end);
    const bareUse = new RegExp(`(?<![\\w$.])${ident}(?![\\w$])(?!\\s*(?:\\.\\s*default\\b|\\[\\s*["']default["']\\s*\\]))`);
    if (bareUse.test(rest)) return true;
  }
  return false;
}

/**
 * 설정 파일이 CommonJS 형태인지(WI-0072). `.cjs` 이거나 소스에 `module.exports` 가 있으면 CommonJS 입니다.
 * `.ts` · `.mjs` 의 `export default { presets: [require(...)] }` 는 Tailwind 의 jiti interop 이 `.default` 를 꺼내 줘서
 * 1.6.2 이하에서도 preset 이 들어옵니다(실측). 그래서 이 형태는 넣지 않습니다.
 */
function isCommonJsConfig(file: string, source: string): boolean {
  return extname(file) === ".cjs" || /\bmodule\.exports\b/.test(source);
}

/** 패키지 버전 조건 판정 결과(설치본 우선, 다음 선언 하한, 다음 판정 불가) */
export interface PackageVersionGate {
  status: "ok" | "below" | "unknown";
  /** 판정 근거 */
  source: "installed" | "declared" | "none";
  /** 설치본 version 또는 선언 범위 */
  value?: string;
}

/**
 * 프로젝트의 `<name>` 이 `min` 이상인지 봅니다(WI-0068 · WI-0072 공용). 설치본은 `findInstalledPackage`(상위 탐색)로 읽습니다.
 * 1. 설치본 version 이 있으면 그것으로 판정 2. 없으면 package.json 선언 하한(`rangeLowerAtLeast`) 3. 둘 다 없으면 `unknown`.
 * Plug'n'Play 는 설치본을 읽지 않고 선언으로 갑니다.
 */
export function packageVersionGate(
  baseDirInput: string,
  pkg: Record<string, unknown> | undefined,
  name: string,
  min: string
): PackageVersionGate {
  const baseDir = resolve(baseDirInput);
  if (!isPnpProject(baseDir)) {
    const installed = findInstalledPackage(baseDir, name)?.version;
    if (installed !== undefined) {
      const cmp = compareExactVersions(installed, min);
      if (cmp !== undefined) return { status: cmp >= 0 ? "ok" : "below", source: "installed", value: installed };
    }
  }
  const declared = pkg ? hasDependency(pkg, name) : undefined;
  if (declared !== undefined) {
    const atLeast = rangeLowerAtLeast(declared, min);
    if (atLeast !== undefined) return { status: atLeast ? "ok" : "below", source: "declared", value: declared };
    return { status: "unknown", source: "declared", value: declared };
  }
  return { status: "unknown", source: "none" };
}

/** 판정 근거 표시(`설치본 1.6.2` · `선언 ^1.6.0` · `설치본 · 선언 없음`) */
export function versionGateLabel(gate: PackageVersionGate): string {
  if (gate.source === "installed") return `설치본 ${gate.value}`;
  if (gate.source === "declared") return `선언 ${gate.value}`;
  return "설치본 · 선언 없음";
}

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
 * 2. package.json 에 선언된 ui-react · agentic-ui 의 `tailwind.css` import 없음(B1) → 빠진 import 줄(선언 순서).
 *    그 패키지를 가리키는 `@source` 가 같은 CSS 에 직접 있으면(`hasComponentSource`, 보정 3차) 스캔 경로가 있으므로 빼지 않습니다.
 * 3. 진입점이 있는데 create-next-app 기본 정의가 남음(B2) → 남은 정의의 표시 이름
 * 4. 진입점이 있는데 `@axis-ds/tokens` 가 1.4.0 조건에 걸림(A4, A1 규칙) → 버전 확인
 * 5. `<pkg>/tailwind.css` 를 import 하는데 그 패키지가 1.4.0 조건에 걸림(보정 3차, A4 와 같은 규칙) → 버전 확인.
 *    `tailwind.css` 는 1.4.0 부터 있으므로 init 이 세 패키지를 모두 안내하는 것과 대칭입니다. 직접 `@source` 로 스캔하면
 *    `tailwind.css` 가 필요 없으므로 이 항목을 만들지 않습니다(버전 안내는 다른 문제가 있을 때 끝에 붙음).
 * 버전 안내(`tailwind4VersionNote`)는 문제 목록이 아니라 WARN 문구 끝에 한 번 붙습니다.
 */
function tailwind4Issues(css: string, pkg: Record<string, unknown> | undefined, versions: AxisPackageVersionIssue[]): string[] {
  const issues: string[] = [];
  const hasEntry = hasTokensTailwind4Import(css);
  if (!hasEntry) issues.push(`AXIS 토큰 진입점이 없습니다 → ${TOKENS_TAILWIND4_IMPORT_LINE}`);
  const missing = TAILWIND4_COMPONENT_PACKAGES.filter(
    (name) =>
      pkg !== undefined &&
      hasDependency(pkg, name) !== undefined &&
      !hasComponentTailwindImport(css, name) &&
      !hasComponentSource(css, name)
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
  for (const name of TAILWIND4_COMPONENT_PACKAGES) {
    if (hasComponentTailwindImport(css, name) && versions.some((v) => v.name === name)) {
      issues.push(`${name}/tailwind.css import 가 있지만 ${name} 버전 확인이 필요합니다`);
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
      const versions = axisPackagesBelowTailwind4(pkg, baseDir);
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

  // WI-0065 D8: Tailwind 3 은 AXIS preset 참조가 있을 때만 pass 입니다. 종전에는 `--background` · `hsl(var(` 문자열만 있어도
  // pass 여서 AXIS 참조가 0 인 shadcn 류 · 템플릿 자체 매핑도 「AXIS 토큰이 설정」으로 나왔습니다(거짓 초록). 이제 WARN 입니다.
  for (const file of TAILWIND_CONFIG_FILES) {
    const path = join(baseDir, file);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8");
    if (hasTokensPresetReference(content)) {
      // WI-0072: CommonJS 설정의 bare require 는 tokens 1.7.0 미만에서 preset 이 통째로 빠집니다(1.1.0 부터의 결함)
      const code = stripJsComments(content);
      if (isCommonJsConfig(file, code) && hasBareCjsPresetRequire(code)) {
        const gate = packageVersionGate(baseDir, pkg, "@axis-ds/tokens", TOKENS_CJS_PRESET_FIXED_VERSION);
        if (gate.status !== "ok") {
          const why =
            gate.status === "below"
              ? `@axis-ds/tokens ${versionGateLabel(gate)} 에서는 CommonJS 의 require("${TOKENS_TAILWIND3_PRESET}") 가 preset 이 아니라 { default } 를 돌려줘 색 · keyframes 가 적용되지 않습니다`
              : `@axis-ds/tokens 버전을 확인하지 못했습니다(${versionGateLabel(gate)}). ${TOKENS_CJS_PRESET_FIXED_VERSION} 미만이면 CommonJS 의 require("${TOKENS_TAILWIND3_PRESET}") 로는 preset 이 적용되지 않습니다`;
          return {
            name: "tailwind.config",
            severity: "warn",
            message: `${file}에 AXIS preset 참조가 있지만 ${why} → ${TOKENS_TAILWIND3_CJS_REQUIRE} 로 바꾸거나 @axis-ds/tokens ${TOKENS_CJS_PRESET_FIXED_VERSION} 이상`,
          };
        }
      }
      return { name: "tailwind.config", severity: "pass", message: `${file}${PRESET_PASS_SUFFIX}` };
    }
    const ownMapping = content.includes("--background") || content.includes("hsl(var(");
    return {
      name: "tailwind.config",
      severity: "warn",
      message: ownMapping
        ? `${file}에 AXIS preset(${TOKENS_TAILWIND3_PRESET})이 없습니다 (자체 CSS 변수 매핑만 있음, presets 에 넣으세요)`
        : `${file}에 AXIS preset(${TOKENS_TAILWIND3_PRESET})이 없습니다 (presets 에 넣으세요)`,
    };
  }
  return { name: "tailwind.config", severity: "fail", message: "tailwind.config 파일이 없습니다" };
}

// ---------------------------------------------------------------------------------------------------------------------
// WI-0065 D8: Tailwind 3 content 판독 · 애니메이션 플러그인

/** `axis.config.json` 을 읽기만 합니다. 없거나 깨졌거나 객체가 아니면 `undefined`. */
function readAxisConfigLike(baseDir: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(readFileSync(join(baseDir, "axis.config.json"), "utf8"));
    return isPlainObject(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * content glob 하나를 정규식으로 바꿉니다(Tailwind 3 의 fast-glob 문법 가운데 `**` · `*` · `?` · `{a,b}` · `[...]`).
 * 앞의 `./` 는 지우고, 경로는 설정 파일 디렉터리(프로젝트 루트) 기준 상대 경로로 맞춥니다.
 */
export function contentGlobToRegExp(glob: string): RegExp {
  const g = glob.trim().replace(/^\.\//, "");
  let re = "";
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === "*") {
      if (g[i + 1] === "*") {
        const slash = g[i + 2] === "/";
        re += slash ? "(?:.*/)?" : ".*";
        i += slash ? 2 : 1;
      } else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else if (c === "{") {
      const end = g.indexOf("}", i);
      if (end === -1) {
        re += "\\{";
        continue;
      }
      re += `(?:${g
        .slice(i + 1, end)
        .split(",")
        .map((part) => part.replace(/[.+^$()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*"))
        .join("|")})`;
      i = end;
    } else if (c === "[") {
      const end = g.indexOf("]", i);
      if (end === -1) re += "\\[";
      else {
        re += g.slice(i, end + 1);
        i = end;
      }
    } else re += c.replace(/[.+^$()|\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

/** 경로 · glob 의 앞쪽 `../` 개수(앞의 `./` 는 지우고 셉니다, 백슬래시는 `/` 로 봄) */
function leadingParentSegments(p: string): number {
  const s = p.trim().replace(/\\/g, "/").replace(/^\.\//, "");
  return (/^(?:\.\.\/)*/.exec(s)?.[0].length ?? 0) / 3;
}

/** 절대경로 glob 인지(POSIX `/...` · Windows `C:/...` · `C:\...`) */
function isAbsoluteGlob(glob: string): boolean {
  const t = glob.trim();
  return t.startsWith("/") || /^[A-Za-z]:[\\/]/.test(t);
}

/** 중괄호 갈래를 펼칠 때의 상한. 넘으면 펼치지 않고 glob 하나로 봅니다(종전 판정) */
const MAX_BRACE_EXPANSION = 256;

/**
 * glob 의 중괄호 `{a,b}` 를 갈래별 glob 들로 펼칩니다(중첩 포함, 짝이 없는 `{` 는 글자 그대로). 상한을 넘으면 `undefined`.
 * 갈래마다 앞쪽 `../` 개수가 다를 수 있어서(`{./src,../../node_modules/x}/**`) 덮음 판정 전에 펼칩니다(WI-0080 검토 후속).
 */
function expandBraces(glob: string): string[] | undefined {
  const open = glob.indexOf("{");
  if (open === -1) return [glob];
  let depth = 0;
  let close = -1;
  const commas: number[] = [];
  for (let i = open; i < glob.length; i++) {
    const c = glob[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        close = i;
        break;
      }
    } else if (c === "," && depth === 1) commas.push(i);
  }
  const head = glob.slice(0, open + 1);
  if (close === -1 || commas.length === 0) {
    // 짝이 없거나 갈래가 하나면 이 `{` 는 펼치지 않고 뒤쪽만 펼칩니다
    return expandBraces(glob.slice(open + 1))?.map((r) => head + r);
  }
  const parts: string[] = [];
  let from = open + 1;
  for (const c of [...commas, close]) {
    parts.push(glob.slice(from, c));
    from = c + 1;
  }
  const prefix = glob.slice(0, open);
  const suffix = glob.slice(close + 1);
  const out: string[] = [];
  for (const part of parts) {
    const expanded = expandBraces(prefix + part + suffix);
    if (expanded === undefined) return undefined;
    out.push(...expanded);
    if (out.length > MAX_BRACE_EXPANSION) return undefined;
  }
  return out;
}

/**
 * 경로의 실경로(심링크를 푼 경로, posix). 끝쪽이 없으면 있는 조상까지만 풀고 나머지를 붙입니다. 실패하면 `undefined`.
 * pnpm 기본 앱의 `node_modules/<pkg>` 는 `.pnpm` 스토어로 가는 심링크라 스토어 실경로 절대 glob 도 인정하려고 씁니다.
 */
function realpathPosix(p: string): string | undefined {
  let cur = p;
  const tail: string[] = [];
  for (let i = 0; i < 64; i++) {
    try {
      return [realpathSync(cur), ...tail].join(sep).split(sep).join("/");
    } catch {
      const parent = dirname(cur);
      if (parent === cur) return undefined;
      tail.unshift(basename(cur));
      cur = parent;
    }
  }
  return undefined;
}

/** 중괄호를 펼친 glob 갈래 하나가 표본을 덮는지(설명은 contentGlobCovers) */
function contentGlobBranchCovers(glob: string, sample: string, baseDir: string): boolean {
  if (isAbsoluteGlob(glob)) {
    const re = contentGlobToRegExp(glob.trim().replace(/\\/g, "/"));
    const absSample = resolve(baseDir, sample);
    if (re.test(absSample.split(sep).join("/"))) return true;
    const real = realpathPosix(absSample);
    return real !== undefined && re.test(real);
  }
  return leadingParentSegments(glob) === leadingParentSegments(sample) && contentGlobToRegExp(glob).test(sample);
}

/**
 * content glob 하나가 표본 경로(baseDir 기준 상대 경로, posix)를 덮는지 봅니다(WI-0080).
 * - 먼저 중괄호 갈래를 펼쳐 갈래마다 판정합니다(검토 후속: `{./src,../../node_modules/x}/**` 처럼 깊이를 섞은 glob,
 *   실측 372/372). 갈래가 상한(256)을 넘으면 펼치지 않고 glob 하나로 봅니다.
 * - 상대 glob: 앞쪽 `../` 개수가 표본과 같을 때만 `contentGlobToRegExp` 로 비교합니다. 정규식의 `**` 는 `..` 세그먼트도 먹지만
 *   fast-glob 의 `**` 는 `../` 를 넘지 않기 때문입니다(실측: 호이스팅 앱의 `./**` 는 ui-react 선택자 44/402).
 * - 절대경로 glob: `resolve(baseDir, sample)`(posix 로 맞춤)과, 그 실경로(심링크를 푼 경로)와 비교합니다(실측: 실제 설치 위치를
 *   가리키면 402/402, pnpm 기본 앱에서 `.pnpm` 스토어 실경로를 가리켜도 372/372).
 * Tailwind 3 는 `relative: true` 가 없으면 content 를 빌드를 실행한 디렉터리(cwd) 기준으로 풀지만, 판정은 baseDir(앱 디렉터리)을
 * cwd 로 둡니다(D4: 판정에 반영하지 않고 상위 경로 제안에 `CONTENT_PARENT_PATH_NOTE` 를 붙임).
 */
export function contentGlobCovers(glob: string, sample: string, baseDir: string): boolean {
  const branches = expandBraces(glob.trim()) ?? [glob];
  return branches.some((b) => contentGlobBranchCovers(b, sample, baseDir));
}

/**
 * 상위 경로(`../`) content 제안에 붙이는 안내(WI-0080 D4). cli check · MCP check_project · theme add 가 같은 문자열을 씁니다.
 * 실측: 호이스팅 앱의 `../../node_modules/...` 는 앱 cwd 빌드에서 402/402, 모노레포 루트 cwd 빌드에서 0, `relative: true` 면 둘 다 402.
 */
export const CONTENT_PARENT_PATH_NOTE =
  "상위 경로는 Tailwind 3 가 빌드를 실행한 디렉터리 기준으로 풀려요. 모노레포 루트 등 앱 디렉터리 밖에서 빌드하면 content: { relative: true, files: [...] } 로 설정 파일 기준으로 바꾸세요";

/** 패키지 content 대상의 표본 · 제안(WI-0080). 설치본을 못 찾거나 PnP 면 종전 `node_modules/<pkg>` 입니다. */
function packageContentTarget(baseDir: string, name: string): { sample: string; suggest: string } {
  const found = isPnpProject(baseDir) ? undefined : findInstalledPackage(baseDir, name);
  const rel = found === undefined ? undefined : relative(baseDir, found.dir);
  // 다른 드라이브(Windows)처럼 상대 경로로 못 바꾸면 종전 경로로 둡니다
  const relDir = rel === undefined || rel === "" || isAbsolute(rel) ? `node_modules/${name}` : rel.split(sep).join("/");
  return {
    sample: `${relDir}/dist/index.js`,
    suggest: `${relDir.startsWith("../") ? "" : "./"}${relDir}/dist/**/*.{js,mjs}`,
  };
}

/** 대괄호 · 중괄호 짝을 맞춰 `src[start]`(여는 괄호)부터 닫는 괄호까지 돌려줍니다. 문자열 안의 괄호는 세지 않습니다. */
function balancedSlice(src: string, start: number): string | undefined {
  const open = src[start];
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < src.length && src[j] !== c) j += src[j] === "\\" ? 2 : 1;
      i = j;
      continue;
    }
    if (c === open) depth++;
    else if (c === close && --depth === 0) return src.slice(start, i + 1);
  }
  return undefined;
}

/** 문자열 리터럴(따옴표 · 템플릿 리터럴, `${}` 없는 것)을 순서대로 뽑습니다. */
function stringLiterals(src: string): string[] {
  return [...src.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)].map((m) => m[2]).filter((s) => !s.includes("${"));
}

/**
 * Tailwind 3 설정의 `content` 를 정적으로 읽습니다. 배열 리터럴(`content: [...]`) 또는 `content: { files: [...] }` 만 읽고,
 * 배열 안에 문자열이 아닌 요소(변수 · 펼침 · 함수 호출)가 있으면 `dynamic` 입니다(그 요소가 덮는 경로는 알 수 없음).
 * `content` 키를 찾지 못하면 `undefined`.
 */
export function readTailwindContent(source: string): { globs: string[]; dynamic: boolean } | undefined {
  const src = stripJsComments(source);
  const key = /\bcontent\s*:\s*/g;
  for (const m of src.matchAll(key)) {
    let at = (m.index ?? 0) + m[0].length;
    let block = src[at] === "[" || src[at] === "{" ? balancedSlice(src, at) : undefined;
    if (block === undefined) continue;
    if (block.startsWith("{")) {
      const files = /\bfiles\s*:\s*\[/.exec(block);
      if (!files) return { globs: [], dynamic: true };
      at = files.index + files[0].length - 1;
      block = balancedSlice(block, at);
      if (block === undefined) return { globs: [], dynamic: true };
    }
    const inner = block.slice(1, -1);
    const globs = stringLiterals(inner);
    const rest = inner.replace(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g, "").replace(/[\s,]/g, "");
    return { globs, dynamic: rest !== "" };
  }
  return undefined;
}

/** content 가 덮어야 하는 경로 하나. `sample` 은 그 경로 안의 대표 파일(상대 경로) */
export interface ContentTarget {
  label: string;
  sample: string;
  /** 넣을 glob(안내용) */
  suggest: string;
  covered: boolean;
}

export interface TailwindContentInspection {
  /** 판독한 설정 파일 이름 */
  configFile: string;
  /** `content` 를 읽지 못함(키 없음) */
  unreadable: boolean;
  /** 문자열이 아닌 요소가 있어 덮이지 않은 대상도 실제로는 덮일 수 있음 */
  dynamic: boolean;
  targets: ContentTarget[];
}

/** 경로를 `a/b/c` 꼴(앞의 `./` · 뒤의 `/` 없음)로 맞춥니다. 프로젝트 밖(`../`) · 절대경로면 `undefined`. */
function normalizeRel(p: string): string | undefined {
  const s = p.trim().replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
  if (s === "" || s.startsWith("../") || s.startsWith("/") || /^[A-Za-z]:/.test(s)) return undefined;
  return s;
}

/**
 * Tailwind 3 프로젝트에서 content 가 AXIS 컴포넌트 경로를 덮는지 봅니다(WI-0065 D8). Tailwind 4 이상 · 설정 파일 없음 ·
 * 대상 없음이면 `null`(검사기는 항목을 더하지 않음).
 * - 대상 1: `axis.config.json` 의 componentsDir(복사 설치 위치). 대표 파일 `<componentsDir>/button.tsx`
 * - 대상 2: package.json 에 선언된 `@axis-ds/ui-react` · `@axis-ds/agentic-ui`(npm 설치). 대표 파일은 `findInstalledPackage` 로 찾은
 *   설치본의 `dist/index.js`(baseDir 기준 상대 경로, 호이스팅이면 `../../node_modules/<pkg>/dist/index.js`, WI-0080). 설치본을
 *   찾지 못하거나(상위 어디에도 없음) Plug'n'Play 면 종전 `node_modules/<pkg>/dist/index.js` 입니다.
 * glob 은 설정 파일이 있는 디렉터리(프로젝트 루트) 기준으로 맞춥니다(`contentGlobCovers`). 판정은 문자열 판독이라 실제 파일이 있는지는 보지 않습니다.
 */
export function inspectTailwindContent(baseDirInput: string): TailwindContentInspection | null {
  const baseDir = resolve(baseDirInput);
  const pkg = readPackageJson(baseDir);
  const tailwind = detectTailwind(baseDir, pkg);
  if (tailwind.major !== undefined && tailwind.major >= 4) return null;
  const configFile = TAILWIND_CONFIG_FILES.find((f) => existsSync(join(baseDir, f)));
  if (configFile === undefined) return null;

  const targets: Omit<ContentTarget, "covered">[] = [];
  const componentsDir = readAxisConfigLike(baseDir)?.componentsDir;
  const rel = typeof componentsDir === "string" ? normalizeRel(componentsDir) : undefined;
  if (rel !== undefined) {
    targets.push({ label: `componentsDir(${componentsDir as string})`, sample: `${rel}/button.tsx`, suggest: `./${rel}/**/*.{ts,tsx}` });
  }
  for (const name of TAILWIND4_COMPONENT_PACKAGES) {
    if (pkg !== undefined && hasDependency(pkg, name) !== undefined) {
      targets.push({ label: name, ...packageContentTarget(baseDir, name) });
    }
  }
  if (targets.length === 0) return null;

  const read = readTailwindContent(readFileSync(join(baseDir, configFile), "utf8"));
  const globs = (read?.globs ?? []).filter((g) => !g.trim().startsWith("!"));
  return {
    configFile,
    unreadable: read === undefined,
    dynamic: read?.dynamic ?? false,
    targets: targets.map((t) => ({ ...t, covered: globs.some((g) => contentGlobCovers(g, t.sample, baseDir)) })),
  };
}

/** content 항목. CLI · MCP 의 `CheckResult` 와 같은 모양입니다. */
export interface ContentCheckResult {
  name: "tailwind.content";
  severity: "pass" | "warn" | "fail";
  message: string;
}

/**
 * `axis check` · MCP `axis.check_project` 의 content 항목(WI-0065 D8). 대상이 없으면 `null`.
 * 정적으로 읽은 문자열 glob 이 대상을 덮지 않으면 FAIL(그 경로의 클래스가 생성되지 않아 Button 이 투명 · 둥글기 0 이 됨),
 * `content` 를 읽지 못했거나 문자열이 아닌 요소가 있어 판정할 수 없으면 WARN 입니다.
 */
export function checkTailwindContent(baseDir: string): ContentCheckResult | null {
  const r = inspectTailwindContent(baseDir);
  if (r === null) return null;
  const missing = r.targets.filter((t) => !t.covered);
  if (missing.length === 0) {
    return {
      name: "tailwind.content",
      severity: "pass",
      message: `${r.configFile}의 content 가 ${r.targets.map((t) => t.label).join(" · ")} 를 덮습니다`,
    };
  }
  const list = missing.map((t) => `${t.label} → "${t.suggest}"`).join(" · ");
  // WI-0080 D4: 상위 경로 제안이 있을 때만 cwd 기준 안내를 붙입니다(종전 문구는 바이트 그대로)
  const note = missing.some((t) => t.suggest.startsWith("../")) ? ` (${CONTENT_PARENT_PATH_NOTE})` : "";
  if (r.unreadable || r.dynamic) {
    return {
      name: "tailwind.content",
      severity: "warn",
      message: `${r.configFile}의 content 를 정적으로 다 읽지 못해 확인하지 못했습니다: ${list}${note}`,
    };
  }
  return {
    name: "tailwind.content",
    severity: "fail",
    message: `${r.configFile}의 content 가 컴포넌트 경로를 덮지 않습니다(클래스가 생성되지 않음): ${list}${note}`,
  };
}

/** Tailwind 3 애니메이션 플러그인(WI-0046 과 같은 이름) */
export const ANIMATION_PLUGIN_TAILWIND3 = "tailwindcss-animate";
/** Tailwind 4 애니메이션 CSS(WI-0046 과 같은 이름) */
export const ANIMATION_PLUGIN_TAILWIND4 = "tw-animate-css";

/**
 * 열고 닫는 애니메이션 유틸리티(`animate-in` · `animate-out`)를 쓰는지 볼 때의 스캔 상한.
 * 상한은 읽은 파일 수가 아니라 **방문한 항목 전체**(디렉터리 · 파일 · 링크)에 건다. 파일 수만 세면
 * 디렉터리나 다른 확장자가 많은 트리에서 상한이 걸리지 않는다. 심링크는 따라가지 않아 순환 링크
 * (모노레포 workspace 링크 등)에서도 끝나며, 깊이와 파일 크기에도 상한을 둔다.
 */
const ANIMATION_SCAN_ENTRY_LIMIT = 2000;
const ANIMATION_SCAN_DEPTH_LIMIT = 8;
const ANIMATION_SCAN_FILE_BYTES = 512 * 1024;

/** componentsDir 아래 `.tsx` · `.ts` · `.jsx` · `.js` 에 `animate-in` · `animate-out` 클래스가 있는지(복사 설치 판정) */
export function componentsUseAnimation(baseDir: string, componentsDir: string): boolean {
  const rel = normalizeRel(componentsDir);
  if (rel === undefined) return false;
  const stack: Array<[string, number]> = [[join(baseDir, rel), 0]];
  let visited = 0;
  while (stack.length > 0) {
    const [dir, depth] = stack.pop()!;
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (++visited > ANIMATION_SCAN_ENTRY_LIMIT) return false;
      const p = join(dir, name);
      let st: ReturnType<typeof lstatSync>;
      try {
        st = lstatSync(p);
      } catch {
        continue;
      }
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) {
        if (name !== "node_modules" && depth < ANIMATION_SCAN_DEPTH_LIMIT) stack.push([p, depth + 1]);
      } else if (st.isFile() && st.size <= ANIMATION_SCAN_FILE_BYTES && /\.(tsx|ts|jsx|js)$/.test(name)) {
        if (/\banimate-(?:in|out)\b/.test(readFileSync(p, "utf8"))) return true;
      }
    }
  }
  return false;
}

/** 애니메이션 항목. CLI · MCP 의 `CheckResult` 와 같은 모양입니다. */
export interface AnimationCheckResult {
  name: "animation";
  severity: "pass" | "warn" | "fail";
  message: string;
}

/**
 * ui-react 를 쓰는데 애니메이션 플러그인이 없으면 WARN 입니다(WI-0065 D8, WI-0046 측정: 플러그인이 없으면 Dialog · Select 등의
 * 열고 닫는 애니메이션 33개 클래스가 0개 생성). ui-react 를 쓰지 않으면 `null`(항목을 더하지 않음).
 * - 사용 판정: package.json 에 `@axis-ds/ui-react` 선언, 또는 componentsDir 아래 파일에 `animate-in` · `animate-out` 클래스
 * - 플러그인 판정(Tailwind 3): `tailwindcss-animate` 선언 + 설정 파일에서 그 이름 참조(`require` · `import`)
 * - 플러그인 판정(Tailwind 4): CSS 후보 첫 파일에 `@import "tw-animate-css"` 또는 `@plugin "tailwindcss-animate"`
 */
export function checkAnimationPlugin(baseDirInput: string): AnimationCheckResult | null {
  const baseDir = resolve(baseDirInput);
  const pkg = readPackageJson(baseDir);
  const config = readAxisConfigLike(baseDir);
  const declared = pkg !== undefined && hasDependency(pkg, "@axis-ds/ui-react") !== undefined;
  const copied = typeof config?.componentsDir === "string" && componentsUseAnimation(baseDir, config.componentsDir);
  if (!declared && !copied) return null;
  const by = declared ? "@axis-ds/ui-react 선언" : "componentsDir 의 animate-in 류 클래스";
  const tailwind = detectTailwind(baseDir, pkg);
  if (tailwind.major !== undefined && tailwind.major >= 4) {
    const file = TAILWIND_CSS_CANDIDATES.find((c) => existsSync(join(baseDir, c)));
    const css = file !== undefined ? stripCssComments(readFileSync(join(baseDir, file), "utf8")) : "";
    const ok =
      new RegExp(`@import\\s+(?:url\\(\\s*)?["']${ANIMATION_PLUGIN_TAILWIND4}["']`).test(css) ||
      new RegExp(`@plugin\\s+["']${ANIMATION_PLUGIN_TAILWIND3}["']`).test(css);
    return ok
      ? { name: "animation", severity: "pass", message: `${file}에 애니메이션 플러그인이 있습니다` }
      : {
          name: "animation",
          severity: "warn",
          message: `애니메이션 플러그인이 없습니다(${by}): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않습니다 → ${ANIMATION_PLUGIN_TAILWIND4} 설치 뒤 @import "${ANIMATION_PLUGIN_TAILWIND4}";`,
        };
  }
  const configFile = TAILWIND_CONFIG_FILES.find((f) => existsSync(join(baseDir, f)));
  const source = configFile !== undefined ? stripJsComments(readFileSync(join(baseDir, configFile), "utf8")) : "";
  const plugins = configFile !== undefined ? readAnimationPluginUse(source) : "absent";
  const pluginDeclared = pkg !== undefined && hasDependency(pkg, ANIMATION_PLUGIN_TAILWIND3) !== undefined;
  // WI-0070: 「미설치」는 선언이 아니라 설치본으로 봅니다(Plug'n'Play 는 선언 기준)
  const pluginInstalled =
    pluginDeclared && (isPnpProject(baseDir) || findInstalledPackage(baseDir, ANIMATION_PLUGIN_TAILWIND3) !== undefined);
  if (plugins === "found" && pluginDeclared && pluginInstalled) {
    return { name: "animation", severity: "pass", message: `${configFile}의 plugins 에 ${ANIMATION_PLUGIN_TAILWIND3} 가 있습니다` };
  }
  const cfg = configFile ?? "tailwind.config";
  const reasons: string[] = [];
  if (!pluginDeclared) reasons.push(`${ANIMATION_PLUGIN_TAILWIND3} 선언 없음`);
  else if (!pluginInstalled) reasons.push(`${ANIMATION_PLUGIN_TAILWIND3} 미설치(선언만 있음)`);
  if (plugins === "dynamic") reasons.push(`${cfg} plugins 를 정적으로 다 읽지 못해 확인하지 못함`);
  else if (plugins !== "found") reasons.push(`${cfg} plugins 에 없음`);
  return {
    name: "animation",
    severity: "warn",
    message: `애니메이션 플러그인이 없습니다(${by}, ${reasons.join(" · ")}): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않습니다 → ${ANIMATION_PLUGIN_TAILWIND3} 설치 뒤 plugins 에 require("${ANIMATION_PLUGIN_TAILWIND3}")`,
  };
}

/**
 * Tailwind 3 설정의 `plugins` 배열에 tailwindcss-animate 가 들어 있는지 정적으로 읽습니다(WI-0070). 주석은 미리 지운 소스를 받습니다.
 * - `found`: 배열 요소에 `require("tailwindcss-animate")` 가 있거나, 그 패키지를 받은 식별자
 *   (`import animate from "tailwindcss-animate"` · `const animate = require("tailwindcss-animate")`)가 있음
 * - `dynamic`: 배열에 판독할 수 없는 요소(다른 식별자 · 펼침 · 함수 호출)가 있거나 `plugins` 를 단축 속성 · 변수로 넘김
 * - `absent`: `plugins` 가 없거나, 배열을 다 읽었는데 없음
 * 설정 파일 어딘가의 같은 문자열(`const x = { a: "tailwindcss-animate" }`)이나 import 만으로는 `found` 가 아닙니다(종전 거짓 PASS).
 */
export function readAnimationPluginUse(source: string): "found" | "dynamic" | "absent" {
  const name = escapeRegExp(ANIMATION_PLUGIN_TAILWIND3);
  const idents = new Set<string>();
  for (const m of source.matchAll(new RegExp(`\\bimport\\s+([A-Za-z_$][\\w$]*)\\s+from\\s*(["'])${name}\\2`, "g"))) idents.add(m[1]);
  for (const m of source.matchAll(
    new RegExp(`\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*require\\s*\\(\\s*(["'])${name}\\2\\s*\\)`, "g")
  )) {
    idents.add(m[1]);
  }
  const requireCall = new RegExp(`^require\\s*\\(\\s*(["'])${name}\\1\\s*\\)(?:\\s*\\.\\s*default)?$`);
  let sawDynamic = false;
  for (const m of source.matchAll(/\bplugins\b\s*(:)?\s*/g)) {
    if (m[1] === undefined) {
      // `{ content, plugins }` 처럼 단축 속성이면 값이 변수라 읽을 수 없습니다. `plugins.push(...)` 류도 같습니다
      const before = source.slice(Math.max(0, (m.index ?? 0) - 1), m.index ?? 0);
      if (/[{,\s]/.test(before) || before === "") sawDynamic = true;
      continue;
    }
    const at = (m.index ?? 0) + m[0].length;
    if (source[at] !== "[") {
      sawDynamic = true;
      continue;
    }
    const block = balancedSlice(source, at);
    if (block === undefined) {
      sawDynamic = true;
      continue;
    }
    const elements = splitTopLevel(block.slice(1, -1));
    for (const el of elements) {
      const e = el.trim();
      if (e === "") continue;
      if (requireCall.test(e) || idents.has(e) || idents.has(e.replace(/\(\s*\)$/, ""))) return "found";
      // 문자열 리터럴 요소는 Tailwind 가 플러그인으로 받지 않으므로 판독 가능한 「없음」입니다. 그 밖은 판독할 수 없는 요소입니다
      if (/^require\s*\(\s*(["'])[^"']+\1\s*\)(?:\s*\.\s*default)?$/.test(e)) continue;
      sawDynamic = true;
    }
  }
  return sawDynamic ? "dynamic" : "absent";
}

/** 배열 · 객체 본문을 최상위 쉼표로 나눕니다(괄호 · 문자열 안 쉼표는 나누지 않음). */
function splitTopLevel(body: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < body.length && body[j] !== c) j += body[j] === "\\" ? 2 : 1;
      i = j;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === "," && depth === 0) {
      out.push(body.slice(start, i));
      start = i + 1;
    }
  }
  out.push(body.slice(start));
  return out;
}
