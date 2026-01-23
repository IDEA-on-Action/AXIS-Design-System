'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Badge } from '@ax/ui'
import { Search, Package, Layers, Bot, FileText, Layout, Navigation, Bell, SquareStack, Table, BarChart3, Wrench, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

// 카테고리 정의
const categories = [
  { id: 'all', name: '전체', icon: Layers, description: '모든 컴포넌트' },
  { id: 'ui', name: 'UI', icon: Layers, description: '기본 UI 컴포넌트' },
  { id: 'agentic', name: 'Agentic', icon: Bot, description: 'Agentic UI 컴포넌트' },
  { id: 'form', name: 'Form', icon: FileText, description: '폼 컴포넌트' },
  { id: 'layout', name: 'Layout', icon: Layout, description: '레이아웃 컴포넌트' },
  { id: 'navigation', name: 'Navigation', icon: Navigation, description: '네비게이션' },
  { id: 'feedback', name: 'Feedback', icon: Bell, description: '피드백 컴포넌트' },
  { id: 'overlay', name: 'Overlay', icon: SquareStack, description: '오버레이 컴포넌트' },
  { id: 'data-display', name: 'Data Display', icon: Table, description: '데이터 표시' },
  { id: 'chart', name: 'Chart', icon: BarChart3, description: '차트/시각화' },
  { id: 'utility', name: 'Utility', icon: Wrench, description: '유틸리티' },
]

// 소스 타입 정의
const sourceTypes = {
  shadcn: { name: 'shadcn/ui', color: 'bg-zinc-500' },
  axis: { name: 'AXIS', color: 'bg-blue-500' },
  monet: { name: 'Monet', color: 'bg-purple-500' },
  v0: { name: 'V0', color: 'bg-green-500' },
}

// 샘플 컴포넌트 데이터 (실제로는 API/JSON에서 로드)
const sampleComponents = [
  // UI 컴포넌트
  { id: 'shadcn-button', slug: 'button', name: 'Button', description: '다양한 스타일과 크기의 버튼', category: 'ui', source: 'shadcn', tags: ['interactive', 'form'] },
  { id: 'shadcn-card', slug: 'card', name: 'Card', description: '콘텐츠를 그룹화하는 카드 컨테이너', category: 'ui', source: 'shadcn', tags: ['container', 'layout'] },
  { id: 'shadcn-input', slug: 'input', name: 'Input', description: '텍스트 입력 필드', category: 'form', source: 'shadcn', tags: ['form', 'input'] },
  { id: 'shadcn-label', slug: 'label', name: 'Label', description: '폼 필드 레이블', category: 'form', source: 'shadcn', tags: ['form', 'label'] },
  { id: 'shadcn-select', slug: 'select', name: 'Select', description: '드롭다운 선택 컴포넌트', category: 'form', source: 'shadcn', tags: ['form', 'select'] },
  { id: 'shadcn-dialog', slug: 'dialog', name: 'Dialog', description: '모달 다이얼로그', category: 'overlay', source: 'shadcn', tags: ['modal', 'overlay'] },
  { id: 'shadcn-badge', slug: 'badge', name: 'Badge', description: '상태 표시 뱃지', category: 'ui', source: 'shadcn', tags: ['status', 'indicator'] },
  { id: 'shadcn-tabs', slug: 'tabs', name: 'Tabs', description: '탭 네비게이션', category: 'navigation', source: 'shadcn', tags: ['navigation', 'tabs'] },
  { id: 'shadcn-separator', slug: 'separator', name: 'Separator', description: '구분선', category: 'ui', source: 'shadcn', tags: ['layout', 'divider'] },
  { id: 'shadcn-toast', slug: 'toast', name: 'Toast', description: '알림 토스트 메시지', category: 'feedback', source: 'shadcn', tags: ['notification', 'feedback'] },
  // Agentic 컴포넌트
  { id: 'axis-streaming-text', slug: 'streaming-text', name: 'Streaming Text', description: '실시간 텍스트 스트리밍', category: 'agentic', source: 'axis', tags: ['agentic', 'streaming'] },
  { id: 'axis-approval-dialog', slug: 'approval-dialog', name: 'Approval Dialog', description: '사용자 승인 요청 UI', category: 'agentic', source: 'axis', tags: ['agentic', 'approval'] },
  { id: 'axis-step-indicator', slug: 'step-indicator', name: 'Step Indicator', description: '단계별 진행 표시', category: 'agentic', source: 'axis', tags: ['agentic', 'progress'] },
  { id: 'axis-tool-call-card', slug: 'tool-call-card', name: 'Tool Call Card', description: 'AI 도구 호출 표시', category: 'agentic', source: 'axis', tags: ['agentic', 'tool'] },
  { id: 'axis-activity-preview-card', slug: 'activity-preview-card', name: 'Activity Preview Card', description: '활동 미리보기 카드', category: 'agentic', source: 'axis', tags: ['agentic', 'activity'] },
  { id: 'axis-collector-health-bar', slug: 'collector-health-bar', name: 'Collector Health Bar', description: '수집기 상태 표시', category: 'agentic', source: 'axis', tags: ['agentic', 'health'] },
  { id: 'axis-file-upload-zone', slug: 'file-upload-zone', name: 'File Upload Zone', description: '파일 업로드 영역', category: 'form', source: 'axis', tags: ['form', 'upload'] },
  { id: 'axis-seminar-chat-panel', slug: 'seminar-chat-panel', name: 'Seminar Chat Panel', description: '세미나 채팅 패널', category: 'agentic', source: 'axis', tags: ['agentic', 'chat'] },
  { id: 'axis-surface-renderer', slug: 'surface-renderer', name: 'Surface Renderer', description: '동적 Surface 렌더러', category: 'agentic', source: 'axis', tags: ['agentic', 'renderer'] },
  { id: 'axis-agent-run-container', slug: 'agent-run-container', name: 'Agent Run Container', description: '에이전트 실행 컨테이너', category: 'agentic', source: 'axis', tags: ['agentic', 'container'] },
]

// 통계 계산
function calculateStats(components: typeof sampleComponents) {
  const bySource: Record<string, number> = {}
  const byCategory: Record<string, number> = {}

  for (const comp of components) {
    bySource[comp.source] = (bySource[comp.source] || 0) + 1
    byCategory[comp.category] = (byCategory[comp.category] || 0) + 1
  }

  return { total: components.length, bySource, byCategory }
}

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

  // 필터링된 컴포넌트
  const filteredComponents = useMemo(() => {
    return sampleComponents.filter((comp) => {
      // 카테고리 필터
      if (selectedCategory !== 'all' && comp.category !== selectedCategory) {
        return false
      }

      // 소스 필터
      if (selectedSource && comp.source !== selectedSource) {
        return false
      }

      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          comp.name.toLowerCase().includes(query) ||
          comp.description.toLowerCase().includes(query) ||
          comp.tags.some((t) => t.toLowerCase().includes(query))
        )
      }

      return true
    })
  }, [searchQuery, selectedCategory, selectedSource])

  const stats = calculateStats(sampleComponents)

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Library</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          AXIS Design System의 컴포넌트 라이브러리입니다. shadcn/ui, Monet, V0 등 다양한 소스에서 수집된 컴포넌트를 탐색하세요.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 mb-8">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="컴포넌트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = selectedCategory === cat.id
            const count = cat.id === 'all' ? stats.total : (stats.byCategory[cat.id] || 0)

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.name}
                <span className="ml-1 text-xs opacity-70">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">소스:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedSource(null)}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium transition-colors',
                selectedSource === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              )}
            >
              전체
            </button>
            {Object.entries(sourceTypes).map(([key, { name, color }]) => (
              <button
                key={key}
                onClick={() => setSelectedSource(selectedSource === key ? null : key)}
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium transition-colors',
                  selectedSource === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                {name} ({stats.bySource[key] || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Component Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredComponents.map((component) => {
          const sourceInfo = sourceTypes[component.source as keyof typeof sourceTypes]

          return (
            <Link key={component.id} href={`/library/${component.category}/${component.slug}`}>
              <Card className="h-full transition-all hover:bg-muted/50 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{component.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <span className={cn('w-2 h-2 rounded-full mr-1.5', sourceInfo?.color)} />
                      {sourceInfo?.name}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{component.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {component.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredComponents.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">컴포넌트를 찾을 수 없습니다</h3>
          <p className="text-muted-foreground">검색어나 필터를 변경해 보세요.</p>
        </div>
      )}

      {/* Stats Footer */}
      <div className="mt-12 pt-8 border-t">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>총 {stats.total}개 컴포넌트</span>
          </div>
          <span className="text-muted-foreground/50">|</span>
          {Object.entries(stats.bySource).map(([source, count]) => (
            <span key={source}>
              {sourceTypes[source as keyof typeof sourceTypes]?.name}: {count}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
