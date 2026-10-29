/** axis check 검증 로직 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import {
  THEME_MARKUP_BRAND_MIN_VERSION,
  inspectBrandActivation,
  inspectBrandImport,
  type BrandActivationCheck,
  type BrandImportCheck,
} from "../theme/brand-core.js";
import { checkDependencies } from "@axis-ds/registry-core/dependencies-core";
import { PNP_ROOT_ONLY_NOTE, cssImportViaNote, globalCssSelectionNote } from "@axis-ds/registry-core/project";
import { checkAnimationPlugin, checkGlobalsCss, checkTailwindContent, checkTailwindSetup, versionGateLabel } from "./tailwind-core.js";
import type { CheckResult, CheckSeverity } from "./types.js";

const SEVERITY_ICON: Record<CheckSeverity, string> = {
  pass: chalk.green("PASS"),
  warn: chalk.yellow("WARN"),
  fail: chalk.red("FAIL"),
};

/**
 * 프로젝트 상태 검증 결과만 모읍니다(출력하지 않음, WI-0028 FR-5).
 * 기존 5항목의 순서는 그대로이고, `axis.config.json` 에 `brand` 가 있을 때만 brand 항목을 더합니다.
 * WI-0065 D8 에서 해당할 때만 더하는 항목 3개를 그 뒤에 둡니다(순서: brand · brand.activation · tailwind.content · animation).
 * - brand.activation: brand 가 있을 때. 루트 레이아웃에 브랜드를 켜는 코드(data-brand · setBrand 등)가 없으면 WARN(ThemeProvider 단독은 켜지 않음)(휴리스틱)
 * - tailwind.content: Tailwind 3 설정 파일이 있고 componentsDir · 선언된 컴포넌트 패키지가 있을 때. 덮지 않으면 FAIL(정적 판독)
 * - animation: ui-react 를 쓸 때. 애니메이션 플러그인이 없으면 WARN
 * MCP `axis.check_project` 도 같은 순서 · 문구입니다.
 */
export async function collectCheckResults(dir?: string): Promise<CheckResult[]> {
  const baseDir = path.resolve(dir || ".");
  const results: CheckResult[] = [];

  // 1. axis.config.json 존재 여부
  results.push(await checkFileExists(baseDir, "axis.config.json", "axis.config.json"));

  // 2. Tailwind 구성: 3 이하는 tailwind.config 파일, 4 이상은 CSS 의 @import "tailwindcss"(WI-0042)
  results.push(checkTailwindSetup(baseDir));

  // 3. globals.css 존재 여부 + AXIS 토큰 포함 여부(변수 직접 정의 또는 tokens CSS import, 공유 코어 · WI-0044 보정)
  results.push(checkGlobalsCss(baseDir));

  // 4. utils.ts (cn 함수) 존재 여부
  results.push(await checkUtils(baseDir));

  // 5. package.json 의존성: 선언 + 설치본(상위 디렉터리 탐색, 공유 코어 · WI-0051)
  results.push(checkDependencies(baseDir));

  // 6. brand 와 CSS import 대조 (brand 가 없으면 추가하지 않음)
  const brand = checkBrand(baseDir);
  if (brand) results.push(brand);

  // 7. 브랜드를 켜는 코드(brand 가 없으면 추가하지 않음, WI-0065 D8)
  const activation = inspectBrandActivation(baseDir);
  if (activation) results.push(brandActivationResult(activation));

  // 8. Tailwind 3 content 가 컴포넌트 경로를 덮는지(해당할 때만, WI-0065 D8)
  const content = checkTailwindContent(baseDir);
  if (content) results.push(content);

  // 9. 애니메이션 플러그인(ui-react 를 쓸 때만, WI-0065 D8)
  const animation = checkAnimationPlugin(baseDir);
  if (animation) results.push(animation);

  return results;
}

/** 검증 결과 개수 */
export interface CheckSummary {
  pass: number;
  warn: number;
  fail: number;
}

/**
 * 프로젝트 상태 검증 실행. 출력하고 개수를 돌려줍니다.
 * 종료 코드는 여기서 정하지 않고 `axis check` 명령이 정합니다(fail 이 있으면 1, WI-0042).
 */
export async function runCheck(dir?: string): Promise<CheckSummary> {
  const results = await collectCheckResults(dir);

  // 결과 출력
  console.log(chalk.blue("\nAXIS 프로젝트 검증 결과:\n"));

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const r of results) {
    console.log(`  ${SEVERITY_ICON[r.severity]}  ${r.message}`);
    switch (r.severity) {
      case "pass":
        passCount++;
        break;
      case "warn":
        warnCount++;
        break;
      case "fail":
        failCount++;
        break;
    }
  }

  console.log();
  console.log(
    `  결과: ${chalk.green(`${passCount} pass`)} / ${chalk.yellow(`${warnCount} warn`)} / ${chalk.red(`${failCount} fail`)}`
  );

  if (failCount > 0) {
    console.log(chalk.red("\n일부 필수 항목이 누락되었습니다. 위 안내를 확인하세요."));
  } else if (warnCount > 0) {
    console.log(chalk.yellow("\n권장 항목을 확인하세요."));
  } else {
    console.log(chalk.green("\n모든 검증을 통과했습니다!"));
  }

  return { pass: passCount, warn: warnCount, fail: failCount };
}

async function checkFileExists(
  baseDir: string,
  fileName: string,
  label: string
): Promise<CheckResult> {
  const exists = await fs.pathExists(path.join(baseDir, fileName));
  return {
    name: label,
    severity: exists ? "pass" : "fail",
    message: exists
      ? `${label} 파일이 존재합니다`
      : `${label} 파일이 없습니다 → 'axis init'을 실행하세요`,
  };
}

