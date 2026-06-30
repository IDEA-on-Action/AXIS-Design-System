'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

type ToolStatus = 'pending' | 'running' | 'success' | 'error'

// Mock ToolCallCard 컴포넌트
const ToolCallCard = ({
  toolName,
  status,
  input,
  output,
  error,
  duration,
}: {
  toolName: string
  status: ToolStatus
  input?: Record<string, unknown>
  output?: unknown
  error?: string
  duration?: number
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusColors: Record<ToolStatus, string> = {
    pending: 'text-gray-400',
    running: 'text-blue-500',
    success: 'text-green-500',
    error: 'text-red-500',
  }

  const statusIcons: Record<ToolStatus, string> = {
    pending: '○',
    running: '⟳',
    success: '✓',
    error: '✕',
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`${statusColors[status]} ${status === 'running' ? 'animate-spin' : ''}`}>
            {statusIcons[status]}
          </span>
          <code className="text-sm font-mono">{toolName}</code>
        </div>
        <div className="flex items-center gap-2">
          {duration !== undefined && (
            <span className="text-xs text-muted-foreground">{duration}ms</span>
          )}
          <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>
      {isExpanded && (
        <div className="border-t p-3 space-y-3">
          {input && (
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-1">입력</h5>
              <pre className="text-xs p-2 rounded bg-muted overflow-x-auto">
                <code>{JSON.stringify(input, null, 2)}</code>
              </pre>
            </div>
          )}
          {output !== undefined && (
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-1">출력</h5>
              <pre className="text-xs p-2 rounded bg-muted overflow-x-auto">
                <code>{typeof output === 'string' ? output : JSON.stringify(output, null, 2)}</code>
              </pre>
            </div>
          )}
          {error && (
            <div>
              <h5 className="text-xs font-medium text-red-500 mb-1">에러</h5>
              <pre className="text-xs p-2 rounded bg-red-50 text-red-600 overflow-x-auto">
                <code>{error}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const toolCallProps = [
  { name: 'toolName', type: 'string', required: true, description: '도구 이름' },
  {
    name: 'status',
    type: '"pending" | "running" | "success" | "error"',
    required: true,
    description: '실행 상태',
  },
  {
    name: 'input',
    type: 'Record<string, unknown>',
    default: '-',
    description: '도구 입력 파라미터',
  },
  { name: 'output', type: 'unknown', default: '-', description: '실행 결과' },
  { name: 'error', type: 'string', default: '-', description: '에러 메시지' },
  { name: 'duration', type: 'number', default: '-', description: '실행 시간 (ms)' },
  { name: 'defaultExpanded', type: 'boolean', default: 'false', description: '기본 접힘 상태' },
]

const basicExample = `import { ToolCallCard } from '@axis-ds/agentic-ui'

export function Example() {
  return (
    <ToolCallCard
      toolName="search_documents"
      status="success"
      input={{ query: "AI 기술 동향", limit: 10 }}
      output={{ results: 5, documents: [...] }}
      duration={1234}
    />
  )
}`

const statusExample = `// Pending
<ToolCallCard toolName="fetch_data" status="pending" />

// Running
<ToolCallCard toolName="analyze" status="running" input={{ data: "..." }} />

// Success
<ToolCallCard
  toolName="search"
  status="success"
  output={{ count: 10 }}
  duration={500}
/>

// Error
<ToolCallCard
  toolName="api_call"
  status="error"
  error="Connection timeout"
/>`

export default function ToolCallCardPage() {
  const [status, setStatus] = useState<ToolStatus>('pending')

  const runDemo = () => {
    setStatus('running')
    setTimeout(() => setStatus('success'), 2000)
  }

  return (
    <DocPageLayout
      category="Agentic UI"
      categoryHref="/agentic"
      title="ToolCallCard"
      description="AI 에이전트의 도구 호출 상태를 표시하는 컴포넌트입니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add tool-call-card" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Interactive Demo">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <Button onClick={runDemo} disabled={status === 'running'}>
            {status === 'running' ? '실행 중...' : '도구 실행 시뮬레이션'}
          </Button>
          <ToolCallCard
            toolName="search_documents"
            status={status}
            input={{ query: 'AI 기술 동향', limit: 10 }}
            output={status === 'success' ? { results: 5 } : undefined}
            duration={status === 'success' ? 1847 : undefined}
          />
        </div>
      </DocSection>

      <DocSection title="Status States">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Pending</p>
            <ToolCallCard toolName="fetch_data" status="pending" />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Running</p>
            <ToolCallCard toolName="analyze_data" status="running" input={{ data: 'sample' }} />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Success</p>
            <ToolCallCard
              toolName="search_api"
              status="success"
              input={{ query: 'test' }}
              output={{ count: 10 }}
              duration={523}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Error</p>
            <ToolCallCard
              toolName="external_api"
              status="error"
              error="Connection timeout after 30s"
            />
          </div>
        </div>
        <CodeBlock code={statusExample} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={toolCallProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {
            '확장 가능한 카드가 aria-expanded / aria-controls로 펼침 상태·대상을 전달하고, 액션에 aria-label이 제공됩니다.'
          }
        </p>
        <KeyboardTable
          keys={[{ key: 'Enter / Space', description: '카드 상세를 펼치거나 접습니다.' }]}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>{'호출 상태(대기/실행/완료)가 텍스트로도 전달됩니다.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
