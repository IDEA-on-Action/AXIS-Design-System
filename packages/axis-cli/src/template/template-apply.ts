/** template apply / init 핵심 로직 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { fetchTemplateDetail } from "./registry-client.js";
import { runPostInstall } from "./post-install.js";
import type { ApplyOptions, TemplateDetail } from "./types.js";
import { createTemplateConfig, type AxisConfig } from "../config/axis-config.js";
import { detectTailwind, tailwindMajorFromRange } from "./tailwind-core.js";

/**
 * 기존 프로젝트에 apply 할 때의 경고(WI-0037 D3: 템플릿은 빈 디렉터리의 `template init` 을 보장하고, 기존 프로젝트 apply 는
 * 구조가 다르면 경고만 함). 파일은 고치지 않습니다. 빈 디렉터리(package.json · src/app 없음)에서는 빈 배열입니다.
 * - Tailwind major 가 템플릿 선언과 다름(예: create-next-app@latest 의 Tailwind 4 위에 Tailwind 3 템플릿)
 * - `src/app` 이 있는데 템플릿이 루트 `app/` 을 씀(Next.js 는 루트 `app/` 이 있으면 `src/app` 을 쓰지 않음)
 */
export async function templateApplyWarnings(baseDir: string, detail: TemplateDetail): Promise<string[]> {
  const warnings: string[] = [];
  const pkgPath = path.join(baseDir, "package.json");
  const templateRange = detail.devDependencies?.tailwindcss ?? detail.dependencies?.tailwindcss;
  const templateMajor = templateRange !== undefined ? tailwindMajorFromRange(templateRange) : undefined;
  if (templateMajor !== undefined && (await fs.pathExists(pkgPath))) {
    let pkg: Record<string, unknown> | undefined;
    try {
      pkg = (await fs.readJSON(pkgPath)) as Record<string, unknown>;
    } catch {
      pkg = undefined;
    }
    const project = detectTailwind(baseDir, pkg);
    if (project.major !== undefined && project.major !== templateMajor) {
      warnings.push(
        `템플릿은 Tailwind ${templateMajor} 기준인데 이 프로젝트는 Tailwind ${project.major}(${project.value}) 입니다. ` +
          "빌드 · 스타일이 맞지 않을 수 있어 빈 디렉터리에 'axis template init' 으로 만드는 것을 권장합니다."
      );
    }
  }
  const usesRootApp = detail.files.some((f) => f.path.startsWith("app/"));
  if (usesRootApp && (await fs.pathExists(path.join(baseDir, "src", "app")))) {
    warnings.push(
      "src/app 이 있는데 템플릿은 루트 app/ 을 씁니다. Next.js 는 루트 app/ 이 있으면 src/app 을 쓰지 않아 기존 라우트가 빠집니다."
    );
  }
  return warnings;
}

/**
 * 템플릿 apply 로직 — 파일 쓰기 + postInstall 실행
 */
