import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@axis-ds/ui-react'

const agenticComponents = [
  {
    name: 'StreamingText',
    description: '실시간 텍스트 스트리밍 표시',
    href: '/agentic/streaming-text'
  },
  {
    name: 'ToolCallCard',
    description: 'AI 도구 호출 상태 표시',
    href: '/agentic/tool-call-card'
  },
  {
    name: 'ApprovalDialog',
    description: '사용자 승인 요청 다이얼로그',
    href: '/agentic/approval-dialog'
  },
  {
    name: 'SurfaceRenderer',
    description: '다양한 컨텐츠 타입 렌더링',
    href: '/agentic/surface-renderer'
  },
  {
    name: 'RunProgress',
    description: '에이전트 실행 진행 상태',
    href: '/agentic/run-progress'
  },
  {
    name: 'StepTimeline',
    description: '단계별 타임라인 표시',
    href: '/agentic/step-timeline'
  },
  {
    name: 'SourcePanel',
    description: 'AI 응답 출처/근거 표시',
    href: '/agentic/source-panel'
  },
  {
    name: 'RecoveryBanner',
    description: '에러 복구 옵션 배너',
    href: '/agentic/recovery-banner'
  },
  {
    name: 'AgentAvatar',
    description: 'AI 에이전트 아바타',
    href: '/agentic/agent-avatar'
  },
  {
    name: 'ThinkingIndicator',
    description: 'AI 생각 중 인디케이터',
    href: '/agentic/thinking-indicator'
  },
  {
    name: 'MessageBubble',
    description: '채팅 메시지 버블',
    href: '/agentic/message-bubble'
  },
  {
    name: 'FeedbackButtons',
    description: 'AI 응답 피드백 버튼',
    href: '/agentic/feedback-buttons'
  },
  {
    name: 'TokenUsageIndicator',
    description: '토큰 사용량 표시기',
    href: '/agentic/token-usage-indicator'
  },
  {
    name: 'ContextPanel',
    description: 'AI 대화 컨텍스트 패널',
    href: '/agentic/context-panel'
  },
  {
    name: 'CodeBlock',
    description: 'AI 생성 코드 블록',
    href: '/agentic/code-block'
  },
  {
    name: 'PlanCard',
    description: '에이전트 실행 계획 카드',
    href: '/agentic/plan-card'
  },
  {
    name: 'AttachmentCard',
    description: '파일 첨부 카드',
    href: '/agentic/attachment-card'
  },
  {
    name: 'DiffViewer',
    description: '코드 변경 비교 뷰어',
    href: '/agentic/diff-viewer'
  },
]

export default function AgenticPage() {
  return (
    <div className="container py-12">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Agentic UI</h1>
        <p className="text-lg text-muted-foreground">
          AI/LLM 애플리케이션에 특화된 컴포넌트입니다.
          스트리밍, 도구 호출, 승인 플로우 등 에이전트 협업을 위한 UI를 제공합니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agenticComponents.map((component) => (
          <Link key={component.name} href={component.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>{component.name}</CardTitle>
                <CardDescription>{component.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
