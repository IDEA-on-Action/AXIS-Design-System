'use client'

import { useState } from 'react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

type FeedbackType = 'like' | 'dislike' | 'none'

const FeedbackButtons = ({
  messageId,
  initialFeedback = 'none',
  onFeedback,
  size = 'sm',
}: {
  messageId: string
  initialFeedback?: FeedbackType
  onFeedback?: (messageId: string, feedback: FeedbackType) => void
  size?: 'sm' | 'md'
}) => {
  const [feedback, setFeedback] = useState<FeedbackType>(initialFeedback)

  const handleFeedback = (type: 'like' | 'dislike') => {
    const next = feedback === type ? 'none' : type
    setFeedback(next)
    onFeedback?.(messageId, next)
  }

  const sizeStyles = size === 'md' ? 'h-9 w-9 text-lg' : 'h-7 w-7 text-sm'

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border p-0.5">
      <button
        onClick={() => handleFeedback('like')}
        className={`${sizeStyles} rounded-md flex items-center justify-center transition-colors ${
          feedback === 'like'
            ? 'bg-green-100 text-green-600'
            : 'hover:bg-muted text-muted-foreground'
        }`}
        aria-label="좋아요"
      >
        👍
      </button>
      <button
        onClick={() => handleFeedback('dislike')}
        className={`${sizeStyles} rounded-md flex items-center justify-center transition-colors ${
          feedback === 'dislike'
            ? 'bg-red-100 text-red-600'
            : 'hover:bg-muted text-muted-foreground'
        }`}
        aria-label="싫어요"
      >
        👎
      </button>
    </div>
  )
}

const feedbackProps = [
  { name: 'messageId', type: 'string', required: true, description: '메시지 고유 식별자' },
  {
    name: 'initialFeedback',
    type: '"like" | "dislike" | "none"',
    default: '"none"',
    description: '초기 피드백 상태',
  },
  {
    name: 'onFeedback',
    type: '(messageId: string, feedback: FeedbackType) => void',
    default: '-',
    description: '피드백 변경 콜백',
  },
  { name: 'size', type: '"sm" | "md"', default: '"sm"', description: '버튼 크기' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { FeedbackButtons } from '@axis-ds/agentic-ui'

export function Example() {
  const handleFeedback = (messageId: string, feedback: FeedbackType) => {
    console.log(\`Message \${messageId}: \${feedback}\`)
  }

  return (
    <FeedbackButtons
      messageId="msg-1"
      onFeedback={handleFeedback}
    />
  )
}`

export default function FeedbackButtonsPage() {
  const [lastFeedback, setLastFeedback] = useState<string>('')

  return (
    <DocPageLayout
      category="Agentic UI"
      categoryHref="/agentic"
      title="FeedbackButtons"
      description="AI 응답에 대한 좋아요/싫어요 피드백을 제공하는 버튼 컴포넌트입니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add feedback-buttons --agentic" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Interactive Demo">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <p className="text-sm text-muted-foreground">
            버튼을 클릭하여 피드백을 토글할 수 있습니다.
          </p>
          <div className="flex items-center gap-4">
            <FeedbackButtons
              messageId="demo-1"
              onFeedback={(id, fb) => setLastFeedback(`${id}: ${fb}`)}
            />
            {lastFeedback && (
              <span className="text-sm text-muted-foreground">피드백: {lastFeedback}</span>
            )}
          </div>
        </div>
      </DocSection>

      <DocSection title="Sizes">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Small (기본)</p>
              <FeedbackButtons messageId="size-sm" size="sm" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Medium</p>
              <FeedbackButtons messageId="size-md" size="md" />
            </div>
          </div>
        </div>
      </DocSection>

      <DocSection title="Initial States">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm font-medium mb-2">None</p>
              <FeedbackButtons messageId="init-none" initialFeedback="none" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Liked</p>
              <FeedbackButtons messageId="init-like" initialFeedback="like" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Disliked</p>
              <FeedbackButtons messageId="init-dislike" initialFeedback="dislike" />
            </div>
          </div>
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={feedbackProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {
            '버튼 그룹은 role="group"으로 묶이고, 각 버튼은 aria-label과 aria-pressed(선택 상태)를 가집니다.'
          }
        </p>
        <KeyboardTable
          keys={[
            { key: 'Tab', description: '피드백 버튼 사이를 이동합니다.' },
            { key: 'Enter / Space', description: '피드백을 선택합니다.' },
          ]}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>{'좋아요/싫어요 버튼에 접근 가능한 이름(aria-label)이 제공됩니다.'}</li>
          <li key={1}>{'선택 상태가 aria-pressed로 전달됩니다.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
