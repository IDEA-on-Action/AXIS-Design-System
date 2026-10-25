/**
 * Library Curator - Publisher Module
 *
 * 수집된 컴포넌트를 사이트에 배치합니다.
 * - 카테고리별 JSON 파일 생성
 * - 정적 페이지 데이터 생성
 * - 검색 인덱스 생성
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import type { LibraryIndex, ComponentMeta } from "./types.js";

// 배치 옵션
export interface PublishOptions {
  outputDir?: string;
  generateSearchIndex?: boolean;
  minify?: boolean;
  verbose?: boolean;
}

// 배치 결과
export interface PublishResult {
  success: boolean;
  outputDir: string;
  files: string[];
  stats: {
    totalComponents: number;
    categoriesPublished: number;
    searchIndexSize: number;
  };
  errors: string[];
}

// 검색 인덱스 아이템
export interface SearchIndexItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  source: string;
  tags: string[];
  url: string;
}

// ============================================================================
// 공개 데이터 형태 (Publisher 와 axis 재생성(axis-refresh)이 같은 형태 · 키 순서를 쓰도록 한 곳에 둡니다)
// ============================================================================

/** index.json 의 항목 (코드 제외) */
export interface PublicIndexEntry {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  source: string;
  tags: string[];
  status: string;
}

/**
 * components/<id>.json · categories/<id>.json 의 항목.
 * 예전 판은 `dependencies: component.dependencies` 도 넣었지만 ComponentMeta 에 없는 필드라(TS2339) 늘 undefined 였고
 * JSON 에서 빠졌습니다. 출력 바이트는 같습니다.
 */
export function toPublicComponent(component: ComponentMeta): PublicComponent {
  return {
    id: component.id,
    slug: component.slug,
    name: component.name,
    description: component.description,
    category: component.category,
    source: {
      type: component.source.type,
      registry: component.source.registry,
      url: component.source.url,
    },
    tags: component.tags,
    code: component.code,
    preview: component.preview,
    status: component.status,
    updatedAt: component.updatedAt,
  };
}

/** 공개 컴포넌트 JSON 형태 */
export interface PublicComponent {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  source: { type: string; registry: string; url: string };
  tags: string[];
  code: ComponentMeta["code"];
  preview?: ComponentMeta["preview"];
  status: string;
  updatedAt: string;
}

/** index.json 항목. 공개 컴포넌트에서도 만들 수 있게 공통 필드만 받습니다 */
export function toIndexEntry(c: {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  source: { type: string };
  tags: string[];
  status: string;
}): PublicIndexEntry {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    category: c.category,
    source: c.source.type,
    tags: c.tags,
    status: c.status,
  };
}

/** search-index.json 항목 */
export function toSearchItem(c: {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  source: { type: string };
  tags: string[];
}): SearchIndexItem {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    category: c.category,
    source: c.source.type,
    tags: c.tags,
    url: `/library/${c.category}/${c.slug}`,
  };
}

// ============================================================================
// 상세 주소 slug 정하기 (WI-0060)
// ============================================================================

/** 상세 주소를 정하는 데 쓰는 항목 필드. source 는 문자열(index 항목) 또는 { type }(공개 컴포넌트) */
export interface RouteSlugItem {
  id: string;
  slug: string;
  category: string;
  source: string | { type: string };
}

const sourceTypeOf = (item: RouteSlugItem): string =>
  typeof item.source === "string" ? item.source : item.source.type;

