/**
 * 접근성(a11y)을 위한 레이블 상수
 * WCAG 2.1 AA 기준 준수를 위한 스크린 리더 텍스트
 */

/** 상태 레이블 (도구 호출, 실행 단계 등) */
export const STATUS_LABELS = {
  pending: "대기 중",
  running: "실행 중",
  complete: "완료",
  success: "성공",
  error: "오류",
  skipped: "건너뜀",
  idle: "대기 중",
} as const;

/** 심각도 레이블 (알림, 승인 카드 등) */
export const SEVERITY_LABELS = {
  info: "정보",
  warning: "주의",
  error: "오류",
} as const;

/** 에이전트 상태 레이블 */
export const AGENT_STATUS_LABELS = {
  online: "온라인",
  busy: "사용 중",
  offline: "오프라인",
} as const;

/** 에이전트 타입 레이블 */
export const AGENT_TYPE_LABELS = {
  assistant: "어시스턴트",
  tool: "도구",
  system: "시스템",
} as const;

/** 소스 타입 레이블 */
export const SOURCE_TYPE_LABELS = {
  web: "웹 페이지",
  file: "파일",
  database: "데이터베이스",
  api: "API",
} as const;

export type StatusLabel = keyof typeof STATUS_LABELS;
export type SeverityLabel = keyof typeof SEVERITY_LABELS;
export type AgentStatusLabel = keyof typeof AGENT_STATUS_LABELS;
export type AgentTypeLabel = keyof typeof AGENT_TYPE_LABELS;
export type SourceTypeLabel = keyof typeof SOURCE_TYPE_LABELS;
