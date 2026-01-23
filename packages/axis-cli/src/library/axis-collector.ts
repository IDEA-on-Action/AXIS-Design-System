/**
 * Library Curator - AXIS Collector
 *
 * AXIS Design System 내부 컴포넌트를 수집합니다.
 * packages/ 및 apps/web/src/app/ 디렉토리에서 컴포넌트를 스캔합니다.
 */

import fs from "fs-extra";
import path from "path";
import type {
  ComponentMeta,
  ComponentListItem,
  CodeFile,
  ComponentCategory,
} from "./types.js";
import { BaseCollector } from "./base-collector.js";

// AXIS 컴포넌트 경로 설정
interface AxisPaths {
  uiReact: string;
  agenticUi: string;
  webComponents: string;
  webAgentic: string;
}

// 기본 경로
const DEFAULT_PATHS: AxisPaths = {
  uiReact: "packages/axis-ui-react/src",
  agenticUi: "packages/axis-agentic-ui/src",
  webComponents: "apps/web/src/app/components",
  webAgentic: "apps/web/src/app/agentic",
};

export class AxisCollector extends BaseCollector {
  readonly sourceType = "axis" as const;

  private rootDir: string;
  private paths: AxisPaths;

  constructor(options: { rootDir?: string; paths?: Partial<AxisPaths> } = {}) {
    super();
    this.rootDir = options.rootDir || process.cwd();
    this.paths = { ...DEFAULT_PATHS, ...options.paths };
  }

  /**
   * AXIS 컴포넌트 목록 조회
   */
  async listComponents(): Promise<ComponentListItem[]> {
    const items: ComponentListItem[] = [];

    // UI React 패키지 스캔
    items.push(...(await this.scanPackage(this.paths.uiReact, "ui", "@axis-ds/ui-react")));

    // Agentic UI 패키지 스캔
    items.push(...(await this.scanPackage(this.paths.agenticUi, "agentic", "@axis-ds/agentic-ui")));

    // Web 컴포넌트 스캔
    items.push(...(await this.scanWebDirectory(this.paths.webComponents, "ui")));

    // Web Agentic 스캔
    items.push(...(await this.scanWebDirectory(this.paths.webAgentic, "agentic")));

    // 중복 제거
    const uniqueItems = new Map<string, ComponentListItem>();
    for (const item of items) {
      if (!uniqueItems.has(item.id)) {
        uniqueItems.set(item.id, item);
      }
    }

    return [...uniqueItems.values()];
  }

  /**
   * 단일 컴포넌트 수집
   */
  async collectComponent(id: string): Promise<ComponentMeta> {
    const slug = id.replace("axis-", "");

    // 컴포넌트 파일 찾기
    const componentInfo = await this.findComponent(slug);

    if (!componentInfo) {
      throw new Error(`AXIS component not found: ${slug}`);
    }

    // 코드 파일 로드
    const codeFiles: CodeFile[] = [];
    for (const filePath of componentInfo.files) {
      const content = await fs.readFile(filePath, "utf-8");
      codeFiles.push({
        path: path.relative(componentInfo.baseDir, filePath),
        content,
        type: this.getFileType(filePath),
      });
    }

    const mainContent = codeFiles.map((f) => f.content).join("\n");

    const meta = this.createBaseMeta(
      componentInfo.name,
      this.extractDescription(mainContent) || `AXIS ${componentInfo.name} component`,
      codeFiles,
      {
        registry: "@axis",
        url: this.getDocsUrl(slug, componentInfo.category),
      }
    );

    // 카테고리 오버라이드
    meta.category = componentInfo.category;

    return meta;
  }

