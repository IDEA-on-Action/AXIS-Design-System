/**
 * Library Curator - Shadcn Collector
 *
 * shadcn/ui 레지스트리에서 컴포넌트를 수집합니다.
 * MCP 서버 또는 직접 API 호출을 통해 수집합니다.
 */

import type {
  ComponentMeta,
  ComponentListItem,
  CodeFile,
} from "./types.js";
import { BaseCollector } from "./base-collector.js";

// shadcn 레지스트리 API 응답 타입
interface ShadcnRegistryItem {
  name: string;
  type: string;
  description?: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files: Array<{
    path: string;
    content: string;
    type?: string;
    target?: string;
  }>;
}

interface ShadcnRegistryIndex {
  items: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
}

export class ShadcnCollector extends BaseCollector {
  readonly sourceType = "shadcn" as const;

  private baseUrl = "https://ui.shadcn.com";
  private registryUrl = "https://ui.shadcn.com/r";

  constructor(options: { baseUrl?: string } = {}) {
    super();
    if (options.baseUrl) {
      this.baseUrl = options.baseUrl;
      this.registryUrl = `${options.baseUrl}/r`;
    }
  }

  /**
   * 컴포넌트 목록 조회
   */
  async listComponents(): Promise<ComponentListItem[]> {
    try {
      // 레지스트리 인덱스 조회
      const response = await fetch(`${this.registryUrl}/index.json`);

      if (!response.ok) {
        // index.json이 없으면 기본 목록 사용
        return this.getDefaultComponentList();
      }

      const data = (await response.json()) as ShadcnRegistryIndex;

      return data.items.map((item) => ({
        id: `shadcn-${item.name}`,
        name: item.name,
        description: item.description || `shadcn/ui ${item.name} component`,
        category: this.classifyCategory(item.name),
        source: "shadcn",
      }));
    } catch (error) {
      console.warn("shadcn 레지스트리 인덱스 조회 실패, 기본 목록 사용:", error);
      return this.getDefaultComponentList();
    }
  }

  /**
   * 단일 컴포넌트 수집
   */
  async collectComponent(id: string): Promise<ComponentMeta> {
    const name = id.replace("shadcn-", "");

    try {
      // 레지스트리에서 컴포넌트 정보 조회
      const response = await fetch(`${this.registryUrl}/${name}.json`);

      if (!response.ok) {
        throw new Error(`Component not found: ${name}`);
      }

      const data = (await response.json()) as ShadcnRegistryItem;

      // 파일 정보 변환
      const files: CodeFile[] = data.files.map((f) => ({
        path: f.target || f.path,
        content: f.content,
        type: this.getFileType(f.path),
      }));

      // ComponentMeta 생성
      const meta = this.createBaseMeta(
        data.name,
        data.description || `shadcn/ui ${data.name} component`,
        files,
        {
          registry: "@shadcn",
          url: `${this.baseUrl}/docs/components/${name}`,
        }
      );

      // 의존성 정보 업데이트
      if (data.dependencies) {
        meta.code.dependencies = [
          ...new Set([...meta.code.dependencies, ...data.dependencies]),
        ];
      }
      if (data.devDependencies) {
        meta.code.devDependencies = [
          ...new Set([...meta.code.devDependencies, ...data.devDependencies]),
        ];
      }
      if (data.registryDependencies) {
        meta.code.registryDeps = [
          ...new Set([...meta.code.registryDeps, ...data.registryDependencies]),
        ];
      }

      return meta;
    } catch (error) {
      // 레지스트리 조회 실패 시 기본 메타데이터 반환
      return this.createBaseMeta(name, `shadcn/ui ${name} component`, [], {
        registry: "@shadcn",
        url: `${this.baseUrl}/docs/components/${name}`,
      });
    }
  }

  /**
   * 기본 컴포넌트 목록 (레지스트리 인덱스 없을 때)
   */
  private getDefaultComponentList(): ComponentListItem[] {
    const components = [
      { name: "accordion", desc: "Accordion component" },
      { name: "alert", desc: "Alert component" },
      { name: "alert-dialog", desc: "Alert dialog component" },
      { name: "aspect-ratio", desc: "Aspect ratio component" },
      { name: "avatar", desc: "Avatar component" },
      { name: "badge", desc: "Badge component" },
      { name: "breadcrumb", desc: "Breadcrumb component" },
      { name: "button", desc: "Button component" },
      { name: "calendar", desc: "Calendar component" },
      { name: "card", desc: "Card component" },
      { name: "carousel", desc: "Carousel component" },
      { name: "chart", desc: "Chart component" },
      { name: "checkbox", desc: "Checkbox component" },
      { name: "collapsible", desc: "Collapsible component" },
      { name: "command", desc: "Command component" },
      { name: "context-menu", desc: "Context menu component" },
      { name: "dialog", desc: "Dialog component" },
      { name: "drawer", desc: "Drawer component" },
      { name: "dropdown-menu", desc: "Dropdown menu component" },
      { name: "form", desc: "Form component" },
      { name: "hover-card", desc: "Hover card component" },
      { name: "input", desc: "Input component" },
      { name: "input-otp", desc: "Input OTP component" },
      { name: "label", desc: "Label component" },
      { name: "menubar", desc: "Menubar component" },
      { name: "navigation-menu", desc: "Navigation menu component" },
      { name: "pagination", desc: "Pagination component" },
      { name: "popover", desc: "Popover component" },
      { name: "progress", desc: "Progress component" },
      { name: "radio-group", desc: "Radio group component" },
      { name: "resizable", desc: "Resizable component" },
      { name: "scroll-area", desc: "Scroll area component" },
      { name: "select", desc: "Select component" },
      { name: "separator", desc: "Separator component" },
      { name: "sheet", desc: "Sheet component" },
      { name: "sidebar", desc: "Sidebar component" },
      { name: "skeleton", desc: "Skeleton component" },
      { name: "slider", desc: "Slider component" },
      { name: "sonner", desc: "Sonner toast component" },
      { name: "switch", desc: "Switch component" },
      { name: "table", desc: "Table component" },
      { name: "tabs", desc: "Tabs component" },
      { name: "textarea", desc: "Textarea component" },
      { name: "toast", desc: "Toast component" },
      { name: "toggle", desc: "Toggle component" },
      { name: "toggle-group", desc: "Toggle group component" },
      { name: "tooltip", desc: "Tooltip component" },
    ];

    return components.map((c) => ({
      id: `shadcn-${c.name}`,
      name: c.name,
      description: c.desc,
      category: this.classifyCategory(c.name),
      source: "shadcn",
    }));
  }

  /**
   * 파일 타입 추론
   */
  private getFileType(path: string): CodeFile["type"] {
    if (path.includes("hook") || path.startsWith("use")) return "hook";
    if (path.includes("util") || path.includes("lib")) return "util";
    if (path.endsWith(".css")) return "style";
    if (path.endsWith(".d.ts") || path.includes("types")) return "type";
    return "component";
  }
}
