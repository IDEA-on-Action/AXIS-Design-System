'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

type DiffViewMode = 'unified' | 'split'

interface DiffLine {
  type: 'add' | 'remove' | 'context'
  content: string
  oldLineNum?: number
  newLineNum?: number
}

const computeDiff = (before: string, after: string): DiffLine[] => {
  const oldLines = before.split('\n')
  const newLines = after.split('\n')
  const result: DiffLine[] = []

  let oldIdx = 0
  let newIdx = 0

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx < oldLines.length && newIdx < newLines.length && oldLines[oldIdx] === newLines[newIdx]) {
      result.push({ type: 'context', content: oldLines[oldIdx], oldLineNum: oldIdx + 1, newLineNum: newIdx + 1 })
      oldIdx++
      newIdx++
    } else if (oldIdx < oldLines.length && (newIdx >= newLines.length || !newLines.includes(oldLines[oldIdx]))) {
      result.push({ type: 'remove', content: oldLines[oldIdx], oldLineNum: oldIdx + 1 })
      oldIdx++
    } else if (newIdx < newLines.length) {
      result.push({ type: 'add', content: newLines[newIdx], newLineNum: newIdx + 1 })
      newIdx++
    }
  }

  return result
}

const DiffViewer = ({
  before,
  after,
  filename,
  viewMode = 'unified',
}: {
  before: string
  after: string
  filename?: string
  viewMode?: DiffViewMode
}) => {
  const diff = computeDiff(before, after)
  const addCount = diff.filter(d => d.type === 'add').length
  const removeCount = diff.filter(d => d.type === 'remove').length

  const lineColors: Record<string, string> = {
    add: 'bg-green-50 text-green-900',
    remove: 'bg-red-50 text-red-900',
    context: '',
  }

  const lineIndicators: Record<string, string> = {
    add: '+',
    remove: '-',
    context: ' ',
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      {filename && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b text-xs">
          <code className="text-muted-foreground">{filename}</code>
          <div className="flex items-center gap-2">
            <span className="text-green-600">+{addCount}</span>
            <span className="text-red-600">-{removeCount}</span>
          </div>
        </div>
      )}
      {viewMode === 'unified' ? (
        <div className="overflow-auto">
          <table className="w-full text-sm font-mono">
            <tbody>
              {diff.map((line, i) => (
                <tr key={i} className={lineColors[line.type]}>
                  <td className="select-none text-right text-xs text-muted-foreground px-2 w-10 border-r">
                    {line.oldLineNum ?? ''}
                  </td>
                  <td className="select-none text-right text-xs text-muted-foreground px-2 w-10 border-r">
                    {line.newLineNum ?? ''}
                  </td>
                  <td className="select-none text-center w-6 text-xs">
                    <span className={line.type === 'add' ? 'text-green-600' : line.type === 'remove' ? 'text-red-600' : 'text-muted-foreground'}>
                      {lineIndicators[line.type]}
                    </span>
                  </td>
                  <td className="px-2 py-0.5 whitespace-pre">{line.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-auto grid grid-cols-2">
          <div className="border-r">
            <div className="px-2 py-1 bg-red-50 text-xs text-red-600 border-b font-medium">Before</div>
            <table className="w-full text-sm font-mono">
              <tbody>
                {diff.filter(d => d.type !== 'add').map((line, i) => (
                  <tr key={i} className={line.type === 'remove' ? 'bg-red-50' : ''}>
                    <td className="select-none text-right text-xs text-muted-foreground px-2 w-10 border-r">
                      {line.oldLineNum ?? ''}
                    </td>
                    <td className="px-2 py-0.5 whitespace-pre text-sm">{line.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div className="px-2 py-1 bg-green-50 text-xs text-green-600 border-b font-medium">After</div>
            <table className="w-full text-sm font-mono">
              <tbody>
                {diff.filter(d => d.type !== 'remove').map((line, i) => (
                  <tr key={i} className={line.type === 'add' ? 'bg-green-50' : ''}>
                    <td className="select-none text-right text-xs text-muted-foreground px-2 w-10 border-r">
                      {line.newLineNum ?? ''}
                    </td>
                    <td className="px-2 py-0.5 whitespace-pre text-sm">{line.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

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
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>DiffViewer</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">DiffViewer</h1>
          <p className="text-lg text-muted-foreground">
            코드 변경 사항을 시각적으로 비교하는 컴포넌트입니다. Unified/Split 뷰 모드를 지원합니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add diff-viewer --agentic" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Interactive Demo</h2>
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
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">View Modes</h2>
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
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={diffViewerProps} />
        </section>
      </div>
    </div>
  )
}
