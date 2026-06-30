'use client'

import { Slider } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

const sliderProps = [
  { name: 'value', type: 'number[]', default: '-', description: '현재 값 (controlled)' },
  { name: 'defaultValue', type: 'number[]', default: '[0]', description: '기본 값' },
  {
    name: 'onValueChange',
    type: '(value: number[]) => void',
    default: '-',
    description: '값 변경 콜백',
  },
  {
    name: 'onValueCommit',
    type: '(value: number[]) => void',
    default: '-',
    description: '드래그 종료 시 콜백',
  },
  { name: 'min', type: 'number', default: '0', description: '최소값' },
  { name: 'max', type: 'number', default: '100', description: '최대값' },
  { name: 'step', type: 'number', default: '1', description: '단계 값' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '비활성화 여부' },
  {
    name: 'orientation',
    type: '"horizontal" | "vertical"',
    default: '"horizontal"',
    description: '슬라이더 방향',
  },
]

const basicExample = `import { Slider } from '@axis-ds/ui-react'

export function Example() {
  return <Slider defaultValue={[50]} max={100} step={1} />
}`

export default function SliderPage() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Slider"
      description="범위 내에서 값을 선택하는 슬라이더 컴포넌트입니다. Radix UI Slider 기반."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add slider" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <Slider defaultValue={[50]} max={100} step={1} className="w-[60%]" />
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={sliderProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {'Radix UI Slider 기반으로 WAI-ARIA Slider 패턴을 따릅니다.'}
        </p>
        <KeyboardTable
          keys={[
            { key: '← ↓', description: '값을 한 단계 감소시킵니다.' },
            { key: '→ ↑', description: '값을 한 단계 증가시킵니다.' },
            { key: 'Home / End', description: '최소/최대 값으로 이동합니다.' },
            { key: 'PageUp / PageDown', description: '큰 단위로 값을 조정합니다.' },
          ]}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>
            {'role="slider"와 aria-valuenow / aria-valuemin / aria-valuemax가 적용됩니다.'}
          </li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
