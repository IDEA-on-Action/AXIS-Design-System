'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Badge } from '@axis-ds/ui-react'
import { Skeleton } from '@/components/skeleton'
import { Search, Package, Layers, Bot, FileText, Layout, Navigation, Bell, SquareStack, Table, BarChart3, Wrench, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LibraryIndex, LibraryComponent, LibraryStats } from '@/lib/library-types'
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

// 기본 카테고리 정의
const defaultCategories = [
  { id: 'all', name: '전체', icon: Layers, description: '모든 컴포넌트' },
]

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
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

  // 카테고리 목록
  const categories = useMemo(() => {
    if (!data) return defaultCategories
    return [
      { id: 'all', name: '전체', icon: Layers, description: '모든 컴포넌트' },
      ...data.categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: iconMap[cat.icon] || Layers,
        description: cat.description,
      })),
    ]
  }, [data])

  // 필터링된 컴포넌트
  const filteredComponents = useMemo(() => {
    if (!data) return []
    return data.components.filter((comp) => {
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
  }, [data, searchQuery, selectedCategory, selectedSource])

  const stats: LibraryStats = data?.stats || { total: 0, bySource: {}, byCategory: {} }

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex flex-col gap-4 mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Library</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          AXIS Design System의 컴포넌트 라이브러리입니다. shadcn/ui, Monet, V0 등 다양한 소스에서 수집된 {stats.total}개의 컴포넌트를 탐색하세요.
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
            {Object.entries(sourceTypes).map(([key, { name }]) => (
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
          const sourceInfo = sourceTypes[component.source]

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
              {sourceTypes[source]?.name}: {count}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
