'use client'

import { Label, RadioGroup, RadioGroupItem } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

const radioGroupProps = [
  { name: 'value', type: 'string', default: '-', description: '선택된 값 (controlled)' },
  { name: 'defaultValue', type: 'string', default: '-', description: '기본 선택 값' },
  {
    name: 'onValueChange',
    type: '(value: string) => void',
    default: '-',
    description: '값 변경 콜백',
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: '비활성화 여부' },
  {
    name: 'orientation',
    type: '"horizontal" | "vertical"',
    default: '"vertical"',
    description: '배치 방향',
  },
  { name: 'name', type: 'string', default: '-', description: '폼 필드 이름' },
  { name: 'required', type: 'boolean', default: 'false', description: '필수 입력 여부' },
]

const basicExample = `import { Label, RadioGroup, RadioGroupItem } from '@axis-ds/ui-react'

export function Example() {
  return (
    <RadioGroup defaultValue="comfortable">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="default" id="r1" />
        <Label htmlFor="r1">Default</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="comfortable" id="r2" />
        <Label htmlFor="r2">Comfortable</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="compact" id="r3" />
        <Label htmlFor="r3">Compact</Label>
      </div>
    </RadioGroup>
  )
}`

export default function RadioGroupPage() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="RadioGroup"
      description="여러 옵션 중 하나를 선택하는 라디오 버튼 그룹입니다. Radix UI RadioGroup 기반."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add radio-group" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <RadioGroup defaultValue="comfortable">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="default" id="r1-demo" />
              <Label htmlFor="r1-demo">Default</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="comfortable" id="r2-demo" />
              <Label htmlFor="r2-demo">Comfortable</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="compact" id="r3-demo" />
              <Label htmlFor="r3-demo">Compact</Label>
            </div>
          </RadioGroup>
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Components">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">RadioGroup</code>
            <p className="mt-1 text-sm text-muted-foreground">라디오 그룹 루트 컨테이너</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">RadioGroupItem</code>
            <p className="mt-1 text-sm text-muted-foreground">개별 라디오 버튼</p>
          </div>
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={radioGroupProps} />
      </DocSection>
    </DocPageLayout>
  )
}