/**
 * 상세 주소 `/library/<category>/<slug>` 가 항목마다 하나가 되도록 항목별 slug 를 정합니다(id → slug).
 *
 * - 같은 (category, slug) 를 쓰는 항목이 둘 이상이면 AXIS 항목이 slug 를 그대로 쓰고(AXIS 가 없으면 순서상 첫 항목),
 *   나머지는 `<source>-<slug>` 를 씁니다(예: shadcn/ui 의 button → shadcn-button). 기존 URL 은 AXIS 화면을 그대로 보입니다.
 * - 카테고리가 다르면 주소가 달라 바꾸지 않습니다.
 * - 이미 바뀐 slug(shadcn-button)는 다시 겹치지 않으므로 같은 입력에 다시 돌려도 결과가 같습니다.
 * - 한 주소에 AXIS 항목이 둘이거나, 바꾼 뒤에도 주소가 겹치면 멈춥니다(조용히 덮어쓰지 않음).
 */
export function resolveRouteSlugs(items: RouteSlugItem[]): Map<string, string> {
  const groups = new Map<string, RouteSlugItem[]>();
  for (const item of items) {
    const key = `${item.category}/${item.slug}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  const result = new Map<string, string>();
  for (const [key, group] of groups) {
    if (group.length === 1) {
      result.set(group[0].id, group[0].slug);
      continue;
    }
    const axis = group.filter((i) => sourceTypeOf(i) === "axis");
    if (axis.length > 1) {
      throw new Error(`상세 주소 /library/${key} 를 AXIS 항목 ${axis.map((i) => i.id).join(", ")} 가 함께 씁니다`);
    }
    const keeper = axis[0] || group[0];
    for (const item of group) {
      result.set(item.id, item === keeper ? item.slug : `${sourceTypeOf(item)}-${item.slug}`);
    }
  }
  const seen = new Map<string, string>();
  for (const item of items) {
    const key = `${item.category}/${result.get(item.id)}`;
    const other = seen.get(key);
    if (other !== undefined && other !== item.id) {
      throw new Error(`slug 를 바꾼 뒤에도 상세 주소 /library/${key} 가 ${other}, ${item.id} 에서 겹칩니다`);
    }
    seen.set(key, item.id);
  }
  return result;
}

/** resolveRouteSlugs 결과를 적용한 복사본. slug 가 바뀐 항목만 새 객체이고 키 순서는 같습니다 */
export function withRouteSlugs<T extends RouteSlugItem>(items: T[]): T[] {
  const slugs = resolveRouteSlugs(items);
  return items.map((item) => (slugs.get(item.id) === item.slug ? item : { ...item, slug: slugs.get(item.id)! }));
}

/** 상세 데이터 파일 경로 (libraryDir 기준). 파일 키는 항목 id 입니다(WI-0060 D2) */
export function componentFileOf(item: { id: string }): string {
  return `components/${item.id}.json`;
}

/**
 * Publisher 클래스
 */
export class Publisher {
  private defaultOutputDir = "apps/web/public/library";

  /**
   * 라이브러리 인덱스를 사이트에 배치
   */
  async publish(input: LibraryIndex, options: PublishOptions = {}): Promise<PublishResult> {
    const outputDir = options.outputDir || this.defaultOutputDir;
    const files: string[] = [];
    const errors: string[] = [];

    const spinner = ora("라이브러리 배치 중...").start();

    try {
      // 같은 상세 주소를 쓰는 외부 항목은 `<source>-<slug>` 로 (WI-0060). 겹침을 풀 수 없으면 catch 로 갑니다
      const index: LibraryIndex = { ...input, components: withRouteSlugs(input.components) };

      // 출력 디렉토리 생성
      await fs.ensureDir(outputDir);

      // 1. 전체 인덱스 배치
      const indexPath = path.join(outputDir, "index.json");
      await this.writeJson(indexPath, this.createPublicIndex(index), options.minify);
      files.push(indexPath);

      // 2. 카테고리별 파일 배치
      const categoriesDir = path.join(outputDir, "categories");
      await fs.ensureDir(categoriesDir);

      for (const category of index.categories) {
        const categoryComponents = index.components.filter((c) => c.category === category.id);
        const categoryPath = path.join(categoriesDir, `${category.id}.json`);

        await this.writeJson(
          categoryPath,
          {
            category: category.id,
            name: category.name,
            description: category.description,
            icon: category.icon,
            count: categoryComponents.length,
            components: categoryComponents.map((c) => this.createPublicComponent(c)),
          },
          options.minify
        );
        files.push(categoryPath);
      }

      // 3. 개별 컴포넌트 파일 배치
      const componentsDir = path.join(outputDir, "components");
      await fs.ensureDir(componentsDir);

      for (const component of index.components) {
        const componentPath = path.join(outputDir, componentFileOf(component));
        await this.writeJson(componentPath, this.createPublicComponent(component), options.minify);
        files.push(componentPath);
      }

      // 4. 검색 인덱스 생성
      let searchIndexSize = 0;
      if (options.generateSearchIndex !== false) {
        const searchIndex = this.generateSearchIndex(index);
        const searchPath = path.join(outputDir, "search-index.json");
        await this.writeJson(searchPath, searchIndex, options.minify);
        files.push(searchPath);
        searchIndexSize = searchIndex.length;
      }

      // 5. 메타데이터 파일 생성
      const metaPath = path.join(outputDir, "meta.json");
      await this.writeJson(
        metaPath,
        {
          version: index.version,
          updatedAt: index.updatedAt,
          stats: index.stats,
          categories: index.categories,
          tags: index.tags.slice(0, 50), // 상위 50개 태그만
        },
        options.minify
      );
      files.push(metaPath);

      spinner.succeed(`라이브러리 배치 완료: ${files.length}개 파일`);

      return {
        success: true,
        outputDir,
        files,
        stats: {
          totalComponents: index.components.length,
          categoriesPublished: index.categories.length,
          searchIndexSize,
        },
        errors,
      };
    } catch (error) {
      spinner.fail("라이브러리 배치 실패");
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push(errorMessage);

      return {
        success: false,
        outputDir,
        files,
        stats: {
          totalComponents: 0,
          categoriesPublished: 0,
          searchIndexSize: 0,
        },
        errors,
      };
    }
  }

  /**
   * 공개용 인덱스 생성 (코드 제외)
   */
  private createPublicIndex(index: LibraryIndex): object {
    return {
      version: index.version,
      updatedAt: index.updatedAt,
      stats: index.stats,
      categories: index.categories,
      components: index.components.map(toIndexEntry),
    };
  }

  /**
   * 공개용 컴포넌트 생성
   */
  private createPublicComponent(component: ComponentMeta): object {
    return toPublicComponent(component);
  }

  /**
   * 검색 인덱스 생성
   */
  private generateSearchIndex(index: LibraryIndex): SearchIndexItem[] {
    return index.components.map(toSearchItem);
  }

  /**
   * JSON 파일 쓰기
   */
  private async writeJson(filePath: string, data: object, minify?: boolean): Promise<void> {
    const content = minify ? JSON.stringify(data) : JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, "utf-8");
  }

  /**
   * 기존 배치 정리
   */
  async clean(outputDir?: string): Promise<void> {
    const dir = outputDir || this.defaultOutputDir;
    if (await fs.pathExists(dir)) {
      await fs.remove(dir);
      console.log(chalk.yellow(`✓ 기존 배치 정리: ${dir}`));
    }
  }

  /**
   * 배치 상태 확인
   */
  async getStatus(outputDir?: string): Promise<{ exists: boolean; lastUpdated?: string; componentCount?: number }> {
    const dir = outputDir || this.defaultOutputDir;
    const metaPath = path.join(dir, "meta.json");

    if (!(await fs.pathExists(metaPath))) {
      return { exists: false };
    }

    try {
      const meta = await fs.readJson(metaPath);
      return {
        exists: true,
        lastUpdated: meta.updatedAt,
        componentCount: meta.stats?.total,
      };
    } catch {
      return { exists: false };
    }
  }
}

// 싱글톤 인스턴스
export const publisher = new Publisher();
