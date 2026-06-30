'use client'

import { Input, Label } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

const labelProps = [
  { name: 'htmlFor', type: 'string', default: '-', description: '연결할 input의 id' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { Label } from '@axis-ds/ui-react'

export function Example() {
  return <Label htmlFor="email">Email</Label>
}`

const withInputExample = `import { Input, Label } from '@axis-ds/ui-react'

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
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Label"
      description="폼 필드에 대한 접근성 레이블 컴포넌트입니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add label" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <Label htmlFor="demo">Email</Label>
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="With Input">
        <div className="mb-4 p-6 rounded-lg border">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email-demo">Email</Label>
            <Input type="email" id="email-demo" placeholder="Enter your email" />
          </div>
        </div>
        <CodeBlock code={withInputExample} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={labelProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {'htmlFor로 폼 컨트롤과 연결되는 접근 가능한 라벨입니다.'}
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>{'라벨 클릭 시 연결된 컨트롤로 포커스가 이동합니다.'}</li>
          <li key={1}>{'htmlFor 값을 컨트롤의 id와 일치시키세요.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
