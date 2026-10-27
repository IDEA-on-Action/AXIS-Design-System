/**
 * AXIS Design System MCP - 브랜드 도구 (WI-0028 FR-4, plan 4.3)
 *
 * `axis.list_brands` · `axis.get_brand` 는 정적 번들을 만들지 않고, 대상 프로젝트에 설치된
 * `@axis-ds/tokens` 의 브랜드 산출물을 CLI 와 같은 공유 코어(`brand-core.ts`, CLI 원본의 바이트 사본)로 읽습니다.
 * 핸들러는 코어 결과를 그대로 돌려주므로 CLI(`axis theme list` · `axis theme info`)와 같은 값을 냅니다(AC3).
 * 패키지 안 파일을 `__dirname` 기준으로 읽지 않습니다(번들 경로 규칙, plan 4.3).
 */

import path from "node:path";
import {
  addCommandFor,
  dependencyInstallGuide,
  detectInstallCommand,
  workspaceRunCommand,
  type DependencyInstallGuide,
} from "@axis-ds/registry-core/project";
import {
  KEY_TOKENS,
  MIN_BRAND_TOKENS_VERSION,
  TOKENS_DEPENDENCY_MIN_VERSION,
  TOKENS_PACKAGE,
  getBrand,
  listBrands,
  type BrandDetail,
  type BrandGetResult,
  type BrandListResult,
  type TokensStatus,
} from "./brand-core.js";

export interface ListBrandsParams {
  /** 대상 프로젝트 디렉토리 (기본: 현재 디렉토리) */
  targetDir?: string;
}

export interface GetBrandParams {
  /** 브랜드 이름 (예: ontology) */
  name: string;
  /** 대상 프로젝트 디렉토리 (기본: 현재 디렉토리) */
  targetDir?: string;
}

export type ListBrandsResult = BrandListResult;
export type GetBrandResult = BrandGetResult;

/**
 * lockfile · `packageManager` 가 없을 때 tokens 를 설치 · 업그레이드하는 안내 명령. CLI `TOKENS_INSTALL_COMMAND` 와 같습니다.
 * 범위는 U6(WI-0028 의 tokens 범위 결정, WI-0065 D7-범위에서 CLI 기록 범위 `^1.6.0` 으로 맞춤)이고, `^` 가 셸에서 사라지지 않게 따옴표로 감쌉니다.
 * U6 은 버전 범위 결정이지 pnpm 고정 결정이 아니에요. pnpm 한 가지 안내는 WI-0065 가 범위 밖으로 미룬 것이었고, WI-0085 부터는
 * `tokensInstallCommandFor(targetDir)` 로 CLI 처럼 대상 프로젝트의 매니저를 고릅니다.
 */
export const TOKENS_INSTALL_COMMAND = addCommandFor("pnpm install", { [TOKENS_PACKAGE]: `^${TOKENS_DEPENDENCY_MIN_VERSION}` });

function baseDirOf(targetDir?: string): string {
  return path.resolve(targetDir || process.cwd());
}

/**
 * 대상 프로젝트(`targetDir`, 기본 현재 디렉터리)의 lockfile · `packageManager` 로 고른 tokens 설치 명령(WI-0085, CLI `tokensInstallCommand` 와 같은 값).
 * 둘 다 없으면 `TOKENS_INSTALL_COMMAND` 와 같습니다.
 */
export function tokensInstallCommandFor(targetDir?: string): string {
  return addCommandFor(detectInstallCommand(baseDirOf(targetDir)), {
    [TOKENS_PACKAGE]: `^${TOKENS_DEPENDENCY_MIN_VERSION}`,
  });
}

/**
 * 대상 프로젝트의 tokens 선언 출처로 고른 설치 안내 방법(WI-0093, CLI `tokensInstallGuide` 와 같은 registry-core 헬퍼).
 * 경계는 theme add 와 같아요(P1 Plug'n'Play · P2 앱 lockfile 이면 루트 선언 불인정).
 */
export function tokensInstallGuideFor(targetDir?: string): DependencyInstallGuide {
  return dependencyInstallGuide(baseDirOf(targetDir), TOKENS_PACKAGE, `^${TOKENS_DEPENDENCY_MIN_VERSION}`);
}

