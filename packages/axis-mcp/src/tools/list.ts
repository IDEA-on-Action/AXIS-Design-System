/**
 * AXIS Design System MCP - 목록 도구
 */

import {
  listComponents,
  listTokens,
  getComponentStats,
  getTokenStats,
} from "../registry/loader.js";
import type {
  ComponentCategory,
  TokenCategory,
  ComponentMeta,
  TokenMeta,
} from "../types.js";

export interface ListComponentsParams {
  category?: ComponentCategory;
}

export interface ListTokensParams {
  category?: TokenCategory;
}

export interface ListComponentsResult {
  components: ComponentMeta[];
  totalCount: number;
  stats: Record<ComponentCategory, number>;
  category?: ComponentCategory;
}

export interface ListTokensResult {
  tokens: TokenMeta[];
  totalCount: number;
  stats: Record<TokenCategory, number>;
  category?: TokenCategory;
}

/**
 * axis.list_components 도구 구현
 *
 * 컴포넌트 목록을 조회합니다.
 */
export function handleListComponents(
  params: ListComponentsParams
): ListComponentsResult {
  const { category } = params;
  const components = listComponents(category);
  const stats = getComponentStats();

  return {
    components,
    totalCount: components.length,
    stats,
    category,
  };
}

/**
 * axis.list_tokens 도구 구현
 *
 * 토큰 목록을 조회합니다.
 */
export function handleListTokens(params: ListTokensParams): ListTokensResult {
  const { category } = params;
  const tokens = listTokens(category);
  const stats = getTokenStats();

  return {
    tokens,
    totalCount: tokens.length,
    stats,
    category,
  };
}

/**
 * 컴포넌트 목록을 Markdown 형식으로 포맷팅
 */
export function formatComponentList(result: ListComponentsResult): string {
  const lines: string[] = [];

  lines.push("# AXIS Design System 컴포넌트 목록");
  lines.push("");

  // 통계
  lines.push("## 카테고리별 통계");
  lines.push("| 카테고리 | 개수 |");
  lines.push("|----------|------|");
  lines.push(`| Core | ${result.stats.core} |`);
  lines.push(`| Form | ${result.stats.form} |`);
  lines.push(`| Layout | ${result.stats.layout} |`);
  lines.push(`| Agentic | ${result.stats.agentic} |`);
  lines.push(`| **합계** | **${result.totalCount}** |`);
  lines.push("");

  if (result.category) {
    lines.push(`## ${result.category} 카테고리 컴포넌트`);
  } else {
    lines.push("## 전체 컴포넌트");
  }
  lines.push("");

  // 카테고리별 그룹핑
  const grouped: Record<string, ComponentMeta[]> = {};
  for (const component of result.components) {
    if (!grouped[component.category]) {
      grouped[component.category] = [];
    }
    grouped[component.category].push(component);
  }

  for (const [category, components] of Object.entries(grouped)) {
    lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)}`);
    lines.push("| 이름 | 설명 | 패키지 |");
    lines.push("|------|------|--------|");
    for (const c of components) {
      lines.push(`| \`${c.name}\` | ${c.description} | ${c.package} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * 토큰 목록을 Markdown 형식으로 포맷팅
 */
export function formatTokenList(result: ListTokensResult): string {
  const lines: string[] = [];

  lines.push("# AXIS Design System 토큰 목록");
  lines.push("");

  // 통계
  lines.push("## 카테고리별 통계");
  lines.push("| 카테고리 | 개수 |");
  lines.push("|----------|------|");
  lines.push(`| Color | ${result.stats.color} |`);
  lines.push(`| Typography | ${result.stats.typography} |`);
  lines.push(`| Spacing | ${result.stats.spacing} |`);
  lines.push(`| Radius | ${result.stats.radius} |`);
  lines.push(`| Shadow | ${result.stats.shadow} |`);
  lines.push(`| Animation | ${result.stats.animation} |`);
  lines.push(`| **합계** | **${result.totalCount}** |`);
  lines.push("");

  if (result.category) {
    lines.push(`## ${result.category} 토큰`);
  } else {
    lines.push("## 전체 토큰");
  }
  lines.push("");

  // 카테고리별 그룹핑
  const grouped: Record<string, TokenMeta[]> = {};
  for (const token of result.tokens) {
    if (!grouped[token.category]) {
      grouped[token.category] = [];
    }
    grouped[token.category].push(token);
  }

  for (const [category, tokens] of Object.entries(grouped)) {
    lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)}`);
    lines.push("| 경로 | 값 | 설명 |");
    lines.push("|------|-----|------|");
    for (const t of tokens) {
      const desc = t.description || "-";
      lines.push(`| \`${t.path}\` | \`${t.value}\` | ${desc} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
