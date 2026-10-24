/**
 * 프로젝트 package.json · lockfile 판정 헬퍼 (WI-0055: cli theme/theme-add.ts 에서 옮김)
 *
 * add(설치 코어) · init · theme add 가 함께 씁니다.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
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

/**
 * 루트 레이아웃 후보(앞에서부터, WI-0065 D8 에서 brand-core 에 만든 목록을 WI-0070 에서 옮김).
 * brand.activation(브랜드를 켜는 코드)과 globals.css 항목(레이아웃의 tokens CSS JS import)이 같은 목록을 씁니다.
 */
export const ROOT_LAYOUT_FILES = [
  "app/layout.tsx",
  "app/layout.jsx",
  "app/layout.js",
  "src/app/layout.tsx",
  "src/app/layout.jsx",
  "src/app/layout.js",
  "pages/_app.tsx",
  "pages/_app.jsx",
  "pages/_document.tsx",
  "pages/_document.jsx",
  "src/pages/_app.tsx",
  "src/pages/_app.jsx",
  "src/pages/_document.tsx",
  "src/pages/_document.jsx",
] as const;

// ---------------------------------------------------------------------------------------------------------------------
// 설치본 판독 (WI-0051 · WI-0068 · WI-0072 공용)

/** 설치본 하나 */
export interface InstalledPackage {
  /** 패키지 디렉터리(절대 경로) */
  dir: string;
  /** package.json 의 정확한 version(`1.6.2` · `1.7.0-beta.1`). 없거나 정확한 버전이 아니면 `undefined` */
  version?: string;
}

/** 정확한 버전(`1.4.2` · `1.4.0-beta.1`)이면 그대로, 아니면 `undefined`. `0.0.0-*` 은 읽지 않습니다. */
export function exactVersionOf(version: unknown): string | undefined {
  if (typeof version !== "string") return undefined;
  const v = version.trim();
  if (!/^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(v) || /^v?0\.0\.0-/.test(v)) return undefined;
  return v;
}

/**
 * `baseDir` 부터 상위 디렉터리로 거슬러 올라가며 `node_modules/<name>/package.json` 을 찾습니다(Node 의 패키지 탐색 방향).
 * - `require.resolve("<name>/package.json")` 를 쓰지 않습니다: exports 에 `./package.json` 이 없는 패키지(`@axis-ds/tokens` 실측
 *   ERR_PACKAGE_PATH_NOT_EXPORTED)에서 실패하기 때문입니다.
 * - 모노레포 호이스팅(설치본이 상위 node_modules 에 있음)도 찾습니다. pnpm 의 심볼릭 링크는 그대로 따라 읽습니다.
 * - Plug'n'Play(`.pnp.cjs`)처럼 node_modules 가 없는 설치는 찾지 못합니다. 판정하는 쪽이 `isPnpProject` 로 먼저 가릅니다.
 * 찾지 못하면 `undefined` 입니다.
 */
export function findInstalledPackage(baseDirInput: string, name: string): InstalledPackage | undefined {
  let dir = path.resolve(baseDirInput);
  for (;;) {
    const pkgDir = path.join(dir, "node_modules", ...name.split("/"));
    const file = path.join(pkgDir, "package.json");
    if (isFile(file)) {
      let version: string | undefined;
      try {
        const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
        version = isPlainObject(parsed) ? exactVersionOf(parsed.version) : undefined;
      } catch {
        version = undefined;
      }
      return { dir: pkgDir, version };
    }
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/** Plug'n'Play 설치인지(`baseDir` 부터 상위로 `.pnp.cjs` · `.pnp.js` 를 찾음). 이때는 node_modules 로 설치본을 판정하지 않습니다. */
export function isPnpProject(baseDirInput: string): boolean {
  let dir = path.resolve(baseDirInput);
  for (;;) {
    if (isFile(path.join(dir, ".pnp.cjs")) || isFile(path.join(dir, ".pnp.js"))) return true;
    const parent = path.dirname(dir);
    if (parent === dir) return false;
    dir = parent;
  }
}

/**
 * 버전 비교(a < b 이면 음수, 같으면 0). 정확한 버전만 받습니다(`exactVersionOf`). 읽지 못하면 `undefined`.
 * core 가 같으면 prerelease 가 낮습니다(`1.7.0-beta.1` < `1.7.0`).
 */
export function compareExactVersions(a: string, b: string): number | undefined {
  const parse = (v: string) => {
    const m = /^v?(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?/.exec(v.trim());
    return m ? { core: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] !== undefined } : undefined;
  };
  const x = parse(a);
  const y = parse(b);
  if (!x || !y) return undefined;
  for (let i = 0; i < 3; i++) if (x.core[i] !== y.core[i]) return x.core[i] - y.core[i];
  return Number(y.pre) - Number(x.pre);
}
