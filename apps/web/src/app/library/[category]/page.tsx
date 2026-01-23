'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@ax/ui'
import { Package, ChevronLeft, Layers, Bot, FileText, Layout, Navigation, Bell, SquareStack, Table, BarChart3, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

// 카테고리 정의
const categoryMap: Record<string, { name: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
  ui: { name: 'UI', icon: Layers, description: '기본 UI 컴포넌트' },
  agentic: { name: 'Agentic', icon: Bot, description: 'AI/LLM 애플리케이션을 위한 Agentic UI 컴포넌트' },
  form: { name: 'Form', icon: FileText, description: '폼 입력 및 검증 컴포넌트' },
  layout: { name: 'Layout', icon: Layout, description: '레이아웃 및 구조 컴포넌트' },
  navigation: { name: 'Navigation', icon: Navigation, description: '네비게이션 및 라우팅 컴포넌트' },
  feedback: { name: 'Feedback', icon: Bell, description: '사용자 피드백 및 알림 컴포넌트' },
  overlay: { name: 'Overlay', icon: SquareStack, description: '모달, 다이얼로그 등 오버레이 컴포넌트' },
  'data-display': { name: 'Data Display', icon: Table, description: '데이터 표시 및 시각화 컴포넌트' },
  chart: { name: 'Chart', icon: BarChart3, description: '차트 및 그래프 컴포넌트' },
  utility: { name: 'Utility', icon: Wrench, description: '유틸리티 및 헬퍼 컴포넌트' },
}

// 소스 타입 정의
const sourceTypes = {
  shadcn: { name: 'shadcn/ui', color: 'bg-zinc-500' },
  axis: { name: 'AXIS', color: 'bg-blue-500' },
  monet: { name: 'Monet', color: 'bg-purple-500' },
  v0: { name: 'V0', color: 'bg-green-500' },
}

// 샘플 컴포넌트 데이터
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

export default function CategoryPage() {
  const params = useParams()
  const categoryId = params.category as string

  const categoryInfo = categoryMap[categoryId]
  const CategoryIcon = categoryInfo?.icon || Layers

  // 해당 카테고리 컴포넌트 필터링
  const components = useMemo(() => {
    return sampleComponents.filter((comp) => comp.category === categoryId)
  }, [categoryId])

  if (!categoryInfo) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">카테고리를 찾을 수 없습니다</h1>
          <Link href="/library" className="text-primary hover:underline">
            라이브러리로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/library" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Library
        </Link>
        <span>/</span>
        <span className="text-foreground">{categoryInfo.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="p-3 rounded-lg bg-primary/10">
          <CategoryIcon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{categoryInfo.name}</h1>
          <p className="text-lg text-muted-foreground">{categoryInfo.description}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {components.length}개 컴포넌트
          </p>
        </div>
      </div>

      {/* Component Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {components.map((component) => {
          const sourceInfo = sourceTypes[component.source as keyof typeof sourceTypes]

          return (
            <Link key={component.id} href={`/library/${categoryId}/${component.slug}`}>
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
                    {component.tags.map((tag) => (
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
      {components.length === 0 && (
        <div className="text-center py-12">
          <CategoryIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">이 카테고리에 컴포넌트가 없습니다</h3>
          <p className="text-muted-foreground">
            <Link href="/library" className="text-primary hover:underline">
              라이브러리
            </Link>
            에서 다른 컴포넌트를 탐색해 보세요.
          </p>
        </div>
      )}
    </div>
  )
}
