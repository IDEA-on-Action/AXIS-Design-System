/** axis theme 명령어 (WI-0028 FR-1 · FR-2 · FR-3) */

import type { Command } from "commander";
import chalk from "chalk";
import path from "path";
import {
  KEY_TOKENS,
  MIN_BRAND_TOKENS_VERSION,
  TOKENS_PACKAGE,
  getBrand,
  listBrands,
  providerExample,
  type BrandDetail,
  type BrandGetResult,
  type BrandListResult,
  type TokensStatus,
} from "./brand-core.js";
import {
  COMPONENT_TAILWIND_CSS_MIN_VERSION,
  THEME_MIN_VERSION,
  THEME_PACKAGE,
  TOKENS_DEPENDENCY_RANGE,
  ThemeApplyError,
  applyThemeAdd,
  planThemeAdd,
  type ThemeAddPlan,
} from "./theme-add.js";
import {
  addCommandFor,
  compareExactVersions,
  dependencyInstallGuide,
  detectInstallCommand,
  PNP_ROOT_ONLY_NOTE,
  workspaceRunCommand,
  type DependencyInstallGuide,
} from "@axis-ds/registry-core/project";
import {
  CONTENT_PARENT_PATH_NOTE,
  CONTENT_PNP_ROOT_ONLY_ACTION,
  contentPnpNoteFor,
  TOKENS_TAILWIND3_CJS_REQUIRE,
  TOKENS_TAILWIND3_PRESET,
} from "@axis-ds/registry-core/tailwind-core";
import { THEME_MARKUP_BRAND_MIN_VERSION } from "./brand-core.js";

/** CSS 에서 `@import "<spec>"` 줄이 시작하는 위치(작은따옴표 · `url()` 포함). 없으면 -1 */
function importOffset(css: string, spec: string): number {
  const escaped = spec.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp(`@import\\s+(?:url\\(\\s*)?["']${escaped}["']`).exec(css);
  return m ? m.index : -1;
}

/**
 * theme add 가 넣은 기본 import 한 줄의 출력 문구(WI-0070). 종전에는 모든 줄을 「기본 토큰 CSS, 브랜드 앞」으로 적어,
 * 재실행 때 브랜드 줄 뒤에 들어간 컴포넌트 `tailwind.css` 도 그렇게 나왔습니다.
 * - 컴포넌트 `<pkg>/tailwind.css`: `@source` 스캔 진입점이라 위치와 상관없습니다(ui-react 1.6.2 의 파일은 `@source "./dist";` 한 줄).
 * - 기본 토큰 CSS: 실제로 브랜드 줄보다 앞에 들어갔을 때만 「브랜드 앞」. 뒤에 들어갔으면 옮기라는 경고를 따로 냅니다.
 */
function baseImportLines(after: string, spec: string, brandImportPath: string, file: string): string[] {
  if (spec.endsWith("/tailwind.css")) {
    return [`  ${chalk.green("✓")} ${file}: @import "${spec}"; 추가(컴포넌트 스캔 경로, 위치 무관)`];
  }
  const at = importOffset(after, spec);
  const brandAt = importOffset(after, brandImportPath);
  if (brandAt === -1 || (at !== -1 && at < brandAt)) {
    return [`  ${chalk.green("✓")} ${file}: @import "${spec}"; 추가(기본 토큰 CSS, 브랜드 앞)`];
  }
  return [
    `  ${chalk.green("✓")} ${file}: @import "${spec}"; 추가(기본 토큰 CSS)`,
    chalk.yellow(`  ! 이 줄이 브랜드 import 뒤에 들어갔습니다. 브랜드 값이 기본 토큰에 덮이므로 @import "${brandImportPath}"; 앞으로 옮기세요`),
  ];
}

/** 명령 출력: 줄 목록과 종료 코드 */
export interface ThemeOutput {
  lines: string[];
  exitCode: number;
}

/**
 * tokens 를 설치 · 업그레이드할 때 안내하는 명령. 범위는 U6(WI-0028 의 tokens 범위 결정, WI-0065 D7-범위에서 `^1.6.0`)이고,
 * 매니저는 WI-0065 D7 부터 lockfile 로, WI-0085 부터 lockfile 이 없으면 package.json `packageManager` 로 고릅니다(`detectInstallCommand`).
 * 종전에는 `pnpm add` 로 고정이라 npm · yarn 프로젝트에도 pnpm 명령이 나왔습니다. 둘 다 없으면 종전과 같은 pnpm 입니다.
 */
