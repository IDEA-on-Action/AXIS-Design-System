/**
 * AXIS Design System MCP - 조회 도구
 *
 * 컴포넌트 상세는 레지스트리 항목(설명 · 의존성 · 레지스트리 의존 · 파일)을 기본으로 하고, 보조 메타(components.json)에
 * 같은 이름이 있으면 props · examples 를 덧붙입니다(WI-0055 D2). 토큰은 번들 tokens.json 을 읽습니다.
 */

import { describeMissingName } from "@axis-ds/registry-core/add";
import { RegistryError, registryDependencyName } from "@axis-ds/registry-core/registry";
import { getComponentMeta, getToken } from "../registry/loader.js";
import type { ComponentExample, PropDefinition, TokenMeta } from "../types.js";
import {
  describeOrigin,
  noticeLines,
  openSource,
  toComponent,
  type RegistryComponent,
  type RegistryDeps,
} from "./registry-source.js";

export interface GetComponentParams {
  name: string;
}

export interface GetTokenParams {
  path: string;
}

/** 컴포넌트 상세 */
export interface ComponentDetail extends RegistryComponent {
  /** npm 의존성(레지스트리 항목 dependencies) */
  dependencies: string[];
  /** 함께 설치되는 레지스트리 항목 이름 */
  registryDependencies: string[];
  /** 레지스트리 파일 경로(설치 위치는 axis.config.json 배치를 따름) */
  files: { path: string; type?: string }[];
  props?: PropDefinition[];
  examples?: ComponentExample[];
}

export interface GetComponentResult {
  component: ComponentDetail | null;
  /** 없는 이름일 때 비슷한 이름 안내 */
  hint?: string;
  source: string;
  notices: string[];
}

/**
 * axis.get_component 도구 구현
 *
 * 컴포넌트 상세 정보를 조회합니다. 없는 이름은 오류가 아니라 null 과 안내를 돌려줍니다(종전과 같음).
 */
export async function handleGetComponent(
  params: GetComponentParams,
  deps: RegistryDeps = {}
): Promise<GetComponentResult> {
  const { name } = params;

  if (!name || name.trim() === "") {
    throw new Error("컴포넌트 이름(name)은 필수입니다.");
  }
  // 종전처럼 대소문자를 가리지 않습니다(레지스트리 이름은 모두 소문자)
  const wanted = name.trim().toLowerCase();

  const { client, notices } = await openSource(deps.cwd ?? process.cwd(), deps);
  const index = await client.getIndex();
  const entry = index.items.find((it) => it.name === wanted);
  const summary = entry ? toComponent(entry) : null;
  if (!entry || !summary) {
    // lib 항목(utils 등)은 다른 항목이 끌어오는 것이라 상세 대상이 아닙니다
    const hint = entry
      ? `'${wanted}' 는 다른 컴포넌트가 함께 설치하는 보조 항목입니다`
      : describeMissingName(wanted, wanted, index, undefined, false);
    return { component: null, hint, source: describeOrigin(client, index.version), notices };
  }

  let item;
  try {
    item = await client.getItem(wanted);
  } catch (error) {
    if (error instanceof RegistryError && error.code !== "unavailable") {
      return { component: null, hint: error.message, source: describeOrigin(client, index.version), notices };
    }
    throw error;
  }
  const meta = getComponentMeta(wanted);
  const component: ComponentDetail = {
    ...summary,
    description: item.description ?? summary.description,
    dependencies: item.dependencies,
    registryDependencies: item.registryDependencies.map((d) => registryDependencyName(d) ?? d),
    files: item.files.map((f) => ({ path: f.path, ...(f.type ? { type: f.type } : {}) })),
    ...(meta?.props ? { props: meta.props } : {}),
    ...(meta?.examples ? { examples: meta.examples } : {}),
  };
  // 항목 조회 중 동봉본으로 바뀌었을 수 있어 출처는 마지막에 정합니다
  const latest = await client.getIndex();
  return { component, source: describeOrigin(client, latest.version), notices };
}

/**
 * axis.get_token 도구 구현
 *
 * 토큰 상세 정보를 조회합니다.
 */
export function handleGetToken(params: GetTokenParams): TokenMeta | null {
  const { path } = params;

  if (!path || path.trim() === "") {
    throw new Error("토큰 경로(path)는 필수입니다.");
  }

  const token = getToken(path);

  if (!token) {
    return null;
  }

  return token;
}

/**
 * 컴포넌트 상세 정보를 Markdown 형식으로 포맷팅
 */
export function formatComponentDetail(result: GetComponentResult): string {
  const component = result.component;
  if (!component) {
    const lines = ["컴포넌트를 찾을 수 없습니다."];
    if (result.hint) lines.push(`- ${result.hint}`);
    lines.push(`- **출처**: ${result.source}`);
    lines.push(...noticeLines(result.notices));
    lines.push("목록: `axis.list_components`");
    return lines.join("\n");
  }

  const lines: string[] = [];

  lines.push(`# ${component.title}`);
  lines.push("");
  lines.push(`> ${component.description}`);
  lines.push("");

  // 기본 정보
  lines.push("## 기본 정보");
  lines.push(`- **이름**: \`${component.name}\``);
  lines.push(`- **카테고리**: ${component.category}`);
  lines.push(`- **패키지**: \`${component.package}\``);
  lines.push(`- **출처**: ${result.source}`);
  lines.push(...noticeLines(result.notices));
  lines.push("");

  // 의존성
  if (component.dependencies.length > 0) {
    lines.push("## 의존성");
    lines.push("```bash");
    lines.push(`npm install ${component.dependencies.join(" ")}`);
    lines.push("```");
    lines.push("");
  }

  if (component.registryDependencies.length > 0) {
    lines.push("## 함께 설치되는 항목");
    for (const dep of component.registryDependencies) {
      lines.push(`- \`${dep}\``);
    }
    lines.push("");
  }

  // 파일 목록
  if (component.files.length > 0) {
    lines.push("## 파일 구조");
    for (const file of component.files) {
      lines.push(file.type ? `- \`${file.path}\` (${file.type})` : `- \`${file.path}\``);
    }
    lines.push("");
  }

  // Props
  if (component.props && component.props.length > 0) {
    lines.push("## Props");
    lines.push("| 이름 | 타입 | 필수 | 기본값 | 설명 |");
    lines.push("|------|------|------|--------|------|");
    for (const prop of component.props) {
      const required = prop.required ? "✓" : "";
      const defaultVal = prop.default || "-";
      lines.push(
        `| \`${prop.name}\` | \`${prop.type}\` | ${required} | ${defaultVal} | ${prop.description} |`
      );
    }
    lines.push("");
  }

  // 예제
  if (component.examples && component.examples.length > 0) {
    lines.push("## 예제");
    for (const example of component.examples) {
      lines.push(`### ${example.title}`);
      if (example.description) {
        lines.push(example.description);
      }
      lines.push("```tsx");
      lines.push(example.code);
      lines.push("```");
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * 토큰 상세 정보를 Markdown 형식으로 포맷팅
 */
export function formatTokenDetail(token: TokenMeta | null): string {
  if (!token) {
    return "토큰을 찾을 수 없습니다.";
  }

  const lines: string[] = [];

  lines.push(`# 토큰: ${token.path}`);
  lines.push("");
  lines.push(`- **값**: \`${token.value}\``);
  lines.push(`- **카테고리**: ${token.category}`);
  if (token.description) {
    lines.push(`- **설명**: ${token.description}`);
  }
  if (token.cssVariable) {
    lines.push(`- **CSS 변수**: \`var(${token.cssVariable})\``);
  }

  return lines.join("\n");
}
