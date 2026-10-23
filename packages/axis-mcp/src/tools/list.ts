/**
 * AXIS Design System MCP - 목록 도구
 *
 * 컴포넌트 목록은 레지스트리 index(lib 제외 28개, WI-0055 D2)를, 토큰 목록은 번들 tokens.json 을 읽습니다.
 */

import { listTokens, getTokenStats } from "../registry/loader.js";
import type { ComponentCategory, TokenCategory, TokenMeta } from "../types.js";
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

export interface ListComponentsParams {
  category?: ComponentFilter;
}

export interface ListTokensParams {
  category?: TokenCategory;
}

export interface ListComponentsResult {
  components: RegistryComponent[];
  totalCount: number;
  /** 레지스트리 전체(필터 전) 카테고리별 개수 */
  stats: Record<ComponentCategory, number>;
  /** 레지스트리 전체 ui · agentic 개수 */
  kinds: { ui: number; agentic: number };
  category?: ComponentFilter;
  /** 출처 표시(원격 · 동봉본과 version) */
  source: string;
  notices: string[];
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
 * 레지스트리의 컴포넌트 목록을 조회합니다. lib 항목은 다른 항목이 끌어오는 것이라 뺍니다(cli list 와 같음).
 */
export async function handleListComponents(
  params: ListComponentsParams,
  deps: RegistryDeps = {}
): Promise<ListComponentsResult> {
  const { category } = params;
  const { client, notices } = await openSource(deps.cwd ?? process.cwd(), deps);
  const index = await client.getIndex();
  const all = componentsOf(index);
  const stats: Record<ComponentCategory, number> = { core: 0, agentic: 0, form: 0, layout: 0 };
  const kinds = { ui: 0, agentic: 0 };
  for (const c of all) {
    stats[c.category]++;
    kinds[c.kind]++;
  }
  const components = all.filter((c) => matchesFilter(c, category));
  return {
    components,
    totalCount: components.length,
    stats,
    kinds,
    category,
    source: describeOrigin(client, index.version),
    notices,
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
  lines.push(`- **출처**: ${result.source}`);
  lines.push(`- **전체**: UI ${result.kinds.ui}개 · Agentic ${result.kinds.agentic}개`);
  lines.push(...noticeLines(result.notices));
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
  const grouped: Record<string, RegistryComponent[]> = {};
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

  lines.push("설치: `axis.install_component` 에 `name`(또는 `names`)과 프로젝트 루트 `targetDir` 를 주세요. 이름은 위 표의 이름 그대로입니다(agentic 은 `agentic-` 접두 포함).");

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
