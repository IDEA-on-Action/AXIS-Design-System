// Template 데이터 타입 정의

export type TemplateCategory = 'minimal' | 'landing-page' | 'dashboard' | 'app' | 'agentic' | 'console'

export interface TemplateFile {
  path: string
  content: string
  type: string
}

/**
 * 템플릿에 딸린 규칙 검사 선언(WI-0107). axis check · MCP axis.check_project 가 돌리는 검사 id 이고,
 * 실제로 돌릴 검사는 registry-core 정적 표(TEMPLATE_CHECKS)가 정합니다. 이 값은 빌드 · 동기화 테스트 전용이라 런타임에서 읽지 않아요.
 * script 는 사람에게 보여 줄 npm script 이름이고 실행하지 않아요.
 */
export interface TemplateCheckDecl {
  id: string
  script?: string
}

export interface TemplateMetadata {
  name: string
  slug: string
  description: string
  category: TemplateCategory
  version: string
  author: string
  tags: string[]
  features: string[]
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  /** 템플릿 유형: local(기본) 또는 external(외부 링크) */
  type?: 'local' | 'external'
  /** external 타입 시 외부 링크 URL */
  externalUrl?: string
  /** 출처: 'axis' | 'shadcn' 등 */
  source?: string
  /** 미리보기 이미지 URL */
  preview?: string
  /** 규칙 검사 선언(WI-0107, 빌드 · 동기화 테스트 전용) */
  checks?: TemplateCheckDecl[]
}

export interface TemplateDetail {
  name: string
  slug: string
  description: string
  category: TemplateCategory
  version: string
  author: string
  tags: string[]
  features: string[]
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  /** 규칙 검사 선언(WI-0107, 빌드 · 동기화 테스트 전용) */
  checks?: TemplateCheckDecl[]
  files: TemplateFile[]
  updatedAt: string
}

export interface TemplateIndex {
  version: string
  updatedAt: string
  total: number
  templates: TemplateMetadata[]
}

// 카테고리 타입 정의
export const templateCategories: Record<TemplateCategory, { name: string; description: string; icon: string }> = {
  minimal: { name: 'Minimal', description: '최소 구성 템플릿', icon: 'file' },
  'landing-page': { name: 'Landing Page', description: '랜딩 페이지 템플릿', icon: 'layout' },
  dashboard: { name: 'Dashboard', description: '대시보드 템플릿', icon: 'bar-chart' },
  app: { name: 'Application', description: '풀 애플리케이션 템플릿', icon: 'app-window' },
  agentic: { name: 'Agentic', description: 'AI/Agent 전용 템플릿', icon: 'bot' },
  console: { name: 'Console', description: '사이드바 · 목록 · 상세로 된 업무 콘솔 템플릿', icon: 'panels' },
}
