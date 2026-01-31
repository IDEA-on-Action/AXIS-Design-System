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
}

export interface InitOptions {
  dir?: string;
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