export function tokensInstallCommand(baseDir: string): string {
  return addCommandFor(detectInstallCommand(baseDir), { [TOKENS_PACKAGE]: TOKENS_DEPENDENCY_RANGE });
}

/** lockfile · `packageManager` 가 없을 때의 안내 명령(종전 상수 이름 유지, 범위는 `TOKENS_DEPENDENCY_RANGE`) */
export const TOKENS_INSTALL_COMMAND = addCommandFor("pnpm install", { [TOKENS_PACKAGE]: TOKENS_DEPENDENCY_RANGE });

/**
 * 대상 프로젝트의 tokens 선언 출처로 고른 설치 안내 방법(WI-0093, registry-core `dependencyInstallGuide`).
 * 경계는 theme add 와 같아요(P1 Plug'n'Play · P2 앱 lockfile 이면 루트 선언 불인정). `addCommand` 는 `tokensInstallCommand(baseDir)` 와 같아요.
 */
export function tokensInstallGuide(baseDir: string): DependencyInstallGuide {
  return dependencyInstallGuide(baseDir, TOKENS_PACKAGE, TOKENS_DEPENDENCY_RANGE);
}

/** 문자열(종전 호출)은 선언 출처를 모르는 `add` 갈래로 봅니다(설치 명령은 매니저 접두만 쓰므로 그 명령 자체를 넘겨요) */
function asGuide(guide: string | DependencyInstallGuide): DependencyInstallGuide {
  return typeof guide === "string" ? { kind: "add", installCommand: guide, addCommand: guide } : guide;
}

/** Plug'n'Play 에서 앱에 선언이 있을 때의 안내 한 줄(WI-0093 Q13, MCP `formatTokensStatusGuide` 와 같은 문장) */
export function tokensPnpMessage(range?: string): string {
  return `${TOKENS_PACKAGE}${range ? ` ${range}` : ""} 가 package.json 에 선언돼 있지만 Plug'n'Play 설치라 설치본을 판정하지 못해 브랜드를 읽을 수 없습니다.`;
}

/** 워크스페이스 루트 선언이 브랜드를 지원하지 않는 버전일 때의 안내(WI-0087 DEC-8 문구 그대로, WI-0093 Q16) */
export const ROOT_TOKENS_UPGRADE_GUIDE = `워크스페이스 루트 package.json 의 ${TOKENS_PACKAGE} 선언을 ^${MIN_BRAND_TOKENS_VERSION} 이상으로 올리고 설치하세요.`;

/**
 * 설치 · 재설치 안내에 쓰는 명령 구절(WI-0093). `install-at-root`(npm 루트 선언)는 「워크스페이스 루트에서 npm install」,
 * `install` 은 `<pm> install`, 그 밖에는 범위를 붙인 추가 명령이에요. theme list · info 와 theme add 의 재설치 줄(B2 · B3)이 같이 써요
 */
function installPhrase(g: DependencyInstallGuide): string {
  if (g.kind === "install-at-root") return `워크스페이스 루트에서 ${chalk.cyan(g.installCommand)}`;
  return chalk.cyan(g.kind === "install" ? g.installCommand : g.addCommand);
}

/** 빌드 전 tokens 의 빌드 · 재설치 안내 줄 본문(theme list · info 와 theme add 가 같은 문장, WI-0093 B2 · B3) */
function rebuildGuide(g: DependencyInstallGuide): string {
  return `워크스페이스면 ${chalk.cyan(workspaceRunCommand(g.installCommand, TOKENS_PACKAGE, "build"))}, 아니면 재설치: ${installPhrase(g)}`;
}

/**
 * `status` 가 `ok` 가 아닐 때의 안내. 빈 목록이 아니라 「측정을 못 했다」를 알립니다(plan 3장 5-3).
 * `guide` 는 `tokensInstallGuide(baseDir)` 로 고른 안내 방법이에요(WI-0093). 문자열을 주면 종전처럼 그 명령을 그대로 안내하고,
 * 주지 않으면 lockfile 이 없을 때와 같은 pnpm 추가 명령이에요.
 * - 선언 없음(`add`): 종전 그대로 추가 명령(`<pm> add "@axis-ds/tokens@^1.6.0"`)
 * - 앱 선언 · pnpm · yarn 루트 선언(`install`): 미설치 · 빌드 전 재설치는 `<pm> install`. 미지원은 앱 선언이면 종전 추가 명령(범위를 올림),
 *   루트 선언이면 WI-0087 DEC-8 문구(루트 선언을 올리고 설치)
 * - npm 루트 선언(`install-at-root`): 「워크스페이스 루트에서 npm install」(WI-0093 Q15)
 * - Plug'n'Play 앱 선언(`pnp`): 설치 명령 없이 판정하지 못했다는 한 줄(WI-0093 Q13)
 * 빌드 전의 워크스페이스 빌드 명령도 같은 매니저로 고릅니다(WI-0085, `workspaceRunCommand`. 종전에는 `pnpm --filter` 고정).
 */
