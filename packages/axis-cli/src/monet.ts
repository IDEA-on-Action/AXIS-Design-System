/**
 * Monet Registry 클라이언트
 *
 * Monet (https://monet.design) 컴포넌트를 검색하고 AXIS 프로젝트에 가져옵니다.
 *
 * 사용법:
 *   npx @axis-ds/cli monet list              # 카테고리 목록
 *   npx @axis-ds/cli monet search <query>    # 컴포넌트 검색
 *   npx @axis-ds/cli monet add <id>          # 컴포넌트 추가
 */

import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { ask, failNonInteractive, isInteractive } from "./interactive.js";

// Monet 카테고리 목록
export const MONET_CATEGORIES = [
  { id: "hero", name: "Hero Sections", count: 120 },
  { id: "feature", name: "Feature Sections", count: 191 },
  { id: "testimonial", name: "Testimonials", count: 47 },
  { id: "pricing", name: "Pricing Tables", count: 35 },
  { id: "cta", name: "Call to Action", count: 42 },
  { id: "stats", name: "Statistics", count: 28 },
  { id: "footer", name: "Footers", count: 38 },
  { id: "header", name: "Headers/Navigation", count: 45 },
  { id: "logo-cloud", name: "Logo Clouds", count: 22 },
  { id: "team", name: "Team Sections", count: 31 },
  { id: "faq", name: "FAQ Sections", count: 24 },
  { id: "contact", name: "Contact Forms", count: 29 },
  { id: "newsletter", name: "Newsletter", count: 18 },
  { id: "landing", name: "Full Landing Pages", count: 28 },
] as const;

// Monet 컴포넌트 인터페이스
export interface MonetComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  preview: string;
  tags: string[];
  code?: string;
}

