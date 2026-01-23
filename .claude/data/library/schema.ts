/**
 * Library Curator Agent - 데이터 스키마 정의
 *
 * 디자인 시스템 컴포넌트 수집/분류/배치를 위한 타입 정의
 */

// ============================================================================
// Source Types
// ============================================================================

export type SourceType = 'shadcn' | 'monet' | 'v0' | 'axis' | 'custom';

export type ComponentCategory =
  | 'ui'           // 기본 UI 컴포넌트
  | 'agentic'      // Agentic UI 컴포넌트
  | 'layout'       // 레이아웃 컴포넌트
  | 'form'         // 폼 컴포넌트
  | 'data-display' // 데이터 표시
  | 'feedback'     // 피드백 (알림, 토스트 등)
  | 'navigation'   // 네비게이션
  | 'overlay'      // 오버레이 (모달, 팝오버 등)
  | 'chart'        // 차트/시각화
  | 'utility';     // 유틸리티

export type ComponentStatus = 'active' | 'deprecated' | 'draft';

export type FileType = 'component' | 'hook' | 'util' | 'style' | 'type';

// ============================================================================
// Core Types
// ============================================================================

/**
 * 코드 파일 정보
 */
export interface CodeFile {
  /** 파일 경로 (상대 경로) */
  path: string;
  /** 파일 내용 */
  content: string;
  /** 파일 유형 */
  type: FileType;
}

/**
 * 사용 예시
 */
export interface Example {
  /** 예시 이름 */
  name: string;
  /** 예시 코드 */
  code: string;
  /** 설명 */
  description?: string;
}

/**
 * 소스 정보
 */
export interface SourceInfo {
  /** 소스 유형 */
  type: SourceType;
  /** 레지스트리 이름 (@shadcn, @monet 등) */
  registry: string;
  /** 원본 URL */
  url: string;
  /** 버전 */
  version?: string;
}

/**
 * 코드 정보
 */
export interface CodeInfo {
  /** 소스 파일 목록 */
  files: CodeFile[];
  /** 의존성 패키지 */
  dependencies: string[];
  /** 개발 의존성 */
  devDependencies: string[];
  /** 레지스트리 내 의존성 */
  registryDeps: string[];
}

/**
 * 미리보기 정보
 */
export interface PreviewInfo {
  /** 썸네일 URL */
  thumbnail?: string;
  /** 데모 페이지 URL */
  demoUrl?: string;
  /** 사용 예시 */
  examples?: Example[];
}

// ============================================================================
// Component Metadata
// ============================================================================

/**
 * 컴포넌트 메타데이터
 */
export interface ComponentMeta {
  // === 식별자 ===
  /** 고유 ID (SOURCE-SLUG 형식) */
  id: string;
  /** URL 친화적 식별자 */
  slug: string;

  // === 기본 정보 ===
  /** 표시 이름 */
  name: string;
  /** 설명 */
  description: string;

  // === 소스 정보 ===
  source: SourceInfo;

  // === 분류 ===
  /** 카테고리 */
  category: ComponentCategory;
  /** 서브카테고리 */
  subcategory?: string;
  /** 태그 목록 */
  tags: string[];

  // === 코드 ===
  code: CodeInfo;

  // === 미리보기 ===
  preview?: PreviewInfo;

  // === 메타 ===
  /** 상태 */
  status: ComponentStatus;
  /** 수집 일시 (ISO 8601) */
  collectedAt: string;
  /** 업데이트 일시 */
  updatedAt: string;
  /** 코드 체크섬 (변경 감지용) */
  checksum: string;
}

// ============================================================================
// Library Index
// ============================================================================

/**
 * 카테고리 정의
 */
export interface CategoryDefinition {
  /** 카테고리 ID */
  id: ComponentCategory;
  /** 표시 이름 */
  name: string;
  /** 설명 */
  description: string;
  /** 아이콘 이름 */
  icon?: string;
  /** 정렬 순서 */
  order: number;
}

/**
 * 태그 정의
 */
export interface TagDefinition {
  /** 태그 ID */
  id: string;
  /** 표시 이름 */
  name: string;
  /** 사용 횟수 */
  count: number;
}

/**
 * 라이브러리 통계
 */
