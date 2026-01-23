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
import type { LibraryIndex, ComponentMeta, CategoryDefinition } from "./types.js";

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

/**
 * Publisher 클래스
 */
export class Publisher {
  private defaultOutputDir = "apps/web/public/library";

  /**
   * 라이브러리 인덱스를 사이트에 배치
   */
  async publish(index: LibraryIndex, options: PublishOptions = {}): Promise<PublishResult> {
    const outputDir = options.outputDir || this.defaultOutputDir;
    const files: string[] = [];
    const errors: string[] = [];

    const spinner = ora("라이브러리 배치 중...").start();

    try {
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
        const componentPath = path.join(componentsDir, `${component.slug}.json`);
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
      components: index.components.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        category: c.category,
        source: c.source.type,
        tags: c.tags,
        status: c.status,
      })),
    };
  }

  /**
   * 공개용 컴포넌트 생성
   */
  private createPublicComponent(component: ComponentMeta): object {
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
      dependencies: component.dependencies,
      status: component.status,
      updatedAt: component.updatedAt,
    };
  }

  /**
   * 검색 인덱스 생성
   */
  private generateSearchIndex(index: LibraryIndex): SearchIndexItem[] {
    return index.components.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      category: c.category,
      source: c.source.type,
      tags: c.tags,
      url: `/library/${c.category}/${c.slug}`,
    }));
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