// Monet API 클라이언트
export class MonetClient {
  private apiKey: string | undefined;
  private baseUrl = "https://www.monet.design";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.MONET_API_KEY;
  }

  // 카테고리 목록 출력
  async listCategories(): Promise<void> {
    console.log(chalk.blue("\n🎨 Monet Design 카테고리\n"));
    console.log(chalk.gray("https://monet.design - 1000+ React UI 컴포넌트\n"));

    for (const cat of MONET_CATEGORIES) {
      console.log(
        `  ${chalk.cyan(cat.id.padEnd(15))} ${cat.name.padEnd(25)} ${chalk.gray(`(${cat.count}개)`)}`
      );
    }

    console.log(chalk.gray("\n사용법:"));
    console.log(chalk.gray("  npx @axis-ds/cli monet browse <category>  # 카테고리 컴포넌트 보기"));
    console.log(chalk.gray("  npx @axis-ds/cli monet search <query>     # 컴포넌트 검색\n"));
  }

  // 컴포넌트 검색 (웹 URL 안내)
  async searchComponents(query: string): Promise<void> {
    console.log(chalk.blue(`\n🔍 "${query}" 검색 중...\n`));

    const searchUrl = `${this.baseUrl}/c?q=${encodeURIComponent(query)}`;

    console.log(chalk.yellow("Monet은 직접 API를 제공하지 않습니다."));
    console.log(chalk.gray("다음 방법으로 컴포넌트를 가져올 수 있습니다:\n"));

    console.log(chalk.bold("1. 웹에서 검색:"));
    console.log(chalk.cyan(`   ${searchUrl}\n`));

    console.log(chalk.bold("2. MCP 연동 (Claude Code):"));
    console.log(chalk.gray("   .claude/mcp.json에 monet 서버 활성화 후"));
    console.log(chalk.cyan('   "monet에서 hero 컴포넌트 찾아줘"'));
    console.log(chalk.gray("   → API 키 필요: https://monet.design/mcp\n"));

    console.log(chalk.bold("3. 수동 복사-붙여넣기:"));
    console.log(chalk.gray("   웹에서 컴포넌트 선택 → Copy Code → 프로젝트에 붙여넣기\n"));
  }

  // 카테고리별 컴포넌트 브라우징
  async browseCategory(category: string): Promise<void> {
    const cat = MONET_CATEGORIES.find((c) => c.id === category);

    if (!cat) {
      console.log(chalk.red(`\n❌ '${category}' 카테고리를 찾을 수 없습니다.\n`));
      console.log(chalk.gray("사용 가능한 카테고리:"));
      MONET_CATEGORIES.forEach((c) => console.log(chalk.cyan(`  ${c.id}`)));
      return;
    }

    console.log(chalk.blue(`\n📂 ${cat.name} (${cat.count}개 컴포넌트)\n`));

    const browseUrl = `${this.baseUrl}/c?category=${category}`;

    console.log(chalk.gray("웹에서 컴포넌트를 확인하세요:"));
    console.log(chalk.cyan(`${browseUrl}\n`));

    // 인기 컴포넌트 예시
    console.log(chalk.bold("인기 컴포넌트 예시:"));
    const examples = this.getCategoryExamples(category);
    examples.forEach((ex) => {
      console.log(`  ${chalk.cyan(ex.id.padEnd(30))} ${chalk.gray(ex.desc)}`);
    });

    console.log(chalk.gray("\n컴포넌트 가져오기:"));
    console.log(chalk.gray("  1. 웹에서 컴포넌트 선택"));
    console.log(chalk.gray("  2. Copy Code 버튼 클릭"));
    console.log(chalk.gray("  3. npx @axis-ds/cli monet import 실행\n"));
  }

  // 카테고리별 예시 컴포넌트
  private getCategoryExamples(category: string): { id: string; desc: string }[] {
    const examples: Record<string, { id: string; desc: string }[]> = {
      hero: [
        { id: "hero-with-image", desc: "이미지 배경 히어로" },
        { id: "hero-centered", desc: "중앙 정렬 히어로" },
        { id: "hero-split", desc: "분할 레이아웃 히어로" },
      ],
      feature: [
        { id: "feature-grid", desc: "그리드 형식 기능 소개" },
        { id: "feature-alternating", desc: "교차 레이아웃 기능" },
        { id: "feature-icons", desc: "아이콘 기반 기능" },
      ],
      pricing: [
        { id: "pricing-three-tiers", desc: "3단 요금제" },
        { id: "pricing-comparison", desc: "비교 테이블 요금제" },
        { id: "pricing-toggle", desc: "월/연 토글 요금제" },
      ],
      landing: [
        { id: "deepcon-ai-landing", desc: "AI SaaS 랜딩페이지" },
        { id: "saas-landing", desc: "SaaS 스타터 랜딩" },
        { id: "agency-landing", desc: "에이전시 랜딩페이지" },
      ],
    };

    return examples[category] || [{ id: `${category}-basic`, desc: "기본 템플릿" }];
  }

  // 클립보드에서 Monet 코드 가져오기
  /** opts.interactive: 질문을 띄울 수 있는지(WI-0075). 없으면 stdin 이 TTY 인지로 정합니다 */
  async importFromClipboard(opts: { interactive?: boolean } = {}): Promise<void> {
    console.log(chalk.blue("\n📋 클립보드에서 Monet 컴포넌트 가져오기\n"));

    console.log(chalk.yellow("준비 단계:"));
    console.log(chalk.gray("  1. monet.design에서 컴포넌트 선택"));
    console.log(chalk.gray("  2. 'Copy Code' 버튼으로 코드 복사"));
    console.log(chalk.gray("  3. 이 명령어 실행\n"));

    // 이름 · 붙여 넣을 코드에 기본값이 없어 비대화형이면 rc 1(WI-0075 D4)
    const interactive = opts.interactive ?? isInteractive();
    if (!interactive) {
      failNonInteractive("컴포넌트 이름과 붙여 넣을 코드를 물을 수 없습니다. 아무것도 쓰지 않았습니다.", [
        "대화형 터미널에서 다시 실행하세요: axis monet import",
      ]);
      return;
    }
    const { componentName } = await ask(
      {
        type: "text",
        name: "componentName",
        message: "컴포넌트 이름 (예: hero-section):",
        validate: (v) => (v.length > 0 ? true : "이름을 입력하세요"),
      },
      interactive
    );

    if (!componentName) return;

    const { componentCode } = await ask(
      {
        type: "text",
        name: "componentCode",
        message: "복사한 코드를 붙여넣으세요 (한 줄로):",
      },
      interactive
    );

    if (!componentCode) {
      console.log(chalk.yellow("\n코드가 입력되지 않았습니다."));
      return;
    }

    // 설정 파일 확인
    const configPath = path.resolve("axis.config.json");
    let componentsDir = "./src/components/monet";

    if (await fs.pathExists(configPath)) {
      const config = await fs.readJSON(configPath);
      componentsDir = config.monetDir || path.join(path.dirname(config.componentsDir), "monet");
    }

    // 파일 저장
    const fileName = `${componentName}.tsx`;
    const filePath = path.join(componentsDir, fileName);

    await fs.ensureDir(componentsDir);
    await fs.writeFile(filePath, componentCode);

    console.log(chalk.green(`\n✓ ${filePath} 저장 완료`));
    console.log(chalk.gray("\n다음 단계:"));
    console.log(chalk.gray("  1. 파일을 열어 import 경로 수정"));
    console.log(chalk.gray("  2. 필요한 의존성 설치 (pnpm add ...)"));
    console.log(chalk.gray("  3. 컴포넌트 사용\n"));
  }
}

// Monet 관련 유틸리티
export function getMonetUrl(path: string): string {
  return `https://monet.design${path}`;
}

export function getMonetMcpConfig(): object {
  return {
    monet: {
      url: "https://www.monet.design/api/remote/mcp",
      headers: {
        Authorization: "Bearer ${MONET_API_KEY}",
      },
    },
  };
}
