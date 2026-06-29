'use client'

import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

// Mock Tooltip 컴포넌트
const TooltipProvider = ({ children }: any) => children
const Tooltip = ({ children }: any) => <div className="relative inline-block group">{children}</div>
const TooltipTrigger = ({ children, asChild }: any) => children
const TooltipContent = ({ children, side = 'top' }: any) => (
  <div
    className={`
    absolute z-50 hidden group-hover:block
    px-3 py-1.5 text-xs rounded-md
    bg-foreground text-background
    ${side === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : ''}
    ${side === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' : ''}
    ${side === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' : ''}
    ${side === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2' : ''}
  `}
  >
    {children}
  </div>
)

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
        <CodeBlock code="npx axis-cli add tooltip" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Demo">
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
    </DocPageLayout>
  )
}
