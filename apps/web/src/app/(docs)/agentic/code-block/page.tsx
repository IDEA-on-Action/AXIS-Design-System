'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { CodeBlock as AgenticCodeBlock } from '@axis-ds/agentic-ui'
import { CodeBlock as DocCodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

const codeBlockProps = [
  { name: 'code', type: 'string', required: true, description: '표시할 코드 문자열' },
  { name: 'language', type: 'string', default: '-', description: '언어 힌트 (표시용)' },
  { name: 'filename', type: 'string', default: '-', description: '파일 이름' },
  {
    name: 'showLineNumbers',
    type: 'boolean',
    default: 'false',
    description: '라인 번호 표시 여부',
  },
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
    <DocPageLayout
      category="Agentic UI"
      categoryHref="/agentic"
      title="CodeBlock"
      description="AI가 생성한 코드를 표시하는 블록 컴포넌트입니다. 복사 버튼, 라인 번호, 파일명 표시를 지원합니다."
    >
      <DocSection title="Installation">
        <DocCodeBlock code="npx @axis-ds/cli add code-block --agentic" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <DocCodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Interactive Demo">
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
      </DocSection>

      <DocSection title="Variants">
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
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={codeBlockProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {
            '복사 버튼에 aria-label이 제공되고, 장식 요소는 role="presentation" / aria-hidden 처리됩니다.'
          }
        </p>
        <KeyboardTable
          keys={[
            { key: 'Tab', description: '복사 버튼으로 이동합니다.' },
            { key: 'Enter / Space', description: '코드를 클립보드에 복사합니다.' },
          ]}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>{'코드는 pre/code 구조로 보존되어 스크린리더가 인식합니다.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
