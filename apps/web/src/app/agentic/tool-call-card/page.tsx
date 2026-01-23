'use client'

import { useState } from 'react'
import { Button } from '@ax/ui'
import { ToolCallCard } from '@ax/ui'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const toolCallProps = [
  { name: 'toolName', type: 'string', required: true, description: '도구 이름' },
  { name: 'status', type: '"pending" | "running" | "completed" | "error"', required: true, description: '실행 상태' },
  { name: 'args', type: 'Record<string, unknown>', default: '-', description: '도구 호출 인자' },
  { name: 'result', type: 'unknown', default: '-', description: '실행 결과' },
  { name: 'error', type: 'string', default: '-', description: '에러 메시지' },
  { name: 'duration', type: 'number', default: '-', description: '실행 시간 (ms)' },
  { name: 'defaultExpanded', type: 'boolean', default: 'false', description: '기본 접힘 상태' },
]

const basicExample = `import { ToolCallCard } from '@ax/ui'

export function Example() {
  return (
    <ToolCallCard
      toolName="search_documents"
      status="completed"
      args={{ query: "AI 기술 동향", limit: 10 }}
      result={{ results: 5, documents: [...] }}
      duration={1234}
    />
  )
}`

const statusExample = `// Pending
<ToolCallCard toolName="fetch_data" status="pending" />

// Running
<ToolCallCard toolName="analyze" status="running" args={{ data: "..." }} />

// Completed
<ToolCallCard
  toolName="search"
  status="completed"
  result={{ count: 10 }}
  duration={500}
/>

// Error
<ToolCallCard
  toolName="api_call"
  status="error"
  error="Connection timeout"
/>`

type ToolCallStatus = 'pending' | 'running' | 'completed' | 'error'

export default function ToolCallCardPage() {
  const [status, setStatus] = useState<ToolCallStatus>('pending')

  const runDemo = () => {
    setStatus('running')
    setTimeout(() => setStatus('completed'), 2000)
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>ToolCallCard</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">ToolCallCard</h1>
          <p className="text-lg text-muted-foreground">
            AI 에이전트의 도구 호출 상태를 표시하는 컴포넌트입니다.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add tool-call-card" language="bash" />
        </section>

        {/* Interactive Demo */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Interactive Demo</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-4">
            <Button onClick={runDemo} disabled={status === 'running'}>
              {status === 'running' ? '실행 중...' : '도구 실행 시뮬레이션'}
            </Button>
            <ToolCallCard
              toolName="search_documents"
              status={status}
              args={{ query: "AI 기술 동향", limit: 10 }}
              result={status === 'completed' ? { results: 5 } : undefined}
              duration={status === 'completed' ? 1847 : undefined}
            />
          </div>
        </section>

        {/* Status States */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Status States</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Pending</p>
              <ToolCallCard toolName="fetch_data" status="pending" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Running</p>
              <ToolCallCard toolName="analyze_data" status="running" args={{ data: "sample" }} />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Completed</p>
              <ToolCallCard
                toolName="search_api"
                status="completed"
                args={{ query: "test" }}
                result={{ count: 10 }}
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
        </section>

        {/* Basic Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={toolCallProps} />
        </section>
      </div>
    </div>
  )
}
