'use client'

import { Button, Input, Label } from '@ax/ui'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const inputProps = [
  { name: 'type', type: 'string', default: '"text"', description: 'Input 타입 (text, email, password 등)' },
  { name: 'placeholder', type: 'string', default: '-', description: '플레이스홀더 텍스트' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '비활성화 상태' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { Input } from '@ax/ui'

export function Example() {
  return <Input type="email" placeholder="Email" />
}`

const withLabelExample = `import { Input, Label } from '@ax/ui'

export function Example() {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  )
}`

const withButtonExample = `<div className="flex w-full max-w-sm items-center space-x-2">
  <Input type="email" placeholder="Email" />
  <Button type="submit">Subscribe</Button>
</div>`

const disabledExample = `<Input disabled type="email" placeholder="Email" />`

const fileExample = `<Input type="file" />`

export default function InputPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Input</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Input</h1>
          <p className="text-lg text-muted-foreground">
            다양한 타입을 지원하는 텍스트 입력 필드입니다.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add input" language="bash" />
        </section>

        {/* Basic Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <Input type="email" placeholder="Email" className="max-w-sm" />
          </div>
          <CodeBlock code={basicExample} />
        </section>

        {/* With Label */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">With Label</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="email-demo">Email</Label>
              <Input type="email" id="email-demo" placeholder="Email" />
            </div>
          </div>
          <CodeBlock code={withLabelExample} />
        </section>

        {/* With Button */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">With Button</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="email" placeholder="Email" />
              <Button type="submit">Subscribe</Button>
            </div>
          </div>
          <CodeBlock code={withButtonExample} />
        </section>

        {/* Disabled */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Disabled</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <Input disabled type="email" placeholder="Email" className="max-w-sm" />
          </div>
          <CodeBlock code={disabledExample} />
        </section>

        {/* File Input */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">File Input</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <Input type="file" className="max-w-sm" />
          </div>
          <CodeBlock code={fileExample} />
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={inputProps} />
        </section>
      </div>
    </div>
  )
}
