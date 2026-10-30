/**
 * 프로젝트 package.json · lockfile 판정 헬퍼 (WI-0055: cli theme/theme-add.ts 에서 옮김)
 *
 * add(설치 코어) · init · theme add 가 함께 씁니다.
 */

import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
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
 * - `options.appOnlyInPnp`(WI-0091): Plug'n'Play(`isPnpProject`)면 루트 선언을 인정하지 않고 앱 선언만 봅니다. PnP 에서 앱 issuer 는
 *   자기 package.json 에 없는 패키지를 해석하지 못하기 때문입니다(Yarn 4.5.3 실측, `pnpFallbackMode: all` 은 예외인데 잔여 오차로 둠).
 *   `axis check` · MCP `axis.check_project` 의 판정만 켭니다(사용자 결정 Q2). init · theme add · add · template apply 는 종전대로입니다.
 *   Tailwind 4 컴포넌트 `tailwind.css` 판정(check 의 B1 · theme add 의 DEC-2)은 이 옵션이 아니라 `componentCssResolution` 이
 *   PnP 루트 전용을 따로 갈라요(WI-0097, CSS `@import` 도 앱 issuer 에서 rc 1 「Can't resolve」인 것을 Yarn 4.5.3 · `@tailwindcss/cli` 4.1.14 로 실측).
 */
export function declaredDependency(
  baseDir: string,
  pkg: Record<string, unknown> | undefined,
  name: string,
  rootPkg?: Record<string, unknown> | null,
  options: DeclaredDependencyOptions = {}
): DeclaredDependency | undefined {
  if (pkg === undefined) return undefined;
  const own = hasDependency(pkg, name);
  if (own !== undefined) return { range: own, source: "app" };
  if (options.appOnlyInPnp && isPnpProject(baseDir)) return undefined;
  const root = rootPkg === undefined ? workspaceRootPackage(baseDir) : rootPkg ?? undefined;
  const fromRoot = root !== undefined ? hasDependency(root, name) : undefined;
  return fromRoot !== undefined ? { range: fromRoot, source: "root" } : undefined;
}

/** `declaredDependency` 옵션(WI-0091) */
export interface DeclaredDependencyOptions {
  /** Plug'n'Play 면 루트 선언을 인정하지 않음(check 경로 전용) */
  appOnlyInPnp?: boolean;
}

/**
 * Plug'n'Play 에서 워크스페이스 루트에만 선언된 의존성(WI-0091). 앱에는 없고 루트에는 있을 때 그 선언을, 아니면 `undefined` 입니다.
 * `declaredDependency(..., { appOnlyInPnp: true })` 가 인정하지 않은 선언을 「누락」과 구분해 알리려고 씁니다
 * (「워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못함」, 사용자 결정 Q5 · Q7).
 */
export function pnpRootOnlyDependency(
  baseDir: string,
  pkg: Record<string, unknown> | undefined,
  name: string,
  rootPkg?: Record<string, unknown> | null
): DeclaredDependency | undefined {
  if (pkg === undefined || hasDependency(pkg, name) !== undefined || !isPnpProject(baseDir)) return undefined;
  const found = declaredDependency(baseDir, pkg, name, rootPkg);
  return found?.source === "root" ? found : undefined;
}

/** 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못한다는 문구(WI-0091, check · MCP 공용). 앞에 「<이름> 가」를 붙여 씁니다. */
export const PNP_ROOT_ONLY_NOTE = "워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다";

/**
 * 앱 디렉터리 자체에 있으면 워크스페이스 멤버가 아닌 독립 앱으로 보는 lockfile(WI-0087 P2). WI-0093 에서 cli theme-add.ts 의 모듈 상수를
 * 옮겼어요(theme add · theme list · info · MCP 브랜드 도구가 같은 목록을 씀). bun 은 설치 명령(`LOCKFILE_COMMANDS`)에는 없지만 독립 앱 표지로는 봐요.
 */
export const APP_LOCKFILES = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb", "bun.lock"] as const;

/** 앱 디렉터리(`baseDir`) 자체에 `APP_LOCKFILES` 가운데 하나가 있는지(WI-0087 P2) */
export function hasAppLockfile(baseDirInput: string): boolean {
  const baseDir = path.resolve(baseDirInput);
  return APP_LOCKFILES.some((f) => existsSync(path.join(baseDir, f)));
}

/**
 * 워크스페이스 루트 선언을 이 앱의 선언으로 인정해도 되는지(WI-0087 P1 · P2 경계, WI-0093 에서 theme-add.ts 에서 옮김).
 * - 앱 package.json(`pkg`)이 없으면 아니에요(`declaredDependency` 와 같음).
 * - Plug'n'Play(`isPnpProject`)면 아니에요(P1: 루트 선언이 앱에서 해석된다는 보장이 없음).
 * - 앱 디렉터리 자체에 lockfile 이 있으면 아니에요(P2: 워크스페이스 멤버가 아니라 따로 설치되는 앱).
 */
export function rootDeclarationsAllowed(baseDir: string, pkg: Record<string, unknown> | undefined): boolean {
  return pkg !== undefined && !isPnpProject(baseDir) && !hasAppLockfile(baseDir);
}

/** 의존성 설치 안내의 갈래(WI-0093, `dependencyInstallGuide` 참고) */
export type DependencyInstallKind = "add" | "install" | "install-at-root" | "pnp";

/**
 * 의존성 하나를 설치 · 다시 설치하라고 안내할 방법(WI-0093). 선언 출처로 고릅니다.
 * - `add`: 선언이 없음(package.json 없음 포함, P1 · P2 로 루트 선언을 인정하지 않는 경우 포함). 종전처럼 `addCommand` 를 안내해요.
 * - `install`: 앱 선언(`source: "app"`), 또는 pnpm · yarn 워크스페이스의 루트 선언(`source: "root"`). 앱 디렉터리에서
 *   `installCommand`(`<pm> install`)를 실행하면 선언대로 설치돼요(pnpm 9.15.4 · yarn 4.5.3 node-modules 실측).
 * - `install-at-root`: npm 워크스페이스의 루트 선언. 앱 디렉터리의 `npm install` 은 루트 선언을 설치하지 않아서(npm 10.9.4 실측)
 *   워크스페이스 루트에서 `installCommand`(`npm install`)를 실행해야 해요.
 * - `pnp`: Plug'n'Play 이고 앱에 선언이 있음(`source: "app"`). node_modules 로는 설치본을 판정하지 못해 설치 명령을 내지 않아요.
 */
export interface DependencyInstallGuide {
  kind: DependencyInstallKind;
  /** 선언을 찾은 곳(`add` 면 없음) */
  source?: "app" | "root";
  /** 선언된 범위(`add` 면 없음) */
  range?: string;
  /** lockfile · `packageManager` 로 고른 설치 명령(`detectInstallCommand`, 예: `pnpm install`) */
  installCommand: string;
  /** 범위를 붙인 추가 명령(`addCommandFor`, 예: `pnpm add "@axis-ds/tokens@^1.6.0"`). 범위를 올려야 할 때도 이것을 써요 */
  addCommand: string;
}

/** `dir/package.json` 을 객체로 읽습니다. 없거나 깨졌거나 객체가 아니면 `undefined` */
function readPackageJsonAt(dir: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
    return isPlainObject(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 선언 출처로 의존성 `name` 의 설치 안내 방법을 고릅니다(WI-0093 Q13 · Q14 · Q15, theme list · info · MCP 브랜드 도구 공용).
 * 경계는 theme add 와 같아요(`rootDeclarationsAllowed`: P1 · P2). `range` 는 추가 명령(`addCommand`)에 붙이는 범위예요.
 * 매니저는 `detectInstallCommand` 로 고르고, npm 이면 루트 선언을 `install-at-root` 로 돌려줘요. Plug'n'Play 에서는 루트 선언을
 * 인정하지 않고(P1) 앱 선언만 `pnp` 로 돌려줘요.
 */
export function dependencyInstallGuide(baseDirInput: string, name: string, range: string): DependencyInstallGuide {
  const baseDir = resolveBaseDir(baseDirInput);
  const installCommand = detectInstallCommand(baseDir);
  const base = { installCommand, addCommand: addCommandFor(installCommand, { [name]: range }) };
  const pkg = readPackageJsonAt(baseDir);
  if (pkg === undefined) return { kind: "add", ...base };
  const own = hasDependency(pkg, name);
  if (isPnpProject(baseDir)) return own !== undefined ? { kind: "pnp", source: "app", range: own, ...base } : { kind: "add", ...base };
  if (own !== undefined) return { kind: "install", source: "app", range: own, ...base };
  if (!rootDeclarationsAllowed(baseDir, pkg)) return { kind: "add", ...base };
  const declared = declaredDependency(baseDir, pkg, name);
  if (declared?.source !== "root") return { kind: "add", ...base };
  return {
    kind: packageManagerOf(installCommand) === "npm" ? "install-at-root" : "install",
    source: "root",
    range: declared.range,
    ...base,
  };
}

/**
 * 설치 명령을 실행할 위치까지 담은 안내 구절(WI-0096). npm 이고 안내 대상에 워크스페이스 루트 선언이 하나라도 있으면(`rootDeclared`)
 * 「워크스페이스 루트에서 npm install」, 아니면 `installCommand` 그대로예요. 문구는 WI-0093 Q15(`install-at-root`)와 같아요.
 * npm 7.24.2 · 8.19.4 · 9.9.4 · 10.9.4 실측에서 앱 디렉터리의 `npm install` 은 루트에만 선언한 패키지를 설치하지 않았고
 * (npm 8 이상은 `--include-workspace-root` 를 붙이면 설치, npm 7 은 붙여도 설치 안 함), 루트에서 실행하면 네 버전 모두 루트 · 앱 선언을 함께 설치했어요.
 * pnpm 9.15.4 · yarn 1.22.22 는 앱 디렉터리에서도 루트 선언을 설치해서 그대로예요. theme add · init · check dependencies 가 같이 써요.
 */
export function installCommandPhrase(installCommand: string, rootDeclared: boolean): string {
  return rootDeclared && packageManagerOf(installCommand) === "npm" ? `워크스페이스 루트에서 ${installCommand}` : installCommand;
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
 * `axis check` · MCP `axis.check_project` 의 brand 항목이 이 목록을 씁니다(종전에는 init 기본값 · brand-core 사본이 따로 있었음).
 * theme add · brand 항목은 `axis.config.json` 의 `globalCss` 를 먼저 보고 이 목록으로 넘어갑니다(`selectGlobalCss`).
 * check 의 CSS 판정 3항목(Tailwind 4 의 tailwind.config · globals.css · Tailwind 4 의 animation)은 같은 `selectGlobalCss` 에
 * 다른 후보 목록(`TAILWIND_CSS_CANDIDATES`, 루트 우선)을 넘깁니다. 두 목록은 합치지 않습니다(WI-0100 D2).
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

/** `selectGlobalCss` 결과 */
export interface GlobalCssSelection {
  /** 고른 CSS 파일의 절대 경로(`baseDir` 와 같은 기준으로 푼 경로, 심볼릭 링크는 풀지 않음). 후보가 모두 없으면 없음 */
  path?: string;
  /** 고른 파일의 `baseDir` 기준 상대 경로(`/` 구분). 후보에서 고르면 후보 문자열 그대로, 프로젝트 밖이면 `../shared/globals.css` 처럼 */
  rel?: string;
  /** `globalCss` 가 가리키는데 일반 파일이 아닐 때(없음 · 디렉터리) 그 값(설정에 적힌 그대로) */
  configuredMissing?: string;
  /** `requireStylesheet` 에서 `globalCss` 가 `.css` 가 아닌 일반 파일을 가리켜 버렸을 때 그 값(설정에 적힌 그대로, WI-0100 D10) */
  configuredRejected?: string;
}

export interface SelectGlobalCssOptions {
  /**
   * `globalCss` 가 가리키는 일반 파일이 `.css` 가 아니면(대소문자 무시, `package.json` 등) 버리고 후보로 넘어갑니다(WI-0100 D10).
   * check 경로(`axis check` · MCP `axis.check_project` 의 CSS 3항목 · brand)만 켭니다. theme add 는 끄고 쓰기 직전에
   * `css-not-stylesheet` 로 거절합니다(종전 규칙). 확장자는 적힌 경로로 봅니다(심볼릭 링크를 풀지 않음).
   */
  requireStylesheet?: boolean;
}

/**
 * 전역 CSS 파일 하나를 고릅니다(WI-0100a, 종전 brand-core `findGlobalCss` 규칙을 공유 코어로 옮김). 파일을 쓰지 않습니다.
 * 1. `configured`(`axis.config.json` 의 `globalCss`)가 비지 않은 문자열이고 `baseDir` 기준으로 푼 경로가 일반 파일이면 그 파일.
 *    프로젝트 밖(`../shared/globals.css` · 절대경로)도 읽기만 하므로 거절하지 않습니다(사용자 결정 Q25, 쓰기 거절은 theme add 몫).
 *    파일이 없거나 디렉터리면 `configuredMissing`, `requireStylesheet` 에서 `.css` 가 아니면 `configuredRejected` 를 담고 2 로 갑니다.
 * 2. `candidates` 를 앞에서부터 보고 처음 있는 일반 파일. 키가 없거나 문자열이 아니면 1 을 건너뜁니다(종전 후보 순서 그대로).
 * 고르기만 하고 내용은 읽지 않습니다. 고른 파일이 상대 `@import` 로 들여온 하위 파일은 check 쪽이 tailwind-core `expandGlobalCss` 로 펼쳐 봅니다(WI-0100b).
 */
export function selectGlobalCss(
  baseDir: string,
  configured: unknown,
  candidates: readonly string[],
  options: SelectGlobalCssOptions = {}
): GlobalCssSelection {
  const result: GlobalCssSelection = {};
  if (typeof configured === "string" && configured.trim() !== "") {
    const file = path.resolve(baseDir, configured);
    if (!isFile(file)) result.configuredMissing = configured;
    else if (options.requireStylesheet && path.extname(file).toLowerCase() !== ".css") result.configuredRejected = configured;
    else return { path: file, rel: path.relative(baseDir, file).split(path.sep).join("/") };
  }
  for (const candidate of candidates) {
    const file = path.join(baseDir, candidate);
    if (isFile(file)) {
      result.path = file;
      result.rel = candidate;
      break;
    }
  }
  return result;
}

/**
 * `selectGlobalCss` 가 `globalCss` 를 쓰지 못했을 때 check 문구 끝에 붙이는 표기(앞에 공백 포함). 썼으면 빈 문자열입니다.
 * 「(globalCss <값> 없음)」은 종전 brand 항목과 같은 문구이고, CSS 3항목에도 모든 심각도에 붙입니다(WI-0100a).
 */
export function globalCssSelectionNote(selection: Pick<GlobalCssSelection, "configuredMissing" | "configuredRejected">): string {
  if (selection.configuredMissing !== undefined) return ` (globalCss ${selection.configuredMissing} 없음)`;
  if (selection.configuredRejected !== undefined) return ` (globalCss ${selection.configuredRejected}: .css 파일이 아님)`;
  return "";
}

/**
 * 근거를 전역 CSS 가 상대 `@import` 로 들여온 하위 파일에서 찾았을 때 check 문구 끝(「(globalCss …)」 표기 앞)에 붙이는 출처
 * 「 (app/axis.css 의 import)」(WI-0100b, 선례 D6. 앞에 공백 포함). 여럿이면 ` · ` 로 잇고, 하위 파일이 없으면 빈 문자열이라 종전 문구 그대로예요.
 * 세 CSS 항목(tailwind-core)과 brand 항목(cli · mcp 호출지)이 같은 문구를 써요.
 */
export function cssImportViaNote(files: readonly string[] | undefined): string {
  return files !== undefined && files.length > 0 ? ` (${files.join(" · ")} 의 import)` : "";
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

/**
 * Plug'n'Play 설치인지(`baseDir` 부터 상위로 `.pnp.cjs` · `.pnp.js` 를 찾음). 이때는 node_modules 로 설치본을 판정하지 않습니다.
 * WI-0091(사용자 결정 Q3): `findWorkspaceRoot` 와 같게 같은 층에서는 표지를 먼저 보고, 표지 없이 `.git` 이 나오면 거기서 멈춥니다.
 * 종전에는 저장소 밖 상위에 남은 `.pnp.cjs` 때문에 node-modules 프로젝트를 Plug'n'Play 로 잘못 판정했습니다.
 */
export function isPnpProject(baseDirInput: string): boolean {
  return pnpProjectRoot(baseDirInput) !== undefined;
}

/**
 * Plug'n'Play 표지(`.pnp.cjs` · `.pnp.js`)가 있는 디렉터리(실경로). `isPnpProject` 와 같은 탐색(같은 층은 표지 먼저, 표지 없이 `.git` 이
 * 나오면 멈춤)이고, 표지를 찾지 못하면 `undefined` 입니다. WI-0098 에서 unplugged 설치본 탐색의 기준으로 쓰려고 나눴어요.
 */
export function pnpProjectRoot(baseDirInput: string): string | undefined {
  let dir = resolveBaseDir(baseDirInput);
  for (;;) {
    if (isFile(path.join(dir, ".pnp.cjs")) || isFile(path.join(dir, ".pnp.js"))) return dir;
    if (existsSync(path.join(dir, ".git"))) return undefined;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// CSS import 해석 상태 (WI-0097: check 의 Tailwind 4 B1 · theme add 의 WI-0087 DEC-2 공용)

/**
 * Tailwind 4 진입점(토큰 `css/tailwind4` · 컴포넌트 `tailwind.css`)이 처음 들어가는 AXIS 버전(WI-0044 D1, linked minor).
 * WI-0097 에서 tailwind-core `TAILWIND4_MIN_AXIS_VERSION` 과 cli theme-add `COMPONENT_TAILWIND_CSS_MIN_VERSION`(값이 같은 사본)을
 * 하나로 합쳐 이곳에 뒀어요. 두 이름은 각각 다시 내보내요.
 */
export const TAILWIND4_MIN_AXIS_VERSION = "1.4.0";

/** 컴포넌트 패키지가 `tailwind.css` 를 배포하기 시작한 버전(ui-react · agentic-ui CHANGELOG 1.4.0). `TAILWIND4_MIN_AXIS_VERSION` 과 같은 값 */
export const COMPONENT_TAILWIND_CSS_MIN_VERSION = TAILWIND4_MIN_AXIS_VERSION;

/**
 * 컴포넌트 패키지(`@axis-ds/ui-react` · `@axis-ds/agentic-ui`)의 `<name>/tailwind.css` 를 이 앱이 해석할 수 있는지(WI-0097).
 * 판정 순서(앞에서 정해지면 끝). 갈래는 PRD 1.4 표와 같고, 설치본은 파일 존재를 먼저 보고 버전은 파일이 없을 때만 봐요(사용자 결정 Q42):
 * - `undeclared`: 앱 package.json 이 없거나 앱 · 워크스페이스 루트 어디에도 선언이 없음
 * - `app`: 앱 package.json 에 선언(사용자 결정 Q21). 설치 여부와 상관없이 해석되는 것으로 봐요. 미설치는 dependencies 항목이 알려요.
 *   Plug'n'Play 에서도 같아요(PnP 는 설치본을 읽지 않음)
 * - `pnp-root-only`: Plug'n'Play 이고 워크스페이스 루트에만 선언(`pnpRootOnlyDependency`, Q22). 앱 issuer 가 해석하지 못해요
 *   (Yarn 4.5.3 · `@tailwindcss/cli` 4.1.14 실빌드 rc 1 `Can't resolve`, WI-0097 testplan 2절)
 * - `app-lockfile`: 앱 디렉터리 자체에 lockfile 이 있어(P2) 루트 선언을 이 앱의 선언으로 보지 않음(`rootDeclarationsAllowed`)
 * - `root-not-installed`: 루트에만 선언했고 `findInstalledPackage` 로 설치본을 찾지 못함
 * - `root-ok`: 루트 선언이고 설치본 디렉터리에 `tailwind.css` 파일이 있음(해석의 정의는 파일 존재, 버전은 보지 않음)
 * - `root-old`: 루트 선언 · 설치본에 파일이 없고 설치본 버전이 1.4.0 미만이거나 읽지 못함(`installedVersion: "?"`)
 * - `root-missing-file`: 루트 선언 · 설치본이 1.4.0 이상인데 파일이 없음(설치 손상)
 * `range` 는 루트 선언 범위예요. 쓰기 쪽(theme add)과 판정 쪽(check · MCP)이 같은 결론을 내도록 이 함수 하나를 써요.
 */
export type ComponentCssResolution =
  | { kind: "undeclared" }
  | { kind: "app"; range: string }
  | { kind: "pnp-root-only"; range: string }
  | { kind: "app-lockfile"; range: string }
  | { kind: "root-not-installed"; range: string }
  | { kind: "root-ok"; range: string; installedVersion?: string }
  | { kind: "root-old"; range: string; installedVersion: string }
  | { kind: "root-missing-file"; range: string; installedVersion: string };

export function componentCssResolution(
  baseDir: string,
  pkg: Record<string, unknown> | undefined,
  name: string
): ComponentCssResolution {
  if (pkg === undefined) return { kind: "undeclared" };
  const own = hasDependency(pkg, name);
  if (own !== undefined) return { kind: "app", range: own };
  const pnpRoot = pnpRootOnlyDependency(baseDir, pkg, name);
  if (pnpRoot !== undefined) return { kind: "pnp-root-only", range: pnpRoot.range };
  const declared = declaredDependency(baseDir, pkg, name);
  if (declared?.source !== "root") return { kind: "undeclared" };
  if (!rootDeclarationsAllowed(baseDir, pkg)) return { kind: "app-lockfile", range: declared.range };
  const installed = findInstalledPackage(baseDir, name);
  if (installed === undefined) return { kind: "root-not-installed", range: declared.range };
  if (isFile(path.join(installed.dir, "tailwind.css"))) {
    return installed.version !== undefined
      ? { kind: "root-ok", range: declared.range, installedVersion: installed.version }
      : { kind: "root-ok", range: declared.range };
  }
  const installedVersion = installed.version ?? "?";
  const current =
    installedVersion !== "?" && (compareExactVersions(installedVersion, COMPONENT_TAILWIND_CSS_MIN_VERSION) ?? -1) >= 0;
  return current
    ? { kind: "root-missing-file", range: declared.range, installedVersion }
    : { kind: "root-old", range: declared.range, installedVersion };
}

/** `componentCssResolution` 이 이 앱에서 `<name>/tailwind.css` 가 해석된다고 보는지(`app` · `root-ok`) */
export function componentCssResolvable(resolution: ComponentCssResolution): boolean {
  return resolution.kind === "app" || resolution.kind === "root-ok";
}

/**
 * `@axis-ds/tokens` 의 CSS 진입점(`css` · `css/tailwind4` 등)을 이 앱이 해석할 수 있는지(WI-0097, globals.css 게이트용).
 * check 의 globals.css 항목이 tokens CSS import 근거와 루트 레이아웃 JS import 근거(WI-0100 D11)를 pass 로 인정하기 전에 봐요(2부).
 * - `app`: 앱 package.json 에 선언. 설치 여부와 상관없이 해석되는 것으로 봐요(사용자 결정 Q28, PnP · non-PnP 공통)
 * - `pnp-root-only`: Plug'n'Play 이고 워크스페이스 루트에만 선언(Q22)
 * - `installed`: Plug'n'Play 가 아니고 `findInstalledPackage` 로 설치본 디렉터리를 찾음(선언 위치와 상관없음, 해석의 정의는
 *   패키지 디렉터리 존재. exports 대상 파일은 보지 않음: dist 없는 workspace 링크에서 거짓 WARN 을 막으려고)
 * - `not-installed`: 그 밖. `source: "root"` 는 루트 선언을 이 앱의 선언으로 인정할 수 있는데(`rootDeclarationsAllowed`) 설치본이 없음,
 *   `source: "none"` 은 미선언(P2 의 루트 선언 · PnP 의 앱 미선언 포함)
 */
export type TokensCssResolution =
  | { kind: "app"; range: string }
  | { kind: "pnp-root-only"; range: string }
  | { kind: "installed" }
  | { kind: "not-installed"; source: "root"; range: string }
  | { kind: "not-installed"; source: "none" };

export function tokensCssResolution(
  baseDir: string,
  pkg: Record<string, unknown> | undefined,
  name = "@axis-ds/tokens"
): TokensCssResolution {
  const own = pkg !== undefined ? hasDependency(pkg, name) : undefined;
  if (own !== undefined) return { kind: "app", range: own };
  const pnpRoot = pnpRootOnlyDependency(baseDir, pkg, name);
  if (pnpRoot !== undefined) return { kind: "pnp-root-only", range: pnpRoot.range };
  if (!isPnpProject(baseDir) && findInstalledPackage(baseDir, name) !== undefined) return { kind: "installed" };
  const declared = rootDeclarationsAllowed(baseDir, pkg) ? declaredDependency(baseDir, pkg, name) : undefined;
  return declared?.source === "root"
    ? { kind: "not-installed", source: "root", range: declared.range }
    : { kind: "not-installed", source: "none" };
}

/**
 * 프로젝트 밖 진입 CSS(`globalCss` 가 앱 밖, WI-0100a 사용자 결정 Q25)의 패키지 줄을 그 파일 위치 기준으로 해석할 수 있는지
 * (WI-0097 2부, 사용자 결정 Q37). 빌드 도구(`@tailwindcss/postcss` 의 enhanced-resolve)는 `@import "<pkg>..."` 를 앱이 아니라
 * 그 CSS 파일 디렉터리부터 상위 node_modules 로 풀어요(WI-0100a 실측: 설치본이 앱 아래에만 있으면 rc 1
 * 「Can't resolve 'tailwindcss' in '<그 파일 디렉터리>'」, 상위로 호이스팅하면 rc 0. WI-0097 testplan 4.3 에서 다시 잼).
 * - `unresolved`: 앱 위치에서는 설치본을 찾는데(`file` 을 주면 설치본 안의 그 파일까지) CSS 파일 위치에서는 찾지 못함
 * - `resolved`: CSS 파일 위치에서도 찾음
 * - `unknown`: 판정하지 않음(종전 동작). Plug'n'Play(설치본을 읽지 않음)와, 앱 위치에서도 설치본이 없는 경우예요
 *   (미설치는 앱 기준 판정과 dependencies 항목이 알려요, 사용자 결정 Q21 · Q28)
 * 선언은 보지 않아요(node_modules 탐색은 선언과 상관없이 풀림). 앱 기준 판정(`componentCssResolution` · `tokensCssResolution`)을
 * 대신하지 않고 그 뒤에 더하는 판정이에요.
 * WI-0103 부터 check 는 이 함수를 프로젝트 밖 진입 파일의 줄, `@import "tailwindcss"` 줄(Q78), Tailwind 3 에만 써요. Tailwind 4 의 앱 안 CSS 의
 * tokens · 컴포넌트 줄은 exports 를 보는 `cssPackageLineResolution` 이 판정해요(이 함수는 처음 만난 설치본의 디렉터리(`file` 없음) · 파일 존재만
 * 봐서 그림자를 실빌드와 다르게 판정해요).
 */
export type OutsideCssResolution = "resolved" | "unresolved" | "unknown";

export function outsideCssPackageResolution(baseDir: string, cssDir: string, name: string, file?: string): OutsideCssResolution {
  if (isPnpProject(baseDir)) return "unknown";
  const usable = (p: InstalledPackage | undefined) => p !== undefined && (file === undefined || isFile(path.join(p.dir, file)));
  if (!usable(findInstalledPackage(baseDir, name))) return "unknown";
  return usable(findInstalledPackage(cssDir, name)) ? "resolved" : "unresolved";
}

// ---------------------------------------------------------------------------------------------------------------------
// exports 를 보는 패키지 CSS import 해석 (WI-0103: 중첩 설치본(그림자) · Tailwind 4 해석기와 같은 순서)

/**
 * 패키지 CSS import(`<name>/<subpath>`)를 Tailwind 4 의 CSS 해석기처럼 푼 결과(WI-0103, 사용자 결정 Q70 · Q71).
 * - `resolved`: 그 설치본에서 파일로 풀림(`pkgDir` 는 실경로가 아니라 `<실경로 조상>/node_modules/<name>`)
 * - `not-exported`: 처음 잡힌 설치본에 `exports` 가 있는데 subpath 를 내보내지 않음(조건 `style` · `default` 가 맞지 않음 포함).
 *   해석기는 여기서 멈추고 실패해요(상위 설치본으로 가지 않음)
 * - `target-missing`: `exports` 가 subpath 를 내보내는데 대상 파일이 없음(역시 멈추고 실패)
 * - `not-found`: 루트까지 올라가도 풀리지 않음
 * - `unknown`: 이 모델이 다루지 않는 모양(패턴 키 `*` · 폴더 매핑 · subpath 없는 이름 · 대상에 `*` · 대상이 `./` 로 시작하지 않음). 판정하지 않는 쪽으로 돌려요
 */
export type CssPackageImportResolution =
  | { kind: "resolved"; pkgDir: string; file: string }
  | { kind: "not-exported"; pkgDir: string; subpath: string; version?: string }
  | { kind: "target-missing"; pkgDir: string; subpath: string; target: string; version?: string }
  | { kind: "not-found" }
  | { kind: "unknown" };

/** Tailwind 4 CSS 해석기가 맞는 것으로 보는 조건(`@tailwindcss/node` 4.1.14 `conditionNames: ["style"]` + enhanced-resolve 가 늘 더하는 `default`, Q70) */
const CSS_EXPORT_CONDITIONS = new Set(["style", "default"]);

/** `@scope/name/rest` · `name/rest` 를 이름과 나머지로. 이름이 아니면 `undefined` */
function splitPackageSpec(spec: string): { name: string; rest: string } | undefined {
  const parts = spec.split("/");
  const n = spec.startsWith("@") ? 2 : 1;
  if (parts.length < n || parts.slice(0, n).some((p) => p === "" || p === "." || p === "..")) return undefined;
  return { name: parts.slice(0, n).join("/"), rest: parts.slice(n).join("/") };
}

/** `exports` 대상 값 하나를 조건으로 풀어요. 풀리지 않으면(맞는 조건이 없거나 맞는 조건의 값이 `null`) `undefined`(미노출) */
function resolveExportTarget(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const v of value) {
      const r = resolveExportTarget(v);
      if (r !== undefined) return r;
    }
    return undefined;
  }
  if (isPlainObject(value)) {
    // 키 순서대로 처음 맞는 조건(Node 규격과 같음). 맞는 조건의 값이 `null` 이면 거기서 미노출로 끝나요(다음 키로 넘어가지 않음,
    // 반박 검증 c22: `{ style: null, default: "./x.css" }` 는 실빌드 rc 1)
    for (const [key, v] of Object.entries(value)) {
      if (!CSS_EXPORT_CONDITIONS.has(key)) continue;
      if (v === null) return undefined;
      const r = resolveExportTarget(v);
      if (r !== undefined) return r;
    }
  }
  return undefined;
}

/** 해석기가 파일 경로 하나에 대해 보는 후보(적힌 이름 · `.css` 를 붙인 이름 · 디렉터리의 `index.css`, `extensions: [".css"]` 와 같음) */
function cssFileCandidates(p: string): string[] {
  return [p, `${p}.css`, path.join(p, "index.css")];
}

/**
 * `exports` 필드로 subpath(`./css/tailwind4`)를 풀어요. 대상 상대 경로, 미노출이면 `undefined`, 다루지 않는 모양이면 `"?"`.
 * 문자열 · 배열 · 조건 객체(키가 `.` 로 시작하지 않음)는 `"."` 만 가진 것으로 봐요.
 */
function exportsTarget(exportsField: unknown, subpath: string): string | undefined | "?" {
  const map: Record<string, unknown> =
    isPlainObject(exportsField) && Object.keys(exportsField).some((k) => k.startsWith("."))
      ? exportsField
      : { ".": exportsField };
  if (Object.prototype.hasOwnProperty.call(map, subpath)) {
    const t = resolveExportTarget(map[subpath]);
    if (t === undefined) return undefined;
    return t.includes("*") || !t.startsWith("./") ? "?" : t;
  }
  // 패턴 키 · 폴더 매핑은 이 모델이 다루지 않아요(발행된 AXIS 패키지에 없음, WI-0103 testplan 2.4)
  if (Object.keys(map).some((k) => k.includes("*") || (k.endsWith("/") && subpath.startsWith(k)))) return "?";
  return undefined;
}

/**
 * 패키지 CSS import 를 `fromDir`(그 줄이 있는 CSS 파일의 디렉터리)부터 Tailwind 4 해석기처럼 풀어요(WI-0103 plan 1절).
 * 위로 올라가며 `node_modules/<name>` 디렉터리를 찾고, `package.json` 의 `exports` 가 있으면 그 설치본에서 끝나요(미노출 · 대상 파일
 * 없음이면 실패). `exports` 가 없거나(거짓 값 포함) `package.json` 이 없으면 `<subpath>` · `<subpath>.css` · `<subpath>/index.css` 파일이 있을 때만 그 설치본에서 풀리고,
 * 없으면 건너뛰고 상위로 가요(Q71, 착수 측정 n0 · np0). Plug'n'Play 는 부르는 쪽이 먼저 가려요.
 */
export function resolveCssPackageImport(fromDir: string, spec: string): CssPackageImportResolution {
  const parsed = splitPackageSpec(spec);
  if (parsed === undefined || parsed.rest === "") return { kind: "unknown" };
  const subpath = `./${parsed.rest}`;
  let dir = resolveBaseDir(fromDir);
  for (;;) {
    const pkgDir = path.join(dir, "node_modules", ...parsed.name.split("/"));
    if (isDirectory(pkgDir)) {
      let manifest: Record<string, unknown> | undefined;
      try {
        const raw: unknown = JSON.parse(readFileSync(path.join(pkgDir, "package.json"), "utf8"));
        manifest = isPlainObject(raw) ? raw : undefined;
      } catch {
        manifest = undefined;
      }
      // `exports` 가 거짓 값(`null` · `false` · `""`)이면 해석기는 exports 없음으로 봐요(반박 검증 c01 ~ c03b, enhanced-resolve `exportsField ? … : null`)
      if (manifest !== undefined && manifest.exports) {
        const version = exactVersionOf(manifest.version);
        const target = exportsTarget(manifest.exports, subpath);
        if (target === "?") return { kind: "unknown" };
        if (target === undefined) {
          return version !== undefined ? { kind: "not-exported", pkgDir, subpath, version } : { kind: "not-exported", pkgDir, subpath };
        }
        // 대상에도 `.css` 확장자 · 디렉터리 `index.css` 를 붙여 봐요(반박 검증 c07 · c08)
        const file = cssFileCandidates(path.join(pkgDir, target)).find(isFile);
        if (file !== undefined) return { kind: "resolved", pkgDir, file };
        return version !== undefined
          ? { kind: "target-missing", pkgDir, subpath, target, version }
          : { kind: "target-missing", pkgDir, subpath, target };
      }
      const bare = cssFileCandidates(path.join(pkgDir, parsed.rest)).find(isFile);
      if (bare !== undefined) return { kind: "resolved", pkgDir, file: bare };
    }
    const parent = path.dirname(dir);
    if (parent === dir) return { kind: "not-found" };
    dir = parent;
  }
}

/** `<base>/node_modules/<name>` 의 `<base>` 실경로 */
function installBase(pkgDir: string, name: string): string {
  let base = pkgDir;
  for (let i = 0; i < name.split("/").length + 1; i++) base = path.dirname(base);
  try {
    return realpathSync(base);
  } catch {
    return path.resolve(base);
  }
}

/** `hit` 설치본이 놓인 디렉터리가 `app` 설치본이 놓인 디렉터리의 조상인지(둘 다 `<base>/node_modules/<name>` 형태) */
function isAncestorInstall(hit: string, app: string, name: string): boolean {
  const h = installBase(hit, name);
  const a = installBase(app, name);
  return a !== h && a.startsWith(h.endsWith(path.sep) ? h : h + path.sep);
}

/** 두 디렉터리가 같은 실경로인지(풀지 못하면 적힌 경로로 비교) */
function sameRealDir(a: string, b: string): boolean {
  const real = (p: string) => {
    try {
      return realpathSync(p);
    } catch {
      return path.resolve(p);
    }
  };
  return real(a) === real(b);
}

/**
 * 프로젝트 안 CSS 파일의 패키지 줄이 그 파일 위치에서 해석되는지(WI-0103, 사용자 결정 Q72 · Q73 · Q74). check 의 tokens 줄 · 컴포넌트
 * `tailwind.css` 줄이 앱 기준 판정(`tokensCssResolution` · `componentCssResolution`) 뒤에 더해서 봐요. 프로젝트 밖 진입 파일은
 * 종전 `outsideCssPackageResolution` 을 그대로 써요(Q37).
 * - `ok`: 해석됨, 또는 판정하지 않음(Plug'n'Play · 다루지 않는 모양 · 어디에서도 설치본을 찾지 못함(Q28) · 잡힌 설치본이 앱 기준 설치본과 같음(Q72) ·
 *   앱 기준 설치본이 있는데 풀리지 않음. 마지막은 앱 안 파일이 앱 기준 설치본을 늘 지나가므로 그 설치본에 exports 도 파일도 없을 때뿐이고(손상 · stub),
 *   종전에도 판정하지 않았어요)
 * - `shadow-not-exported` · `shadow-target-missing`: 줄 위치에서 먼저 잡히는 설치본이 앱 기준 설치본과 실경로가 다르고(그림자) 실빌드가 실패하는 모양
 * - `not-visible`: 앱 기준 설치본은 없고 줄 위치에서도 풀리지 않는데 `otherDirs`(같은 전역 CSS 의 다른 파일 디렉터리) 가운데 하나에서는 풀림(z5, Q74)
 */
export type CssPackageLineResolution =
  | { kind: "ok" }
  | { kind: "shadow-not-exported"; pkgDir: string; subpath: string; version?: string }
  | { kind: "shadow-target-missing"; pkgDir: string; subpath: string; target: string; version?: string }
  | { kind: "not-visible"; pkgDir: string; fromDir: string };

export function cssPackageLineResolution(
  baseDir: string,
  lineDir: string,
  spec: string,
  otherDirs: readonly string[] | (() => readonly string[]) = []
): CssPackageLineResolution {
  if (isPnpProject(baseDir)) return { kind: "ok" };
  const parsed = splitPackageSpec(spec);
  if (parsed === undefined) return { kind: "ok" };
  const r = resolveCssPackageImport(lineDir, spec);
  if (r.kind === "resolved" || r.kind === "unknown") return { kind: "ok" };
  const app = findInstalledPackage(baseDir, parsed.name);
  if (r.kind === "not-exported" || r.kind === "target-missing") {
    // 앱 기준 설치본 자체면 종전(1.4.0 미만은 버전 확인 WARN 이 알리고, dist 를 아직 빌드하지 않은 workspace 링크를 막지 않음, Q72)
    if (app !== undefined && sameRealDir(app.dir, r.pkgDir)) return { kind: "ok" };
    // 잡힌 설치본이 앱 기준 설치본보다 위(조상)에 있으면, 앱 기준 설치본에 exports 도 파일도 없어 해석기가 건너뛴 것이에요(손상 · stub).
    // 중첩 설치본(그림자)이 아니라서 종전처럼 판정하지 않아요(반박 검증 R1: 앱 stub + 위쪽 낡은 설치본 · dist 미빌드 링크)
    if (app !== undefined && isAncestorInstall(r.pkgDir, app.dir, parsed.name)) return { kind: "ok" };
    return r.kind === "not-exported"
      ? { ...r, kind: "shadow-not-exported" }
      : { ...r, kind: "shadow-target-missing" };
  }
  if (app !== undefined) return { kind: "ok" };
  // 다른 파일 디렉터리 목록은 z5 판정에만 쓰므로 여기까지 왔을 때만 만들어요(반박 검증 R2)
  for (const other of typeof otherDirs === "function" ? otherDirs() : otherDirs) {
    const o = resolveCssPackageImport(other, spec);
    if (o.kind === "resolved") return { kind: "not-visible", pkgDir: o.pkgDir, fromDir: resolveBaseDir(other) };
  }
  return { kind: "ok" };
}

/** 루트 선언 컴포넌트 패키지의 `tailwind.css` 줄을 theme add 가 넣지 않은 이유(WI-0087 DEC-2, WI-0097 에서 cli theme-add.ts 에서 옮김) */
export interface DeferredComponentImport {
  name: string;
  /** 설치본 버전(설치본은 있지만 `tailwind.css` 가 없을 때). 미설치면 없음. 설치본 버전을 읽지 못하면 `"?"` */
  installedVersion?: string;
}

/**
 * theme add 가 루트 선언 컴포넌트 패키지의 `tailwind.css` 줄을 넣지 않은 이유 한 문장(WI-0087 DEC-2, WI-0097 에서 cli theme/index.ts 에서 옮김).
 * cli 가 앞에 `  ! ` 를 붙이고 노란색으로 찍어요(접두 · 색은 cli 몫). 세 갈래:
 * 미설치 · 1.4.0 이상인데 파일 없음(설치 손상, 다시 설치) · 1.4.0 미만 또는 버전 모름(올림).
 * `installCommand` 는 괄호 안에 그대로 넣는 설치 구절이에요. cli 는 `installCommandPhrase(…, true)` 를 넘겨 npm 이면 「워크스페이스 루트에서 npm install」이에요(WI-0096).
 */
export function deferredComponentImportReason(d: DeferredComponentImport, installCommand: string): string {
  const line = `@import "${d.name}/tailwind.css";`;
  // 1.4.0 이상인데 파일이 없으면 올릴 버전 문제가 아니라 설치가 손상된 것이라 다시 설치를 안내합니다
  const current =
    d.installedVersion !== undefined &&
    d.installedVersion !== "?" &&
    (compareExactVersions(d.installedVersion, COMPONENT_TAILWIND_CSS_MIN_VERSION) ?? -1) >= 0;
  return d.installedVersion === undefined
    ? `${d.name} 가 워크스페이스 루트에 선언됐지만 설치되지 않아 ${line} 를 넣지 않았습니다. 설치(${installCommand}) 뒤 theme add 를 다시 실행하거나 직접 넣으세요.`
    : current
      ? `워크스페이스 루트에 선언된 ${d.name} 의 설치본(${d.installedVersion})에 tailwind.css 가 없어 ${line} 를 넣지 않았습니다. 설치가 손상됐을 수 있으니 다시 설치(${installCommand}) 뒤 theme add 를 다시 실행하거나 직접 넣으세요.`
      : `워크스페이스 루트에 선언된 ${d.name} 의 설치본(${d.installedVersion === "?" ? "버전 모름" : d.installedVersion})에 tailwind.css 가 없어(${COMPONENT_TAILWIND_CSS_MIN_VERSION} 부터 제공) ${line} 를 넣지 않았습니다. ${COMPONENT_TAILWIND_CSS_MIN_VERSION} 이상으로 올린 뒤 theme add 를 다시 실행하거나 직접 넣으세요.`;
}

/**
 * Plug'n'Play 에서 unplugged 로 풀린 설치본 가운데 버전이 `range` 에 맞는 것(WI-0098, 사용자 결정 Q29 · extra 4).
 * `pnpProjectRoot` 의 `.yarn/unplugged/<디렉터리>/node_modules/<name>/package.json` 을 읽고, version 이 `range` 를 만족하는 패키지
 * 디렉터리(절대 경로)를 이름순으로 돌려줘요. `.pnp.cjs` 는 읽지 않아요(사용자 결정 Q23). 범위를 읽지 못하면(`workspace:` · `catalog:` ·
 * git · 파일 경로 등) 맞는지 알 수 없으므로 아무것도 돌려주지 않아요(덮음 인정 쪽으로 가지 않는 보수적 기본값).
 * `.yarnrc.yml` 의 `pnpUnpluggedFolder` 로 위치를 바꾼 프로젝트는 찾지 못해요(prd 7절 잔여 오차).
 */
export function findPnpUnpluggedPackages(baseDirInput: string, name: string, range: string): string[] {
  const root = pnpProjectRoot(baseDirInput);
  if (root === undefined) return [];
  const unplugged = path.join(root, ".yarn", "unplugged");
  let entries: string[];
  try {
    entries = readdirSync(unplugged).sort();
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const entry of entries) {
    const pkgDir = path.join(unplugged, entry, "node_modules", ...name.split("/"));
    let version: string | undefined;
    try {
      const parsed: unknown = JSON.parse(readFileSync(path.join(pkgDir, "package.json"), "utf8"));
      version = isPlainObject(parsed) && parsed.name === name ? exactVersionOf(parsed.version) : undefined;
    } catch {
      version = undefined;
    }
    if (version !== undefined && versionSatisfiesRange(version, range) === true) found.push(pkgDir);
  }
  return found;
}

/** 버전 한 자리 묶음(`1` · `1.8` · `1.8.x` · `1.8.2` · `1.8.2-beta.1`). 빠지거나 와일드카드인 자리는 `undefined` */
interface PartialVersion {
  major?: number;
  minor?: number;
  patch?: number;
  pre?: string;
}

function parsePartialVersion(token: string): PartialVersion | undefined {
  const m = /^v?(\d+|[xX*])(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(token.trim());
  if (!m) return undefined;
  const num = (s: string | undefined) => (s === undefined || /^[xX*]$/.test(s) ? undefined : Number(s));
  const major = num(m[1]);
  const minor = major === undefined ? undefined : num(m[2]);
  const patch = minor === undefined ? undefined : num(m[3]);
  return { major, minor, patch, pre: patch === undefined ? undefined : m[4] };
}

/** `[하한(포함), 상한(제외)]` 꼴의 비교. 상한은 core 만 봐요(`<2.0.0-0` 과 같음). `undefined` 쪽은 열려 있어요. */
interface VersionInterval {
  min?: { v: string; inclusive: boolean };
  max?: { v: string; inclusive: boolean; coreOnly?: boolean };
  /** 이 범위가 prerelease 를 허용하는 core(`1.8.2-beta.1` 같은 비교자가 있을 때) */
  preCores: string[];
}

function coreOf(v: string): string {
  return v.replace(/^v/, "").replace(/[-+].*$/, "");
}

/** 단순 비교자 하나 · `^` · `~` · X 범위를 구간으로 바꿔요. 읽지 못하면 `undefined` */
function intervalsOfToken(token: string): VersionInterval[] | undefined {
  const t = token.trim();
  if (t === "" || t === "*" || /^[xX]$/.test(t)) return [{ preCores: [] }];
  const op = /^(\^|~>?|>=|<=|>|<|=)?\s*(.+)$/.exec(t);
  if (!op) return undefined;
  const p = parsePartialVersion(op[2]);
  if (!p) return undefined;
  const full = (maj: number, min: number, pat: number, pre?: string) => `${maj}.${min}.${pat}${pre ? `-${pre}` : ""}`;
  const preCores = p.pre !== undefined ? [full(p.major ?? 0, p.minor ?? 0, p.patch ?? 0)] : [];
  const lower = full(p.major ?? 0, p.minor ?? 0, p.patch ?? 0, p.pre);
  const kind = op[1] ?? "";
  if (p.major === undefined) return kind === "" || kind === "=" || kind === ">=" ? [{ preCores }] : undefined;
  // 부분 버전의 다음 경계(`1.8` → 1.9.0, `1` → 2.0.0)
  const next =
    p.minor === undefined ? full(p.major + 1, 0, 0) : p.patch === undefined ? full(p.major, p.minor + 1, 0) : undefined;
  switch (kind) {
    case "":
    case "=":
      return [next === undefined ? { min: { v: lower, inclusive: true }, max: { v: lower, inclusive: true }, preCores } : { min: { v: lower, inclusive: true }, max: { v: next, inclusive: false, coreOnly: true }, preCores }];
    case ">=":
      return [{ min: { v: lower, inclusive: true }, preCores }];
    case ">":
      return [next === undefined ? { min: { v: lower, inclusive: false }, preCores } : { min: { v: next, inclusive: true }, preCores }];
    case "<":
      return [{ max: { v: lower, inclusive: false, coreOnly: p.pre === undefined }, preCores }];
    case "<=":
      return [next === undefined ? { max: { v: lower, inclusive: true }, preCores } : { max: { v: next, inclusive: false, coreOnly: true }, preCores }];
    case "~":
    case "~>": {
      const upper = p.minor === undefined ? full(p.major + 1, 0, 0) : full(p.major, p.minor + 1, 0);
      return [{ min: { v: lower, inclusive: true }, max: { v: upper, inclusive: false, coreOnly: true }, preCores }];
    }
    case "^": {
      const upper =
        p.major > 0 || p.minor === undefined
          ? full(p.major + 1, 0, 0)
          : p.minor > 0 || p.patch === undefined
            ? full(0, p.minor + 1, 0)
            : full(0, 0, p.patch + 1);
      return [{ min: { v: lower, inclusive: true }, max: { v: upper, inclusive: false, coreOnly: true }, preCores }];
    }
  }
  return undefined;
}

function satisfiesInterval(version: string, iv: VersionInterval): boolean | undefined {
  if (iv.min !== undefined) {
    const c = compareExactVersions(version, iv.min.v);
    if (c === undefined) return undefined;
    if (c < 0 || (c === 0 && !iv.min.inclusive)) return false;
  }
  if (iv.max !== undefined) {
    const c = iv.max.coreOnly ? compareExactVersions(coreOf(version), coreOf(iv.max.v)) : compareExactVersions(version, iv.max.v);
    if (c === undefined) return undefined;
    if (c > 0 || (c === 0 && !iv.max.inclusive)) return false;
  }
  return true;
}

/**
 * 정확한 버전이 선언 범위를 만족하는지(WI-0098, unplugged 설치본 고르기 전용). 받는 형태: 정확한 버전 · `=` · `^` · `~` · X 범위
 * (`1.x` · `1.8` · `*`) · 비교자 집합(`>=1.8.0 <2`) · 하이픈 범위(`1.8.0 - 1.9.0`) · `||`. prerelease 버전은 같은 core 의 prerelease
 * 비교자가 있는 범위에서만 맞아요(npm semver 와 같은 규칙). 그 밖의 형태(`workspace:` · `catalog:` · `npm:` · `latest` · git · 파일)는
 * `undefined`(판정 불가)예요. 버전 비교는 `compareExactVersions`(prerelease 끼리는 순서를 보지 않음)를 써요.
 */
export function versionSatisfiesRange(version: string, range: string): boolean | undefined {
  if (exactVersionOf(version) === undefined) return undefined;
  const alternatives = range.trim().split("||");
  let unknown = false;
  for (const alt of alternatives) {
    const a = alt.trim();
    let intervals: VersionInterval[] | undefined;
    const hyphen = /^(\S+)\s+-\s+(\S+)$/.exec(a);
    if (hyphen) {
      const lo = intervalsOfToken(`>=${hyphen[1]}`);
      const hi = intervalsOfToken(`<=${hyphen[2]}`);
      intervals = lo && hi ? [...lo, ...hi] : undefined;
    } else {
      const tokens = a === "" ? [""] : a.replace(/(>=|<=|>|<|=|\^|~>?)\s+/g, "$1").split(/\s+/);
      const parts = tokens.map(intervalsOfToken);
      intervals = parts.every((x) => x !== undefined) ? parts.flat() : undefined;
    }
    if (intervals === undefined) {
      unknown = true;
      continue;
    }
    const pre = /-/.test(version.replace(/\+.*$/, ""));
    if (pre && !intervals.some((iv) => iv.preCores.includes(coreOf(version)))) continue;
    const results = intervals.map((iv) => satisfiesInterval(version, iv));
    if (results.some((x) => x === undefined)) {
      unknown = true;
      continue;
    }
    if (results.every((x) => x === true)) return true;
  }
  return unknown ? undefined : false;
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
