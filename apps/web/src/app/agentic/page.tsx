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
    name: 'StepIndicator',
    description: '단계별 진행 상태 표시',
    href: '/agentic/step-indicator'
  },
  {
    name: 'AgentRunContainer',
    description: '에이전트 실행 컨테이너',
    href: '/agentic/agent-run-container'
  },
  {
    name: 'SurfaceRenderer',
    description: '다양한 컨텐츠 타입 렌더링',
    href: '/agentic/surface-renderer'
  },
  {
    name: 'ActivityPreviewCard',
    description: 'Activity 미리보기 카드',
    href: '/agentic/activity-preview-card'
  },
  {
    name: 'CollectorHealthBar',
    description: '수집기 상태 모니터링 바',
    href: '/agentic/collector-health-bar'
  },
  {
    name: 'SeminarChatPanel',
    description: '세미나 정보 추출 채팅 패널',
    href: '/agentic/seminar-chat-panel'
  },
  {
    name: 'FileUploadZone',
    description: '파일 업로드 드래그앤드롭 영역',
    href: '/agentic/file-upload-zone'
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
