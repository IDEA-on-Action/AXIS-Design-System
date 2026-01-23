import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ax/ui'
import { Copy, Terminal } from 'lucide-react'
import Link from 'next/link'

export default function DocsPage() {
  return (
    <div className="container py-12">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Getting Started</h1>
        <p className="text-lg text-muted-foreground">
          AXIS Design System을 프로젝트에 설치하고 사용하는 방법입니다.
        </p>
      </div>

      <div className="max-w-3xl space-y-8">
        {/* Installation */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <p className="text-muted-foreground mb-4">
            axis-cli를 사용하여 컴포넌트를 설치합니다.
          </p>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Terminal className="h-4 w-4" />
                <span>Terminal</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="overflow-x-auto">
              <code className="text-sm">npx axis-cli init</code>
            </pre>
          </div>
        </section>

        {/* Add Components */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Add Components</h2>
          <p className="text-muted-foreground mb-4">
            필요한 컴포넌트를 개별적으로 추가할 수 있습니다.
          </p>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Terminal className="h-4 w-4" />
                <span>Terminal</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="overflow-x-auto">
              <code className="text-sm">npx axis-cli add button card input</code>
            </pre>
          </div>
        </section>

        {/* Agentic Components */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Agentic Components</h2>
          <p className="text-muted-foreground mb-4">
            AI/LLM 애플리케이션용 특수 컴포넌트도 추가할 수 있습니다.
          </p>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Terminal className="h-4 w-4" />
                <span>Terminal</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="overflow-x-auto">
              <code className="text-sm">npx axis-cli add streaming-text tool-call-card</code>
            </pre>
          </div>
        </section>

        {/* shadcn/ui Compatibility */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">shadcn/ui Compatibility</h2>
          <Card>
            <CardHeader>
              <CardTitle>100% 호환</CardTitle>
              <CardDescription>
                AXIS의 Core UI 컴포넌트는 shadcn/ui와 완전히 호환됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• 동일한 API와 Props 구조</p>
              <p>• Tailwind CSS 기반 스타일링</p>
              <p>• Radix UI 프리미티브 사용</p>
              <p>• 기존 shadcn/ui 프로젝트에 Agentic UI만 추가 가능</p>
            </CardContent>
          </Card>
        </section>

        {/* Links */}
        <section className="flex gap-4">
          <Link href="/components">
            <Button>Components 보기</Button>
          </Link>
          <Link href="/agentic">
            <Button variant="outline">Agentic UI 보기</Button>
          </Link>
        </section>
      </div>
    </div>
  )
}