export async function applyTemplate(
  slug: string,
  options: ApplyOptions
): Promise<void> {
  const spinner = ora(`'${slug}' 템플릿 가져오는 중...`).start();

  let detail: TemplateDetail;
  try {
    detail = await fetchTemplateDetail(slug);
    spinner.succeed(`'${detail.name}' 템플릿 로드 완료 (${detail.files.length}개 파일)`);
  } catch (err) {
    spinner.fail((err as Error).message);
    process.exit(1);
  }

  const baseDir = path.resolve(options.dir || ".");

  // 기존 프로젝트 구조 경고(WI-0037 D3, 쓰기는 막지 않음)
  for (const w of await templateApplyWarnings(baseDir, detail)) {
    console.log(chalk.yellow(`! ${w}`));
  }

  // 충돌 파일 탐지
  const conflicts: string[] = [];
  for (const file of detail.files) {
    const dest = path.join(baseDir, file.path);
    if (await fs.pathExists(dest)) {
      conflicts.push(file.path);
    }
  }

  if (conflicts.length > 0 && !options.yes && !options.dryRun) {
    console.log(chalk.yellow(`\n기존 파일과 충돌하는 ${conflicts.length}개 파일:`));
    for (const c of conflicts) {
      console.log(chalk.gray(`  - ${c}`));
    }

    const { proceed } = await prompts({
      type: "confirm",
      name: "proceed",
      message: "충돌 파일을 덮어쓰시겠습니까?",
      initial: false,
    });
    if (!proceed) {
      console.log(chalk.gray("취소되었습니다."));
      return;
    }
  }

  // 파일 쓰기
  if (options.dryRun) {
    console.log(chalk.blue("\n[미리보기] 생성될 파일:"));
    for (const file of detail.files) {
      const dest = path.join(baseDir, file.path);
      const exists = conflicts.includes(file.path);
      const label = exists ? chalk.yellow("덮어쓰기") : chalk.green("생성");
      console.log(`  ${label} ${dest}`);
    }
    if (detail.postInstall?.length) {
      console.log(chalk.blue("\n[미리보기] postInstall 패치:"));
      for (const p of detail.postInstall) {
        console.log(chalk.gray(`  ${p.type}: ${p.file}`));
      }
    }
    return;
  }

  const writeSpinner = ora("파일 생성 중...").start();
  for (const file of detail.files) {
    const dest = path.join(baseDir, file.path);
    await fs.ensureDir(path.dirname(dest));
    await fs.writeFile(dest, file.content);
  }
  writeSpinner.succeed(`${detail.files.length}개 파일 생성 완료`);

  // postInstall 패치
  if (detail.postInstall?.length) {
    console.log(chalk.blue("\npostInstall 패치 실행 중..."));
    await runPostInstall(detail.postInstall, baseDir);
  }

  // 의존성 안내
  if (!options.skipDeps) {
    const allDeps = { ...detail.dependencies, ...detail.devDependencies };
    const depList = Object.entries(allDeps);
    if (depList.length > 0) {
      console.log(chalk.yellow("\n필요한 의존성:"));
      const deps = Object.entries(detail.dependencies || {})
        .map(([k, v]) => `${k}@${v}`)
        .join(" ");
      const devDeps = Object.entries(detail.devDependencies || {})
        .map(([k, v]) => `${k}@${v}`)
        .join(" ");

      if (deps) {
        console.log(chalk.cyan(`  pnpm add ${deps}`));
      }
      if (devDeps) {
        console.log(chalk.cyan(`  pnpm add -D ${devDeps}`));
      }
    }
  }

  console.log(chalk.green(`\n'${detail.name}' 템플릿 적용 완료!`));
}

/**
 * 템플릿 init 로직 — 새 프로젝트 디렉토리 생성 + apply + axis.config.json 생성
 */
export async function initTemplate(
  slug: string | undefined,
  options: { dir?: string }
): Promise<void> {
  // 템플릿 미지정 시 선택
  let selectedSlug = slug;
  if (!selectedSlug) {
    const { fetchTemplateIndex } = await import("./registry-client.js");
    const index = await fetchTemplateIndex();

    const { choice } = await prompts({
      type: "select",
      name: "choice",
      message: "사용할 템플릿을 선택하세요:",
      choices: index.templates.map((t) => ({
        title: `${t.name} (${t.category})`,
        description: t.description,
        value: t.slug,
      })),
    });

    if (!choice) {
      console.log(chalk.gray("취소되었습니다."));
      return;
    }
    selectedSlug = choice;
  }

  // 디렉토리 결정
  let targetDir = options.dir;
  if (!targetDir) {
    // prompts 응답은 any 라 대입해도 targetDir 이 string 으로 좁혀지지 않아요. 응답 타입을 명시합니다
    const { dir } = (await prompts({
      type: "text",
      name: "dir",
      message: "프로젝트 디렉토리:",
      initial: selectedSlug,
    })) as { dir?: string };
    if (!dir) {
      console.log(chalk.gray("취소되었습니다."));
      return;
    }
    targetDir = dir;
  }

  const resolved = path.resolve(targetDir);

  // 디렉토리 생성
  if (await fs.pathExists(resolved)) {
    const entries = await fs.readdir(resolved);
    if (entries.length > 0) {
      const { proceed } = await prompts({
        type: "confirm",
        name: "proceed",
        message: `'${targetDir}'에 이미 파일이 있습니다. 계속하시겠습니까?`,
        initial: false,
      });
      if (!proceed) return;
    }
  } else {
    await fs.ensureDir(resolved);
  }

  // apply 재사용
  await applyTemplate(selectedSlug!, { dir: targetDir, yes: true });

  // axis.config.json 생성
  const configPath = path.join(resolved, "axis.config.json");
  if (!(await fs.pathExists(configPath))) {
    const axisConfig: AxisConfig = createTemplateConfig(selectedSlug!);
    await fs.writeJSON(configPath, axisConfig, { spaces: 2 });
    console.log(chalk.green("axis.config.json 생성 완료"));
  }

  console.log(chalk.blue(`\n다음 단계:`));
  console.log(chalk.cyan(`  cd ${targetDir}`));
  console.log(chalk.cyan(`  pnpm install`));
  console.log(chalk.cyan(`  pnpm dev`));
}
