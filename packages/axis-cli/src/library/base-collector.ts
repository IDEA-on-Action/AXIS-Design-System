/**
 * Library Curator - Base Collector
 *
 * 모든 Collector의 기본 클래스
 */

import crypto from "crypto";
import type {
  ICollector,
  SourceType,
  ComponentMeta,
  ComponentListItem,
  CollectionResult,
  CollectionItem,
  CollectionError,
  CollectOptions,
  ChangeSet,
  ComponentCategory,
  CodeFile,
} from "./types.js";

// 카테고리 분류 규칙
const CATEGORY_RULES: Array<{ category: ComponentCategory; patterns: RegExp[] }> = [
  {
    category: "agentic",
    patterns: [
      /streaming/i, /agent/i, /approval/i, /step[-_]?indicator/i,
      /tool[-_]?call/i, /run[-_]?container/i, /surface/i, /thinking/i,
    ],
  },
  {
    category: "form",
    patterns: [
      /input/i, /select/i, /checkbox/i, /radio/i, /switch/i,
      /form/i, /textarea/i, /slider/i, /date[-_]?picker/i, /label/i,
    ],
  },
  {
    category: "layout",
    patterns: [
      /container/i, /grid/i, /flex/i, /stack/i, /spacer/i,
      /divider/i, /separator/i, /aspect[-_]?ratio/i,
    ],
  },
  {
    category: "navigation",
    patterns: [
      /nav/i, /menu/i, /breadcrumb/i, /tabs/i, /pagination/i,
      /sidebar/i, /header/i, /footer/i,
    ],
  },
  {
    category: "feedback",
    patterns: [
      /toast/i, /alert/i, /notification/i, /progress/i,
      /spinner/i, /skeleton/i, /loading/i,
    ],
  },
  {
    category: "overlay",
    patterns: [
      /modal/i, /dialog/i, /drawer/i, /popover/i, /tooltip/i,
      /dropdown/i, /sheet/i,
    ],
  },
  {
    category: "data-display",
    patterns: [
      /table/i, /list/i, /card/i, /avatar/i, /badge/i,
      /tag/i, /timeline/i, /tree/i,
    ],
  },
  {
    category: "chart",
    patterns: [
      /chart/i, /graph/i, /pie/i, /bar/i, /line/i,
      /area/i, /scatter/i, /radar/i,
    ],
  },
];

// 태그 추출 패턴
const TAG_PATTERNS = [
  { pattern: /useState|useReducer/, tag: "stateful" },
  { pattern: /useEffect|useLayoutEffect/, tag: "side-effects" },
  { pattern: /forwardRef/, tag: "forwardRef" },
  { pattern: /motion|animate|transition/, tag: "animated" },
  { pattern: /accessible|aria-/, tag: "accessible" },
  { pattern: /responsive|breakpoint|media/, tag: "responsive" },
];

export abstract class BaseCollector implements ICollector {
  abstract readonly sourceType: SourceType;

  abstract listComponents(): Promise<ComponentListItem[]>;
  abstract collectComponent(id: string): Promise<ComponentMeta>;

  /**
   * 전체 컴포넌트 수집
   */
  async collectAll(options?: CollectOptions): Promise<CollectionResult> {
    const timestamp = new Date().toISOString();
    const items: CollectionItem[] = [];
    const errors: CollectionError[] = [];

    try {
      // 컴포넌트 목록 조회
      let componentList = await this.listComponents();

      // 필터 적용
      if (options?.filter?.categories) {
        componentList = componentList.filter(
          (c) => c.category && options.filter!.categories!.includes(c.category)
        );
      }

      // 각 컴포넌트 수집
      for (const item of componentList) {
        try {
          const component = await this.collectComponent(item.id);
          items.push({
            id: component.id,
            name: component.name,
            status: "new", // 증분 수집 시 로직 추가 필요
            checksum: component.checksum,
          });
        } catch (error) {
          errors.push({
            id: item.id,
            error: error instanceof Error ? error.message : "Unknown error",
            recoverable: true,
          });
        }
      }

      return {
        source: this.sourceType,
        timestamp,
        success: errors.length === 0,
        collected: items.length,
        updated: 0,
        failed: errors.length,
        items,
        errors,
      };
    } catch (error) {
      return {
        source: this.sourceType,
        timestamp,
        success: false,
        collected: 0,
        updated: 0,
        failed: 1,
        items: [],
        errors: [
          {
            id: "root",
            error: error instanceof Error ? error.message : "Unknown error",
            recoverable: false,
          },
        ],
      };
    }
  }

