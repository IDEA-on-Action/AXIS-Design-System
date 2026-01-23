/**
 * AXIS Design System MCP - TypeScript 타입 정의
 */

// 컴포넌트 카테고리
export type ComponentCategory = "core" | "agentic" | "form" | "layout";

// 패키지 이름
export type PackageName = "@axis-ds/ui-react" | "@axis-ds/agentic-ui";

// 컴포넌트 파일 정보
export interface ComponentFile {
  path: string;
  type: "component" | "style" | "test" | "story" | "types";
}

// 컴포넌트 메타데이터
export interface ComponentMeta {
  name: string;
  displayName: string;
  description: string;
  category: ComponentCategory;
  package: PackageName;
  dependencies: string[];
  peerDependencies?: string[];
  files: ComponentFile[];
  props?: PropDefinition[];
  examples?: ComponentExample[];
}

// 컴포넌트 Props 정의
export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
}

// 컴포넌트 예제
export interface ComponentExample {
  title: string;
  code: string;
  description?: string;
}

// 토큰 카테고리
export type TokenCategory = "color" | "typography" | "spacing" | "radius" | "shadow" | "animation";

// 토큰 메타데이터
export interface TokenMeta {
  path: string;
  value: string;
  category: TokenCategory;
  description?: string;
  cssVariable?: string;
}

// 레지스트리 데이터
export interface Registry {
  components: ComponentMeta[];
  tokens: TokenMeta[];
}

// MCP 도구 입력 타입
export interface SearchComponentsInput {
  query: string;
  category?: ComponentCategory;
}

export interface GetComponentInput {
  name: string;
}

export interface ListComponentsInput {
  category?: ComponentCategory;
}

export interface ListTokensInput {
  category?: TokenCategory;
}

export interface GetTokenInput {
  path: string;
}

export interface InstallComponentInput {
  name: string;
  targetDir: string;
}

// MCP 도구 결과 타입
export interface SearchResult {
  components: ComponentMeta[];
  totalCount: number;
}

export interface InstallResult {
  success: boolean;
  installedFiles: string[];
  dependencies: string[];
  message: string;
}
