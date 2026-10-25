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

// 토큰 카테고리(WI-0076: @axis-ds/tokens 에서 생성. 원천이 없던 animation 은 빼고 density · component 를 더했습니다)
export const TOKEN_CATEGORIES = [
  "color",
  "typography",
  "spacing",
  "radius",
  "shadow",
  "density",
  "component",
] as const;
export type TokenCategory = (typeof TOKEN_CATEGORIES)[number];

// 토큰 메타데이터(dist/data/tokens.json, 빌드 때 tokens 산출물에서 생성)
export interface TokenMeta {
  /** 조회 경로(1.3.5 까지의 경로는 그대로 유지) */
  path: string;
  /** 라이트(:root) 값 */
  value: string;
  /** 다크(.dark) 값 */
  dark?: string;
  category: TokenCategory;
  description?: string;
  /** tokens 산출물에 실제로 정의된 CSS 변수 이름 */
  cssVariable: string;
  /** path 밖에 함께 받는 경로(tokens 이름 기반) */
  aliases?: string[];
}

// 레지스트리 데이터
export interface Registry {
  components: ComponentMeta[];
  tokens: TokenMeta[];
  /** 토큰 데이터를 생성한 @axis-ds/tokens 버전 */
  tokenSource?: { package: string; version: string };
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
  name?: string;
  names?: string[];
  targetDir: string;
  overwrite?: boolean;
}

// MCP 도구 결과 타입
export interface SearchResult {
  components: ComponentMeta[];
  totalCount: number;
}

// axis.install_component 결과(WI-0055: 레지스트리 · 공유 코어 기반)
export interface InstallResult {
  success: boolean;
  /** 해석한 프로젝트 루트(절대 경로) */
  root: string;
  /** 레지스트리 주소(가림)와 출처 · version(D13, 항상) */
  source: string;
  /** 설치 항목(의존 항목 먼저) */
  items: string[];
  /** 새로 만든 파일(프로젝트 루트 기준) */
  installedFiles: string[];
  /** 덮어쓴 파일(overwrite: true) */
  overwrittenFiles: string[];
  /** 같은 내용이라 건너뛴 파일 */
  unchangedFiles: string[];
  /** 내용이 달라 건너뛴 파일(사용자 수정 유지) */
  skippedFiles: string[];
  /** package.json 에 없는 의존성 추가 명령 */
  dependencyCommand?: string;
  /** axis.config.json 이 없어 기본 배치로 설치했는지 */
  usedDefaultLayout: boolean;
  notices: string[];
  errors: string[];
  message: string;
}
