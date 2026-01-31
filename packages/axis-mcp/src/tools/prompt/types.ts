/**
 * AXIS Design System MCP - 프롬프트 도구 타입 정의
 */

/**
 * 프롬프트 카테고리
 */
export type PromptCategory =
  | "planning"
  | "quality"
  | "documentation"
  | "workflow";

/**
 * 프롬프트 평가 항목별 점수
 */
export interface PromptScores {
  /** 반복성: 유사 패턴이 반복되는가 (25점) */
  repeatability: number;
  /** 범용성: 다른 프로젝트에 적용 가능한가 (30점) */
  generality: number;
  /** 독립성: 특정 컨텍스트 없이 동작하는가 (25점) */
  independence: number;
  /** 명확성: 목표와 절차가 명확한가 (20점) */
  clarity: number;
  /** 총점 (100점 만점) */
  total: number;
}

/**
 * 프롬프트 변수 정의
 */
export interface PromptVariable {
  /** 변수명 (예: {{COMPONENT_NAME}}) */
  name: string;
  /** 변수 설명 */
  description: string;
  /** 원본 값 (탐지 시) */
  originalValue?: string;
  /** 예시 값 */
  example?: string;
  /** 필수 여부 */
  required?: boolean;
}

/**
 * 프롬프트 메타데이터
 */
export interface PromptMetadata {
  /** 프롬프트 이름 (kebab-case) */
  name: string;
  /** 카테고리 */
  category: PromptCategory;
  /** 설명 */
  description: string;
  /** 변수 목록 */
  variables: PromptVariable[];
  /** 생성일 */
  createdAt?: string;
  /** 수정일 */
  updatedAt?: string;
}

/**
 * 탐지된 프롬프트 후보
 */
export interface PromptCandidate {
  /** 후보 ID */
  id: string;
  /** 소스 (사용자 입력, 작업 결과물 등) */
  source: "user_input" | "work_output" | "context";
  /** 원본 텍스트 */
  originalText: string;
  /** 평가 점수 */
  scores: PromptScores;
  /** 추천 카테고리 */
  suggestedCategory: PromptCategory;
  /** 추출된 변수 */
  extractedVariables: PromptVariable[];
  /** 개선 제안 */
  suggestions: string[];
}

/**
 * 분석 결과
 */
export interface AnalysisResult {
  /** 분석 대상 텍스트 */
  text: string;
  /** 평가 점수 */
  scores: PromptScores;
  /** 항목별 피드백 */
  feedback: {
    repeatability: string;
    generality: string;
    independence: string;
    clarity: string;
  };
  /** 추천 카테고리 */
  suggestedCategory: PromptCategory;
  /** 재사용 적합 여부 (70점 이상) */
  isCandidate: boolean;
  /** 추출된 섹션 */
  sections: {
    goal?: string;
    steps?: string[];
    output?: string;
    validation?: string[];
  };
  /** 탐지된 프로젝트 종속 값 */
  projectSpecificValues: Array<{
    value: string;
    type: "path" | "name" | "version" | "date" | "other";
    suggestedVariable: string;
  }>;
}

/**
 * 정제 결과
 */
export interface RefinementResult {
  /** 정제된 텍스트 */
  refinedText: string;
  /** 생성된 YAML 프론트매터 */
  frontmatter: string;
  /** 추출된 변수 목록 */
  variables: PromptVariable[];
  /** 변환 로그 */
  transformations: Array<{
    original: string;
    replacement: string;
    type: string;
  }>;
  /** 메타데이터 */
  metadata: PromptMetadata;
}

/**
 * 검증 결과
 */
export interface ValidationResult {
  /** 유효 여부 */
  isValid: boolean;
  /** 오류 목록 */
  errors: Array<{
    code: string;
    message: string;
    severity: "error" | "warning";
  }>;
  /** 체크리스트 */
  checklist: {
    hasRequiredSections: boolean;
    noHardcodedPaths: boolean;
    variablesDocumented: boolean;
    validFrontmatter: boolean;
    noDuplicate: boolean;
  };
  /** 유사 프롬프트 (중복 검사) */
  similarPrompts?: Array<{
    id: string;
    name: string;
    similarity: number;
  }>;
}

/**
 * 저장 결과
 */
export interface SaveResult {
  /** 성공 여부 */
  success: boolean;
  /** 저장 경로 */
  path?: string;
  /** 프롬프트 ID */
  promptId?: string;
  /** 인덱스 갱신 여부 */
  indexUpdated?: boolean;
  /** 오류 메시지 */
  error?: string;
}

/**
 * 프롬프트 인덱스 엔트리
 */
export interface PromptIndexEntry {
  id: string;
  name: string;
  category: PromptCategory;
  description: string;
  path: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

/**
 * 프롬프트 인덱스
 */
export interface PromptIndex {
  version: string;
  lastUpdated: string;
  categories: Record<
    PromptCategory,
    {
      description: string;
      count: number;
    }
  >;
  prompts: PromptIndexEntry[];
  stats: {
    totalPrompts: number;
    totalUsage: number;
    mostUsed: string | null;
    recentlyAdded: string | null;
  };
}

// === 도구 파라미터/결과 타입 ===

/**
 * detect 도구 파라미터
 */
export interface DetectParams {
  /** 세션 컨텍스트 텍스트 */
  context: string;
  /** 최소 점수 기준 */
  minScore?: number;
  /** 최대 후보 수 */
  maxCandidates?: number;
}

/**
 * detect 도구 결과
 */
export interface DetectResult {
  candidates: PromptCandidate[];
  totalFound: number;
  threshold: number;
}

/**
 * analyze 도구 파라미터
 */
export interface AnalyzeParams {
  /** 분석할 텍스트 */
  text: string;
}

/**
 * analyze 도구 결과 (AnalysisResult와 동일)
 */
export type AnalyzeResult = AnalysisResult;

/**
 * refine 도구 파라미터
 */
export interface RefineParams {
  /** 정제할 텍스트 */
  text: string;
  /** 프롬프트 이름 (선택) */
  name?: string;
  /** 카테고리 (선택) */
  category?: PromptCategory;
}

/**
 * refine 도구 결과 (RefinementResult와 동일)
 */
export type RefineResult = RefinementResult;

/**
 * validate 도구 파라미터
 */
export interface ValidateParams {
  /** 검증할 프롬프트 텍스트 (프론트매터 포함) */
  promptText: string;
  /** 중복 검사 활성화 */
  checkDuplicate?: boolean;
}

/**
 * validate 도구 결과 (ValidationResult와 동일)
 */
export type ValidateResult = ValidationResult;

/**
 * save 도구 파라미터
 */
export interface SaveParams {
  /** 저장할 프롬프트 텍스트 (프론트매터 포함) */
  promptText: string;
  /** 프롬프트 이름 */
  name: string;
  /** 카테고리 */
  category: PromptCategory;
  /** 강제 저장 (중복 무시) */
  force?: boolean;
}

/**
 * save 도구 결과 (SaveResult와 동일)
 */
export type SaveResultType = SaveResult;
