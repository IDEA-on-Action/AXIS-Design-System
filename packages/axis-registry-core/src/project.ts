/**
 * 프로젝트 package.json · lockfile 판정 헬퍼 (WI-0055: cli theme/theme-add.ts 에서 옮김)
 *
 * add(설치 코어) · init · theme add 가 함께 씁니다.
 */

import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";

/**
 * 공개 함수 진입부에서 한 번 쓰는 기준 디렉터리(WI-0086). `path.resolve` 한 뒤 심볼릭 링크를 풀어 실경로로 맞춥니다.
 * 앱 디렉터리 자체를 가리키는 링크(`--dir <링크>` · MCP `targetDir`)를 주면 종전에는 링크가 놓인 쪽 상위를 올라가
 * 워크스페이스 루트 · 설치본을 찾지 못했습니다. 실경로가 없으면(ENOENT 등) 종전처럼 `path.resolve` 결과를 씁니다.
 * - 찾은 설치본 디렉터리(`findInstalledPackage` 의 `dir`)는 풀지 않습니다. 풀면 pnpm 기본 레이아웃의 `.pnpm` 스토어 경로가
 *   content 제안 문구로 새어 나옵니다(브리프 사전 실측 M3).
 * - 메시지에 찍는 경로는 이 값이 아니라 호출한 쪽이 받은 입력 경로를 씁니다.
 */
export function resolveBaseDir(baseDirInput: string): string {
  const resolved = path.resolve(baseDirInput);
  try {
    return realpathSync(resolved);
  } catch {
    return resolved;
  }
}

/** lockfile 과 설치 명령(앞에서부터, 같은 층에 여럿이면 앞의 것) */
const LOCKFILE_COMMANDS = [
  ["pnpm-lock.yaml", "pnpm install"],
  ["yarn.lock", "yarn install"],
  ["package-lock.json", "npm install"],
] as const;

function lockfileCommandAt(dir: string): string | undefined {
  return LOCKFILE_COMMANDS.find(([file]) => existsSync(path.join(dir, file)))?.[1];
}

/** 워크스페이스 루트 표지: `pnpm-workspace.yaml`, 또는 package.json 의 `workspaces`(배열 또는 `{ packages: 배열 }`) */
function isWorkspaceRootDir(dir: string): boolean {
  if (isFile(path.join(dir, "pnpm-workspace.yaml"))) return true;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
  } catch {
    return false;
  }
  if (!isPlainObject(parsed)) return false;
  const ws = parsed.workspaces;
  return Array.isArray(ws) || (isPlainObject(ws) && Array.isArray(ws.packages));
}

/**
 * `baseDir` 부터 상위로 올라가며 가장 가까운 워크스페이스 루트(`pnpm-workspace.yaml` 또는 package.json `workspaces`)를 찾습니다(WI-0081).
 * - 같은 층에서는 워크스페이스 표지를 먼저 봅니다(보통의 저장소 루트는 `.git` 과 표지가 함께 있음).
 * - 표지보다 먼저 `.git`(디렉터리 또는 서브모듈의 파일형 gitdir)이 나오면 거기서 멈추고 `undefined` 입니다. 다른 저장소의 루트를
 *   이 앱의 소유자로 보지 않기 위해서예요.
 * - `baseDir` 자신이 워크스페이스 루트면 `baseDir` 입니다.
 * - 글롭이 실제로 앱을 포함하는지(멤버십)는 보지 않습니다(배치 6b 결정, 잔여 오차로 기록).
 * lockfile 판정(`detectInstallCommand`) · 의존성 선언 판정(dependencies-core)이 함께 씁니다. 설치본 탐색(`findInstalledPackage`)은
 * Node 해석 방향이라 이 경계를 쓰지 않습니다.
 */