export interface LibraryStats {
  /** 전체 컴포넌트 수 */
  total: number;
  /** 소스별 컴포넌트 수 */
  bySource: Record<SourceType, number>;
  /** 카테고리별 컴포넌트 수 */
  byCategory: Record<ComponentCategory, number>;
}

/**
 * 라이브러리 인덱스
 */
export interface LibraryIndex {
  /** 인덱스 버전 */
  version: string;
  /** 마지막 업데이트 */
  updatedAt: string;

  /** 통계 */
  stats: LibraryStats;

  /** 컴포넌트 목록 */
  components: ComponentMeta[];

  /** 카테고리 정의 */
  categories: CategoryDefinition[];

  /** 태그 목록 */
  tags: TagDefinition[];
}

// ============================================================================
// Collection Types
// ============================================================================

/**
 * 수집 아이템 결과
 */
export interface CollectionItem {
  /** 컴포넌트 ID */
  id: string;
  /** 컴포넌트 이름 */
  name: string;
  /** 상태 */
  status: 'new' | 'updated' | 'unchanged';
  /** 체크섬 */
  checksum: string;
}

/**
 * 수집 에러
 */
export interface CollectionError {
  /** 컴포넌트 ID */
  id: string;
  /** 에러 메시지 */
  error: string;
  /** 복구 가능 여부 */
  recoverable: boolean;
}

/**
 * 수집 결과
 */
export interface CollectionResult {
  /** 소스 유형 */
  source: SourceType;
  /** 수집 시각 */
  timestamp: string;

  /** 성공 여부 */
  success: boolean;
  /** 수집된 컴포넌트 수 */
  collected: number;
  /** 업데이트된 컴포넌트 수 */
  updated: number;
  /** 실패한 컴포넌트 수 */
  failed: number;

  /** 상세 아이템 */
  items: CollectionItem[];
  /** 에러 목록 */
  errors: CollectionError[];
}

/**
 * 변경 세트
 */
export interface ChangeSet {
  /** 새로 추가된 ID */
  added: string[];
  /** 변경된 ID */
  modified: string[];
  /** 삭제된 ID */
  removed: string[];
}

// ============================================================================
// Collector Interface
// ============================================================================

/**
 * 수집 옵션
 */
export interface CollectOptions {
  /** 증분 수집 여부 */
  incremental?: boolean;
  /** 필터 */
  filter?: {
    categories?: ComponentCategory[];
    tags?: string[];
  };
}

/**
 * 컴포넌트 목록 아이템 (간략 정보)
 */
export interface ComponentListItem {
  /** 컴포넌트 ID */
  id: string;
  /** 이름 */
  name: string;
  /** 설명 */
  description: string;
  /** 카테고리 */
  category?: ComponentCategory;
}

/**
 * Collector 인터페이스
 */
export interface ICollector {
  /** 소스 유형 */
  readonly sourceType: SourceType;

  /** 전체 컴포넌트 목록 조회 */
  listComponents(): Promise<ComponentListItem[]>;

  /** 단일 컴포넌트 상세 수집 */
  collectComponent(id: string): Promise<ComponentMeta>;

  /** 전체 수집 (증분 지원) */
  collectAll(options?: CollectOptions): Promise<CollectionResult>;

  /** 변경 감지 */
  detectChanges(lastChecksum: Record<string, string>): Promise<ChangeSet>;
}

// ============================================================================
// Classifier Interface
// ============================================================================

/**
 * 중복 매칭 결과
 */
export interface DuplicateMatch {
  /** 컴포넌트 ID */
  id: string;
  /** 유사도 (0-1) */
  similarity: number;
  /** 중복 이유 */
  reason: 'name' | 'code' | 'description';
}

/**
 * Classifier 인터페이스
 */
export interface IClassifier {
  /** 카테고리 분류 */
  classifyCategory(component: ComponentMeta): ComponentCategory;

  /** 태그 추출 */
  extractTags(component: ComponentMeta): string[];

  /** 중복 감지 */
  detectDuplicates(
    component: ComponentMeta,
    existing: ComponentMeta[]
  ): DuplicateMatch[];
}

// ============================================================================
// Publisher Interface
// ============================================================================

