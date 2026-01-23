'use client'

import { Separator } from '@ax/ui'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const separatorProps = [
  { name: 'orientation', type: '"horizontal" | "vertical"', default: '"horizontal"', description: '구분선 방향' },
  { name: 'decorative', type: 'boolean', default: 'true', description: '장식용 여부 (접근성)' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { Separator } from '@ax/ui'

export function Example() {
  return (
    <div>
      <div className="space-y-1">
        <h4 className="text-sm font-medium">AXIS Design System</h4>
        <p className="text-sm text-muted-foreground">
          AI/LLM 애플리케이션을 위한 컴포넌트 라이브러리
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Components</div>
        <Separator orientation="vertical" />
        <div>Agentic UI</div>
      </div>
    </div>
  )
}`

export default function SeparatorPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Separator</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Separator</h1>
          <p className="text-lg text-muted-foreground">
            콘텐츠를 시각적으로 구분하는 구분선 컴포넌트입니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add separator" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">AXIS Design System</h4>
                <p className="text-sm text-muted-foreground">
                  AI/LLM 애플리케이션을 위한 컴포넌트 라이브러리
                </p>
              </div>
              <Separator className="my-4" />
              <div className="flex h-5 items-center space-x-4 text-sm">
                <div>Docs</div>
                <Separator orientation="vertical" />
                <div>Components</div>
                <Separator orientation="vertical" />
                <div>Agentic UI</div>
              </div>
            </div>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Orientation</h2>
          <div className="space-y-6">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">Horizontal (Default)</p>
              <Separator />
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">Vertical</p>
              <div className="flex h-8 items-center space-x-4">
                <span>Item 1</span>
                <Separator orientation="vertical" />
                <span>Item 2</span>
                <Separator orientation="vertical" />
                <span>Item 3</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={separatorProps} />
        </section>
      </div>
    </div>
  )
}
