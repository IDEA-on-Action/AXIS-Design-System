// Library 데이터 타입 정의

export interface LibraryComponent {
  id: string
  slug: string
  name: string
  description: string
  category: string
  source: string
  tags: string[]
  status: 'active' | 'deprecated' | 'beta'
}

export interface LibraryCategory {
  id: string
  name: string
  description: string
  icon: string
  order: number
}

export interface LibraryStats {
  total: number
  bySource: Record<string, number>
  byCategory: Record<string, number>
}

export interface LibraryIndex {
  version: string
  updatedAt: string
  stats: LibraryStats
  categories: LibraryCategory[]
  components: LibraryComponent[]
}

export interface ComponentSource {
  type: string
  registry: string
  url?: string
}

export interface ComponentCodeFile {
  path: string
  content: string
  type: string
}

export interface ComponentCode {
  files: ComponentCodeFile[]
  dependencies: string[]
  devDependencies: string[]
  registryDeps: string[]
}

export interface ComponentDetail {
  id: string
  slug: string
  name: string
  description: string
  category: string
  source: ComponentSource
  tags: string[]
  code: ComponentCode
  status: 'active' | 'deprecated' | 'beta'
  updatedAt: string
}

// 소스 타입 정의
export const sourceTypes: Record<string, { name: string; color: string; installPrefix: string }> = {
  shadcn: { name: 'shadcn/ui', color: 'bg-zinc-500', installPrefix: 'npx shadcn@latest add' },
  axis: { name: 'AXIS', color: 'bg-blue-500', installPrefix: 'npx axis-cli add' },
  monet: { name: 'Monet', color: 'bg-purple-500', installPrefix: 'npx monet add' },
  v0: { name: 'V0', color: 'bg-green-500', installPrefix: 'npx v0 add' },
}