export function findWorkspaceRoot(baseDirInput: string): string | undefined {
  let dir = resolveBaseDir(baseDirInput);
  for (;;) {
    if (isWorkspaceRootDir(dir)) return dir;
    if (existsSync(path.join(dir, ".git"))) return undefined;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/** package.json `packageManager`(Corepack 형식 `<이름>@<버전>`)의 이름과 설치 명령. 이 셋 밖의 이름(bun 등)은 모르는 이름이라 무시합니다(WI-0085) */
const PACKAGE_MANAGER_COMMANDS: Readonly<Record<string, string>> = {
  pnpm: "pnpm install",
  yarn: "yarn install",
  npm: "npm install",
};

/** `dir/package.json` 의 `packageManager` 로 고른 설치 명령. 없거나 문자열이 아니거나 모르는 이름 · 깨진 JSON 이면 `undefined` */
function packageManagerCommandAt(dir: string): string | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
  } catch {
    return undefined;
  }
  if (!isPlainObject(parsed) || typeof parsed.packageManager !== "string") return undefined;
  const name = /^(pnpm|yarn|npm)@/.exec(parsed.packageManager.trim())?.[1];
  return name !== undefined ? PACKAGE_MANAGER_COMMANDS[name] : undefined;
}

/**
 * 프로젝트의 lockfile · `packageManager` 로 설치 명령을 고릅니다(WI-0081 · WI-0085).
 * 순서(앞에서 정해지면 끝):
 * 1. 앱 층(`baseDir`) lockfile
 * 2. `findWorkspaceRoot` 로 찾은 워크스페이스 루트 층 lockfile(그 사이 층은 보지 않음)
 * 3. 앱 층 package.json `packageManager`
 * 4. 같은 워크스페이스 루트 층 package.json `packageManager`
 * 5. 종전 기본값 pnpm
 * lockfile 은 실제로 쓴 도구의 흔적이라 선언(`packageManager`)보다 먼저예요. `packageManager` 는 lockfile 이 없을 때만 보고(배치 6c 결정,
 * 배치 6b 에서는 보지 않았음), 경계는 lockfile 과 같아요(워크스페이스가 아닌 상위 · `.git` 너머는 보지 않음). 모르는 이름(bun 등)은 무시합니다.
 */
export function detectInstallCommand(baseDirInput: string): string {
  // 실경로로 맞춰야 아래 `root !== baseDir` 비교가 링크 경로에서도 맞습니다(findWorkspaceRoot 도 실경로를 돌려줌, WI-0086)
  const baseDir = resolveBaseDir(baseDirInput);
  const own = lockfileCommandAt(baseDir);
  if (own !== undefined) return own;
  const found = findWorkspaceRoot(baseDir);
  const root = found !== undefined && found !== baseDir ? found : undefined;
  if (root !== undefined) {
    const fromRoot = lockfileCommandAt(root);
    if (fromRoot !== undefined) return fromRoot;
  }
  const ownManager = packageManagerCommandAt(baseDir);
  if (ownManager !== undefined) return ownManager;
  if (root !== undefined) {
    const rootManager = packageManagerCommandAt(root);
    if (rootManager !== undefined) return rootManager;
  }
  return "pnpm install";
}

/** 설치 명령(`pnpm install` 등) 또는 그것으로 만든 명령이 가리키는 패키지 매니저(접두로 판정, 모르면 pnpm) */
export type PackageManagerName = "pnpm" | "yarn" | "npm";

