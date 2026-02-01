'use client'

import { useState } from 'react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const collapsibleProps = [
  { name: 'open', type: 'boolean', default: '-', description: '열림 상태 (controlled)' },
  { name: 'defaultOpen', type: 'boolean', default: 'false', description: '기본 열림 상태' },
  { name: 'onOpenChange', type: '(open: boolean) => void', default: '-', description: '상태 변경 콜백' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '비활성화 여부' },
]

const basicExample = `import { useState } from 'react'
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@axis-ds/ui-react'

export function Example() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[350px] space-y-2">
      <div className="flex items-center justify-between space-x-4 px-4">
        <h4 className="text-sm font-semibold">@axis-ds/ui-react</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isOpen ? '접기' : '펼치기'}
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-4 py-3 text-sm">
        @axis-ds/tokens
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border px-4 py-3 text-sm">
          @axis-ds/theme
        </div>
        <div className="rounded-md border px-4 py-3 text-sm">
          @axis-ds/cli
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}`

function CollapsibleDemo() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[350px] space-y-2">
      <div className="flex items-center justify-between space-x-4 px-4">
        <h4 className="text-sm font-semibold">@axis-ds/ui-react</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isOpen ? '접기' : '펼치기'}
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-4 py-3 text-sm">
        @axis-ds/tokens
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border px-4 py-3 text-sm">
          @axis-ds/theme
        </div>
        <div className="rounded-md border px-4 py-3 text-sm">
          @axis-ds/cli
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default function CollapsiblePage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Collapsible</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Collapsible</h1>
          <p className="text-lg text-muted-foreground">
            콘텐츠를 접거나 펼칠 수 있는 컴포넌트입니다. Radix UI Collapsible 기반.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add collapsible" language="bash" />
        </section>

        {/* Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <CollapsibleDemo />
          </div>
          <CodeBlock code={basicExample} />
        </section>

        {/* Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Components</h2>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">Collapsible</code>
              <p className="mt-1 text-sm text-muted-foreground">접이식 영역 루트 컨테이너</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">CollapsibleTrigger</code>
              <p className="mt-1 text-sm text-muted-foreground">열기/닫기 트리거</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">CollapsibleContent</code>
              <p className="mt-1 text-sm text-muted-foreground">접이식 콘텐츠 영역</p>
            </div>
          </div>
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={collapsibleProps} />
        </section>
      </div>
    </div>
  )
}
