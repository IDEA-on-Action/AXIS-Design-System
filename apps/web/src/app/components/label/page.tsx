'use client'

import { Input, Label } from '@ax/ui'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const labelProps = [
  { name: 'htmlFor', type: 'string', default: '-', description: '연결할 input의 id' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { Label } from '@ax/ui'

export function Example() {
  return <Label htmlFor="email">Email</Label>
}`

const withInputExample = `import { Input, Label } from '@ax/ui'

export function Example() {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Enter your email" />
    </div>
  )
}`

export default function LabelPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Label</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Label</h1>
          <p className="text-lg text-muted-foreground">
            폼 필드에 대한 접근성 레이블 컴포넌트입니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add label" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <Label htmlFor="demo">Email</Label>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">With Input</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="email-demo">Email</Label>
              <Input type="email" id="email-demo" placeholder="Enter your email" />
            </div>
          </div>
          <CodeBlock code={withInputExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={labelProps} />
        </section>
      </div>
    </div>
  )
}
