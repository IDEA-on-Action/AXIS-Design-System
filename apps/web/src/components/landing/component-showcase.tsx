import Link from 'next/link'
import { Button, Badge, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@axis-ds/ui-react'
import { ArrowRight } from 'lucide-react'

export function ComponentShowcase() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight">컴포넌트 미리보기</h2>
          <p className="mt-3 text-muted-foreground">
            30개 Core UI + 18개 Agentic UI 컴포넌트
          </p>
        </div>

        {/* 라이브 데모 그리드 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Button</CardTitle>
              <CardDescription>다양한 스타일의 버튼</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">Primary</Button>
                <Button size="sm" variant="outline">Outline</Button>
                <Button size="sm" variant="secondary">Secondary</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Badge</CardTitle>
              <CardDescription>상태 표시 뱃지</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Input</CardTitle>
              <CardDescription>텍스트 입력 필드</CardDescription>
            </CardHeader>
            <CardContent>
              <Input placeholder="텍스트 입력..." className="h-8 text-sm" />
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">StreamingText</CardTitle>
              <CardDescription>실시간 텍스트 스트리밍</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-sm animate-pulse">AI가 응답을 생성하고 있습니다...</span>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">ToolCallCard</CardTitle>
              <CardDescription>AI 도구 호출 표시</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded border bg-muted/50 p-2 text-xs font-mono">
                search_documents()
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">StepTimeline</CardTitle>
              <CardDescription>단계별 진행 표시</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 rounded-full bg-green-500" />
                <div className="h-0.5 w-8 bg-green-500" />
                <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse" />
                <div className="h-0.5 w-8 bg-muted" />
                <div className="h-4 w-4 rounded-full bg-muted" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 flex gap-4 justify-center">
          <Link href="/components">
            <Button variant="outline" size="lg">
              Core UI 보기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/agentic">
            <Button variant="outline" size="lg">
              Agentic UI 보기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