export function tokensStatusGuide(
  status: Exclude<TokensStatus, "ok">,
  version?: string,
  guide: string | DependencyInstallGuide = TOKENS_INSTALL_COMMAND
): string[] {
  const g = asGuide(guide);
  if (g.kind === "pnp") return [chalk.yellow(tokensPnpMessage(g.range))];
  const install = installPhrase(g);
  switch (status) {
    case "not-installed":
      return [chalk.yellow(`${TOKENS_PACKAGE} 가 설치돼 있지 않아 브랜드를 읽을 수 없습니다.`), `  설치: ${install}`];
    case "unsupported":
      return [
        chalk.yellow(
          `${TOKENS_PACKAGE} ${version ?? "(버전 모름)"} 은 브랜드를 지원하지 않습니다(${MIN_BRAND_TOKENS_VERSION} 이상 필요).`
        ),
        g.source === "root" ? `  ${ROOT_TOKENS_UPGRADE_GUIDE}` : `  업그레이드: ${chalk.cyan(g.addCommand)}`,
      ];
    case "not-built":
      return [
        chalk.yellow(
          `${TOKENS_PACKAGE}${version ? ` ${version}` : ""} 는 있지만 빌드 산출물이 없어 브랜드를 읽을 수 없습니다.`
        ),
        `  ${rebuildGuide(g)}`,
      ];
  }
}

/** `axis theme list` 출력 (FR-1). a11y 상태는 길 수 있어 info 에서만 냅니다(plan 6.2-5). */
export function renderThemeList(result: BrandListResult, installCommand?: string | DependencyInstallGuide): ThemeOutput {
  if (result.status !== "ok") {
    return { lines: ["", ...tokensStatusGuide(result.status, result.version, installCommand), ""], exitCode: 1 };
  }
  if (result.brands.length === 0) {
    return {
      lines: ["", chalk.yellow(`설치된 ${TOKENS_PACKAGE} ${result.version ?? ""} 에 브랜드가 없습니다.`), ""],
      exitCode: 0,
    };
  }

  const width = Math.max(...result.brands.map((b) => b.name.length));
  const lines = [
    "",
    chalk.blue(`AXIS 브랜드 (${result.brands.length}개, ${TOKENS_PACKAGE} ${result.version ?? ""})`),
    "",
  ];
  for (const b of result.brands) {
    lines.push(
      `  ${chalk.cyan(b.name.padEnd(width))}  ${b.description}  ${chalk.gray(`(${b.themes.join(" · ")})`)}`
    );
  }
  lines.push("", chalk.gray("사용법: axis theme info <brand>"), "");
  return { lines, exitCode: 0 };
}

