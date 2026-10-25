'use client'

import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

const tooltipContentProps = [
  {
    name: 'side',
    type: '"top" | "right" | "bottom" | "left"',
    default: '"top"',
    description: '툴팁 표시 위치',
  },
  { name: 'sideOffset', type: 'number', default: '4', description: '트리거로부터의 거리 (px)' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@axis-ds/ui-react'

export function Example() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Tooltip content</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}`

const sidesExample = `<Tooltip>
  <TooltipTrigger>Top</TooltipTrigger>
  <TooltipContent side="top">Top tooltip</TooltipContent>
</Tooltip>

<Tooltip>
  <TooltipTrigger>Right</TooltipTrigger>
  <TooltipContent side="right">Right tooltip</TooltipContent>
</Tooltip>

<Tooltip>
  <TooltipTrigger>Bottom</TooltipTrigger>
  <TooltipContent side="bottom">Bottom tooltip</TooltipContent>
</Tooltip>

<Tooltip>
  <TooltipTrigger>Left</TooltipTrigger>
  <TooltipContent side="left">Left tooltip</TooltipContent>
</Tooltip>`

export default function TooltipPage() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Tooltip"
      description="호버 시 추가 정보를 표시하는 팝업 컴포넌트입니다. Radix UI 기반으로 접근성을 지원합니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx @axis-ds/cli add tooltip" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Interactive Demo">
        <div className="mb-4 flex items-center justify-center gap-8 p-12 rounded-lg border">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Tooltip content</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </DocSection>

      <DocSection title="Positions">
        <div className="mb-4 flex items-center justify-center gap-4 p-12 rounded-lg border">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  Top
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Top tooltip</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  Right
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Right tooltip</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  Bottom
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Bottom tooltip</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  Left
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Left tooltip</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CodeBlock code={sidesExample} />
      </DocSection>

      <DocSection title="TooltipContent Props">
        <PropsTable props={tooltipContentProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {'Radix UI Tooltip 기반으로 role="tooltip"을 제공합니다.'}
        </p>
        <KeyboardTable keys={[{ key: 'Esc', description: '표시된 툴팁을 닫습니다.' }]} />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>
            {'트리거에 포커스하거나 호버하면 툴팁이 나타납니다 (툴팁 자체는 포커스 불가).'}
          </li>
          <li key={1}>
            {'화면 밖 트리거로 Tab 하면 페이지가 트리거까지 스크롤되는데, 트리거에 포커스가 있는 동안에는 그 스크롤로 툴팁이 닫히지 않습니다 (Esc · 포커스 이동 · 포인터 이탈로 닫힘).'}
          </li>
          <li key={2}>{'툴팁은 보조 정보 전용이며 필수 정보를 담지 마세요.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
