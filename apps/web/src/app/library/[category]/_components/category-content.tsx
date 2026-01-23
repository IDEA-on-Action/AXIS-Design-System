'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@axis-ds/ui-react'
import { Skeleton } from '@/components/skeleton'
import { Package, ChevronLeft, Layers, Bot, FileText, Layout, Navigation, Bell, SquareStack, Table, BarChart3, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LibraryIndex, LibraryComponent } from '@/lib/library-types'
import { sourceTypes } from '@/lib/library-types'

// 아이콘 매핑
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  layers: Layers,
  bot: Bot,
  'text-cursor-input': FileText,
  layout: Layout,
  navigation: Navigation,
  bell: Bell,
  'square-stack': SquareStack,
  table: Table,
  'chart-bar': BarChart3,
  wrench: Wrench,
}

// 카테고리 기본 정의 (fallback)
const categoryDefaults: Record<string, { name: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
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

interface CategoryContentProps {
  category: string
}

export function CategoryContent({ category }: CategoryContentProps) {
  const [data, setData] = useState<LibraryIndex | null>(null)
  const [loading, setLoading] = useState(true)

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/library/index.json')
        const json = await response.json()
        setData(json)
      } catch (error) {
        console.error('Library 데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // 카테고리 정보
  const categoryInfo = useMemo(() => {
    if (data) {
      const cat = data.categories.find((c) => c.id === category)
      if (cat) {
        return {
          name: cat.name,
          icon: iconMap[cat.icon] || Layers,
          description: cat.description,
        }
      }
    }
    return categoryDefaults[category] || { name: category, icon: Layers, description: '' }
  }, [data, category])

  // 해당 카테고리 컴포넌트 필터링
  const components = useMemo(() => {
    if (!data) return []
    return data.components.filter((comp) => comp.category === category)
  }, [data, category])

  const CategoryIcon = categoryInfo.icon

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Skeleton className="h-4 w-20" />
          <span>/</span>
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-start gap-4 mb-8">
          <Skeleton className="h-14 w-14 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-6 w-64" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!categoryInfo.name) {
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
          const sourceInfo = sourceTypes[component.source]

          return (
            <Link key={component.id} href={`/library/${category}/${component.slug}`}>
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
