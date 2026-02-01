'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

type MessageRole = 'user' | 'assistant' | 'system'
type MessageStatus = 'sending' | 'sent' | 'error'

const MessageBubble = ({
  role,
  content,
  timestamp,
  avatar,
  status,
  metadata,
}: {
  role: MessageRole
  content: React.ReactNode
  timestamp?: Date
  avatar?: React.ReactNode | string
  status?: MessageStatus
  metadata?: string
}) => {
  const isUser = role === 'user'
  const isSystem = role === 'system'

  const bubbleStyles: Record<MessageRole, string> = {
    user: 'bg-primary text-primary-foreground ml-auto',
    assistant: 'bg-muted',
    system: 'bg-yellow-50 border border-yellow-200 text-yellow-900 mx-auto',
  }

  const statusIcons: Record<MessageStatus, string> = {
    sending: '⏳',
    sent: '✓',
    error: '✕',
  }

  const renderAvatar = () => {
    if (!avatar) {
      const defaults: Record<MessageRole, string> = { user: '👤', assistant: '🤖', system: '⚙️' }
      return <span className="text-lg">{defaults[role]}</span>
    }
    if (typeof avatar === 'string') {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={avatar} alt={role} className="w-8 h-8 rounded-full" />
    }
    return avatar
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} ${isSystem ? 'justify-center' : ''}`}>
      {!isSystem && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          {renderAvatar()}
        </div>
      )}
      <div className={`max-w-[75%] rounded-xl px-4 py-2.5 ${bubbleStyles[role]}`}>
        <div className="text-sm whitespace-pre-wrap">{content}</div>
        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-start' : 'justify-end'}`}>
          {metadata && <span className="text-[10px] opacity-60">{metadata}</span>}
          {timestamp && (
            <span className="text-[10px] opacity-60">
              {timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {status && (
            <span className={`text-[10px] ${status === 'error' ? 'text-red-400' : 'opacity-60'}`}>
              {statusIcons[status]}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

const messageBubbleProps = [
  { name: 'role', type: '"user" | "assistant" | "system"', required: true, description: '메시지 발신자 역할' },
  { name: 'content', type: 'React.ReactNode', required: true, description: '메시지 내용' },
  { name: 'timestamp', type: 'Date', default: '-', description: '메시지 타임스탬프' },
  { name: 'avatar', type: 'React.ReactNode | string', default: '-', description: '아바타 (ReactNode 또는 이미지 URL)' },
  { name: 'status', type: '"sending" | "sent" | "error"', default: '-', description: '메시지 전송 상태' },
  { name: 'actions', type: 'React.ReactNode', default: '-', description: '메시지 액션 버튼' },
  { name: 'metadata', type: 'string', default: '-', description: '메타데이터 (모델명 등)' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
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

export default function MessageBubblePage() {
  const [messages, setMessages] = useState<{ role: MessageRole; content: string; timestamp: Date; status?: MessageStatus; metadata?: string }[]>([
    { role: 'user', content: '안녕하세요! 오늘 날씨가 어때요?', timestamp: new Date(Date.now() - 60000), status: 'sent' },
    { role: 'assistant', content: '안녕하세요! 오늘 서울은 맑고 기온은 15°C 정도입니다. 야외 활동하기 좋은 날씨네요.', timestamp: new Date(Date.now() - 30000), metadata: 'GPT-4o' },
  ])

  const addMessage = () => {
    setMessages(prev => [
      ...prev,
      { role: 'user' as MessageRole, content: '추가 질문입니다!', timestamp: new Date(), status: 'sending' as MessageStatus },
    ])
    setTimeout(() => {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { ...updated[updated.length - 1], status: 'sent' }
        return [
          ...updated,
          { role: 'assistant', content: '네, 무엇이든 물어보세요! 도와드리겠습니다.', timestamp: new Date(), metadata: 'GPT-4o' },
        ]
      })
    }, 1500)
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>MessageBubble</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">MessageBubble</h1>
          <p className="text-lg text-muted-foreground">
            채팅 메시지를 표시하는 버블 컴포넌트입니다. user, assistant, system 세 가지 역할을 지원합니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add message-bubble --agentic" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Interactive Demo</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-4">
            <Button onClick={addMessage}>메시지 추가</Button>
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <MessageBubble key={i} {...msg} />
              ))}
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Roles</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">User</p>
              <MessageBubble role="user" content="사용자 메시지입니다." status="sent" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Assistant</p>
              <MessageBubble role="assistant" content="AI 어시스턴트의 응답입니다." metadata="GPT-4" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">System</p>
              <MessageBubble role="system" content="시스템 알림: 새로운 세션이 시작되었습니다." />
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={messageBubbleProps} />
        </section>
      </div>
    </div>
  )
}
