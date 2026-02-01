'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

// Mock RunProgress 컴포넌트
const statusColors: Record<string, string> = {
  pending: "bg-gray-300",
  running: "bg-blue-500 animate-pulse",
  complete: "bg-green-500",
  error: "bg-red-500",
}

const RunProgress = ({ status, steps, currentStep, onCancel, onRetry }: any) => {
  const progressPercent = Math.round(
    (steps.filter((s: any) => s.status === "complete").length / steps.length) * 100
  )

  return (
    <div className="rounded-lg border p-4 bg-background">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {status === "running" && (
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          )}
          <span className="text-sm font-medium">
            {status === "idle" && "대기 중"}
            {status === "running" && "실행 중"}
            {status === "complete" && "완료"}
            {status === "error" && "오류 발생"}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{progressPercent}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-muted mb-4">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="space-y-2">
        {steps.map((step: any, index: number) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-2 rounded-md ${
              currentStep === index ? "bg-muted" : ""
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${statusColors[step.status]}`}>
              {step.status === "complete" ? "✓" : index + 1}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{step.label}</p>
              {step.description && (
                <p className="text-xs text-muted-foreground">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {(onCancel || onRetry) && (
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          {status === "running" && onCancel && (
            <Button variant="secondary" size="sm" onClick={onCancel}>취소</Button>
          )}
          {status === "error" && onRetry && (
            <Button size="sm" onClick={onRetry}>재시도</Button>
          )}
        </div>
      )}
    </div>
  )
}

const runProgressProps = [
  { name: 'status', type: '"idle" | "running" | "complete" | "error"', required: true, description: '전체 실행 상태' },
  { name: 'steps', type: 'Step[]', required: true, description: '단계 목록 배열' },
  { name: 'currentStep', type: 'number', default: '-', description: '현재 진행 중인 단계 인덱스' },
  { name: 'onCancel', type: '() => void', default: '-', description: '취소 버튼 클릭 시 콜백' },
  { name: 'onRetry', type: '() => void', default: '-', description: '재시도 버튼 클릭 시 콜백' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const stepTypeProps = [
  { name: 'id', type: 'string', required: true, description: '단계 고유 식별자' },
  { name: 'label', type: 'string', required: true, description: '단계 이름' },
  { name: 'status', type: '"pending" | "running" | "complete" | "error"', required: true, description: '단계 상태' },
  { name: 'description', type: 'string', default: '-', description: '단계 설명' },
]

const basicExample = `import { RunProgress } from '@axis-ds/agentic-ui'

const steps = [
  { id: '1', label: '데이터 분석', status: 'complete' },
  { id: '2', label: '모델 선택', status: 'running', description: '최적의 모델을 선택하는 중...' },
  { id: '3', label: '결과 생성', status: 'pending' },
]

export function Example() {
  return (
    <RunProgress
      status="running"
      steps={steps}
      currentStep={1}
      onCancel={() => console.log('취소')}
    />
  )
}`

type StepStatus = 'pending' | 'running' | 'complete' | 'error'
interface Step {
  id: string
  label: string
  status: StepStatus
  description: string
}

export default function RunProgressPage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'complete' | 'error'>('idle')
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<Step[]>([
    { id: '1', label: '입력 분석', status: 'pending', description: '사용자 입력을 분석합니다' },
    { id: '2', label: '컨텍스트 검색', status: 'pending', description: '관련 정보를 검색합니다' },
    { id: '3', label: '응답 생성', status: 'pending', description: 'AI 응답을 생성합니다' },
  ])

  const startDemo = () => {
    setStatus('running')
    setCurrentStep(0)
    const newSteps: Step[] = steps.map(s => ({ ...s, status: 'pending' as StepStatus }))
    newSteps[0].status = 'running'
    setSteps(newSteps)

    let step = 0
    const interval = setInterval(() => {
      step++
      if (step < 3) {
        setSteps(prev => {
          const updated = [...prev]
          updated[step - 1].status = 'complete'
          updated[step].status = 'running'
          return updated
        })
        setCurrentStep(step)
      } else {
        setSteps(prev => {
          const updated = [...prev]
          updated[2].status = 'complete'
          return updated
        })
        setStatus('complete')
        clearInterval(interval)
      }
    }, 1500)
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>RunProgress</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">RunProgress</h1>
          <p className="text-lg text-muted-foreground">
            에이전트 실행 진행 상태를 단계별로 표시하는 컴포넌트입니다. 복잡한 AI 작업의 진행 상황을 시각화합니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add run-progress --agentic" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Interactive Demo</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-4">
            <Button onClick={startDemo} disabled={status === 'running'}>
              {status === 'running' ? '실행 중...' : '데모 시작'}
            </Button>
            <RunProgress
              status={status}
              steps={steps}
              currentStep={currentStep}
              onCancel={() => setStatus('idle')}
              onRetry={startDemo}
            />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={runProgressProps} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Step Type</h2>
          <PropsTable props={stepTypeProps} />
        </section>
      </div>
    </div>
  )
}
