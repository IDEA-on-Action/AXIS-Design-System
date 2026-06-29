'use client'

import { useState } from 'react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

const collapsibleProps = [
  { name: 'open', type: 'boolean', default: '-', description: '열림 상태 (controlled)' },
  { name: 'defaultOpen', type: 'boolean', default: 'false', description: '기본 열림 상태' },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    default: '-',
    description: '상태 변경 콜백',
  },
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
      <div className="rounded-md border px-4 py-3 text-sm">@axis-ds/tokens</div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border px-4 py-3 text-sm">@axis-ds/theme</div>
        <div className="rounded-md border px-4 py-3 text-sm">@axis-ds/cli</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default function CollapsiblePage() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Collapsible"
      description="콘텐츠를 접거나 펼칠 수 있는 컴포넌트입니다. Radix UI Collapsible 기반."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add collapsible" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <CollapsibleDemo />
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Components">
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
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={collapsibleProps} />
      </DocSection>
    </DocPageLayout>
  )
}
