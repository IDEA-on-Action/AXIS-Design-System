'use client'

import { ScrollArea, Separator } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const scrollAreaProps = [
  { name: 'type', type: '"auto" | "always" | "scroll" | "hover"', default: '"hover"', description: '스크롤바 표시 모드' },
  { name: 'scrollHideDelay', type: 'number', default: '600', description: '스크롤바 숨김 지연 (ms)' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const tags = Array.from({ length: 50 }).map(
  (_, i) => `v1.${i}.0`
)

const basicExample = `import { ScrollArea, Separator } from '@axis-ds/ui-react'

const tags = Array.from({ length: 50 }).map(
  (_, i) => \`v1.\${i}.0\`
)

export function Example() {
  return (
    <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {tags.map((tag) => (
          <div key={tag}>
            <div className="text-sm">{tag}</div>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}`

export default function ScrollAreaPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>ScrollArea</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">ScrollArea</h1>
          <p className="text-lg text-muted-foreground">
            커스텀 스크롤바를 제공하는 스크롤 영역입니다. Radix UI ScrollArea 기반.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add scroll-area" language="bash" />
        </section>

        {/* Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <ScrollArea className="h-72 w-48 rounded-md border">
              <div className="p-4">
                <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
                {tags.map((tag) => (
                  <div key={tag}>
                    <div className="text-sm">{tag}</div>
                    <Separator className="my-2" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        {/* Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Components</h2>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">ScrollArea</code>
              <p className="mt-1 text-sm text-muted-foreground">스크롤 영역 컨테이너</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">ScrollBar</code>
              <p className="mt-1 text-sm text-muted-foreground">커스텀 스크롤바 (수직/수평)</p>
            </div>
          </div>
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={scrollAreaProps} />
        </section>
      </div>
    </div>
  )
}