/**
 * 설치된 브랜드 목록(FR-4, CLI FR-1 과 같은 목록). 코어 `listBrands` 결과를 그대로 돌려줍니다.
 */
export async function handleListBrands(params: ListBrandsParams): Promise<ListBrandsResult> {
  return listBrands(baseDirOf(params.targetDir));
}

/**
 * 브랜드 하나의 상세(FR-4): import 경로 · Provider 예시 · 주요 토큰. 코어 `getBrand` 결과를 그대로 돌려줍니다.
 */
export async function handleGetBrand(params: GetBrandParams): Promise<GetBrandResult> {
  const { name } = params;
  if (!name || name.trim() === "") {
    throw new Error("브랜드 이름(name)은 필수입니다.");
  }
  return getBrand(baseDirOf(params.targetDir), name);
}

/**
 * `status` 가 `ok` 가 아닐 때의 안내(PRD FR-4 · Q5). 빈 목록이 아니라 「측정을 못 했다」를 알리며,
 * 도구 응답은 `isError` 없이 이 글을 돌려줍니다. 문장은 CLI `tokensStatusGuide` 와 같습니다.
 * `installCommand` 는 `tokensInstallGuideFor(targetDir)` 로 고른 안내 방법이에요(WI-0093). 문자열을 주면 종전처럼 그 명령을 그대로
 * 안내하고(WI-0085 `tokensInstallCommandFor`), 주지 않으면 종전 pnpm 입니다. 갈래별 문장은 CLI `tokensStatusGuide` 주석과 같아요.
 * 빌드 전의 워크스페이스 빌드 명령도 같은 매니저로 고릅니다(`workspaceRunCommand`).
 */
export function formatTokensStatusGuide(
  status: Exclude<TokensStatus, "ok">,
  version?: string,
  installCommand: string | DependencyInstallGuide = TOKENS_INSTALL_COMMAND
): string {
  const g: DependencyInstallGuide =
    typeof installCommand === "string"
      ? { kind: "add", installCommand, addCommand: installCommand }
      : installCommand;
  if (g.kind === "pnp") {
    return `${TOKENS_PACKAGE}${g.range ? ` ${g.range}` : ""} 가 package.json 에 선언돼 있지만 Plug'n'Play 설치라 설치본을 판정하지 못해 브랜드를 읽을 수 없습니다.`;
  }
  const install =
    g.kind === "install-at-root"
      ? `워크스페이스 루트에서 \`${g.installCommand}\``
      : `\`${g.kind === "install" ? g.installCommand : g.addCommand}\``;
  switch (status) {
    case "not-installed":
      return [`${TOKENS_PACKAGE} 가 설치돼 있지 않아 브랜드를 읽을 수 없습니다.`, "", `- 설치: ${install}`].join("\n");
    case "unsupported":
      return [
        `${TOKENS_PACKAGE} ${version ?? "(버전 모름)"} 은 브랜드를 지원하지 않습니다(${MIN_BRAND_TOKENS_VERSION} 이상 필요).`,
        "",
        g.source === "root"
          ? `- 워크스페이스 루트 package.json 의 ${TOKENS_PACKAGE} 선언을 ^${MIN_BRAND_TOKENS_VERSION} 이상으로 올리고 설치하세요.`
          : `- 업그레이드: \`${g.addCommand}\``,
      ].join("\n");
    case "not-built":
      return [
        `${TOKENS_PACKAGE}${version ? ` ${version}` : ""} 는 있지만 빌드 산출물이 없어 브랜드를 읽을 수 없습니다.`,
        "",
        `- 워크스페이스면 \`${workspaceRunCommand(g.installCommand, TOKENS_PACKAGE, "build")}\`, 아니면 재설치: ${install}`,
      ].join("\n");
  }
}

/**
 * `axis.list_brands` 응답 글 (CLI `axis theme list` 와 같은 항목: 이름 · 설명 · 테마, 그리고 import 경로).
 * `installCommand` 는 미설치 · 미지원 · 빌드 전 안내에 쓰는 명령(`tokensInstallCommandFor(targetDir)`, 주지 않으면 종전 pnpm)
 */
