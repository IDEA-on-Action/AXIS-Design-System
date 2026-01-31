/** 템플릿 명령어 등록 */

import type { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { fetchTemplateIndex, fetchTemplateDetail } from "./registry-client.js";
import { applyTemplate, initTemplate } from "./template-apply.js";
import { diffTemplate } from "./template-diff.js";
import { runCheck } from "./template-check.js";
import type { ListOptions } from "./types.js";

/**
 * `axis template` 하위 명령어를 등록합니다.
 */
export function registerTemplateCommand(program: Command): void {
  const tplCmd = program
    .command("template")
    .alias("tpl")
    .description("프로젝트 템플릿 관리");

  // --- list ---
  tplCmd
    .command("list")
    .alias("ls")
    .description("사용 가능한 템플릿 목록")
    .option("--category <type>", "카테고리 필터")
    .action(async (options: ListOptions) => {
      const spinner = ora("템플릿 목록 가져오는 중...").start();

      try {
        const index = await fetchTemplateIndex();
        spinner.stop();

        let templates = index.templates;
        if (options.category) {
          templates = templates.filter((t) => t.category === options.category);
        }

        if (templates.length === 0) {
          console.log(chalk.yellow("\n사용 가능한 템플릿이 없습니다.\n"));
          return;
        }

        console.log(chalk.blue(`\n📦 AXIS 템플릿 (${templates.length}개)\n`));

        // 카테고리별 그룹화
        const byCategory = new Map<string, typeof templates>();
        for (const t of templates) {
          if (!byCategory.has(t.category)) {
            byCategory.set(t.category, []);
          }
          byCategory.get(t.category)!.push(t);
        }

        for (const [category, items] of byCategory) {
          console.log(chalk.bold(`  ${category}`));
          for (const t of items) {
            console.log(
              `    ${chalk.cyan(t.slug.padEnd(20))} ${chalk.gray(t.description.slice(0, 50))}`
            );
          }
          console.log();
        }

        console.log(chalk.gray("사용법: axis template info <name>"));
        console.log(chalk.gray("       axis template apply <name>\n"));
      } catch (err) {
        spinner.fail((err as Error).message);
        process.exit(1);
      }
    });

  // --- info ---
  tplCmd
    .command("info <name>")
    .description("템플릿 상세 정보 보기")
    .action(async (name: string) => {
      const spinner = ora(`'${name}' 정보 가져오는 중...`).start();

      try {
        const detail = await fetchTemplateDetail(name);
        spinner.stop();

        console.log(chalk.blue(`\n📋 ${detail.name}\n`));
        console.log(`  ${chalk.bold("설명")}: ${detail.description}`);
        console.log(`  ${chalk.bold("카테고리")}: ${detail.category}`);
        console.log(`  ${chalk.bold("버전")}: ${detail.version}`);
        if (detail.tags.length > 0) {
          console.log(`  ${chalk.bold("태그")}: ${detail.tags.join(", ")}`);
        }

        if (detail.features.length > 0) {
          console.log(chalk.bold("\n  기능:"));
          for (const f of detail.features) {
            console.log(`    - ${f}`);
          }
        }

        console.log(chalk.bold(`\n  파일 (${detail.files.length}개):`));
        for (const f of detail.files) {
          console.log(`    ${chalk.cyan(f.path)} ${chalk.gray(`(${f.type})`)}`);
        }

        const deps = Object.keys(detail.dependencies || {});
        const devDeps = Object.keys(detail.devDependencies || {});
        if (deps.length > 0 || devDeps.length > 0) {
          console.log(chalk.bold("\n  의존성:"));
          if (deps.length > 0) {
            console.log(`    dependencies: ${deps.join(", ")}`);
          }
          if (devDeps.length > 0) {
            console.log(`    devDependencies: ${devDeps.join(", ")}`);
          }
        }

        console.log(chalk.gray(`\n사용법: axis template apply ${name}\n`));
      } catch (err) {
        spinner.fail((err as Error).message);
        process.exit(1);
      }
    });

  // --- apply ---
  tplCmd
    .command("apply <name>")
    .description("템플릿을 현재 프로젝트에 적용")
    .option("-y, --yes", "확인 없이 덮어쓰기")
    .option("--dry-run", "실제 파일 생성 없이 미리보기")
    .option("--skip-deps", "의존성 안내 생략")
    .option("-d, --dir <path>", "대상 디렉토리")
    .action(async (name: string, options) => {
      await applyTemplate(name, options);
    });

  // --- init ---
  tplCmd
    .command("init [name]")
    .description("새 프로젝트를 템플릿으로 초기화")
    .option("-d, --dir <path>", "프로젝트 디렉토리")
    .action(async (name: string | undefined, options) => {
      await initTemplate(name, options);
    });

  // --- diff ---
  tplCmd
    .command("diff <name>")
    .description("로컬 프로젝트와 템플릿의 차이 비교")
    .option("--verbose", "로컬 전용 파일도 표시")
    .option("-d, --dir <path>", "대상 디렉토리")
    .action(async (name: string, options) => {
      await diffTemplate(name, options);
    });
}

/**
 * `axis check` 독립 명령어를 등록합니다.
 */
export function registerCheckCommand(program: Command): void {
  program
    .command("check")
    .description("AXIS 프로젝트 설정 검증")
    .option("-d, --dir <path>", "대상 디렉토리")
    .action(async (options) => {
      await runCheck(options.dir);
    });
}
