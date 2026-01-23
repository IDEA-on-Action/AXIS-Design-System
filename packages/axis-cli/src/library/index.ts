/**
 * Library Curator - Main Module
 *
 * 디자인 시스템 라이브러리 수집/분류/배치 모듈
 */

export * from "./types.js";
export * from "./base-collector.js";
export * from "./shadcn-collector.js";
export * from "./monet-collector.js";
export * from "./v0-collector.js";
export * from "./axis-collector.js";
export * from "./publisher.js";

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import type {
  ICollector,
  SourceType,
  ComponentMeta,
  CollectionResult,
  LibraryIndex,
  CategoryDefinition,
  TagDefinition,
  LibraryStats,
} from "./types.js";
import { ShadcnCollector } from "./shadcn-collector.js";
import { MonetCollector } from "./monet-collector.js";
import { V0Collector } from "./v0-collector.js";
import { AxisCollector } from "./axis-collector.js";

// 기본 카테고리 정의
const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { id: "ui", name: "UI", description: "기본 UI 컴포넌트", icon: "layers", order: 1 },
  { id: "agentic", name: "Agentic", description: "Agentic UI 컴포넌트", icon: "bot", order: 2 },
  { id: "form", name: "Form", description: "폼 컴포넌트", icon: "text-cursor-input", order: 3 },
  { id: "layout", name: "Layout", description: "레이아웃 컴포넌트", icon: "layout", order: 4 },
  { id: "navigation", name: "Navigation", description: "네비게이션", icon: "navigation", order: 5 },
  { id: "feedback", name: "Feedback", description: "피드백 컴포넌트", icon: "bell", order: 6 },
  { id: "overlay", name: "Overlay", description: "오버레이 컴포넌트", icon: "square-stack", order: 7 },
  { id: "data-display", name: "Data Display", description: "데이터 표시", icon: "table", order: 8 },
  { id: "chart", name: "Chart", description: "차트/시각화", icon: "chart-bar", order: 9 },
  { id: "utility", name: "Utility", description: "유틸리티", icon: "wrench", order: 10 },
];

/**
 * Library Curator 메인 클래스
 */
export class LibraryCurator {
  private collectors: Map<SourceType, ICollector> = new Map();
  private dataDir: string;

  constructor(options: { dataDir?: string; rootDir?: string } = {}) {
    this.dataDir = options.dataDir || ".claude/data/library";

    // Collector 초기화
    this.collectors.set("shadcn", new ShadcnCollector());
    this.collectors.set("monet", new MonetCollector());
    this.collectors.set("v0", new V0Collector());
    this.collectors.set("axis", new AxisCollector({ rootDir: options.rootDir }));
  }

  /**
   * 전체 수집 실행
   */
  async collectAll(
    sources?: SourceType[],
    options?: { incremental?: boolean; verbose?: boolean }
  ): Promise<Map<SourceType, CollectionResult>> {
    const results = new Map<SourceType, CollectionResult>();
    const targetSources = sources || (["shadcn", "monet", "v0", "axis"] as SourceType[]);

    console.log(chalk.blue("\n📦 Library Curator - 컴포넌트 수집 시작\n"));

    for (const source of targetSources) {
      const collector = this.collectors.get(source);
      if (!collector) {
        console.log(chalk.yellow(`⚠️  ${source} collector not found, skipping`));
        continue;
      }

      const spinner = ora(`${source} 수집 중...`).start();

      try {
        const result = await collector.collectAll({
          incremental: options?.incremental,
        });

        results.set(source, result);

        if (result.success) {
          spinner.succeed(
            `${source}: ${result.collected}개 수집 완료` +
              (result.failed > 0 ? chalk.yellow(` (${result.failed}개 실패)`) : "")
          );
        } else {
          spinner.fail(`${source}: 수집 실패 - ${result.errors[0]?.error}`);
        }
      } catch (error) {
        spinner.fail(`${source}: ${error instanceof Error ? error.message : "Unknown error"}`);
        results.set(source, {
          source,
          timestamp: new Date().toISOString(),
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
        });
      }
    }

    return results;
  }

  /**
   * 라이브러리 인덱스 생성
   */
  async generateIndex(): Promise<LibraryIndex> {
    const components: ComponentMeta[] = [];

    // 모든 소스에서 컴포넌트 수집
    for (const [source, collector] of this.collectors) {
      try {
        const list = await collector.listComponents();
        for (const item of list) {
          try {
            const meta = await collector.collectComponent(item.id);
            components.push(meta);
          } catch {
            // 개별 컴포넌트 실패 무시
          }
        }
      } catch {
        // 소스 실패 무시
      }
    }

    // 통계 계산
    const stats = this.calculateStats(components);

    // 태그 집계
    const tags = this.aggregateTags(components);

    return {
      version: "1.0.0",
      updatedAt: new Date().toISOString(),
      stats,
      components,
      categories: DEFAULT_CATEGORIES,
      tags,
    };
  }