/**
 * 배치 결과
 */
export interface PublishResult {
  /** 성공 여부 */
  success: boolean;
  /** 배치 시각 */
  publishedAt: string;
  /** 생성된 파일 목록 */
  files: string[];
}

/**
 * Publisher 인터페이스
 */
export interface IPublisher {
  /** 라이브러리 인덱스 생성 */
  generateIndex(components: ComponentMeta[]): LibraryIndex;

  /** 사이트 데이터 배치 */
  publishToSite(index: LibraryIndex): Promise<PublishResult>;

  /** 변경 이력 기록 */
  recordHistory(changeSet: ChangeSet): Promise<void>;
}

// ============================================================================
// Category Rules
// ============================================================================

/**
 * 카테고리 분류 규칙
 */
export interface CategoryRule {
  /** 카테고리 */
  category: ComponentCategory;
  /** 이름 패턴 (정규식) */
  patterns: RegExp[];
  /** 키워드 */
  keywords?: string[];
}

/**
 * 기본 카테고리 분류 규칙
 */
export const DEFAULT_CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'agentic',
    patterns: [
      /streaming/i, /agent/i, /approval/i, /step[-_]?indicator/i,
      /tool[-_]?call/i, /run[-_]?container/i, /surface/i
    ],
    keywords: ['agent', 'streaming', 'approval', 'step', 'tool']
  },
  {
    category: 'form',
    patterns: [
      /input/i, /select/i, /checkbox/i, /radio/i, /switch/i,
      /form/i, /textarea/i, /slider/i, /date[-_]?picker/i
    ]
  },
  {
    category: 'layout',
    patterns: [
      /container/i, /grid/i, /flex/i, /stack/i, /spacer/i,
      /divider/i, /separator/i, /aspect[-_]?ratio/i
    ]
  },
  {
    category: 'navigation',
    patterns: [
      /nav/i, /menu/i, /breadcrumb/i, /tabs/i, /pagination/i,
      /sidebar/i, /header/i, /footer/i
    ]
  },
  {
    category: 'feedback',
    patterns: [
      /toast/i, /alert/i, /notification/i, /progress/i,
      /spinner/i, /skeleton/i, /loading/i
    ]
  },
  {
    category: 'overlay',
    patterns: [
      /modal/i, /dialog/i, /drawer/i, /popover/i, /tooltip/i,
      /dropdown/i, /sheet/i
    ]
  },
  {
    category: 'data-display',
    patterns: [
      /table/i, /list/i, /card/i, /avatar/i, /badge/i,
      /tag/i, /timeline/i, /tree/i
    ]
  },
  {
    category: 'chart',
    patterns: [
      /chart/i, /graph/i, /pie/i, /bar/i, /line/i,
      /area/i, /scatter/i, /radar/i
    ]
  },
  {
    category: 'ui',
    patterns: [/.*/]  // Default fallback
  }
];

/**
 * 기본 카테고리 정의
 */
export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { id: 'ui', name: 'UI', description: '기본 UI 컴포넌트', icon: 'layers', order: 1 },
  { id: 'agentic', name: 'Agentic', description: 'Agentic UI 컴포넌트', icon: 'bot', order: 2 },
  { id: 'form', name: 'Form', description: '폼 컴포넌트', icon: 'text-cursor-input', order: 3 },
  { id: 'layout', name: 'Layout', description: '레이아웃 컴포넌트', icon: 'layout', order: 4 },
  { id: 'navigation', name: 'Navigation', description: '네비게이션 컴포넌트', icon: 'navigation', order: 5 },
  { id: 'feedback', name: 'Feedback', description: '피드백 컴포넌트', icon: 'bell', order: 6 },
  { id: 'overlay', name: 'Overlay', description: '오버레이 컴포넌트', icon: 'square-stack', order: 7 },
  { id: 'data-display', name: 'Data Display', description: '데이터 표시 컴포넌트', icon: 'table', order: 8 },
  { id: 'chart', name: 'Chart', description: '차트/시각화 컴포넌트', icon: 'chart-bar', order: 9 },
  { id: 'utility', name: 'Utility', description: '유틸리티 컴포넌트', icon: 'wrench', order: 10 },
];
