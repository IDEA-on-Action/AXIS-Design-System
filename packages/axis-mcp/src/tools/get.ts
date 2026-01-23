/**
 * AXIS Design System MCP - 조회 도구
 */

import { getComponent, getToken } from "../registry/loader.js";
import type { ComponentMeta, TokenMeta } from "../types.js";

export interface GetComponentParams {
  name: string;
}

export interface GetTokenParams {
  path: string;
}

/**
 * axis.get_component 도구 구현
 *
 * 컴포넌트 상세 정보를 조회합니다.
 */
export function handleGetComponent(
  params: GetComponentParams
): ComponentMeta | null {
  const { name } = params;

  if (!name || name.trim() === "") {
    throw new Error("컴포넌트 이름(name)은 필수입니다.");
  }

  const component = getComponent(name);

  if (!component) {
    return null;
  }

  return component;
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
export function formatComponentDetail(component: ComponentMeta | null): string {
  if (!component) {
    return "컴포넌트를 찾을 수 없습니다.";
  }

  const lines: string[] = [];

  lines.push(`# ${component.displayName}`);
  lines.push("");
  lines.push(`> ${component.description}`);
  lines.push("");

  // 기본 정보
  lines.push("## 기본 정보");
  lines.push(`- **이름**: \`${component.name}\``);
  lines.push(`- **카테고리**: ${component.category}`);
  lines.push(`- **패키지**: \`${component.package}\``);
  lines.push("");

  // 의존성
  if (component.dependencies.length > 0) {
    lines.push("## 의존성");
    lines.push("```bash");
    lines.push(`npm install ${component.dependencies.join(" ")}`);
    lines.push("```");
    lines.push("");
  }

  // 파일 목록
  if (component.files.length > 0) {
    lines.push("## 파일 구조");
    for (const file of component.files) {
      lines.push(`- \`${file.path}\` (${file.type})`);
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
