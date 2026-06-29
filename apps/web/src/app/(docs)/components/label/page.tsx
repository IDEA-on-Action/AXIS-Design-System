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
    </DocPageLayout>
  )
}
