'use client'

import { ScrollArea, Separator } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

const scrollAreaProps = [
  {
    name: 'type',
    type: '"auto" | "always" | "scroll" | "hover"',
    default: '"hover"',
    description: '스크롤바 표시 모드',
  },
  {
    name: 'scrollHideDelay',
    type: 'number',
    default: '600',
    description: '스크롤바 숨김 지연 (ms)',
  },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const tags = Array.from({ length: 50 }).map((_, i) => `v1.${i}.0`)

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
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="ScrollArea"
      description="커스텀 스크롤바를 제공하는 스크롤 영역입니다. Radix UI ScrollArea 기반."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add scroll-area" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <ScrollArea className="h-72 w-48 rounded-md border">
            <div className="p-4">
              <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
              {tags.map(tag => (
                <div key={tag}>
                  <div className="text-sm">{tag}</div>
                  <Separator className="my-2" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Components">
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
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={scrollAreaProps} />
      </DocSection>
    </DocPageLayout>
  )
}
