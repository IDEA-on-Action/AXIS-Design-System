'use client'

import { Checkbox, Label } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const checkboxProps = [
  { name: 'checked', type: 'boolean | "indeterminate"', default: '-', description: '체크 상태 (controlled)' },
  { name: 'defaultChecked', type: 'boolean', default: '-', description: '기본 체크 상태' },
  { name: 'onCheckedChange', type: '(checked: boolean | "indeterminate") => void', default: '-', description: '체크 상태 변경 콜백' },
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
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Checkbox</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Checkbox</h1>
          <p className="text-lg text-muted-foreground">
            선택/해제 가능한 체크박스 입력 컴포넌트입니다. Radix UI Checkbox 기반.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add checkbox" language="bash" />
        </section>

        {/* Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <div className="flex items-center space-x-2">
              <Checkbox id="terms-demo" />
              <Label htmlFor="terms-demo">이용약관에 동의합니다</Label>
            </div>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        {/* Disabled */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Disabled</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <div className="flex items-center space-x-2">
              <Checkbox id="disabled-demo" disabled />
              <Label htmlFor="disabled-demo" className="text-muted-foreground">
                비활성화된 체크박스
              </Label>
            </div>
          </div>
          <CodeBlock code={disabledExample} />
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={checkboxProps} />
        </section>
      </div>
    </div>
  )
}
