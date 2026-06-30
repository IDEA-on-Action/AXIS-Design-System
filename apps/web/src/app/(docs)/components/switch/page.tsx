'use client'

import { Label, Switch } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

const switchProps = [
  { name: 'checked', type: 'boolean', default: '-', description: '활성화 상태 (controlled)' },
  { name: 'defaultChecked', type: 'boolean', default: '-', description: '기본 활성화 상태' },
  {
    name: 'onCheckedChange',
    type: '(checked: boolean) => void',
    default: '-',
    description: '상태 변경 콜백',
  },
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
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Switch"
      description="켜기/끄기 토글 스위치 컴포넌트입니다. Radix UI Switch 기반."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add switch" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <div className="flex items-center space-x-2">
            <Switch id="airplane-demo" />
            <Label htmlFor="airplane-demo">비행기 모드</Label>
          </div>
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={switchProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {'Radix UI Switch 기반으로 role="switch"와 aria-checked를 제공합니다.'}
        </p>
        <KeyboardTable keys={[{ key: 'Space / Enter', description: '켜짐/꺼짐을 토글합니다.' }]} />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>{'Label로 연결해 접근 가능한 이름을 제공하세요.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