  /**
   * 변경 감지
   */
  async detectChanges(lastChecksum: Record<string, string>): Promise<ChangeSet> {
    const currentList = await this.listComponents();
    const currentIds = new Set(currentList.map((c) => c.id));
    const previousIds = new Set(Object.keys(lastChecksum));

    const added = currentList
      .filter((c) => !previousIds.has(c.id))
      .map((c) => c.id);

    const removed = [...previousIds].filter((id) => !currentIds.has(id));

    const modified: string[] = [];
    for (const item of currentList) {
      if (previousIds.has(item.id)) {
        try {
          const component = await this.collectComponent(item.id);
          if (component.checksum !== lastChecksum[item.id]) {
            modified.push(item.id);
          }
        } catch {
          // 수집 실패 시 변경된 것으로 간주
          modified.push(item.id);
        }
      }
    }

    return { added, modified, removed };
  }

  // ============================================================================
  // Protected Helpers
  // ============================================================================

  /**
   * 카테고리 자동 분류
   */
  protected classifyCategory(name: string, code?: string): ComponentCategory {
    const searchText = `${name} ${code || ""}`.toLowerCase();

    for (const rule of CATEGORY_RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(searchText)) {
          return rule.category;
        }
      }
    }

    return "ui"; // 기본값
  }

  /**
   * 태그 자동 추출
   */
  protected extractTags(name: string, code?: string): string[] {
    const tags: string[] = [];
    const searchText = code || "";

    for (const { pattern, tag } of TAG_PATTERNS) {
      if (pattern.test(searchText)) {
        tags.push(tag);
      }
    }

    // 이름에서 추가 태그 추출
    const nameLower = name.toLowerCase();
    if (nameLower.includes("button")) tags.push("interactive");
    if (nameLower.includes("card")) tags.push("container");
    if (nameLower.includes("input") || nameLower.includes("form")) tags.push("input");

    return [...new Set(tags)];
  }

  /**
   * 체크섬 계산
   */
  protected calculateChecksum(content: string): string {
    return crypto.createHash("md5").update(content).digest("hex").slice(0, 8);
  }

  /**
   * 슬러그 생성
   */
  protected generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  /**
   * ID 생성
   */
  protected generateId(name: string): string {
    return `${this.sourceType}-${this.generateSlug(name)}`;
  }

  /**
   * 의존성 추출
   */
  protected extractDependencies(code: string): {
    dependencies: string[];
    devDependencies: string[];
    registryDeps: string[];
  } {
    const dependencies: string[] = [];
    const devDependencies: string[] = [];
    const registryDeps: string[] = [];

    // import 문에서 의존성 추출
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(code)) !== null) {
      const pkg = match[1];

      // 상대 경로 무시
      if (pkg.startsWith(".") || pkg.startsWith("@/")) {
        continue;
      }

      // 레지스트리 의존성
      if (pkg.startsWith("@axis") || pkg.includes("/ui/")) {
        registryDeps.push(pkg);
        continue;
      }

      // 외부 패키지
      const pkgName = pkg.startsWith("@")
        ? pkg.split("/").slice(0, 2).join("/")
        : pkg.split("/")[0];

      if (pkgName === "react" || pkgName === "react-dom") {
        continue; // peer deps
      }

      if (!dependencies.includes(pkgName)) {
        dependencies.push(pkgName);
      }
    }

    return { dependencies, devDependencies, registryDeps };
  }

  /**
   * ComponentMeta 기본 구조 생성
   */
  protected createBaseMeta(
    name: string,
    description: string,
    files: CodeFile[],
    options: {
      registry?: string;
      url?: string;
      version?: string;
    } = {}
  ): ComponentMeta {
    const code = files.map((f) => f.content).join("\n");
    const deps = this.extractDependencies(code);
    const now = new Date().toISOString();

    return {
      id: this.generateId(name),
      slug: this.generateSlug(name),
      name,
      description,
      source: {
        type: this.sourceType,
        registry: options.registry || `@${this.sourceType}`,
        url: options.url || "",
        version: options.version,
      },
      category: this.classifyCategory(name, code),
      tags: this.extractTags(name, code),
      code: {
        files,
        dependencies: deps.dependencies,
        devDependencies: deps.devDependencies,
        registryDeps: deps.registryDeps,
      },
      status: "active",
      collectedAt: now,
      updatedAt: now,
      checksum: this.calculateChecksum(code),
    };
  }
}
