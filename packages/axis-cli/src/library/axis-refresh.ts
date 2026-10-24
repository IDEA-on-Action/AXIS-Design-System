/**
 * Library Curator - AXIS 항목만 다시 만들기 (WI-0057 D1)
 *
 * `apps/web/public/library` 의 AXIS 항목(source.type === "axis")만 저장소 소스에서 다시 만들고,
 * 외부 소스(shadcn · monet 등) 항목은 읽은 그대로 둡니다. 원격에 접속하지 않습니다(AxisCollector 는 파일만 읽음).
 *
 * 결정성
 * - 수집 순서 · 코드 파일 순서는 이름순입니다(AxisCollector).
 * - updatedAt: 내용(updatedAt 제외)이 기존 파일과 같으면 기존 값을 유지하고, 바뀌거나 새로 생긴 항목만 `updatedAt` 옵션 값을 씁니다.
 *   그래서 같은 소스로 다시 돌리면 아무 파일도 바뀌지 않습니다.
 * - index.json · meta.json 의 updatedAt 은 모든 항목 updatedAt 의 최댓값입니다.
 *
 * 외부 소스 항목
 * - components/<slug>.json 은 쓰지 않습니다(바이트 그대로). slug 가 겹치면 그 파일의 지금 소유자를 유지합니다:
 *   이미 AXIS 파일이면 AXIS 가 다시 쓰고, 외부 파일이면 손대지 않고 그 AXIS 항목을 `shadowedAxis` 로 알립니다
 *   (slug 충돌 자체는 WI-0057 범위 밖 E4).
 * - index.json · search-index.json · categories/*.json 의 외부 항목은 객체를 그대로 옮깁니다. 세 파일 중 일부에만 있는 외부 항목은
 *   다른 파일의 같은 항목에서 같은 형태로 만들어 채웁니다(2026-02-01 손수정으로 index.json 에서 빠진 shadcn 15개 등).
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import type { Command } from "commander";
import { isDeepStrictEqual } from "node:util";
import { AxisCollector } from "./axis-collector.js";
import {
  toIndexEntry,
  toPublicComponent,
  toSearchItem,
  type PublicComponent,
  type PublicIndexEntry,
  type SearchIndexItem,
} from "./publisher.js";
import type { CategoryDefinition, LibraryStats, TagDefinition } from "./types.js";

export interface RefreshAxisOptions {
  /** 저장소 루트 */
  rootDir: string;
  /** library 디렉터리. 기본 `<rootDir>/apps/web/public/library` */
  libraryDir?: string;
  /** 바뀌거나 새로 생긴 AXIS 항목에 기록할 시각(ISO 8601) */
  updatedAt: string;
  /** true 면 파일을 쓰거나 지우지 않고 결과만 돌려줍니다 */
  dryRun?: boolean;
  /** 테스트용 수집기 주입 */
  collector?: AxisCollector;
}

export interface RefreshAxisResult {
  added: string[];
  changed: string[];
  unchanged: string[];
  removed: string[];
  /** slug 가 외부 항목 파일과 겹쳐 components/<slug>.json 을 갖지 못한 AXIS 항목(외부 파일을 덮어쓰지 않음, E4) */
  shadowedAxis: string[];
  /** 내용이 바뀌어 쓴(또는 dryRun 이면 쓸) 파일, libraryDir 기준 */
  writtenFiles: string[];
  /** 지운(또는 지울) 파일, libraryDir 기준 */
  removedFiles: string[];
  stats: LibraryStats;
}

interface CategoryFile {
  category: string;
  name: string;
  description: string;
  icon?: string;
  count: number;
  components: PublicComponent[];
}

const AXIS = "axis";
const META_TAG_LIMIT = 50;

