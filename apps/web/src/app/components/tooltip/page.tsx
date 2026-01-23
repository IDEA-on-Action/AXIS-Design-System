'use client'

import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

// Mock Tooltip 컴포넌트
const TooltipProvider = ({ children }: any) => children
const Tooltip = ({ children }: any) => <div className="relative inline-block group">{children}</div>
const TooltipTrigger = ({ children, asChild }: any) => children
const TooltipContent = ({ children, side = 'top' }: any) => (
  <div className={`
    absolute z-50 hidden group-hover:block
    px-3 py-1.5 text-xs rounded-md
    bg-foreground text-background
    ${side === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : ''}
    ${side === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' : ''}
    ${side === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' : ''}
    ${side === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2' : ''}
  `}>
    {children}
  </div>
)

const tooltipContentProps = [
  { name: 'side', type: '"top" | "right" | "bottom" | "left"', default: '"top"', description: '툴팁 표시 위치' },
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
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Tooltip</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Tooltip</h1>
          <p className="text-lg text-muted-foreground">
            호버 시 추가 정보를 표시하는 팝업 컴포넌트입니다. Radix UI 기반으로 접근성을 지원합니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add tooltip" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Demo</h2>
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
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Positions</h2>
          <div className="mb-4 flex items-center justify-center gap-4 p-12 rounded-lg border">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">Top</Button>
                </TooltipTrigger>
                <TooltipContent side="top">Top tooltip</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">Right</Button>
                </TooltipTrigger>
                <TooltipContent side="right">Right tooltip</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">Bottom</Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Bottom tooltip</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">Left</Button>
                </TooltipTrigger>
                <TooltipContent side="left">Left tooltip</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CodeBlock code={sidesExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">TooltipContent Props</h2>
          <PropsTable props={tooltipContentProps} />
        </section>
      </div>
    </div>
  )
}
