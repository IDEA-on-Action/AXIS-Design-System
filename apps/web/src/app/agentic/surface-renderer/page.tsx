'use client'

import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const surfaceRendererProps = [
  { name: 'surface', type: 'A2UISurface', default: '-', description: 'A2UI Surface 데이터', required: true },
  { name: 'context', type: 'SurfaceRendererContext', default: '-', description: '액션 콜백 컨텍스트' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const surfaceTypesList = [
  { name: 'form', description: '입력 폼 Surface' },
  { name: 'card', description: '일반 카드 Surface' },
  { name: 'table', description: '테이블 Surface' },
  { name: 'summary', description: '요약 Surface' },
  { name: 'action_buttons', description: '액션 버튼 그룹' },
  { name: 'progress', description: '진행률 표시' },
  { name: 'message', description: '메시지 (info/success/warning/error)' },
  { name: 'activity_preview', description: 'Activity 미리보기' },
  { name: 'aar_template', description: 'AAR 템플릿' },
  { name: 'approval_request', description: '승인 요청' },
]

const basicExample = `import { SurfaceRenderer } from '@axis-ds/ui-react'

const messageSurface = {
  id: 'msg-001',
  type: 'message',
  variant: 'info',
  content: '데이터 수집이 완료되었습니다.',
}

const cardSurface = {
  id: 'card-001',
  type: 'card',
  title: '분석 결과',
  description: 'AI 분석 결과입니다.',
  content: '총 42개의 세미나가 발견되었습니다.',
  badges: [{ label: 'AI', variant: 'secondary' }],
  actions: [
    { id: 'view', label: '상세 보기', type: 'primary' },
    { id: 'export', label: '내보내기', type: 'secondary' },
  ],
}

export function Example() {
  return (
    <div className="space-y-4">
      <SurfaceRenderer surface={messageSurface} />
      <SurfaceRenderer
        surface={cardSurface}
        context={{
          onAction: (surfaceId, actionId) => {
            console.log(\`Action: \${actionId} on surface: \${surfaceId}\`)
          }
        }}
      />
    </div>
  )
}`

const progressExample = `const progressSurface = {
  id: 'progress-001',
  type: 'progress',
  title: '데이터 수집 진행',
  current: 35,
  total: 100,
  percentage: 35,
  status: 'active',
  message: '35개 완료, 65개 남음',
}`

export default function SurfaceRendererPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>SurfaceRenderer</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">SurfaceRenderer</h1>
          <p className="text-lg text-muted-foreground">
            A2UI Surface를 React 컴포넌트로 렌더링하는 컴포넌트입니다.
            허용된 카탈로그 컴포넌트만 렌더링하여 보안을 보장합니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add surface-renderer" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-4">
            {/* Message Surface Demo */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
              데이터 수집이 완료되었습니다.
            </div>

            {/* Card Surface Demo */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-6 pb-4">
                <h3 className="text-lg font-semibold">분석 결과</h3>
                <p className="text-sm text-muted-foreground">AI 분석 결과입니다.</p>
              </div>
              <div className="px-6 pb-2">
                <p>총 42개의 세미나가 발견되었습니다.</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                    AI
                  </span>
                </div>
              </div>
              <div className="flex items-center p-6 pt-2 gap-2">
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3">
                  상세 보기
                </button>
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent h-9 px-3">
                  내보내기
                </button>
              </div>
            </div>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Message Variants</h2>
          <div className="space-y-3 mb-4 p-6 rounded-lg border">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
              Info: 정보 메시지입니다.
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
              Success: 작업이 성공적으로 완료되었습니다.
            </div>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200">
              Warning: 주의가 필요한 상황입니다.
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200">
              Error: 오류가 발생했습니다.
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Progress Surface</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">데이터 수집 진행</span>
                <span className="text-muted-foreground">35 / 100</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: '35%' }} />
              </div>
              <p className="text-xs text-muted-foreground">35개 완료, 65개 남음</p>
            </div>
          </div>
          <CodeBlock code={progressExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Allowed Surface Types</h2>
          <p className="text-muted-foreground mb-4">
            보안을 위해 허용된 Surface 타입만 렌더링됩니다.
          </p>
          <div className="grid gap-2">
            {surfaceTypesList.map((type) => (
              <div key={type.name} className="flex items-center gap-3 rounded-lg border p-3">
                <code className="font-mono text-sm font-semibold text-primary">{type.name}</code>
                <span className="text-sm text-muted-foreground">{type.description}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={surfaceRendererProps} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">SurfaceRendererContext</h2>
          <CodeBlock code={`interface SurfaceRendererContext {
  onAction?: (surfaceId: string, actionId: string) => void
}`} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">SurfaceType</h2>
          <CodeBlock code={`type SurfaceType =
  | 'form'
  | 'card'
  | 'table'
  | 'summary'
  | 'action_buttons'
  | 'progress'
  | 'message'
  | 'activity_preview'
  | 'aar_template'
  | 'approval_request'`} />
        </section>
      </div>
    </div>
  )
}
