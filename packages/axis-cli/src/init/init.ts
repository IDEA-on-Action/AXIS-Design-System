/**
 * axis init (WI-0038)
 *
 * `axis.config.json` 과 `utils.ts` 를 쓰고, `utils.ts` 가 import 하는 `clsx` · `tailwind-merge` 를
 * `package.json` 에 없을 때만 추가합니다(D1). 설치 명령은 실행하지 않고 안내만 합니다.
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

/**
 * utils.ts 가 import 하는 의존성과 추가할 범위(prd 1.5).
 * 템플릿 4종(`apps/web/templates/*` 의 package.json · template.json)과 같은 범위입니다.
 */
export const UTILS_DEPENDENCIES: Readonly<Record<string, string>> = {
  clsx: "^2.1.1",
  "tailwind-merge": "^3.4.0",
};

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
  const plan: UtilsDependencyPlan = {
    action: "no-package-json",
    added: [],
    present: [],
    installCommand,
    addCommand: addCommandFor(installCommand, UTILS_DEPENDENCIES),
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

  const missing: Record<string, string> = {};
  for (const [name, range] of Object.entries(UTILS_DEPENDENCIES)) {
    const declared = hasDependency(pkg, name);
    if (declared !== undefined) plan.present.push({ name, range: declared });
    else missing[name] = range;
  }
  plan.added = Object.keys(missing);
  plan.addCommand = addCommandFor(installCommand, plan.added.length > 0 ? missing : UTILS_DEPENDENCIES);
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

/**
 * 계획대로 `package.json` 을 씁니다. 쓰기 직전에 파일이 계획할 때와 같은지, 새 내용이 JSON 인지,
 * 실제 위치가 프로젝트 안인지 다시 확인하고, 어긋나면 쓰지 않고 오류를 던집니다.
 */
export function applyUtilsDependencies(baseDirInput: string, plan: UtilsDependencyPlan): boolean {
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
  writeFileSync(w.file, w.after);
  return true;
}

type Log = (...args: unknown[]) => void;

/** 의존성 단계의 안내 줄을 출력합니다. */
function reportDependencies(plan: UtilsDependencyPlan, log: Log) {
  const presentText = plan.present.map((p) => `${p.name} (${p.range})`).join(", ");
  if (plan.action === "add") {
    const addedText = plan.added.map((n) => `${n}@${UTILS_DEPENDENCIES[n]}`).join(", ");
    log(chalk.green(`✓ package.json dependencies 에 추가: ${addedText}`));
    if (plan.present.length > 0) log(chalk.gray(`  이미 있음(버전 유지): ${presentText}`));
    log(chalk.yellow(`  설치는 실행하지 않았습니다. 설치: ${chalk.cyan(plan.installCommand)}`));
  } else if (plan.action === "present") {
    log(chalk.green(`✓ utils.ts 의존성이 package.json 에 이미 있습니다(버전 유지): ${presentText}`));
    log(chalk.yellow(`  설치는 실행하지 않았습니다. 설치: ${chalk.cyan(plan.installCommand)}`));
  } else if (plan.action === "no-package-json") {
    log(chalk.yellow("! package.json 이 없어 utils.ts 의존성(clsx, tailwind-merge)을 추가하지 않았습니다."));
    log(chalk.yellow(`  설치: ${chalk.cyan(plan.addCommand)}`));
  } else {
    log(chalk.yellow(`! package.json 을 바꾸지 않았습니다(${plan.reason}).`));
    log(chalk.yellow(`  utils.ts 의존성 설치: ${chalk.cyan(plan.addCommand)}`));
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
    log(chalk.yellow(`  utils.ts 의존성 설치: ${chalk.cyan(plan.addCommand)}`));
    process.exitCode = 1;
    return;
  }
  reportDependencies(plan, log);

  log(chalk.blue("\n초기화 완료! 이제 다음 명령어로 컴포넌트를 추가하세요:"));
  log(chalk.cyan(`  ${INIT_NEXT_STEP_COMMAND}\n`));
}