export function formatListBrandsResult(result: ListBrandsResult, installCommand?: string | DependencyInstallGuide): string {
  const lines = ["## AXIS 브랜드\n"];
  if (result.status !== "ok") {
    lines.push(formatTokensStatusGuide(result.status, result.version, installCommand));
    return lines.join("\n");
  }
  if (result.brands.length === 0) {
    lines.push(`설치된 ${TOKENS_PACKAGE} ${result.version ?? ""} 에 브랜드가 없습니다.`);
    return lines.join("\n");
  }

  lines.push(`${TOKENS_PACKAGE} ${result.version ?? ""} 에 브랜드 ${result.brands.length}개가 있습니다.`, "");
  for (const b of result.brands) {
    lines.push(`- **${b.name}**: ${b.description} (${b.themes.join(" · ")})`);
    lines.push(`  - import: \`${b.importPath}\``);
  }
  lines.push("", "상세: `axis.get_brand` (name)");
  return lines.join("\n");
}

function a11yValue(value: unknown): string {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

function tokenTable(brand: BrandDetail): string[] {
  const rows = KEY_TOKENS.filter((k) => k in brand.tokens.light || k in brand.tokens.dark);
  const missing = KEY_TOKENS.filter((k) => !(k in brand.tokens.light) && !(k in brand.tokens.dark));
  const lines: string[] = [];
  if (rows.length > 0) {
    lines.push("| 토큰 | 라이트 | 다크 |", "|---|---|---|");
    for (const k of rows) {
      lines.push(`| \`${k}\` | ${brand.tokens.light[k] ?? "-"} | ${brand.tokens.dark[k] ?? "-"} |`);
    }
  }
  if (missing.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push(`브랜드가 덮어쓰지 않음: ${missing.join(", ")}`);
  }
  return lines;
}

/** `axis.get_brand` 응답 글 (CLI `axis theme info` 와 같은 항목, 보정 내역은 U3 (A)). `installCommand` 는 `formatListBrandsResult` 와 같음 */
export function formatGetBrandResult(
  result: GetBrandResult,
  name: string,
  installCommand?: string | DependencyInstallGuide
): string {
  if (result.status !== "ok") {
    return [`## 브랜드: ${name}\n`, formatTokensStatusGuide(result.status, result.version, installCommand)].join("\n");
  }
  const brand = result.brand;
  if (!brand) {
    return [
      `## 브랜드: ${name}\n`,
      `브랜드 '${name}' 가 설치된 ${TOKENS_PACKAGE} ${result.version ?? ""} 에 없습니다.`,
      "",
      `- 설치된 브랜드: ${result.available.length > 0 ? result.available.join(", ") : "(없음)"}`,
      "- 목록: `axis.list_brands`",
    ].join("\n");
  }

  return [
    `## 브랜드: ${brand.name}\n`,
    `- 설명: ${brand.description}`,
    `- 테마: ${brand.themes.join(" · ")}`,
    "",
    "### Import (globals.css, @charset · 다른 @import 다음)",
    "",
    "```css",
    `@import "${brand.importPath}";`,
    "```",
    "",
    "### Provider (@axis-ds/theme 1.3.0 이상)",
    "",
    "```tsx",
    brand.providerExample,
    "```",
    "",
    `ThemeProvider 나 <html data-brand="${brand.name}"> 가 없으면 import 만으로는 화면이 바뀌지 않습니다.`,
    "",
    "### 주요 토큰",
    "",
    ...tokenTable(brand),
    "",
    "### 보정 내역",
    "",
    `- a11y 상태: ${a11yValue(brand.adjustments.a11y.status)}`,
    `- 점검일: ${a11yValue(brand.adjustments.a11y.checkedAt)}`,
    `- 게이트: ${a11yValue(brand.adjustments.a11y.gate)}`,
    `- 근거 문서: ${brand.adjustments.reference}`,
    "",
    "보정 전 · 후 값은 이 버전에서 출력하지 않습니다.",
  ].join("\n");
}
