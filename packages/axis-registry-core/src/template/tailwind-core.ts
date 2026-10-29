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
 * - `checkGlobalsCss`: globals.css 항목(WI-0044 보정). 변수를 직접 정의하지 않아도 tokens CSS import 가 있으면 pass 입니다(WI-0097 2부부터
 *   그 import 가 해석될 때만, 아래).
 * - WI-0100a: 전역 CSS 를 읽는 3항목(Tailwind 4 의 tailwind.config · globals.css · Tailwind 4 의 animation)은 `selectCheckGlobalCss` 로 같은
 *   파일을 고릅니다. `axis.config.json` 의 `globalCss`(실재하는 `.css` 일반 파일, 프로젝트 밖은 읽기만) 다음 `TAILWIND_CSS_CANDIDATES` 순이고,
 *   `globalCss` 를 쓰지 못하면 표기를 붙입니다.
 * - WI-0100b: 세 항목과 brand 항목은 고른 파일이 조건 없는 상대 `@import`(`"./x.css"` · `'../x.css'` · `@import"./x.css"` · `"./x"`,
 *   `url()` · `layer()` · `supports()` · media 조건은 제외, 사용자 결정 Q50 · Q51 · Q56)로 들여온 프로젝트 안 하위 CSS 도 근거로 봅니다
 *   (`expandGlobalCss`, 실경로 기준 프로젝트 안 · 방문 집합 · 깊이 `CSS_IMPORT_DEPTH_LIMIT` 32, Q53). 근거 줄은 펼친 근거 문자열에서, 결함 판정
 *   (create-next-app 기본 정의 · Arial)은 진입 파일만 봅니다(D9). 하위 파일의 패키지 줄은 진입 파일과 같은 WI-0097 해석 게이트를 그 줄이 있는
 *   파일의 디렉터리 기준으로 거치고(D8 ①, Q54), 근거를 하위 파일에서 찾으면 문구 끝에 「(app/axis.css 의 import)」를 붙입니다(D6 · Q55,
 *   `cssImportViaNote`). 상대 `@import` 가 순환하면 globals.css 항목이 진입 파일만의 판정 문구 뒤에 「 / 」로 순환 문구를 붙여 WARN 을 내고
 *   모든 항목이 진입 파일만 근거로 봅니다(Q52 · Q59). 순환은 조건 붙은 상대 import 까지 넣어 Tailwind 4 재귀 한도 100 단계까지 찾아요(Q57).
 * - `axisPackagesBelowTailwind4`: `axis init` 의 Tailwind 4 버전 안내와 위 WARN 이 같은 판정을 씁니다.
 * - 배치 3(WI-0070 · WI-0072): globals.css 는 AXIS 근거(tokens CSS import · `--axis-*` 정의 · 루트 레이아웃의 tokens CSS JS import)가
 *   있을 때만 pass, animation 은 plugins 배열 판독, Tailwind 3 preset 은 CommonJS 형태 + 설치본 tokens 버전으로 판정합니다
 *   (WI-0101 부터 그 앞에 모든 모양의 tokens 해석 판정이 있어요, 아래).
 *   설치본은 `findInstalledPackage`(상위 디렉터리 탐색, project.ts) 하나로 읽습니다.
 * - WI-0074: `detectTailwind` · `axisPackagesBelowTailwind4` 도 같은 `findInstalledPackage` 로 읽습니다(종전에는 `<baseDir>/node_modules`
 *   한 층만 읽어 호이스팅 모노레포에서 설치본을 못 찾고 선언으로 떨어졌습니다. WI-0051 PRD D4 에서 남겼던 것을 해소).
 *   Plug'n'Play(`isPnpProject`)면 설치본을 읽지 않고 선언으로 갑니다(`packageVersionGate` · dependencies 와 같은 규칙).
 *   init · theme add · template apply · axis add 도 같은 함수를 쓰므로 함께 바뀝니다(전이 표는 WI-0074 testplan).
 * - WI-0080: Tailwind 3 content 판정의 패키지 표본 · 제안도 `findInstalledPackage` 로 찾은 설치본 위치(baseDir 기준 상대 경로)를
 *   씁니다(호이스팅이면 `../../node_modules/<pkg>`). 덮음 판정은 `contentGlobCovers`(앞쪽 `../` 개수 비교 · 절대경로 비교)입니다.
 * - WI-0098: Plug'n'Play 의 content 판정은 node_modules 표본을 덮음으로 보지 않습니다. unplugged 설치본(앱 선언 범위에 맞는 버전)만
 *   표본으로 인정하고(`**` · `*` 가 `.yarn` 같은 점 세그먼트를 넘지 않는 glob 만, Q33), node_modules glob · 넓은 `./**` 는 WARN,
 *   루트 전용 선언은 「앱 package.json 에 선언하세요」 안내입니다. 안내에는 덮지 않은 패키지 이름을 채웁니다(`contentPnpNote`, Q31).
 * - WI-0086: 의존성 선언 판정(Tailwind 버전 · 1.4.0 안내 · 버전 게이트 · Tailwind 4 컴포넌트 tailwind.css · content 대상 ·
 *   animation 의 ui-react 사용과 tailwindcss-animate 선언)은 project.ts 의 `declaredDependency`(앱 다음 워크스페이스 루트)로 봅니다.
 *   공개 함수는 진입부에서 `resolveBaseDir`(심볼릭 링크를 푼 실경로)로 기준 디렉터리를 한 번 맞추고, 찾은 설치본 디렉터리는 풀지 않습니다.
 * - WI-0097(사용자 결정 Q21 · Q22): Tailwind 4 B1 은 선언 여부가 아니라 `<pkg>/tailwind.css` 가 이 앱에서 해석되는지로 봅니다
 *   (project.ts `componentCssResolution`, theme add 의 WI-0087 DEC-2 와 같은 함수). 해석되지 않는 루트 선언(Plug'n'Play 루트 전용 ·
 *   미설치 · 설치본에 파일 없음)은 줄을 바로 권하지 않고, 이미 있는 줄은 PASS 로 인정하지 않습니다. 단 줄이 있을 때 설치본이
 *   1.4.0 미만이면(root-old) 종전 버전 판정(버전 WARN)을 따르고, 버전을 읽을 수 없고 파일도 없으면 해석 불가 WARN 입니다(사용자 결정 Q39).
 *   앱 선언은 종전 그대로입니다.
 *   위 보정 2차 · 3차의 「선언된 ui-react · agentic-ui」는 이 판정으로 좁혀졌어요.
 * - WI-0097 2부(사용자 결정 Q28 · Q37): globals.css 의 tokens 근거(CSS import · 루트 레이아웃 JS import)도 이 앱에서 해석될 때만 pass 입니다
 *   (project.ts `tokensCssResolution`. 앱 선언은 미설치여도 pass, 설치본 디렉터리가 있으면 pass, 루트 선언 미설치 · 미선언 미설치 · PnP 루트
 *   전용은 warn). 위 배치 3 의 「tokens CSS import 가 있으면 pass」는 이 조건으로 좁혀졌어요. 프로젝트 밖 진입 CSS(`globalCss` 가 앱 밖)의
 *   패키지 줄(`tailwindcss` · 토큰 · 컴포넌트 `tailwind.css`)은 그 파일 위치에서 설치본이 보이는지도 봅니다(`outsideCssPackageResolution`).
 * - WI-0101(사용자 결정 Q61 ~ Q68): Tailwind 3 preset 참조는 모양(CommonJS require · `.default` · ESM import · `.ts`)과 상관없이
 *   tokens 가 이 앱에서 해석될 때만 pass 입니다(globals.css 와 같은 `tokensCssResolution`, `presetTokensUnresolvedMessage`). 루트 선언 미설치 ·
 *   미선언 미설치 · PnP 루트 전용은 warn, 앱 선언은 미설치여도 종전 판정이에요. 위 배치 3 의 「Tailwind 3 preset 은 CommonJS 형태 + 설치본
 *   tokens 버전으로 판정」은 버전 판정(CommonJS bare 만, Q64)의 범위이고, 해석 판정은 그 앞에서 모든 모양에 걸려요.
 */

import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import {
  PNP_ROOT_ONLY_NOTE,
  ROOT_LAYOUT_FILES,
  TAILWIND4_MIN_AXIS_VERSION,
  compareExactVersions,
  cssImportViaNote,
  componentCssResolution,
  componentCssResolvable,
  declaredDependency,
  dependencyInstallGuide,
  findInstalledPackage,
  findPnpUnpluggedPackages,
  globalCssSelectionNote,
  hasDependency,
  isPnpProject,
  outsideCssPackageResolution,
  pnpProjectRoot,
  pnpRootOnlyDependency,
  resolveBaseDir,
  selectGlobalCss,
  tokensCssResolution,
  type ComponentCssResolution,
  type GlobalCssSelection,
} from "../project.js";

/**
 * 판정에 쓰는 의존성 선언 범위(WI-0086). 앱 package.json 다음 워크스페이스 루트 package.json 순입니다(`declaredDependency`).
 * 종전에는 이 파일에 앱 선언만 보는 지역 `hasDependency` 사본이 있어, 설치본은 루트에서 찾으면서 선언은 앱만 보는 비대칭이었습니다.
 */
function declaredRange(baseDir: string, pkg: Record<string, unknown> | undefined, name: string): string | undefined {
  return declaredDependency(baseDir, pkg, name)?.range;
}

/**
 * check 판정 전용 선언 범위(WI-0091, 사용자 결정 Q1 · Q2). Plug'n'Play 면 루트 선언을 인정하지 않고 앱 선언만 봅니다.
 * 거짓 PASS 를 만드는 판정(버전 게이트 · 애니메이션 플러그인 선언)만 씁니다. Tailwind major 판정 · content 대상 · 1.4.0 안내 ·
 * animation 의 ui-react 사용 판정은 종전대로 `declaredRange` 입니다(사용자 결정 Q6 · Q7). B1(Tailwind 4 컴포넌트 tailwind.css)은
 * WI-0097(사용자 결정 Q22 가 Q7 을 다시 엶)부터 이 함수도 `declaredRange` 도 아니고 project.ts `componentCssResolution`(해석 상태)으로 봅니다.
 */
function declaredRangeForCheck(baseDir: string, pkg: Record<string, unknown> | undefined, name: string): string | undefined {
  return declaredDependency(baseDir, pkg, name, undefined, { appOnlyInPnp: true })?.range;
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
  const baseDir = resolveBaseDir(baseDirInput);
  const declared = pkg ? declaredRange(baseDir, pkg, "tailwindcss") : undefined;
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

/**
 * check 의 CSS 판정 3항목(Tailwind 4 의 tailwind.config · globals.css · Tailwind 4 의 animation)이 `axis.config.json` 의
 * `globalCss` 다음으로 보는 후보(앞에서부터, 루트 우선). 세 항목이 `selectCheckGlobalCss` 로 같은 파일을 고릅니다(WI-0100a).
 */
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

// ---------------------------------------------------------------------------------------------------------------------
// WI-0100b: 전역 CSS 의 상대 @import 펼침 (「어느 파일을 읽나」. 패키지 경로 줄의 해석 판정은 WI-0097 헬퍼 몫)

/**
 * 펼침 깊이 한도(진입 파일 = 0, 진입 파일이 직접 import 한 파일 = 1). 이 깊이까지의 파일만 읽고 더 깊은 파일은 읽지 않아요(사용자 결정 Q53:
 * 32 단계는 따라가고 33 단계의 근거는 펼치기 전과 같이 인정하지 않음). 실빌드(`@tailwindcss/postcss` 4.1.14)는 51 단계 사슬까지 펼쳤으므로
 * 한도 안의 파일은 실제로도 들어와요(33 단계 사슬은 실빌드가 펼치지만 check 는 WARN, 결정의 대가).
 */
export const CSS_IMPORT_DEPTH_LIMIT = 32;

/**
 * 순환 판정용 읽기 깊이 한도(사용자 결정 Q57). Tailwind 4 실빌드(`tailwindcss` dist/lib.js 의 `if(t>100)throw … Exceeded maximum recursion depth`)의
 * 재귀 한도와 같은 100 단계까지 읽어, 근거 한도(`CSS_IMPORT_DEPTH_LIMIT`) 밖에서 닫히는 순환도 찾아요. 이 한도까지 읽은 파일은 순환 판정에만 쓰고
 * 근거 · `packageLines` 에는 넣지 않아요(근거 범위는 Q51 · Q53 그대로).
 */
export const CSS_IMPORT_CYCLE_DEPTH_LIMIT = 100;

/**
 * 따라가는 상대 `@import`: 따옴표 문자열이 `./` · `../` 로 시작하는 것. Tailwind 4 실빌드가 펼치는 형태를 따라요(사용자 결정 Q56):
 * `"./x.css"` · `'../x.css'`, `@import` 와 따옴표 사이 공백 없음(`@import"./x.css"`), 다른 종류의 따옴표가 든 이름(`"./it's.css"`).
 * 캡처: 1 = 큰따옴표 안 경로, 2 = 작은따옴표 안 경로, 3 = 경로 뒤부터 `;` · `{` · `}` 앞까지(소비하지 않는 앞보기).
 * - 3 에 공백 말고 다른 것이 있으면(`layer()` · `supports()` · media 조건) 따라가지 않아요(사용자 결정 Q51, `isConditionalCssImport`).
 *   실빌드에서 토큰 진입점을 그 조건 안에 두면 「`@custom-variant` cannot be nested」로 실패하므로 근거로 인정하지 않아요.
 * - `url(...)` 형태는 따라가지 않아요(사용자 결정 Q50, 실빌드에서 Tailwind 4 · Next 가 펼치지 않고 그대로 남김).
 * - `"axis.css"` 처럼 `./` 가 없는 이름은 패키지 경로라 따라가지 않아요. 주석은 미리 지운 CSS 에 써요.
 */
const RELATIVE_CSS_IMPORT = /@import\s*(?:"(\.{1,2}\/[^"\n]*)"|'(\.{1,2}\/[^'\n]*)')(?=([^;{}]*))/g;

