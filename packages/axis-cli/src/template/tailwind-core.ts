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

/** CSS 에 Tailwind 4 진입 import 가 있는지(블록 주석 안은 보지 않음) */
export function hasTailwindImport(css: string): boolean {
  return TAILWIND_IMPORT.test(css.replace(/\/\*[\s\S]*?\*\//g, ""));
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
 * tailwind.config 항목을 판정합니다.
 * - Tailwind major 4 이상(`detectTailwind`): 설정 파일을 보지 않고 CSS 후보에서 처음 찾은 파일의 `@import "tailwindcss"` 를
 *   봅니다. 있으면 pass, 없거나 CSS 를 찾지 못하면 warn(CSS 가 없을 때의 fail 은 globals.css 항목이 냅니다).
 * - 3 이하 · 판정 불가: 종전 규칙. `.ts` 는 AXIS 토큰 설정 여부(pass · warn), `.js` · `.mjs` · `.cjs` 는 warn(TypeScript 권장),
 *   없으면 fail. `.ts` · `.js` 의 문구는 종전과 같습니다.
 */
export function checkTailwindSetup(baseDirInput: string): TailwindCheckResult {
  const baseDir = resolve(baseDirInput);
  const tailwind = detectTailwind(baseDir, readPackageJson(baseDir));
  if (tailwind.major !== undefined && tailwind.major >= 4) {
    const label = `Tailwind ${tailwind.major}`;
    for (const candidate of TAILWIND_CSS_CANDIDATES) {
      const file = join(baseDir, candidate);
      if (!existsSync(file)) continue;
      const found = hasTailwindImport(readFileSync(file, "utf8"));
      return {
        name: "tailwind.config",
        severity: found ? "pass" : "warn",
        message: found
          ? `${label}: ${candidate}에 @import "tailwindcss" 가 있습니다 (설정 파일 불필요)`
          : `${label}: ${candidate}에 @import "tailwindcss" 가 없습니다`,
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
    return {
      name: "tailwind.config",
      severity: hasTokens ? "pass" : "warn",
      message: hasTokens
        ? "tailwind.config.ts에 AXIS 토큰이 설정되어 있습니다"
        : "tailwind.config.ts에 AXIS 토큰 설정이 없습니다",
    };
  }
  for (const file of otherFiles) {
    if (existsSync(join(baseDir, file))) {
      return { name: "tailwind.config", severity: "warn", message: `${file} 존재 (TypeScript 권장)` };
    }
  }
  return { name: "tailwind.config", severity: "fail", message: "tailwind.config 파일이 없습니다" };
}
