/** template diff 비교 로직 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { fetchTemplateDetail } from "./registry-client.js";
import type { DiffEntry, DiffOptions, TemplateDetail } from "./types.js";

/**
 * 로컬 프로젝트와 원격 템플릿의 파일 차이 비교
 */
export async function diffTemplate(
  slug: string,
  options: DiffOptions & { dir?: string }
): Promise<void> {
  const spinner = ora(`'${slug}' 템플릿 가져오는 중...`).start();

  let detail: TemplateDetail;
  try {
    detail = await fetchTemplateDetail(slug);
    spinner.succeed(`'${detail.name}' 로드 완료`);
  } catch (err) {
    spinner.fail((err as Error).message);
    process.exit(1);
  }

  const baseDir = path.resolve(options.dir || ".");
  const entries: DiffEntry[] = [];

  // 템플릿 파일과 로컬 파일 비교
  for (const file of detail.files) {
    const localPath = path.join(baseDir, file.path);

    if (!(await fs.pathExists(localPath))) {
      entries.push({ path: file.path, status: "added" });
      continue;
    }

    const localContent = await fs.readFile(localPath, "utf-8");
    if (localContent === file.content) {
      entries.push({ path: file.path, status: "unchanged" });
    } else {
      entries.push({
        path: file.path,
        status: "modified",
        localLines: localContent.split("\n").length,
        remoteLines: file.content.split("\n").length,
      });
    }
  }

  // 로컬에만 존재하는 파일 탐지 (verbose 모드)
  if (options.verbose) {
    const templatePaths = new Set(detail.files.map((f) => f.path));
    const localFiles = await collectLocalFiles(baseDir);
    for (const lf of localFiles) {
      if (!templatePaths.has(lf)) {
        entries.push({ path: lf, status: "extra" });
      }
    }
  }

  // 결과 출력
  console.log(chalk.blue(`\n'${detail.name}' 템플릿 diff 결과:\n`));

  const statusIcon: Record<string, string> = {
    added: chalk.green("+ 추가 필요"),
    modified: chalk.yellow("~ 변경됨"),
    unchanged: chalk.gray("= 동일"),
    extra: chalk.cyan("? 로컬 전용"),
  };

  let added = 0;
  let modified = 0;
  let unchanged = 0;
  let extra = 0;

  for (const entry of entries) {
    const icon = statusIcon[entry.status];
    console.log(`  ${icon.padEnd(28)} ${entry.path}`);

    if (entry.status === "modified" && options.verbose) {
      console.log(
        chalk.gray(
          `           로컬 ${entry.localLines}줄 / 원본 ${entry.remoteLines}줄`
        )
      );
    }

    switch (entry.status) {
      case "added":
        added++;
        break;
      case "modified":
        modified++;
        break;
      case "unchanged":
        unchanged++;
        break;
      case "extra":
        extra++;
        break;
    }
  }

  console.log(chalk.blue("\n요약:"));
  console.log(
    `  추가 필요: ${chalk.green(String(added))} | 변경됨: ${chalk.yellow(String(modified))} | 동일: ${chalk.gray(String(unchanged))}${extra > 0 ? ` | 로컬 전용: ${chalk.cyan(String(extra))}` : ""}`
  );
}

/** 디렉토리의 파일을 재귀적으로 수집 (node_modules 등 제외) */
async function collectLocalFiles(dir: string, base?: string): Promise<string[]> {
  const root = base || dir;
  const ignore = new Set(["node_modules", ".git", ".next", "dist"]);
  const results: string[] = [];

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (ignore.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const nested = await collectLocalFiles(fullPath, root);
      results.push(...nested);
    } else {
      results.push(path.relative(root, fullPath).replace(/\\/g, "/"));
    }
  }

  return results;
}
