/**
 * Library Curator - AXIS Collector
 *
 * AXIS Design System 내부 컴포넌트를 수집합니다.
 * 컴포넌트 패키지(packages/axis-ui-react · packages/axis-agentic-ui)의 src 아래 디렉터리 중
 * index.tsx 가 있는 것만 컴포넌트로 봅니다.
 *
 * WI-0057: 예전에는 문서 사이트 데모 페이지(apps/web/src/app/{components,agentic}/<slug>/page.tsx)도
 * 컴포넌트로 잡았습니다. 그 결과 page.tsx 코드가 컴포넌트처럼 library 에 실렸고, 페이지가 (docs)
 * 라우트 그룹으로 옮겨진 뒤에는 문서 링크가 404 가 됐습니다. 데모 페이지 스캔은 없앴고, 문서 사이트는
 * 문서 URL 을 정할 때 라우트가 실재하는지 확인하는 데에만 씁니다.
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
import { AXIS_SITE_URL } from "../site.js";

/** 문서 사이트의 라우트 세그먼트: ui-react 는 /components, agentic-ui 는 /agentic */
export type AxisDocsRoute = "components" | "agentic";

// AXIS 컴포넌트 경로 설정
interface AxisPaths {
  uiReact: string;
  agenticUi: string;
  /** 문서 사이트 app router 의 (docs) 라우트 그룹. 문서 URL 실재 확인에만 씁니다 */
  docsApp: string;
}

// 기본 경로 (저장소 루트 기준)
const DEFAULT_PATHS: AxisPaths = {
  uiReact: "packages/axis-ui-react/src",
  agenticUi: "packages/axis-agentic-ui/src",
  docsApp: "apps/web/src/app/(docs)",
};

/**
 * 컴포넌트 slug 와 문서 페이지 slug 가 다른 것(WI-0057 D3). 키 · 값은 `<route>/<slug>` 입니다.
 * 컴포넌트 이름 그대로의 라우트가 없을 때만 봅니다. 대상 라우트도 실재해야 씁니다.
 */
export const DOCS_SLUG_ALIASES: Readonly<Record<string, string>> = {
  "agentic/approval-card": "agentic/approval-dialog",
};

/** 컴포넌트 코드에 넣지 않는 파일: 테스트 · 스토리 */
const NON_COMPONENT_FILE = /\.(test|spec|stories)\.tsx?$/;

interface PackageSource {
  base: string;
  category: ComponentCategory;
  route: AxisDocsRoute;
}

export class AxisCollector extends BaseCollector {
  readonly sourceType = "axis" as const;

  private rootDir: string;
  private paths: AxisPaths;

  constructor(options: { rootDir?: string; paths?: Partial<AxisPaths> } = {}) {
    super();
    this.rootDir = options.rootDir || process.cwd();
    this.paths = { ...DEFAULT_PATHS, ...options.paths };
  }

  /** 스캔 순서: ui-react 먼저, agentic-ui 다음 (같은 이름이면 앞의 것) */
  private packageSources(): PackageSource[] {
    return [
      { base: this.paths.uiReact, category: "ui", route: "components" },
      { base: this.paths.agenticUi, category: "agentic", route: "agentic" },
    ];
  }

  /**
   * AXIS 컴포넌트 목록 조회
   */
  async listComponents(): Promise<ComponentListItem[]> {
    const items: ComponentListItem[] = [];
    const seen = new Set<string>();

    for (const pkg of this.packageSources()) {
      for (const slug of await this.listComponentDirs(pkg.base)) {
        const id = `axis-${slug}`;
        if (seen.has(id)) continue;
        seen.add(id);

        const content = await fs.readFile(
          path.join(this.rootDir, pkg.base, slug, "index.tsx"),
          "utf-8"
        );
        const name = this.formatName(slug);
        items.push({
          id,
          name,
          description: this.extractDescription(content, slug) || `AXIS ${name} component`,
          category: pkg.category,
          source: "axis",
        });
      }
    }

    return items;
  }

  /**
   * 단일 컴포넌트 수집
   */
  async collectComponent(id: string): Promise<ComponentMeta> {
    const slug = id.replace(/^axis-/, "");

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
      this.extractDescription(mainContent, slug) || `AXIS ${componentInfo.name} component`,
      codeFiles,
      {
        registry: "@axis",
        url: await this.resolveDocsUrl(slug, componentInfo.route),
      }
    );

