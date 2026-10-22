#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { createRequire } from "module";
import { MonetClient, MONET_CATEGORIES } from "./monet.js";
import { V0Client } from "./v0.js";
import { LibraryCurator, Publisher } from "./library/index.js";
import { registerSyncCommand } from "./sync/index.js";
import { registerTemplateCommand, registerCheckCommand } from "./template/index.js";
import { registerThemeCommand } from "./theme/index.js";
import { registerInitCommand } from "./init/index.js";
import { registerAddCommand, registerListCommand } from "./add/index.js";

// 버전은 package.json 에서 읽습니다. dist/index.js 기준 ../package.json 도 패키지 루트입니다.
const { version: CLI_VERSION } = createRequire(import.meta.url)("../package.json") as {
  version: string;
};

// 레지스트리 URL 은 env AXIS_REGISTRY_URL → axis.config.json registry → 기본값(WI-0045 D1, src/registry).
// init 은 env 를 config 에 기록하지 않고 기본값(또는 기존 config 값)만 씁니다(WI-0045 D7, src/init/index.ts).

const program = new Command();

program
  .name("axis")
  .description("AXIS Design System CLI - shadcn 호환 컴포넌트 설치 도구")
  .version(CLI_VERSION);

// init 명령어 (WI-0038: src/init)
registerInitCommand(program);

// add · list 명령어(WI-0045 FR-4 · FR-5: 레지스트리 조회, src/add)
registerAddCommand(program);
registerListCommand(program);

// ==========================================
// Monet 명령어
// ==========================================
const monetCmd = program
  .command("monet")
  .description("Monet Design 컴포넌트 관리 (https://monet.design)");

monetCmd
  .command("list")
  .alias("ls")
  .description("Monet 카테고리 목록")
  .action(async () => {
    const client = new MonetClient();
    await client.listCategories();
  });

monetCmd
  .command("browse <category>")
  .alias("b")
  .description("카테고리별 컴포넌트 보기")
  .action(async (category) => {
    const client = new MonetClient();
    await client.browseCategory(category);
  });

monetCmd
  .command("search <query>")
  .alias("s")
  .description("컴포넌트 검색")
  .action(async (query) => {
    const client = new MonetClient();
    await client.searchComponents(query);
  });

monetCmd
  .command("import")
  .alias("i")
  .description("클립보드에서 컴포넌트 가져오기")
  .action(async () => {
    const client = new MonetClient();
    await client.importFromClipboard();
  });

monetCmd
  .command("setup")
  .description("Monet MCP 서버 설정 안내")
  .action(() => {
    console.log(chalk.blue("\n🔧 Monet MCP 서버 설정\n"));

    console.log(chalk.bold("1. API 키 발급:"));
    console.log(chalk.cyan("   https://monet.design/mcp\n"));

    console.log(chalk.bold("2. 환경 변수 설정:"));
    console.log(chalk.gray("   .env 파일에 추가:"));
    console.log(chalk.cyan("   MONET_API_KEY=your-api-key-here\n"));

    console.log(chalk.bold("3. Claude Code MCP 설정:"));
    console.log(chalk.gray("   .claude/mcp.json에서 monet 서버 활성화:\n"));
    console.log(
      chalk.cyan(`   "monet": {
     "url": "https://www.monet.design/api/remote/mcp",
     "headers": { "Authorization": "Bearer \${MONET_API_KEY}" },
     "disabled": false
   }\n`)
    );

    console.log(chalk.bold("4. Claude Code 재시작 후 사용:"));
    console.log(chalk.gray('   "monet에서 hero 컴포넌트 찾아줘"\n'));
  });

// ==========================================
// V0 명령어
// ==========================================
const v0Cmd = program.command("v0").description("V0 (v0.app) 코드 변환 및 통합");

v0Cmd
  .command("convert <file>")
  .alias("c")
  .description("V0 코드를 AXIS 스타일로 변환")
  .option("-o, --output <path>", "출력 파일 경로")
  .action(async (file, options) => {
    const client = new V0Client();
    await client.convertFile(file, options.output);
  });

v0Cmd
  .command("import")
  .alias("i")
  .description("V0 URL/클립보드에서 가져오기")
  .action(async () => {
    const client = new V0Client();
    await client.importFromUrl();
  });

v0Cmd
  .command("guide")
  .alias("g")
  .description("V0 → AXIS 변환 가이드")
  .action(() => {
    const client = new V0Client();
    client.showGuide();
  });

v0Cmd
  .command("setup")
  .description("V0 GitHub 연동 안내")
  .action(async () => {
    const client = new V0Client();
    await client.setupGitHubSync();
  });

// ==========================================
// Library 명령어
// ==========================================
const libraryCmd = program
  .command("library")
  .alias("lib")
  .description("디자인 시스템 라이브러리 수집/분류/배치");

libraryCmd
  .command("collect")
  .alias("c")
  .description("외부 소스에서 컴포넌트 수집")
  .option("-s, --source <source>", "소스 지정 (shadcn, monet, v0, axis)")
  .option("-i, --incremental", "증분 수집 (변경분만)")
  .option("--dry-run", "실제 저장 없이 미리보기")
  .action(async (options) => {
    const curator = new LibraryCurator();
    const sources = options.source ? [options.source] : undefined;

    const results = await curator.collectAll(sources, {
      incremental: options.incremental,
      verbose: true,
    });

    if (!options.dryRun) {
      const index = await curator.generateIndex();
      await curator.saveIndex(index);
    }

    // 결과 요약
    let total = 0;
    let failed = 0;
    for (const [, result] of results) {
      total += result.collected;
      failed += result.failed;
    }

    console.log(chalk.blue(`\n📊 수집 완료: ${total}개 컴포넌트`));
    if (failed > 0) {
      console.log(chalk.yellow(`   실패: ${failed}개`));
    }
  });