async function checkUtils(baseDir: string): Promise<CheckResult> {
  const candidates = [
    "lib/utils.ts",
    "src/lib/utils.ts",
    "components/ui/utils.ts",
    "src/components/ui/utils.ts",
    "utils.ts",
  ];

  for (const candidate of candidates) {
    const fullPath = path.join(baseDir, candidate);
    if (await fs.pathExists(fullPath)) {
      const content = await fs.readFile(fullPath, "utf-8");
      const hasCn = content.includes("function cn");
      return {
        name: "utils.ts",
        severity: hasCn ? "pass" : "warn",
        message: hasCn
          ? `${candidate}에 cn() 함수가 있습니다`
          : `${candidate}에 cn() 함수가 없습니다`,
      };
    }
  }

  return {
    name: "utils.ts",
    severity: "warn",
    message: "utils.ts를 찾을 수 없습니다 (컴포넌트 사용 시 필요)",
  };
}

/**
 * `axis.config.json` 의 `brand` 와 CSS 의 브랜드 import 를 대조합니다(FR-5, plan 4.5).
 * `brand` 가 없으면 `null` 이라 결과에 들어가지 않습니다. MCP `axis.check_project` 도 같은 문구를 냅니다.
 */
export function checkBrand(baseDir: string): CheckResult | null {
  const check = inspectBrandImport(baseDir);
  return check ? brandCheckResult(check) : null;
}

/** 코어 검사 결과를 check 항목으로 바꿉니다. */
export function brandCheckResult(check: BrandImportCheck): CheckResult {
  const { brand } = check;
  // 「(globalCss <값> 없음)」 · .css 아닌 파일을 버린 표기(WI-0100 D10). CSS 3항목과 같은 공유 코어 문구입니다
  const suffix = globalCssSelectionNote(check);
  // WI-0100b(D6): 브랜드 import 를 상대 @import 로 들여온 하위 파일에서 찾았으면 그 출처(「(app/brand.css 의 import)」)를 표기 앞에 붙여요
  const via = cssImportViaNote(check.importVia);
  switch (check.state) {
    case "match":
      return {
        name: "brand",
        severity: "pass",
        message: `brand "${brand}" import 가 ${check.cssFile}에 있습니다${via}${suffix}`,
      };
    case "css-missing":
      return {
        name: "brand",
        severity: "warn",
        message: `brand "${brand}" 가 설정됐지만 CSS 파일을 찾지 못했습니다${suffix}`,
      };
    case "import-missing":
      return {
        name: "brand",
        severity: "warn",
        message: `brand "${brand}" import 가 ${check.cssFile}에 없습니다 → 'axis theme add ${brand}'${suffix}`,
      };
    case "other-brand":
      return {
        name: "brand",
        severity: "warn",
        message: `brand "${brand}" 와 import(${check.imports.join(", ")})가 다릅니다${via}${suffix}`,
      };
  }
}

/**
 * 브랜드를 켜는 코드 검사 결과를 check 항목으로 바꿉니다(WI-0065 D8). 다른 파일에서 감싸는 구성을 놓칠 수 있어 WARN 까지만 냅니다.
 * MCP `axis.check_project` 도 같은 문구를 냅니다.
 */
export function brandActivationResult(check: BrandActivationCheck): CheckResult {
  if (check.found && check.theme?.status === "unresolved") {
    // WI-0091(사용자 결정 Q7): Plug'n'Play 에서 루트에만 선언한 theme 는 앱이 해석하지 못합니다
    return {
      name: "brand.activation",
      severity: "warn",
      message: `${check.found}의 <html data-brand> 를 ThemeProvider 와 함께 쓰는데 @axis-ds/theme 가 ${PNP_ROOT_ONLY_NOTE}(${versionGateLabel(check.theme)}) → 앱 package.json 에 @axis-ds/theme ${THEME_MARKUP_BRAND_MIN_VERSION} 이상을 선언하거나 setBrand("${check.brand}")`,
    };
  }
  if (check.found && check.theme && check.theme.status !== "ok") {
    // WI-0068: 마크업 data-brand + ThemeProvider(켜는 코드 없음)는 theme 1.6.2 이하에서 마운트 때 브랜드를 지웁니다
    const label = versionGateLabel(check.theme);
    const why =
      check.theme.status === "below"
        ? `@axis-ds/theme ${label} 의 ThemeProvider 가 마운트 때 지웁니다`
        : `@axis-ds/theme 버전을 확인하지 못했습니다(${label}). ${THEME_MARKUP_BRAND_MIN_VERSION} 미만이면 ThemeProvider 가 마운트 때 지웁니다`;
    return {
      name: "brand.activation",
      severity: "warn",
      message: `${check.found}의 <html data-brand> 를 ${why} → @axis-ds/theme ${THEME_MARKUP_BRAND_MIN_VERSION} 이상으로 올리거나 setBrand("${check.brand}")`,
    };
  }
  if (check.found) {
    return {
      name: "brand.activation",
      severity: "pass",
      message: `${check.found}에 브랜드를 켜는 코드(data-brand · setBrand 등)가 있습니다`,
    };
  }
  const where = check.layoutFiles.length > 0 ? check.layoutFiles.join(" · ") : "루트 레이아웃(app/layout.tsx 등)";
  return {
    name: "brand.activation",
    severity: "warn",
    message: `brand "${check.brand}" 가 설정됐지만 ${where}에 브랜드를 켜는 코드(data-brand · setBrand 등)가 없습니다(ThemeProvider 만으로는 마운트 때 꺼짐) → <html data-brand="${check.brand}"> 또는 setBrand("${check.brand}")`,
  };
}