function a11yValue(value: unknown): string {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

function tokenTable(brand: BrandDetail): string[] {
  const rows = KEY_TOKENS.filter(
    (k) => k in brand.tokens.light || k in brand.tokens.dark
  ).map((k) => [k, brand.tokens.light[k] ?? "-", brand.tokens.dark[k] ?? "-"]);
  const missing = KEY_TOKENS.filter((k) => !(k in brand.tokens.light) && !(k in brand.tokens.dark));

  const lines: string[] = [];
  if (rows.length > 0) {
    const header = ["토큰", "라이트", "다크"];
    const w0 = Math.max(header[0].length, ...rows.map((r) => r[0].length));
    const w1 = Math.max(header[1].length, ...rows.map((r) => r[1].length));
    lines.push(chalk.gray(`  ${header[0].padEnd(w0)}  ${header[1].padEnd(w1)}  ${header[2]}`));
    for (const [k, l, d] of rows) {
      lines.push(`  ${k.padEnd(w0)}  ${l.padEnd(w1)}  ${d}`);
    }
  }
  if (missing.length > 0) {
    lines.push(chalk.gray(`  브랜드가 덮어쓰지 않음: ${missing.join(", ")}`));
  }
  return lines;
}

/** `axis theme info <brand>` 출력 (FR-3, 보정 내역은 U3 (A)) */
export function renderThemeInfo(
  result: BrandGetResult,
  name: string,
  installCommand?: string | DependencyInstallGuide
): ThemeOutput {
  if (result.status !== "ok") {
    return { lines: ["", ...tokensStatusGuide(result.status, result.version, installCommand), ""], exitCode: 1 };
  }
  const brand = result.brand;
  if (!brand) {
    return {
      lines: [
        "",
        chalk.red(`브랜드 '${name}' 가 설치된 ${TOKENS_PACKAGE} ${result.version ?? ""} 에 없습니다.`),
        `  설치된 브랜드: ${result.available.length > 0 ? result.available.join(", ") : "(없음)"}`,
        chalk.gray("  목록: axis theme list"),
        "",
      ],
      exitCode: 1,
    };
  }

  const lines = [
    "",
    chalk.blue(`브랜드 ${brand.name}`),
    `  설명: ${brand.description}`,
    `  테마: ${brand.themes.join(" · ")}`,
    "",
    chalk.bold("Import (globals.css, @charset · 다른 @import 다음)"),
    `  @import "${brand.importPath}";`,
    "",
    chalk.bold("브랜드 켜기 (ThemeProvider 는 @axis-ds/theme 1.3.0 이상)"),
    ...brand.providerExample.split("\n").map((l) => (l ? `  ${l}` : "")),
    chalk.gray(
      `  ThemeProvider 나 <html data-brand="${brand.name}"> 가 없으면 import 만으로는 화면이 바뀌지 않습니다.`
    ),
    "",
    chalk.bold("주요 토큰"),
    ...tokenTable(brand),
    "",
    chalk.bold("보정 내역"),
    `  a11y 상태: ${a11yValue(brand.adjustments.a11y.status)}`,
    `  점검일: ${a11yValue(brand.adjustments.a11y.checkedAt)}`,
    `  게이트: ${a11yValue(brand.adjustments.a11y.gate)}`,
    `  근거 문서: ${brand.adjustments.reference}`,
    chalk.gray("  보정 전 · 후 값은 이 버전에서 출력하지 않습니다."),
    "",
  ];
  return { lines, exitCode: 0 };
}

function rel(plan: ThemeAddPlan, file: string): string {
  return path.relative(plan.baseDir, file) || file;
}

/**
 * `axis theme add <brand>` 출력 (FR-2). `written` 은 `applyThemeAdd` 가 쓴 파일 목록입니다.
 * 오류가 있는 계획이면 rc 1 이고 아무것도 쓰지 않은 상태입니다.
 */
export function renderThemeAdd(plan: ThemeAddPlan, written: string[]): ThemeOutput {
  const error = plan.errors[0];
  if (error) {
    const lines = [""];
    switch (error.kind) {
      case "no-config":
        lines.push(
          chalk.red("axis.config.json 이 없습니다. 아무것도 바꾸지 않았습니다."),
          `  먼저 ${chalk.cyan("axis init")} 을 실행하세요.`
        );
        break;
      case "invalid-config":
        lines.push(chalk.red(`axis.config.json 을 읽을 수 없습니다(${error.message}). 아무것도 바꾸지 않았습니다.`));
        break;
      case "invalid-package-json":
        lines.push(chalk.red(`package.json 을 읽을 수 없습니다(${error.message}). 아무것도 바꾸지 않았습니다.`));
        break;
      case "invalid-name":
        lines.push(
          chalk.red(`브랜드 이름 '${error.brand}' 가 규칙(소문자 · 숫자 · 하이픈, 예: ontology)에 맞지 않습니다.`)
        );
        break;
      case "css-outside-project":
        lines.push(
          chalk.red(
            `CSS 파일 ${error.file} 의 실제 위치(${error.realPath})가 프로젝트 디렉터리 밖입니다. 아무것도 바꾸지 않았습니다.`
          ),
          `  axis.config.json 의 globalCss 를 프로젝트 안 파일로 고치거나, 그 파일에 직접 넣으세요: @import "${plan.importPath}";`
        );
        break;
      case "css-not-stylesheet":
        lines.push(
          chalk.red(`${error.file} 의 실제 대상(${error.realPath})이 CSS 파일(.css)이 아닙니다. 아무것도 바꾸지 않았습니다.`),
          `  axis.config.json 의 globalCss 를 전역 CSS 파일로 고치거나, 그 파일에 직접 넣으세요: @import "${plan.importPath}";`
        );
        break;
      case "unknown-brand":
        lines.push(
          chalk.red(`브랜드 '${error.brand}' 가 설치된 ${TOKENS_PACKAGE} ${error.version ?? ""} 에 없습니다.`),
          `  설치된 브랜드: ${error.available.length > 0 ? error.available.join(", ") : "(없음)"}`,
          chalk.gray("  목록: axis theme list")
        );
        break;
    }
    lines.push("");
    return { lines, exitCode: 1 };
  }

  const lines = ["", chalk.blue(`브랜드 ${plan.brand} 적용`), ""];
  if (plan.unverifiedBrand) {
    lines.push(
      chalk.yellow(
        `  ! ${TOKENS_PACKAGE} 를 읽을 수 없어(${plan.tokens.status}) 이름 규칙만 확인했습니다. 설치 후 axis theme list 로 '${plan.brand}' 가 있는지 확인하세요.`
      )
    );
  }

  // CSS
  const css = plan.css;
  if (css?.configuredMissing) {
    lines.push(
      chalk.yellow(
        css.file
          ? `  ! axis.config.json 의 globalCss(${css.configuredMissing})가 없어 ${rel(plan, css.file)} 에 추가합니다.`
          : `  ! axis.config.json 의 globalCss(${css.configuredMissing})가 없습니다.`
      )
    );
  }
  const brandLine = `@import "${plan.importPath}";`;
  if (css?.action === "add" && css.file) {
    const after = plan.writes.find((w) => w.file === css.file)?.after ?? "";
    for (const spec of css.baseImports) {
      lines.push(...baseImportLines(after, spec, plan.importPath, rel(plan, css.file)));
    }
    if (css.brandAdded) lines.push(`  ${chalk.green("✓")} ${rel(plan, css.file)}: ${brandLine} 추가`);
    else lines.push(`  ${chalk.gray("-")} ${rel(plan, css.file)}: 브랜드 import 가 이미 있어 건너뜀`);
  } else if (css?.action === "exists" && css.file) {
    lines.push(`  ${chalk.gray("-")} ${rel(plan, css.file)}: import 가 이미 있어 건너뜀`);
  } else {
    lines.push(
      chalk.yellow(
        "  ! CSS 진입점(globalCss · app/globals.css · src/app/globals.css · styles/globals.css · src/styles/globals.css · globals.css)을 찾지 못했습니다."
      ),
      `    전역 CSS 맨 앞(@charset · 다른 @import 다음)에 이 순서로 직접 넣으세요: ${[
        ...(css?.requiredBaseImports ?? []).map((spec) => `@import "${spec}";`),
        brandLine,
      ].join(" ")}`
    );
  }
  if (css && css.lateImports.length > 0) {
    lines.push(
      chalk.yellow(
        `  ! 규칙(@tailwind 등) 뒤에 있는 @import ${css.lateImports.length}줄은 CSS 규칙상 무시될 수 있습니다(Next.js 는 앞으로 끌어올려 적용). 맨 앞으로 옮기세요: ${css.lateImports.join(" ")}`
      )
    );
  }
  // WI-0087 DEC-2: 루트에만 선언된 컴포넌트 패키지의 tailwind.css 는 설치본에 파일이 있을 때만 넣고, 넣지 않았으면 이유를 한 줄씩 알립니다
  for (const d of css?.deferredComponentImports ?? []) {
    const line = `@import "${d.name}/tailwind.css";`;
    // 1.4.0 이상인데 파일이 없으면 올릴 버전 문제가 아니라 설치가 손상된 것이라 다시 설치를 안내합니다
    const current =
      d.installedVersion !== undefined &&
      d.installedVersion !== "?" &&
      (compareExactVersions(d.installedVersion, COMPONENT_TAILWIND_CSS_MIN_VERSION) ?? -1) >= 0;
    lines.push(
      chalk.yellow(
        d.installedVersion === undefined
          ? `  ! ${d.name} 가 워크스페이스 루트에 선언됐지만 설치되지 않아 ${line} 를 넣지 않았습니다. 설치(${plan.installCommand}) 뒤 theme add 를 다시 실행하거나 직접 넣으세요.`
          : current
            ? `  ! 워크스페이스 루트에 선언된 ${d.name} 의 설치본(${d.installedVersion})에 tailwind.css 가 없어 ${line} 를 넣지 않았습니다. 설치가 손상됐을 수 있으니 다시 설치(${plan.installCommand}) 뒤 theme add 를 다시 실행하거나 직접 넣으세요.`
            : `  ! 워크스페이스 루트에 선언된 ${d.name} 의 설치본(${d.installedVersion === "?" ? "버전 모름" : d.installedVersion})에 tailwind.css 가 없어(${COMPONENT_TAILWIND_CSS_MIN_VERSION} 부터 제공) ${line} 를 넣지 않았습니다. ${COMPONENT_TAILWIND_CSS_MIN_VERSION} 이상으로 올린 뒤 theme add 를 다시 실행하거나 직접 넣으세요.`
      )
    );
  }
  if (css && css.otherBrands.length > 0) {
    lines.push(
      chalk.yellow(
        `  ! 다른 브랜드 import(${css.otherBrands.join(", ")})는 그대로 두었습니다. 쓰지 않으면 이전 브랜드 import 를 지워도 됩니다.`
      )
    );
  }

  // package.json
  const dep = plan.dependency;
  // WI-0093 B1: Yarn Plug'n'Play 앱 선언이면 theme list · MCP 와 같은 PnP 한 줄로 통일해요(미설치 · 미지원 · 빌드 전 모두, 설치 줄 없음)
  const tokensGuide = plan.tokensGuide;
  const pnpTokens = tokensGuide.kind === "pnp" && plan.tokens.status !== "ok";
  if (dep?.action === "add") {
    lines.push(
      `  ${chalk.green("✓")} package.json: dependencies 에 "${TOKENS_PACKAGE}": "${TOKENS_DEPENDENCY_RANGE}" 추가`,
      `    설치는 실행하지 않았습니다. 설치: ${chalk.cyan(plan.installCommand)}`
    );
  } else if (dep?.action === "present" && dep.declaredSource === "root") {
    // WI-0087 DEC-1: 루트 선언이면 앱 package.json 에 쓰지 않았고, 설치본이 없을 때만 설치 명령을 붙입니다(앱 선언 출력은 종전 그대로)
    lines.push(
      `  ${chalk.gray("-")} package.json: ${TOKENS_PACKAGE} ${dep.declaredRange} 가 워크스페이스 루트에 선언돼 있어 앱 package.json 은 바꾸지 않음`
    );
    // 루트 선언 미설치 줄은 종전 그대로 앱 디렉터리 명령이에요(npm 루트 위치 문구는 WI-0096)
    if (plan.tokens.status === "not-installed") lines.push(`    설치: ${chalk.cyan(plan.installCommand)}`);
    // WI-0093 Q17 · B2: 루트 선언인데 설치본이 빌드 전이면 재설치 안내(theme list 의 빌드 전 안내와 같은 줄, npm 루트 선언이면 「워크스페이스 루트에서 npm install」)
    else if (plan.tokens.status === "not-built") lines.push(`    ${rebuildGuide(tokensGuide)}`);
  } else if (dep?.action === "present") {
    lines.push(`  ${chalk.gray("-")} package.json: ${TOKENS_PACKAGE} ${dep.declaredRange} 가 이미 있어 범위를 바꾸지 않음`);
    if (pnpTokens) lines.push(`    ${chalk.yellow(tokensPnpMessage(tokensGuide.range))}`);
    // WI-0093 Q17(WI-0087 DEC-1 재오픈): 앱 선언인데 설치본이 없으면 선언대로 설치하는 명령(add 를 내면 범위가 다시 쓰여요)
    else if (plan.tokens.status === "not-installed") lines.push(`    설치: ${chalk.cyan(plan.installCommand)}`);
    // WI-0093 B3: 앱 선언인데 설치본이 빌드 전이면 루트 선언과 대칭으로 재설치 안내
    else if (plan.tokens.status === "not-built") lines.push(`    ${rebuildGuide(tokensGuide)}`);
  } else if (dep?.action === "no-package-json") {
    lines.push(chalk.yellow(`  ! package.json 이 없어 의존성을 추가하지 않았습니다. 설치: ${dep.tokensAddCommand}`));
  }
  // WI-0093 B1: PnP 앱 선언이면 미지원도 위의 PnP 한 줄로 갈음해요(theme list 와 같음)
  if (dep?.upgrade && !pnpTokens) {
    lines.push(
      chalk.yellow(
        `  ! 설치된 ${TOKENS_PACKAGE} ${plan.tokens.version} 은 브랜드를 지원하지 않습니다(${MIN_BRAND_TOKENS_VERSION} 이상 필요).`
      )
    );
    // WI-0087 DEC-8(사용자 재결정): 선언이 루트에 있으면 앱 기준 업그레이드 명령은 내지 않습니다. 앱 디렉터리에서 실행하면
    // 앱 package.json 에 새 선언이 생겨 「앱 package.json 은 바꾸지 않음」과 어긋나기 때문입니다
    if (dep.action === "present" && dep.declaredSource === "root") {
      lines.push(`    워크스페이스 루트 package.json 의 ${TOKENS_PACKAGE} 선언을 ^${MIN_BRAND_TOKENS_VERSION} 이상으로 올리고 설치하세요.`);
    } else {
      lines.push(`    업그레이드: ${chalk.cyan(dep.tokensAddCommand)}`);
    }
  }

  // axis.config.json
  if (plan.configChanged) {
    lines.push(`  ${chalk.green("✓")} axis.config.json: "brand": "${plan.brand}" 기록`);
  } else {
    lines.push(`  ${chalk.gray("-")} axis.config.json: brand 가 이미 "${plan.brand}"`);
  }

  // Tailwind 3 설정 안내(WI-0065 D7: 파일은 고치지 않음, axis check 가 판정)
  const tw = plan.tailwindConfig;
  if (tw && (tw.presetMissing || tw.contentMissing.length > 0)) {
    lines.push("", chalk.bold(`Tailwind 설정 (${tw.configFile ?? "tailwind.config"}, 파일은 고치지 않았습니다)`));
    if (tw.presetMissing) {
      lines.push(
        // WI-0072: CommonJS 는 모든 tokens 버전에서 동작하는 `.default` 형태로 안내합니다(1.6.2 이하의 bare require 는 preset 이 빠짐)
        chalk.yellow(`  ! AXIS preset 이 없습니다. presets 에 넣으세요: presets: [${TOKENS_TAILWIND3_CJS_REQUIRE}]`) +
          chalk.gray(` (ESM · TypeScript 이면 import axisPreset from "${TOKENS_TAILWIND3_PRESET}" 뒤 presets: [axisPreset])`)
      );
    }
    for (const t of tw.contentMissing) {
      const not = tw.contentUnknown ? "않는 것으로 보입니다(정적 판독)" : "않습니다";
      // WI-0098: Plug'n'Play 의 기본 PnP · 루트 전용 대상은 ./node_modules 제안 대신 check 와 같은 판정의 안내를 냅니다(unplugged 는 제안 glob 유지)
      if (t.pnp?.state === "noNodeModules") lines.push(chalk.yellow(`  ! content 가 ${t.label} 를 Plug'n'Play 에서 스캔되는 경로로 덮지 ${not}`));
      else if (t.pnp?.state === "rootOnly") lines.push(chalk.yellow(`  ! ${t.label} 가 ${PNP_ROOT_ONLY_NOTE} → ${CONTENT_PNP_ROOT_ONLY_ACTION}`));
      else lines.push(chalk.yellow(`  ! content 가 ${t.label} 를 덮지 ${not}. 넣으세요: "${t.suggest}"`));
    }
    // WI-0080 D4: 제안이 상위 경로(호이스팅 설치본)이면 check 와 같은 cwd 기준 안내를 한 줄 더합니다
    if (tw.contentMissing.some((t) => t.suggest.startsWith("../"))) lines.push(chalk.gray(`    ${CONTENT_PARENT_PATH_NOTE}`));
    // WI-0098: 루트 전용이 아닌 PnP 대상이 있으면 check 와 같은 동적 형태 · unplugged 안내를 한 줄 더합니다
    // 사용자 결정 Q45: unplugged 디렉터리가 이미 있는 패키지는 dependenciesMeta 설정 안내에서 뺍니다(check 와 같은 함수)
    const pnpNote = contentPnpNoteFor(tw.contentMissing);
    if (pnpNote !== undefined) lines.push(chalk.gray(`    ${pnpNote}`));
  }

  // 브랜드 켜기 안내(FR-2, Q1 · U10: 코드는 고치지 않음). WI-0065 D7: defaultBrand 대신 data-brand · setBrand 를 안내합니다
  const act = plan.activation;
  lines.push("", chalk.bold(`브랜드 켜기 (ThemeProvider 는 ${THEME_PACKAGE} ${THEME_MIN_VERSION} 이상)`));
  if (act?.found) {
    lines.push(`  ${chalk.gray("-")} ${act.found} 에 브랜드를 켜는 코드(data-brand · setBrand 등)가 있습니다. "${plan.brand}" 로 켜는지 확인하세요.`);
    if (act.markupWithProvider) {
      // WI-0068: 마크업 data-brand + ThemeProvider 는 theme 1.6.2 이하에서 마운트 때 지워집니다(axis check 가 설치본으로 판정)
      lines.push(
        chalk.yellow(
          `  ! <html data-brand> 와 ThemeProvider 를 함께 쓰면 ${THEME_PACKAGE} ${THEME_MARKUP_BRAND_MIN_VERSION} 이상이어야 마운트 때 지워지지 않습니다. 설치본 확인: axis check`
        )
      );
    }
  } else {
    lines.push(
      ...providerExample(plan.brand).split("\n").map((l) => (l ? `  ${l}` : "")),
      chalk.yellow(
        `  ! ${act && act.layoutFiles.length > 0 ? act.layoutFiles.join(" · ") : "루트 레이아웃"} 에서 브랜드를 켜는 코드(data-brand · setBrand 등)를 찾지 못했습니다. 둘 다 없으면 import 만으로는 화면이 바뀌지 않습니다.`
      )
    );
  }
  if (dep?.themeMissing) {
    lines.push(`  ThemeProvider 를 쓰면 ${THEME_PACKAGE} 설치: ${chalk.cyan(dep.themeAddCommand)}`);
  }

  lines.push("", chalk.gray(written.length > 0 ? `파일 ${written.length}개를 바꿨습니다.` : "바꾼 파일이 없습니다."), "");
  return { lines, exitCode: 0 };
}

/**
 * `applyThemeAdd` 가 던진 오류의 출력. 쓰기 전 확인에서 멈췄으면 바뀐 파일이 없고,
 * 쓰는 도중 실패했으면 되돌린 파일과 되돌리지 못한 파일을 함께 알립니다. rc 1.
 */
export function renderThemeAddFailure(plan: ThemeAddPlan, err: unknown): ThemeOutput {
  const lines = [""];
  if (err instanceof ThemeApplyError) {
    lines.push(chalk.red(err.message));
    if (err.restored.length > 0) {
      lines.push(`  먼저 쓴 파일은 원래 내용으로 되돌렸습니다: ${err.restored.map((f) => rel(plan, f)).join(", ")}`);
    }
    if (err.restoreFailed.length > 0) {
      lines.push(
        chalk.red(`  되돌리지 못해 바뀐 채 남은 파일: ${err.restoreFailed.map((f) => rel(plan, f)).join(", ")}`)
      );
    }
    if (err.restored.length === 0 && err.restoreFailed.length === 0) {
      lines.push("  바뀐 파일이 없습니다.");
    }
  } else {
    // 쓰기 전 확인(계획 뒤 변경 · 내용 검증 · 쓰기 권한)에서 멈춘 경우라 쓴 파일이 없습니다.
    lines.push(chalk.red(err instanceof Error ? err.message : String(err)), "  바뀐 파일이 없습니다.");
  }
  lines.push("");
  return { lines, exitCode: 1 };
}

function print(output: ThemeOutput): void {
  for (const line of output.lines) console.log(line);
  if (output.exitCode !== 0) process.exitCode = output.exitCode;
}

/**
 * `axis theme` 하위 명령어를 등록합니다.
 */
export function registerThemeCommand(program: Command): void {
  const themeCmd = program.command("theme").description("브랜드 테마 (@axis-ds/tokens 브랜드)");

  themeCmd
    .command("list")
    .alias("ls")
    .description("설치된 @axis-ds/tokens 의 브랜드 목록")
    .option("-d, --dir <path>", "대상 디렉토리")
    .action((options: { dir?: string }) => {
      const baseDir = path.resolve(options.dir || ".");
      print(renderThemeList(listBrands(baseDir), tokensInstallGuide(baseDir)));
    });

  themeCmd
    .command("info <brand>")
    .description("브랜드 상세: import 경로 · Provider 예시 · 주요 토큰 · 보정 내역")
    .option("-d, --dir <path>", "대상 디렉토리")
    .action((name: string, options: { dir?: string }) => {
      const baseDir = path.resolve(options.dir || ".");
      print(renderThemeInfo(getBrand(baseDir, name), name, tokensInstallGuide(baseDir)));
    });

  themeCmd
    .command("add <brand>")
    .description("브랜드 적용: CSS import · package.json 의존성 · axis.config.json brand (설치는 안내만)")
    .option("-d, --dir <path>", "대상 디렉토리")
    .action((name: string, options: { dir?: string }) => {
      const baseDir = path.resolve(options.dir || ".");
      const plan = planThemeAdd(baseDir, name);
      let written: string[] = [];
      if (plan.errors.length === 0) {
        try {
          written = applyThemeAdd(plan);
        } catch (err) {
          print(renderThemeAddFailure(plan, err));
          return;
        }
      }
      print(renderThemeAdd(plan, written));
    });
}
