'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button, Badge, Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from '@axis-ds/ui-react'
import { Skeleton } from '@/components/skeleton'
import { CodeBlock } from '@/components/code-block'
import { ChevronLeft, Package, Copy, Check, ExternalLink, Calendar, Tag, Layers, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ComponentDetail } from '@/lib/library-types'
import { sourceTypes } from '@/lib/library-types'

// 카테고리 정의
const categoryMap: Record<string, { name: string; description: string }> = {
  ui: { name: 'UI', description: '기본 UI 컴포넌트' },
  agentic: { name: 'Agentic', description: 'Agentic UI 컴포넌트' },
  form: { name: 'Form', description: '폼 컴포넌트' },
  layout: { name: 'Layout', description: '레이아웃 컴포넌트' },
  navigation: { name: 'Navigation', description: '네비게이션' },
  feedback: { name: 'Feedback', description: '피드백 컴포넌트' },
  overlay: { name: 'Overlay', description: '오버레이 컴포넌트' },
  'data-display': { name: 'Data Display', description: '데이터 표시' },
  chart: { name: 'Chart', description: '차트/시각화' },
  utility: { name: 'Utility', description: '유틸리티' },
}

interface ComponentDetailContentProps {
  category: string
  slug: string
}

export function ComponentDetailContent({ category, slug }: ComponentDetailContentProps) {
  const [copied, setCopied] = useState(false)
  const [component, setComponent] = useState<ComponentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 컴포넌트 데이터 로드
  useEffect(() => {
    async function loadComponent() {
      try {
        const response = await fetch(`/library/components/${slug}.json`)
        if (!response.ok) {
          throw new Error('컴포넌트를 찾을 수 없습니다')
        }
        const json = await response.json()
        setComponent(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터 로드 실패')
      } finally {
        setLoading(false)
      }
    }
    loadComponent()
  }, [slug])

  const categoryInfo = categoryMap[category]
  const sourceInfo = component ? sourceTypes[component.source.type] : null
  const installCommand = sourceInfo && component
    ? `${sourceInfo.installPrefix} ${slug}`
    : `npx axis-cli add ${slug}`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Skeleton className="h-4 w-16" />
          <span>/</span>
          <Skeleton className="h-4 w-20" />
          <span>/</span>
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="max-w-4xl">
          <div className="flex items-start gap-4 mb-8">
            <Skeleton className="h-14 w-14 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-6 w-96" />
            </div>
          </div>
          <Skeleton className="h-12 w-full mb-8" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !component) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">컴포넌트를 찾을 수 없습니다</h1>
          <p className="text-muted-foreground mb-4">{error || '요청한 컴포넌트가 존재하지 않습니다.'}</p>
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
        <Link href={`/library/${category}`} className="hover:text-foreground">
          {categoryInfo?.name || category}
        </Link>
        <span>/</span>
        <span className="text-foreground">{component.name}</span>
      </div>

      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">{component.name}</h1>
                {sourceInfo && (
                  <Badge variant="secondary">
                    <span className={cn('w-2 h-2 rounded-full mr-1.5', sourceInfo.color)} />
                    {sourceInfo.name}
                  </Badge>
                )}
              </div>
              <p className="text-lg text-muted-foreground">{component.description}</p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {component.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Installation */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">설치</h2>
          <div className="relative">
            <div className="rounded-lg border bg-muted p-4 font-mono text-sm">
              <code>{installCommand}</code>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => copyToClipboard(installCommand)}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </section>

        {/* Tabs: Preview / Code / Usage */}
        <Tabs defaultValue="code" className="mb-8">
          <TabsList>
            <TabsTrigger value="preview">미리보기</TabsTrigger>
            <TabsTrigger value="code">코드</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardContent className="p-8 flex items-center justify-center min-h-[200px]">
                <div className="text-center text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>미리보기는 개발 중입니다.</p>
                  {component.source.url && (
                    <p className="text-sm mt-1">
                      <a
                        href={component.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        원본 문서에서 보기
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="mt-4">
            {component.code.files.length > 0 ? (
              component.code.files.map((file, index) => (
                <div key={index} className="mb-4">
                  <div className="text-sm text-muted-foreground mb-2 font-mono">{file.path}</div>
                  <CodeBlock code={file.content} language="tsx" />
                </div>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>코드가 없습니다.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Dependencies */}
        {(component.code.dependencies.length > 0 || component.code.registryDeps.length > 0) && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">의존성</h2>
            <div className="flex flex-wrap gap-2">
              {component.code.registryDeps.map((dep) => (
                <Badge key={dep} variant="secondary">
                  {dep}
                </Badge>
              ))}
              {component.code.dependencies.map((dep) => (
                <Badge key={dep} variant="outline">
                  {dep}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Metadata */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">메타데이터</h2>
          <Card>
            <CardContent className="p-4 grid gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-24">소스:</span>
                <span>{sourceInfo?.name || component.source.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-24">레지스트리:</span>
                <span>{component.source.registry}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-24">카테고리:</span>
                <span>{categoryInfo?.name || category}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-24">업데이트:</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(component.updatedAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* External Link */}
        {component.source.url && (
          <div className="pt-4 border-t">
            <a
              href={component.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              원본 문서 보기
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
