/** 템플릿 CLI 타입 정의 */

// --- 레지스트리 응답 타입 ---

export interface TemplateIndexEntry {
  name: string;
  slug: string;
  description: string;
  category: string;
  version: string;
  author?: string;
  tags: string[];
  features: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  /** 템플릿 유형: local(기본) 또는 external(외부 링크) */
  type?: 'local' | 'external';
  /** external 타입 시 외부 링크 URL */
  externalUrl?: string;
  // template.json 의 `checks`(WI-0107)는 빌드 · 동기화 테스트 전용 메타데이터라 런타임 타입에 두지 않습니다.
  // axis check 가 돌릴 검사는 registry-core 정적 표(TEMPLATE_CHECKS)로만 정합니다(원격 템플릿 JSON 이 검사 선택을 좌우하지 않게).
  /** 출처: 'axis' | 'shadcn' 등 */
  source?: string;
  /** 미리보기 이미지 URL */
  preview?: string;
}

export interface TemplateIndex {
  version: string;
  updatedAt: string;
  total: number;
  templates: TemplateIndexEntry[];
}

export interface TemplateFile {
  path: string;
  content: string;
  type: string;
}

export interface PostInstallPatch {
  /** 패치 대상 파일 (apply 결과 기준 상대 경로) */
  file: string;
  /** 패치 종류 */
  type: "replace" | "append" | "prepend" | "json-merge";
  /** replace 시 검색 문자열 */
  search?: string;
  /** replace/append/prepend 시 적용할 문자열 */
  value?: string;
  /** json-merge 시 병합할 JSON 객체 */
  merge?: Record<string, unknown>;
}

export interface TemplateDetail extends TemplateIndexEntry {
  files: TemplateFile[];
  postInstall?: PostInstallPatch[];
  updatedAt: string;
}

// --- CLI 옵션 타입 ---

export interface ApplyOptions {
  yes?: boolean;
  dryRun?: boolean;
  skipDeps?: boolean;
  dir?: string;
  /** 질문을 띄울 수 있는지(WI-0075). 없으면 stdin 이 TTY 인지로 정합니다 */
  interactive?: boolean;
}

export interface InitOptions {
  dir?: string;
  /** 질문을 기본값으로 답하고, 비어 있지 않은 디렉터리도 진행(덮어씀). apply 의 -y 와 같은 뜻(WI-0075 D2) */
  yes?: boolean;
  /** 질문을 띄울 수 있는지(WI-0075). 없으면 stdin 이 TTY 인지로 정합니다 */
  interactive?: boolean;
}

export interface DiffOptions {
  verbose?: boolean;
}

export interface ListOptions {
  category?: string;
}

// --- Diff 결과 타입 ---

export type DiffStatus = "added" | "modified" | "unchanged" | "extra";

export interface DiffEntry {
  path: string;
  status: DiffStatus;
  /** modified 시 로컬 내용과 원본의 차이 요약 */
  localLines?: number;
  remoteLines?: number;
}

// --- Check 결과 타입 ---

export type CheckSeverity = "pass" | "warn" | "fail";

export interface CheckResult {
  name: string;
  severity: CheckSeverity;
  message: string;
}
