import Link from 'next/link'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@axis-ds/ui-react'
import { ArrowRight, Copy, Terminal } from 'lucide-react'
import { ComponentPreview } from '@/components/component-preview'

const coreComponents = [
  { name: 'Button', description: '다양한 스타일의 버튼', href: '/components/button' },
  { name: 'Card', description: '콘텐츠 컨테이너', href: '/components/card' },
  { name: 'Input', description: '텍스트 입력 필드', href: '/components/input' },
  { name: 'Dialog', description: '모달 다이얼로그', href: '/components/dialog' },
  { name: 'Badge', description: '상태 표시 뱃지', href: '/components/badge' },
  { name: 'Select', description: '드롭다운 선택', href: '/components/select' },
]

const agenticComponents = [
  { name: 'StreamingText', description: '실시간 텍스트 스트리밍', href: '/agentic/streaming-text' },
  { name: 'ApprovalCard', description: '사용자 승인 요청 UI', href: '/agentic/approval-dialog' },
  { name: 'ToolCallCard', description: 'AI 도구 호출 표시', href: '/agentic/tool-call-card' },
  { name: 'ThinkingIndicator', description: 'AI 생각 중 표시', href: '/agentic/thinking-indicator' },
  { name: 'SourcePanel', description: 'AI 근거/출처 표시', href: '/agentic/source-panel' },
  { name: 'StepTimeline', description: '단계별 진행 표시', href: '/agentic/step-timeline' },
]

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-24 md:py-32 lg:py-40">
        <div className="container flex flex-col items-center justify-center gap-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl">
            AXIS Design System
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl leading-relaxed">
            AI/LLM 애플리케이션을 위한 React 컴포넌트 라이브러리.
            <br />
            shadcn/ui 호환, Agentic UI 포함.
          </p>
          <div className="flex gap-4 mt-6">
            <Link href="/docs">
              <Button size="lg">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/components">
              <Button variant="outline" size="lg">
                Components
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Install Section */}
      <section className="py-12">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Terminal className="h-4 w-4" />
                  <span>Terminal</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <pre className="overflow-x-auto">
                <code className="text-sm font-mono">npx axis-cli add button</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Core UI Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex flex-col gap-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Core UI</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              기본 UI 컴포넌트. shadcn/ui와 100% 호환됩니다.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coreComponents.map((component) => (
              <Link key={component.name} href={component.href}>
                <Card className="h-full transition-all hover:bg-muted/50 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">{component.name}</CardTitle>
                    <CardDescription>{component.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ComponentPreview name={component.name} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/components">
              <Button variant="outline" size="lg">
                모든 컴포넌트 보기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Agentic UI Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="flex flex-col gap-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Agentic UI</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              AI/LLM 애플리케이션에 특화된 컴포넌트. 스트리밍, 승인, 도구 호출 등을 지원합니다.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agenticComponents.map((component) => (
              <Link key={component.name} href={component.href}>
                <Card className="h-full transition-all hover:bg-background hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">{component.name}</CardTitle>
                    <CardDescription>{component.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ComponentPreview name={component.name} agentic />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/agentic">
              <Button variant="outline" size="lg">
                모든 Agentic UI 보기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-3">
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold">shadcn/ui 호환</h3>
              <p className="text-muted-foreground leading-relaxed">
                shadcn/ui Registry와 완벽 호환. 기존 프로젝트에 쉽게 통합할 수 있습니다.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold">CLI 도구</h3>
              <p className="text-muted-foreground leading-relaxed">
                axis-cli로 컴포넌트를 쉽게 추가하세요. Monet, V0 코드 변환도 지원합니다.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold">Agentic UI</h3>
              <p className="text-muted-foreground leading-relaxed">
                AI 에이전트 애플리케이션에 특화된 10+ 컴포넌트를 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 md:py-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            Built by IDEA on Action. Open source on GitHub.
          </p>
          <p className="text-sm text-muted-foreground">
            Powered by Next.js 15 & Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  )
}
