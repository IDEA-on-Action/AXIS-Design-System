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
import { TOKENS_PACKAGE } from "../theme/brand-core.js";
import {
  detectInstallCommand,
  formatJsonLike,
  hasDependency,
  isPlainObject,
  realPathInside,
} from "../theme/theme-add.js";
import {
  axisPackageVersionLabel,
  axisPackagesBelowTailwind4,
  componentTailwindImportLine,
  detectTailwind,
  rangeLowerAtLeast,
  TAILWIND4_COMPONENT_PACKAGES,
  TAILWIND4_MIN_AXIS_VERSION,
  TOKENS_TAILWIND4_IMPORT_LINE,
  type TailwindDetection,
} from "../template/tailwind-core.js";

// Tailwind 4 진입점을 내는 컴포넌트 패키지 목록은 axis check(B1)와 같이 쓰려고 공유 코어에 둡니다.
export { TAILWIND4_COMPONENT_PACKAGES };

// Tailwind major 판정은 WI-0042 에서 axis check 와 함께 쓰려고 공유 코어로 옮겼습니다. 기존 import 경로는 그대로 둡니다.
export {
  detectTailwind,
  tailwindMajorBounds,
  tailwindMajorFromRange,
  type TailwindDetection,
  type TailwindMajorBounds,
} from "../template/tailwind-core.js";

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
  /** Tailwind 4 이상에서는 쓰지 않습니다(설정 파일이 없음, WI-0044 FR-3). */
  tailwindConfig?: string;
  globalCss: string;
}

/** Tailwind major 가 4 이상인지. 판정 불가는 Tailwind 3 쪽(종전 동작)으로 봅니다. */
export function isTailwind4(tailwind: TailwindDetection): boolean {
  return tailwind.major !== undefined && tailwind.major >= 4;
}

/** `@axis-ds/tokens/css/tailwind4` 진입점이 처음 들어가는 `@axis-ds/tokens` 버전(WI-0044 D1, linked minor). 값은 공유 코어에 있습니다. */
export const TAILWIND4_TOKENS_VERSION = TAILWIND4_MIN_AXIS_VERSION;

/**
 * create-next-app 기본 globals.css 의 지울 블록 안내(WI-0044 보정). `docs/guides/quick-start.md` 「Tailwind CSS 4」 절의
 * 「create-next-app 기본 globals.css 와의 충돌」과 같은 내용입니다(블록 4개 · 겹치는 이름 5개 · 지움).
 */
export const TAILWIND4_CONFLICT_LINE =
  "  ! create-next-app 기본 globals.css 의 :root · @theme inline · @media (prefers-color-scheme: dark) · body 블록은 " +
  "AXIS 와 같은 이름(--background · --foreground · --color-background · --font-sans · --font-mono)을 다른 값으로 정의합니다. 이 블록들을 지우세요.";

