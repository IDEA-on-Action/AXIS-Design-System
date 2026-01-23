'use client'

import { AgentRunContainer, StreamingText, StepIndicator } from '@ax/ui'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'
import { useState } from 'react'

const agentRunContainerProps = [
  { name: 'runId', type: 'string', default: '-', description: '실행 ID', required: true },
  { name: 'sessionId', type: 'string', default: '-', description: '세션 ID' },
  { name: 'title', type: 'string', default: '-', description: '워크플로 제목', required: true },
  { name: 'description', type: 'string', default: '-', description: '워크플로 설명' },
  { name: 'status', type: 'RunStatus', default: '-', description: '실행 상태 (idle | running | completed | error | paused)', required: true },
  { name: 'onCancel', type: '() => void', default: '-', description: '취소 핸들러 (running 상태에서 표시)' },
  { name: 'onRetry', type: '() => void', default: '-', description: '재시도 핸들러 (error 상태에서 표시)' },
  { name: 'children', type: 'React.ReactNode', default: '-', description: '하위 컴포넌트' },
]

const basicExample = `import { AgentRunContainer } from '@ax/ui'

export function Example() {
  return (
    <AgentRunContainer
      runId="run-001"
      title="데이터 수집 워크플로"
      description="외부 소스에서 세미나 정보를 수집합니다."
      status="running"
      onCancel={() => console.log('취소')}
    >
      {/* 워크플로 내용 */}
    </AgentRunContainer>
  )
}`

const statusExample = `// 대기 중
<AgentRunContainer
  runId="run-001"
  title="워크플로"
  status="idle"
/>

// 실행 중
<AgentRunContainer
  runId="run-002"
  title="워크플로"
  status="running"
  onCancel={() => {}}
/>

// 완료
<AgentRunContainer
  runId="run-003"
  title="워크플로"
  status="completed"
/>

// 오류
<AgentRunContainer
  runId="run-004"
  title="워크플로"
  status="error"
  onRetry={() => {}}
/>

// 일시 중지
<AgentRunContainer
  runId="run-005"
  title="워크플로"
  status="paused"
/>`

const steps = [
  { id: '1', label: '데이터 수집', status: 'completed' as const },
  { id: '2', label: '분석 중', status: 'running' as const },
  { id: '3', label: '결과 저장', status: 'pending' as const },
]

export default function AgentRunContainerPage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error' | 'paused'>('running')

  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>AgentRunContainer</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">AgentRunContainer</h1>
          <p className="text-lg text-muted-foreground">
            에이전트 워크플로 실행을 감싸는 컨테이너 컴포넌트입니다.
            실행 상태를 시각화하고 취소/재시도 액션을 제공합니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add agent-run-container" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border bg-muted/30">
            <AgentRunContainer
              runId="demo-run-001"
              title="세미나 수집 워크플로"
              description="외부 소스에서 세미나 정보를 수집합니다."
              status={status}
              onCancel={() => setStatus('paused')}
              onRetry={() => setStatus('running')}
            >
              <div className="space-y-4">
                <StepIndicator steps={steps} currentStepIndex={1} />
                <StreamingText
                  content="현재 OnOffMix에서 데이터를 수집하고 있습니다..."
                  isStreaming={status === 'running'}
                />
              </div>
            </AgentRunContainer>
          </div>
          <div className="mb-4 flex gap-2 flex-wrap">
            <button
              onClick={() => setStatus('idle')}
              className="px-3 py-1 text-sm rounded border hover:bg-muted"
            >
              Idle
            </button>
            <button
              onClick={() => setStatus('running')}
              className="px-3 py-1 text-sm rounded border hover:bg-muted"
            >
              Running
            </button>
            <button
              onClick={() => setStatus('completed')}
              className="px-3 py-1 text-sm rounded border hover:bg-muted"
            >
              Completed
            </button>
            <button
              onClick={() => setStatus('error')}
              className="px-3 py-1 text-sm rounded border hover:bg-muted"
            >
              Error
            </button>
            <button
              onClick={() => setStatus('paused')}
              className="px-3 py-1 text-sm rounded border hover:bg-muted"
            >
              Paused
            </button>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Status Variants</h2>
          <div className="space-y-4 mb-4">
            <AgentRunContainer
              runId="idle-demo"
              title="대기 중 상태"
              status="idle"
            >
              <p className="text-sm text-muted-foreground">워크플로가 시작되지 않았습니다.</p>
            </AgentRunContainer>

            <AgentRunContainer
              runId="running-demo"
              title="실행 중 상태"
              status="running"
              onCancel={() => {}}
            >
              <p className="text-sm text-muted-foreground">워크플로가 실행 중입니다.</p>
            </AgentRunContainer>

            <AgentRunContainer
              runId="completed-demo"
              title="완료 상태"
              status="completed"
            >
              <p className="text-sm text-muted-foreground">워크플로가 성공적으로 완료되었습니다.</p>
            </AgentRunContainer>

            <AgentRunContainer
              runId="error-demo"
              title="오류 상태"
              status="error"
              onRetry={() => {}}
            >
              <p className="text-sm text-muted-foreground">워크플로 실행 중 오류가 발생했습니다.</p>
            </AgentRunContainer>

            <AgentRunContainer
              runId="paused-demo"
              title="일시 중지 상태"
              status="paused"
            >
              <p className="text-sm text-muted-foreground">워크플로가 일시 중지되었습니다.</p>
            </AgentRunContainer>
          </div>
          <CodeBlock code={statusExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={agentRunContainerProps} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">RunStatus Type</h2>
          <CodeBlock code={`type RunStatus = 'idle' | 'running' | 'completed' | 'error' | 'paused'`} />
        </section>
      </div>
    </div>
  )
}