/** 상대 `@import` 뒤에 조건(`layer()` · `supports()` · media)이 붙었는지(`RELATIVE_CSS_IMPORT` 캡처 3, 사용자 결정 Q51) */
function isConditionalCssImport(tail: string | undefined): boolean {
  return tail !== undefined && tail.trim() !== "";
}

/**
 * 상대 `@import` 경로가 가리키는 파일(사용자 결정 Q56, Tailwind 4 실빌드로 확인한 규칙). 적힌 경로의 일반 파일이 먼저이고, 없으면 끝에 `.css` 를
 * 붙인 일반 파일이에요(`"./axis"` → `axis.css`, 확장자 없는 `axis` 파일이 함께 있으면 실빌드도 `axis` 를 씀). 디렉터리(`index.css` ·
 * `package.json` 의 `style`)는 따라가지 않아요. 끝이 `/` 인 경로(`"./axis/"`)도 실빌드가 디렉터리로만 풀어(「Can't resolve './axis/'」) 따라가지 않아요
 * (`resolve` 가 끝 슬래시를 지워 `axis.css` 로 맞아떨어지지 않게). 없으면 `undefined`.
 */
function resolveRelativeCssImport(fromDir: string, spec: string): string | undefined {
  if (spec.endsWith("/")) return undefined;
  const target = resolve(fromDir, spec);
  if (regularFile(target)) return target;
  if (regularFile(`${target}.css`)) return `${target}.css`;
  return undefined;
}

