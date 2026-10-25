'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { StepTimeline } from '@axis-ds/agentic-ui'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'
import { useClientNow } from '@/lib/use-client-now'

const stepTimelineProps = [
  {
    name: 'steps',
    type: 'TimelineStep[]',
    required: true,
    description: '타임라인에 표시할 단계 배열',
  },
  {
    name: 'orientation',
    type: '"vertical" | "horizontal"',
    default: '"vertical"',
    description: '타임라인 방향',
  },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
  { name: 'locale', type: 'string', default: '-', description: '시각 표시 로케일(없으면 실행 환경 기본값)' },
  {
    name: 'timeZone',
    type: 'string',
    default: '-',
    description:
      '시각 표시 시간대(예: "Asia/Seoul"). locale 과 함께 주면 서버가 그 시간대로 만든 시각이 서버 렌더 HTML 에 그대로 들어가고 보는 사람의 시간대로 바뀌지 않아요. 아니면 서버 컴포넌트에서도 HTML 의 시각이 비고, JS 가 돈 뒤 브라우저 시간대로 채워요',
  },
  {
    name: 'formatTime',
    type: '(date: Date) => string',
    default: '-',
    description: '시각 문자열을 직접 만드는 함수. 서버와 브라우저에서 같은 값을 돌려줘야 해요(서버 컴포넌트에서는 못 넘김)',
  },
]

const timelineStepProps = [
  { name: 'id', type: 'string', required: true, description: '단계 고유 식별자' },
  { name: 'label', type: 'string', required: true, description: '단계 이름' },
  {
    name: 'status',
    type: '"pending" | "running" | "complete" | "error" | "skipped"',
    required: true,
    description: '단계 상태',
  },
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
  // 시각은 마운트 뒤에만 그린다(정적 빌드 시각과 브라우저 시각이 달라 생기는 하이드레이션 불일치 방지)
  const now = useClientNow()

  const steps = [
    {
      id: '1',
      label: '요청 수신',
      status: 'complete' as const,
      timestamp: now === null ? undefined : new Date(now - 60000),
      description: '사용자 요청을 수신했습니다',
    },
    {
      id: '2',
      label: '데이터 처리',
      status: 'complete' as const,
      timestamp: now === null ? undefined : new Date(now - 30000),
    },
    {
      id: '3',
      label: '분석 중',
      status: 'running' as const,
      description: 'AI가 데이터를 분석하고 있습니다',
    },
    { id: '4', label: '결과 생성', status: 'pending' as const },
  ]

  return (
    <DocPageLayout
      category="Agentic UI"
      categoryHref="/agentic"
      title="StepTimeline"
      description="단계별 진행 상황을 타임라인 형태로 시각화하는 컴포넌트입니다. 수직/수평 방향을 지원합니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx @axis-ds/cli add step-timeline --agentic" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Interactive Demo">
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
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={stepTimelineProps} />
      </DocSection>

      <DocSection title="TimelineStep Type">
        <PropsTable props={timelineStepProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {
            '타임라인은 role="list" / "listitem"으로 마크업되고, 현재 단계는 aria-current로 표시됩니다.'
          }
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>{'단계 상태가 aria-label / 텍스트로 전달됩니다.'}</li>
          <li key={1}>
            {'시각은 <time dateTime> 으로 표시하고, locale · timeZone 을 함께 주지 않으면 하이드레이션 뒤에 채워요(하이드레이션 오류 방지).'}
          </li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
