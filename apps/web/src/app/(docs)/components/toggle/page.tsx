'use client'

import { Toggle } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const toggleProps = [
  { name: 'pressed', type: 'boolean', default: '-', description: '눌림 상태 (controlled)' },
  { name: 'defaultPressed', type: 'boolean', default: 'false', description: '기본 눌림 상태' },
  { name: 'onPressedChange', type: '(pressed: boolean) => void', default: '-', description: '상태 변경 콜백' },
  { name: 'variant', type: '"default" | "outline"', default: '"default"', description: '토글 스타일 변형' },
  { name: 'size', type: '"default" | "sm" | "lg"', default: '"default"', description: '토글 크기' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '비활성화 여부' },
]

const basicExample = `import { Toggle } from '@axis-ds/ui-react'

export function Example() {
  return <Toggle aria-label="Toggle bold">B</Toggle>
}`

const outlineExample = `<Toggle variant="outline" aria-label="Toggle italic">
  I
</Toggle>`

export default function TogglePage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Toggle</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Toggle</h1>
          <p className="text-lg text-muted-foreground">
            눌림/해제 상태를 전환하는 토글 버튼입니다. Radix UI Toggle 기반.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add toggle" language="bash" />
        </section>

        {/* Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border flex gap-4">
            <Toggle aria-label="Toggle bold">
              <span className="font-bold">B</span>
            </Toggle>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        {/* Outline Variant */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Outline</h2>
          <div className="mb-4 p-6 rounded-lg border flex gap-4">
            <Toggle variant="outline" aria-label="Toggle italic">
              <span className="italic">I</span>
            </Toggle>
          </div>
          <CodeBlock code={outlineExample} />
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={toggleProps} />
        </section>
      </div>
    </div>
  )
}
