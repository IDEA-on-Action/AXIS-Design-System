/** template apply / init 핵심 로직 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { fetchTemplateDetail } from "./registry-client.js";
import { runPostInstall } from "./post-install.js";
import type { ApplyOptions, InitOptions, TemplateDetail } from "./types.js";
import { ask, failNonInteractive, isInteractive, noteDefault } from "../interactive.js";
import { createTemplateConfig, type AxisConfig } from "../config/axis-config.js";
import { detectTailwind, tailwindMajorFromRange } from "./tailwind-core.js";
import { addCommandFor, detectInstallCommand, runScriptCommand } from "@axis-ds/registry-core/project";
import {
  planTemplateFiles,
  writeTemplateFiles,
  type TemplateFilePlan,
} from "@axis-ds/registry-core/apply-files";

/** 충돌 목록 · 미리보기의 파일별 표시(WI-0088). 합치는 파일은 사용자 값을 남긴다는 것을 함께 보입니다 */
const ACTION_LABEL: Record<TemplateFilePlan["action"], string> = {
  created: "생성",
  overwritten: "덮어쓰기",
  merged: "합치기",
};
const MERGED_HINT = "기존 필드를 두고 템플릿 키를 합침";

/**
 * template apply 의 「필요한 의존성」 줄(WI-0085). `installCommand` 는 대상 디렉터리의 lockfile · `packageManager` 로 고른 설치 명령이고
 * (`detectInstallCommand`, 템플릿 파일을 쓰기 전에 고름: WI-0088 전에는 템플릿의 package.json 이 사용자 `packageManager` 를 덮어썼고,
 * 지금은 합쳐서 남지만 쓰기 전 프로젝트 기준이라는 순서는 그대로 둠),
 * 다른 안내처럼 범위를 따옴표로 감쌉니다. 종전에는 `pnpm add` · `pnpm add -D` 고정이었습니다. MCP `axis.apply_template` 와 같은 명령입니다.
 */
export function templateDependencyCommands(
  installCommand: string,
  detail: Pick<TemplateDetail, "dependencies" | "devDependencies">
): string[] {
  const lines: string[] = [];
  const deps = detail.dependencies ?? {};
  const devDeps = detail.devDependencies ?? {};
  if (Object.keys(deps).length > 0) lines.push(addCommandFor(installCommand, deps));
  if (Object.keys(devDeps).length > 0) lines.push(addCommandFor(installCommand, devDeps, { dev: true }));
  return lines;
}

/** template init 의 다음 단계(WI-0085). 프로젝트 디렉터리(템플릿을 쓰기 전) 기준으로 설치 · 개발 서버 명령을 고릅니다(종전 `pnpm install` · `pnpm dev` 고정) */
export function templateInitNextSteps(projectDir: string): string[] {
  const installCommand = detectInstallCommand(projectDir);
  return [installCommand, runScriptCommand(installCommand, "dev")];
}

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
 * 템플릿 apply 로직 - 파일 쓰기 + postInstall 실행
 *
 * 템플릿 파일을 썼으면 true, 쓰지 않았으면(취소 · 비대화형 거절 · 미리보기 · 쓰기 실패 후 되돌림) false 를 돌려줍니다(WI-0088).
 * `template init` 은 false 면 axis.config.json 생성 · 다음 단계 안내로 넘어가지 않습니다.
 */
