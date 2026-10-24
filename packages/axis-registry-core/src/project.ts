/**
 * 프로젝트 package.json · lockfile 판정 헬퍼 (WI-0055: cli theme/theme-add.ts 에서 옮김)
 *
 * add(설치 코어) · init · theme add 가 함께 씁니다.
 */

import { existsSync, statSync } from "node:fs";
import path from "node:path";

/** 프로젝트의 lockfile 로 설치 명령을 고릅니다(없으면 pnpm). */
export function detectInstallCommand(baseDir: string): string {
  if (existsSync(path.join(baseDir, "pnpm-lock.yaml"))) return "pnpm install";
  if (existsSync(path.join(baseDir, "yarn.lock"))) return "yarn install";
  if (existsSync(path.join(baseDir, "package-lock.json"))) return "npm install";
  return "pnpm install";
}

export function hasDependency(pkg: Record<string, unknown>, name: string): string | undefined {
  for (const field of ["dependencies", "devDependencies"]) {
    const deps = pkg[field];
    if (typeof deps === "object" && deps !== null && name in deps) {
      return String((deps as Record<string, unknown>)[name]);
    }
  }
  return undefined;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * lockfile 로 고른 설치 명령(`detectInstallCommand`)에서 패키지 추가 명령을 만듭니다(WI-0038, WI-0065 에서 init 에서 옮김).
 * 범위의 `^` 가 셸에서 사라지지 않게 따옴표로 감쌉니다.
 */
export function addCommandFor(installCommand: string, deps: Readonly<Record<string, string>>): string {
  const specs = Object.entries(deps)
    .map(([name, range]) => `"${name}@${range}"`)
    .join(" ");
  if (installCommand.startsWith("yarn")) return `yarn add ${specs}`;
  if (installCommand.startsWith("npm")) return `npm install ${specs}`;
  return `pnpm add ${specs}`;
}

/**
 * 전역 CSS 후보(앞에서부터, WI-0049 D6 · WI-0065). `axis init` 의 globalCss 탐색, `axis theme add` 의 import 대상,
 * `axis check` · MCP `axis.check_project` 의 brand 항목이 이 한 목록을 씁니다(종전에는 init 기본값 · brand-core 사본이 따로 있었음).
 * create-next-app 구조(`app/` · `src/app/`)를 먼저 보고, pages 라우터 관례(`styles/`), 루트 순입니다.
 */
export const GLOBAL_CSS_CANDIDATES = [
  "app/globals.css",
  "src/app/globals.css",
  "styles/globals.css",
  "src/styles/globals.css",
  "globals.css",
] as const;

/** Tailwind 3 이하 설정 파일 이름(앞에서부터). init 의 tailwindConfig 탐색이 씁니다(WI-0049 D6). */
export const TAILWIND_CONFIG_CANDIDATES = [
  "tailwind.config.ts",
  "tailwind.config.js",
  "tailwind.config.mjs",
  "tailwind.config.cjs",
] as const;

function isFile(file: string): boolean {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

function isDirectory(dir: string): boolean {
  try {
    return statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

/** 후보 가운데 실제로 있는 첫 파일(`baseDir` 기준 상대 경로, `/` 구분). 없으면 `undefined`. */
export function findFirstFile(baseDir: string, candidates: readonly string[]): string | undefined {
  return candidates.find((c) => isFile(path.join(baseDir, c)));
}

/** init 이 기록할 경로를 어떻게 정했는지(안내 문구용) */
export type ProjectPathSource = "found" | "default";

export interface ProjectPathDefaults {
  /** `./src/components/ui`(src/ 가 있음) 또는 `./components/ui` */
  componentsDir: string;
  /** 찾은 전역 CSS(`./app/globals.css` 등) 또는 기본값 */
  globalCss: string;
  globalCssSource: ProjectPathSource;
  /** 찾은 Tailwind 설정 파일 또는 기본값 `./tailwind.config.ts` */
  tailwindConfig: string;
  tailwindConfigSource: ProjectPathSource;
}

/**
 * src 유무 · 실재 파일로 init 의 경로 기본값을 정합니다(WI-0049 D6). 파일을 쓰지 않습니다.
 * - componentsDir: `src/` 디렉터리가 있으면 `./src/components/ui`, 없으면 `./components/ui`(src/ 를 새로 만들지 않음)
 * - globalCss: `GLOBAL_CSS_CANDIDATES` 가운데 있는 첫 파일. 없으면 src 유무로 `./src/app/globals.css` · `./app/globals.css`
 * - tailwindConfig: 있는 `tailwind.config.{ts,js,mjs,cjs}` 가운데 첫 파일. 없으면 `./tailwind.config.ts`
 */
export function detectProjectPaths(baseDirInput: string): ProjectPathDefaults {
  const baseDir = path.resolve(baseDirInput);
  const hasSrc = isDirectory(path.join(baseDir, "src"));
  const css = findFirstFile(baseDir, GLOBAL_CSS_CANDIDATES);
  const tw = findFirstFile(baseDir, TAILWIND_CONFIG_CANDIDATES);
  return {
    componentsDir: hasSrc ? "./src/components/ui" : "./components/ui",
    globalCss: css !== undefined ? `./${css}` : hasSrc ? "./src/app/globals.css" : "./app/globals.css",
    globalCssSource: css !== undefined ? "found" : "default",
    tailwindConfig: tw !== undefined ? `./${tw}` : "./tailwind.config.ts",
    tailwindConfigSource: tw !== undefined ? "found" : "default",
  };
}

/** `baseDir` 기준 경로가 실제 파일인지(설정 값 보존 판정, WI-0041 D5) */
export function projectFileExists(baseDir: string, relPath: string): boolean {
  return isFile(path.resolve(baseDir, relPath));
}
