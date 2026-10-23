/**
 * AXIS Design System MCP - 검색 도구
 *
 * 레지스트리 index(lib 제외, WI-0055 D2)의 이름 · 제목 · 설명과 보조 메타의 표시 이름 · 설명에서 찾습니다.
 */

import { getComponentMeta } from "../registry/loader.js";
import {
  componentsOf,
  describeOrigin,
  matchesFilter,
  noticeLines,
  openSource,
  type ComponentFilter,
  type RegistryComponent,
  type RegistryDeps,
} from "./registry-source.js";

export interface SearchComponentsParams {
  query: string;
  category?: ComponentFilter;
}

export interface SearchComponentsResult {
  components: RegistryComponent[];
  totalCount: number;
  query: string;
  category?: ComponentFilter;
  source: string;
  notices: string[];
}

function matchesQuery(component: RegistryComponent, lowerQuery: string): boolean {
  const meta = getComponentMeta(component.name);
  const fields = [component.name, component.title, component.description, meta?.displayName, meta?.description];
  return fields.some((f) => typeof f === "string" && f.toLowerCase().includes(lowerQuery));
}

/**
 * axis.search_components 도구 구현
 *
 * 컴포넌트를 검색합니다.
 */
export async function handleSearchComponents(
  params: SearchComponentsParams,
  deps: RegistryDeps = {}
): Promise<SearchComponentsResult> {
  const { query, category } = params;

  if (!query || query.trim() === "") {
    throw new Error("검색어(query)는 필수입니다.");
  }

  const { client, notices } = await openSource(deps.cwd ?? process.cwd(), deps);
  const index = await client.getIndex();
  const lowerQuery = query.trim().toLowerCase();
  const components = componentsOf(index).filter((c) => matchesFilter(c, category) && matchesQuery(c, lowerQuery));

  return {
    components,
    totalCount: components.length,
    query,
    category,
    source: describeOrigin(client, index.version),
    notices,
  };
}

/**
 * 검색 결과를 Markdown 형식으로 포맷팅
 */
export function formatSearchResult(result: SearchComponentsResult): string {
  const lines: string[] = [];

  lines.push(`## 검색 결과: "${result.query}"`);
  if (result.category) {
    lines.push(`**카테고리**: ${result.category}`);
  }
  lines.push(`**총 ${result.totalCount}개 컴포넌트 발견**`);
  lines.push(`- **출처**: ${result.source}`);
  lines.push(...noticeLines(result.notices));
  lines.push("");

  if (result.components.length === 0) {
    lines.push("검색 결과가 없습니다.");
    return lines.join("\n");
  }

  for (const component of result.components) {
    lines.push(`### ${component.title} (\`${component.name}\`)`);
    lines.push(`- **설명**: ${component.description}`);
    lines.push(`- **카테고리**: ${component.category}`);
    lines.push(`- **패키지**: ${component.package}`);
    lines.push("");
  }

  return lines.join("\n");
}