/** package.json 을 읽기만 합니다. 없거나 읽지 못하면 `undefined`. */
function readPackageJsonSafe(baseDir: string): Record<string, unknown> | undefined {
  try {
    const text = readFileSync(path.join(baseDir, "package.json"), "utf8");
    const parsed: unknown = JSON.parse(text.startsWith(BOM) ? text.slice(1) : text);
    return isPlainObject(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Tailwind 4 프로젝트에 전역 CSS 연동을 안내하는 줄(WI-0044 FR-3). 파일은 고치지 않습니다.
 * - import 줄: `@import "tailwindcss"` · 토큰 진입점 · package.json 에 선언된 컴포넌트 패키지의 `tailwind.css`.
 *   컴포넌트 패키지가 없으면(복사 설치만 쓰면 프로젝트 소스라 스캔됨) 패키지를 쓸 때 더하라는 줄만 냅니다.
 * - create-next-app 기본 globals.css 의 `:root` · `@theme inline` · `@media (prefers-color-scheme: dark)` · `body` 블록을
 *   지우라는 주의(`TAILWIND4_CONFLICT_LINE`, quick-start 와 같은 내용).
 * - `@axis-ds/tokens` 가 package.json 에 없으면 설치 명령(theme add 와 같은 lockfile 판정).
 * - tokens · ui-react · agentic-ui 의 1.4.0 조건(A1, `axisPackagesBelowTailwind4(pkg, baseDir)`, axis check 와 같은 함수 ·
 *   같은 판정): 보정 3차부터 `baseDir` 의 설치본(node_modules) version 을 먼저 봅니다. 설치본이 1.4.0 이상이면 선언이
 *   `^1.3.0` · `catalog:` 여도 안내하지 않고, 미만이면 설치본 버전을 보여 주며 `^1.4.0` 으로 올리는 명령을 냅니다.
 *   다만 설치본 미만이어도 선언 하한을 읽을 수 없으면(`catalog:` · `npm:` · `latest` · `||` 등) 명령 대신 선언이 가리키는
 *   버전을 올리고 다시 설치하라는 줄을 냅니다(선언을 덮어쓰지 않음).
 *   설치본이 없으면 선언 하한이 1.4.0 미만일 때 `^1.4.0` 으로 올리는 명령, 하한을 읽을 수 없으면(`catalog:` · `latest` ·
 *   `||` 등) 선언을 덮어쓰지 않고 설치된 버전을 확인하라는 줄. `workspace:` 는 모노레포 링크라 안내하지 않습니다.
 *   `baseDir` 를 주지 않으면 설치본을 보지 않습니다(선언만으로 판정).
 */
export function tailwind4GuideLines(
  pkg: Record<string, unknown> | undefined,
  installCommand: string,
  globalCss: string,
  baseDir?: string
): string[] {
  const used = TAILWIND4_COMPONENT_PACKAGES.filter((name) => pkg !== undefined && hasDependency(pkg, name) !== undefined);
  const lines = [
    `Tailwind 4: 전역 CSS(${globalCss}) 맨 위에 다음 줄을 넣으세요(파일은 고치지 않았습니다).`,
    '  @import "tailwindcss";',
    `  ${TOKENS_TAILWIND4_IMPORT_LINE}`,
    ...used.map((name) => `  ${componentTailwindImportLine(name)}`),
  ];
  if (used.length === 0) {
    lines.push(
      `  npm 패키지 컴포넌트를 쓰면 그 패키지의 tailwind.css 도 넣으세요(예: @import "${TAILWIND4_COMPONENT_PACKAGES[0]}/tailwind.css";).`
    );
  }
  lines.push(TAILWIND4_CONFLICT_LINE);
  if (pkg === undefined || hasDependency(pkg, TOKENS_PACKAGE) === undefined) {
    const add = addCommandFor(installCommand, { [TOKENS_PACKAGE]: `^${TAILWIND4_TOKENS_VERSION}` });
    lines.push(`  ${TOKENS_PACKAGE} 설치: ${add}`);
  }
  // 선언된 AXIS 패키지의 1.4.0 조건(axis check 의 버전 안내와 같은 함수 · 판정, A1 · 보정 3차 설치본 우선)
  const versions = axisPackagesBelowTailwind4(pkg, baseDir);
  const unknown = versions.filter((v) => v.status === "unknown");
  const declaredOf = (list: typeof versions) => list.map(axisPackageVersionLabel).join(" · ");
  const upgradeOf = (list: typeof versions) =>
    addCommandFor(installCommand, Object.fromEntries(list.map((b) => [b.name, `^${TAILWIND4_MIN_AXIS_VERSION}`])));
  // 선언 하한으로 판정한 것은 종전 문구, 설치본으로 판정한 것은 설치본을 올리라는 문구(같은 명령 형식)
  const belowDeclared = versions.filter((v) => v.status === "below" && v.source === "declared");
  // 설치본 미만이어도 선언 하한을 읽을 수 없으면(`catalog:` · `npm:` · `latest` · `||` 등) `^1.4.0` 으로 덮어쓰는 명령을 내지 않습니다
  // (보정 2차 A1 원칙, 보정 3차 후속). pnpm catalog 참조 등을 레지스트리 범위로 바꾸지 않게 하려는 것입니다.
  const readableRange = (v: (typeof versions)[number]) => rangeLowerAtLeast(v.range, TAILWIND4_MIN_AXIS_VERSION) !== undefined;
  const installedBelow = versions.filter((v) => v.status === "below" && v.source === "installed");
  const belowInstalled = installedBelow.filter(readableRange);
  const belowInstalledOpaque = installedBelow.filter((v) => !readableRange(v));
  const installedOf = (list: typeof versions) => list.map((v) => `${v.name} ${v.installed}, 선언 ${v.range}`).join(" · ");
  if (belowDeclared.length > 0) {
    lines.push(
      `  ! Tailwind 4 진입점은 ${TAILWIND4_MIN_AXIS_VERSION} 부터 있습니다. 선언(${declaredOf(belowDeclared)})을 올리세요: ${upgradeOf(belowDeclared)}`
    );
  }
  if (belowInstalled.length > 0) {
    lines.push(
      `  ! Tailwind 4 진입점은 ${TAILWIND4_MIN_AXIS_VERSION} 부터 있습니다. 설치본(${installedOf(belowInstalled)})을 올리세요: ${upgradeOf(belowInstalled)}`
    );
  }
  if (belowInstalledOpaque.length > 0) {
    lines.push(
      `  ! Tailwind 4 진입점은 ${TAILWIND4_MIN_AXIS_VERSION} 부터 있습니다. 설치본(${installedOf(belowInstalledOpaque)})이 ${TAILWIND4_MIN_AXIS_VERSION} 미만입니다. 선언이 가리키는 버전을 ${TAILWIND4_MIN_AXIS_VERSION} 이상으로 올린 뒤 다시 설치하세요(선언은 덮어쓰지 않습니다).`
    );
  }
  if (unknown.length > 0) {
    lines.push(
      `  ! Tailwind 4 진입점은 ${TAILWIND4_MIN_AXIS_VERSION} 부터 있습니다. 선언(${declaredOf(unknown)})으로는 버전을 판정할 수 없으니 설치된 버전이 ${TAILWIND4_MIN_AXIS_VERSION} 이상인지 확인하세요.`
    );
  }
  return lines;
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

  // utils.ts 의존성 계획(D1). 파일을 쓰지 않으므로 먼저 계산해 Tailwind 판정을 config 에도 씁니다.
  const plan = planUtilsDependencies(baseDir);
  const tailwind4 = isTailwind4(plan.tailwind);

  // axis.config.json 생성. Tailwind 4 이상은 설정 파일이 없으므로 tailwindConfig 를 적지 않습니다(WI-0044 FR-3).
  const axisConfig: AxisConfig = createInitConfig(
    {
      componentsDir: answers.componentsDir,
      tailwindConfig: tailwind4 ? undefined : answers.tailwindConfig,
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

  // Tailwind 4 전역 CSS 연동 안내(WI-0044 FR-3). Tailwind 3 · 판정 불가는 출력이 종전과 같습니다.
  if (tailwind4) {
    const [head, ...rest] = tailwind4GuideLines(
      readPackageJsonSafe(baseDir),
      plan.installCommand,
      answers.globalCss,
      baseDir
    );
    log(chalk.blue(`\n${head}`));
    for (const line of rest) log(line.startsWith("  !") ? chalk.yellow(line) : chalk.cyan(line));
  }

  log(chalk.blue("\n초기화 완료! 이제 다음 명령어로 컴포넌트를 추가하세요:"));
  log(chalk.cyan(`  ${INIT_NEXT_STEP_COMMAND}\n`));
}