  /**
   * 인덱스 저장
   */
  async saveIndex(index: LibraryIndex): Promise<void> {
    await fs.ensureDir(this.dataDir);

    // 전체 인덱스 저장
    const indexPath = path.join(this.dataDir, "components.json");
    await fs.writeJSON(indexPath, index, { spaces: 2 });

    // 카테고리별 파일 저장
    const categoriesDir = path.join(this.dataDir, "categories");
    await fs.ensureDir(categoriesDir);

    for (const category of DEFAULT_CATEGORIES) {
      const categoryComponents = index.components.filter((c) => c.category === category.id);
      const categoryPath = path.join(categoriesDir, `${category.id}.json`);
      await fs.writeJSON(
        categoryPath,
        {
          category: category.id,
          count: categoryComponents.length,
          components: categoryComponents,
        },
        { spaces: 2 }
      );
    }

    console.log(chalk.green(`\n✓ 인덱스 저장 완료: ${indexPath}`));
    console.log(chalk.gray(`  - 전체: ${index.stats.total}개 컴포넌트`));
  }

  /**
   * 인덱스 로드
   */
  async loadIndex(): Promise<LibraryIndex | null> {
    const indexPath = path.join(this.dataDir, "components.json");

    if (await fs.pathExists(indexPath)) {
      return await fs.readJSON(indexPath);
    }

    return null;
  }

  /**
   * 통계 계산
   */
  private calculateStats(components: ComponentMeta[]): LibraryStats {
    const bySource: Partial<Record<SourceType, number>> = {};
    const byCategory: Partial<Record<ComponentMeta["category"], number>> = {};

    for (const comp of components) {
      // 소스별 집계
      bySource[comp.source.type] = (bySource[comp.source.type] || 0) + 1;

      // 카테고리별 집계
      byCategory[comp.category] = (byCategory[comp.category] || 0) + 1;
    }

    return {
      total: components.length,
      bySource,
      byCategory,
    };
  }

  /**
   * 태그 집계
   */
  private aggregateTags(components: ComponentMeta[]): TagDefinition[] {
    const tagCounts = new Map<string, number>();

    for (const comp of components) {
      for (const tag of comp.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    return [...tagCounts.entries()]
      .map(([id, count]) => ({ id, name: id, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 컴포넌트 검색
   */
  async searchComponents(
    query: string,
    options?: { category?: string; source?: SourceType }
  ): Promise<ComponentMeta[]> {
    const index = await this.loadIndex();
    if (!index) return [];

    const queryLower = query.toLowerCase();

    return index.components.filter((comp) => {
      // 카테고리 필터
      if (options?.category && comp.category !== options.category) {
        return false;
      }

      // 소스 필터
      if (options?.source && comp.source.type !== options.source) {
        return false;
      }

      // 검색어 매칭
      return (
        comp.name.toLowerCase().includes(queryLower) ||
        comp.description.toLowerCase().includes(queryLower) ||
        comp.tags.some((t) => t.toLowerCase().includes(queryLower))
      );
    });
  }

  /**
   * 통계 출력
   */
  async printStats(): Promise<void> {
    const index = await this.loadIndex();

    if (!index) {
      console.log(chalk.yellow("\n⚠️  라이브러리 인덱스가 없습니다."));
      console.log(chalk.gray("   axis-cli library collect 명령어로 수집을 먼저 실행하세요.\n"));
      return;
    }

    console.log(chalk.blue("\n📊 Library Curator - 통계\n"));

    console.log(chalk.bold("전체 컴포넌트: ") + chalk.cyan(`${index.stats.total}개`));
    console.log(chalk.gray(`마지막 업데이트: ${index.updatedAt}\n`));

    console.log(chalk.bold("소스별:"));
    for (const [source, count] of Object.entries(index.stats.bySource)) {
      console.log(`  ${chalk.cyan(source.padEnd(10))} ${count}개`);
    }

    console.log(chalk.bold("\n카테고리별:"));
    for (const [category, count] of Object.entries(index.stats.byCategory)) {
      console.log(`  ${chalk.cyan(category.padEnd(15))} ${count}개`);
    }

    console.log(chalk.bold("\n인기 태그:"));
    const topTags = index.tags.slice(0, 10);
    for (const tag of topTags) {
      console.log(`  ${chalk.cyan(tag.name.padEnd(15))} ${tag.count}개`);
    }

    console.log();
  }
}

// CLI용 인스턴스
export const libraryCurator = new LibraryCurator();
