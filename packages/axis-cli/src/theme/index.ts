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
  THEME_PACKAGE,
  TOKENS_DEPENDENCY_RANGE,
  ThemeApplyError,
  applyThemeAdd,
  planThemeAdd,
  type ThemeAddPlan,
} from "./theme-add.js";

/** 명령 출력: 줄 목록과 종료 코드 */
export interface ThemeOutput {
  lines: string[];
  exitCode: number;
}

/** tokens 를 설치 · 업그레이드할 때 안내하는 명령 (U6 범위) */
export const TOKENS_INSTALL_COMMAND = `pnpm add ${TOKENS_PACKAGE}@^${MIN_BRAND_TOKENS_VERSION}`;

/**
 * `status` 가 `ok` 가 아닐 때의 안내. 빈 목록이 아니라 「측정을 못 했다」를 알립니다(plan 3장 5-3).
 */
export function tokensStatusGuide(status: Exclude<TokensStatus, "ok">, version?: string): string[] {
  switch (status) {
    case "not-installed":
      return [
        chalk.yellow(`${TOKENS_PACKAGE} 가 설치돼 있지 않아 브랜드를 읽을 수 없습니다.`),
        `  설치: ${chalk.cyan(TOKENS_INSTALL_COMMAND)}`,
      ];
    case "unsupported":
      return [
        chalk.yellow(
          `${TOKENS_PACKAGE} ${version ?? "(버전 모름)"} 은 브랜드를 지원하지 않습니다(${MIN_BRAND_TOKENS_VERSION} 이상 필요).`
        ),
        `  업그레이드: ${chalk.cyan(TOKENS_INSTALL_COMMAND)}`,
      ];
    case "not-built":
      return [
        chalk.yellow(
          `${TOKENS_PACKAGE}${version ? ` ${version}` : ""} 는 있지만 빌드 산출물이 없어 브랜드를 읽을 수 없습니다.`
        ),
        `  워크스페이스면 ${chalk.cyan(`pnpm --filter ${TOKENS_PACKAGE} build`)}, 아니면 재설치: ${chalk.cyan(TOKENS_INSTALL_COMMAND)}`,
      ];
  }
}

/** `axis theme list` 출력 (FR-1). a11y 상태는 길 수 있어 info 에서만 냅니다(plan 6.2-5). */
export function renderThemeList(result: BrandListResult): ThemeOutput {
  if (result.status !== "ok") {
    return { lines: ["", ...tokensStatusGuide(result.status, result.version), ""], exitCode: 1 };
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
export function renderThemeInfo(result: BrandGetResult, name: string): ThemeOutput {
  if (result.status !== "ok") {
    return { lines: ["", ...tokensStatusGuide(result.status, result.version), ""], exitCode: 1 };
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
    chalk.bold("Provider (@axis-ds/theme 1.3.0 이상)"),
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
  if (css?.action === "add" && css.file) {
    lines.push(`  ${chalk.green("✓")} ${rel(plan, css.file)}: @import "${plan.importPath}"; 추가`);
  } else if (css?.action === "exists" && css.file) {
    lines.push(`  ${chalk.gray("-")} ${rel(plan, css.file)}: import 가 이미 있어 건너뜀`);
  } else {
    lines.push(
      chalk.yellow("  ! CSS 진입점(globalCss · app/globals.css · src/app/globals.css · globals.css)을 찾지 못했습니다."),
      `    전역 CSS 맨 앞(@charset · 다른 @import 다음)에 직접 넣으세요: @import "${plan.importPath}";`
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
  if (dep?.action === "add") {
    lines.push(
      `  ${chalk.green("✓")} package.json: dependencies 에 "${TOKENS_PACKAGE}": "${TOKENS_DEPENDENCY_RANGE}" 추가`,
      `    설치는 실행하지 않았습니다. 설치: ${chalk.cyan(plan.installCommand)}`
    );
  } else if (dep?.action === "present") {
    lines.push(`  ${chalk.gray("-")} package.json: ${TOKENS_PACKAGE} ${dep.declaredRange} 가 이미 있어 범위를 바꾸지 않음`);
  } else if (dep?.action === "no-package-json") {
    lines.push(
      chalk.yellow(`  ! package.json 이 없어 의존성을 추가하지 않았습니다. 설치: ${TOKENS_INSTALL_COMMAND}`)
    );
  }
  if (dep?.upgrade) {
    lines.push(
      chalk.yellow(
        `  ! 설치된 ${TOKENS_PACKAGE} ${plan.tokens.version} 은 브랜드를 지원하지 않습니다(${MIN_BRAND_TOKENS_VERSION} 이상 필요).`
      ),
      `    업그레이드: ${chalk.cyan(TOKENS_INSTALL_COMMAND)}`
    );
  }

  // axis.config.json
  if (plan.configChanged) {
    lines.push(`  ${chalk.green("✓")} axis.config.json: "brand": "${plan.brand}" 기록`);
  } else {
    lines.push(`  ${chalk.gray("-")} axis.config.json: brand 가 이미 "${plan.brand}"`);
  }

  // Provider 안내(FR-2, Q1 · U10: 코드는 고치지 않음)
  lines.push(
    "",
    chalk.bold(`Provider (${THEME_PACKAGE} 1.3.0 이상)`),
    ...providerExample(plan.brand).split("\n").map((l) => (l ? `  ${l}` : "")),
    chalk.gray(
      `  ThemeProvider 나 <html data-brand="${plan.brand}"> 가 없으면 import 만으로는 화면이 바뀌지 않습니다.`
    )
  );
  if (dep?.themeMissing) {
    lines.push(`  ${THEME_PACKAGE} 설치: ${chalk.cyan(`pnpm add ${THEME_PACKAGE}@^1.3.0`)}`);
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
      print(renderThemeList(listBrands(baseDir)));
    });

  themeCmd
    .command("info <brand>")
    .description("브랜드 상세: import 경로 · Provider 예시 · 주요 토큰 · 보정 내역")
    .option("-d, --dir <path>", "대상 디렉토리")
    .action((name: string, options: { dir?: string }) => {
      const baseDir = path.resolve(options.dir || ".");
      print(renderThemeInfo(getBrand(baseDir, name), name));
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