  /**
   * 패키지 디렉토리 스캔
   */
  private async scanPackage(
    packagePath: string,
    defaultCategory: ComponentCategory,
    registry: string
  ): Promise<ComponentListItem[]> {
    const items: ComponentListItem[] = [];
    const fullPath = path.join(this.rootDir, packagePath);

    if (!(await fs.pathExists(fullPath))) {
      return items;
    }

    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // 디렉토리인 경우 컴포넌트로 간주
        const componentDir = path.join(fullPath, entry.name);
        const indexFile = path.join(componentDir, "index.tsx");

        if (await fs.pathExists(indexFile)) {
          const content = await fs.readFile(indexFile, "utf-8");
          const name = this.formatName(entry.name);

          items.push({
            id: `axis-${entry.name}`,
            name,
            description: this.extractDescription(content) || `AXIS ${name} component`,
            category: this.classifyCategory(entry.name, content) || defaultCategory,
            source: "axis",
          });
        }
      } else if (entry.name.endsWith(".tsx") && entry.name !== "index.tsx") {
        // 단일 파일 컴포넌트
        const name = entry.name.replace(".tsx", "");
        const filePath = path.join(fullPath, entry.name);
        const content = await fs.readFile(filePath, "utf-8");

        items.push({
          id: `axis-${name}`,
          name: this.formatName(name),
          description: this.extractDescription(content) || `AXIS ${name} component`,
          category: this.classifyCategory(name, content) || defaultCategory,
          source: "axis",
        });
      }
    }

    return items;
  }

  /**
   * Web 디렉토리 스캔 (app router 구조)
   */
  private async scanWebDirectory(
    webPath: string,
    defaultCategory: ComponentCategory
  ): Promise<ComponentListItem[]> {
    const items: ComponentListItem[] = [];
    const fullPath = path.join(this.rootDir, webPath);

    if (!(await fs.pathExists(fullPath))) {
      return items;
    }

    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // app router의 각 디렉토리는 페이지/컴포넌트
        const componentDir = path.join(fullPath, entry.name);
        const pageFile = path.join(componentDir, "page.tsx");

        if (await fs.pathExists(pageFile)) {
          const content = await fs.readFile(pageFile, "utf-8");
          const name = this.formatName(entry.name);

          items.push({
            id: `axis-${entry.name}`,
            name,
            description: this.extractDescription(content) || `AXIS ${name} component`,
            category: this.classifyCategory(entry.name, content) || defaultCategory,
            source: "axis",
          });
        }
      }
    }

    return items;
  }

  /**
   * 컴포넌트 찾기
   */
  private async findComponent(
    slug: string
  ): Promise<{ name: string; files: string[]; baseDir: string; category: ComponentCategory } | null> {
    // 검색 경로 목록
    const searchPaths = [
      { base: this.paths.uiReact, category: "ui" as ComponentCategory },
      { base: this.paths.agenticUi, category: "agentic" as ComponentCategory },
      { base: this.paths.webComponents, category: "ui" as ComponentCategory },
      { base: this.paths.webAgentic, category: "agentic" as ComponentCategory },
    ];

    for (const { base, category } of searchPaths) {
      const fullBase = path.join(this.rootDir, base);

      // 디렉토리 형태
      const dirPath = path.join(fullBase, slug);
      if (await fs.pathExists(dirPath)) {
        const files = await this.getComponentFiles(dirPath);
        if (files.length > 0) {
          return {
            name: this.formatName(slug),
            files,
            baseDir: dirPath,
            category,
          };
        }
      }

      // 단일 파일 형태
      const filePath = path.join(fullBase, `${slug}.tsx`);
      if (await fs.pathExists(filePath)) {
        return {
          name: this.formatName(slug),
          files: [filePath],
          baseDir: fullBase,
          category,
        };
      }
    }

    return null;
  }

  /**
   * 컴포넌트 디렉토리에서 파일 목록 가져오기
   */
  private async getComponentFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
        files.push(path.join(dir, entry.name));
      }
    }

    return files;
  }

  /**
   * 설명 추출
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
   * 문서 URL 생성
   */
  private getDocsUrl(slug: string, category: ComponentCategory): string {
    const baseUrl = "https://axis.minu.best";
    return `${baseUrl}/${category}/${slug}`;
  }
}
