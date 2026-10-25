'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { MessageBubble, type MessageRole, type MessageStatus } from '@axis-ds/agentic-ui'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'
import { useClientNow } from '@/lib/use-client-now'

const messageBubbleProps = [
  {
    name: 'role',
    type: '"user" | "assistant" | "system"',
    required: true,
    description: '메시지 발신자 역할',
  },
  { name: 'content', type: 'React.ReactNode', required: true, description: '메시지 내용' },
  { name: 'timestamp', type: 'Date', default: '-', description: '메시지 타임스탬프' },
  {
    name: 'avatar',
    type: 'React.ReactNode | string',
    default: '-',
    description: '아바타 (ReactNode 또는 이미지 URL)',
  },
  {
    name: 'status',
    type: '"sending" | "sent" | "error"',
    default: '-',
    description: '메시지 전송 상태',
  },
  { name: 'actions', type: 'React.ReactNode', default: '-', description: '메시지 액션 버튼' },
  { name: 'metadata', type: 'string', default: '-', description: '메타데이터 (모델명 등)' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
  { name: 'locale', type: 'string', default: '"ko-KR"', description: '시각 표시 로케일' },
  {
    name: 'timeZone',
    type: 'string',
    default: '-',
    description:
      '시각 표시 시간대(예: "Asia/Seoul"). 지정하면 서버 렌더부터 시각을 표시하고, 없으면 브라우저 시간대로 하이드레이션 뒤에 표시해요',
  },
  {
    name: 'formatTime',
    type: '(date: Date) => string',
    default: '-',
    description: '시각 문자열을 직접 만드는 함수. 서버와 브라우저에서 같은 값을 돌려줘야 해요(서버 컴포넌트에서는 못 넘김)',
  },
]

const basicExample = `import { MessageBubble } from '@axis-ds/agentic-ui'

export function Example() {
  return (
    <div className="space-y-4">
      <MessageBubble
        role="user"
        content="React 컴포넌트 설계 패턴에 대해 알려주세요."
        timestamp={new Date()}
        status="sent"
      />
      <MessageBubble
        role="assistant"
        content="React 컴포넌트 설계에는 여러 패턴이 있습니다..."
        timestamp={new Date()}
        metadata="GPT-4"
      />
    </div>
  )
}`

interface DemoMessage {
  role: MessageRole
  content: string
  /** 클릭으로 추가한 메시지의 시각(클라이언트에서만 만들어진다) */
  timestamp?: Date
  /** 첫 메시지의 시각은 마운트 뒤 시각에서 이만큼 뺀 값으로 그린다(하이드레이션 불일치 방지) */
  offsetMs?: number
  status?: MessageStatus
  metadata?: string
}

export default function MessageBubblePage() {
  const now = useClientNow()
  const [messages, setMessages] = useState<DemoMessage[]>([
    {
      role: 'user',
      content: '안녕하세요! 오늘 날씨가 어때요?',
      offsetMs: 60000,
      status: 'sent',
    },
    {
      role: 'assistant',
      content: '안녕하세요! 오늘 서울은 맑고 기온은 15°C 정도입니다. 야외 활동하기 좋은 날씨네요.',
      offsetMs: 30000,
      metadata: 'GPT-4o',
    },
  ])

  const addMessage = () => {
    setMessages(prev => [
      ...prev,
      {
        role: 'user' as MessageRole,
        content: '추가 질문입니다!',
        timestamp: new Date(),
        status: 'sending' as MessageStatus,
      },
    ])
    setTimeout(() => {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { ...updated[updated.length - 1], status: 'sent' }
        return [
          ...updated,
          {
            role: 'assistant',
            content: '네, 무엇이든 물어보세요! 도와드리겠습니다.',
            timestamp: new Date(),
            metadata: 'GPT-4o',
          },
        ]
      })
    }, 1500)
  }

  return (
    <DocPageLayout
      category="Agentic UI"
      categoryHref="/agentic"
      title="MessageBubble"
      description="채팅 메시지를 표시하는 버블 컴포넌트입니다. user, assistant, system 세 가지 역할을 지원합니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx @axis-ds/cli add message-bubble --agentic" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Interactive Demo">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <Button onClick={addMessage}>메시지 추가</Button>
          <div className="space-y-4">
            {messages.map(({ offsetMs, timestamp, ...msg }, i) => (
              <MessageBubble
                key={i}
                {...msg}
                timestamp={
                  timestamp ??
                  (now !== null && offsetMs !== undefined ? new Date(now - offsetMs) : undefined)
                }
              />
            ))}
          </div>
        </div>
      </DocSection>

      <DocSection title="Roles">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">User</p>
            <MessageBubble role="user" content="사용자 메시지입니다." status="sent" />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Assistant</p>
            <MessageBubble
              role="assistant"
              content="AI 어시스턴트의 응답입니다."
              metadata="GPT-4"
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">System</p>
            <MessageBubble role="system" content="시스템 알림: 새로운 세션이 시작되었습니다." />
          </div>
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={messageBubbleProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {
            '메시지는 role="article"로 마크업되고, 작성자(role prop: user/assistant/system)가 aria-label로 식별됩니다.'
          }
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>{'작성자가 접근 가능한 이름으로 노출됩니다.'}</li>
          <li key={1}>{'장식 요소는 aria-hidden으로 처리됩니다.'}</li>
          <li key={2}>{'전송 상태 아이콘은 role="img" 와 aria-label(전송 중 · 전송됨 · 전송 실패)로 읽혀요.'}</li>
          <li key={3}>
            {'시각은 timeZone 을 주지 않으면 하이드레이션 뒤에 브라우저 시간대로 채워요(서버와 브라우저 시간대가 달라 생기는 하이드레이션 오류 방지).'}
          </li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
