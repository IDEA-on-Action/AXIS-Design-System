'use client'

import { Label, Switch } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const switchProps = [
  { name: 'checked', type: 'boolean', default: '-', description: '활성화 상태 (controlled)' },
  { name: 'defaultChecked', type: 'boolean', default: '-', description: '기본 활성화 상태' },
  { name: 'onCheckedChange', type: '(checked: boolean) => void', default: '-', description: '상태 변경 콜백' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '비활성화 여부' },
  { name: 'required', type: 'boolean', default: 'false', description: '필수 입력 여부' },
  { name: 'name', type: 'string', default: '-', description: '폼 필드 이름' },
  { name: 'value', type: 'string', default: '"on"', description: '폼 제출 값' },
]

const basicExample = `import { Label, Switch } from '@axis-ds/ui-react'

export function Example() {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">비행기 모드</Label>
    </div>
  )
}`

export default function SwitchPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Switch</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Switch</h1>
          <p className="text-lg text-muted-foreground">
            켜기/끄기 토글 스위치 컴포넌트입니다. Radix UI Switch 기반.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add switch" language="bash" />
        </section>

        {/* Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <div className="flex items-center space-x-2">
              <Switch id="airplane-demo" />
              <Label htmlFor="airplane-demo">비행기 모드</Label>
            </div>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={switchProps} />
        </section>
      </div>
    </div>
  )
}
