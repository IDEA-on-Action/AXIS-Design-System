/** axis check 검증 로직 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import type { CheckResult, CheckSeverity } from "./types.js";

const SEVERITY_ICON: Record<CheckSeverity, string> = {
  pass: chalk.green("PASS"),
  warn: chalk.yellow("WARN"),
  fail: chalk.red("FAIL"),
};

/**
 * 프로젝트 상태 검증 실행
 */
export async function runCheck(dir?: string): Promise<void> {
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
