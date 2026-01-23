'use client'

import { useState, useEffect } from 'react'
import { Button } from '@ax/ui'
import { StreamingText } from '@ax/ui'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const streamingTextProps = [
  { name: 'content', type: 'string', required: true, description: '표시할 텍스트 내용' },
  { name: 'isStreaming', type: 'boolean', required: true, description: '스트리밍 중 여부' },
  { name: 'typingSpeed', type: 'number', default: '0', description: '타이핑 속도 (ms per character)' },
  { name: 'showCursor', type: 'boolean', default: 'true', description: '커서 표시 여부' },
  { name: 'messageId', type: 'string', default: '-', description: '메시지 ID (여러 메시지 구분용)' },
]

const basicExample = `import { StreamingText } from '@ax/ui'

export function Example() {
  const [content, setContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(true)

  // 스트리밍 시뮬레이션
  useEffect(() => {
    const text = 'AI가 응답을 생성하고 있습니다...'
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        setContent(text.slice(0, i + 1))
        i++
      } else {
        setIsStreaming(false)
        clearInterval(interval)
      }
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <StreamingText
      content={content}
      isStreaming={isStreaming}
    />
  )
}`

const listExample = `import { StreamingTextList } from '@ax/ui'

const messages = [
  { id: '1', content: '첫 번째 메시지입니다.', isStreaming: false },
  { id: '2', content: '두 번째 메시지를 생성 중...', isStreaming: true },
]

export function Example() {
  return <StreamingTextList messages={messages} />
}`

export default function StreamingTextPage() {
  const [content, setContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const startDemo = () => {
    setContent('')
    setIsStreaming(true)
    const text = 'AI가 사용자의 질문에 대한 답변을 생성하고 있습니다. 실시간으로 텍스트가 표시되며, 완료되면 커서가 사라집니다.'
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        setContent(text.slice(0, i + 1))
        i++
      } else {
        setIsStreaming(false)
        clearInterval(interval)
      }
    }, 30)
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>StreamingText</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">StreamingText</h1>
          <p className="text-lg text-muted-foreground">
            실시간 텍스트 스트리밍을 표시하는 컴포넌트입니다. AI 응답 표시에 적합합니다.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add streaming-text" language="bash" />
        </section>

        {/* Interactive Demo */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Interactive Demo</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-4">
            <Button onClick={startDemo} disabled={isStreaming}>
              {isStreaming ? '스트리밍 중...' : '데모 시작'}
            </Button>
            {(content || isStreaming) && (
              <StreamingText content={content} isStreaming={isStreaming} />
            )}
          </div>
        </section>

        {/* Basic Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        {/* List */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">StreamingTextList</h2>
          <p className="text-muted-foreground mb-4">
            여러 스트리밍 메시지를 표시하는 컨테이너입니다.
          </p>
          <CodeBlock code={listExample} />
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={streamingTextProps} />
        </section>
      </div>
    </div>
  )
}
