// Template 데이터 타입 정의

export type TemplateCategory = 'minimal' | 'landing-page' | 'dashboard' | 'app' | 'agentic'

export interface TemplateFile {
  path: string
  content: string
  type: string
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
}
