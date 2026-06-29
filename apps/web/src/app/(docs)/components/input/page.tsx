'use client'

import { Button, Input, Label } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

const inputProps = [
  {
    name: 'type',
    type: 'string',
    default: '"text"',
    description: 'Input 타입 (text, email, password 등)',
  },
  { name: 'placeholder', type: 'string', default: '-', description: '플레이스홀더 텍스트' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '비활성화 상태' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { Input } from '@axis-ds/ui-react'

export function Example() {
  return <Input type="email" placeholder="Email" />
}`

const withLabelExample = `import { Input, Label } from '@axis-ds/ui-react'

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
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Input"
      description="다양한 타입을 지원하는 텍스트 입력 필드입니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add input" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <Input type="email" placeholder="Email" className="max-w-sm" />
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="With Label">
        <div className="mb-4 p-6 rounded-lg border">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email-demo">Email</Label>
            <Input type="email" id="email-demo" placeholder="Email" />
          </div>
        </div>
        <CodeBlock code={withLabelExample} />
      </DocSection>

      <DocSection title="With Button">
        <div className="mb-4 p-6 rounded-lg border">
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input type="email" placeholder="Email" />
            <Button type="submit">Subscribe</Button>
          </div>
        </div>
        <CodeBlock code={withButtonExample} />
      </DocSection>

      <DocSection title="Disabled">
        <div className="mb-4 p-6 rounded-lg border">
          <Input disabled type="email" placeholder="Email" className="max-w-sm" />
        </div>
        <CodeBlock code={disabledExample} />
      </DocSection>

      <DocSection title="File Input">
        <div className="mb-4 p-6 rounded-lg border">
          <Input type="file" className="max-w-sm" />
        </div>
        <CodeBlock code={fileExample} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={inputProps} />
      </DocSection>
    </DocPageLayout>
  )
}
