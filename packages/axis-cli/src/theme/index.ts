/** axis theme 명령어 (WI-0028 FR-1 · FR-3) */

import type { Command } from "commander";
import chalk from "chalk";
import path from "path";
import {
  KEY_TOKENS,
  MIN_BRAND_TOKENS_VERSION,
  TOKENS_PACKAGE,
  getBrand,
  listBrands,
  type BrandDetail,
  type BrandGetResult,
  type BrandListResult,
  type TokensStatus,
} from "./brand-core.js";

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
}
