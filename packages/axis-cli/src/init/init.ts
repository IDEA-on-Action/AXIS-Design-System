/**
 * axis init (WI-0038)
 *
 * `axis.config.json` 과 `utils.ts` 를 쓰고, `utils.ts` 가 import 하는 `clsx` · `tailwind-merge` 를
 * `package.json` 에 없을 때만 추가합니다(D1). 설치 명령은 실행하지 않고 안내만 합니다.
 * `tailwind-merge` 범위는 프로젝트의 Tailwind 버전으로 고릅니다(E2, `selectUtilsDependencies`).
 * JSON 포맷 보존 · 설치 명령 선택 · 쓰기 안전성은 theme add(WI-0028)의 함수를 그대로 씁니다.
 */

import { accessSync, constants, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import chalk from "chalk";
import fs from "fs-extra";
import { createInitConfig, type AxisConfig } from "../config/axis-config.js";
import {
  detectInstallCommand,
  formatJsonLike,
  hasDependency,
  isPlainObject,
  realPathInside,
} from "../theme/theme-add.js";

/** utils.ts 가 import 하는 `clsx` 의 범위(prd 1.5). Tailwind 버전과 관계없습니다. */
export const CLSX_RANGE = "^2.1.1";

/**
 * Tailwind major 별 `tailwind-merge` 범위(prd 1.6, 2026-10-19 사용자 결정 E2 · F1).
 * - Tailwind 4 이상: `^3.4.0`. tailwind-merge 3.x 가 Tailwind 4 를 대상으로 합니다(F1 로 `4` 만이 아니라 `4 이상`).
 * - Tailwind 3 이하: `^2.6.0`. tailwind-merge 2.x 가 Tailwind 3 을 대상으로 합니다. npm `tailwind-merge-2`
 *   태그가 2.6.1(2026-10-19 `npm view`)이고 2.x 의 마지막 minor 가 2.6 이라 `^2.6.0` 이 그 최신을 받습니다.
 * 템플릿 4종(`apps/web/templates/*`)은 이 범위의 근거가 아닙니다. 템플릿은 `tailwindcss ^3.4.0`(Tailwind 3)에
 * `tailwind-merge ^3.4.0` 을 함께 선언해 이 규칙과 어긋나고, 그 불일치는 WI-0037(#119)에서 다룹니다
 * (init.test.ts 에 알려진 불일치로 고정).
 */
export const TAILWIND_MERGE_RANGES = {
  tailwind4: "^3.4.0",
  tailwind3: "^2.6.0",
} as const;

/** Tailwind 버전을 어디서 판정했는지 */
export interface TailwindDetection {
  /** 판정한 major. 판정하지 못하면 없음 */
  major?: number;
  /** `installed`: node_modules 설치본 · `declared`: package.json 선언 범위 · `none`: 판정 불가 */
  source: "installed" | "declared" | "none";
  /** 판정에 쓴 값(설치본 version 이나 선언 범위). 선언은 있으나 판정하지 못한 범위도 담습니다. */
  value?: string;
  /** 설치본으로 판정했는데 선언 범위의 major 가 다를 때 그 선언(F1 (b)) */
  mismatch?: { declared: string; declaredMajor: number };
}

/** 버전 하나(`4` · `4.1` · `4.1.0` · `v4` · `3.4.x` · `4.0.0-beta.1`). 1번 그룹이 major 입니다. */
const VERSION = String.raw`v?(\d+)(?:\.(?:\d+|[xX*])){0,2}(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?`;

/**
 * 버전 하나에서 major 를 읽습니다. `0.0.0-insiders.<hash>` 같은 `0.0.0-*` 은 실제 버전이 아닌 자리표시라
 * major 로 읽지 않습니다(F1 (a)).
 */
function majorOfVersionToken(token: string): number | undefined {
  const m = new RegExp(`^${VERSION}$`).exec(token);
  if (!m) return undefined;
  if (/^v?0\.0\.0-/.test(token)) return undefined;
  return Number(m[1]);
}

/**
 * 선언 범위에서 Tailwind major 를 읽습니다(prd 1.6, F1 (a)).
 * 1. 하나의 major 로 정해지는 단순 형태: `4` · `4.1` · `4.1.0` · `^4` · `^4.1.0` · `~3.4` · `=3.4.17` · `v4` · `4.x` · `3.4.0-beta.1`.
 * 2. 그렇지 않으면 하한의 major: `>=4` · `>=4.0.0` · `>4` → 4, `>=3.4 <4` → 3, 하이픈 범위 `4 - 4.2` → 4.
 *    비교자가 여럿이면 하한 중 가장 높은 것(실제로 걸리는 하한)을 씁니다.
 * 3. 그래도 읽을 수 없으면 `undefined`: 하한이 없음(`<4` · `*`), `||` 로 여러 범위를 고름(`^3 || ^4`, 하한이 하나로
 *    정해지지 않음), `catalog:` · `workspace:*` · `latest` · `0.0.0-insiders.*` · `npm:...` · git · 파일 경로.
 */
export function tailwindMajorFromRange(range: string): number | undefined {
  const r = range.trim();
  if (r === "" || r.includes("||")) return undefined;
  const simple = new RegExp(`^(?:\\^|~|=)?\\s*(${VERSION})$`).exec(r);
  if (simple) return majorOfVersionToken(simple[1]);
  const hyphen = new RegExp(`^(${VERSION})\\s+-\\s+(${VERSION})$`).exec(r);
  if (hyphen) return majorOfVersionToken(hyphen[1]);
  // 비교자 집합: `>=3.4 <4`, `>= 4` 처럼 연산자 뒤 공백도 받습니다.
  const tokens = r.replace(/(>=|<=|>|<|=)\s+/g, "$1").split(/\s+/);
  const lowers: number[] = [];
  for (const t of tokens) {
    const c = /^(>=|<=|>|<|=)(.+)$/.exec(t);
    if (!c) return undefined;
    const major = majorOfVersionToken(c[2]);
    if (major === undefined) return undefined;
    if (c[1] !== "<" && c[1] !== "<=") lowers.push(major);
  }
  return lowers.length > 0 ? Math.max(...lowers) : undefined;
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
 *    선언 범위의 major 를 읽을 수 있고 설치본과 다르면 `mismatch` 에 담습니다(F1 (b), 경고 줄은 `tailwindWarnings`).
 * 2. 선언 범위: `package.json` 의 `dependencies` 다음 `devDependencies` 의 `tailwindcss`. `tailwindMajorFromRange` 로 읽습니다.
 * 3. 판정 불가: 둘 다 없거나 읽지 못하면 `source: "none"`(기본값은 `selectUtilsDependencies` 가 정함).
 */
export function detectTailwind(baseDirInput: string, pkg?: Record<string, unknown>): TailwindDetection {
  const baseDir = path.resolve(baseDirInput);
  const installedFile = path.join(baseDir, "node_modules", "tailwindcss", "package.json");
  const declared = pkg ? hasDependency(pkg, "tailwindcss") : undefined;
  const declaredMajor = declared !== undefined ? tailwindMajorFromRange(declared) : undefined;
  try {
    const installed: unknown = JSON.parse(readFileSync(installedFile, "utf8"));
    const version = isPlainObject(installed) ? installed.version : undefined;
    const major = majorFromVersion(version);
    if (major !== undefined) {
      const found: TailwindDetection = { major, source: "installed", value: String(version) };
      if (declared !== undefined && declaredMajor !== undefined && declaredMajor !== major) {
        found.mismatch = { declared, declaredMajor };
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

/**
 * 추가할 범위를 고릅니다. Tailwind major 가 4 이상이면 `tailwind-merge ^3.4.0`, 3 이하와 판정 불가는
 * `^2.6.0` 입니다(F1 (c)). 판정 불가의 기본값을 Tailwind 3 쪽으로 둔 것은 사용자 결정(E2: 「3 이거나 없으면 ^2.6.0」)입니다.
 */
export function selectUtilsDependencies(tailwind: TailwindDetection): Record<string, string> {
  return {
    clsx: CLSX_RANGE,
    "tailwind-merge":
      tailwind.major !== undefined && tailwind.major >= 4
        ? TAILWIND_MERGE_RANGES.tailwind4
        : TAILWIND_MERGE_RANGES.tailwind3,
  };
}

/**
 * `tailwind-merge` 범위 판정의 경고 줄(F1). 근거 줄과 같은 때(`tailwind-merge` 를 추가하거나 안내할 때)에 냅니다.
 * - 선언은 있으나 major 를 읽지 못함(`catalog:` · `workspace:*` · `latest` · `0.0.0-insiders.*` 등): 기본값을 썼다는 경고
 * - 설치본과 선언 범위의 major 가 다름: 설치본을 따랐고 설치 뒤 다시 확인하라는 경고
 * tailwindcss 를 아예 찾지 못한 경우는 근거 줄(`tailwindcss 를 찾지 못해 기본값`)만 냅니다.
 */
export function tailwindWarnings(tailwind: TailwindDetection, installCommand: string): string[] {
  const out: string[] = [];
  if (tailwind.source === "none" && tailwind.value !== undefined) {
    out.push(
      `! tailwindcss 선언(${tailwind.value})은 판정 불가 - 기본값 사용(Tailwind 3, tailwind-merge ${TAILWIND_MERGE_RANGES.tailwind3}). ` +
        `Tailwind 4 이상이면 tailwind-merge 를 ${TAILWIND_MERGE_RANGES.tailwind4} 으로 바꾸세요.`
    );
  }
  if (tailwind.mismatch) {
    out.push(
      `! 설치본 tailwindcss ${tailwind.value}(major ${tailwind.major})와 package.json 선언 ${tailwind.mismatch.declared}` +
        `(major ${tailwind.mismatch.declaredMajor})가 다름 - 설치본을 따랐습니다. ${installCommand} 뒤 tailwind-merge 범위를 다시 확인하세요.`
    );
  }
  return out;
}

/** `tailwind-merge` 범위를 고른 근거 한 줄 */
export function describeTailwindBasis(tailwind: TailwindDetection): string {
  if (tailwind.source === "installed") return `설치된 tailwindcss ${tailwind.value}`;
  if (tailwind.source === "declared") return `package.json 의 tailwindcss ${tailwind.value}`;
  if (tailwind.value !== undefined) {
    return `package.json 의 tailwindcss ${tailwind.value} 로 버전을 판정하지 못해 기본값(Tailwind 3)`;
  }
  return "tailwindcss 를 찾지 못해 기본값(Tailwind 3)";
}

/** init 이 쓰는 utils.ts 내용(c131ee9 과 같음) */
export const UTILS_TS_CONTENT = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

/** `-y` 기본값 */
export const INIT_DEFAULTS = {
  componentsDir: "./src/components/ui",
  tailwindConfig: "./tailwind.config.ts",
  globalCss: "./src/app/globals.css",
} as const;

/** 컴포넌트 추가 안내(D2: 우리 패키지 이름 `@axis-ds/cli`) */
export const INIT_NEXT_STEP_COMMAND = "npx @axis-ds/cli add button";

export interface InitAnswers {
  componentsDir: string;
  tailwindConfig: string;
  globalCss: string;
}

export interface UtilsDependencyPlan {
  /**
   * `add`: dependencies 에 더함 · `present`: 모두 이미 있음 ·
   * `no-package-json`: 파일이 없음 · `unwritable`: 읽거나 쓸 수 없어 건너뜀
   */
  action: "add" | "present" | "no-package-json" | "unwritable";
  /** 추가할 의존성 이름 */
  added: string[];
  /** 고른 범위(`clsx` · `tailwind-merge`). 추가 · 안내 명령에 씁니다. */
  ranges: Record<string, string>;
  /** `tailwind-merge` 범위를 고른 근거 */
  tailwind: TailwindDetection;
  /** 이미 있던 의존성과 선언된 범위(바꾸지 않음) */
  present: { name: string; range: string }[];
  /** `unwritable` 의 이유 */
  reason?: string;
  /** lockfile 로 고른 설치 명령(예: `pnpm install`) */
  installCommand: string;
  /** package.json 을 쓰지 않을 때 안내하는 추가 명령(예: `pnpm add "clsx@^2.1.1" ...`) */
  addCommand: string;
  /** 쓸 내용. `add` 일 때만 있습니다. */
  write?: { file: string; before: string; after: string };
}

const BOM = "﻿";

/** lockfile 로 고른 설치 명령에서 패키지 추가 명령을 만듭니다. 범위의 `^` 가 셸에서 사라지지 않게 따옴표로 감쌉니다. */
export function addCommandFor(installCommand: string, deps: Readonly<Record<string, string>>): string {
  const specs = Object.entries(deps)
    .map(([name, range]) => `"${name}@${range}"`)
    .join(" ");
  if (installCommand.startsWith("yarn")) return `yarn add ${specs}`;
  if (installCommand.startsWith("npm")) return `npm install ${specs}`;
  return `pnpm add ${specs}`;
}

/** 바꿀 내용을 계산합니다. 파일을 쓰지 않습니다. */
export function planUtilsDependencies(baseDirInput: string): UtilsDependencyPlan {
  const baseDir = path.resolve(baseDirInput);
  const installCommand = detectInstallCommand(baseDir);
  // package.json 을 읽기 전 판정(설치본 또는 판정 불가). 없거나 읽지 못하면 이 범위로 안내합니다.
  const tailwind0 = detectTailwind(baseDir);
  const ranges0 = selectUtilsDependencies(tailwind0);
  const plan: UtilsDependencyPlan = {
    action: "no-package-json",
    added: [],
    present: [],
    ranges: ranges0,
    tailwind: tailwind0,
    installCommand,
    addCommand: addCommandFor(installCommand, ranges0),
  };

  const pkgFile = path.join(baseDir, "package.json");
  if (!existsSync(pkgFile)) return plan;

  const unwritable = (reason: string): UtilsDependencyPlan => ({ ...plan, action: "unwritable", reason });

  // 쓰기 대상은 프로젝트 안 파일만(밖을 가리키는 심볼릭 링크는 건드리지 않음)
  let where: { inside: boolean; realPath: string };
  try {
    where = realPathInside(baseDir, pkgFile);
  } catch (err) {
    return unwritable((err as Error).message);
  }
  if (!where.inside) return unwritable(`실제 위치(${where.realPath})가 프로젝트 디렉터리 밖입니다`);

  let text: string;
  try {
    text = readFileSync(pkgFile, "utf8");
  } catch (err) {
    return unwritable((err as Error).message);
  }
  // BOM 은 떼고 파싱한 뒤 결과 맨 앞에 다시 붙입니다.
  const bom = text.startsWith(BOM) ? BOM : "";
  const body = bom ? text.slice(1) : text;

  let pkg: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(body);
    if (!isPlainObject(parsed)) throw new Error("최상위가 객체가 아닙니다");
    pkg = parsed;
  } catch (err) {
    return unwritable(`JSON 을 읽을 수 없습니다: ${(err as Error).message}`);
  }

  plan.tailwind = detectTailwind(baseDir, pkg);
  plan.ranges = selectUtilsDependencies(plan.tailwind);
  plan.addCommand = addCommandFor(installCommand, plan.ranges);

  const missing: Record<string, string> = {};
  for (const [name, range] of Object.entries(plan.ranges)) {
    const declared = hasDependency(pkg, name);
    if (declared !== undefined) plan.present.push({ name, range: declared });
    else missing[name] = range;
  }
  plan.added = Object.keys(missing);
  plan.addCommand = addCommandFor(installCommand, plan.added.length > 0 ? missing : plan.ranges);
  if (plan.added.length === 0) return { ...plan, action: "present" };

  if (pkg.dependencies !== undefined && !isPlainObject(pkg.dependencies)) {
    return unwritable("dependencies 가 객체가 아닙니다");
  }
  try {
    accessSync(pkgFile, constants.W_OK);
  } catch (err) {
    return unwritable(`쓸 수 없습니다(${(err as Error).message})`);
  }

  const deps = { ...((pkg.dependencies as Record<string, unknown> | undefined) ?? {}), ...missing };
  const after = bom + formatJsonLike(body, { ...pkg, dependencies: deps });
  return { ...plan, action: "add", write: { file: pkgFile, before: text, after } };
}

/** 파일 쓰기 함수. 테스트에서 쓰기 실패를 주입할 때만 바꿉니다. */
export type WriteFileFn = (file: string, data: string) => void;

const defaultWriteFile: WriteFileFn = (file, data) => writeFileSync(file, data);

/**
 * 계획대로 `package.json` 을 씁니다. 쓰기 직전에 파일이 계획할 때와 같은지, 새 내용이 JSON 인지,
 * 실제 위치가 프로젝트 안인지 다시 확인하고, 어긋나면 쓰지 않고 오류를 던집니다.
 *
 * `writeFileSync` 는 파일을 비운 뒤 쓰므로 쓰는 도중 실패하면(ENOSPC · EIO · EFBIG 등) 파일이 잘린 채
 * 남습니다. 그때는 계획 때 읽은 원래 내용(`plan.write.before`)으로 되돌리고, 되돌린 결과를 오류 메시지에
 * 담아 던집니다.
 */
export function applyUtilsDependencies(
  baseDirInput: string,
  plan: UtilsDependencyPlan,
  writeFile: WriteFileFn = defaultWriteFile
): boolean {
  const w = plan.write;
  if (plan.action !== "add" || !w) return false;
  const baseDir = path.resolve(baseDirInput);
  const current = existsSync(w.file) ? readFileSync(w.file, "utf8") : null;
  if (current !== w.before) {
    throw new Error(`${w.file} 이 계획 뒤에 바뀌었습니다. 다시 실행하세요.`);
  }
  const where = realPathInside(baseDir, w.file);
  if (!where.inside) {
    throw new Error(`${w.file} 의 실제 위치(${where.realPath})가 프로젝트 디렉터리 밖입니다. 쓰지 않았습니다.`);
  }
  JSON.parse(w.after.startsWith(BOM) ? w.after.slice(1) : w.after);
  try {
    writeFile(w.file, w.after);
  } catch (err) {
    const cause = (err as Error).message;
    let restored: string;
    try {
      writeFile(w.file, w.before);
      if (readFileSync(w.file, "utf8") !== w.before) throw new Error("되돌린 내용이 원래 내용과 다릅니다");
      restored = "원래 내용으로 되돌렸습니다";
    } catch (restoreErr) {
      restored =
        `원래 내용으로 되돌리지 못했습니다(${(restoreErr as Error).message}). ` +
        "파일이 잘렸거나 비었을 수 있으니 버전 관리 도구 등으로 복구하세요";
    }
    throw new Error(`${w.file} 을 쓰는 도중 실패했습니다(${cause}). ${restored}.`);
  }
  return true;
}

type Log = (...args: unknown[]) => void;

/** 의존성 단계의 안내 줄을 출력합니다. */
function reportDependencies(plan: UtilsDependencyPlan, log: Log) {
  const presentText = plan.present.map((p) => `${p.name} (${p.range})`).join(", ");
  const basis = `  tailwind-merge 범위 기준: ${describeTailwindBasis(plan.tailwind)}`;
  // 근거 줄과 그 판정의 경고 줄(F1)
  const logBasis = () => {
    log(chalk.gray(basis));
    for (const w of tailwindWarnings(plan.tailwind, plan.installCommand)) log(chalk.yellow(`  ${w}`));
  };
  if (plan.action === "add") {
    const addedText = plan.added.map((n) => `${n}@${plan.ranges[n]}`).join(", ");
    log(chalk.green(`✓ package.json dependencies 에 추가: ${addedText}`));
    if (plan.present.length > 0) log(chalk.gray(`  이미 있음(버전 유지): ${presentText}`));
    if (plan.added.includes("tailwind-merge")) logBasis();
    log(chalk.yellow(`  설치는 실행하지 않았습니다. 설치: ${chalk.cyan(plan.installCommand)}`));
  } else if (plan.action === "present") {
    log(chalk.green(`✓ utils.ts 의존성이 package.json 에 이미 있습니다(버전 유지): ${presentText}`));
    log(chalk.yellow(`  설치는 실행하지 않았습니다. 설치: ${chalk.cyan(plan.installCommand)}`));
  } else if (plan.action === "no-package-json") {
    log(chalk.yellow("! package.json 이 없어 utils.ts 의존성(clsx, tailwind-merge)을 추가하지 않았습니다."));
    log(chalk.yellow(`  설치: ${chalk.cyan(plan.addCommand)}`));
    logBasis();
  } else {
    log(chalk.yellow(`! package.json 을 바꾸지 않았습니다(${plan.reason}).`));
    log(chalk.yellow(`  utils.ts 의존성 설치: ${chalk.cyan(plan.addCommand)}`));
    if (plan.addCommand.includes('"tailwind-merge@')) logBasis();
  }
}

/**
 * init 을 실행합니다. 쓰기 실패는 rc 1(`process.exitCode`)로 알립니다.
 * 설치 명령은 실행하지 않습니다.
 */
export async function runInit(
  baseDirInput: string,
  answers: InitAnswers,
  registryUrl: string,
  log: Log = console.log
): Promise<void> {
  const baseDir = path.resolve(baseDirInput);

  // axis.config.json 생성
  const axisConfig: AxisConfig = createInitConfig(
    {
      componentsDir: answers.componentsDir,
      tailwindConfig: answers.tailwindConfig,
      globalCss: answers.globalCss,
    },
    registryUrl
  );

  await fs.writeJSON(path.join(baseDir, "axis.config.json"), axisConfig, { spaces: 2 });
  log(chalk.green("✓ axis.config.json 생성 완료"));

  // utils.ts 생성
  const utilsPath = path.resolve(baseDir, answers.componentsDir, "utils.ts");
  await fs.ensureDir(path.dirname(utilsPath));
  await fs.writeFile(utilsPath, UTILS_TS_CONTENT);
  log(chalk.green("✓ utils.ts 생성 완료"));

  // utils.ts 의존성(D1)
  const plan = planUtilsDependencies(baseDir);
  try {
    applyUtilsDependencies(baseDir, plan);
  } catch (err) {
    log(chalk.red(`✗ package.json 을 쓰지 못했습니다: ${(err as Error).message}`));
    log(chalk.yellow("  axis.config.json 과 utils.ts 는 이미 만들어졌습니다."));
    log(chalk.yellow(`  utils.ts 의존성 설치: ${chalk.cyan(plan.addCommand)}`));
    process.exitCode = 1;
    return;
  }
  reportDependencies(plan, log);

  log(chalk.blue("\n초기화 완료! 이제 다음 명령어로 컴포넌트를 추가하세요:"));
  log(chalk.cyan(`  ${INIT_NEXT_STEP_COMMAND}\n`));
}
