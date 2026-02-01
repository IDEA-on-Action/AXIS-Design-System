'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Badge } from '@axis-ds/ui-react'
import { Skeleton } from '@/components/skeleton'
import { Search, FileCode, Layers, Layout, BarChart3, AppWindow, Bot, Filter, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TemplateIndex, TemplateMetadata, TemplateCategory } from '@/lib/template-types'
import { templateCategories } from '@/lib/template-types'

// 카테고리 아이콘 매핑
const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  file: FileCode,
  layout: Layout,
  'bar-chart': BarChart3,
  'app-window': AppWindow,
  bot: Bot,
}

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [selectedSource, setSelectedSource] = useState<'all' | 'axis' | 'shadcn'>('all')
  const [data, setData] = useState<TemplateIndex | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/templates/index.json')
        const json = await response.json()
        setData(json)
      } catch (error) {
        console.error('Templates 데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // 카테고리 목록 생성
  const categories = useMemo(() => {
    if (!data) return []
    const usedCategories = new Set(data.templates.map((t) => t.category))
    return Object.entries(templateCategories)
      .filter(([key]) => usedCategories.has(key as TemplateCategory))
      .map(([key, val]) => ({
        id: key as TemplateCategory,
        ...val,
        icon: categoryIconMap[val.icon] || FileCode,
        count: data.templates.filter((t) => t.category === key).length,
      }))
  }, [data])

  // 소스별 카운트
  const sourceCounts = useMemo(() => {
    if (!data) return { all: 0, axis: 0, shadcn: 0 }
    const axis = data.templates.filter((t) => !t.source || t.source === 'axis').length
    const shadcn = data.templates.filter((t) => t.source === 'shadcn').length
    return { all: data.templates.length, axis, shadcn }
  }, [data])

  // 필터링
  const filtered = useMemo(() => {
    if (!data) return []
    return data.templates.filter((t) => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false
      if (selectedSource !== 'all') {
        const tSource = t.source || 'axis'
        if (tSource !== selectedSource) return false
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [data, searchQuery, selectedCategory, selectedSource])

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex flex-col gap-4 mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Templates</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          AXIS Design System 기반 프로젝트 템플릿입니다. 테마, 레이아웃, 컴포넌트가 사전 구성된 스타터를 활용하세요.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="템플릿 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-1.5">
            {([
              { id: 'all', label: 'All', count: sourceCounts.all },
              { id: 'axis', label: 'AXIS', count: sourceCounts.axis },
              { id: 'shadcn', label: 'shadcn', count: sourceCounts.shadcn },
            ] as const).map((src) => (
              <button
                key={src.id}
                onClick={() => setSelectedSource(src.id)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  selectedSource === src.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                {src.label}
                <span className="opacity-70">({src.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            전체
            <span className="ml-1 text-xs opacity-70">({data?.total || 0})</span>
          </button>
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.name}
                <span className="ml-1 text-xs opacity-70">({cat.count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template) => (
          <TemplateCard key={template.slug} template={template} />
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <FileCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">템플릿을 찾을 수 없습니다</h3>
          <p className="text-muted-foreground">검색어나 필터를 변경해 보세요.</p>
        </div>
      )}

      {/* Stats Footer */}
      <div className="mt-12 pt-8 border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileCode className="h-4 w-4" />
          <span>총 {data?.total || 0}개 템플릿</span>
        </div>
      </div>
    </div>
  )
}

function TemplateCard({ template }: { template: TemplateMetadata }) {
  const catInfo = templateCategories[template.category]
  const isExternal = template.type === 'external'

  const cardContent = (
    <Card className="h-full transition-all hover:bg-muted/50 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {isExternal ? (
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
            ) : (
              <FileCode className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle className="text-base">{template.name}</CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            {template.source && template.source !== 'axis' && (
              <Badge variant="outline" className="text-xs">
                {template.source}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {catInfo?.name || template.category}
            </Badge>
          </div>
        </div>
        <CardDescription className="line-clamp-2">{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Features */}
        <div className="space-y-1">
          {template.features.slice(0, 3).map((feat) => (
            <div key={feat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              {feat}
            </div>
          ))}
        </div>
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (isExternal && template.externalUrl) {
    return (
      <a href={template.externalUrl} target="_blank" rel="noopener noreferrer">
        {cardContent}
      </a>
    )
  }

  return <Link href={`/templates/${template.slug}`}>{cardContent}</Link>
}