    // 카테고리는 패키지로 정합니다(ui-react → ui, agentic-ui → agentic)
    meta.category = componentInfo.category;

    return meta;
  }

  /**
   * 문서 URL 을 정합니다(WI-0057 D3).
   * ① `<docsApp>/<route>/<slug>/page.tsx` 가 있으면 그 경로 ② 없으면 별칭 표의 대상이 실재할 때 그 경로
   * ③ 둘 다 없으면 빈 문자열(library 상세 화면은 빈 URL 이면 문서 링크를 그리지 않습니다).
   */
  async resolveDocsUrl(slug: string, route: AxisDocsRoute): Promise<string> {
    const direct = `${route}/${slug}`;
    const candidates = [direct];
    const alias = DOCS_SLUG_ALIASES[direct];
    if (alias) candidates.push(alias);

    for (const routePath of candidates) {
      if (await this.docsRouteExists(routePath)) {
        return `${AXIS_SITE_URL}/${routePath}`;
      }
    }
    return "";
  }

  private async docsRouteExists(routePath: string): Promise<boolean> {
    return fs.pathExists(path.join(this.rootDir, this.paths.docsApp, routePath, "page.tsx"));
  }

  /**
   * 패키지 src 바로 아래에서 index.tsx 가 있는 디렉터리 이름(정렬). 단일 파일(a11y.test.tsx 등)과
   * index.tsx 가 없는 디렉터리(constants · test-utils)는 컴포넌트가 아닙니다.
   */
  private async listComponentDirs(packagePath: string): Promise<string[]> {
    const fullPath = path.join(this.rootDir, packagePath);
    if (!(await fs.pathExists(fullPath))) {
      return [];
    }

    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const slugs: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (await fs.pathExists(path.join(fullPath, entry.name, "index.tsx"))) {
        slugs.push(entry.name);
      }
    }
    return slugs.sort();
  }

  /**
   * 컴포넌트 찾기
   */
  private async findComponent(slug: string): Promise<{
    name: string;
    files: string[];
    baseDir: string;
    category: ComponentCategory;
    route: AxisDocsRoute;
  } | null> {
    for (const pkg of this.packageSources()) {
      const dirPath = path.join(this.rootDir, pkg.base, slug);
      if (!(await fs.pathExists(path.join(dirPath, "index.tsx")))) continue;

      const files = await this.getComponentFiles(dirPath);
      if (files.length > 0) {
        return {
          name: this.formatName(slug),
          files,
          baseDir: dirPath,
          category: pkg.category,
          route: pkg.route,
        };
      }
    }

    return null;
  }

  /**
   * 컴포넌트 디렉터리의 코드 파일(.ts · .tsx, 테스트 · 스토리 제외). 이름순으로 정렬해 결과가 매번 같습니다.
   */
  private async getComponentFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter(
        (entry) =>
          entry.isFile() &&
          (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) &&
          !NON_COMPONENT_FILE.test(entry.name)
      )
      .map((entry) => entry.name)
      .sort()
      .map((name) => path.join(dir, name));
  }

  /**
   * 설명 추출. 컴포넌트 이름(slug 의 PascalCase)으로 선언된 곳 바로 앞의 JSDoc 첫 줄을 먼저 씁니다
   * (WI-0057: 파일 첫 JSDoc 은 Props 인터페이스 · 하위 컴포넌트 설명인 경우가 많았습니다).
   */
  private extractDescription(code: string, slug?: string): string | undefined {
    if (slug) {
      const name = slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("");
      const decl = new RegExp(
        `/\\*\\*((?:(?!\\*/)[\\s\\S])*)\\*/\\s*(?:export\\s+)?(?:default\\s+)?(?:const|let|function|class)\\s+${name}\\b`
      );
      const m = code.match(decl);
      if (m) {
        const line = m[1]
          .split("\n")
          .map((l) => l.replace(/^\s*\*?\s?/, "").trim())
          .find((l) => l && !l.startsWith("@"));
        if (line) return line;
      }
    }

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
}
