'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const breadcrumbProps = [
  { name: 'separator', type: 'React.ReactNode', default: '"/"', description: '구분자 커스터마이징' },
  { name: 'children', type: 'React.ReactNode', default: '-', description: '브레드크럼 내용' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@axis-ds/ui-react'

export function Example() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">홈</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/components">컴포넌트</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}`

export default function BreadcrumbPage_() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Breadcrumb</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Breadcrumb</h1>
          <p className="text-lg text-muted-foreground">
            현재 페이지의 경로를 탐색할 수 있는 브레드크럼 컴포넌트입니다.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add breadcrumb" language="bash" />
        </section>

        {/* Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">홈</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/components">컴포넌트</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        {/* Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Components</h2>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">Breadcrumb</code>
              <p className="mt-1 text-sm text-muted-foreground">브레드크럼 루트 (nav 요소)</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">BreadcrumbList</code>
              <p className="mt-1 text-sm text-muted-foreground">브레드크럼 목록 (ol 요소)</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">BreadcrumbItem</code>
              <p className="mt-1 text-sm text-muted-foreground">개별 브레드크럼 아이템 (li 요소)</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">BreadcrumbLink</code>
              <p className="mt-1 text-sm text-muted-foreground">탐색 가능한 링크</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">BreadcrumbPage</code>
              <p className="mt-1 text-sm text-muted-foreground">현재 페이지 (링크 없음)</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">BreadcrumbSeparator</code>
              <p className="mt-1 text-sm text-muted-foreground">아이템 간 구분자</p>
            </div>
          </div>
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={breadcrumbProps} />
        </section>
      </div>
    </div>
  )
}
