/**
 * axis theme add <brand> (WI-0028 FR-2, plan 4.2)
 *
 * `planThemeAdd` 가 쓰기 전에 바꿀 내용을 모두 계산하고, `applyThemeAdd` 가 그 계획대로만 씁니다.
 * 설치 명령은 실행하지 않고 안내만 합니다(U6). 같은 브랜드로 다시 실행하면 쓸 파일이 0개입니다(멱등).
 */

import { accessSync, constants, existsSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { AXIS_CONFIG_FILE } from "../config/axis-config.js";
import { detectInstallCommand, hasDependency, isPlainObject } from "@axis-ds/registry-core/project";
import {
  BRAND_NAME_PATTERN,
  MIN_BRAND_TOKENS_VERSION,
  TOKENS_PACKAGE,
  brandImportPath,
  findBrandImports,
  findGlobalCss,
  resolveTokens,
  type TokensResolution,
} from "./brand-core.js";

/** `package.json` 에 없을 때 더하는 `@axis-ds/tokens` 범위(U6) */
export const TOKENS_DEPENDENCY_RANGE = `^${MIN_BRAND_TOKENS_VERSION}`;

/** Provider 안내에 쓰는 패키지 */
export const THEME_PACKAGE = "@axis-ds/theme";

// 설치 명령 선택 · package.json 판정 헬퍼는 add 와 같이 쓰려고 공유 코어(@axis-ds/registry-core, WI-0055)로 옮겼습니다. 종전 이름은 그대로 내보냅니다
export { detectInstallCommand, hasDependency, isPlainObject };

/** 계획을 멈추게 하는 오류. 하나라도 있으면 쓸 파일이 0개입니다. */
export type ThemeAddError =
  | { kind: "no-config" }
  | { kind: "invalid-config"; message: string }
  | { kind: "invalid-package-json"; message: string }
  | { kind: "invalid-name"; brand: string }
  /** 고른 CSS 파일의 실제 경로(심볼릭 링크를 따라간 경로)가 프로젝트 디렉터리 밖입니다. */
  | { kind: "css-outside-project"; file: string; realPath: string }
  /** 고른 파일의 실제 경로가 `.css` 파일이 아닙니다(예: globalCss 가 package.json 을 가리킴). */
  | { kind: "css-not-stylesheet"; file: string; realPath: string }
  | { kind: "unknown-brand"; brand: string; available: string[]; version?: string };

/** 쓸 파일 하나. `before` 는 계획할 때 읽은 내용(없던 파일이면 `null`)입니다. */
export interface PlannedWrite {
  file: string;
  before: string | null;
  after: string;
}

export interface CssStep {
  /** 고른 CSS 파일 절대 경로(후보가 모두 없으면 없음) */
  file?: string;
  /** `globalCss` 가 가리키는데 없던 경로(경고용) */
  configuredMissing?: string;
  /** `add`: 줄을 넣음 · `exists`: 같은 브랜드 import 가 이미 있음 · `manual`: 대상 파일이 없어 수동 안내 */
  action: "add" | "exists" | "manual";
  /** 이미 있던 다른 브랜드 import (U13: 지우지 않고 안내만) */
  otherBrands: string[];
}

export interface DependencyStep {
  /** `add`: dependencies 에 더함 · `present`: 이미 있음(범위 불변) · `no-package-json`: package.json 이 없어 건너뜀 */
  action: "add" | "present" | "no-package-json";
  /** package.json 에 적힌 범위(있으면) */
  declaredRange?: string;
  /** 설치된 버전이 1.3.0 미만이라 업그레이드를 안내해야 함 */
  upgrade: boolean;
  /** `@axis-ds/theme` 이 package.json 에 없음(Provider 안내에 설치 안내를 붙임) */
  themeMissing: boolean;
}

export interface ThemeAddPlan {
  baseDir: string;
  brand: string;
  /** CSS 에 넣을 import 경로 */
  importPath: string;
  tokens: TokensResolution;
  /** 비어 있지 않으면 아무것도 쓰지 않고 rc 1 */
  errors: ThemeAddError[];
  /** tokens 를 읽을 수 없어 이름 규칙만 보고 진행함(U5) */
  unverifiedBrand: boolean;
  css?: CssStep;
  dependency?: DependencyStep;
  /** `axis.config.json` 의 `brand` 가 바뀌는지 */
  configChanged: boolean;
  /** 설치 안내에 쓸 명령(lockfile 로 고름) */
  installCommand: string;
  writes: PlannedWrite[];
}

function readText(file: string): string | null {
  return existsSync(file) ? readFileSync(file, "utf8") : null;
}

/** 줄바꿈 형식(CRLF 를 쓰던 파일은 CRLF 로 씀) */
function eolOf(text: string): string {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

/** JSON 파일의 들여쓰기를 첫 들여쓴 줄에서 읽습니다(없으면 2칸). */
function indentOf(text: string): string | number {
  const m = /\n([ \t]+)\S/.exec(text);
  if (!m) return 2;
  return m[1].includes("\t") ? "\t" : m[1].length;
}

/** 원래 파일의 들여쓰기 · 줄바꿈 · 끝 줄바꿈을 유지해 JSON 을 씁니다(plan 4.2, T3-11). */
export function formatJsonLike(original: string, value: unknown): string {
  const eol = eolOf(original);
  const endsWithNewline = /\r?\n$/.test(original);
  let out = JSON.stringify(value, null, indentOf(original));
  if (eol === "\r\n") out = out.replace(/\n/g, "\r\n");
  return endsWithNewline ? out + eol : out;
}

/**
 * CSS 에 import 한 줄을 넣습니다(plan 4.2-3, U2 대안 2).
 * 파일 앞쪽(빈 줄 · 주석 · `@charset` · `@import` 만 있는 구간)의 마지막 `@charset` · `@import` 줄 다음,
 * 그런 줄이 없으면 첫 줄에 넣습니다. 그래서 `@tailwind base;` 같은 규칙보다 항상 앞입니다.
 */
export function insertImportLine(css: string, line: string): string {
  // 맨 앞 UTF-8 BOM 은 떼어 두었다가 결과 맨 앞에 다시 붙입니다(BOM 이 둘째 줄로 밀려나면 PostCSS 가 파싱하지 못함).
  const bom = css.startsWith("\uFEFF") ? "\uFEFF" : "";
  const body = bom ? css.slice(1) : css;
  const eol = eolOf(body);
  const lines = body.split(/\r?\n/);
  let insertAt = 0;
  let inComment = false;
  for (let i = 0; i < lines.length; i++) {
    let rest = lines[i].trim();
    if (inComment) {
      const end = rest.indexOf("*/");
      if (end === -1) continue;
      inComment = false;
      rest = rest.slice(end + 2).trim();
    }
    while (rest.startsWith("/*")) {
      const end = rest.indexOf("*/", 2);
      if (end === -1) {
        inComment = true;
        rest = "";
        break;
      }
      rest = rest.slice(end + 2).trim();
    }
    if (rest === "") continue;
    if (/^@(charset|import)\b/i.test(rest)) {
      insertAt = i + 1;
      continue;
    }
    break;
  }
  lines.splice(insertAt, 0, line);
  return bom + lines.join(eol);
}

/** `x.y.z` 비교(프리릴리스는 같은 x.y.z 보다 낮게 봄). 읽을 수 없으면 `undefined` */
export function compareVersions(a: string, b: string): number | undefined {
  const parse = (v: string) => {
    const m = /^(\d+)\.(\d+)\.(\d+)(-.+)?$/.exec(v.trim());
    return m ? { nums: [Number(m[1]), Number(m[2]), Number(m[3])], pre: Boolean(m[4]) } : undefined;
  };
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return undefined;
  for (let i = 0; i < 3; i++) {
    if (pa.nums[i] !== pb.nums[i]) return pa.nums[i] < pb.nums[i] ? -1 : 1;
  }
  if (pa.pre !== pb.pre) return pa.pre ? -1 : 1;
  return 0;
}

/** `file` 의 실제 경로가 `baseDir` 의 실제 경로 안에 있는지 봅니다(심볼릭 링크 · `../` · 절대경로 모두 실제 경로로 판정). */
export function realPathInside(baseDir: string, file: string): { inside: boolean; realPath: string } {
  const realBase = realpathSync(baseDir);
  const realPath = realpathSync(file);
  const relPath = path.relative(realBase, realPath);
  const inside = relPath !== "" && !relPath.startsWith("..") && !path.isAbsolute(relPath);
  return { inside, realPath };
}

/** 실제 경로(심볼릭 링크를 따라간 경로)가 `.css` 파일인지 봅니다. */
function isStylesheet(realPath: string): boolean {
  return path.extname(realPath).toLowerCase() === ".css";
}

/**
 * 바꿀 내용을 계산합니다. 파일을 쓰지 않습니다.
 * `errors` 가 있으면 `writes` 는 비어 있습니다.
 */
export function planThemeAdd(baseDirInput: string, brand: string): ThemeAddPlan {
  const baseDir = path.resolve(baseDirInput);
  const plan: ThemeAddPlan = {
    baseDir,
    brand,
    importPath: brandImportPath({ css: `./css/brands/${brand}` }),
    tokens: { status: "not-installed" },
    errors: [],
    unverifiedBrand: false,
    configChanged: false,
    installCommand: detectInstallCommand(baseDir),
    writes: [],
  };

  // 1. axis.config.json (없으면 아무것도 쓰지 않음, PRD FR-2)
  const configFile = path.join(baseDir, AXIS_CONFIG_FILE);
  const configText = readText(configFile);
  if (configText === null) {
    plan.errors.push({ kind: "no-config" });
    return plan;
  }
  let config: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(configText);
    if (!isPlainObject(parsed)) throw new Error("최상위가 객체가 아닙니다");
    config = parsed;
  } catch (err) {
    plan.errors.push({ kind: "invalid-config", message: (err as Error).message });
    return plan;
  }

  // 2. 브랜드 이름 검증(U5)
  if (!BRAND_NAME_PATTERN.test(brand)) {
    plan.errors.push({ kind: "invalid-name", brand });
    return plan;
  }
  plan.tokens = resolveTokens(baseDir);
  if (plan.tokens.status === "ok" && plan.tokens.indexPath) {
    const data = JSON.parse(readFileSync(plan.tokens.indexPath, "utf8")) as {
      brands?: { name: string; css: string }[];
    };
    const entries = Array.isArray(data.brands) ? data.brands : [];
    const entry = entries.find((e) => e.name === brand);
    if (!entry) {
      plan.errors.push({
        kind: "unknown-brand",
        brand,
        available: entries.map((e) => e.name),
        version: plan.tokens.version,
      });
      return plan;
    }
    plan.importPath = brandImportPath(entry);
  } else {
    plan.unverifiedBrand = true;
  }

  // 3. CSS (FR-2 탐색 순서, U14 (A), U2 대안 2 위치, U13)
  const location = findGlobalCss(baseDir, config);
  if (location.path) {
    // 쓰기 대상은 프로젝트 안 파일만(globalCss 의 `../` · 절대경로 · 밖을 가리키는 심볼릭 링크는 거절, 아무것도 쓰지 않음)
    const where = realPathInside(baseDir, location.path);
    if (!where.inside) {
      plan.errors.push({ kind: "css-outside-project", file: location.path, realPath: where.realPath });
      plan.writes = [];
      return plan;
    }
    // CSS 가 아닌 파일(package.json 등)에 @import 줄을 넣지 않음
    if (!isStylesheet(where.realPath)) {
      plan.errors.push({ kind: "css-not-stylesheet", file: location.path, realPath: where.realPath });
      plan.writes = [];
      return plan;
    }
    const before = readFileSync(location.path, "utf8");
    const imported = findBrandImports(before);
    const otherBrands = [...new Set(imported.filter((n) => n !== brand))];
    if (imported.includes(brand)) {
      plan.css = { file: location.path, configuredMissing: location.configuredMissing, action: "exists", otherBrands };
    } else {
      plan.css = { file: location.path, configuredMissing: location.configuredMissing, action: "add", otherBrands };
      plan.writes.push({
        file: location.path,
        before,
        after: insertImportLine(before, `@import "${plan.importPath}";`),
      });
    }
  } else {
    plan.css = { configuredMissing: location.configuredMissing, action: "manual", otherBrands: [] };
  }

  // 4. package.json (U6: 없을 때만 ^1.3.0 추가, 설치는 실행하지 않음)
  const pkgFile = path.join(baseDir, "package.json");
  const pkgText = readText(pkgFile);
  const installed = plan.tokens.version;
  const upgrade =
    installed !== undefined && (compareVersions(installed, MIN_BRAND_TOKENS_VERSION) ?? 0) < 0;
  if (pkgText === null) {
    plan.dependency = { action: "no-package-json", upgrade, themeMissing: false };
  } else {
    let pkg: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(pkgText);
      if (!isPlainObject(parsed)) throw new Error("최상위가 객체가 아닙니다");
      pkg = parsed;
    } catch (err) {
      plan.errors.push({ kind: "invalid-package-json", message: (err as Error).message });
      plan.writes = [];
      return plan;
    }
    const themeMissing = hasDependency(pkg, THEME_PACKAGE) === undefined;
    const declared = hasDependency(pkg, TOKENS_PACKAGE);
    if (declared !== undefined) {
      plan.dependency = { action: "present", declaredRange: declared, upgrade, themeMissing };
    } else {
      const deps = isPlainObject(pkg.dependencies) ? { ...pkg.dependencies } : {};
      deps[TOKENS_PACKAGE] = TOKENS_DEPENDENCY_RANGE;
      const next = { ...pkg, dependencies: deps };
      plan.dependency = { action: "add", upgrade, themeMissing };
      plan.writes.push({ file: pkgFile, before: pkgText, after: formatJsonLike(pkgText, next) });
    }
  }

  // 5. axis.config.json 의 brand (나머지 키 · 순서 유지, 같은 값이면 쓰지 않음)
  if (config.brand !== brand) {
    plan.configChanged = true;
    plan.writes.push({
      file: configFile,
      before: configText,
      after: formatJsonLike(configText, { ...config, brand }),
    });
  }

  return plan;
}

