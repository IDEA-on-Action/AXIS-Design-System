'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { CodeBlock as DocCodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const AgenticCodeBlock = ({
  code,
  language,
  filename,
  showLineNumbers = false,
  onCopy,
  maxHeight,
}: {
  code: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
  onCopy?: (code: string) => void
  maxHeight?: string
}) => {
  const [copied, setCopied] = useState(false)
  const lines = code.split('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    onCopy?.(code)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border overflow-hidden bg-[#1e1e1e] text-gray-100">
      {(filename || language) && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-[#404040]">
          <div className="flex items-center gap-2">
            {filename && <span className="text-xs text-gray-400">{filename}</span>}
            {language && !filename && <span className="text-xs text-gray-500">{language}</span>}
          </div>
          <button
            onClick={handleCopy}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-0.5 rounded hover:bg-white/10"
          >
            {copied ? '✓ 복사됨' : '복사'}
          </button>
        </div>
      )}
      <div className={`overflow-auto ${maxHeight ? '' : ''}`} style={maxHeight ? { maxHeight } : undefined}>
        <pre className="p-3 text-sm font-mono leading-relaxed">
          <code>
            {lines.map((line, i) => (
              <div key={i} className="flex">
                {showLineNumbers && (
                  <span className="select-none text-gray-600 text-right w-8 mr-3 flex-shrink-0">
                    {i + 1}
                  </span>
                )}
                <span className="flex-1">{line || '\n'}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}

const codeBlockProps = [
  { name: 'code', type: 'string', required: true, description: '표시할 코드 문자열' },
  { name: 'language', type: 'string', default: '-', description: '언어 힌트 (표시용)' },
  { name: 'filename', type: 'string', default: '-', description: '파일 이름' },
  { name: 'showLineNumbers', type: 'boolean', default: 'false', description: '라인 번호 표시 여부' },
  { name: 'onCopy', type: '(code: string) => void', default: '-', description: '복사 콜백' },
  { name: 'maxHeight', type: 'string', default: '-', description: '최대 높이 (CSS 값)' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { CodeBlock } from '@axis-ds/agentic-ui'

export function Example() {
  return (
    <CodeBlock
      code={\`function hello() {
  console.log('Hello, World!')
}\`}
      language="typescript"
      filename="hello.ts"
      showLineNumbers
    />
  )
}`

const sampleCode = `import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
}

export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => {
        setUser(data)
        setLoading(false)
      })
  }, [userId])

  return { user, loading }
}`

export default function CodeBlockPage() {
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [copyCount, setCopyCount] = useState(0)

  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>CodeBlock</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">CodeBlock</h1>
          <p className="text-lg text-muted-foreground">
            AI가 생성한 코드를 표시하는 블록 컴포넌트입니다. 복사 버튼, 라인 번호, 파일명 표시를 지원합니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <DocCodeBlock code="npx axis-cli add code-block --agentic" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Interactive Demo</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLineNumbers(!showLineNumbers)}
              >
                라인 번호 {showLineNumbers ? 'OFF' : 'ON'}
              </Button>
              {copyCount > 0 && (
                <span className="text-sm text-muted-foreground">복사 횟수: {copyCount}</span>
              )}
            </div>
            <AgenticCodeBlock
              code={sampleCode}
              language="typescript"
              filename="use-user.ts"
              showLineNumbers={showLineNumbers}
              onCopy={() => setCopyCount(c => c + 1)}
            />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Variants</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-6">
            <div>
              <p className="text-sm font-medium mb-2">파일명 + 라인 번호</p>
              <AgenticCodeBlock
                code={`const greeting = "Hello!"\nconsole.log(greeting)`}
                filename="example.js"
                showLineNumbers
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">언어만 표시</p>
              <AgenticCodeBlock
                code={`SELECT * FROM users\nWHERE active = true\nORDER BY created_at DESC`}
                language="sql"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">최대 높이 제한</p>
              <AgenticCodeBlock
                code={sampleCode}
                filename="scrollable.ts"
                showLineNumbers
                maxHeight="120px"
              />
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <DocCodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={codeBlockProps} />
        </section>
      </div>
    </div>
  )
}
