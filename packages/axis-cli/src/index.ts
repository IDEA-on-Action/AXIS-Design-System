#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import prompts from "prompts";
import { MonetClient, MONET_CATEGORIES } from "./monet.js";
import { V0Client } from "./v0.js";
import { LibraryCurator, Publisher } from "./library/index.js";
import { registerSyncCommand } from "./sync/index.js";
import { registerTemplateCommand, registerCheckCommand } from "./template/index.js";

const REGISTRY_URL = process.env.AXIS_REGISTRY_URL || "https://axis.minu.best/r";

interface ComponentInfo {
  name: string;
  type: "ui" | "agentic";
  description: string;
  dependencies: string[];
  files: { path: string; content: string }[];
}

const program = new Command();

program
  .name("axis")
  .description("AXIS Design System CLI - shadcn 호환 컴포넌트 설치 도구")
  .version("0.1.0");

// init 명령어
program
  .command("init")
  .description("프로젝트에 AXIS Design System 초기화")
  .option("-y, --yes", "기본값으로 자동 설정")
  .action(async (options) => {
    console.log(chalk.blue("\n🎨 AXIS Design System 초기화\n"));

    const config = options.yes
      ? {
          componentsDir: "./src/components/ui",
          tailwindConfig: "./tailwind.config.ts",
          globalCss: "./src/app/globals.css",
        }
      : await prompts([
          {
            type: "text",
            name: "componentsDir",
            message: "컴포넌트 디렉토리:",
            initial: "./src/components/ui",
          },
          {
            type: "text",
            name: "tailwindConfig",
            message: "Tailwind 설정 파일:",
            initial: "./tailwind.config.ts",
          },
          {
            type: "text",
            name: "globalCss",
            message: "글로벌 CSS 파일:",
            initial: "./src/app/globals.css",
          },
        ]);

    // axis.config.json 생성
    const axisConfig = {
      $schema: "https://axis.minu.best/schema.json",
      componentsDir: config.componentsDir,
      tailwindConfig: config.tailwindConfig,
      globalCss: config.globalCss,
      registry: REGISTRY_URL,
    };

    await fs.writeJSON("axis.config.json", axisConfig, { spaces: 2 });
    console.log(chalk.green("✓ axis.config.json 생성 완료"));

    // utils.ts 생성
    const utilsPath = path.join(config.componentsDir, "utils.ts");
    await fs.ensureDir(path.dirname(utilsPath));
    await fs.writeFile(
      utilsPath,
      `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`
    );
    console.log(chalk.green("✓ utils.ts 생성 완료"));

    console.log(chalk.blue("\n초기화 완료! 이제 다음 명령어로 컴포넌트를 추가하세요:"));
    console.log(chalk.cyan("  npx axis-cli add button\n"));
  });

// add 명령어
program
  .command("add <component>")
  .description("컴포넌트 추가")
  .option("--agentic", "Agentic UI 컴포넌트 추가")
  .option("-y, --yes", "확인 없이 덮어쓰기")
  .action(async (component, options) => {
    const spinner = ora(`${component} 컴포넌트 가져오는 중...`).start();

    try {
      // 설정 파일 읽기
      const configPath = path.resolve("axis.config.json");
      if (!(await fs.pathExists(configPath))) {
        spinner.fail(
          "axis.config.json을 찾을 수 없습니다.\n" +
          "  해결: 프로젝트 루트에서 'npx @axis-ds/cli init'을 실행하세요.\n" +
          "  참고: https://axis.minu.best/docs/guides/quick-start"
        );
        process.exit(1);
      }

      const config = await fs.readJSON(configPath);
      const category = options.agentic ? "agentic" : "ui";

      // Registry에서 컴포넌트 정보 가져오기 (로컬 폴백)
      const componentInfo = await getComponentInfo(component, category);

      if (!componentInfo) {
        spinner.fail(
          `'${component}' 컴포넌트를 찾을 수 없습니다.\n` +
          "  사용 가능한 컴포넌트 목록: npx @axis-ds/cli list\n" +
          "  Agentic UI 컴포넌트는 --agentic 옵션을 추가하세요."
        );
        process.exit(1);
      }

      spinner.text = `${component} 컴포넌트 설치 중...`;

      // 컴포넌트 파일 생성
      for (const file of componentInfo.files) {
        const filePath = path.join(config.componentsDir, file.path);

        if (await fs.pathExists(filePath)) {
          if (!options.yes) {
            const { overwrite } = await prompts({
              type: "confirm",
              name: "overwrite",
              message: `${file.path}이(가) 이미 존재합니다. 덮어쓰시겠습니까?`,
              initial: false,
            });
            if (!overwrite) continue;
          }
        }

        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, file.content);
      }

      spinner.succeed(chalk.green(`${component} 컴포넌트 추가 완료`));

      // 의존성 안내
      if (componentInfo.dependencies.length > 0) {
        console.log(chalk.yellow("\n필요한 의존성:"));
        console.log(chalk.cyan(`  pnpm add ${componentInfo.dependencies.join(" ")}`));
      }
    } catch (error) {
      spinner.fail(
        `컴포넌트 추가 중 오류 발생: ${(error as Error).message}\n` +
        "  네트워크 문제인 경우 인터넷 연결을 확인하세요.\n" +
        "  문제가 지속되면 GitHub 이슈를 생성해 주세요: https://github.com/IDEA-on-Action/AXIS-Design-System/issues"
      );
      process.exit(1);
    }
  });

