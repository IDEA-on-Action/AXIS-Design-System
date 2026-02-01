'use client'

import { useState, useEffect } from 'react'
import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

// Mock StreamingText 컴포넌트
const StreamingText = ({ text, isComplete, showCursor = true }: { text: string; isComplete?: boolean; showCursor?: boolean }) => (
  <div className="relative">
    <span className="text-foreground whitespace-pre-wrap">{text}</span>
    {showCursor && !isComplete && (
      <span className="inline-block w-0.5 h-4 ml-0.5 bg-foreground animate-pulse" />
    )}
  </div>
)

const streamingTextProps = [
  { name: 'text', type: 'string', required: true, description: '표시할 텍스트 내용' },
  { name: 'speed', type: 'number', default: '20', description: '스트리밍 속도 (ms per character)' },
  { name: 'isComplete', type: 'boolean', default: 'false', description: '스트리밍 완료 여부' },
  { name: 'showCursor', type: 'boolean', default: 'true', description: '커서 표시 여부' },
  { name: 'onComplete', type: '() => void', default: '-', description: '완료 콜백' },
]

const basicExample = `import { StreamingText } from '@axis-ds/agentic-ui'

export function Example() {
  const [text, setText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  // 스트리밍 시뮬레이션
  useEffect(() => {
    const fullText = 'AI가 응답을 생성하고 있습니다...'
    let i = 0
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setText(fullText.slice(0, i + 1))
        i++
      } else {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <StreamingText
      text={text}
      isComplete={isComplete}
    />
  )
}`

export default function StreamingTextPage() {
  const [text, setText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  const startDemo = () => {
    setText('')
    setIsComplete(false)
    setIsRunning(true)
    const fullText = 'AI가 사용자의 질문에 대한 답변을 생성하고 있습니다. 실시간으로 텍스트가 표시되며, 완료되면 커서가 사라집니다.'
    let i = 0
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setText(fullText.slice(0, i + 1))
        i++
      } else {
        setIsComplete(true)
        setIsRunning(false)
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
            <Button onClick={startDemo} disabled={isRunning}>
              {isRunning ? '스트리밍 중...' : '데모 시작'}
            </Button>
            {(text || isRunning) && (
              <StreamingText text={text} isComplete={isComplete} />
            )}
          </div>
        </section>

        {/* Basic Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
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
