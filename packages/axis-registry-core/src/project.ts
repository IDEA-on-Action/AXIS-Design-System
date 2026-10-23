/**
 * 프로젝트 package.json · lockfile 판정 헬퍼 (WI-0055: cli theme/theme-add.ts 에서 옮김)
 *
 * add(설치 코어) · init · theme add 가 함께 씁니다.
 */

import { existsSync } from "node:fs";
import path from "node:path";

/** 프로젝트의 lockfile 로 설치 명령을 고릅니다(없으면 pnpm). */
export function detectInstallCommand(baseDir: string): string {
  if (existsSync(path.join(baseDir, "pnpm-lock.yaml"))) return "pnpm install";
  if (existsSync(path.join(baseDir, "yarn.lock"))) return "yarn install";
  if (existsSync(path.join(baseDir, "package-lock.json"))) return "npm install";
  return "pnpm install";
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

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