/** `@import` 의 경로 문자열(`"..."` · `'...'` · `url("...")`). 패키지 경로 줄을 모을 때 써요 */
const CSS_IMPORT_SPEC = /@import\s+(?:url\(\s*)?(["'])([^"'\n]+)\1/g;

/** 패키지 경로 줄인지(상대 · 절대 경로 · `http:` 류 URL 이 아님) */
function isPackageCssSpec(spec: string): boolean {
  return !spec.startsWith("./") && !spec.startsWith("../") && !spec.startsWith("/") && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(spec);
}

/** 펼친 파일 하나 */
export interface ExpandedCssFile {
  /** 표시용 경로. 진입 파일은 고른 파일의 `rel` 그대로, 하위 파일은 실경로 기준 앱 상대 경로(`/` 구분) */
  rel: string;
  /** 실경로 */
  path: string;
  /** 주석을 지운 내용 */
  css: string;
  /** 진입 파일 = 0 */
  depth: number;
  /**
   * 이 파일의 패키지 줄을 해석할 기준 디렉터리. 진입 파일은 WI-0097 2부 규칙 그대로(프로젝트 밖이면 그 디렉터리, 안이면 `undefined` = 앱 기준)이고,
   * 하위 파일은 그 파일의 디렉터리예요(사용자 결정 Q54: 빌드 도구가 그 줄을 그 파일 위치부터 풀므로 하위 디렉터리의 중첩 `node_modules` 도 반영)
   */
  cssDir?: string;
}

/** 패키지 경로 `@import` 줄 하나와 그 출처 파일 */
export interface CssPackageLine {
  spec: string;
  /** 그 줄이 있는 파일(`ExpandedCssFile.rel`) */
  file: string;
  /** 출처 파일의 `cssDir` */
  cssDir?: string;
}

/** `expandGlobalCss` 결과 */
export interface ExpandedGlobalCss {
  /** 진입 파일 내용 그대로. 결함 판정(create-next-app 기본 정의 · Arial)은 이것만 봐요(WI-0100 D9) */
  entry: string;
  /** 근거 문자열(「있어야 할 줄」 판정용). 방문한 파일의 주석을 지운 내용을 방문 순서로 이은 것이고, 하위 파일이 없으면 `entry` 그대로예요 */
  evidence: string;
  /** 방문한 파일(진입 파일이 맨 앞, 그다음 너비 우선) */
  files: ExpandedCssFile[];
  /** 방문한 파일들의 패키지 경로 `@import` 줄(나온 순서). 펼치지 않고 출처 파일과 함께 넘겨요(해석 판정은 WI-0097 헬퍼) */
  packageLines: CssPackageLine[];
  /**
   * 상대 `@import` 가 순환하면(어떤 파일이 import 사슬의 조상 · 자기 자신을 다시 import) 처음 찾은 순환에 든 파일의 표시 경로(순환 순서,
   * 사용자 결정 Q52). 순환은 조건 붙은 import 까지 넣어 100 단계까지 찾아요(사용자 결정 Q57). 이때 실빌드가 「Exceeded maximum recursion depth」로 실패하므로 `evidence` · `files` · `packageLines` 는 진입 파일만이에요
   * (순환 뒤의 근거를 인정하지 않음). 같은 파일을 두 갈래로 들여오는 것(다이아몬드)은 실빌드가 성공하므로 순환이 아니에요. 순환이 없으면 없음
   */
  cycle?: string[];
}

/**
 * 상대 `@import` 순환 문제 문구(사용자 결정 Q52). globals.css 항목만 이 문구를 내요(다른 항목에 중복하지 않음).
 * 순환에 든 파일이 하나(자기 자신을 import)면 「자기 자신을 @import」 문구예요(사용자 결정 Q60 ①)
 */
export function cssImportCycleIssue(files: readonly string[]): string {
  if (files.length === 1) return `${files[0]} 이 자기 자신을 @import 해 빌드가 순환으로 실패합니다 → 순환하는 @import 를 없애세요`;
  return `${files.join(" · ")} 이 서로 @import 해 빌드가 순환으로 실패합니다 → 순환하는 @import 를 없애세요`;
}

/** `edges`(실경로 → 실경로 목록, import 순서) 에서 `start` 부터 깊이 우선으로 처음 만난 순환(순환 순서의 실경로). 없으면 `undefined` */
function findImportCycle(start: string, edges: ReadonlyMap<string, readonly string[]>): string[] | undefined {
  const state = new Map<string, "open" | "done">();
  const trail: string[] = [start];
  const stack: Array<{ node: string; next: number }> = [{ node: start, next: 0 }];
  state.set(start, "open");
  while (stack.length > 0) {
    const top = stack[stack.length - 1];
    const out = edges.get(top.node) ?? [];
    if (top.next >= out.length) {
      state.set(top.node, "done");
      stack.pop();
      trail.pop();
      continue;
    }
    const to = out[top.next++];
    const s = state.get(to);
    if (s === "open") return trail.slice(trail.indexOf(to));
    if (s === "done") continue;
    state.set(to, "open");
    trail.push(to);
    stack.push({ node: to, next: 0 });
  }
  return undefined;
}

function regularFile(file: string): boolean {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

/**
 * 전역 CSS 의 상대 `@import` 를 따라가 근거 문자열을 만듭니다(WI-0100b, 사용자 결정 · 선례 D3 · D8 · D9). 파일을 쓰지 않아요.
 * - 조건 없는 상대 경로(`RELATIVE_CSS_IMPORT`, Q50 · Q51 · Q56)만 따라가고, 경로는 import 한 파일의 실경로 디렉터리 기준으로
 *   `resolveRelativeCssImport` 로 풀어요(적힌 이름 다음 `.css` 를 붙인 이름).
 * - **프로젝트 안**(대상 실경로가 앱 실경로 아래)인 일반 파일만 읽어요. `../` 로 앱을 벗어나는 import · 앱 밖을 가리키는 심볼릭 링크 ·
 *   없는 파일 · 디렉터리는 건너뛰어요. 진입 파일이 프로젝트 밖(`globalCss` 가 앱 밖, Q25)이어도 그 파일의 상대 import 는 같은 규칙이라
 *   대상이 앱 안일 때만 읽어요(PRD 4절).
 * - 방문 집합(실경로)으로 같은 파일은 한 번만 읽고, 근거는 `CSS_IMPORT_DEPTH_LIMIT`(32, Q53) 보다 깊은 파일에서 찾지 않아요.
 * - 순환은 따로 걸어 찾아요(사용자 결정 Q57): 조건 붙은 상대 import 도 간선에 넣고 `CSS_IMPORT_CYCLE_DEPTH_LIMIT`(100, Tailwind 4 재귀 한도)까지
 *   읽어요. 이렇게 읽은 파일(33 단계 이후 · 조건 import 로만 닿는 파일)은 순환 판정에만 쓰고 근거 · `packageLines` 에는 넣지 않아요.
 *   순환이 있으면 진입 파일만 돌려주며 `cycle` 을 채워요(Q52).
 * - 패키지 경로 줄은 펼치지 않고 `packageLines` 에 출처 파일과 그 파일의 해석 기준 디렉터리(하위 파일은 그 파일 디렉터리, Q54)와 함께 담아요.
 * `entryCssDir` 는 진입 파일의 패키지 줄 기준 디렉터리(프로젝트 밖 진입 파일이면 그 디렉터리, `outsideCssDir`)예요.
 */
export function expandGlobalCss(
  baseDirInput: string,
  entryPath: string,
  entryRel: string,
  entryCssDir?: string
): ExpandedGlobalCss {
  const baseDir = resolveBaseDir(baseDirInput);
  const entry = readFileSync(entryPath, "utf8");
  let entryReal = entryPath;
  try {
    entryReal = realpathSync(entryPath);
  } catch {
    // 읽었으면 실경로도 풀려요. 못 풀면 적힌 경로로 방문 집합을 채워요
  }
  // 두 번 걷는 동안 같은 파일을 다시 읽지 않도록 내용을 모아 둬요(실경로 → 원문)
  const raws = new Map<string, string>([[entryReal, entry]]);
  const files: ExpandedCssFile[] = [];
  const packageLines: CssPackageLine[] = [];
  const evidenceWalk = walkRelativeCssImports(baseDir, entryReal, raws, CSS_IMPORT_DEPTH_LIMIT, false);
  const relOfReal = new Map<string, string>([[entryReal, entryRel]]);
  for (const node of evidenceWalk.order) {
    const isEntry = node.real === entryReal;
    const rel = isEntry ? entryRel : node.rel;
    const css = stripCssComments(raws.get(node.real) ?? "");
    const file: ExpandedCssFile = { rel, path: node.real, css, depth: node.depth };
    const cssDir = isEntry ? entryCssDir : dirname(node.real);
    if (cssDir !== undefined) file.cssDir = cssDir;
    files.push(file);
    relOfReal.set(node.real, rel);
    for (const m of css.matchAll(CSS_IMPORT_SPEC)) {
      if (!isPackageCssSpec(m[2])) continue;
      const line: CssPackageLine = { spec: m[2], file: rel };
      if (cssDir !== undefined) line.cssDir = cssDir;
      packageLines.push(line);
    }
  }
  // 순환 판정(Q52 · Q57)은 따로 걸어요: 조건 붙은 상대 import 도 간선에 넣고 Tailwind 4 재귀 한도(100 단계)까지 읽어요. 근거 범위는 위 그대로예요
  const cycleWalk = walkRelativeCssImports(baseDir, entryReal, raws, CSS_IMPORT_CYCLE_DEPTH_LIMIT, true);
  const cycle = findImportCycle(entryReal, cycleWalk.edges);
  if (cycle !== undefined) {
    // 순환이 있으면 실빌드가 실패하므로 하위 파일의 근거를 인정하지 않아요(Q52). 진입 파일만 남겨 펼치기 전과 같은 판정이 돼요
    for (const node of cycleWalk.order) if (!relOfReal.has(node.real)) relOfReal.set(node.real, node.rel);
    const head = files[0];
    return {
      entry,
      evidence: entry,
      files: [head],
      packageLines: packageLines.filter((l) => l.file === head.rel),
      cycle: cycle.map((p) => relOfReal.get(p) ?? p),
    };
  }
  const evidence = files.length === 1 ? entry : files.map((f) => f.css).join("\n");
  return { entry, evidence, files, packageLines };
}

/** `walkRelativeCssImports` 가 방문한 파일 하나(실경로 · 앱 상대 표시 경로 · 깊이) */
interface CssImportWalkNode {
  real: string;
  rel: string;
  depth: number;
}

/**
 * `entryReal` 부터 상대 `@import` 를 너비 우선으로 따라가요(방문 집합 = 실경로, 같은 파일은 한 번만). `expandGlobalCss` 의 두 걸음
 * (근거: 조건 없는 import · 32 단계, 순환: 조건 import 포함 · 100 단계, 사용자 결정 Q53 · Q57)이 같이 써요.
 * - `includeConditional` 이 거짓이면 조건(`layer()` · `supports()` · media)이 붙은 import 는 따라가지 않아요(Q51).
 * - 프로젝트 안(실경로가 앱 실경로 아래)인 일반 파일만 새로 읽어요. 이미 방문한 파일로 가는 import 는 깊이 · 위치와 무관하게 간선으로 남겨요.
 * - `limit` 깊이의 파일은 이미 방문한 파일로 가는 간선만 남기고 새 파일은 읽지 않아요.
 * `raws` 는 읽은 원문 캐시(실경로 → 원문)로, 진입 파일은 미리 넣어 둬요.
 */
function walkRelativeCssImports(
  baseDir: string,
  entryReal: string,
  raws: Map<string, string>,
  limit: number,
  includeConditional: boolean
): { order: CssImportWalkNode[]; edges: Map<string, string[]> } {
  const order: CssImportWalkNode[] = [];
  const edges = new Map<string, string[]>();
  const visited = new Set<string>([entryReal]);
  const queue: CssImportWalkNode[] = [{ real: entryReal, rel: "", depth: 0 }];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    order.push(cur);
    const css = stripCssComments(raws.get(cur.real) ?? "");
    const out: string[] = [];
    edges.set(cur.real, out);
    for (const m of css.matchAll(RELATIVE_CSS_IMPORT)) {
      if (!includeConditional && isConditionalCssImport(m[3])) continue;
      const target = resolveRelativeCssImport(dirname(cur.real), m[1] ?? m[2]);
      if (target === undefined) continue;
      let real: string;
      try {
        real = realpathSync(target);
      } catch {
        continue;
      }
      if (visited.has(real)) {
        out.push(real);
        continue;
      }
      // 한도 깊이의 파일은 이미 읽은 파일로 가는 import(순환 판정)만 보고 새 파일은 읽지 않아요(BFS 라 한도 안의 파일은 이미 방문 집합에 있음)
      if (cur.depth >= limit) continue;
      const rel = relative(baseDir, real);
      if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) continue;
      if (!raws.has(real)) {
        try {
          raws.set(real, readFileSync(real, "utf8"));
        } catch {
          continue;
        }
      }
      visited.add(real);
      out.push(real);
      queue.push({ real, rel: rel.split(sep).join("/"), depth: cur.depth + 1 });
    }
  }
  return { order, edges };
}

/** 근거 줄이 처음 나온 파일(방문 순서). 없으면 `undefined` */
function evidenceOrigin(expanded: ExpandedGlobalCss, test: (css: string) => boolean): ExpandedCssFile | undefined {
  return expanded.files.find((f) => test(f.css));
}

/** 패키지 줄 `spec` 의 해석 기준 디렉터리(처음 나온 출처 파일 기준). 줄을 못 찾으면 진입 파일 기준(종전과 같음) */
function packageLineCssDir(expanded: ExpandedGlobalCss, spec: string): string | undefined {
  const line = expanded.packageLines.find((l) => l.spec === spec);
  return line !== undefined ? line.cssDir : expanded.files[0]?.cssDir;
}

/** 근거를 준 하위 파일(진입 파일 제외, 중복 제거, 나온 순서)의 표시 경로. D6 접미사(`cssImportViaNote`)에 넘겨요 */
function viaFiles(origins: ReadonlyArray<ExpandedCssFile | undefined>): string[] {
  const out: string[] = [];
  for (const o of origins) if (o !== undefined && o.depth > 0 && !out.includes(o.rel)) out.push(o.rel);
  return out;
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
  const baseDir = resolveBaseDir(baseDirInput);
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

/** `@axis-ds/tokens` 패키지 이름(globals.css 게이트 · 설치 안내용) */
const TOKENS_PACKAGE_NAME = "@axis-ds/tokens";

/**
 * 고른 전역 CSS 가 프로젝트 밖(`globalCss` 가 앱 밖, WI-0100a Q25)이면 그 파일의 디렉터리, 앱 안이면 `undefined`(WI-0097 2부, Q37).
 * 패키지 줄은 이 디렉터리 기준으로 풀려요(`outsideCssPackageResolution`).
 */
function outsideCssDir(selection: GlobalCssSelection): string | undefined {
  if (selection.path === undefined || selection.rel === undefined) return undefined;
  const outside = selection.rel === ".." || selection.rel.startsWith("../") || isAbsolute(selection.rel);
  return outside ? dirname(selection.path) : undefined;
}

/**
 * 프로젝트 밖 진입 CSS 의 패키지 줄이 그 파일 위치에서 해석되지 않을 때의 문제(WI-0097 2부, 사용자 결정 Q37). `spec` 은 import 경로예요.
 * 문구 틀은 Q43 의 「<spec> import 가 있지만 … 해석되지 않습니다 → …」예요.
 */
function outsideCssUnresolvedIssue(spec: string, name: string): string {
  return `${spec} import 가 있지만 이 파일 위치에서 ${name} 를 찾지 못해 해석되지 않습니다(설치본이 앱 쪽 node_modules 에만 있음) → 이 파일의 상위 node_modules(워크스페이스 루트 등)에 설치하거나 globalCss 를 앱 안 파일로 바꾸세요`;
}

/**
 * tokens 설치 안내 구절(WI-0093 과 같은 출처 규칙: npm 루트 선언은 「워크스페이스 루트에서 npm install」, 선언 없음은 범위를 붙인 추가 명령).
 * 추가 명령의 범위는 globals.css 게이트가 `^1.4.0`(`css/tailwind4` 가 처음 들어간 버전, Q48), Tailwind 3 preset 게이트가 `^1.7.0`(WI-0101)이에요.
 */
function tokensInstallPhrase(baseDir: string, range = `^${TAILWIND4_MIN_AXIS_VERSION}`): string {
  const g = dependencyInstallGuide(baseDir, TOKENS_PACKAGE_NAME, range);
  if (g.kind === "install-at-root") return `워크스페이스 루트에서 ${g.installCommand}`;
  return g.kind === "install" ? g.installCommand : g.addCommand;
}

/**
 * globals.css 의 tokens 근거(`spec` import)가 이 앱에서 해석되지 않는 이유(WI-0097 2부, 사용자 결정 Q22 · Q28 · Q37). 해석되면 `undefined` 예요.
 * - 앱 기준(`tokensCssResolution`): 앱 선언은 미설치여도 해석됨(Q28), non-PnP 는 설치본 디렉터리가 있으면 해석됨(선언 위치와 상관없음),
 *   PnP 루트 전용 · 루트 선언 미설치 · 미선언 미설치(PnP 의 앱 미선언 포함)는 해석 불가예요
 * - `cssDir`(프로젝트 밖 진입 CSS 의 디렉터리)를 주면, 앱 기준으로 해석되는 경우에도 그 파일 위치에서 설치본을 찾지 못하면 해석 불가예요(Q37)
 */
function tokensCssUnresolvedIssue(
  baseDir: string,
  pkg: Record<string, unknown> | undefined,
  spec: string,
  cssDir?: string
): string | undefined {
  const r = tokensCssResolution(baseDir, pkg, TOKENS_PACKAGE_NAME);
  const head = `${spec} import 가 있지만`;
  if (r.kind === "pnp-root-only") return `${head} ${TOKENS_PACKAGE_NAME} 가 ${PNP_ROOT_ONLY_NOTE} → 앱 package.json 에 선언하세요`;
  if (r.kind === "not-installed") {
    return `${head} ${TOKENS_PACKAGE_NAME} 가 설치되지 않아 해석되지 않습니다 → 설치(${tokensInstallPhrase(baseDir)})`;
  }
  if (cssDir !== undefined && outsideCssPackageResolution(baseDir, cssDir, TOKENS_PACKAGE_NAME) === "unresolved") {
    return outsideCssUnresolvedIssue(spec, TOKENS_PACKAGE_NAME);
  }
  return undefined;
}

/**
 * globals.css 항목을 판정합니다(`axis check` · MCP `axis.check_project` 공용, WI-0044 보정 · WI-0070).
 * `selectCheckGlobalCss` 가 고른 파일 하나(`globalCss` 가 가리키는 실재 `.css` 파일, 없으면 `TAILWIND_CSS_CANDIDATES` 에서 처음 찾은 파일,
 * WI-0100a)와 그 파일이 상대 `@import` 로 들여온 프로젝트 안 하위 파일(WI-0100b, 근거만, Arial 은 진입 파일만)을 봅니다. `globalCss` 를 쓰지 못했으면 모든 심각도의 문구 끝에 「(globalCss <값> 없음)」류 표기를 붙입니다.
 * pass 는 AXIS 근거가 있을 때만입니다.
 * 1. tokens CSS import(`findTokensCssImport`) → pass(import 로 인정했다는 것을 문구에 남김)
 * 2. `--axis-*` 변수 정의 → pass
 * 3. 루트 레이아웃 JS 의 tokens CSS import(`findLayoutTokensCssImport`) → pass(CSS 에는 근거가 없어도 같은 변수가 들어옴).
 *    고른 파일에 1 · 2 의 근거가 없을 때만 보고, 문구의 파일명은 고른 파일입니다(WI-0100 D11).
 *    WI-0097 2부: 1 · 3 의 import 는 이 앱에서 해석될 때만 pass 이고, 해석되지 않으면 「<spec> import 가 있지만 … 해석되지 않습니다」 warn 이에요
 *    (`tokensCssUnresolvedIssue`. 앱 선언은 미설치여도 pass 그대로(Q28), 프로젝트 밖 진입 CSS 는 그 파일 위치 기준도 봄(Q37)). 2 는 게이트 밖이에요.
 * 4. 자체 `--background` · `--primary` 만 있음 → warn「AXIS 토큰 미사용」. 종전에는 pass 였습니다(거짓 초록, WI-0070).
 *    템플릿 4종(자체 HSL)은 WI-0067 전까지 이 warn 입니다(2026-10-25 사용자 결정, 종료 코드는 그대로).
 * 5. 아무것도 없으면 warn, 고를 파일이 하나도 없으면 fail(종전과 같음, 레이아웃 근거가 있어도 fail).
 * 상대 `@import` 가 순환하면(`expandGlobalCss` 의 `cycle`) 진입 파일만으로 위 1 ~ 5 를 판정한 문구 뒤에 「 / 」와 순환 문구를 붙이고, 진입 파일이
 * pass 여도 warn 입니다(사용자 결정 Q59).
 * Tailwind 3 이하에서 pass 조건을 채워도 create-next-app 기본 body `font-family: Arial` 이 남아 있으면 warn 입니다
 * (Tailwind 4 는 같은 판정을 tailwind.config 항목 B2 에서 냅니다).
 */
export function checkGlobalsCss(baseDirInput: string): GlobalsCssCheckResult {
  const baseDir = resolveBaseDir(baseDirInput);
  const selection = selectCheckGlobalCss(baseDir);
  const note = globalCssSelectionNote(selection);
  if (selection.path !== undefined && selection.rel !== undefined) {
    const candidate = selection.rel;
    // WI-0100b: 근거(tokens CSS import · `--axis-*` 정의)는 상대 @import 를 펼친 근거 문자열에서, 결함(Arial · 자체 변수만)은 진입 파일만(D9)
    const expanded = expandGlobalCss(baseDir, selection.path, candidate, outsideCssDir(selection));
    const judged = judgeGlobalsCss(baseDir, selection, candidate, expanded);
    // 사용자 결정 Q52 · Q59: 상대 @import 가 순환하면 실빌드가 실패하므로 이 항목만 그 문제를 알려요. 진입 파일만으로 판정한 문구 뒤에 「 / 」로
    // 순환 문구를 붙이고, 진입 파일이 PASS 여도 항목은 WARN 이에요(종료 코드 그대로, 다른 항목은 진입 파일만 근거로 판정하고 순환 문구는 없음)
    if (expanded.cycle !== undefined) {
      return { name: "globals.css", severity: "warn", message: `${judged.message} / ${cssImportCycleIssue(expanded.cycle)}${note}` };
    }
    return { name: "globals.css", severity: judged.severity, message: `${judged.message}${note}` };
  }
  return { name: "globals.css", severity: "fail", message: `globals.css 파일을 찾을 수 없습니다${note}` };
}

/** `checkGlobalsCss` 의 고른 파일 판정(문구 끝의 globalCss 표기는 부르는 쪽이 붙여요). 순환이면 `expanded` 가 진입 파일만이라 진입 파일만의 판정이에요 */
function judgeGlobalsCss(
  baseDir: string,
  selection: GlobalCssSelection,
  candidate: string,
  expanded: ExpandedGlobalCss
): { severity: "pass" | "warn"; message: string } {
  const content = expanded.entry;
  const css = stripCssComments(content);
  const imported = findTokensCssImport(expanded.evidence);
  const pkg = readPackageJson(baseDir);
  let pass: string | undefined;
  // WI-0097 2부: tokens 근거(CSS import · 레이아웃 JS import)는 이 앱에서 해석될 때만 pass 로 인정해요. `--axis-*` 직접 정의는 게이트 밖이에요
  let unresolved: string | undefined;
  let via = "";
  if (imported !== undefined) {
    // 하위 파일의 줄도 진입 파일과 같은 게이트를 그 출처 파일의 기준 디렉터리로 거쳐요(D8 ①, Q21 · Q22 대칭)
    const origin = evidenceOrigin(expanded, (f) => findTokensCssImport(f) === imported);
    via = cssImportViaNote(viaFiles([origin]));
    const issue = tokensCssUnresolvedIssue(baseDir, pkg, imported, origin !== undefined ? origin.cssDir : outsideCssDir(selection));
    if (issue !== undefined) unresolved = `${candidate}에 ${issue}`;
    else pass = `${candidate}에 AXIS CSS 변수가 있습니다 (${imported} import)`;
  } else if (AXIS_VARIABLE_DEFINITION.test(stripCssComments(expanded.evidence))) {
    // 하위 파일이 없으면 evidence 는 진입 파일 원문이라 주석을 지우고 봐요(종전 판정과 같음)
    via = cssImportViaNote(viaFiles([evidenceOrigin(expanded, (f) => AXIS_VARIABLE_DEFINITION.test(f))]));
    pass = `${candidate}에 AXIS CSS 변수(--axis-*)가 정의되어 있습니다`;
  } else {
    const layout = findLayoutTokensCssImport(baseDir);
    if (layout) {
      // 레이아웃은 앱 안 파일이라 앱 기준으로만 봐요(Q37 의 파일 위치 판정은 프로젝트 밖 CSS 몫)
      const issue = tokensCssUnresolvedIssue(baseDir, pkg, layout.spec);
      if (issue !== undefined) unresolved = `${candidate}에 AXIS CSS 변수가 없고 ${layout.file}의 ${issue}`;
      else pass = `${candidate}에 AXIS CSS 변수가 있습니다 (${layout.file}의 ${layout.spec} import)`;
    }
  }
  const head = pass ?? unresolved;
  if (head !== undefined) {
    const tailwind = detectTailwind(baseDir, pkg);
    const tailwind4 = tailwind.major !== undefined && tailwind.major >= 4;
    if (!tailwind4 && findCreateNextAppDefaults(content).some((d) => d.includes("font-family: Arial"))) {
      return {
        severity: "warn",
        message: `${head}. 다만 create-next-app 기본 body font-family: Arial 이 남아 있습니다 → 지우세요(AXIS 글꼴 대신 Arial 이 적용됨)${via}`,
      };
    }
    return { severity: pass !== undefined ? "pass" : "warn", message: `${head}${via}` };
  }
  if (css.includes("--background") && css.includes("--primary")) {
    return {
      severity: "warn",
      message: `${candidate}에 자체 CSS 변수(--background · --primary)만 있고 AXIS 토큰이 없습니다 → @axis-ds/tokens CSS 를 import 하세요`,
    };
  }
  return { severity: "warn", message: `${candidate}에 AXIS CSS 변수가 없습니다` };
}

/**
 * Tailwind 4 진입점(토큰 `css/tailwind4` · 컴포넌트 `tailwind.css`)이 처음 들어가는 AXIS 버전(WI-0044 D1, linked minor).
 * 원본은 project.ts 예요(WI-0097 에서 cli theme-add 의 `COMPONENT_TAILWIND_CSS_MIN_VERSION` 사본과 합침). 종전 이름으로 다시 내보내요.
 */
export { TAILWIND4_MIN_AXIS_VERSION };

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
  const baseDir = baseDirInput !== undefined ? resolveBaseDir(baseDirInput) : undefined;
  const out: AxisPackageVersionIssue[] = [];
  const min = lowerOf(TAILWIND4_MIN_AXIS_VERSION)!;
  for (const name of TAILWIND4_AXIS_PACKAGES) {
    // `baseDir` 가 있으면 워크스페이스 루트 선언도 봅니다(WI-0086). 없으면 종전대로 앱 선언만 봅니다.
    const range = baseDir !== undefined ? declaredRange(baseDir, pkg, name) : hasDependency(pkg, name);
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

/**
 * Tailwind 3 설정의 preset 참조가 이 앱에서 해석되지 않는 이유(WI-0101, 사용자 결정 Q61 ~ Q65 · Q68). 해석되면 `undefined` 예요.
 * 판정은 globals.css tokens 게이트와 같은 `tokensCssResolution` 이라 같은 레이아웃에서 두 항목의 결론이 같아요.
 * - `app`(앱 선언, 미설치 포함, Q62) · `installed`(Plug'n'Play 가 아니고 설치본 디렉터리가 있음, Q68) → `undefined`(종전 판정으로 감)
 * - `not-installed`(루트 선언 · 미설치(Q63), 미선언 · 미설치(Q61)) → 설치 안내. CommonJS bare 여도 버전 문구보다 먼저예요(Q65)
 * - `pnp-root-only` → PnP 전용 문구. CommonJS bare 는 `packageVersionGate` 의 `unresolved` 갈래가 종전 문구(1.7.0 이상 선언 안내)를
 *   그대로 내도록 여기서는 넘겨요(WI-0091 Q7)
 * 모양을 가리지 않는 이유: Tailwind 3.4.19 실빌드에서 미설치는 7형태 모두 `Cannot find module` rc 1 이었어요(WI-0101 testplan 2.2).
 * 버전(1.7.0)은 CommonJS bare 만 보는 종전 판정 그대로예요(Q64, 1.6.2 에서 preset 이 빠지는 형태는 그것뿐).
 */
function presetTokensUnresolvedMessage(
  baseDir: string,
  pkg: Record<string, unknown> | undefined,
  file: string,
  bareCjs: boolean
): string | undefined {
  const r = tokensCssResolution(baseDir, pkg, TOKENS_PACKAGE_NAME);
  const head = `${file}에 AXIS preset 참조가 있지만 ${TOKENS_PACKAGE_NAME} 가`;
  if (r.kind === "not-installed") {
    return `${head} 설치되지 않아 해석되지 않습니다 → 설치(${tokensInstallPhrase(baseDir, `^${TOKENS_CJS_PRESET_FIXED_VERSION}`)})`;
  }
  if (r.kind === "pnp-root-only" && !bareCjs) {
    return `${head} ${PNP_ROOT_ONLY_NOTE}(워크스페이스 루트 선언 ${r.range}) → 앱 package.json 에 ${TOKENS_PACKAGE_NAME} 를 선언하세요`;
  }
  return undefined;
}

/** 패키지 버전 조건 판정 결과(설치본 우선, 다음 선언 하한, 다음 판정 불가) */
export interface PackageVersionGate {
  /**
   * `unresolved`(WI-0091): Plug'n'Play 에서 워크스페이스 루트에만 선언돼 앱이 해석하지 못함(`appOnlyInPnp` 일 때만). `value` 는 루트 선언 범위
   */
  status: "ok" | "below" | "unknown" | "unresolved";
  /** 판정 근거 */
  source: "installed" | "declared" | "none";
  /** 설치본 version 또는 선언 범위 */
  value?: string;
}

/**
 * 프로젝트의 `<name>` 이 `min` 이상인지 봅니다(WI-0068 · WI-0072 공용). 설치본은 `findInstalledPackage`(상위 탐색)로 읽습니다.
 * 1. 설치본 version 이 있으면 그것으로 판정 2. 없으면 package.json 선언 하한(`rangeLowerAtLeast`) 3. 둘 다 없으면 `unknown`.
 * Plug'n'Play 는 설치본을 읽지 않고 선언으로 갑니다.
 * `options.appOnlyInPnp`(WI-0091, check 경로 전용): Plug'n'Play 면 루트 선언을 인정하지 않고, 루트에만 있으면 `unresolved` 입니다.
 */
export function packageVersionGate(
  baseDirInput: string,
  pkg: Record<string, unknown> | undefined,
  name: string,
  min: string,
  options: { appOnlyInPnp?: boolean } = {}
): PackageVersionGate {
  const baseDir = resolveBaseDir(baseDirInput);
  if (!isPnpProject(baseDir)) {
    const installed = findInstalledPackage(baseDir, name)?.version;
    if (installed !== undefined) {
      const cmp = compareExactVersions(installed, min);
      if (cmp !== undefined) return { status: cmp >= 0 ? "ok" : "below", source: "installed", value: installed };
    }
  }
  const declared = pkg ? declaredDependency(baseDir, pkg, name, undefined, options)?.range : undefined;
  if (declared === undefined && options.appOnlyInPnp) {
    const rootOnly = pnpRootOnlyDependency(baseDir, pkg, name);
    if (rootOnly !== undefined) return { status: "unresolved", source: "declared", value: rootOnly.range };
  }
  if (declared !== undefined) {
    const atLeast = rangeLowerAtLeast(declared, min);
    if (atLeast !== undefined) return { status: atLeast ? "ok" : "below", source: "declared", value: declared };
    return { status: "unknown", source: "declared", value: declared };
  }
  return { status: "unknown", source: "none" };
}

/** 판정 근거 표시(`설치본 1.6.2` · `선언 ^1.6.0` · `설치본 · 선언 없음` · `워크스페이스 루트 선언 ^1.6.0`) */
export function versionGateLabel(gate: PackageVersionGate): string {
  if (gate.status === "unresolved") return `워크스페이스 루트 선언 ${gate.value}`;
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
 *
 * WI-0097(사용자 결정 Q21 · Q22): 2 와 5 는 「선언됐는가」가 아니라 「이 앱에서 `<pkg>/tailwind.css` 가 해석되는가」로 봅니다
 * (registry-core `componentCssResolution`, theme add 의 WI-0087 DEC-2 와 같은 판정). 같은 패키지에는 한 갈래만 씁니다.
 * - 앱 선언(`app`)과 설치본에 파일이 있는 루트 선언(`root-ok`)은 종전 그대로입니다(줄 없음 → 2 의 묶음, 줄 있음 → 5).
 * - 미선언 · 앱 lockfile(P2)의 루트 선언은 요구하지 않고, 줄이 있으면 종전 5 만 봅니다.
 * - 해석되지 않는 루트 선언(Plug'n'Play 루트 전용 · 미설치 · 1.4.0 미만이나 버전 모름 · 1.4.0 이상인데 파일 없음)은 줄 없음이면
 *   줄을 바로 권하지 않고 먼저 할 일(앱에 선언 · 설치 · 올림 · 다시 설치)을 패키지마다 한 문제로 2 의 묶음 뒤에 잇습니다.
 *   줄이 있으면 PASS 로 인정하지 않고 「import 가 있지만 해석되지 않음」 WARN 입니다(1.4.0 미만만 종전 5 그대로, 버전 모름은 Q39 로 WARN).
 *
 * `input`(WI-0097 · WI-0100b 합의): `entry` 는 진입 파일 자체의 내용으로 결함 판정(3 의 create-next-app 기본 정의)만 보고,
 * `evidence` 는 「있어야 할 줄」 판정(1 · 2 · 4 · 5)을 봅니다. WI-0100b 부터 `evidence` 는 상대 `@import` 를 펼친 근거 문자열
 * (`expandGlobalCss`)이고, 하위 파일이 없으면 둘이 같은 문자열입니다.
 *
 * `input.cssDirOf`(WI-0097 2부, 사용자 결정 Q37 · WI-0100b): 패키지 줄이 프로젝트 밖 파일(`globalCss` 가 앱 밖)에 있으면 그 파일의 디렉터리예요.
 * 그 줄(`@import "tailwindcss"` 와 이미 있는 컴포넌트 `tailwind.css` 줄(5))은 앱 기준으로 해석되더라도 그 파일 위치에서 설치본을 찾지 못하면
 * 해석 불가 WARN 이에요(`outsideCssPackageResolution`, 맨 앞 · 5 자리). 하위 파일의 줄은 그 하위 파일의 디렉터리 기준이라
 * (D8 ①, 사용자 결정 Q54) 그 디렉터리의 중첩 `node_modules` 도 반영해요. 토큰 진입점(1)은 globals.css 항목이 알려요(D4, tailwind.config 는 그대로).
 */
function tailwind4Issues(
  input: Tailwind4CssInput,
  pkg: Record<string, unknown> | undefined,
  versions: AxisPackageVersionIssue[],
  baseDir: string
): string[] {
  const { entry, evidence } = input;
  const cssDirOf = input.cssDirOf ?? (() => undefined);
  const issues: string[] = [];
  // WI-0097 2부(Q37): 프로젝트 밖 진입 CSS 의 `@import "tailwindcss"` 는 그 파일 위치에서 풀려요. 앱 쪽에만 설치본이 있으면 빌드가 깨져요
  const tailwindDir = cssDirOf("tailwindcss");
  if (tailwindDir !== undefined && outsideCssPackageResolution(baseDir, tailwindDir, "tailwindcss") === "unresolved") {
    issues.push(outsideCssUnresolvedIssue("tailwindcss", "tailwindcss"));
  }
  const hasEntry = hasTokensTailwind4Import(evidence);
  if (!hasEntry) issues.push(`AXIS 토큰 진입점이 없습니다 → ${TOKENS_TAILWIND4_IMPORT_LINE}`);
  const resolutions = new Map(TAILWIND4_COMPONENT_PACKAGES.map((name) => [name, componentCssResolution(baseDir, pkg, name)] as const));
  const missing: string[] = [];
  const unresolvedMissing: string[] = [];
  for (const name of TAILWIND4_COMPONENT_PACKAGES) {
    const r = resolutions.get(name)!;
    if (r.kind === "undeclared" || r.kind === "app-lockfile") continue;
    if (hasComponentTailwindImport(evidence, name) || hasComponentSource(evidence, name)) continue;
    if (componentCssResolvable(r)) missing.push(name);
    else unresolvedMissing.push(componentCssMissingIssue(baseDir, name, r));
  }
  if (missing.length > 0) {
    issues.push(`컴포넌트 스캔 경로(tailwind.css)가 없습니다 → ${missing.map(componentTailwindImportLine).join(" ")}`);
  }
  issues.push(...unresolvedMissing);
  if (hasEntry) {
    const defaults = findCreateNextAppDefaults(entry);
    if (defaults.length > 0) issues.push(`create-next-app 기본 정의가 남아 있습니다(${defaults.join(" · ")}) → 지우세요`);
    if (versions.some((v) => v.name === TAILWIND4_AXIS_PACKAGES[0])) {
      issues.push(`AXIS 토큰 진입점이 있지만 ${TAILWIND4_AXIS_PACKAGES[0]} 버전 확인이 필요합니다`);
    }
  }
  for (const name of TAILWIND4_COMPONENT_PACKAGES) {
    if (!hasComponentTailwindImport(evidence, name)) continue;
    const unresolved = componentCssPresentIssue(baseDir, name, resolutions.get(name)!);
    const componentDir = cssDirOf(`${name}/tailwind.css`);
    if (unresolved !== undefined) issues.push(unresolved);
    else if (componentDir !== undefined && outsideCssPackageResolution(baseDir, componentDir, name, "tailwind.css") === "unresolved") {
      issues.push(outsideCssUnresolvedIssue(`${name}/tailwind.css`, name));
    } else if (versions.some((v) => v.name === name)) issues.push(`${name}/tailwind.css import 가 있지만 ${name} 버전 확인이 필요합니다`);
  }
  return issues;
}

/**
 * `tailwind4Issues` 입력(WI-0097, WI-0100b 와의 합의). `entry`: 진입 파일 내용(결함 판정용) · `evidence`: 근거 문자열(있어야 할 줄 판정용,
 * 상대 `@import` 를 펼친 내용, `expandGlobalCss`) · `cssDirOf`: 패키지 줄(`tailwindcss` · `<pkg>/tailwind.css`)이 처음 나온 파일의 해석 기준
 * 디렉터리(진입 파일은 프로젝트 밖이면 그 디렉터리 · 안이면 `undefined`, 하위 파일은 그 파일 디렉터리, Q54). 없으면 모든 줄을 앱 기준으로 봐요.
 */
interface Tailwind4CssInput {
  entry: string;
  evidence: string;
  cssDirOf?: (spec: string) => string | undefined;
}

/** 설치 · 다시 설치 안내 구절(WI-0093 과 같은 출처 규칙: npm 루트 선언은 「워크스페이스 루트에서 npm install」) */
function componentInstallPhrase(baseDir: string, name: string, range: string): string {
  const g = dependencyInstallGuide(baseDir, name, range);
  return g.kind === "install-at-root" ? `워크스페이스 루트에서 ${g.installCommand}` : g.installCommand;
}

/** 해석되지 않는 루트 선언 패키지의 줄 없음 방향 문제(WI-0097 PRD 1.4 표 1 · 3 · 4 · 5번, 문구 확정 Q43) */
function componentCssMissingIssue(baseDir: string, name: string, r: ComponentCssResolution): string {
  const line = componentTailwindImportLine(name);
  switch (r.kind) {
    case "pnp-root-only":
      return `${name} 가 ${PNP_ROOT_ONLY_NOTE} → 앱 package.json 에 선언한 뒤 ${line}`;
    case "root-not-installed":
      return `${name} 가 워크스페이스 루트에 선언됐지만 설치되지 않았습니다 → 설치(${componentInstallPhrase(baseDir, name, r.range)}) 뒤 ${line}`;
    case "root-old":
      return `워크스페이스 루트에 선언된 ${name} 의 설치본(${r.installedVersion === "?" ? "버전 모름" : r.installedVersion})에 tailwind.css 가 없습니다(${TAILWIND4_MIN_AXIS_VERSION} 부터 제공) → ${TAILWIND4_MIN_AXIS_VERSION} 이상으로 올린 뒤 ${line}`;
    case "root-missing-file":
      return `워크스페이스 루트에 선언된 ${name} 의 설치본(${r.installedVersion})에 tailwind.css 가 없습니다(설치가 손상됐을 수 있음) → 다시 설치(${componentInstallPhrase(baseDir, name, r.range)}) 뒤 ${line}`;
    default:
      return line;
  }
}

/**
 * 줄이 이미 있는데 해석되지 않는 루트 선언 패키지의 문제(WI-0097 PRD 1.4 표 줄 있음 방향, 문구 확정 Q43). 해석되거나 판정하지 않는
 * 갈래(앱 선언 · 미선언 · P2 · 파일 있음)와 1.4.0 미만(종전 버전 판정 그대로)은 `undefined` 입니다. 버전 모름 · 파일 없음은 해석 불가 WARN 이에요
 * (사용자 결정 Q39, 종전에는 버전 판정이 범위만 보고 PASS 였어요).
 */
function componentCssPresentIssue(baseDir: string, name: string, r: ComponentCssResolution): string | undefined {
  const head = `${name}/tailwind.css import 가 있지만`;
  switch (r.kind) {
    case "pnp-root-only":
      return `${head} ${name} 가 ${PNP_ROOT_ONLY_NOTE} → 앱 package.json 에 선언하세요`;
    case "root-not-installed":
      return `${head} ${name} 가 설치되지 않아 해석되지 않습니다 → 설치(${componentInstallPhrase(baseDir, name, r.range)})`;
    case "root-missing-file":
      return `${head} ${name} 설치본(${r.installedVersion})에 tailwind.css 가 없어 해석되지 않습니다 → 다시 설치(${componentInstallPhrase(baseDir, name, r.range)})`;
    case "root-old":
      // 1.4.0 미만은 종전 버전 WARN(호출지)이 알리고, 버전 모름은 버전 판정이 범위만 보고 통과시키므로 여기서 알려요(Q39)
      return r.installedVersion === "?"
        ? `${head} ${name} 설치본(버전 모름)에 tailwind.css 가 없어 해석되지 않습니다 → ${TAILWIND4_MIN_AXIS_VERSION} 이상으로 올리세요`
        : undefined;
    default:
      return undefined;
  }
}

/**
 * tailwind.config 항목을 판정합니다.
 * - Tailwind major 4 이상(`detectTailwind`): 설정 파일을 보지 않고 `selectCheckGlobalCss` 가 고른 파일(`globalCss` 다음 CSS 후보,
 *   WI-0100a, globals.css 항목과 같은 파일 · 같은 표기)와 그 파일이 상대 `@import` 로 들여온 하위 파일(WI-0100b, 근거만)의 `@import "tailwindcss"` 를
 *   봅니다. 없거나 CSS 를 찾지 못하면 warn(CSS 가 없을 때의 fail 은 globals.css 항목이 냅니다, 문구는 종전과 같음).
 *   있으면 같은 파일에서 `tailwind4Issues` 를 모아 하나도 없을 때만 pass 입니다. 여럿이면 한 항목 안에서 우선순위 순서로
 *   ` / ` 로 잇고, 끝에 버전 안내(A1)를 한 번 붙입니다(C). 문제가 하나면 그 문구만 나옵니다.
 * - 3 이하 · 판정 불가: 종전 규칙. `.ts` 는 AXIS 토큰 설정 여부(pass · warn), `.js` · `.mjs` · `.cjs` 는 warn(TypeScript 권장),
 *   없으면 fail. 여기에 B3: 설정 파일에 `@axis-ds/tokens/tailwind` preset 참조(require · import, 주석 제외)가 있으면
 *   `(@axis-ds/tokens/tailwind preset)` 을 붙인 pass 입니다. `.ts` 가 종전 기준(`--background` · `hsl(var(`)으로 pass 면
 *   종전 문구 그대로입니다. preset 참조가 있어도 ① tokens 가 이 앱에서 해석되지 않으면 warn(WI-0101, 모든 모양)
 *   ② CommonJS bare require 이고 tokens 가 1.7.0 미만이거나 버전을 알 수 없으면 warn(WI-0072 · WI-0091) 이고, ①이 먼저예요.
 */
export function checkTailwindSetup(baseDirInput: string): TailwindCheckResult {
  const baseDir = resolveBaseDir(baseDirInput);
  const pkg = readPackageJson(baseDir);
  const tailwind = detectTailwind(baseDir, pkg);
  if (tailwind.major !== undefined && tailwind.major >= 4) {
    const label = `Tailwind ${tailwind.major}`;
    const selection = selectCheckGlobalCss(baseDir);
    const note = globalCssSelectionNote(selection);
    if (selection.path !== undefined && selection.rel !== undefined) {
      const candidate = selection.rel;
      // WI-0100b: 「있어야 할 줄」은 상대 @import 를 펼친 근거 문자열, 결함(B2)은 진입 파일만(D9)
      const expanded = expandGlobalCss(baseDir, selection.path, candidate, outsideCssDir(selection));
      if (!hasTailwindImport(expanded.evidence)) {
        return {
          name: "tailwind.config",
          severity: "warn",
          message: `${label}: ${candidate}에 @import "tailwindcss" 가 없습니다${note}`,
        };
      }
      // 근거를 준 하위 파일(D6 접미사): tailwindcss · 토큰 진입점 · 컴포넌트 tailwind.css · 직접 @source 줄이 처음 나온 파일
      const via = cssImportViaNote(
        viaFiles([
          evidenceOrigin(expanded, hasTailwindImport),
          evidenceOrigin(expanded, hasTokensTailwind4Import),
          ...TAILWIND4_COMPONENT_PACKAGES.flatMap((name) => [
            evidenceOrigin(expanded, (f) => hasComponentTailwindImport(f, name)),
            evidenceOrigin(expanded, (f) => hasComponentSource(f, name)),
          ]),
        ])
      );
      const versions = axisPackagesBelowTailwind4(pkg, baseDir);
      const issues = tailwind4Issues(
        { entry: expanded.entry, evidence: expanded.evidence, cssDirOf: (spec) => packageLineCssDir(expanded, spec) },
        pkg,
        versions,
        baseDir
      );
      if (issues.length > 0) {
        return {
          name: "tailwind.config",
          severity: "warn",
          message: `${label}: ${candidate}에 ${issues.join(" / ")}${tailwind4VersionNote(versions)}${via}${note}`,
        };
      }
      return {
        name: "tailwind.config",
        severity: "pass",
        message: `${label}: ${candidate}에 @import "tailwindcss" 와 AXIS 토큰 진입점이 있습니다${via}${note}`,
      };
    }
    return {
      name: "tailwind.config",
      severity: "warn",
      message: `${label}: @import "tailwindcss" 를 확인할 CSS 파일을 찾지 못했습니다${note}`,
    };
  }

  // WI-0065 D8: Tailwind 3 은 AXIS preset 참조가 있을 때만 pass 입니다. 종전에는 `--background` · `hsl(var(` 문자열만 있어도
  // pass 여서 AXIS 참조가 0 인 shadcn 류 · 템플릿 자체 매핑도 「AXIS 토큰이 설정」으로 나왔습니다(거짓 초록). 이제 WARN 입니다.
  for (const file of TAILWIND_CONFIG_FILES) {
    const path = join(baseDir, file);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8");
    if (hasTokensPresetReference(content)) {
      const code = stripJsComments(content);
      const bareCjs = isCommonJsConfig(file, code) && hasBareCjsPresetRequire(code);
      // WI-0101: preset 의 모양(require · import · .ts)과 상관없이 tokens 가 이 앱에서 해석될 때만 아래 판정으로 갑니다
      const unresolved = presetTokensUnresolvedMessage(baseDir, pkg, file, bareCjs);
      if (unresolved !== undefined) return { name: "tailwind.config", severity: "warn", message: unresolved };
      // WI-0072: CommonJS 설정의 bare require 는 tokens 1.7.0 미만에서 preset 이 통째로 빠집니다(1.1.0 부터의 결함)
      if (bareCjs) {
        const gate = packageVersionGate(baseDir, pkg, "@axis-ds/tokens", TOKENS_CJS_PRESET_FIXED_VERSION, { appOnlyInPnp: true });
        if (gate.status === "unresolved") {
          // WI-0091(사용자 결정 Q7): 루트에만 선언한 tokens 는 Plug'n'Play 에서 앱이 require 하지 못해 preset 이 들어오지 않습니다
          return {
            name: "tailwind.config",
            severity: "warn",
            message: `${file}에 AXIS preset 참조가 있지만 @axis-ds/tokens 가 ${PNP_ROOT_ONLY_NOTE}(${versionGateLabel(gate)}) → 앱 package.json 에 @axis-ds/tokens ${TOKENS_CJS_PRESET_FIXED_VERSION} 이상을 선언하세요`,
          };
        }
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
 * check 의 CSS 판정 3항목이 읽을 전역 CSS(WI-0100a). `axis.config.json` 의 `globalCss`(실재하는 `.css` 일반 파일, 프로젝트 밖도
 * 읽기만) 다음 `TAILWIND_CSS_CANDIDATES` 순입니다. `globalCss` 를 쓰지 못하면 그 사유를 담아 세 항목이 같은 표기를 붙입니다.
 * config 가 없거나 `globalCss` 키가 없으면 종전처럼 후보에서 처음 찾은 파일입니다.
 */
function selectCheckGlobalCss(baseDir: string): GlobalCssSelection {
  return selectGlobalCss(baseDir, readAxisConfigLike(baseDir)?.globalCss, TAILWIND_CSS_CANDIDATES, { requireStylesheet: true });
}

/**
 * content glob 하나를 정규식으로 바꿉니다(Tailwind 3 의 fast-glob 문법 가운데 `**` · `*` · `?` · `{a,b}` · `[...]`).
 * 앞의 `./` 는 지우고, 경로는 설정 파일 디렉터리(프로젝트 루트) 기준 상대 경로로 맞춥니다.
 * `noDot` 이면(WI-0098, 사용자 결정 Q33) fast-glob 의 기본(`dot: false`)처럼 세그먼트 첫머리의 `*` · `**` · `?` · `[...]` 가 점으로 시작하는
 * 세그먼트(`.yarn` 등)를 넘지 않아요. 점으로 시작하는 세그먼트는 glob 에 글자 그대로(`./.yarn/...`) 써야 맞아요. 기본값(`noDot` 없음)은 종전 정규식 그대로예요.
 */
export function contentGlobToRegExp(glob: string, opts: { noDot?: boolean } = {}): RegExp {
  const noDot = opts.noDot === true;
  const g = glob.trim().replace(/^\.\//, "");
  // noDot 에서 세그먼트 첫머리에 붙이는 「점으로 시작하지 않음」 조건(세그먼트 중간이면 빈 문자열)
  const lead = (i: number) => (noDot && (i === 0 || g[i - 1] === "/") ? "(?!\\.)" : "");
  let re = "";
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === "*") {
      if (g[i + 1] === "*") {
        const slash = g[i + 2] === "/";
        if (noDot) re += slash ? `(?:${lead(i)}[^/]*/(?:(?!\\.)[^/]*/)*)?` : `${lead(i)}[^/]*(?:/(?!\\.)[^/]*)*`;
        else re += slash ? "(?:.*/)?" : ".*";
        i += slash ? 2 : 1;
      } else re += `${lead(i)}[^/]*`;
    } else if (c === "?") re += `${lead(i)}[^/]`;
    else if (c === "{") {
      const end = g.indexOf("}", i);
      if (end === -1) {
        re += "\\{";
        continue;
      }
      const atStart = lead(i) !== "";
      re += `(?:${g
        .slice(i + 1, end)
        .split(",")
        .map((part) => {
          const body = part.replace(/[.+^$()|[\]\\]/g, "\\$&");
          if (!noDot) return body.replace(/\*/g, "[^/]*");
          // 갈래 첫머리(중괄호가 세그먼트 첫머리일 때) · 갈래 안 `/` 뒤의 `*` 도 점으로 시작하는 세그먼트를 넘지 않음
          return body.replace(/(\/)?\*/g, (_m, slash: string | undefined, off: number) =>
            slash !== undefined || (off === 0 && atStart) ? `${slash ?? ""}(?!\\.)[^/]*` : "[^/]*"
          );
        })
        .join("|")})`;
      i = end;
    } else if (c === "[") {
      const end = g.indexOf("]", i);
      if (end === -1) re += "\\[";
      else {
        re += lead(i) + g.slice(i, end + 1);
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
function contentGlobBranchCovers(glob: string, sample: string, baseDir: string, noDot: boolean): boolean {
  if (isAbsoluteGlob(glob)) {
    const re = contentGlobToRegExp(glob.trim().replace(/\\/g, "/"), { noDot });
    const absSample = resolve(baseDir, sample);
    if (re.test(absSample.split(sep).join("/"))) return true;
    const real = realpathPosix(absSample);
    return real !== undefined && re.test(real);
  }
  return leadingParentSegments(glob) === leadingParentSegments(sample) && contentGlobToRegExp(glob, { noDot }).test(sample);
}

/**
 * content glob 하나가 표본 경로(baseDir 기준 상대 경로, posix)를 덮는지 봅니다(WI-0080).
 * - 먼저 중괄호 갈래를 펼쳐 갈래마다 판정합니다(검토 후속: `{./src,../../node_modules/x}/**` 처럼 깊이를 섞은 glob,
 *   실측 372/372). 갈래가 상한(256)을 넘으면 펼치지 않고 glob 하나로 봅니다.
 * - 상대 glob: 앞쪽 `../` 개수가 표본과 같을 때만 `contentGlobToRegExp` 로 비교합니다. 정규식의 `**` 는 `..` 세그먼트도 먹지만
 *   fast-glob 의 `**` 는 `../` 를 넘지 않기 때문입니다(실측: 호이스팅 앱의 `./**` 는 ui-react 선택자 44/402).
 * - 절대경로 glob: `resolve(baseDir, sample)`(posix 로 맞춤)과, 그 실경로(심링크를 푼 경로)와 비교합니다(실측: 실제 설치 위치를
 *   가리키면 402/402, pnpm 기본 앱에서 `.pnpm` 스토어 실경로를 가리켜도 372/372).
 * - `noDot`(WI-0098, 사용자 결정 Q33): PnP unplugged 표본(`.yarn/unplugged/...`)에만 씁니다. glob 의 `**` · `*` 가 점으로 시작하는
 *   세그먼트를 넘지 않을 때만 덮음으로 봐요(fast-glob 기본 `dot: false`. 실측: PnP 루트 앱의 `./**\/*.{js,mjs}` 는 빌드 규칙 4,
 *   `./.yarn/unplugged/*\/...` 는 429). 비 PnP 호출은 이 옵션을 넘기지 않아 종전 판정 그대로예요.
 * Tailwind 3 는 `relative: true` 가 없으면 content 를 빌드를 실행한 디렉터리(cwd) 기준으로 풀지만, 판정은 baseDir(앱 디렉터리)을
 * cwd 로 둡니다(D4: 판정에 반영하지 않고 상위 경로 제안에 `CONTENT_PARENT_PATH_NOTE` 를 붙임).
 */
export function contentGlobCovers(glob: string, sample: string, baseDirInput: string, opts: { noDot?: boolean } = {}): boolean {
  // 표본은 실경로 기준 상대 경로라 절대 glob 비교의 기준도 실경로로 맞춥니다(WI-0086). 내부 호출자 inspectTailwindContent 는 진입부에서
  // 이미 실경로를 넘기므로 check 의 링크 판정(반박 검토 AC5 c1-abs 행)은 그쪽 덕분이고, 이 줄은 export 된 이 함수를 링크 경로로 직접 부를 때를
  // 맞춥니다(검토 후속 단위 테스트 「링크 baseDir 의 절대 glob」이 고정)
  const baseDir = resolveBaseDir(baseDirInput);
  const branches = expandBraces(glob.trim()) ?? [glob];
  return branches.some((b) => contentGlobBranchCovers(b, sample, baseDir, opts.noDot === true));
}

/**
 * 상위 경로(`../`) content 제안에 붙이는 안내(WI-0080 D4). cli check · MCP check_project · theme add 가 같은 문자열을 씁니다.
 * 문구는 다른 check 문구와 같은 합니다체입니다(WI-0098, 사용자 결정 Q47: 「풀려요」 → 「풀립니다」, 경로 · 코드 조각 · 의미는 그대로).
 * 실측: 호이스팅 앱의 `../../node_modules/...` 는 앱 cwd 빌드에서 402/402, 모노레포 루트 cwd 빌드에서 0, `relative: true` 면 둘 다 402.
 */
export const CONTENT_PARENT_PATH_NOTE =
  "상위 경로는 Tailwind 3 가 빌드를 실행한 디렉터리 기준으로 풀립니다. 모노레포 루트 등 앱 디렉터리 밖에서 빌드하면 content: { relative: true, files: [...] } 로 설정 파일 기준으로 바꾸세요";

/**
 * Plug'n'Play content 안내(WI-0098, 사용자 결정 Q23 · extra 3). 동적 `require.resolve` 형태를 먼저, unplugged 설정을 대안으로 안내합니다.
 * cli check · MCP check_project · theme add 가 같은 함수를 씁니다. 패키지 이름은 넘긴 대상으로 채워요(사용자 결정 Q31). 둘 이상이면
 * 동적 형태와 dependenciesMeta 항목을 패키지마다 `, ` 로 이어(content 배열 · JSON 객체에 그대로 붙여 넣을 수 있게) 나열합니다.
 * 같은 이름은 한 번만 씁니다. 문구는 기존 check 문구와 같은 합니다체입니다(사용자 결정 Q44).
 * `unplugged`(사용자 결정 Q45): unplugged 디렉터리가 이미 있는(`findPnpUnpluggedPackages` 로 찾은) 패키지 이름. 이 패키지는
 * dependenciesMeta 설정 안내에서 빼고(정적 경로 제안은 목록 항목의 `→ "<제안>"` 에 남음), 모두 빠지면 설정 안내 문장을 내지 않습니다.
 */
export function contentPnpNote(names: string | readonly string[], unplugged: readonly string[] = []): string {
  const list = [...new Set(typeof names === "string" ? [names] : names)];
  const dyn = list.map((n) => `path.join(path.dirname(require.resolve("${n}")), "..", "dist/**/*.{js,mjs}")`).join(", ");
  const needsSetup = list.filter((n) => !unplugged.includes(n));
  const meta = needsSetup.map((n) => `"${n}": { "unplugged": true }`).join(", ");
  const setup =
    needsSetup.length > 0
      ? ` 정적 경로를 쓰려면 package.json 의 dependenciesMeta 에 ${meta} 를 두고 yarn install 뒤 .yarn/unplugged 경로를 넣으세요`
      : "";
  return `Plug'n'Play 에는 node_modules 가 없습니다. content 에 ${dyn} 처럼 실제 위치를 넣으세요(정적으로 확인할 수 없어 WARN 으로 남습니다).${setup}`;
}

/** PnP 안내를 붙일 대상(루트 전용이 아닌 PnP 대상)의 이름들(WI-0098). 없으면 빈 목록 */
export function contentPnpNoteTargets(targets: ReadonlyArray<Pick<ContentTarget, "label" | "pnp">>): string[] {
  return targets.filter((t) => t.pnp !== undefined && t.pnp.state !== "rootOnly").map((t) => t.label);
}

/**
 * 덮지 않은 대상의 PnP 안내(WI-0098). 루트 전용이 아닌 PnP 대상이 없으면 `undefined` 입니다. cli check · MCP check_project ·
 * theme add 가 같은 함수를 씁니다. unplugged 대상은 설정 안내에서 뺍니다(사용자 결정 Q45).
 */
export function contentPnpNoteFor(targets: ReadonlyArray<Pick<ContentTarget, "label" | "pnp">>): string | undefined {
  const names = contentPnpNoteTargets(targets);
  if (names.length === 0) return undefined;
  const unplugged = targets.filter((t) => t.pnp?.state === "unplugged").map((t) => t.label);
  return contentPnpNote(names, unplugged);
}

/** PnP 루트 전용 선언 대상의 안내 끝말(WI-0098, 사용자 결정 Q22). 앞에 「<이름> 가 PNP_ROOT_ONLY_NOTE」를 붙여 씁니다. */
export const CONTENT_PNP_ROOT_ONLY_ACTION = "앱 package.json 에 선언하세요";

/** 기본 PnP(unplugged 없음) 대상의 이유(WI-0098). 앞에 패키지 이름을 붙여 씁니다. */
export const CONTENT_PNP_NO_NODE_MODULES = "Plug'n'Play 라 node_modules 경로가 없음";

/**
 * content 목록 항목 하나(WI-0098 에서 나눔). PnP 가 아니면 종전 문자열 그대로입니다.
 * - 기본 PnP: 「<이름>(Plug'n'Play 라 node_modules 경로가 없음)」(제안 glob 없음)
 * - 루트 전용: 「<이름> 가 <PNP_ROOT_ONLY_NOTE> → 앱 package.json 에 선언하세요」(경로 제안 · 동적 형태 안내 없음)
 * - unplugged: 종전과 같은 「<이름> → "<제안>"」(제안은 unplugged 상대 glob)
 */
function contentTargetText(t: ContentTarget): string {
  if (t.pnp?.state === "noNodeModules") return `${t.label}(${CONTENT_PNP_NO_NODE_MODULES})`;
  if (t.pnp?.state === "rootOnly") return `${t.label} 가 ${PNP_ROOT_ONLY_NOTE} → ${CONTENT_PNP_ROOT_ONLY_ACTION}`;
  return `${t.label} → "${t.suggest}"${t.note === undefined ? "" : ` (${t.note})`}`;
}

/** baseDir 기준 상대 디렉터리(posix). 다른 드라이브(Windows)처럼 상대 경로로 못 바꾸거나 baseDir 자신이면 `undefined`. */
function relDirOf(baseDir: string, dir: string): string | undefined {
  const rel = relative(baseDir, dir);
  return rel === "" || isAbsolute(rel) ? undefined : rel.split(sep).join("/");
}

function realDir(dir: string): string | undefined {
  try {
    return realpathSync(dir);
  } catch {
    return undefined;
  }
}

function packageVersion(dir: string): string | undefined {
  try {
    const parsed: unknown = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    return isPlainObject(parsed) && typeof parsed.version === "string" ? parsed.version : undefined;
  } catch {
    return undefined;
  }
}

/** Plug'n'Play 에서 패키지 content 대상의 상태(WI-0098). PnP 가 아니면 이 필드를 만들지 않습니다. */
export type PnpContentState = "noNodeModules" | "unplugged" | "rootOnly";

interface PackageContentTarget {
  sample: string;
  suggest: string;
  alternates: string[];
  others: Array<{ sample: string; note: string }>;
  /** PnP 일 때만. `legacySample` 은 종전 표본 `node_modules/<pkg>/dist/index.js`(「종전 덮음」 판별 전용, 덮음 인정에는 쓰지 않음) */
  pnp?: { state: PnpContentState; legacySample: string };
}

/**
 * Plug'n'Play 의 패키지 content 대상(WI-0098, 사용자 결정 Q22 · Q23 · Q29). node_modules 가 없으므로 종전 표본은 덮음 인정에 쓰지 않습니다.
 * - 루트 전용 선언(`pnpRootOnlyDependency`): 표본 · 제안이 없고 덮음으로 보지 않습니다(Q22 「권하지도 인정하지도 않음」).
 * - unplugged 설치본(`findPnpUnpluggedPackages`, 앱 선언 범위에 맞는 버전만): 표본은 그 디렉터리(baseDir 기준 상대) `dist/index.js`,
 *   나머지 맞는 디렉터리는 대체 표본, 제안은 `<PnP 루트 상대>/.yarn/unplugged/*\/node_modules/<pkg>/dist/**\/*.{js,mjs}` 입니다(Q29).
 * - 그 밖(기본 PnP): 덮일 수 있는 표본도 제안 glob 도 없습니다(Q23, zip · `__virtual__` 경로는 판독하지 않음).
 */
function pnpPackageContentTarget(baseDir: string, name: string, pkg: Record<string, unknown> | undefined): PackageContentTarget {
  const legacySample = `node_modules/${name}/dist/index.js`;
  const none = { sample: "", suggest: "", alternates: [], others: [] };
  if (pnpRootOnlyDependency(baseDir, pkg, name) !== undefined) return { ...none, pnp: { state: "rootOnly", legacySample } };
  const range = pkg === undefined ? undefined : hasDependency(pkg, name);
  const rels = (range === undefined ? [] : findPnpUnpluggedPackages(baseDir, name, range))
    .map((d) => relDirOf(baseDir, d))
    .filter((r): r is string => r !== undefined);
  const root = pnpProjectRoot(baseDir);
  if (rels.length === 0 || root === undefined) return { ...none, pnp: { state: "noNodeModules", legacySample } };
  const rootRel = relDirOf(baseDir, root);
  return {
    sample: `${rels[0]}/dist/index.js`,
    suggest: `${rootRel === undefined ? "." : rootRel}/.yarn/unplugged/*/node_modules/${name}/dist/**/*.{js,mjs}`,
    alternates: rels.slice(1).map((r) => `${r}/dist/index.js`),
    others: [],
    pnp: { state: "unplugged", legacySample },
  };
}

/**
 * 패키지 content 대상의 표본 · 제안(WI-0080). 설치본을 못 찾으면 종전 `node_modules/<pkg>` 입니다. Plug'n'Play 면
 * `pnpPackageContentTarget`(WI-0098)으로 갑니다.
 * WI-0090: 표본 `sample`(찾은 설치본) 말고도 Tailwind 가 같은 파일을 스캔하게 되는 경로를 `alternates` 로 함께 돌려줍니다.
 * - 찾은 설치본의 실경로(pnpm 기본이면 `.pnpm` 스토어)를 baseDir 기준 상대 경로로 쓴 것
 * - 찾은 설치본보다 위의 `node_modules/<pkg>` 가운데 실경로가 같은 것(pnpm 기본에서 앱 · 루트가 같은 스토어에 링크)
 * 실경로가 다른 상위 설치본은 `others` 로 따로 돌려줍니다. 그 경로를 가리키면 Tailwind 는 다른 버전의 파일을 스캔합니다
 * (빌드 실측: 루트 1.8.1 · 앱 1.8.2 에서 선택자 426/427, Select placeholder 클래스 누락). 그래서 덮음으로 보지 않고 안내에만 씁니다.
 */
function packageContentTarget(baseDir: string, name: string, pkg: Record<string, unknown> | undefined): PackageContentTarget {
  if (isPnpProject(baseDir)) return pnpPackageContentTarget(baseDir, name, pkg);
  const found = findInstalledPackage(baseDir, name);
  const relDir = (found === undefined ? undefined : relDirOf(baseDir, found.dir)) ?? `node_modules/${name}`;
  const alternates: string[] = [];
  const others: Array<{ sample: string; note: string }> = [];
  const real = found === undefined ? undefined : realDir(found.dir);
  if (found !== undefined && real !== undefined) {
    const relReal = relDirOf(baseDir, real);
    if (relReal !== undefined && relReal !== relDir) alternates.push(`${relReal}/dist/index.js`);
    // found.dir = <조상>/node_modules/<name> 이므로 <조상>의 부모부터 올라갑니다
    let dir = dirname(resolve(found.dir, ...name.split("/").map(() => ".."), ".."));
    for (;;) {
      const candidate = join(dir, "node_modules", ...name.split("/"));
      const rel = existsSync(join(candidate, "package.json")) ? relDirOf(baseDir, candidate) : undefined;
      if (rel !== undefined) {
        const candidateReal = realDir(candidate);
        if (candidateReal === real) alternates.push(`${rel}/dist/index.js`);
        else {
          const theirs = packageVersion(candidate);
          const ours = found.version ?? packageVersion(found.dir);
          // 버전이 같아도 실경로가 다르면 파일이 같다는 보장이 없어(패치 · 다시 빌드한 사본) 덮음으로 보지 않습니다(사용자 결정)
          const versions =
            theirs === undefined || ours === undefined ? "" : theirs === ours ? `(버전은 ${ours} 로 같음)` : `(${theirs}, 앱 ${ours})`;
          others.push({
            sample: `${rel}/dist/index.js`,
            note: `상위 경로 ${rel} 는 앱이 쓰는 설치본과 다른 설치본${versions}이라 덮음으로 보지 않습니다`,
          });
        }
      }
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return {
    sample: `${relDir}/dist/index.js`,
    suggest: `${relDir.startsWith("../") ? "" : "./"}${relDir}/dist/**/*.{js,mjs}`,
    alternates,
    others,
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
  /** 덮지 않을 때 붙이는 이유(실경로가 다른 상위 설치본을 가리키는 glob 이 있음, WI-0090) */
  note?: string;
  /**
   * Plug'n'Play 패키지 대상일 때만(WI-0098). PnP 가 아니면 이 필드가 없습니다(theme add · MCP 출력이 바이트 그대로).
   * `legacyCovered` 는 종전 표본 `node_modules/<pkg>/dist/index.js` 를 덮는지(node_modules glob · 넓은 `./**`)이고, 덮음 인정에는 쓰지 않고
   * severity(종전 덮음 → WARN, 사용자 결정 Q23 · 구현 해석 C1 ~ C3)에만 씁니다. `rootOnly` · `noNodeModules` 는 `sample` · `suggest` 가 빈 문자열입니다.
   */
  pnp?: { state: PnpContentState; legacyCovered: boolean };
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
 *   찾지 못하면(상위 어디에도 없음) 종전 `node_modules/<pkg>/dist/index.js` 입니다.
 *   Plug'n'Play 면(WI-0098) unplugged 설치본만 표본으로 쓰고, 루트 전용 선언 · 기본 PnP 는 덮음으로 보지 않습니다(`pnpPackageContentTarget`).
 *   종전 표본을 덮는지는 `pnp.legacyCovered` 로 따로 돌려줍니다.
 * glob 은 설정 파일이 있는 디렉터리(프로젝트 루트) 기준으로 맞춥니다(`contentGlobCovers`). 판정은 문자열 판독이라 실제 파일이 있는지는 보지 않습니다.
 */
export function inspectTailwindContent(baseDirInput: string): TailwindContentInspection | null {
  const baseDir = resolveBaseDir(baseDirInput);
  const pkg = readPackageJson(baseDir);
  const tailwind = detectTailwind(baseDir, pkg);
  if (tailwind.major !== undefined && tailwind.major >= 4) return null;
  const configFile = TAILWIND_CONFIG_FILES.find((f) => existsSync(join(baseDir, f)));
  if (configFile === undefined) return null;

  const targets: Array<
    Omit<ContentTarget, "covered" | "note" | "pnp"> & {
      alternates?: string[];
      others?: Array<{ sample: string; note: string }>;
      pnp?: { state: PnpContentState; legacySample: string };
    }
  > = [];
  const componentsDir = readAxisConfigLike(baseDir)?.componentsDir;
  const rel = typeof componentsDir === "string" ? normalizeRel(componentsDir) : undefined;
  if (rel !== undefined) {
    targets.push({ label: `componentsDir(${componentsDir as string})`, sample: `${rel}/button.tsx`, suggest: `./${rel}/**/*.{ts,tsx}` });
  }
  for (const name of TAILWIND4_COMPONENT_PACKAGES) {
    if (declaredRange(baseDir, pkg, name) !== undefined) {
      targets.push({ label: name, ...packageContentTarget(baseDir, name, pkg) });
    }
  }
  if (targets.length === 0) return null;

  const read = readTailwindContent(readFileSync(join(baseDir, configFile), "utf8"));
  const globs = (read?.globs ?? []).filter((g) => !g.trim().startsWith("!"));
  return {
    configFile,
    unreadable: read === undefined,
    dynamic: read?.dynamic ?? false,
    targets: targets.map(({ alternates = [], others = [], pnp, ...t }) => {
      const covers = (sample: string) => globs.some((g) => contentGlobCovers(g, sample, baseDir));
      // WI-0098: PnP 의 루트 전용 · 기본 PnP 는 덮일 수 있는 표본이 없습니다(종전 표본은 legacyCovered 판별에만)
      const samples = pnp !== undefined && pnp.state !== "unplugged" ? [] : [t.sample, ...alternates];
      // WI-0098(Q33): unplugged 표본은 `.yarn` 아래라 `**` · `*` 가 점 세그먼트를 넘지 않을 때만 덮음(PnP 루트 앱의 `./**` 거짓 PASS 방지)
      const coversSample =
        pnp?.state === "unplugged" ? (sample: string) => globs.some((g) => contentGlobCovers(g, sample, baseDir, { noDot: true })) : covers;
      const covered = samples.some(coversSample);
      const note = covered ? undefined : others.find((o) => covers(o.sample))?.note;
      const base = note === undefined ? { ...t, covered } : { ...t, covered, note };
      return pnp === undefined ? base : { ...base, pnp: { state: pnp.state, legacyCovered: covers(pnp.legacySample) } };
    }),
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
  const list = missing.map(contentTargetText).join(" · ");
  // WI-0080 D4: 상위 경로 제안이 있을 때만 cwd 기준 안내를 붙입니다(종전 문구는 바이트 그대로). PnP unplugged 제안에도 붙습니다(C4)
  const note = missing.some((t) => t.suggest.startsWith("../")) ? ` (${CONTENT_PARENT_PATH_NOTE})` : "";
  // WI-0098: 덮지 않은 PnP 대상(루트 전용 제외)이 있으면 동적 형태 · unplugged 안내를 붙입니다. PnP 가 아니면 빈 문자열이라 종전 문구 그대로
  const pnpText = contentPnpNoteFor(missing);
  const pnpNote = pnpText === undefined ? "" : ` (${pnpText})`;
  if (r.unreadable || r.dynamic) {
    return {
      name: "tailwind.content",
      severity: "warn",
      message: `${r.configFile}의 content 를 정적으로 다 읽지 못해 확인하지 못했습니다: ${list}${note}${pnpNote}`,
    };
  }
  // WI-0098(Q23 · C1 ~ C3): 덮지 않은 대상이 모두 종전 표본을 덮던 PnP 대상(node_modules glob · 넓은 ./**)이면 WARN 입니다(0 → 1 없음)
  if (missing.every((t) => t.pnp?.legacyCovered === true)) {
    const labels = missing.map((t) => t.label).join(" · ");
    const details = missing.filter((t) => t.pnp?.state !== "noNodeModules").map(contentTargetText);
    return {
      name: "tailwind.content",
      severity: "warn",
      message:
        `${r.configFile}의 content 가 Plug'n'Play 에서 스캔되지 않는 경로로 ${labels} 를 덮습니다(node_modules 경로 · ./** 는 스캔되지 않음)` +
        `${details.length > 0 ? `: ${details.join(" · ")}` : ""}${note}${pnpNote}`,
    };
  }
  return {
    name: "tailwind.content",
    severity: "fail",
    message: `${r.configFile}의 content 가 컴포넌트 경로를 덮지 않습니다(클래스가 생성되지 않음): ${list}${note}${pnpNote}`,
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
 * - 플러그인 판정(Tailwind 4): `selectCheckGlobalCss` 가 고른 파일(`globalCss` 다음 CSS 후보, WI-0100a)과 그 파일이 상대 `@import` 로 들여온
 *   하위 파일(WI-0100b)에 `@import "tw-animate-css"` 또는
 *   `@plugin "tailwindcss-animate"`.
 *   WI-0092(사용자 결정 Q9 · Q10): 줄마다 그 줄이 가리키는 패키지의 선언(앱 다음 워크스페이스 루트, Plug'n'Play 는 앱만) + 설치본을
 *   봅니다. 있는 줄이 모두 선언 · 설치돼 있을 때만 pass 이고, 줄은 있는데 선언 · 설치가 없으면 WARN(Tailwind 3 와 같음, 종료 코드 불변).
 *   다른 이름의 패키지만 설치돼 있어도 pass 가 아닙니다. 종전에는 줄만 보고 pass 여서 빌드가 깨지는 미설치 앱도 초록이었습니다.
 * - WI-0091: 플러그인 선언은 Plug'n'Play 면 앱 선언만 봅니다(루트에만 있으면 전용 사유). ui-react 사용 판정은 종전대로 루트 선언도 봅니다.
 */
export function checkAnimationPlugin(baseDirInput: string): AnimationCheckResult | null {
  const baseDir = resolveBaseDir(baseDirInput);
  const pkg = readPackageJson(baseDir);
  const config = readAxisConfigLike(baseDir);
  const declared = declaredRange(baseDir, pkg, "@axis-ds/ui-react") !== undefined;
  const copied = typeof config?.componentsDir === "string" && componentsUseAnimation(baseDir, config.componentsDir);
  if (!declared && !copied) return null;
  const by = declared ? "@axis-ds/ui-react 선언" : "componentsDir 의 animate-in 류 클래스";
  const tailwind = detectTailwind(baseDir, pkg);
  const pnp = isPnpProject(baseDir);
  /** 플러그인 패키지 하나의 선언 · 설치 사유(문제 없으면 `undefined`). Plug'n'Play 는 설치본을 읽지 않고 앱 선언으로 봅니다(WI-0070 규칙). */
  const pluginProblem = (name: string): string | undefined => {
    if (declaredRangeForCheck(baseDir, pkg, name) === undefined) {
      return pnpRootOnlyDependency(baseDir, pkg, name) !== undefined ? `${name} 가 ${PNP_ROOT_ONLY_NOTE}` : `${name} 선언 없음`;
    }
    if (!pnp && findInstalledPackage(baseDir, name) === undefined) return `${name} 미설치(선언만 있음)`;
    return undefined;
  };
  if (tailwind.major !== undefined && tailwind.major >= 4) {
    const selection = selectCheckGlobalCss(baseDir);
    const note = globalCssSelectionNote(selection);
    const file = selection.rel;
    // WI-0100b: 줄 판정은 상대 @import 를 펼친 근거 문자열(설치는 `pluginProblem` 이 게이트함)
    const expanded =
      selection.path !== undefined && selection.rel !== undefined
        ? expandGlobalCss(baseDir, selection.path, selection.rel, outsideCssDir(selection))
        : undefined;
    const css = expanded !== undefined ? stripCssComments(expanded.evidence) : "";
    // 줄마다 그 줄이 가리키는 패키지(WI-0092)
    const twAnimate = new RegExp(`@import\\s+(?:url\\(\\s*)?["']${ANIMATION_PLUGIN_TAILWIND4}["']`);
    const animatePlugin = new RegExp(`@plugin\\s+["']${ANIMATION_PLUGIN_TAILWIND3}["']`);
    const lines: string[] = [];
    if (twAnimate.test(css)) lines.push(ANIMATION_PLUGIN_TAILWIND4);
    if (animatePlugin.test(css)) lines.push(ANIMATION_PLUGIN_TAILWIND3);
    const via =
      expanded !== undefined
        ? cssImportViaNote(viaFiles([evidenceOrigin(expanded, (f) => twAnimate.test(f)), evidenceOrigin(expanded, (f) => animatePlugin.test(f))]))
        : "";
    if (lines.length === 0) {
      return {
        name: "animation",
        severity: "warn",
        message: `애니메이션 플러그인이 없습니다(${by}): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않습니다 → ${ANIMATION_PLUGIN_TAILWIND4} 설치 뒤 @import "${ANIMATION_PLUGIN_TAILWIND4}";${note}`,
      };
    }
    const problems = lines.map((name) => ({ name, why: pluginProblem(name) })).filter((x) => x.why !== undefined);
    if (problems.length === 0) return { name: "animation", severity: "pass", message: `${file}에 애니메이션 플러그인이 있습니다${via}${note}` };
    return {
      name: "animation",
      severity: "warn",
      message: `${file}의 애니메이션 플러그인을 쓸 수 없습니다(${by}, ${problems.map((x) => x.why).join(" · ")}): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않고 빌드가 실패할 수 있습니다 → ${problems.map((x) => x.name).join(" · ")} 를 package.json 에 선언 · 설치하세요${via}${note}`,
    };
  }
  const configFile = TAILWIND_CONFIG_FILES.find((f) => existsSync(join(baseDir, f)));
  const source = configFile !== undefined ? stripJsComments(readFileSync(join(baseDir, configFile), "utf8")) : "";
  const plugins = configFile !== undefined ? readAnimationPluginUse(source) : "absent";
  // WI-0070: 「미설치」는 선언이 아니라 설치본으로 봅니다(Plug'n'Play 는 선언 기준). WI-0091: Plug'n'Play 의 선언은 앱 선언만 봅니다.
  const pluginReason = pluginProblem(ANIMATION_PLUGIN_TAILWIND3);
  if (plugins === "found" && pluginReason === undefined) {
    return { name: "animation", severity: "pass", message: `${configFile}의 plugins 에 ${ANIMATION_PLUGIN_TAILWIND3} 가 있습니다` };
  }
  const cfg = configFile ?? "tailwind.config";
  const configReason =
    plugins === "dynamic" ? `${cfg} plugins 를 정적으로 다 읽지 못해 확인하지 못함` : plugins !== "found" ? `${cfg} plugins 에 없음` : undefined;
  // 추가 결정 A1: Plug'n'Play 루트 전용 선언은 다른 PnP 문구와 같은 틀(「… 가 <PNP_ROOT_ONLY_NOTE> → 앱 package.json 에 선언하세요」)로 냅니다
  if (pluginReason !== undefined && pnpRootOnlyDependency(baseDir, pkg, ANIMATION_PLUGIN_TAILWIND3) !== undefined) {
    const extra = configReason !== undefined ? `, ${configReason}` : "";
    const plug = configReason !== undefined ? ` · plugins 에 require("${ANIMATION_PLUGIN_TAILWIND3}")` : "";
    return {
      name: "animation",
      severity: "warn",
      message: `애니메이션 플러그인 ${ANIMATION_PLUGIN_TAILWIND3} 가 ${PNP_ROOT_ONLY_NOTE}(${by}${extra}): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않습니다 → 앱 package.json 에 ${ANIMATION_PLUGIN_TAILWIND3} 를 선언하세요${plug}`,
    };
  }
  const reasons: string[] = [];
  if (pluginReason !== undefined) reasons.push(pluginReason);
  if (configReason !== undefined) reasons.push(configReason);
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
