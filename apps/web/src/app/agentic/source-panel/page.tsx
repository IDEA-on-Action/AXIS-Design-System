'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

// Mock SourcePanel 컴포넌트
const sourceIcons: Record<string, string> = {
  web: '🌐',
  file: '📄',
  database: '🗄️',
  api: '⚡',
}

const SourcePanel = ({ sources, expandable = true, defaultExpanded = false, maxItems = 5 }: any) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const displayedSources = isExpanded ? sources : sources.slice(0, maxItems)
  const hasMore = sources.length > maxItems

  if (sources.length === 0) return null

  return (
    <div className="rounded-lg border p-3 bg-muted/50">
      <h4 className="text-xs font-medium text-muted-foreground mb-2">
        출처 ({sources.length}개)
      </h4>
      <div className="space-y-2">
        {displayedSources.map((source: any) => (
          <div key={source.id} className="flex items-start gap-2 p-2 rounded-md bg-background">
            <span className="mt-0.5">{sourceIcons[source.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {source.url ? (
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {source.title}
                  </a>
                ) : source.title}
              </p>
              {source.snippet && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{source.snippet}</p>
              )}
              {source.path && (
                <code className="text-xs text-muted-foreground/60">{source.path}</code>
              )}
            </div>
            {source.relevance !== undefined && (
              <span className="text-xs text-muted-foreground">{Math.round(source.relevance * 100)}%</span>
            )}
          </div>
        ))}
      </div>
      {expandable && hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs text-primary hover:underline"
        >
          {isExpanded ? '접기' : `${sources.length - maxItems}개 더 보기`}
        </button>
      )}
    </div>
  )
}

const sourcePanelProps = [
  { name: 'sources', type: 'Source[]', required: true, description: '출처 목록 배열' },
  { name: 'expandable', type: 'boolean', default: 'true', description: '확장 가능 여부' },
  { name: 'defaultExpanded', type: 'boolean', default: 'false', description: '기본 확장 상태' },
  { name: 'maxItems', type: 'number', default: '5', description: '기본 표시 개수' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const sourceTypeProps = [
  { name: 'id', type: 'string', required: true, description: '출처 고유 식별자' },
  { name: 'type', type: '"web" | "file" | "database" | "api"', required: true, description: '출처 유형' },
  { name: 'title', type: 'string', required: true, description: '출처 제목' },
  { name: 'url', type: 'string', default: '-', description: '웹 링크 URL' },
  { name: 'path', type: 'string', default: '-', description: '파일 경로' },
  { name: 'snippet', type: 'string', default: '-', description: '관련 내용 발췌' },
  { name: 'relevance', type: 'number', default: '-', description: '관련도 점수 (0-1)' },
]

const basicExample = `import { SourcePanel } from '@axis-ds/agentic-ui'

const sources = [
  {
    id: '1',
    type: 'web',
    title: 'React 공식 문서',
    url: 'https://react.dev',
    snippet: 'React를 사용하면 컴포넌트를 통해 UI를 구축할 수 있습니다.',
    relevance: 0.95,
  },
  {
    id: '2',
    type: 'file',
    title: 'API 문서',
    path: '/docs/api-reference.md',
    relevance: 0.82,
  },
]

export function Example() {
  return <SourcePanel sources={sources} maxItems={3} />
}`

export default function SourcePanelPage() {
  const sources = [
    { id: '1', type: 'web' as const, title: 'React 공식 문서', url: 'https://react.dev', snippet: 'React는 사용자 인터페이스를 구축하기 위한 JavaScript 라이브러리입니다.', relevance: 0.95 },
    { id: '2', type: 'file' as const, title: 'API Reference', path: '/docs/api-reference.md', snippet: 'REST API 엔드포인트 목록과 사용 방법을 설명합니다.', relevance: 0.88 },
    { id: '3', type: 'database' as const, title: 'User Data', path: 'users.analytics', relevance: 0.75 },
    { id: '4', type: 'api' as const, title: 'External API Response', snippet: 'GET /api/v1/data 응답 결과', relevance: 0.70 },
    { id: '5', type: 'web' as const, title: 'MDN Web Docs', url: 'https://developer.mozilla.org', relevance: 0.65 },
    { id: '6', type: 'file' as const, title: 'README.md', path: '/README.md', relevance: 0.60 },
  ]

  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>SourcePanel</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">SourcePanel</h1>
          <p className="text-lg text-muted-foreground">
            AI 응답의 출처와 근거를 표시하는 패널 컴포넌트입니다. 웹, 파일, 데이터베이스, API 등 다양한 출처 유형을 지원합니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add source-panel --agentic" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Interactive Demo</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              아래 패널에서 &quot;더 보기&quot;를 클릭하여 확장/축소할 수 있습니다.
            </p>
            <SourcePanel sources={sources} maxItems={3} />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={sourcePanelProps} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Source Type</h2>
          <PropsTable props={sourceTypeProps} />
        </section>
      </div>
    </div>
  )
}
