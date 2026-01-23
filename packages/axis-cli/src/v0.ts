/**
 * V0 Integration 클라이언트
 *
 * V0 (https://v0.app) 생성 코드를 AXIS 프로젝트에 통합합니다.
 *
 * 사용법:
 *   axis-cli v0 convert <file>     # V0 코드를 AXIS 스타일로 변환
 *   axis-cli v0 import <url>       # V0 URL에서 가져오기
 *   axis-cli v0 setup              # GitHub 연동 안내
 */

import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import prompts from "prompts";

// V0 코드 변환 규칙
const V0_CONVERSION_RULES = [
  // import 경로 변환
  { from: /@\/components\/ui\//g, to: "@/components/ui/" },
  { from: /from ['"]@\/lib\/utils['"]/g, to: 'from "@/lib/utils"' },

  // shadcn 컴포넌트를 AXIS 컴포넌트로 매핑
  { from: /from ['"]@\/components\/ui\/button['"]/g, to: 'from "@axis-ds/ui-react/button"' },
  { from: /from ['"]@\/components\/ui\/card['"]/g, to: 'from "@axis-ds/ui-react/card"' },
  { from: /from ['"]@\/components\/ui\/input['"]/g, to: 'from "@axis-ds/ui-react/input"' },
  { from: /from ['"]@\/components\/ui\/badge['"]/g, to: 'from "@axis-ds/ui-react/badge"' },
  { from: /from ['"]@\/components\/ui\/dialog['"]/g, to: 'from "@axis-ds/ui-react/dialog"' },
  { from: /from ['"]@\/components\/ui\/select['"]/g, to: 'from "@axis-ds/ui-react/select"' },
  { from: /from ['"]@\/components\/ui\/tabs['"]/g, to: 'from "@axis-ds/ui-react/tabs"' },
  { from: /from ['"]@\/components\/ui\/label['"]/g, to: 'from "@axis-ds/ui-react/label"' },

  // Lucide 아이콘 유지
  { from: /from ['"]lucide-react['"]/g, to: 'from "lucide-react"' },
];

// V0 → AXIS 컴포넌트 매핑
const V0_TO_AXIS_MAPPING: Record<string, string> = {
  Button: "Button",
  Card: "Card",
  CardHeader: "CardHeader",
  CardTitle: "CardTitle",
  CardDescription: "CardDescription",
  CardContent: "CardContent",
  CardFooter: "CardFooter",
  Input: "Input",
  Label: "Label",
  Badge: "Badge",
  Dialog: "Dialog",
  DialogTrigger: "DialogTrigger",
  DialogContent: "DialogContent",
  DialogHeader: "DialogHeader",
  DialogTitle: "DialogTitle",
  DialogDescription: "DialogDescription",
  Select: "Select",
  SelectTrigger: "SelectTrigger",
  SelectContent: "SelectContent",
  SelectItem: "SelectItem",
  Tabs: "Tabs",
  TabsList: "TabsList",
  TabsTrigger: "TabsTrigger",
  TabsContent: "TabsContent",
};

export class V0Client {
  // V0 코드 변환
  async convertCode(code: string, options: { preserveImports?: boolean } = {}): Promise<string> {
    let result = code;

    // 변환 규칙 적용
    if (!options.preserveImports) {
      for (const rule of V0_CONVERSION_RULES) {
        result = result.replace(rule.from, rule.to);
      }
    }

    // cn 함수 import 확인 및 추가
    if (result.includes("cn(") && !result.includes('from "@/lib/utils"')) {
      result = `import { cn } from "@/lib/utils";\n${result}`;
    }

    return result;
  }

  // 파일 변환
  async convertFile(filePath: string, outputPath?: string): Promise<void> {
    const absolutePath = path.resolve(filePath);

    if (!(await fs.pathExists(absolutePath))) {
      console.log(chalk.red(`\n❌ 파일을 찾을 수 없습니다: ${filePath}\n`));
      return;
    }

    const content = await fs.readFile(absolutePath, "utf-8");
    const converted = await this.convertCode(content);

    const outPath = outputPath || absolutePath.replace(".tsx", ".axis.tsx");
    await fs.writeFile(outPath, converted);

    console.log(chalk.green(`\n✓ 변환 완료: ${outPath}\n`));

    // 변경 사항 요약
    this.showConversionSummary(content, converted);
  }

  // 변환 요약 출력
  private showConversionSummary(original: string, converted: string): void {
    const changes: string[] = [];

    // import 변경 감지
    if (original.includes("@/components/ui/") && converted.includes("@axis-ds/ui-react")) {
      changes.push("shadcn/ui → @axis-ds/ui-react import 변환");
    }

    if (changes.length > 0) {
      console.log(chalk.bold("변경 사항:"));
      changes.forEach((c) => console.log(chalk.gray(`  - ${c}`)));
      console.log();
    }

    console.log(chalk.yellow("확인 필요:"));
    console.log(chalk.gray("  - 커스텀 컴포넌트 import 경로"));
    console.log(chalk.gray("  - 프로젝트별 유틸리티 함수"));
    console.log(chalk.gray("  - 환경 변수 및 API 엔드포인트\n"));
  }

  // V0 URL에서 가져오기 안내
  async importFromUrl(): Promise<void> {
    console.log(chalk.blue("\n🔗 V0 URL에서 컴포넌트 가져오기\n"));

    console.log(chalk.yellow("V0는 직접 API를 제공하지 않습니다."));
    console.log(chalk.gray("다음 방법으로 코드를 가져올 수 있습니다:\n"));

    console.log(chalk.bold("방법 1: 웹에서 다운로드"));
    console.log(chalk.gray("  1. v0.app에서 프로젝트 열기"));
    console.log(chalk.gray("  2. 우측 상단 '...' 메뉴 클릭"));
    console.log(chalk.gray("  3. 'Download' 선택 (ZIP 파일)\n"));

    console.log(chalk.bold("방법 2: GitHub 동기화"));
    console.log(chalk.gray("  1. v0.app에서 'Push to GitHub' 클릭"));
    console.log(chalk.gray("  2. 저장소 선택 또는 생성"));
    console.log(chalk.gray("  3. git clone으로 로컬에 가져오기\n"));

    console.log(chalk.bold("방법 3: 코드 복사"));
    console.log(chalk.gray("  1. v0.app에서 코드 탭 열기"));
    console.log(chalk.gray("  2. 파일별로 코드 복사"));
    console.log(chalk.gray("  3. axis-cli v0 convert로 변환\n"));

    const { method } = await prompts({
      type: "select",
      name: "method",
      message: "어떤 방법을 사용하시겠습니까?",
      choices: [
        { title: "GitHub에서 클론", value: "github" },
        { title: "다운로드한 ZIP 파일 변환", value: "zip" },
        { title: "클립보드에서 변환", value: "clipboard" },
        { title: "취소", value: "cancel" },
      ],
    });

    switch (method) {
      case "github":
        await this.setupGitHubSync();
        break;
      case "zip":
        await this.convertFromZip();
        break;
      case "clipboard":
        await this.convertFromClipboard();
        break;
    }
  }

  // GitHub 동기화 설정
  async setupGitHubSync(): Promise<void> {
    console.log(chalk.blue("\n🔄 V0 → GitHub 동기화 설정\n"));

    console.log(chalk.bold("1. V0에서 GitHub 연결:"));
    console.log(chalk.cyan("   https://v0.app/settings/github\n"));

    console.log(chalk.bold("2. 프로젝트 Push:"));
    console.log(chalk.gray("   V0 프로젝트에서 'Push to GitHub' 버튼 클릭\n"));

    console.log(chalk.bold("3. 로컬에서 클론:"));
    console.log(chalk.cyan("   git clone https://github.com/your-org/v0-project.git\n"));

    console.log(chalk.bold("4. AXIS 변환:"));
    console.log(chalk.cyan("   axis-cli v0 convert ./v0-project/components/*.tsx\n"));

    console.log(chalk.gray("팁: GitHub Actions로 자동 변환 워크플로도 설정 가능합니다.\n"));
  }

  // ZIP 파일에서 변환
  async convertFromZip(): Promise<void> {
    console.log(chalk.blue("\n📦 ZIP 파일에서 변환\n"));

    const { zipPath } = await prompts({
      type: "text",
      name: "zipPath",
      message: "다운로드한 ZIP 파일 경로:",
      validate: (v) => (v.length > 0 ? true : "경로를 입력하세요"),
    });

    if (!zipPath) return;

    console.log(chalk.yellow("\nZIP 변환 기능은 추후 구현 예정입니다."));
    console.log(chalk.gray("현재는 수동으로 압축 해제 후 convert 명령어를 사용하세요:\n"));
    console.log(chalk.cyan("  unzip v0-project.zip -d ./v0-project"));
    console.log(chalk.cyan("  axis-cli v0 convert ./v0-project/components/*.tsx\n"));
  }

  // 클립보드에서 변환
  async convertFromClipboard(): Promise<void> {
    console.log(chalk.blue("\n📋 클립보드에서 V0 코드 변환\n"));

    const { componentName } = await prompts({
      type: "text",
      name: "componentName",
      message: "컴포넌트 이름 (예: hero-section):",
      validate: (v) => (v.length > 0 ? true : "이름을 입력하세요"),
    });

    if (!componentName) return;

    console.log(chalk.gray("\nV0에서 복사한 코드를 붙여넣으세요."));
    console.log(chalk.gray("(입력 완료 후 빈 줄에서 Enter 두 번)\n"));

    const { code } = await prompts({
      type: "text",
      name: "code",
      message: "코드:",
    });

    if (!code) {
      console.log(chalk.yellow("\n코드가 입력되지 않았습니다."));
      return;
    }

    // 변환
    const converted = await this.convertCode(code);

    // 저장
    const outputDir = "./src/components/v0";
    const fileName = `${componentName}.tsx`;
    const filePath = path.join(outputDir, fileName);

    await fs.ensureDir(outputDir);
    await fs.writeFile(filePath, converted);

    console.log(chalk.green(`\n✓ ${filePath} 저장 완료`));
    this.showConversionSummary(code, converted);
  }

  // 변환 가이드 출력
  showGuide(): void {
    console.log(chalk.blue("\n📖 V0 → AXIS 변환 가이드\n"));

    console.log(chalk.bold("1. Import 변환"));
    console.log(chalk.gray("   V0 (shadcn/ui):"));
    console.log(chalk.red('     import { Button } from "@/components/ui/button"'));
    console.log(chalk.gray("   AXIS:"));
    console.log(chalk.green('     import { Button } from "@axis-ds/ui-react/button"\n'));

    console.log(chalk.bold("2. 호환 컴포넌트"));
    console.log(chalk.gray("   Button, Card, Input, Badge, Dialog, Select, Tabs, Label"));
    console.log(chalk.gray("   → 동일한 props 인터페이스 유지\n"));

    console.log(chalk.bold("3. 스타일 변환"));
    console.log(chalk.gray("   Tailwind CSS 클래스는 그대로 사용 가능"));
    console.log(chalk.gray("   AXIS 테마 변수는 자동 적용\n"));

    console.log(chalk.bold("4. Agentic UI 확장"));
    console.log(chalk.gray("   AI/LLM 관련 UI에는 @axis-ds/agentic-ui 사용:"));
    console.log(chalk.cyan("     import { StreamingText } from '@axis-ds/agentic-ui'\n"));

    console.log(chalk.bold("5. 자동 변환"));
    console.log(chalk.cyan("   axis-cli v0 convert <file.tsx>\n"));
  }
}

// V0 관련 유틸리티
export function getV0Url(path: string = ""): string {
  return `https://v0.app${path}`;
}

export function isV0Code(code: string): boolean {
  return (
    code.includes("@/components/ui/") ||
    code.includes("shadcn") ||
    code.includes("from 'lucide-react'")
  );
}
