'use client'

import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

// Mock Skeleton 컴포넌트
const Skeleton = ({ className = '' }: any) => (
  <div className={`animate-pulse rounded-md bg-muted ${className}`} />
)

const skeletonProps = [
  { name: 'className', type: 'string', default: '-', description: '크기 및 모양을 지정하는 CSS 클래스' },
]

const basicExample = `import { Skeleton } from '@axis-ds/ui-react'

export function Example() {
  return <Skeleton className="h-4 w-[250px]" />
}`

const cardExample = `// 카드 로딩 상태
<div className="flex items-center space-x-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </div>
</div>`

const tableExample = `// 테이블 로딩 상태
<div className="space-y-3">
  <Skeleton className="h-8 w-full" />
  <Skeleton className="h-8 w-full" />
  <Skeleton className="h-8 w-full" />
</div>`

export default function SkeletonPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Skeleton</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Skeleton</h1>
          <p className="text-lg text-muted-foreground">
            콘텐츠 로딩 상태를 표시하는 플레이스홀더 컴포넌트입니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add skeleton" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Basic</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Card Loading</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </div>
          <CodeBlock code={cardExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Table Loading</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
          <CodeBlock code={tableExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Complex Layout</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <div className="space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-40 w-40 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={skeletonProps} />
        </section>
      </div>
    </div>
  )
}