/** 오늘(KST) 날짜의 00:00:00.000Z. CLI 기본값이라 같은 날 다시 돌려도 같은 값입니다 */
export function defaultUpdatedAt(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.toISOString().slice(0, 10)}T00:00:00.000Z`;
}

function serialize(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

async function readJson<T>(file: string): Promise<T> {
  if (!(await fs.pathExists(file))) {
    throw new Error(`library 파일이 없습니다: ${file}`);
  }
  return JSON.parse(await fs.readFile(file, "utf-8")) as T;
}

function withoutUpdatedAt(c: PublicComponent): Omit<PublicComponent, "updatedAt"> {
  // 구조 분해로 버리면 미사용 변수가 남아 복사본에서 지웁니다. 남은 키의 순서는 같아요
  const rest: Partial<PublicComponent> = { ...c };
  delete rest.updatedAt;
  return JSON.parse(serialize(rest));
}

export function computeStats(entries: PublicIndexEntry[]): LibraryStats {
  const bySource: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const e of entries) {
    bySource[e.source] = (bySource[e.source] || 0) + 1;
    byCategory[e.category] = (byCategory[e.category] || 0) + 1;
  }
  return {
    total: entries.length,
    bySource: bySource as LibraryStats["bySource"],
    byCategory: byCategory as LibraryStats["byCategory"],
  };
}

function aggregateTags(entries: PublicIndexEntry[]): TagDefinition[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    for (const tag of e.tags) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ id, name: id, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * AXIS 항목만 다시 만듭니다.
 */
export async function refreshAxisLibrary(options: RefreshAxisOptions): Promise<RefreshAxisResult> {
  const libraryDir = options.libraryDir || path.join(options.rootDir, "apps/web/public/library");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(options.updatedAt)) {
    throw new Error(`updatedAt 은 ISO 8601 UTC(예: 2026-10-23T00:00:00.000Z)여야 합니다: ${options.updatedAt}`);
  }

  // ---- 1. 기존 데이터 읽기 ----
  const index = await readJson<{
    version: string;
    updatedAt: string;
    stats: LibraryStats;
    categories: CategoryDefinition[];
    components: PublicIndexEntry[];
  }>(path.join(libraryDir, "index.json"));
  const searchIndex = await readJson<SearchIndexItem[]>(path.join(libraryDir, "search-index.json"));
  const meta = await readJson<{
    version: string;
    updatedAt: string;
    stats: LibraryStats;
    categories: CategoryDefinition[];
    tags: TagDefinition[];
  }>(path.join(libraryDir, "meta.json"));

  const categoryFiles = new Map<string, CategoryFile>();
  for (const def of index.categories) {
    categoryFiles.set(def.id, await readJson<CategoryFile>(path.join(libraryDir, "categories", `${def.id}.json`)));
  }

  const componentsDir = path.join(libraryDir, "components");
  const existingFiles = new Map<string, { raw: string; data: PublicComponent }>();
  for (const name of (await fs.readdir(componentsDir)).filter((n) => n.endsWith(".json")).sort()) {
    const raw = await fs.readFile(path.join(componentsDir, name), "utf-8");
    existingFiles.set(name.slice(0, -".json".length), { raw, data: JSON.parse(raw) });
  }

  // ---- 2. 외부 소스 항목(그대로 유지) ----
  const extIndex = new Map<string, PublicIndexEntry>();
  const extSearch = new Map<string, SearchIndexItem>();
  const extCategory = new Map<string, PublicComponent>();
  const extOrder: string[] = [];
  const remember = (id: string) => {
    if (!extOrder.includes(id)) extOrder.push(id);
  };
  for (const s of searchIndex) {
    if (s.source === AXIS) continue;
    extSearch.set(s.id, s);
    remember(s.id);
  }
  for (const e of index.components) {
    if (e.source === AXIS) continue;
    extIndex.set(e.id, e);
    remember(e.id);
  }
  const extCategoryOrder = new Map<string, string[]>();
  for (const [catId, file] of categoryFiles) {
    const ids: string[] = [];
    for (const c of file.components) {
      if (c.source.type === AXIS) continue;
      extCategory.set(c.id, c);
      ids.push(c.id);
      remember(c.id);
    }
    extCategoryOrder.set(catId, ids);
  }

  for (const id of extOrder) {
    const full = extCategory.get(id);
    const idx = extIndex.get(id);
    if (!full) {
      // categories 에 없으면 코드를 복원할 곳이 없습니다. 조용히 빼지 않고 멈춥니다.
      throw new Error(`외부 항목 ${id} 가 categories/*.json 에 없어 정합을 맞출 수 없습니다`);
    }
    if (!idx) extIndex.set(id, toIndexEntry(full));
    if (!extSearch.has(id)) extSearch.set(id, toSearchItem(full));
    if (!extCategoryOrder.get(full.category)?.includes(id)) {
      throw new Error(`외부 항목 ${id} 의 category(${full.category}) 파일에 항목이 없습니다`);
    }
  }

  // ---- 3. AXIS 항목 다시 수집 ----
  const collector = options.collector || new AxisCollector({ rootDir: options.rootDir });
  const axisComponents: PublicComponent[] = [];
  const added: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];
  // 기존 AXIS 항목(전체 형태): categories 항목, 같은 id 의 컴포넌트 파일이 있으면 그것으로 덮어씀.
  // slug 가 외부 파일과 겹쳐 파일이 없는 항목(shadowedAxis)도 categories 에서 찾으므로 다시 돌려도 updatedAt 이 유지됩니다.
  const oldAxis = new Map<string, PublicComponent>();
  for (const file of categoryFiles.values()) {
    for (const c of file.components) if (c.source.type === AXIS) oldAxis.set(c.id, c);
  }
  for (const f of existingFiles.values()) if (f.data.source?.type === AXIS) oldAxis.set(f.data.id, f.data);
  for (const item of await collector.listComponents()) {
    const fresh = toPublicComponent(await collector.collectComponent(item.id));
    const old = oldAxis.get(fresh.id);
    if (old && isDeepStrictEqual(withoutUpdatedAt(old), withoutUpdatedAt(fresh))) {
      fresh.updatedAt = old.updatedAt;
      unchanged.push(fresh.id);
    } else {
      fresh.updatedAt = options.updatedAt;
      const existedBefore =
        !!old || index.components.some((e) => e.id === fresh.id) || searchIndex.some((e) => e.id === fresh.id);
      (existedBefore ? changed : added).push(fresh.id);
    }
    axisComponents.push(JSON.parse(serialize(fresh)));
  }
  if (axisComponents.length === 0) {
    // 수집 0건은 경로 오류일 가능성이 큽니다. 전부 지우는 대신 멈춥니다.
    throw new Error(`AXIS 컴포넌트를 하나도 찾지 못했습니다(rootDir: ${options.rootDir})`);
  }
  const axisIds = new Set(axisComponents.map((c) => c.id));

  const oldAxisIds = new Set<string>();
  for (const e of index.components) if (e.source === AXIS) oldAxisIds.add(e.id);
  for (const e of searchIndex) if (e.source === AXIS) oldAxisIds.add(e.id);
  for (const file of categoryFiles.values()) {
    for (const c of file.components) if (c.source.type === AXIS) oldAxisIds.add(c.id);
  }
  for (const f of existingFiles.values()) if (f.data.source?.type === AXIS) oldAxisIds.add(f.data.id);
  const removed = [...oldAxisIds].filter((id) => !axisIds.has(id)).sort();

  // ---- 4. 집계 파일 조립 ----
  const indexEntries: PublicIndexEntry[] = [
    ...extOrder.map((id) => extIndex.get(id)!),
    ...axisComponents.map((c) => toIndexEntry(c)),
  ];
  const searchItems: SearchIndexItem[] = [
    ...extOrder.map((id) => extSearch.get(id)!),
    ...axisComponents.map((c) => toSearchItem(c)),
  ];
  const stats = computeStats(indexEntries);

  const allPublic: PublicComponent[] = [...extOrder.map((id) => extCategory.get(id)!), ...axisComponents];
  const updatedAt = allPublic.map((c) => c.updatedAt).filter(Boolean).sort().at(-1) || index.updatedAt;

  const outputs = new Map<string, string>();
  outputs.set(
    "index.json",
    serialize({
      version: index.version,
      updatedAt,
      stats,
      categories: index.categories,
      components: indexEntries,
    })
  );
  outputs.set("search-index.json", serialize(searchItems));
  outputs.set(
    "meta.json",
    serialize({
      version: meta.version,
      updatedAt,
      stats,
      categories: meta.categories,
      tags: aggregateTags(indexEntries).slice(0, META_TAG_LIMIT),
    })
  );
  const knownCategories = new Set<string>(index.categories.map((d) => d.id));
  for (const c of axisComponents) {
    if (!knownCategories.has(c.category)) {
      throw new Error(`AXIS 항목 ${c.id} 의 category(${c.category}) 가 index.json categories 에 없습니다`);
    }
  }
  for (const def of index.categories) {
    const old = categoryFiles.get(def.id)!;
    const components = [
      ...(extCategoryOrder.get(def.id) || []).map((id) => extCategory.get(id)!),
      ...axisComponents.filter((c) => c.category === def.id),
    ];
    outputs.set(
      `categories/${def.id}.json`,
      serialize({
        category: old.category,
        name: old.name,
        description: old.description,
        icon: old.icon,
        count: components.length,
        components,
      })
    );
  }

  // components/<slug>.json: AXIS 가 있으면 AXIS, 없으면 기존 외부 파일 유지, 기존 파일이 그 slug 의 외부 항목이 아니면 categories 에서 복원
  const finalSlugs = new Set<string>();
  const axisBySlug = new Map(axisComponents.map((c) => [c.slug, c]));
  for (const c of allPublic) finalSlugs.add(c.slug);
  const shadowedAxis: string[] = [];
  for (const slug of [...finalSlugs].sort()) {
    const axis = axisBySlug.get(slug);
    const existing = existingFiles.get(slug);
    const extForSlug = extOrder.map((id) => extCategory.get(id)!).filter((c) => c.slug === slug);
    const existingIsExternal = !!existing && extForSlug.some((c) => c.id === existing.data.id);
    if (existingIsExternal) {
      // 외부 파일은 손대지 않습니다. slug 가 겹치는 새 AXIS 항목은 파일을 갖지 못합니다(E4, 범위 밖)
      if (axis) shadowedAxis.push(axis.id);
      continue;
    }
    if (axis) {
      outputs.set(`components/${slug}.json`, serialize(axis));
      continue;
    }
    outputs.set(`components/${slug}.json`, serialize(extForSlug[0]));
  }

  // ---- 5. 쓰기 ----
  const writtenFiles: string[] = [];
  for (const [rel, content] of outputs) {
    const file = path.join(libraryDir, rel);
    const before = (await fs.pathExists(file)) ? await fs.readFile(file, "utf-8") : undefined;
    if (before === content) continue;
    writtenFiles.push(rel);
    if (!options.dryRun) await fs.writeFile(file, content, "utf-8");
  }
  const removedFiles: string[] = [];
  for (const slug of existingFiles.keys()) {
    if (finalSlugs.has(slug)) continue;
    const rel = `components/${slug}.json`;
    removedFiles.push(rel);
    if (!options.dryRun) await fs.remove(path.join(libraryDir, rel));
  }

  return { added, changed, unchanged, removed, shadowedAxis, writtenFiles, removedFiles, stats };
}

/**
 * `axis library refresh-axis` 등록. 저장소 루트에서 실행합니다(루트 스크립트 `pnpm library:refresh-axis`).
 */
