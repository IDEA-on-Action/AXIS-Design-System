'use client'

import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

// Mock ThinkingIndicator 컴포넌트
const sizeStyles: Record<string, string> = {
  sm: 'text-xs gap-1',
  md: 'text-sm gap-1.5',
  lg: 'text-base gap-2',
}

const dotSizes: Record<string, string> = {
  sm: 'w-1 h-1',
  md: 'w-1.5 h-1.5',
  lg: 'w-2 h-2',
}

const ThinkingIndicator = ({ text = '생각 중', size = 'md' }: any) => (
  <div className={`flex items-center text-muted-foreground ${sizeStyles[size]}`}>
    <span>{text}</span>
    <div className="flex gap-0.5">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={`rounded-full bg-current animate-bounce ${dotSizes[size]}`}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  </div>
)

const thinkingIndicatorProps = [
  { name: 'text', type: 'string', default: '"생각 중"', description: '표시할 텍스트' },
  { name: 'size', type: '"sm" | "md" | "lg"', default: '"md"', description: '크기' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { ThinkingIndicator } from '@axis-ds/agentic-ui'

export function Example() {
  return (
    <div className="space-y-4">
      <ThinkingIndicator />
      <ThinkingIndicator text="분석 중" size="lg" />
      <ThinkingIndicator text="처리 중" size="sm" />
    </div>
  )
}`

export default function ThinkingIndicatorPage() {
  return (
    <DocPageLayout
      category="Agentic UI"
      categoryHref="/agentic"
      title="ThinkingIndicator"
      description="AI가 생각/처리 중임을 나타내는 인디케이터 컴포넌트입니다. 애니메이션 점으로 진행 상태를 표시합니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add thinking-indicator --agentic" language="bash" />
      </DocSection>

      <DocSection title="Demo">
        <div className="p-6 rounded-lg border space-y-6">
          <div>
            <p className="text-sm font-medium mb-3">기본</p>
            <ThinkingIndicator />
          </div>
          <div>
            <p className="text-sm font-medium mb-3">커스텀 텍스트</p>
            <ThinkingIndicator text="분석 중" />
          </div>
          <div>
            <p className="text-sm font-medium mb-3">다양한 상황</p>
            <div className="space-y-2">
              <ThinkingIndicator text="코드 분석 중" />
              <ThinkingIndicator text="응답 생성 중" />
              <ThinkingIndicator text="데이터 처리 중" />
            </div>
          </div>
        </div>
      </DocSection>

      <DocSection title="Sizes">
        <div className="p-6 rounded-lg border">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="w-12 text-xs text-muted-foreground">sm</span>
              <ThinkingIndicator size="sm" text="작은 크기" />
            </div>
            <div className="flex items-center gap-4">
              <span className="w-12 text-xs text-muted-foreground">md</span>
              <ThinkingIndicator size="md" text="기본 크기" />
            </div>
            <div className="flex items-center gap-4">
              <span className="w-12 text-xs text-muted-foreground">lg</span>
              <ThinkingIndicator size="lg" text="큰 크기" />
            </div>
          </div>
        </div>
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={thinkingIndicatorProps} />
      </DocSection>
    </DocPageLayout>
  )
}
