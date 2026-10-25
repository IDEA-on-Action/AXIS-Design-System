/**
 * AXIS Design System MCP - 목록 도구
 *
 * 컴포넌트 목록은 레지스트리 index(lib 제외 28개, WI-0055 D2)를, 토큰 목록은 번들 tokens.json 을 읽습니다.
 * 번들 tokens.json 은 빌드 때 @axis-ds/tokens 산출물에서 생성합니다(WI-0076).
 */

import { listTokens, getTokenStats, getTokenSource } from "../registry/loader.js";
import {
  TOKEN_CATEGORIES,
  type ComponentCategory,
  type TokenCategory,
  type TokenMeta,
} from "../types.js";
import { cssUsage } from "./get.js";
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
  /** 전체(필터 전) 카테고리별 개수 */
  stats: Record<TokenCategory, number>;
  category?: TokenCategory;
  /** 생성에 쓴 @axis-ds/tokens 버전(없으면 표시하지 않음) */
  sourceVersion?: string;
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
    sourceVersion: getTokenSource()?.version,
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

/** 카테고리 표시 이름 */
const TOKEN_CATEGORY_LABELS: Record<TokenCategory, string> = {
  color: "Color",
  typography: "Typography",
  spacing: "Spacing",
  radius: "Radius",
  shadow: "Shadow",
  density: "Density (밀도)",
  component: "Component",
};

/** 표 칸 안의 | 를 이스케이프합니다 */
const cell = (v: string) => v.replace(/\|/g, "\\|");

/**
 * 토큰 목록을 Markdown 형식으로 포맷팅
 */
export function formatTokenList(result: ListTokensResult): string {
  const lines: string[] = [];
  const total = TOKEN_CATEGORIES.reduce((n, c) => n + result.stats[c], 0);

  lines.push("# AXIS Design System 토큰 목록");
  lines.push("");
  if (result.sourceVersion) {
    lines.push(`- **출처**: @axis-ds/tokens ${result.sourceVersion} 빌드 산출물에서 생성(라이트 :root · 다크 .dark)`);
  }
  lines.push("- **브랜드 값**: `axis.list_brands` · `axis.get_brand` 로 조회하세요(대상 프로젝트에 설치된 tokens 를 읽음)");
  lines.push("");

  // 통계(전체 기준)
  lines.push("## 카테고리별 통계");
  lines.push("| 카테고리 | 개수 |");
  lines.push("|----------|------|");
  for (const c of TOKEN_CATEGORIES) {
    lines.push(`| ${TOKEN_CATEGORY_LABELS[c]} | ${result.stats[c]} |`);
  }
  lines.push(`| **합계** | **${total}** |`);
  lines.push("");

  if (result.category) {
    lines.push(`## ${result.category} 토큰 (${result.totalCount}개)`);
  } else {
    lines.push("## 전체 토큰");
  }
  lines.push("");

  // 카테고리별 그룹핑(카테고리 순서 고정)
  for (const c of TOKEN_CATEGORIES) {
    const tokens = result.tokens.filter((t) => t.category === c);
    if (tokens.length === 0) continue;
    lines.push(`### ${TOKEN_CATEGORY_LABELS[c]}`);
    lines.push("| 경로 | 값 | 다크 | CSS | 설명 |");
    lines.push("|------|-----|------|-----|------|");
    for (const t of tokens) {
      const dark = t.dark === undefined ? "-" : t.dark === t.value ? "(같음)" : `\`${cell(t.dark)}\``;
      lines.push(
        `| \`${t.path}\` | \`${cell(t.value)}\` | ${dark} | \`${cssUsage(t)}\` | ${t.description ? cell(t.description) : "-"} |`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}
