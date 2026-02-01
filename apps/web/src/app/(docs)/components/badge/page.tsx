'use client'

import { Badge } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const badgeProps = [
  { name: 'variant', type: '"default" | "secondary" | "destructive" | "outline"', default: '"default"', description: '뱃지 스타일 변형' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { Badge } from '@axis-ds/ui-react'

export function Example() {
  return <Badge>Badge</Badge>
}`

const variantsExample = `<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`

export default function BadgePage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Badge</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Badge</h1>
          <p className="text-lg text-muted-foreground">
            상태나 카테고리를 표시하는 뱃지 컴포넌트입니다.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add badge" language="bash" />
        </section>

        {/* Basic Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <Badge>Badge</Badge>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        {/* Variants */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Variants</h2>
          <div className="mb-4 flex flex-wrap gap-2 p-6 rounded-lg border">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
          <CodeBlock code={variantsExample} />
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={badgeProps} />
        </section>
      </div>
    </div>
  )
}