// list 명령어
program
  .command("list")
  .description("사용 가능한 컴포넌트 목록")
  .option("--category <type>", "카테고리 필터 (ui, agentic)")
  .action(async (options) => {
    console.log(chalk.blue("\n📦 AXIS Design System 컴포넌트\n"));

    const components = {
      ui: [
        { name: "button", description: "기본 버튼 컴포넌트" },
        { name: "input", description: "텍스트 입력 필드" },
        { name: "card", description: "카드 컨테이너" },
        { name: "dialog", description: "모달 다이얼로그" },
        { name: "badge", description: "뱃지/태그" },
        { name: "select", description: "선택 드롭다운" },
        { name: "tabs", description: "탭 네비게이션" },
        { name: "toast", description: "알림 토스트" },
        { name: "label", description: "폼 라벨" },
        { name: "separator", description: "구분선" },
      ],
      agentic: [
        { name: "run-progress", description: "에이전트 실행 진행률" },
        { name: "step-timeline", description: "단계별 타임라인" },
        { name: "approval-card", description: "사용자 승인 요청" },
        { name: "streaming-text", description: "실시간 텍스트 스트리밍" },
        { name: "tool-call-card", description: "도구 호출 표시" },
        { name: "source-panel", description: "AI 근거/출처 표시" },
        { name: "thinking-indicator", description: "생각 중 표시" },
        { name: "recovery-banner", description: "오류 복구 안내" },
        { name: "agent-avatar", description: "에이전트 아바타" },
        { name: "surface-renderer", description: "동적 Surface 렌더링" },
      ],
    };

    const showCategory = (category: "ui" | "agentic", items: typeof components.ui) => {
      console.log(chalk.bold(category === "ui" ? "Core UI" : "Agentic UI"));
      items.forEach((c) => {
        console.log(`  ${chalk.cyan(c.name.padEnd(20))} ${chalk.gray(c.description)}`);
      });
      console.log();
    };

    if (!options.category || options.category === "ui") {
      showCategory("ui", components.ui);
    }
    if (!options.category || options.category === "agentic") {
      showCategory("agentic", components.agentic);
    }

    console.log(chalk.gray("사용법: npx axis-cli add <component-name>"));
    console.log(chalk.gray("Agentic: npx axis-cli add <component-name> --agentic\n"));
  });

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

// 컴포넌트 정보 가져오기 (로컬 폴백 포함)
async function getComponentInfo(name: string, category: string): Promise<ComponentInfo | null> {
  // 로컬 컴포넌트 템플릿
  const localComponents: Record<string, ComponentInfo> = {
    button: {
      name: "button",
      type: "ui",
      description: "Primary button component",
      dependencies: ["@radix-ui/react-slot", "class-variance-authority", "clsx", "tailwind-merge"],
      files: [
        {
          path: "button.tsx",
          content: `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
`,
        },
      ],
    },
  };

  return localComponents[name] || null;
}

program.parse();
