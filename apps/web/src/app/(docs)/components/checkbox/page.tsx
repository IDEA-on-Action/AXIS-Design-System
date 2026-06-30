'use client'

import { Checkbox, Label } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

const checkboxProps = [
  {
    name: 'checked',
    type: 'boolean | "indeterminate"',
    default: '-',
    description: '체크 상태 (controlled)',
  },
  { name: 'defaultChecked', type: 'boolean', default: '-', description: '기본 체크 상태' },
  {
    name: 'onCheckedChange',
    type: '(checked: boolean | "indeterminate") => void',
    default: '-',
    description: '체크 상태 변경 콜백',
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: '비활성화 여부' },
  { name: 'required', type: 'boolean', default: 'false', description: '필수 입력 여부' },
  { name: 'name', type: 'string', default: '-', description: '폼 필드 이름' },
  { name: 'value', type: 'string', default: '"on"', description: '폼 제출 값' },
]

const basicExample = `import { Checkbox, Label } from '@axis-ds/ui-react'

export function Example() {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">이용약관에 동의합니다</Label>
    </div>
  )
}`

const disabledExample = `<div className="flex items-center space-x-2">
  <Checkbox id="disabled" disabled />
  <Label htmlFor="disabled" className="text-muted-foreground">
    비활성화된 체크박스
  </Label>
</div>`

export default function CheckboxPage() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Checkbox"
      description="선택/해제 가능한 체크박스 입력 컴포넌트입니다. Radix UI Checkbox 기반."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add checkbox" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <div className="flex items-center space-x-2">
            <Checkbox id="terms-demo" />
            <Label htmlFor="terms-demo">이용약관에 동의합니다</Label>
          </div>
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Disabled">
        <div className="mb-4 p-6 rounded-lg border">
          <div className="flex items-center space-x-2">
            <Checkbox id="disabled-demo" disabled />
            <Label htmlFor="disabled-demo" className="text-muted-foreground">
              비활성화된 체크박스
            </Label>
          </div>
        </div>
        <CodeBlock code={disabledExample} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={checkboxProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {'Radix UI Checkbox 기반으로 role="checkbox"와 aria-checked를 제공합니다.'}
        </p>
        <KeyboardTable keys={[{ key: 'Space', description: '체크 상태를 토글합니다.' }]} />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>
            {'Label 컴포넌트로 연결하면 라벨 클릭으로도 토글되고 접근 가능한 이름이 부여됩니다.'}
          </li>
          <li key={1}>{'indeterminate 상태는 aria-checked="mixed"로 표현됩니다.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
