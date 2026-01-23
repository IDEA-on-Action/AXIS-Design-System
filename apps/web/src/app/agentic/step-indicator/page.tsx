'use client'

import { useState } from 'react'
import { Button } from '@ax/ui'
import { StepIndicator } from '@ax/ui'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const stepIndicatorProps = [
  { name: 'steps', type: 'Step[]', required: true, description: '단계 목록' },
  { name: 'currentStepIndex', type: 'number', required: true, description: '현재 단계 인덱스 (0-indexed)' },
  { name: 'orientation', type: '"horizontal" | "vertical"', default: '"vertical"', description: '표시 방향' },
  { name: 'compact', type: 'boolean', default: 'false', description: '컴팩트 모드' },
]

const stepProps = [
  { name: 'id', type: 'string', required: true, description: '단계 고유 ID' },
  { name: 'label', type: 'string', required: true, description: '단계 레이블' },
  { name: 'status', type: '"pending" | "running" | "completed" | "error" | "skipped"', required: true, description: '단계 상태' },
  { name: 'duration', type: 'number', default: '-', description: '실행 시간 (ms)' },
  { name: 'message', type: 'string', default: '-', description: '추가 메시지' },
]

const basicExample = `import { StepIndicator } from '@ax/ui'

const steps = [
  { id: '1', label: '데이터 수집', status: 'completed', duration: 1200 },
  { id: '2', label: 'AI 분석', status: 'running' },
  { id: '3', label: '결과 생성', status: 'pending' },
  { id: '4', label: '검토', status: 'pending' },
]

export function Example() {
  return <StepIndicator steps={steps} currentStepIndex={1} />
}`

const horizontalExample = `<StepIndicator
  steps={steps}
  currentStepIndex={2}
  orientation="horizontal"
/>`

type StepStatus = 'pending' | 'running' | 'completed' | 'error' | 'skipped'

export default function StepIndicatorPage() {
  const [currentStep, setCurrentStep] = useState(0)

  const getSteps = (current: number) => [
    { id: '1', label: '데이터 수집', status: (current > 0 ? 'completed' : current === 0 ? 'running' : 'pending') as StepStatus, duration: current > 0 ? 1234 : undefined },
    { id: '2', label: 'AI 분석', status: (current > 1 ? 'completed' : current === 1 ? 'running' : 'pending') as StepStatus, duration: current > 1 ? 2567 : undefined },
    { id: '3', label: '결과 생성', status: (current > 2 ? 'completed' : current === 2 ? 'running' : 'pending') as StepStatus, duration: current > 2 ? 890 : undefined },
    { id: '4', label: '사용자 검토', status: (current > 3 ? 'completed' : current === 3 ? 'running' : 'pending') as StepStatus },
  ]

  const steps = getSteps(currentStep)

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, 3))
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0))
  const reset = () => setCurrentStep(0)

  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>StepIndicator</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">StepIndicator</h1>
          <p className="text-lg text-muted-foreground">
            AI 에이전트의 워크플로 단계를 시각적으로 표시하는 컴포넌트입니다.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add step-indicator" language="bash" />
        </section>

        {/* Interactive Demo */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Interactive Demo</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-6">
            <StepIndicator steps={steps} currentStepIndex={currentStep} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                이전
              </Button>
              <Button onClick={nextStep} disabled={currentStep === 3}>
                다음
              </Button>
              <Button variant="ghost" onClick={reset}>
                리셋
              </Button>
            </div>
          </div>
        </section>

        {/* Vertical */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Vertical (Default)</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <StepIndicator
              steps={[
                { id: '1', label: '데이터 수집', status: 'completed', duration: 1234 },
                { id: '2', label: 'AI 분석', status: 'completed', duration: 2567 },
                { id: '3', label: '결과 생성', status: 'running' },
                { id: '4', label: '검토', status: 'pending' },
              ]}
              currentStepIndex={2}
            />
          </div>
          <CodeBlock code={basicExample} />
        </section>

        {/* Horizontal */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Horizontal</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <StepIndicator
              steps={[
                { id: '1', label: '수집', status: 'completed' },
                { id: '2', label: '분석', status: 'completed' },
                { id: '3', label: '생성', status: 'running' },
                { id: '4', label: '검토', status: 'pending' },
              ]}
              currentStepIndex={2}
              orientation="horizontal"
            />
          </div>
          <CodeBlock code={horizontalExample} />
        </section>

        {/* Status Types */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Status Types</h2>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">○</span>
                <code className="font-mono text-sm font-semibold">pending</code>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">대기 중</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-500 text-xs animate-spin">⟳</span>
                <code className="font-mono text-sm font-semibold">running</code>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">실행 중</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-500 text-xs">✓</span>
                <code className="font-mono text-sm font-semibold">completed</code>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">완료됨</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-500 text-xs">✕</span>
                <code className="font-mono text-sm font-semibold">error</code>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">오류 발생</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">⏭</span>
                <code className="font-mono text-sm font-semibold">skipped</code>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">건너뜀</p>
            </div>
          </div>
        </section>

        {/* Props - StepIndicator */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">StepIndicator Props</h2>
          <PropsTable props={stepIndicatorProps} />
        </section>

        {/* Props - Step */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Step Object</h2>
          <PropsTable props={stepProps} />
        </section>
      </div>
    </div>
  )
}
