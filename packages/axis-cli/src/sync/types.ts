/**
 * GitHub Project 동기화 - 타입 정의
 */

// ============================================================================
// Local Types (project-todo.md)
// ============================================================================

/**
 * 로컬 상태 (project-todo.md)
 */
export type LocalStatus = '✅' | '🔄' | '⏳';

/**
 * Work Item 정보 (project-todo.md에서 파싱)
 */
export interface WorkItem {
  /** 순번 */
  index: number;
  /** 항목명 */
  title: string;
  /** WI ID (예: WI-0001) */
  wiId: string;
  /** Phase (예: P3) */
  phase: string;
  /** 우선순위 (예: P1) */
  priority: string;
  /** 상태 */
  status: LocalStatus;
  /** WI 폴더 링크 (있을 경우) */
  link?: string;
}

/**
 * 파싱 결과
 */
export interface ParseResult {
  /** 진행 중 작업 */
  inProgress: WorkItem[];
  /** 완료된 작업 (WI ID가 있는 것만) */
  completed: WorkItem[];
  /** 파싱 오류 */
  errors: ParseError[];
}

export interface ParseError {
  line: number;
  content: string;
  message: string;
}

// ============================================================================
// GitHub Project Types
// ============================================================================

/**
 * GitHub Project 상태
 */
export type GitHubProjectStatus = 'Todo' | 'In Progress' | 'Done';

/**
 * 상태 매핑
 */
export const STATUS_MAP: Record<LocalStatus, GitHubProjectStatus> = {
  '✅': 'Done',
  '🔄': 'In Progress',
  '⏳': 'Todo',
};

/**
 * GitHub Project 상태 옵션 ID
 * (프로젝트별로 다를 수 있음 - 실제 값은 API로 조회 필요)
 */
export interface StatusOptionIds {
  todo: string;
  inProgress: string;
  done: string;
}

/**
 * GitHub Project V2 정보
 */
export interface ProjectV2Info {
  id: string;
  title: string;
  url: string;
  statusField: {
    id: string;
    options: StatusOptionIds;
  };
}

/**
 * GitHub Project Item
 */
export interface ProjectItem {
  id: string;
  content?: {
    id: string;
    number: number;
    title: string;
    url: string;
  };
  fieldValues: {
    status?: GitHubProjectStatus;
    wiId?: string;
  };
}

// ============================================================================
// Mapping Types
// ============================================================================

/**
 * WI ↔ GitHub Issue 매핑
 */
export interface WiMapping {
  /** WI ID (예: WI-0001) */
  wiId: string;
  /** GitHub Issue Number */
  issueNumber: number;
  /** GitHub Project Item ID */
  projectItemId?: string;
  /** 마지막 동기화 시간 */
  lastSyncedAt?: string;
  /** 마지막 동기화 상태 */
  lastStatus?: LocalStatus;
}

/**
 * 매핑 파일 구조
 */
export interface MappingFile {
  /** 스키마 버전 */
  version: string;
  /** 저장소 정보 */
  repository: {
    owner: string;
    repo: string;
  };
  /** 프로젝트 정보 */
  project: {
    number: number;
    id?: string;
  };
  /** WI 매핑 목록 */
  mappings: WiMapping[];
  /** 마지막 업데이트 시간 */
  updatedAt: string;
}

// ============================================================================
// Sync Types
// ============================================================================

/**
 * 동기화 액션
 */
export type SyncAction = 'create' | 'update' | 'skip' | 'error';

/**
 * 동기화 항목 결과
 */
export interface SyncItemResult {
  wiId: string;
  action: SyncAction;
  previousStatus?: LocalStatus;
  newStatus: LocalStatus;
  issueNumber?: number;
  projectItemId?: string;
  error?: string;
}

/**
 * 동기화 전체 결과
 */
export interface SyncResult {
  success: boolean;
  timestamp: string;
  summary: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  items: SyncItemResult[];
  errors: string[];
}

/**
 * 동기화 옵션
 */
export interface SyncOptions {
  /** 미리보기 모드 (실제 변경 없음) */
  dryRun?: boolean;
  /** 특정 WI만 동기화 */
  wiIds?: string[];
  /** 상세 출력 */
  verbose?: boolean;
  /** GitHub 토큰 */
  token?: string;
}

// ============================================================================
// Config Types
// ============================================================================

/**
 * 동기화 설정
 */
export interface SyncConfig {
  /** 저장소 정보 */
  repository: {
    owner: string;
    repo: string;
  };
  /** GitHub Project 번호 */
  projectNumber: number;
  /** project-todo.md 경로 */
  todoPath: string;
  /** 매핑 파일 경로 */
  mappingPath: string;
}