export async function applyTemplate(
  slug: string,
  options: ApplyOptions
): Promise<boolean> {
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
  // 의존성 안내의 매니저는 템플릿 파일(package.json 포함)을 쓰기 전의 프로젝트로 고릅니다(WI-0085)
  const installCommand = detectInstallCommand(baseDir);

  // 기존 프로젝트 구조 경고(WI-0037 D3, 쓰기는 막지 않음)
  for (const w of await templateApplyWarnings(baseDir, detail)) {
    console.log(chalk.yellow(`! ${w}`));
  }

  // 쓸 내용을 먼저 정합니다(WI-0088: package.json · axis.config.json 은 기존 파일과 합침, 쓰기 전에 모두 계산)
  const plan = planTemplateFiles(baseDir, detail.files);
  const conflicts = plan.filter((p) => p.action !== "created");

  if (conflicts.length > 0 && !options.yes && !options.dryRun) {
    console.log(chalk.yellow(`\n기존 파일과 충돌하는 ${conflicts.length}개 파일:`));
    for (const c of conflicts) {
      console.log(chalk.gray(`  - ${c.path}${c.action === "merged" ? ` (${MERGED_HINT})` : ""}`));
    }

    // 덮어쓰기는 기본값으로 삼지 않습니다(WI-0075 D1). 비대화형이면 아무것도 쓰지 않고 rc 1
    const interactive = options.interactive ?? isInteractive();
    if (!interactive) {
      failNonInteractive("충돌 파일을 덮어쓸지 물을 수 없어 아무것도 쓰지 않았습니다.", [
        `덮어쓰려면: axis template apply ${slug} -y`,
        `미리보기: axis template apply ${slug} --dry-run`,
      ]);
      return false;
    }
    const { proceed } = await ask(
      {
        type: "confirm",
        name: "proceed",
        message: "충돌 파일을 덮어쓰시겠습니까?",
        initial: false,
      },
      interactive
    );
    if (!proceed) {
      console.log(chalk.gray("취소되었습니다."));
      return false;
    }
  }

  // 파일 쓰기
  if (options.dryRun) {
    console.log(chalk.blue("\n[미리보기] 생성될 파일:"));
    for (const item of plan) {
      const text = ACTION_LABEL[item.action];
      const label = item.action === "created" ? chalk.green(text) : chalk.yellow(text);
      console.log(`  ${label} ${item.dest}${item.action === "merged" ? chalk.gray(` (${MERGED_HINT})`) : ""}`);
      if (item.note) console.log(chalk.yellow(`    ! ${item.note}`));
    }
    if (detail.postInstall?.length) {
      console.log(chalk.blue("\n[미리보기] postInstall 패치:"));
      for (const p of detail.postInstall) {
        console.log(chalk.gray(`  ${p.type}: ${p.file}`));
      }
    }
    return false;
  }

  const writeSpinner = ora("파일 생성 중...").start();
  try {
    writeTemplateFiles(plan);
  } catch (err) {
    // 쓰는 도중 실패하면 코어가 건드린 파일을 되돌리고 TemplateApplyError 로 알립니다(WI-0088)
    writeSpinner.fail((err as Error).message);
    process.exitCode = 1;
    return false;
  }
  writeSpinner.succeed(`${detail.files.length}개 파일 생성 완료`);
  for (const item of plan) {
    if (item.action === "merged") console.log(chalk.gray(`  ${item.path}: ${MERGED_HINT}`));
    if (item.note) console.log(chalk.yellow(`! ${item.note}`));
  }

  // postInstall 패치
  if (detail.postInstall?.length) {
    console.log(chalk.blue("\npostInstall 패치 실행 중..."));
    await runPostInstall(detail.postInstall, baseDir);
  }

  // 의존성 안내
  if (!options.skipDeps) {
    const commands = templateDependencyCommands(installCommand, detail);
    if (commands.length > 0) {
      console.log(chalk.yellow("\n필요한 의존성:"));
      for (const command of commands) console.log(chalk.cyan(`  ${command}`));
    }
  }

  console.log(chalk.green(`\n'${detail.name}' 템플릿 적용 완료!`));
  return true;
}

/**
 * 템플릿 init 로직 - 새 프로젝트 디렉토리 생성 + apply + axis.config.json 생성
 *
 * 비대화형(WI-0075 D1) · `-y`(D2):
 * - 템플릿 이름이 없으면 기본값이 없어 rc 1(이름 안내). 대화형이면 `-y` 여도 목록에서 고릅니다
 * - `--dir` 이 없으면 템플릿 이름 디렉터리(`./<name>`)로 진행하고 그 값을 1줄로 알림
 * - 디렉터리가 비어 있지 않으면 `-y` 는 진행(같은 경로의 파일은 덮어씀), `-y` 없는 비대화형은 rc 1(아무것도 쓰지 않음)
 */
