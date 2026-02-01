'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

type PlanStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'executing' | 'completed'
type PlanStepStatus = 'pending' | 'running' | 'complete' | 'error' | 'skipped'

interface PlanStep {
  id: string
  label: string
  status: PlanStepStatus
  description?: string
}

const PlanCard = ({
  title,
  steps,
  status = 'pending',
  onApprove,
  onReject,
}: {
  title: string
  steps: PlanStep[]
  status?: PlanStatus
  onApprove?: () => void
  onReject?: () => void
}) => {
  const statusColors: Record<PlanStatus, string> = {
    draft: 'text-gray-500 bg-gray-100',
    pending: 'text-yellow-700 bg-yellow-100',
    approved: 'text-green-700 bg-green-100',
    rejected: 'text-red-700 bg-red-100',
    executing: 'text-blue-700 bg-blue-100',
    completed: 'text-green-700 bg-green-100',
  }

  const statusLabels: Record<PlanStatus, string> = {
    draft: '초안',
    pending: '승인 대기',
    approved: '승인됨',
    rejected: '거절됨',
    executing: '실행 중',
    completed: '완료',
  }

  const stepIcons: Record<PlanStepStatus, string> = {
    pending: '○',
    running: '⟳',
    complete: '✓',
    error: '✕',
    skipped: '—',
  }

  const stepColors: Record<PlanStepStatus, string> = {
    pending: 'text-gray-400',
    running: 'text-blue-500',
    complete: 'text-green-500',
    error: 'text-red-500',
    skipped: 'text-gray-300',
  }

  const completedCount = steps.filter(s => s.status === 'complete').length

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium">{title}</h4>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {completedCount}/{steps.length} 단계 완료
        </p>
      </div>
      <div className="p-4 space-y-2">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-start gap-2">
            <span className={`mt-0.5 text-sm ${stepColors[step.status]} ${step.status === 'running' ? 'animate-spin' : ''}`}>
              {stepIcons[step.status]}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${step.status === 'skipped' ? 'line-through text-muted-foreground' : ''}`}>
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {(status === 'pending' || status === 'draft') && (onApprove || onReject) && (
        <div className="border-t p-3 flex items-center gap-2 justify-end">
          {onReject && (
            <button
              onClick={onReject}
              className="text-sm px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
            >
              거절
            </button>
          )}
          {onApprove && (
            <button
              onClick={onApprove}
              className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              승인
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const planCardProps = [
  { name: 'title', type: 'string', required: true, description: '계획 제목' },
  { name: 'steps', type: 'PlanStep[]', required: true, description: '단계 목록' },
  { name: 'status', type: '"draft" | "pending" | "approved" | "rejected" | "executing" | "completed"', default: '"pending"', description: '계획 상태' },
  { name: 'onApprove', type: '() => void', default: '-', description: '승인 콜백' },
  { name: 'onEdit', type: '() => void', default: '-', description: '편집 콜백' },
  { name: 'onReject', type: '() => void', default: '-', description: '거절 콜백' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const planStepProps = [
  { name: 'id', type: 'string', required: true, description: '단계 고유 식별자' },
  { name: 'label', type: 'string', required: true, description: '단계 이름' },
  { name: 'status', type: '"pending" | "running" | "complete" | "error" | "skipped"', required: true, description: '단계 상태' },
  { name: 'description', type: 'string', default: '-', description: '단계 설명' },
]

const basicExample = `import { PlanCard } from '@axis-ds/agentic-ui'

export function Example() {
  const steps = [
    { id: '1', label: '데이터 수집', status: 'complete' },
    { id: '2', label: '분석 수행', status: 'running' },
    { id: '3', label: '보고서 생성', status: 'pending' },
  ]

  return (
    <PlanCard
      title="데이터 분석 계획"
      steps={steps}
      status="executing"
      onApprove={() => console.log('승인')}
      onReject={() => console.log('거절')}
    />
  )
}`

export default function PlanCardPage() {
  const [demoSteps, setDemoSteps] = useState<PlanStep[]>([
    { id: '1', label: '환경 설정', status: 'pending', description: '개발 환경 구성' },
    { id: '2', label: '데이터베이스 마이그레이션', status: 'pending', description: 'Schema 업데이트 실행' },
    { id: '3', label: 'API 엔드포인트 구현', status: 'pending', description: 'REST API 추가' },
    { id: '4', label: '테스트 실행', status: 'pending', description: '유닛/통합 테스트' },
    { id: '5', label: '배포', status: 'pending', description: '프로덕션 배포' },
  ])
  const [demoStatus, setDemoStatus] = useState<PlanStatus>('pending')

  const simulateExecution = () => {
    setDemoStatus('executing')
    demoSteps.forEach((_, i) => {
      setTimeout(() => {
        setDemoSteps(prev => prev.map((step, j) => {
          if (j === i) return { ...step, status: 'running' as PlanStepStatus }
          if (j < i) return { ...step, status: 'complete' as PlanStepStatus }
          return step
        }))
      }, i * 1200)
    })
    setTimeout(() => {
      setDemoSteps(prev => prev.map(step => ({ ...step, status: 'complete' as PlanStepStatus })))
      setDemoStatus('completed')
    }, demoSteps.length * 1200)
  }

  const resetDemo = () => {
    setDemoSteps(prev => prev.map(step => ({ ...step, status: 'pending' as PlanStepStatus })))
    setDemoStatus('pending')
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>PlanCard</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">PlanCard</h1>
          <p className="text-lg text-muted-foreground">
            AI 에이전트의 실행 계획을 단계별로 표시하고 승인/거절할 수 있는 컴포넌트입니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add plan-card --agentic" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Interactive Demo</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-4">
            <div className="flex items-center gap-2">
              <Button onClick={simulateExecution} disabled={demoStatus === 'executing'}>
                실행 시뮬레이션
              </Button>
              <Button variant="outline" onClick={resetDemo}>
                초기화
              </Button>
            </div>
            <PlanCard
              title="배포 파이프라인"
              steps={demoSteps}
              status={demoStatus}
              onApprove={simulateExecution}
              onReject={resetDemo}
            />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Status States</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-6">
            <PlanCard
              title="승인 대기 계획"
              steps={[
                { id: '1', label: '1단계', status: 'pending' },
                { id: '2', label: '2단계', status: 'pending' },
              ]}
              status="pending"
              onApprove={() => {}}
              onReject={() => {}}
            />
            <PlanCard
              title="실행 중 계획"
              steps={[
                { id: '1', label: '데이터 로드', status: 'complete' },
                { id: '2', label: '처리 중', status: 'running' },
                { id: '3', label: '결과 저장', status: 'pending' },
              ]}
              status="executing"
            />
            <PlanCard
              title="완료된 계획"
              steps={[
                { id: '1', label: '분석', status: 'complete' },
                { id: '2', label: '검토', status: 'complete' },
                { id: '3', label: '배포', status: 'complete' },
              ]}
              status="completed"
            />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={planCardProps} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">PlanStep Type</h2>
          <PropsTable props={planStepProps} />
        </section>
      </div>
    </div>
  )
}
