'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { DiffViewer, type DiffViewMode } from '@axis-ds/agentic-ui'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

const diffViewerProps = [
  { name: 'before', type: 'string', required: true, description: '변경 전 코드' },
  { name: 'after', type: 'string', required: true, description: '변경 후 코드' },
  { name: 'filename', type: 'string', default: '-', description: '파일 이름' },
  { name: 'viewMode', type: '"unified" | "split"', default: '"unified"', description: '뷰 모드' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { DiffViewer } from '@axis-ds/agentic-ui'

const before = \`function greet(name) {
  console.log("Hello, " + name)
}\`

const after = \`function greet(name: string) {
  console.log(\\\`Hello, \\\${name}!\\\`)
  return name
}\`

export function Example() {
  return (
    <DiffViewer
      before={before}
      after={after}
      filename="greet.ts"
      viewMode="unified"
    />
  )
}`

const sampleBefore = `import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}`

const sampleAfter = `import { useState, useCallback } from 'react'

interface CounterProps {
  initialValue?: number
}

function Counter({ initialValue = 0 }: CounterProps) {
  const [count, setCount] = useState(initialValue)

  const increment = useCallback(() => {
    setCount(prev => prev + 1)
  }, [])

  return (
    <div className="counter">
      <p>Count: {count}</p>
      <button onClick={increment}>
        Increment
      </button>
    </div>
  )
}`

export default function DiffViewerPage() {
  const [viewMode, setViewMode] = useState<DiffViewMode>('unified')

  return (
    <DocPageLayout
      category="Agentic UI"
      categoryHref="/agentic"
      title="DiffViewer"
      description="코드 변경 사항을 시각적으로 비교하는 컴포넌트입니다. Unified/Split 뷰 모드를 지원합니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx @axis-ds/cli add diff-viewer --agentic" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Interactive Demo">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'unified' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('unified')}
            >
              Unified
            </Button>
            <Button
              variant={viewMode === 'split' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('split')}
            >
              Split
            </Button>
          </div>
          <DiffViewer
            before={sampleBefore}
            after={sampleAfter}
            filename="counter.tsx"
            viewMode={viewMode}
          />
        </div>
      </DocSection>

      <DocSection title="View Modes">
        <div className="mb-4 p-6 rounded-lg border space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">Unified</p>
            <DiffViewer
              before={`const a = 1\nconst b = 2`}
              after={`const a = 1\nconst b = 3\nconst c = 4`}
              filename="example.ts"
              viewMode="unified"
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Split</p>
            <DiffViewer
              before={`const a = 1\nconst b = 2`}
              after={`const a = 1\nconst b = 3\nconst c = 4`}
              filename="example.ts"
              viewMode="split"
            />
          </div>
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={diffViewerProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {
            'diff 영역은 role="region"으로 그룹화되고, 뷰 모드 토글은 aria-pressed로 상태를 전달합니다.'
          }
        </p>
        <KeyboardTable
          keys={[
            { key: 'Tab', description: '뷰 모드 토글로 이동합니다.' },
            { key: 'Enter / Space', description: '뷰 모드를 전환합니다.' },
          ]}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>{'추가/삭제는 색상만이 아니라 마크업으로 구분됩니다.'}</li>
          <li key={1}>{'장식 요소는 role="presentation"으로 처리됩니다.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