/** 쓰기 단계에서 실패했을 때의 오류. 이미 쓴 파일은 계획 전 내용으로 되돌린 뒤 던집니다. */
export class ThemeApplyError extends Error {
  constructor(
    message: string,
    /** 실패한 파일 */
    readonly failedFile: string,
    /** 되돌린 파일 */
    readonly restored: string[],
    /** 되돌리지 못한 파일(이 파일들은 바뀐 채 남아 있음) */
    readonly restoreFailed: string[]
  ) {
    super(message);
    this.name = "ThemeApplyError";
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * 계획대로 씁니다. 쓰기 전에 모든 대상 파일이 계획할 때와 같은지, 새 내용이 올바른지, 쓸 수 있는지 먼저 확인하고,
 * 하나라도 어긋나면 아무것도 쓰지 않고 오류를 던집니다.
 * 그래도 쓰는 도중 실패하면 이미 쓴 파일을 계획 전 내용으로 되돌리고 `ThemeApplyError` 를 던집니다.
 */
export function applyThemeAdd(plan: ThemeAddPlan): string[] {
  if (plan.errors.length > 0) {
    throw new Error("오류가 있는 계획은 적용하지 않습니다");
  }
  for (const w of plan.writes) {
    const current = readText(w.file);
    if (current !== w.before) {
      throw new Error(`${w.file} 이 계획 뒤에 바뀌었습니다. 다시 실행하세요.`);
    }
    // 계획 뒤 심볼릭 링크가 바뀌었을 수 있으므로 쓰기 직전에 위치를 다시 확인(내용이 같아도 대상이 밖일 수 있음)
    const where = realPathInside(plan.baseDir, w.before === null ? path.dirname(w.file) : w.file);
    if (!where.inside && !(w.before === null && path.dirname(w.file) === plan.baseDir)) {
      throw new Error(`${w.file} 의 실제 위치(${where.realPath})가 프로젝트 디렉터리 밖입니다. 아무것도 쓰지 않았습니다.`);
    }
    if (!w.file.endsWith(".json") && !isStylesheet(where.realPath)) {
      throw new Error(`${w.file} 의 실제 대상(${where.realPath})이 CSS 파일이 아닙니다. 아무것도 쓰지 않았습니다.`);
    }
    if (w.file.endsWith(".json")) {
      JSON.parse(w.after);
    } else if (findBrandImports(w.after).filter((n) => n === plan.brand).length !== 1) {
      throw new Error(`${w.file}: 브랜드 import 가 정확히 1줄이 아닙니다`);
    }
    try {
      accessSync(w.before === null ? path.dirname(w.file) : w.file, constants.W_OK);
    } catch (err) {
      throw new Error(`${w.file} 에 쓸 수 없습니다(${errorMessage(err)}).`);
    }
  }
  const done: PlannedWrite[] = [];
  for (const w of plan.writes) {
    try {
      writeFileSync(w.file, w.after);
      done.push(w);
    } catch (err) {
      const restored: string[] = [];
      const restoreFailed: string[] = [];
      for (const d of done.reverse()) {
        try {
          if (d.before === null) unlinkSync(d.file);
          else writeFileSync(d.file, d.before);
          restored.push(d.file);
        } catch {
          restoreFailed.push(d.file);
        }
      }
      throw new ThemeApplyError(
        `${w.file} 를 쓰지 못했습니다(${errorMessage(err)}).`,
        w.file,
        restored,
        restoreFailed
      );
    }
  }
  return done.map((w) => w.file);
}
