'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const ContextPanel = ({
  modelInfo,
  systemPrompt,
  attachedFiles,
  settings,
  collapsible = true,
  defaultExpanded = false,
}: {
  modelInfo?: { name: string; provider?: string; version?: string }
  systemPrompt?: string
  attachedFiles?: string[]
  settings?: Record<string, string>
  collapsible?: boolean
  defaultExpanded?: boolean
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const hasContent = modelInfo || systemPrompt || attachedFiles?.length || (settings && Object.keys(settings).length > 0)
  if (!hasContent) return null

  const header = (
    <div
      className={`flex items-center justify-between p-3 ${collapsible ? 'cursor-pointer hover:bg-muted/50' : ''}`}
      onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">📋</span>
        <h4 className="text-sm font-medium">컨텍스트</h4>
        {modelInfo && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {modelInfo.name}
          </span>
        )}
      </div>
      {collapsible && (
        <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
      )}
    </div>
  )

  const content = (
    <div className="border-t p-3 space-y-3">
      {modelInfo && (
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-1">모델 정보</h5>
          <div className="text-sm space-y-0.5">
            <p><span className="text-muted-foreground">이름:</span> {modelInfo.name}</p>
            {modelInfo.provider && <p><span className="text-muted-foreground">제공자:</span> {modelInfo.provider}</p>}
            {modelInfo.version && <p><span className="text-muted-foreground">버전:</span> {modelInfo.version}</p>}
          </div>
        </div>
      )}
      {systemPrompt && (
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-1">시스템 프롬프트</h5>
          <pre className="text-xs p-2 rounded bg-muted overflow-x-auto whitespace-pre-wrap">
            {systemPrompt}
          </pre>
        </div>
      )}
      {attachedFiles && attachedFiles.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-1">
            첨부 파일 ({attachedFiles.length}개)
          </h5>
          <ul className="space-y-1">
            {attachedFiles.map((file, i) => (
              <li key={i} className="text-xs flex items-center gap-1.5">
                <span>📎</span>
                <code className="text-muted-foreground">{file}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
      {settings && Object.keys(settings).length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-1">설정</h5>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="text-xs">
                <span className="text-muted-foreground">{key}:</span>{' '}
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="rounded-lg border overflow-hidden">
      {header}
      {(!collapsible || isExpanded) && content}
    </div>
  )
}

const contextPanelProps = [
  { name: 'modelInfo', type: 'ModelInfo', default: '-', description: '모델 정보 객체' },
  { name: 'systemPrompt', type: 'string', default: '-', description: '시스템 프롬프트' },
  { name: 'attachedFiles', type: 'string[]', default: '-', description: '첨부 파일 경로 배열' },
  { name: 'settings', type: 'Record<string, string>', default: '-', description: '설정 키-값 쌍' },
  { name: 'collapsible', type: 'boolean', default: 'true', description: '접기/펼치기 가능 여부' },
  { name: 'defaultExpanded', type: 'boolean', default: 'false', description: '기본 펼침 상태' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const modelInfoProps = [
  { name: 'name', type: 'string', required: true, description: '모델 이름' },
  { name: 'provider', type: 'string', default: '-', description: '모델 제공자' },
  { name: 'version', type: 'string', default: '-', description: '모델 버전' },
]

const basicExample = `import { ContextPanel } from '@axis-ds/agentic-ui'

export function Example() {
  return (
    <ContextPanel
      modelInfo={{ name: 'GPT-4o', provider: 'OpenAI', version: '2024-05' }}
      systemPrompt="당신은 유능한 AI 어시스턴트입니다."
      attachedFiles={['data.csv', 'report.pdf']}
      settings={{ temperature: '0.7', maxTokens: '4096' }}
    />
  )
}`

export default function ContextPanelPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>ContextPanel</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">ContextPanel</h1>
          <p className="text-lg text-muted-foreground">
            AI 대화의 컨텍스트 정보(모델, 프롬프트, 파일, 설정)를 표시하는 접이식 패널입니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add context-panel --agentic" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Interactive Demo</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              패널 헤더를 클릭하여 접기/펼치기를 시도해 보세요.
            </p>
            <ContextPanel
              modelInfo={{ name: 'Claude 3.5 Sonnet', provider: 'Anthropic', version: '2024-10' }}
              systemPrompt="당신은 소프트웨어 아키텍트입니다. 코드 리뷰와 설계 조언을 제공합니다."
              attachedFiles={['architecture.md', 'diagram.png', 'requirements.pdf']}
              settings={{ temperature: '0.3', maxTokens: '8192', topP: '0.9' }}
              defaultExpanded
            />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Variants</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Collapsible (기본)</p>
              <ContextPanel
                modelInfo={{ name: 'GPT-4o', provider: 'OpenAI' }}
                settings={{ temperature: '0.7' }}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Non-collapsible</p>
              <ContextPanel
                modelInfo={{ name: 'GPT-4o', provider: 'OpenAI' }}
                systemPrompt="간결하게 답변하세요."
                collapsible={false}
              />
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={contextPanelProps} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">ModelInfo Type</h2>
          <PropsTable props={modelInfoProps} />
        </section>
      </div>
    </div>
  )
}
