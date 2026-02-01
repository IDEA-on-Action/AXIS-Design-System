'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

// Mock StepTimeline 컴포넌트
const StepTimeline = ({ steps, orientation = 'vertical' }: any) => {
  const isVertical = orientation === 'vertical'

  return (
    <div className={isVertical ? 'flex flex-col gap-4' : 'flex items-center gap-2'}>
      {steps.map((step: any, index: number) => (
        <div
          key={step.id}
          className={`relative flex ${isVertical ? 'items-start gap-3' : 'flex-col items-center'}`}
        >
          {index < steps.length - 1 && (
            <div
              className={`absolute bg-border ${
                isVertical
                  ? 'left-2.5 top-6 w-0.5 h-full -translate-x-1/2'
                  : 'top-2.5 left-6 h-0.5 w-full'
              }`}
            />
          )}
          <div
            className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center ${
              step.status === 'complete' ? 'bg-green-500' :
              step.status === 'running' ? 'bg-blue-500 animate-pulse' :
              step.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
            }`}
          >
            {step.status === 'complete' && (
              <span className="text-white text-xs">✓</span>
            )}
          </div>
          <div className={isVertical ? 'flex-1' : 'text-center mt-2'}>
            <p className="text-sm font-medium">{step.label}</p>
            {step.description && (
              <p className="text-xs text-muted-foreground">{step.description}</p>
            )}
            {step.timestamp && (
              <p className="text-xs text-muted-foreground/60">
                {step.timestamp.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

const stepTimelineProps = [
  { name: 'steps', type: 'TimelineStep[]', required: true, description: '타임라인에 표시할 단계 배열' },
  { name: 'orientation', type: '"vertical" | "horizontal"', default: '"vertical"', description: '타임라인 방향' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const timelineStepProps = [
  { name: 'id', type: 'string', required: true, description: '단계 고유 식별자' },
  { name: 'label', type: 'string', required: true, description: '단계 이름' },
  { name: 'status', type: '"pending" | "running" | "complete" | "error" | "skipped"', required: true, description: '단계 상태' },
  { name: 'timestamp', type: 'Date', default: '-', description: '단계 실행 시간' },
  { name: 'description', type: 'string', default: '-', description: '단계 설명' },
]

const basicExample = `import { StepTimeline } from '@axis-ds/agentic-ui'

const steps = [
  { id: '1', label: '요청 수신', status: 'complete', timestamp: new Date() },
  { id: '2', label: '분석 중', status: 'running' },
  { id: '3', label: '완료', status: 'pending' },
]

export function Example() {
  return <StepTimeline steps={steps} orientation="vertical" />
}`

export default function StepTimelinePage() {
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical')

  const steps = [
    { id: '1', label: '요청 수신', status: 'complete' as const, timestamp: new Date(Date.now() - 60000), description: '사용자 요청을 수신했습니다' },
    { id: '2', label: '데이터 처리', status: 'complete' as const, timestamp: new Date(Date.now() - 30000) },
    { id: '3', label: '분석 중', status: 'running' as const, description: 'AI가 데이터를 분석하고 있습니다' },
    { id: '4', label: '결과 생성', status: 'pending' as const },
  ]

  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>StepTimeline</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">StepTimeline</h1>
          <p className="text-lg text-muted-foreground">
            단계별 진행 상황을 타임라인 형태로 시각화하는 컴포넌트입니다. 수직/수평 방향을 지원합니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add step-timeline --agentic" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Interactive Demo</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-4">
            <div className="flex gap-2">
              <Button
                variant={orientation === 'vertical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrientation('vertical')}
              >
                Vertical
              </Button>
              <Button
                variant={orientation === 'horizontal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrientation('horizontal')}
              >
                Horizontal
              </Button>
            </div>
            <div className={orientation === 'horizontal' ? 'overflow-x-auto' : ''}>
              <StepTimeline steps={steps} orientation={orientation} />
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={stepTimelineProps} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">TimelineStep Type</h2>
          <PropsTable props={timelineStepProps} />
        </section>
      </div>
    </div>
  )
}
