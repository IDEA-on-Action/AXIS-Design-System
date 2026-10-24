'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { ApprovalCard, type ApprovalCardProps } from '@axis-ds/agentic-ui'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

// 경로는 /agentic/approval-dialog 를 유지한다(cli 별칭 approval-card -> approval-dialog, WI-0057 D3).
// 문서 내용은 패키지에 실제로 있는 ApprovalCard 를 설명한다(WI-0058).
type Severity = NonNullable<ApprovalCardProps['severity']>

const SEVERITIES: ReadonlyArray<Severity> = ['info', 'warning', 'error']

const approvalCardProps = [
  { name: 'title', type: 'string', required: true, description: '카드 제목' },
  { name: 'description', type: 'string', default: '-', description: '설명 텍스트' },
  {
    name: 'severity',
    type: '"info" | "warning" | "error"',
    default: '"info"',
    description: '심각도 (왼쪽 테두리 · 아이콘 색과 화면 낭독기용 문구를 정함)',
  },
  {
    name: 'actions',
    type: 'ApprovalAction[]',
    required: true,
    description: '카드 아래에 표시할 액션 버튼 목록',
  },
  { name: 'children', type: 'React.ReactNode', default: '-', description: '설명 아래 추가 내용' },
  { name: 'id', type: 'string', default: '자동 생성', description: '제목 · 설명 연결용 기준 ID' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const approvalActionProps = [
  { name: 'label', type: 'string', required: true, description: '버튼 문구' },
  {
    name: 'variant',
    type: '"default" | "secondary" | "ghost" | "destructive"',
    default: '"default"',
    description: '버튼 모양',
  },
  { name: 'onClick', type: '() => void', required: true, description: '클릭 콜백' },
]

const basicExample = `import { ApprovalCard } from '@axis-ds/agentic-ui'

export function Example() {
  return (
    <ApprovalCard
      title="코드 변경 승인 요청"
      description="AI가 다음 변경 사항을 적용하려고 합니다."
      severity="warning"
      actions={[
        { label: '거부', variant: 'secondary', onClick: () => console.log('Rejected') },
        { label: '승인', onClick: () => console.log('Approved') },
      ]}
    >
      <ul className="text-sm list-disc pl-5">
        <li>NewFeature.tsx 추가</li>
        <li>index.ts export 수정</li>
      </ul>
    </ApprovalCard>
  )
}`

const changes = ['NewFeature.tsx 추가', 'index.ts 에 NewFeature export 추가', 'deprecated.ts 삭제']

export default function ApprovalCardPage() {
  const [severity, setSeverity] = useState<Severity>('warning')
  const [decision, setDecision] = useState<string | null>(null)

  return (
    <DocPageLayout
      category="Agentic UI"
      categoryHref="/agentic"
      title="ApprovalCard"
      description="AI 에이전트의 작업을 사용자가 승인/거부할 수 있는 카드 컴포넌트입니다. Human-in-the-Loop 패턴 구현에 사용됩니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx @axis-ds/cli add approval-card" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Interactive Demo">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">심각도:</span>
            {SEVERITIES.map(level => (
              <Button
                key={level}
                size="sm"
                variant={severity === level ? 'default' : 'outline'}
                onClick={() => setSeverity(level)}
              >
                {level}
              </Button>
            ))}
          </div>
          <ApprovalCard
            id="approval-demo"
            title="코드 변경 승인 요청"
            description="AI가 다음 변경 사항을 적용하려고 합니다. 검토 후 승인 또는 거부해주세요."
            severity={severity}
            actions={[
              { label: '거부', variant: 'secondary', onClick: () => setDecision('거부했습니다.') },
              { label: '승인', onClick: () => setDecision('승인했습니다.') },
            ]}
          >
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {changes.map(change => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </ApprovalCard>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {decision ?? '아직 결정하지 않았습니다.'}
          </p>
        </div>
      </DocSection>

      <DocSection title="Severity">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          {SEVERITIES.map(level => (
            <ApprovalCard
              key={level}
              id={`approval-severity-${level}`}
              title={`${level} 심각도`}
              description="심각도에 따라 왼쪽 테두리와 아이콘 색이 바뀝니다."
              severity={level}
              actions={[{ label: '확인', variant: 'secondary', onClick: () => {} }]}
            />
          ))}
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={approvalCardProps} />
      </DocSection>

      <DocSection title="ApprovalAction Type">
        <PropsTable props={approvalActionProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {
            '카드는 role="region"으로 그룹화되고 aria-labelledby / aria-describedby로 제목·설명이 연결됩니다.'
          }
        </p>
        <KeyboardTable
          keys={[
            { key: 'Tab', description: '액션 버튼 사이를 이동합니다.' },
            { key: 'Enter / Space', description: '포커스된 액션을 실행합니다.' },
          ]}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>
            {'심각도는 색상만이 아니라 화면 낭독기용 문구("주의 알림:" 등)로도 전달됩니다.'}
          </li>
          <li key={1}>{'아이콘은 aria-hidden으로 처리됩니다.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