export function registerRefreshAxisCommand(libraryCmd: Command): void {
  libraryCmd
    .command("refresh-axis")
    .description("AXIS 항목만 저장소 소스에서 다시 만듦 (외부 소스 항목은 그대로, 네트워크 없음)")
    .option("--root <dir>", "저장소 루트", process.cwd())
    .option("-o, --output <dir>", "library 디렉터리 (루트 기준)", "apps/web/public/library")
    .option("--updated-at <iso>", "바뀐 항목에 기록할 시각 (기본: 오늘 KST 날짜의 00:00:00.000Z)")
    .option("--dry-run", "파일을 쓰지 않고 바뀔 내용만 출력")
    .action(async (opts: { root: string; output: string; updatedAt?: string; dryRun?: boolean }) => {
      const rootDir = path.resolve(opts.root);
      const result = await refreshAxisLibrary({
        rootDir,
        libraryDir: path.resolve(rootDir, opts.output),
        updatedAt: opts.updatedAt || defaultUpdatedAt(),
        dryRun: opts.dryRun,
      });
      const head = opts.dryRun ? "[dry-run] " : "";
      console.log(chalk.blue(`\n${head}AXIS library 재생성`));
      console.log(
        `  추가 ${result.added.length} · 변경 ${result.changed.length} · 유지 ${result.unchanged.length} · 삭제 ${result.removed.length}`
      );
      for (const id of result.added) console.log(chalk.green(`  + ${id}`));
      for (const id of result.changed) console.log(chalk.yellow(`  ~ ${id}`));
      for (const id of result.removed) console.log(chalk.red(`  - ${id}`));
      if (result.shadowedAxis.length > 0) {
        console.log(
          chalk.yellow(`  slug 가 외부 항목 파일과 겹쳐 파일을 쓰지 않음(E4): ${result.shadowedAxis.join(", ")}`)
        );
      }
      console.log(`  파일 쓰기 ${result.writtenFiles.length}개 · 삭제 ${result.removedFiles.length}개`);
      console.log(`  전체 ${result.stats.total}개 ${JSON.stringify(result.stats.bySource)}\n`);
    });
}
