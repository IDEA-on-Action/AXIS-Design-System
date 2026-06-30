'use client'

import { Toggle } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

const toggleProps = [
  { name: 'pressed', type: 'boolean', default: '-', description: '눌림 상태 (controlled)' },
  { name: 'defaultPressed', type: 'boolean', default: 'false', description: '기본 눌림 상태' },
  {
    name: 'onPressedChange',
    type: '(pressed: boolean) => void',
    default: '-',
    description: '상태 변경 콜백',
  },
  {
    name: 'variant',
    type: '"default" | "outline"',
    default: '"default"',
    description: '토글 스타일 변형',
  },
  { name: 'size', type: '"default" | "sm" | "lg"', default: '"default"', description: '토글 크기' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '비활성화 여부' },
]

const basicExample = `import { Toggle } from '@axis-ds/ui-react'

export function Example() {
  return <Toggle aria-label="Toggle bold">B</Toggle>
}`

const outlineExample = `<Toggle variant="outline" aria-label="Toggle italic">
  I
</Toggle>`

export default function TogglePage() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Toggle"
      description="눌림/해제 상태를 전환하는 토글 버튼입니다. Radix UI Toggle 기반."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add toggle" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border flex gap-4">
          <Toggle aria-label="Toggle bold">
            <span className="font-bold">B</span>
          </Toggle>
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Outline">
        <div className="mb-4 p-6 rounded-lg border flex gap-4">
          <Toggle variant="outline" aria-label="Toggle italic">
            <span className="italic">I</span>
          </Toggle>
        </div>
        <CodeBlock code={outlineExample} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={toggleProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {'Radix UI Toggle 기반으로 aria-pressed로 눌림 상태를 표현합니다.'}
        </p>
        <KeyboardTable keys={[{ key: 'Space / Enter', description: '눌림 상태를 토글합니다.' }]} />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>{'아이콘 전용 토글은 aria-label로 의미를 제공하세요.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
