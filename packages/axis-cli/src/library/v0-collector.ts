/**
 * Library Curator - V0 Collector
 *
 * V0 (https://v0.app) 생성 코드를 수집합니다.
 * V0는 공개 API가 없으므로 로컬 디렉토리 또는 GitHub 저장소에서 수집합니다.
 */

import fs from "fs-extra";
import path from "path";
import type {
  ComponentMeta,
  ComponentListItem,
  CodeFile,
} from "./types.js";
import { BaseCollector } from "./base-collector.js";

// V0 코드 패턴 (shadcn/ui 기반)
const V0_PATTERNS = [
  /@\/components\/ui\//,
  /from ['"]@\/lib\/utils['"]/,
  /from ['"]lucide-react['"]/,
];

export class V0Collector extends BaseCollector {
  readonly sourceType = "v0" as const;

  private v0Directory: string;
  private convertToAxis: boolean;

  constructor(options: { directory?: string; convertToAxis?: boolean } = {}) {
    super();
    this.v0Directory = options.directory || "./src/components/v0";
    this.convertToAxis = options.convertToAxis ?? true;
  }

  /**
   * V0 디렉토리에서 컴포넌트 목록 조회
   */
  async listComponents(): Promise<ComponentListItem[]> {
    const items: ComponentListItem[] = [];

    // V0 디렉토리 확인
    if (!(await fs.pathExists(this.v0Directory))) {
      return items;
    }

    // .tsx 파일 스캔
    const files = await this.scanDirectory(this.v0Directory);

    for (const file of files) {
      const content = await fs.readFile(file, "utf-8");

      // V0 코드인지 확인
      if (this.isV0Code(content)) {
        const name = path.basename(file, path.extname(file));
        const relativePath = path.relative(this.v0Directory, file);

        items.push({
          id: `v0-${this.generateSlug(name)}`,
          name: this.formatName(name),
          description: this.extractDescription(content) || `V0 generated ${name} component`,
          category: this.classifyCategory(name, content),
          source: "v0",
        });
      }
    }

    return items;
  }

  /**
   * 단일 컴포넌트 수집
   */
  async collectComponent(id: string): Promise<ComponentMeta> {
    const slug = id.replace("v0-", "");
    const files = await this.findComponentFiles(slug);

    if (files.length === 0) {
      throw new Error(`V0 component not found: ${slug}`);
    }

    // 코드 파일 로드
    const codeFiles: CodeFile[] = [];
    for (const filePath of files) {
      let content = await fs.readFile(filePath, "utf-8");

      // AXIS 스타일로 변환
      if (this.convertToAxis) {
        content = this.convertCode(content);
      }

      codeFiles.push({
        path: path.relative(this.v0Directory, filePath),
        content,
        type: this.getFileType(filePath),
      });
    }

    const mainContent = codeFiles.map((f) => f.content).join("\n");
    const name = this.formatName(slug);

    return this.createBaseMeta(
      name,
      this.extractDescription(mainContent) || `V0 generated ${name} component`,
      codeFiles,
      {
        registry: "@v0",
        url: "https://v0.app",
      }
    );
  }

  /**
   * V0 코드인지 확인
   */
  private isV0Code(code: string): boolean {
    return V0_PATTERNS.some((pattern) => pattern.test(code));
  }

  /**
   * V0 코드를 AXIS 스타일로 변환
   */
  private convertCode(code: string): string {
    let result = code;

    // import 경로 변환
    const conversions = [
      { from: /@\/components\/ui\/button/g, to: "@axis-ds/ui-react/button" },
      { from: /@\/components\/ui\/card/g, to: "@axis-ds/ui-react/card" },
      { from: /@\/components\/ui\/input/g, to: "@axis-ds/ui-react/input" },
      { from: /@\/components\/ui\/badge/g, to: "@axis-ds/ui-react/badge" },
      { from: /@\/components\/ui\/dialog/g, to: "@axis-ds/ui-react/dialog" },
      { from: /@\/components\/ui\/select/g, to: "@axis-ds/ui-react/select" },
      { from: /@\/components\/ui\/tabs/g, to: "@axis-ds/ui-react/tabs" },
      { from: /@\/components\/ui\/label/g, to: "@axis-ds/ui-react/label" },
      { from: /@\/components\/ui\/separator/g, to: "@axis-ds/ui-react/separator" },
      { from: /@\/components\/ui\/toast/g, to: "@axis-ds/ui-react/toast" },
      // 일반 패턴
      { from: /@\/components\/ui\/([a-z-]+)/g, to: "@axis-ds/ui-react/$1" },
    ];

    for (const { from, to } of conversions) {
      result = result.replace(from, to);
    }

    // cn 함수 import 확인 및 추가
    if (result.includes("cn(") && !result.includes('from "@/lib/utils"')) {
      result = `import { cn } from "@/lib/utils";\n${result}`;
    }

    return result;
  }

  /**
   * 디렉토리 스캔
   */
  private async scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // node_modules, .git 등 제외
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          files.push(...(await this.scanDirectory(fullPath)));
        }
      } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * 컴포넌트 파일 찾기
   */
  private async findComponentFiles(slug: string): Promise<string[]> {
    const files: string[] = [];
    const possiblePaths = [
      path.join(this.v0Directory, `${slug}.tsx`),
      path.join(this.v0Directory, slug, `index.tsx`),
      path.join(this.v0Directory, slug, `${slug}.tsx`),
    ];

    for (const filePath of possiblePaths) {
      if (await fs.pathExists(filePath)) {
        files.push(filePath);

        // 같은 디렉토리의 관련 파일도 포함
        const dir = path.dirname(filePath);
        if (dir !== this.v0Directory) {
          const dirFiles = await fs.readdir(dir);
          for (const f of dirFiles) {
            if ((f.endsWith(".tsx") || f.endsWith(".ts")) && !files.includes(path.join(dir, f))) {
              files.push(path.join(dir, f));
            }
          }
        }

        break;
      }
    }

    return files;
  }

  /**
   * 설명 추출 (JSDoc 주석에서)
   */
  private extractDescription(code: string): string | undefined {
    // JSDoc 주석에서 설명 추출
    const jsdocMatch = code.match(/\/\*\*\s*\n\s*\*\s*(.+)\n/);
    if (jsdocMatch) {
      return jsdocMatch[1].trim();
    }

    // 첫 번째 라인 주석에서 추출
    const commentMatch = code.match(/^\/\/\s*(.+)$/m);
    if (commentMatch) {
      return commentMatch[1].trim();
    }

    return undefined;
  }

  /**
   * 이름 포맷팅
   */
  private formatName(slug: string): string {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * 파일 타입 추론
   */
  private getFileType(filePath: string): CodeFile["type"] {
    const name = path.basename(filePath);
    if (name.startsWith("use") || name.includes("hook")) return "hook";
    if (name.includes("util") || name.includes("lib")) return "util";
    if (name.endsWith(".css")) return "style";
    if (name.endsWith(".d.ts") || name.includes("types")) return "type";
    return "component";
  }

  /**
   * V0 디렉토리 설정
   */
  setDirectory(directory: string): void {
    this.v0Directory = directory;
  }

  /**
   * AXIS 변환 설정
   */
  setConvertToAxis(convert: boolean): void {
    this.convertToAxis = convert;
  }
}
