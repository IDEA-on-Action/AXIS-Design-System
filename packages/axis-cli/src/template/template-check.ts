/** axis check 검증 로직 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { inspectBrandImport, type BrandImportCheck } from "../theme/brand-core.js";
import type { CheckResult, CheckSeverity } from "./types.js";

const SEVERITY_ICON: Record<CheckSeverity, string> = {
  pass: chalk.green("PASS"),
  warn: chalk.yellow("WARN"),
  fail: chalk.red("FAIL"),
};

/**
 * 프로젝트 상태 검증 결과만 모읍니다(출력하지 않음, WI-0028 FR-5).
 * 기존 5항목의 순서 · 문구는 그대로이고, `axis.config.json` 에 `brand` 가 있을 때만 brand 항목을 마지막에 더합니다.
 */
export async function collectCheckResults(dir?: string): Promise<CheckResult[]> {
  const baseDir = path.resolve(dir || ".");
  const results: CheckResult[] = [];

  // 1. axis.config.json 존재 여부
  results.push(await checkFileExists(baseDir, "axis.config.json", "axis.config.json"));

  // 2. tailwind.config.ts 존재 여부
  results.push(await checkTailwindConfig(baseDir));

  // 3. globals.css 존재 여부 + AXIS 토큰 포함 여부
  results.push(await checkGlobalsCss(baseDir));

  // 4. utils.ts (cn 함수) 존재 여부
  results.push(await checkUtils(baseDir));

  // 5. package.json 의존성 확인
  results.push(await checkDependencies(baseDir));

  // 6. brand 와 CSS import 대조 (brand 가 없으면 추가하지 않음)
  const brand = checkBrand(baseDir);
  if (brand) results.push(brand);

  return results;
}

/**
 * 프로젝트 상태 검증 실행
 */
export async function runCheck(dir?: string): Promise<void> {
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

async function checkTailwindConfig(baseDir: string): Promise<CheckResult> {
  const tsPath = path.join(baseDir, "tailwind.config.ts");
  const jsPath = path.join(baseDir, "tailwind.config.js");

  if (await fs.pathExists(tsPath)) {
    const content = await fs.readFile(tsPath, "utf-8");
    const hasTokens = content.includes("--background") || content.includes("hsl(var(");
    return {
      name: "tailwind.config",
      severity: hasTokens ? "pass" : "warn",
      message: hasTokens
        ? "tailwind.config.ts에 AXIS 토큰이 설정되어 있습니다"
        : "tailwind.config.ts에 AXIS 토큰 설정이 없습니다",
    };
  }

  if (await fs.pathExists(jsPath)) {
    return {
      name: "tailwind.config",
      severity: "warn",
      message: "tailwind.config.js 존재 (TypeScript 권장)",
    };
  }

  return {
    name: "tailwind.config",
    severity: "fail",
    message: "tailwind.config 파일이 없습니다",
  };
}

async function checkGlobalsCss(baseDir: string): Promise<CheckResult> {
  // 일반적인 위치 탐색
  const candidates = [
    "globals.css",
    "app/globals.css",
    "src/app/globals.css",
    "src/globals.css",
    "styles/globals.css",
  ];

  for (const candidate of candidates) {
    const fullPath = path.join(baseDir, candidate);
    if (await fs.pathExists(fullPath)) {
      const content = await fs.readFile(fullPath, "utf-8");
      const hasTokens = content.includes("--background") && content.includes("--primary");
      return {
        name: "globals.css",
        severity: hasTokens ? "pass" : "warn",
        message: hasTokens
          ? `${candidate}에 AXIS CSS 변수가 정의되어 있습니다`
          : `${candidate}에 AXIS CSS 변수가 없습니다`,
      };
    }
  }

  return {
    name: "globals.css",
    severity: "fail",
    message: "globals.css 파일을 찾을 수 없습니다",
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

async function checkDependencies(baseDir: string): Promise<CheckResult> {
  const pkgPath = path.join(baseDir, "package.json");
  if (!(await fs.pathExists(pkgPath))) {
    return {
      name: "package.json",
      severity: "fail",
      message: "package.json 파일이 없습니다",
    };
  }

  const pkg = await fs.readJSON(pkgPath);
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  const required = ["tailwindcss"];
  const recommended = ["clsx", "tailwind-merge"];

  const missingRequired = required.filter((d) => !allDeps[d]);
  const missingRecommended = recommended.filter((d) => !allDeps[d]);

  if (missingRequired.length > 0) {
    return {
      name: "dependencies",
      severity: "fail",
      message: `필수 의존성 누락: ${missingRequired.join(", ")}`,
    };
  }

  if (missingRecommended.length > 0) {
    return {
      name: "dependencies",
      severity: "warn",
      message: `권장 의존성 누락: ${missingRecommended.join(", ")}`,
    };
  }

  return {
    name: "dependencies",
    severity: "pass",
    message: "필수 및 권장 의존성이 모두 설치되어 있습니다",
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
  const suffix = check.configuredMissing !== undefined ? ` (globalCss ${check.configuredMissing} 없음)` : "";
  switch (check.state) {
    case "match":
      return {
        name: "brand",
        severity: "pass",
        message: `brand "${brand}" import 가 ${check.cssFile}에 있습니다${suffix}`,
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
        message: `brand "${brand}" 와 import(${check.imports.join(", ")})가 다릅니다${suffix}`,
      };
  }
}