libraryCmd
  .command("list")
  .alias("ls")
  .description("라이브러리 컴포넌트 목록")
  .option("-c, --category <category>", "카테고리 필터")
  .option("-s, --source <source>", "소스 필터")
  .action(async (options) => {
    const curator = new LibraryCurator();
    const index = await curator.loadIndex();

    if (!index) {
      console.log(chalk.yellow("\n⚠️  라이브러리 인덱스가 없습니다."));
      console.log(chalk.gray("   해결: npx @axis-ds/cli library collect 명령어로 수집을 먼저 실행하세요.\n"));
      return;
    }

    let components = index.components;

    if (options.category) {
      components = components.filter((c) => c.category === options.category);
    }
    if (options.source) {
      components = components.filter((c) => c.source.type === options.source);
    }

    console.log(chalk.blue(`\n📦 Library Components (${components.length}개)\n`));

    // 카테고리별 그룹화
    const byCategory = new Map<string, typeof components>();
    for (const comp of components) {
      const cat = comp.category;
      if (!byCategory.has(cat)) {
        byCategory.set(cat, []);
      }
      byCategory.get(cat)!.push(comp);
    }

    for (const [category, items] of byCategory) {
      console.log(chalk.bold(`${category} (${items.length})`));
      for (const item of items.slice(0, 10)) {
        console.log(
          `  ${chalk.cyan(item.name.padEnd(25))} ${chalk.gray(item.source.type.padEnd(8))} ${chalk.gray(item.description.slice(0, 40))}`
        );
      }
      if (items.length > 10) {
        console.log(chalk.gray(`  ... 외 ${items.length - 10}개`));
      }
      console.log();
    }
  });

libraryCmd
  .command("search <query>")
  .alias("s")
  .description("컴포넌트 검색")
  .option("-c, --category <category>", "카테고리 필터")
  .option("-s, --source <source>", "소스 필터")
  .action(async (query, options) => {
    const curator = new LibraryCurator();
    const results = await curator.searchComponents(query, {
      category: options.category,
      source: options.source,
    });

    if (results.length === 0) {
      console.log(chalk.yellow(`\n'${query}'에 대한 검색 결과가 없습니다.\n`));
      return;
    }

    console.log(chalk.blue(`\n🔍 '${query}' 검색 결과 (${results.length}개)\n`));

    for (const comp of results.slice(0, 20)) {
      console.log(
        `  ${chalk.cyan(comp.name.padEnd(25))} ${chalk.gray(comp.source.type.padEnd(8))} ${chalk.gray(comp.category.padEnd(12))} ${chalk.gray(comp.description.slice(0, 30))}`
      );
    }

    if (results.length > 20) {
      console.log(chalk.gray(`\n  ... 외 ${results.length - 20}개`));
    }
    console.log();
  });

libraryCmd
  .command("stats")
  .description("라이브러리 통계")
  .action(async () => {
    const curator = new LibraryCurator();
    await curator.printStats();
  });

libraryCmd
  .command("publish")
  .description("사이트에 라이브러리 배치")
  .option("-o, --output <dir>", "출력 디렉토리", "apps/web/public/library")
  .option("--minify", "JSON 압축")
  .option("--clean", "기존 배치 정리 후 재배치")
  .action(async (options) => {
    const curator = new LibraryCurator();
    const publisher = new Publisher();

    const index = await curator.loadIndex();

    if (!index) {
      console.log(chalk.yellow("\n⚠️  라이브러리 인덱스가 없습니다."));
      console.log(chalk.gray("   해결: npx @axis-ds/cli library collect 명령어로 수집을 먼저 실행하세요.\n"));
      return;
    }

    console.log(chalk.blue("\n📤 Library 배치\n"));
    console.log(chalk.gray(`총 ${index.stats.total}개 컴포넌트\n`));

    // 기존 배치 정리
    if (options.clean) {
      await publisher.clean(options.output);
    }

    // 배치 실행
    const result = await publisher.publish(index, {
      outputDir: options.output,
      minify: options.minify,
      generateSearchIndex: true,
    });

    if (result.success) {
      console.log(chalk.green(`\n✓ 배치 완료`));
      console.log(chalk.gray(`  - 출력 디렉토리: ${result.outputDir}`));
      console.log(chalk.gray(`  - 생성된 파일: ${result.files.length}개`));
      console.log(chalk.gray(`  - 카테고리: ${result.stats.categoriesPublished}개`));
      console.log(chalk.gray(`  - 검색 인덱스: ${result.stats.searchIndexSize}개 항목`));
    } else {
      console.log(chalk.red(`\n✗ 배치 실패`));
      for (const error of result.errors) {
        console.log(chalk.red(`  - ${error}`));
      }
    }
    console.log();
  });

// ==========================================
// Sync 명령어
// ==========================================
registerSyncCommand(program);

// ==========================================
// Template 명령어
// ==========================================
registerTemplateCommand(program);
registerCheckCommand(program);

// ==========================================
// Theme 명령어 (브랜드)
// ==========================================
registerThemeCommand(program);

program.parse();
