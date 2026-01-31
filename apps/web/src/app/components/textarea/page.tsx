'use client'

import { Label, Textarea } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const textareaProps = [
  { name: 'placeholder', type: 'string', default: '-', description: '플레이스홀더 텍스트' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '비활성화 여부' },
  { name: 'rows', type: 'number', default: '-', description: '표시할 행 수' },
  { name: 'value', type: 'string', default: '-', description: '입력 값 (controlled)' },
  { name: 'onChange', type: '(e: ChangeEvent) => void', default: '-', description: '값 변경 콜백' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { Textarea } from '@axis-ds/ui-react'

export function Example() {
  return <Textarea placeholder="내용을 입력하세요." />
}`

const withLabelExample = `import { Label, Textarea } from '@axis-ds/ui-react'

export function Example() {
  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message">메시지</Label>
      <Textarea placeholder="메시지를 입력하세요." id="message" />
      <p className="text-sm text-muted-foreground">
        최대 500자까지 입력할 수 있습니다.
      </p>
    </div>
  )
}`

export default function TextareaPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Textarea</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Textarea</h1>
          <p className="text-lg text-muted-foreground">
            여러 줄 텍스트를 입력할 수 있는 텍스트영역 컴포넌트입니다.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add textarea" language="bash" />
        </section>

        {/* Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <Textarea placeholder="내용을 입력하세요." />
          </div>
          <CodeBlock code={basicExample} />
        </section>

        {/* With Label */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">With Label</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="message-demo">메시지</Label>
              <Textarea placeholder="메시지를 입력하세요." id="message-demo" />
              <p className="text-sm text-muted-foreground">
                최대 500자까지 입력할 수 있습니다.
              </p>
            </div>
          </div>
          <CodeBlock code={withLabelExample} />
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={textareaProps} />
        </section>
      </div>
    </div>
  )
}