export async function initTemplate(
  slug: string | undefined,
  options: InitOptions
): Promise<void> {
  const interactive = options.interactive ?? isInteractive();

  // 템플릿 미지정 시 선택
  let selectedSlug = slug;
  if (!selectedSlug) {
    if (!interactive) {
      failNonInteractive("템플릿을 고를 수 없습니다. 템플릿 이름을 주세요.", [
        "사용법: axis template init <name> [--dir <path>] [-y]",
        "목록: axis template list",
      ]);
      return;
    }
    const { fetchTemplateIndex } = await import("./registry-client.js");
    const index = await fetchTemplateIndex();

    const { choice } = await ask(
      {
        type: "select",
        name: "choice",
        message: "사용할 템플릿을 선택하세요:",
        choices: index.templates.map((t) => ({
          title: `${t.name} (${t.category})`,
          description: t.description,
          value: t.slug,
        })),
      },
      interactive
    );

    if (!choice) {
      console.log(chalk.gray("취소되었습니다."));
      return;
    }
    selectedSlug = choice;
  }

  // 디렉토리 결정
  let targetDir = options.dir;
  if (!targetDir && (!interactive || options.yes)) {
    // 기본값(템플릿 이름)이 있고 파괴적이지 않아 그대로 진행합니다. 비어 있지 않으면 아래 확인이 막습니다
    targetDir = selectedSlug!;
    const msg = `프로젝트 디렉토리를 기본값 '${targetDir}' 로 정했습니다(바꾸려면 --dir <path>).`;
    if (interactive) console.log(chalk.gray(`-y 라 ${msg}`));
    else noteDefault(msg);
  }
  if (!targetDir) {
    // prompts 응답은 any 라 대입해도 targetDir 이 string 으로 좁혀지지 않아요. 응답 타입을 명시합니다
    const { dir } = (await ask(
      {
        type: "text",
        name: "dir",
        message: "프로젝트 디렉토리:",
        initial: selectedSlug,
      },
      interactive
    )) as { dir?: string };
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
      if (options.yes) {
        console.log(chalk.yellow(`! '${targetDir}'에 이미 파일이 있지만 -y 라 진행합니다(템플릿과 같은 경로의 파일은 덮어씀).`));
      } else if (!interactive) {
        failNonInteractive(`'${targetDir}'에 이미 파일이 있어 계속할지 물을 수 없습니다. 아무것도 쓰지 않았습니다.`, [
          `빈 디렉터리를 주세요: axis template init ${selectedSlug} --dir <path>`,
          `그대로 진행하려면(같은 경로의 파일은 덮어씀): axis template init ${selectedSlug} --dir ${targetDir} -y`,
        ]);
        return;
      } else {
        const { proceed } = await ask(
          {
            type: "confirm",
            name: "proceed",
            message: `'${targetDir}'에 이미 파일이 있습니다. 계속하시겠습니까?`,
            initial: false,
          },
          interactive
        );
        if (!proceed) return;
      }
    }
  } else {
    await fs.ensureDir(resolved);
  }

  // 다음 단계 명령은 apply 와 같이 템플릿 파일을 쓰기 전의 디렉터리로 고릅니다(WI-0085)
  const nextSteps = templateInitNextSteps(resolved);

  // apply 재사용. 쓰기에 실패해 되돌렸으면(rc 1) 설정 생성 · 다음 단계로 넘어가지 않습니다(WI-0088)
  if (!(await applyTemplate(selectedSlug!, { dir: targetDir, yes: true }))) return;

  // axis.config.json 생성
  const configPath = path.join(resolved, "axis.config.json");
  if (!(await fs.pathExists(configPath))) {
    const axisConfig: AxisConfig = createTemplateConfig(selectedSlug!);
    await fs.writeJSON(configPath, axisConfig, { spaces: 2 });
    console.log(chalk.green("axis.config.json 생성 완료"));
  }

  console.log(chalk.blue(`\n다음 단계:`));
  console.log(chalk.cyan(`  cd ${targetDir}`));
  for (const command of nextSteps) console.log(chalk.cyan(`  ${command}`));
}
