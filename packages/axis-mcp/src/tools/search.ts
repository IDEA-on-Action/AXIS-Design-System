/**
 * AXIS Design System MCP - 검색 도구
 */

import { searchComponents } from "../registry/loader.js";
import type { ComponentCategory, ComponentMeta } from "../types.js";

export interface SearchComponentsParams {
  query: string;
  category?: ComponentCategory;
}

export interface SearchComponentsResult {
  components: ComponentMeta[];
  totalCount: number;
  query: string;
  category?: ComponentCategory;
}

/**
 * axis.search_components 도구 구현
 *
 * 컴포넌트를 검색합니다.
 */
export function handleSearchComponents(
  params: SearchComponentsParams
): SearchComponentsResult {
  const { query, category } = params;

  if (!query || query.trim() === "") {
    throw new Error("검색어(query)는 필수입니다.");
  }

  const components = searchComponents(query, category);

  return {
    components,
    totalCount: components.length,
    query,
    category,
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
  lines.push("");

  if (result.components.length === 0) {
    lines.push("검색 결과가 없습니다.");
    return lines.join("\n");
  }

  for (const component of result.components) {
    lines.push(`### ${component.displayName} (\`${component.name}\`)`);
    lines.push(`- **설명**: ${component.description}`);
    lines.push(`- **카테고리**: ${component.category}`);
    lines.push(`- **패키지**: ${component.package}`);
    if (component.dependencies.length > 0) {
      lines.push(`- **의존성**: ${component.dependencies.join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
