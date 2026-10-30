/**
 * axis init (WI-0038)
 *
 * `axis.config.json` 과 `utils.ts` 를 쓰고, `utils.ts` 가 import 하는 `clsx` · `tailwind-merge` 를
 * `package.json` 에 없을 때만 추가합니다(D1). 설치 명령은 실행하지 않고 안내만 합니다.
 * `tailwind-merge` 범위는 프로젝트의 Tailwind 버전으로 고릅니다(E2, `selectUtilsDependencies`).
 * JSON 포맷 보존 · 설치 명령 선택 · 쓰기 안전성은 theme add(WI-0028)의 함수를 그대로 씁니다.
 */

import { accessSync, constants, existsSync, lstatSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import chalk from "chalk";
import fs from "fs-extra";
import { createInitConfig, readAxisConfig, type AxisConfig } from "../config/axis-config.js";
import { TOKENS_PACKAGE } from "../theme/brand-core.js";
import {
  HARDLINK_ERROR_CODE,
  hardLinkCount,
  hardLinkMessage,
  isSameOrInside,
  overwriteFollowingLinks,
  writeNoFollow,
} from "../add/safe-write.js";
import { isLegacyDefaultRegistryUrl, redactRegistryUrl } from "../registry/remote.js";
import {
  detectInstallCommand,
  formatJsonLike,
  hasDependency,
  isPlainObject,
  realPathInside,
} from "../theme/theme-add.js";
import {
  ANIMATION_PLUGIN_TAILWIND3,
  ANIMATION_PLUGIN_TAILWIND4,
  axisPackageVersionLabel,
  axisPackagesBelowTailwind4,
  componentTailwindImportLine,
  detectTailwind,
  inspectTailwind4Animation,
  rangeLowerAtLeast,
  TAILWIND4_COMPONENT_PACKAGES,
  TAILWIND4_MIN_AXIS_VERSION,
  TOKENS_TAILWIND4_IMPORT_LINE,
  type AnimationPluginProblem,
  type TailwindDetection,
} from "../template/tailwind-core.js";
import { CLSX_RANGE, TAILWIND_MERGE_RANGES, selectUtilsDependencies } from "@axis-ds/registry-core/utils-deps";
import {
  addCommandFor,
  declaredDependency,
  detectProjectPaths,
  findInstalledPackage,
  installCommandPhrase,
  isPnpProject,
  PNP_ROOT_ONLY_NOTE,
  pnpRootOnlyDependency,
  projectFileExists,
} from "@axis-ds/registry-core/project";

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

// utils.ts 의존 범위 선택은 add 의 의존성 안내와 같이 쓰려고 공유 코어(@axis-ds/registry-core, WI-0055)로 옮겼습니다. 종전 이름은 그대로 내보냅니다
export { CLSX_RANGE, TAILWIND_MERGE_RANGES, selectUtilsDependencies };

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

/**
 * init 이 쓰는 utils.ts 내용(WI-0045 FR-4). 레지스트리 utils 항목(apps/web/public/r/utils.json, 원본
 * packages/axis-ui-react/src/utils.ts)과 같은 내용이라 `axis add` 가 끌어오는 utils 와 겹쳐도 「같은 내용」으로
 * 건너뜁니다. 종전(c131ee9 ~ 1.4.0)에는 twMerge 기본판이었습니다. 두 원본과 같은지는 init.test.ts 가 봅니다.
 * `extendTailwindMerge({ extend })` 는 tailwind-merge 2.x · 3.x 모두에 있어 init 이 고르는 두 범위에서 같게 동작합니다.
 */
export const UTILS_TS_CONTENT = `import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * \`shadow-[shadow:<CSS 변수 참조>]\` 처럼 \`shadow:\` 타입 힌트가 붙은 임의값 그림자 클래스인지 판정
 *
 * tailwind-merge 기본 설정은 이 클래스를 그림자 색(shadow-color) 그룹으로 분류해서
 * \`cn(기본, "shadow-none")\` 이 기본 그림자를 지우지 못하고, \`shadow-black/50\` 은 그림자를 통째로 지운다.
 * 그림자(shadow) 그룹에 등록해 종전 \`shadow-sm\` · \`shadow-lg\` 와 같은 병합 결과를 낸다(WI-0025 U4).
 */
const isArbitraryShadowWithHint = (value: string) => /^\\[shadow:.+\\]$/.test(value);

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: [isArbitraryShadowWithHint] }],
    },
  },
});

/**
 * Tailwind CSS 클래스를 병합하는 유틸리티 함수
 * clsx로 조건부 클래스를 처리하고 tailwind-merge로 충돌을 해결
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

/**
 * `src/` 가 있는 프로젝트에서 실재 파일을 찾지 못했을 때의 기본값(종전 `-y` 기본값).
 * WI-0049 D6 부터 `-y` · 대화형 초기값은 `resolveInitAnswers` 가 정합니다: 기존 config 값, 실재 파일, src 유무 순입니다.
 * `src/` 가 없으면 `./components/ui` · `./app/globals.css` 입니다(`INIT_DEFAULTS_NO_SRC`).
 */
export const INIT_DEFAULTS = {
  componentsDir: "./src/components/ui",
  tailwindConfig: "./tailwind.config.ts",
  globalCss: "./src/app/globals.css",
} as const;

/** `src/` 가 없는 프로젝트에서 실재 파일을 찾지 못했을 때의 기본값(WI-0049 D6) */
export const INIT_DEFAULTS_NO_SRC = {
  componentsDir: "./components/ui",
  tailwindConfig: "./tailwind.config.ts",
  globalCss: "./app/globals.css",
} as const;

/** `resolveInitAnswers` 결과: 쓸 답과 그 값을 고른 근거 안내 줄 */
export interface InitResolution {
  answers: InitAnswers;
  /** 사실대로 알리는 안내(`!` 로 시작하면 경고) */
  notes: string[];
}

/**
 * init 이 쓸 경로를 정합니다(WI-0041 D5 · WI-0049 D6). 파일을 쓰지 않습니다. `-y` 는 이 값을 그대로, 대화형은 초기값으로 씁니다.
 * - componentsDir: 기존 config 값(디렉터리는 아직 없을 수 있어 실재와 관계없이 보존) → src/ 가 있으면 `./src/components/ui`,
 *   없으면 `./components/ui`
 * - globalCss · tailwindConfig(파일): 기존 config 값이 실재하면 보존, 실재하지 않으면 탐색값으로 바꾸고 알림.
 *   탐색은 실재 파일(공유 코어 후보 목록) → 찾지 못하면 기본값과 함께 안내
 * - Tailwind 4 이상은 tailwindConfig 를 정하지 않습니다(설정 파일이 없음, WI-0044 FR-3)
 */
export async function resolveInitAnswers(baseDirInput: string, tailwind4?: boolean): Promise<InitResolution> {
  const baseDir = path.resolve(baseDirInput);
  const tw4 = tailwind4 ?? isTailwind4(planUtilsDependencies(baseDir).tailwind);
  const current = await existingConfig(baseDir);
  const found = detectProjectPaths(baseDir);
  const notes: string[] = [];

  const currentComponents = nonEmptyString(current?.componentsDir);
  const componentsDir = currentComponents ?? found.componentsDir;

  /**
   * 파일 경로 키: 기존 값이 실재하면 보존, 실재하지 않으면 찾은 파일로 바꾸고 알림. 기존 값도 없고 찾지도 못했으면 기본값을 알림.
   * 기존 값이 실재하지 않는데 찾은 파일도 없으면 기존 값을 그대로 둡니다(없는 기본값으로 바꿔도 나아지지 않고, 다시 실행할 때
   * src/ 생성 여부에 따라 기본값이 달라져 값이 오가지 않게 합니다).
   */
  const pickFile = (key: "globalCss" | "tailwindConfig", value: string, source: "found" | "default", label: string) => {
    const existing = nonEmptyString(current?.[key]);
    if (existing !== undefined && projectFileExists(baseDir, existing)) return existing;
    if (existing !== undefined) {
      if (source === "found") {
        notes.push(`! 기존 ${key}(${existing})가 없어 찾은 파일 ${value} 로 바꿉니다.`);
        return value;
      }
      notes.push(`! 기존 ${key}(${existing}) 파일이 없고 다른 ${label} 파일도 찾지 못해 그대로 둡니다. 파일 위치에 맞게 axis.config.json 을 고치세요.`);
      return existing;
    } else if (source === "default") {
      notes.push(`! ${label} 파일을 찾지 못해 기본값 ${value} 를 기록합니다. 파일 위치에 맞게 axis.config.json 을 고치세요.`);
    }
    return value;
  };

  const globalCss = pickFile("globalCss", found.globalCss, found.globalCssSource, "전역 CSS");
  const answers: InitAnswers = { componentsDir, globalCss };
  if (!tw4) {
    answers.tailwindConfig = pickFile("tailwindConfig", found.tailwindConfig, found.tailwindConfigSource, "Tailwind 설정");
  }
  return { answers, notes };
}

/**
 * Dialog · Select 등의 열고 닫는 애니메이션(`animate-in` 류) 안내(WI-0065 D8). 이미 선언돼 있으면 `undefined`.
 * Tailwind 3 은 `tailwindcss-animate` 를 plugins 에, Tailwind 4 는 `tw-animate-css` 를 전역 CSS 에 import 합니다.
 *
 * `baseDir` 를 주면(WI-0087 DEC-4 · DEC-6 · P1) 선언은 앱 다음 워크스페이스 루트(`declaredDependency`), 설치본은 node_modules 상위 탐색
 * (`findInstalledPackage`)으로 보고 세 갈래로 나눕니다.
 * - 이름 집합은 axis check 와 같습니다: Tailwind 3 은 `tailwindcss-animate` 만, Tailwind 4 는 `tw-animate-css` · `tailwindcss-animate` 둘 다
 *   (둘 다 선언되면 `tw-animate-css` 로 판정하고 문구를 냅니다).
 * - ① 선언 없음: 종전 줄 ② 선언 + 설치: 침묵 ③ 선언 · 미설치: 「(워크스페이스 루트에) 선언돼 있지만 설치되지 않았습니다」와 설치 명령.
 * - Yarn PnP(`isPnpProject`)면 루트 선언은 앱에서 해석되지 않으므로 인정하지 않고(앱 선언만), 설치본을 판정할 수 없으니 선언이 있으면 종전처럼 침묵합니다.
 * `baseDir` 가 없으면 종전 판정(앱 선언만, 두 이름 중 하나라도 있으면 침묵)입니다.
 *
 * WI-0099(Q140 ~ Q144, 권장안으로 진행): Tailwind 4 이고 `baseDir` 가 있으면 먼저 axis check 와 같은 전역 CSS(`inspectTailwind4Animation`,
 * axis.config.json 의 globalCss 다음 후보)를 읽습니다.
 * - 애니메이션 줄이 있으면 줄마다 그 줄이 가리키는 패키지로 판정합니다(check 의 WI-0092 판정 그대로). 모두 쓸 수 있으면 침묵, 아니면
 *   check 와 같은 사유와 설치 명령을 냅니다. 다른 이름의 패키지만 설치된 경우(S9)는 줄을 그 패키지로 바꾸는 대안도 덧붙입니다.
 * - 줄이 없는데 패키지가 선언 · 설치돼 있으면(종전 침묵) 줄을 넣으라고 안내합니다. 선언 · 미설치와 미선언은 종전 ③ · ① 그대로예요.
 * - CSS 파일을 고르지 못하면 종전 판정 그대로예요(Q143).
 * - WI-0095(Q144 후속): Plug'n'Play 에서 줄의 패키지가 워크스페이스 루트에만 선언된 경우도 같은 줄 판정을 써서 check 와 같은 사유
 *   (「<이름> 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다」)와 앱에 추가하는 명령을 냅니다.
 */
export function animationGuideLine(
  pkg: Record<string, unknown> | undefined,
  tailwind4: boolean,
  installCommand: string,
  baseDir?: string
): string | undefined {
  const name = tailwind4 ? ANIMATION_PLUGIN_TAILWIND4 : ANIMATION_PLUGIN_TAILWIND3;
  const setupOf = (candidate: string) =>
    !tailwind4
      ? `tailwind.config 의 plugins 에 require("${candidate}") 를 넣으세요`
      : `전역 CSS 에 ${tailwind4AnimationLine(candidate)} 를 넣으세요`;
  if (baseDir !== undefined) {
    const pnp = isPnpProject(baseDir);
    const candidates = tailwind4 ? [ANIMATION_PLUGIN_TAILWIND4, ANIMATION_PLUGIN_TAILWIND3] : [ANIMATION_PLUGIN_TAILWIND3];
    const declaredOf = (n: string) => {
      if (pkg === undefined) return undefined;
      if (pnp) return hasDependency(pkg, n) !== undefined ? ({ source: "app" } as const) : undefined;
      return declaredDependency(baseDir, pkg, n);
    };
    const usable = (n: string) => declaredOf(n) !== undefined && (pnp || findInstalledPackage(baseDir, n) !== undefined);
    // WI-0099: check 와 같은 전역 CSS 의 줄 판정. 고른 파일이 없으면(`file` 없음) 아래 종전 판정
    const css = tailwind4 && pkg !== undefined ? inspectTailwind4Animation(baseDir, pkg) : undefined;
    const cssFile = css?.file !== undefined ? `${css.file}${css.via}` : undefined;
    if (css !== undefined && cssFile !== undefined && css.lines.length > 0) {
      if (css.problems.length === 0) return undefined;
      return tailwind4AnimationProblemLine(cssFile, css.lines, css.problems, installCommand, candidates.filter(usable));
    }
    for (const candidate of candidates) {
      const declared = declaredOf(candidate);
      if (declared === undefined) continue;
      if (pnp || findInstalledPackage(baseDir, candidate) !== undefined) {
        // WI-0099(Q142): CSS 를 읽었는데 줄이 없으면 줄을 넣으라고 안내(check 는 WARN). 그 밖은 ② 선언 + 설치 → 침묵
        if (css !== undefined && cssFile !== undefined && css.lines.length === 0) {
          return `애니메이션: ${candidate} 는 ${pnp ? "선언" : "설치"}돼 있지만 ${cssFile}에 애니메이션 줄이 없습니다. ${setupOf(candidate)}.`;
        }
        return undefined;
      }
      // ③ 선언 · 미설치
      const declaredWhere = declared.source === "root" ? "워크스페이스 루트에 " : "";
      const setup = setupOf(candidate);
      // WI-0096: npm 루트 선언이면 「워크스페이스 루트에서 npm install」(앱 디렉터리의 npm install 은 루트 선언을 설치하지 않음)
      const install = installCommandPhrase(installCommand, declared.source === "root");
      return `애니메이션: ${candidate} 는 ${declaredWhere}선언돼 있지만 설치되지 않았습니다. ${install} 뒤 ${setup}.`;
    }
    // ① 선언 없음: 아래 종전 줄
  } else if (
    pkg !== undefined &&
    (hasDependency(pkg, ANIMATION_PLUGIN_TAILWIND3) !== undefined || hasDependency(pkg, ANIMATION_PLUGIN_TAILWIND4) !== undefined)
  ) {
    return undefined;
  }
  // 범위를 정하지 않고 이름만 안내합니다(플러그인 버전은 앱이 고름). 명령 앞부분(`npm install` 등)은 lockfile 로 고릅니다
  const add = `${addCommandFor(installCommand, {}).trimEnd()} ${name}`;
  const where = tailwind4 ? `전역 CSS 에 @import "${name}"; 를 넣으세요` : `tailwind.config 의 plugins 에 require("${name}") 를 넣으세요`;
  return `애니메이션: Dialog · Select 등의 열고 닫는 애니메이션(animate-in 류)은 플러그인이 필요합니다. ${add} 뒤 ${where}.`;
}

/**
 * WI-0095: Plug'n'Play 에서 `tailwindcss` 가 워크스페이스 루트에만 선언됐을 때의 init 안내 한 줄(아니면 `undefined`). 문구는 axis check 의
 * dependencies FAIL(WI-0091 Q5)과 같아요. Tailwind 3 · 4 분기(`detectTailwind`)는 루트 선언을 계속 인정하므로(WI-0091 Q6) init 은 그 분기로
 * 설정을 쓰고, 앱이 tailwindcss 를 해석하지 못한다는 사실만 알립니다. init 은 tailwindcss 를 package.json 에 쓰지 않아요.
 */
export function pnpRootOnlyTailwindLine(baseDir: string, pkg: Record<string, unknown> | undefined): string | undefined {
  return pnpRootOnlyDependency(baseDir, pkg, "tailwindcss") !== undefined
    ? `! 필수 의존성 tailwindcss 가 ${PNP_ROOT_ONLY_NOTE} → 앱 package.json 에 선언하세요`
    : undefined;
}

/** Tailwind 4 전역 CSS 의 애니메이션 줄(`tw-animate-css` 는 `@import`, `tailwindcss-animate` 는 `@plugin`, WI-0087 DEC-6 와 같은 대응) */
function tailwind4AnimationLine(name: string): string {
  return name === ANIMATION_PLUGIN_TAILWIND4 ? `@import "${name}";` : `@plugin "${name}";`;
}

/**
 * WI-0099(Q141): 전역 CSS 의 애니메이션 줄이 가리키는 패키지를 쓸 수 없을 때의 init 안내 한 줄. 사유는 axis check 와 같은 문자열(`why`)이에요.
 * - 미선언(다른 이름만 설치된 S9 포함): `<추가 명령> <이름>` · 선언 · 미설치: 설치 명령(npm 루트 선언이면 「워크스페이스 루트에서 npm install」, WI-0096)
 * - 줄이 가리키지 않는 다른 이름이 이미 선언 · 설치돼 있으면 그 패키지를 쓰는 대안(줄을 바꾸거나, 그 줄이 이미 있으면 문제 줄을 지움)을 앞에 둬요
 * - 명령을 복사하기 쉽게 줄 끝은 명령 그대로예요(마침표 없음, 다른 init 「설치:」 줄과 같음)
 */
function tailwind4AnimationProblemLine(
  cssFile: string,
  lines: readonly string[],
  problems: readonly AnimationPluginProblem[],
  installCommand: string,
  usable: readonly string[]
): string {
  const commands: string[] = [];
  const undeclared = problems.filter((p) => p.kind !== "notInstalled").map((p) => p.name);
  if (undeclared.length > 0) commands.push(`${addCommandFor(installCommand, {}).trimEnd()} ${undeclared.join(" ")}`);
  const notInstalled = problems.filter((p) => p.kind === "notInstalled");
  if (notInstalled.length > 0) commands.push(installCommandPhrase(installCommand, notInstalled.some((p) => p.root === true)));
  const why = problems.map((p) => p.why).join(" · ");
  const problemLines = problems.map((p) => tailwind4AnimationLine(p.name)).join(" · ");
  const other = usable.find((n) => !problems.some((p) => p.name === n));
  const install = `설치하세요: ${commands.join(" · ")}`;
  const action =
    other === undefined
      ? install
      : lines.includes(other)
        ? `이미 설치된 ${other} 만 쓰려면 ${problemLines} 줄을 지우고, 아니면 ${install}`
        : `이미 설치된 ${other} 를 쓰려면 ${problemLines} 줄을 ${tailwind4AnimationLine(other)} 로 바꾸고, 아니면 ${install}`;
  return `애니메이션: ${cssFile}의 애니메이션 줄을 쓸 수 없습니다(${why}). ${action}`;
}

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
 * - `@axis-ds/tokens` 가 package.json 에 없으면 설치 명령(theme add 와 같은 lockfile 판정). 컴포넌트 패키지 · tokens 선언은 `baseDir` 를 주면
 *   워크스페이스 루트 선언도 칩니다(WI-0086 검토 후속: Tailwind 4 판정이 루트 선언을 보게 된 뒤 루트의 tokens 를 앱에 다시 설치하라던 줄).
 * - tokens · ui-react · agentic-ui 의 1.4.0 조건(A1, `axisPackagesBelowTailwind4(pkg, baseDir)`, axis check 와 같은 함수 ·
 *   같은 판정): 보정 3차부터 설치본(node_modules, WI-0074 부터 `baseDir` 부터 상위 탐색) version 을 먼저 봅니다. 설치본이 1.4.0 이상이면 선언이
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
  // 선언 판정은 axis check 와 같은 경계(앱 다음 워크스페이스 루트, `declaredDependency`). `baseDir` 가 없으면 종전처럼 앱 선언만 봅니다(WI-0086 검토 후속).
  // WI-0095: Plug'n'Play 면 루트 선언을 인정하지 않고(`appOnlyInPnp`, check 의 dependencies · B1 과 같은 경계), 루트에만 있는 것은 따로 알립니다
  const declared = (name: string) =>
    pkg !== undefined &&
    (baseDir !== undefined ? declaredDependency(baseDir, pkg, name, undefined, { appOnlyInPnp: true }) : hasDependency(pkg, name)) !==
      undefined;
  const pnpRootOnly = (name: string) => baseDir !== undefined && pnpRootOnlyDependency(baseDir, pkg, name) !== undefined;
  const used = TAILWIND4_COMPONENT_PACKAGES.filter((name) => declared(name));
  const rootOnlyComponents = TAILWIND4_COMPONENT_PACKAGES.filter((name) => pnpRootOnly(name));
  const lines = [
    `Tailwind 4: 전역 CSS(${globalCss}) 맨 위에 다음 줄을 넣으세요(파일은 고치지 않았습니다).`,
    '  @import "tailwindcss";',
    `  ${TOKENS_TAILWIND4_IMPORT_LINE}`,
    ...used.map((name) => `  ${componentTailwindImportLine(name)}`),
  ];
  // WI-0095: 루트 전용 컴포넌트 패키지는 줄을 내지 않고(앱에서 Can't resolve) check 의 B1 과 같은 문구로 앱 선언을 먼저 안내합니다
  for (const name of rootOnlyComponents) {
    lines.push(`  ! ${name} 가 ${PNP_ROOT_ONLY_NOTE} → 앱 package.json 에 선언한 뒤 ${componentTailwindImportLine(name)}`);
  }
  if (used.length === 0 && rootOnlyComponents.length === 0) {
    lines.push(
      `  npm 패키지 컴포넌트를 쓰면 그 패키지의 tailwind.css 도 넣으세요(예: @import "${TAILWIND4_COMPONENT_PACKAGES[0]}/tailwind.css";).`
    );
  }
  lines.push(TAILWIND4_CONFLICT_LINE);
  if (!declared(TOKENS_PACKAGE)) {
    const add = addCommandFor(installCommand, { [TOKENS_PACKAGE]: `^${TAILWIND4_TOKENS_VERSION}` });
    // WI-0095: Plug'n'Play 루트 전용이면 미선언과 같은 명령에 사유를 붙입니다(check 의 dependencies WARN 과 같은 사유)
    const why = pnpRootOnly(TOKENS_PACKAGE) ? `(${PNP_ROOT_ONLY_NOTE})` : "";
    lines.push(`  ${TOKENS_PACKAGE} 설치${why}: ${add}`);
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
  /**
   * 이미 있던 의존성과 선언된 범위(바꾸지 않음). `source` 는 선언 위치입니다(WI-0086: 워크스페이스 루트 선언이면 `root`,
   * 앱 package.json 에 다시 쓰지 않음).
   */
  present: { name: string; range: string; source?: "app" | "root" }[];
  /**
   * WI-0095: Plug'n'Play 에서 워크스페이스 루트에만 선언돼 앱이 해석하지 못하는 것(`added` 에 들어감). 루트 선언은 앱 issuer 에서
   * 해석되지 않아 「이미 있음」으로 보지 않고 앱 package.json 에 더합니다(axis check 의 `appOnlyInPnp` 와 같은 경계)
   */
  pnpRootOnly: string[];
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

// lockfile 로 고른 설치 명령에서 패키지 추가 명령을 만드는 함수는 theme add 와 같이 쓰려고 공유 코어로 옮겼습니다(WI-0065). 종전 이름 그대로 내보냅니다
export { addCommandFor };

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
    pnpRootOnly: [],
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
  // WI-0086: 앱 선언 다음 워크스페이스 루트 선언(axis check 의 dependencies 항목과 같은 헬퍼 · 경계)도 「이미 있음」으로 봅니다.
  // 쓰기는 계속 앱 package.json 에만 하고, 루트 선언은 앱으로 옮기지 않습니다.
  // WI-0095: Plug'n'Play 면 루트 선언을 인정하지 않고(`appOnlyInPnp`) 미선언과 같게 앱 package.json 에 더합니다(범위도 미선언과 같음)
  for (const [name, range] of Object.entries(plan.ranges)) {
    const declared = declaredDependency(baseDir, pkg, name, undefined, { appOnlyInPnp: true });
    if (declared !== undefined) plan.present.push({ name, range: declared.range, source: declared.source });
    else {
      missing[name] = range;
      if (pnpRootOnlyDependency(baseDir, pkg, name) !== undefined) plan.pnpRootOnly.push(name);
    }
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
  // 루트 선언이면 출처를 붙입니다(axis check 의 「워크스페이스 루트에 선언: …」과 같은 문구, WI-0086). 앱 선언만이면 종전 문구 그대로
  const rootPresent = plan.present.filter((p) => p.source === "root").map((p) => p.name);
  const rootNote = rootPresent.length > 0 ? ` (워크스페이스 루트에 선언: ${rootPresent.join(", ")})` : "";
  const basis = `  tailwind-merge 범위 기준: ${describeTailwindBasis(plan.tailwind)}`;
  // WI-0096: 이미 있는 의존성 가운데 루트 선언이 있으면 npm 은 「워크스페이스 루트에서 npm install」(루트에서 실행하면 앱 선언도 함께 설치됨)
  const installPhrase = installCommandPhrase(plan.installCommand, rootPresent.length > 0);
  const installText =
    installPhrase === plan.installCommand
      ? chalk.cyan(plan.installCommand)
      : `워크스페이스 루트에서 ${chalk.cyan(plan.installCommand)}`;
  // 근거 줄과 그 판정의 경고 줄(F1)
  const logBasis = () => {
    log(chalk.gray(basis));
    for (const w of tailwindWarnings(plan.tailwind, plan.installCommand)) log(chalk.yellow(`  ${w}`));
  };
  if (plan.action === "add") {
    const addedText = plan.added.map((n) => `${n}@${plan.ranges[n]}`).join(", ");
    log(chalk.green(`✓ package.json dependencies 에 추가: ${addedText}`));
    // WI-0095: Plug'n'Play 루트 전용이라 더한 것은 그 사유를 알립니다(check 의 dependencies 와 같은 사유)
    if (plan.pnpRootOnly.length > 0) log(chalk.gray(`  ${plan.pnpRootOnly.join(", ")} 는 ${PNP_ROOT_ONLY_NOTE}`));
    if (plan.present.length > 0) log(chalk.gray(`  이미 있음(버전 유지): ${presentText}${rootNote}`));
    if (plan.added.includes("tailwind-merge")) logBasis();
    log(chalk.yellow(`  설치는 실행하지 않았습니다. 설치: ${installText}`));
  } else if (plan.action === "present") {
    log(chalk.green(`✓ utils.ts 의존성이 package.json 에 이미 있습니다(버전 유지): ${presentText}${rootNote}`));
    log(chalk.yellow(`  설치는 실행하지 않았습니다. 설치: ${installText}`));
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
 * 기존 axis.config.json 의 registry(비어 있지 않은 문자열)를 읽습니다. 파일이 없거나 읽지 못하면 undefined 입니다.
 * init 은 환경변수 AXIS_REGISTRY_URL 을 config 에 기록하지 않습니다(WI-0045 D7): 환경변수는 실행할 때만 우선하는
 * 값이라, 기록하면 한 번 준 임시 URL(로컬 서버 등)이 그 뒤 환경변수 없이 실행해도 남습니다.
 */
async function existingConfig(baseDir: string): Promise<AxisConfig | null> {
  try {
    const parsed: unknown = await readAxisConfig(baseDir);
    return isPlainObject(parsed) ? (parsed as AxisConfig) : null;
  } catch {
    return null;
  }
}

/** init 이 값을 정하는 키(WI-0041 D4). 이 밖의 키(brand · monetDir · template · agenticDir 등)는 값과 순서를 그대로 둡니다 */
export const INIT_MANAGED_KEYS = ["$schema", "componentsDir", "tailwindConfig", "globalCss", "registry"] as const;

/**
 * 기존 config 에 init 값을 병합합니다(WI-0041 D4). 기존 키의 순서와 init 이 다루지 않는 키는 그대로 두고,
 * init 이 다루는 키는 새 값으로 바꿉니다. 기존에 없던 init 키는 `next` 의 순서에서 바로 앞 키 다음에 넣습니다.
 * init 이 다루는 키인데 `next` 에 없으면(Tailwind 4 의 tailwindConfig) 지우고 그 이름을 `removed` 에 담습니다.
 */
export function mergeInitConfig(
  current: Record<string, unknown>,
  next: Record<string, unknown>
): { merged: Record<string, unknown>; removed: string[] } {
  const removed: string[] = [];
  const entries: [string, unknown][] = [];
  for (const [k, v] of Object.entries(current)) {
    if (k in next) entries.push([k, next[k]]);
    else if ((INIT_MANAGED_KEYS as readonly string[]).includes(k)) removed.push(k);
    else entries.push([k, v]);
  }
  const nextKeys = Object.keys(next);
  nextKeys.forEach((k, i) => {
    if (k in current) return;
    // 바로 앞의 init 키(이미 entries 에 있는 것) 다음 자리, 없으면 맨 앞
    let at = 0;
    for (let j = i - 1; j >= 0; j--) {
      const idx = entries.findIndex(([key]) => key === nextKeys[j]);
      if (idx !== -1) {
        at = idx + 1;
        break;
      }
    }
    entries.splice(at, 0, [k, next[k]]);
  });
  return { merged: Object.fromEntries(entries), removed };
}

/** 뒤 단계에서 실패했을 때 axis.config.json 을 실제로 썼는지 사실대로 알리는 문구 */
function configStateNote(state: "created" | "updated" | "kept"): string {
  if (state === "created") return "axis.config.json 은 이미 만들었습니다.";
  if (state === "updated") return "axis.config.json 은 이미 갱신했습니다.";
  return "axis.config.json 은 바꾸지 않았습니다(이미 같은 내용).";
}

/** 비어 있지 않은 문자열이면 그 값, 아니면 undefined */
function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/**
 * utils.ts 쓰기 판정(D17 · D19 · p2). 파일을 쓰지 않습니다.
 * - create: 없음(lstat ENOENT)
 * - keep: 내용이 같음. 링크면 link 에 대상 정보(밖이면 outside 에 실제 위치)
 * - overwrite: 내용이 다른 일반 파일(종전 동작, 「덮어씀」)
 * - reject: 쓰지 않고 rc 1. 내용이 다른 링크(프로젝트 안 · 밖), 깨진 링크, 디렉터리(또는 디렉터리를 가리키는 링크),
 *   일반 파일이 아님, 읽기 불가(EACCES 등), 하드링크(nlink 2 이상, D19), ENOENT 가 아닌 lstat 오류
 */
export type UtilsWritePlan =
  | { action: "create" }
  | { action: "keep"; link?: { outside: string | null } }
  | { action: "overwrite" }
  | { action: "reject"; reason: string };

function errCode(e: unknown): string {
  return (e as NodeJS.ErrnoException).code ?? (e as Error).message;
}

/** add 의 링크 규칙(D12 · D15)을 init 의 utils.ts 에 그대로 적용합니다(D17) */
export function planUtilsWrite(baseDirInput: string, utilsPath: string): UtilsWritePlan {
  const baseDir = path.resolve(baseDirInput);
  const shown = path.relative(baseDir, utilsPath).split(path.sep).join("/") || utilsPath;
  let st: ReturnType<typeof lstatSync>;
  try {
    st = lstatSync(utilsPath);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return { action: "create" };
    return { action: "reject", reason: `${shown} 의 정보를 읽지 못했습니다(${errCode(e)})` };
  }
  if (st.isSymbolicLink()) {
    let real: string;
    try {
      real = realpathSync(utilsPath);
    } catch {
      return { action: "reject", reason: `${shown} 이 깨진 심볼릭 링크라 쓰지 않습니다. 링크를 지우거나 고친 뒤 다시 실행하세요` };
    }
    let outside: string | null = null;
    try {
      outside = isSameOrInside(realpathSync(baseDir), real) ? null : real;
    } catch {
      outside = null;
    }
    let target: ReturnType<typeof statSync>;
    try {
      target = statSync(real);
    } catch (e) {
      return { action: "reject", reason: `${shown} 링크 대상(${real})의 정보를 읽지 못했습니다(${errCode(e)})` };
    }
    if (target.isDirectory()) return { action: "reject", reason: `${shown} 링크가 디렉터리(${real})를 가리킵니다` };
    if (!target.isFile()) return { action: "reject", reason: `${shown} 링크 대상(${real})이 일반 파일이 아닙니다` };
    let content: string;
    try {
      content = readFileSync(utilsPath, "utf8");
    } catch (e) {
      return { action: "reject", reason: `${shown} 링크 대상(${real})을 읽지 못해 비교할 수 없습니다(${errCode(e)})` };
    }
    if (content === UTILS_TS_CONTENT) return { action: "keep", link: { outside } };
    const what = outside !== null ? `프로젝트 밖(${outside})을 가리키는 심볼릭 링크라` : "프로젝트 안을 가리키는 심볼릭 링크라";
    return {
      action: "reject",
      reason:
        `기존 ${shown} 이 ${what} 덮어쓸 수 없습니다(내용이 init 의 utils 와 다름). ` +
        "링크는 따라가 쓰지 않으니 링크를 지우거나 실제 파일로 바꾼 뒤 다시 실행하세요",
    };
  }
  if (st.isDirectory()) return { action: "reject", reason: `${shown} 이름의 디렉터리가 있어 쓰지 않습니다` };
  if (!st.isFile()) return { action: "reject", reason: `${shown} 이 일반 파일이 아니라 쓰지 않습니다` };
  let content: string;
  try {
    content = readFileSync(utilsPath, "utf8");
  } catch (e) {
    // p2: ENOENT 가 아닌 읽기 오류는 「생성 완료」가 아니라 그 사실을 알리고 쓰지 않습니다
    return { action: "reject", reason: `기존 ${shown} 을 읽지 못해 비교할 수 없습니다(${errCode(e)})` };
  }
  if (content === UTILS_TS_CONTENT) return { action: "keep" };
  const nlink = hardLinkCount(utilsPath);
  if (nlink !== null) return { action: "reject", reason: hardLinkMessage(shown, nlink) };
  try {
    // 읽기 전용 파일은 config 를 쓴 뒤에야 실패해 부분 쓰기가 남으므로 계획 단계에서 막습니다
    accessSync(utilsPath, constants.W_OK);
  } catch (e) {
    return { action: "reject", reason: `기존 ${shown} 에 쓸 권한이 없어 덮어쓸 수 없습니다(${errCode(e)})` };
  }
  return { action: "overwrite" };
}

/**
 * init 을 실행합니다. 쓰기 실패는 rc 1(`process.exitCode`)로 알립니다.
 * 설치 명령은 실행하지 않습니다.
 *
 * 쓰기 전에 axis.config.json · utils.ts 의 판정을 모두 마치고, 하나라도 쓸 수 없으면(D17 링크 · D19 하드링크 · p2 읽기 불가)
 * 아무것도 쓰지 않고 rc 1 로 끝냅니다(add 와 같은 원칙).
 */
export interface RunInitOptions {
  /**
   * 내용이 다른 기존 utils.ts 를 덮어써도 되는지. 기본은 true(-y · 대화형의 종전 동작)입니다.
   * -y 없는 비대화형은 false 로 불러, 덮어쓰기 갈래를 확인 질문 대신 rc 1 과 -y 안내로 막습니다(WI-0075 D1)
   */
  allowOverwrite?: boolean;
}

export async function runInit(
  baseDirInput: string,
  answers: InitAnswers,
  registryUrl: string,
  log: Log = console.log,
  options: RunInitOptions = {}
): Promise<void> {
  const baseDir = path.resolve(baseDirInput);
  // 이미 axis.config.json 에 registry 가 있으면 그 값을 지킵니다(WI-0045 D7). 없으면 받은 값(기본값)을 씁니다.
  // 기존 값이 종전 기본값(axis.minu.best/r, D18 정규화 비교)이면 새 기본값으로 바꿔 씁니다(D20). 다른 값은 그대로 둡니다
  const current = await existingConfig(baseDir);
  const existingRegistry = nonEmptyString(current?.registry);
  const migratedRegistry = existingRegistry !== undefined && isLegacyDefaultRegistryUrl(existingRegistry);
  const registry = existingRegistry !== undefined && !migratedRegistry ? existingRegistry : registryUrl;
  // add 가 읽는 agenticDir 도 init 이 묻지 않는 값이라, 다시 실행할 때 지우면 agentic 설치 위치가 바뀝니다. 기존 값을 지킵니다
  const existingAgenticDir = nonEmptyString(current?.agenticDir);

  // utils.ts 의존성 계획(D1). 파일을 쓰지 않으므로 먼저 계산해 Tailwind 판정을 config 에도 씁니다.
  const plan = planUtilsDependencies(baseDir);
  const tailwind4 = isTailwind4(plan.tailwind);

  // axis.config.json 생성. Tailwind 4 이상은 설정 파일이 없으므로 tailwindConfig 를 적지 않습니다(WI-0044 FR-3).
  const axisConfig: AxisConfig = createInitConfig(
    {
      componentsDir: answers.componentsDir,
      agenticDir: existingAgenticDir,
      tailwindConfig: tailwind4 ? undefined : answers.tailwindConfig,
      globalCss: answers.globalCss,
    },
    registry
  );

  // 이미 있던 파일이면 「생성」이 아니라 사실대로 알립니다(m5): 내용이 같으면 쓰지 않고 유지, 다르면 갱신
  const configPath = path.join(baseDir, "axis.config.json");
  // 쓰기 전 판정(D17 · D19 · p2). 하나라도 막히면 아무것도 쓰지 않습니다
  const rejects: string[] = [];
  let previousText: string | null = null;
  try {
    previousText = await fs.readFile(configPath, "utf8");
  } catch (e) {
    // ENOENT 만 「없는 파일」입니다. 읽지 못한 기존 파일(EACCES 등)을 없는 것으로 보면 사용자 값을 묻지 않고 덮어씁니다
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
      rejects.push(`기존 axis.config.json 을 읽지 못해 비교할 수 없습니다(${errCode(e)})`);
    }
  }
  // 기존 config 를 읽었으면 init 이 다루는 키만 바꾸고 나머지 키 · 순서 · 들여쓰기는 그대로 둡니다(WI-0041 D4).
  // 읽지 못한 JSON(깨짐 · 객체 아님)은 종전처럼 init 값으로 다시 씁니다
  let removedKeys: string[] = [];
  let nextText = `${JSON.stringify(axisConfig, null, 2)}\n`;
  if (previousText !== null && current !== null) {
    const { merged, removed } = mergeInitConfig(current as Record<string, unknown>, axisConfig as Record<string, unknown>);
    removedKeys = removed;
    const body = previousText.startsWith(BOM) ? previousText.slice(1) : previousText;
    nextText = (previousText.startsWith(BOM) ? BOM : "") + formatJsonLike(body, merged);
  }
  if (previousText !== null && previousText !== nextText) {
    // config 는 종전처럼 링크를 따라가 쓰므로 하드링크 판정도 따라간 대상(stat)으로 합니다(D19)
    try {
      const st = statSync(configPath);
      if (st.isFile() && st.nlink >= 2) rejects.push(hardLinkMessage("axis.config.json", st.nlink));
    } catch {
      // 읽은 직후 정보를 못 읽으면 쓰기 단계가 사실대로 실패를 알립니다
    }
  }
  const utilsPath = path.resolve(baseDir, answers.componentsDir, "utils.ts");
  const utilsPlan = planUtilsWrite(baseDir, utilsPath);
  if (utilsPlan.action === "reject") rejects.push(utilsPlan.reason);
  if (utilsPlan.action === "overwrite" && options.allowOverwrite === false) {
    const shown = path.relative(baseDir, utilsPath).split(path.sep).join("/") || utilsPath;
    rejects.push(
      `비대화형 실행이라 내용이 다른 기존 ${shown} 를 덮어쓰지 않습니다. ` +
        "덮어써도 되면 axis init -y 로 다시 실행하거나 대화형 터미널에서 실행하세요"
    );
  }
  if (rejects.length > 0) {
    log(chalk.red("✗ 쓸 수 없는 파일이 있어 아무것도 쓰지 않았습니다(axis.config.json · utils.ts · package.json 그대로)."));
    for (const r of rejects) log(chalk.red(`  - ${r}`));
    process.exitCode = 1;
    return;
  }

  // config 를 실제로 썼는지(뒤 단계 실패 안내를 사실대로 하려고 기록합니다)
  let configState: "created" | "updated" | "kept";
  if (previousText === null) {
    try {
      // 판정 뒤 같은 이름의 파일이 생겼으면 덮어쓰지 않습니다(wx = O_CREAT|O_EXCL)
      await fs.writeFile(configPath, nextText, { flag: "wx" });
    } catch (err) {
      const reason =
        (err as NodeJS.ErrnoException).code === "EEXIST"
          ? "검사 뒤 쓰기 직전에 같은 이름의 파일이 생겼습니다(동시 경합)"
          : (err as Error).message;
      log(chalk.red(`✗ axis.config.json 을 만들지 못했습니다: ${reason}. 아무것도 쓰지 않았습니다.`));
      process.exitCode = 1;
      return;
    }
    configState = "created";
    log(chalk.green("✓ axis.config.json 생성 완료"));
  } else if (previousText === nextText) {
    configState = "kept";
    log(chalk.green("✓ axis.config.json 유지(이미 같은 내용)"));
  } else {
    try {
      await overwriteFollowingLinks(configPath, nextText);
    } catch (err) {
      const reason =
        (err as NodeJS.ErrnoException).code === HARDLINK_ERROR_CODE
          ? `검사 뒤 쓰기 직전에 다른 경로와 하드링크로 이어졌습니다(동시 경합, D19)`
          : (err as Error).message;
      log(chalk.red(`✗ axis.config.json 을 쓰지 못했습니다: ${reason}. 아무것도 쓰지 않았습니다.`));
      process.exitCode = 1;
      return;
    }
    configState = "updated";
    const registryNote = migratedRegistry
      ? "registry 를 새 기본 주소로 갱신"
      : existingRegistry !== undefined
        ? "registry 는 기존 값 유지"
        : "registry 는 기본값";
    const agenticNote = existingAgenticDir !== undefined ? ", agenticDir 는 기존 값 유지" : "";
    const mergeNote = current !== null ? "init 이 다루는 키만 바꾸고 나머지 키는 그대로 둠" : "읽지 못한 기존 파일을 init 값으로 다시 씀";
    log(chalk.green(`✓ axis.config.json 갱신(${mergeNote}, ${registryNote}${agenticNote})`));
    if (migratedRegistry && existingRegistry !== undefined) {
      // D20: 종전 기본 주소는 Cloudflare 403 이라 새 기본 주소로 바꿨다는 사실을 알립니다(사용자가 지정한 다른 값은 그대로 둠)
      log(
        chalk.yellow(
          `  registry 를 새 기본 주소(${redactRegistryUrl(registry)})로 갱신했습니다(종전 axis.minu.best: ${redactRegistryUrl(existingRegistry)}).`
        )
      );
    }
    // init 이 쓰지 않는 다른 키(brand · monetDir · template 등)는 WI-0041 D4 부터 그대로 남습니다.
    // init 이 다루는 키인데 이번 값에 없는 것(Tailwind 4 의 tailwindConfig)만 지우고 사실대로 알립니다
    if (removedKeys.length > 0) {
      log(chalk.yellow(`  지운 키: ${removedKeys.join(", ")} (Tailwind 4 이상은 설정 파일을 쓰지 않습니다)`));
    }
  }

  // utils.ts. 이미 있던 파일이면 사실대로 알립니다(n1 · m5 계열): 같은 내용이면 쓰지 않고 유지(링크면 그 사실도),
  // 다른 일반 파일이면 종전 동작대로 init 의 내용으로 덮어쓰고 그렇게 알립니다. 쓰기는 add 와 같은 O_NOFOLLOW 경로입니다(D17)
  let utilsStateNote = "utils.ts 는 바꾸지 않았습니다(이미 같은 내용).";
  if (utilsPlan.action === "keep") {
    if (utilsPlan.link === undefined) log(chalk.green("✓ utils.ts 유지(이미 같은 내용)"));
    else if (utilsPlan.link.outside === null) log(chalk.green("✓ utils.ts 유지(이미 같은 내용, 링크)"));
    else log(chalk.green(`✓ utils.ts 유지(이미 같은 내용, 링크 대상이 프로젝트 밖: ${utilsPlan.link.outside})`));
  } else {
    let actual: "new" | "overwrite";
    try {
      await fs.ensureDir(path.dirname(utilsPath));
      actual = await writeNoFollow(utilsPath, UTILS_TS_CONTENT, utilsPlan.action === "create" ? "new" : "overwrite");
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      const reason =
        code === HARDLINK_ERROR_CODE
          ? "검사 뒤 쓰기 직전에 다른 경로와 하드링크로 이어졌습니다(동시 경합, D19)"
          : code === "ELOOP" || code === "EEXIST"
            ? "검사 뒤 쓰기 직전에 같은 이름의 파일 · 링크가 생겼습니다(동시 경합)"
            : (err as Error).message;
      // 새 파일은 「만들지 못함」, 기존 파일은 「덮어쓰지 않음」으로 나눠 사실대로 알립니다
      log(
        chalk.red(
          utilsPlan.action === "create"
            ? `✗ utils.ts 를 만들지 못했습니다: ${reason}.`
            : `✗ utils.ts 를 쓰지 못했습니다: ${reason}. 그 파일은 덮어쓰지 않았습니다.`
        )
      );
      log(chalk.yellow(`  ${configStateNote(configState)}`));
      process.exitCode = 1;
      return;
    }
    log(
      chalk.green(
        actual === "new" ? "✓ utils.ts 생성 완료" : "✓ utils.ts 덮어씀(기존 내용과 달라 init 의 utils 로 다시 씀)"
      )
    );
    utilsStateNote = actual === "new" ? "utils.ts 는 이미 만들었습니다." : "utils.ts 는 이미 덮어썼습니다.";
  }

  // utils.ts 의존성(D1)
  try {
    applyUtilsDependencies(baseDir, plan);
  } catch (err) {
    log(chalk.red(`✗ package.json 을 쓰지 못했습니다: ${(err as Error).message}`));
    log(chalk.yellow(`  ${configStateNote(configState)} ${utilsStateNote}`));
    log(chalk.yellow(`  utils.ts 의존성 설치: ${chalk.cyan(plan.addCommand)}`));
    process.exitCode = 1;
    return;
  }
  reportDependencies(plan, log);
  // WI-0095: Plug'n'Play 에서 tailwindcss 가 워크스페이스 루트에만 있으면 axis check 의 dependencies FAIL 과 같은 사유를 미리 알립니다
  const tailwindRootOnly = pnpRootOnlyTailwindLine(baseDir, readPackageJsonSafe(baseDir));
  if (tailwindRootOnly !== undefined) log(chalk.yellow(`  ${tailwindRootOnly}`));

  // 애니메이션 플러그인 안내 한 줄(WI-0065 D8). 선언 · 설치돼 있으면 내지 않고, 선언만 있으면 설치 안내를 냅니다(WI-0087: 워크스페이스 루트 선언 · 설치본을 봄)
  const animation = animationGuideLine(readPackageJsonSafe(baseDir), tailwind4, plan.installCommand, baseDir);
  if (animation !== undefined) log(chalk.yellow(`  ${animation}`));

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
