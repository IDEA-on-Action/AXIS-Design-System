'use client'

import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import { Loader2, Mail, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const buttonProps = [
  { name: 'variant', type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"', default: '"default"', description: '버튼 스타일 변형' },
  { name: 'size', type: '"default" | "sm" | "lg" | "icon"', default: '"default"', description: '버튼 크기' },
  { name: 'asChild', type: 'boolean', default: 'false', description: 'Slot 컴포넌트로 렌더링 (Radix)' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '비활성화 상태' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { Button } from '@axis-ds/ui-react'

export function Example() {
  return <Button>Click me</Button>
}`

const variantsExample = `<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>`

const sizesExample = `<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Mail /></Button>`

const withIconExample = `<Button>
  <Mail className="mr-2 h-4 w-4" />
  Login with Email
</Button>

<Button>
  Next
  <ChevronRight className="ml-2 h-4 w-4" />
</Button>`

const loadingExample = `<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Please wait
</Button>`

export default function ButtonPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Button</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Button</h1>
          <p className="text-lg text-muted-foreground">
            다양한 스타일과 크기를 지원하는 버튼 컴포넌트입니다.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add button" language="bash" />
        </section>

        {/* Basic Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        {/* Variants */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Variants</h2>
          <div className="mb-4 flex flex-wrap gap-2 p-6 rounded-lg border">
            <Button variant="default">Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <CodeBlock code={variantsExample} />
        </section>

        {/* Sizes */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Sizes</h2>
          <div className="mb-4 flex flex-wrap items-center gap-2 p-6 rounded-lg border">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><Mail className="h-4 w-4" /></Button>
          </div>
          <CodeBlock code={sizesExample} />
        </section>

        {/* With Icon */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">With Icon</h2>
          <div className="mb-4 flex flex-wrap gap-2 p-6 rounded-lg border">
            <Button>
              <Mail className="mr-2 h-4 w-4" />
              Login with Email
            </Button>
            <Button>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <CodeBlock code={withIconExample} />
        </section>

        {/* Loading */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Loading State</h2>
          <div className="mb-4 flex flex-wrap gap-2 p-6 rounded-lg border">
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait
            </Button>
          </div>
          <CodeBlock code={loadingExample} />
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={buttonProps} />
        </section>
      </div>
    </div>
  )
}