export function packageManagerOf(command: string): PackageManagerName {
  if (command.startsWith("yarn")) return "yarn";
  if (command.startsWith("npm")) return "npm";
  return "pnpm";
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

/** 의존성 선언 하나와 그 출처(WI-0086) */
export interface DeclaredDependency {
  /** 선언된 범위(문자열로 바꾼 값) */
  range: string;
  /** `app`: 앱 package.json · `root`: 워크스페이스 루트 package.json */
  source: "app" | "root";
}

/**
 * 앱이 곧 루트가 아닐 때 워크스페이스 루트(`findWorkspaceRoot`, `.git` 에서 중단) package.json. 읽지 못하면 `undefined`(WI-0081 에서
 * dependencies-core 에 만든 것을 WI-0086 에서 옮김).
 */
export function workspaceRootPackage(baseDirInput: string): Record<string, unknown> | undefined {
  const baseDir = resolveBaseDir(baseDirInput);
  const root = findWorkspaceRoot(baseDir);
  if (root === undefined || root === baseDir) return undefined;
  try {
    const parsed: unknown = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    return isPlainObject(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 의존성 선언을 앱 package.json(`pkg`) 다음 워크스페이스 루트 package.json 순으로 찾습니다(WI-0086 공용 헬퍼).
 * - 앱 선언이 우선이고, 앱에 없을 때만 루트 선언을 봅니다(WI-0081 dependencies 항목과 같은 경계: `findWorkspaceRoot`,
 *   워크스페이스가 아닌 상위 · `.git` 너머의 선언은 인정하지 않음).
 * - `pkg` 가 없으면(앱 package.json 없음 · 읽지 못함) 루트도 보지 않고 `undefined` 입니다(종전 동작).
 * - 판정 전용입니다. 쓰는 쪽(init · add · theme add)은 계속 앱 `pkg` 에만 씁니다. 루트 선언을 앱 파일로 옮기지 않습니다.
 * - `rootPkg` 를 주면 그것을 루트 package.json 으로 씁니다(같은 판정에서 여러 번 부를 때 다시 읽지 않으려고). `null` 은 루트 없음입니다.
 */
export function declaredDependency(
  baseDir: string,
  pkg: Record<string, unknown> | undefined,
  name: string,
  rootPkg?: Record<string, unknown> | null
): DeclaredDependency | undefined {
  if (pkg === undefined) return undefined;
  const own = hasDependency(pkg, name);
  if (own !== undefined) return { range: own, source: "app" };
  const root = rootPkg === undefined ? workspaceRootPackage(baseDir) : rootPkg ?? undefined;
  const fromRoot = root !== undefined ? hasDependency(root, name) : undefined;
  return fromRoot !== undefined ? { range: fromRoot, source: "root" } : undefined;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 추가 명령 옵션(WI-0085) */
export interface AddCommandOptions {
  /** devDependencies 로 추가(`-D`, 세 매니저 모두 같은 플래그) */
  dev?: boolean;
}

/**
 * 추가 명령의 앞부분(`pnpm add` · `npm install` · `yarn add`, `dev` 면 뒤에 ` -D`). `addCommandFor` 와 add 의 `addCommandForSpecs`,
 * 패키지 이름 없이 안내하는 곳(monet import)이 함께 씁니다(WI-0085, 종전에는 같은 분기를 따로 복제).
 */
export function addCommandPrefix(installCommand: string, options: AddCommandOptions = {}): string {
  const dev = options.dev ? " -D" : "";
  switch (packageManagerOf(installCommand)) {
    case "yarn":
      return `yarn add${dev}`;
    case "npm":
      return `npm install${dev}`;
    default:
      return `pnpm add${dev}`;
  }
}

/**
 * lockfile 로 고른 설치 명령(`detectInstallCommand`)에서 패키지 추가 명령을 만듭니다(WI-0038, WI-0065 에서 init 에서 옮김).
 * 범위의 `^` 가 셸에서 사라지지 않게 따옴표로 감쌉니다. `dev` 면 `-D`(WI-0085, template apply · init 의 devDependencies).
 */
export function addCommandFor(
  installCommand: string,
  deps: Readonly<Record<string, string>>,
  options: AddCommandOptions = {}
): string {
  const specs = Object.entries(deps)
    .map(([name, range]) => `"${name}@${range}"`)
    .join(" ");
  return `${addCommandPrefix(installCommand, options)} ${specs}`;
}

/** 프로젝트 스크립트 실행 명령(`pnpm dev` · `npm run dev` · `yarn dev`, WI-0085: template init 다음 단계) */
export function runScriptCommand(installCommand: string, script: string): string {
  switch (packageManagerOf(installCommand)) {
    case "yarn":
      return `yarn ${script}`;
    case "npm":
      return `npm run ${script}`;
    default:
      return `pnpm ${script}`;
  }
}

/**
 * 워크스페이스의 다른 패키지에서 스크립트를 실행하는 명령(WI-0085: tokens 빌드 전 안내).
 * `pnpm --filter <pkg> <script>` · `npm run <script> -w <pkg>`(npm 7 이상) · `yarn workspace <pkg> <script>`.
 */
export function workspaceRunCommand(installCommand: string, pkg: string, script: string): string {
  switch (packageManagerOf(installCommand)) {
    case "yarn":
      return `yarn workspace ${pkg} ${script}`;
    case "npm":
      return `npm run ${script} -w ${pkg}`;
    default:
      return `pnpm --filter ${pkg} ${script}`;
  }
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
  // 시작점만 실경로로 맞춥니다(WI-0086). 찾은 `dir` 은 `<실경로 조상>/node_modules/<name>` 그대로이고 그 안의 링크는 풀지 않습니다.
  let dir = resolveBaseDir(baseDirInput);
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
  let dir = resolveBaseDir(baseDirInput);
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
