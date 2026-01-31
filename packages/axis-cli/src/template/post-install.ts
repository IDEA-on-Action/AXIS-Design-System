/** postInstall 패치 시스템 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import type { PostInstallPatch } from "./types.js";

/**
 * postInstall 패치 배열을 순서대로 적용
 */
export async function runPostInstall(
  patches: PostInstallPatch[],
  baseDir: string,
  dryRun = false
): Promise<void> {
  for (const patch of patches) {
    const filePath = path.resolve(baseDir, patch.file);

    if (dryRun) {
      console.log(chalk.gray(`  [dry-run] patch ${patch.type}: ${patch.file}`));
      continue;
    }

    if (!(await fs.pathExists(filePath))) {
      console.log(chalk.yellow(`  경고: 패치 대상 파일 없음 - ${patch.file}`));
      continue;
    }

    switch (patch.type) {
      case "replace": {
        if (!patch.search || patch.value === undefined) break;
        let content = await fs.readFile(filePath, "utf-8");
        content = content.replace(patch.search, patch.value);
        await fs.writeFile(filePath, content);
        console.log(chalk.gray(`  patch replace: ${patch.file}`));
        break;
      }
      case "append": {
        if (patch.value === undefined) break;
        const content = await fs.readFile(filePath, "utf-8");
        await fs.writeFile(filePath, content + patch.value);
        console.log(chalk.gray(`  patch append: ${patch.file}`));
        break;
      }
      case "prepend": {
        if (patch.value === undefined) break;
        const content = await fs.readFile(filePath, "utf-8");
        await fs.writeFile(filePath, patch.value + content);
        console.log(chalk.gray(`  patch prepend: ${patch.file}`));
        break;
      }
      case "json-merge": {
        if (!patch.merge) break;
        const raw = await fs.readFile(filePath, "utf-8");
        const json = JSON.parse(raw);
        deepMerge(json, patch.merge);
        await fs.writeJSON(filePath, json, { spaces: 2 });
        console.log(chalk.gray(`  patch json-merge: ${patch.file}`));
        break;
      }
    }
  }
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];

    if (
      srcVal &&
      typeof srcVal === "object" &&
      !Array.isArray(srcVal) &&
      tgtVal &&
      typeof tgtVal === "object" &&
      !Array.isArray(tgtVal)
    ) {
      deepMerge(tgtVal as Record<string, unknown>, srcVal as Record<string, unknown>);
    } else {
      target[key] = srcVal;
    }
  }
}
