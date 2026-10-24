import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@axis-ds/ui-react'
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
            @axis-ds/cli를 사용하여 컴포넌트를 설치합니다.
          </p>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Terminal className="h-4 w-4" />
                <span>Terminal</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="명령어 복사">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="overflow-x-auto">
              <code className="text-sm">npx @axis-ds/cli init</code>
            </pre>
          </div>
        </section>

        {/* Tailwind CSS 연동 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Tailwind CSS</h2>
          <h3 className="text-lg font-medium mb-3">Tailwind CSS 4</h3>
          <p className="text-muted-foreground mb-4">
            Tailwind CSS 4 프로젝트(create-next-app 15.5 기본)는 @import &quot;tailwindcss&quot; 가 있는
            전역 CSS 에 아래 줄을 한 줄씩 더합니다(1.4.0 부터). 컴포넌트 패키지 줄은
            @axis-ds/ui-react · @axis-ds/agentic-ui 를 npm 패키지로 쓸 때 그 패키지만 넣습니다.
            axis init 이 Tailwind 4 프로젝트에서 같은 줄을 안내합니다.
          </p>
          <div className="rounded-lg border bg-card p-4 mb-4">
            <pre className="overflow-x-auto">
              <code className="text-sm">{`/* app/globals.css */
@import "tailwindcss";
@import "@axis-ds/tokens/css/tailwind4";
@import "@axis-ds/ui-react/tailwind.css";
@import "@axis-ds/agentic-ui/tailwind.css";`}</code>
            </pre>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground mb-6">
            <p>
              • create-next-app 기본 globals.css 의 :root(--background · --foreground), @theme inline,
              다크용 @media, body 블록은 AXIS 와 같은 이름을 다른 값으로 정의하므로 지웁니다.
            </p>
            <p>
              • 토큰 진입점이 토큰 변수를 함께 불러오므로 @axis-ds/tokens/css/shadcn 을 따로 import 하지
              않습니다.
            </p>
            <p>
              • 색을 지정하지 않은 ring-2 는 글자색(currentColor)으로 그려집니다.
            </p>
            <p>
              • Accordion · Progress 의 keyframes 는 토큰 진입점이 정의합니다. Dialog · Popover 등의 열고 닫는
              애니메이션(animate-in 등)은 tw-animate-css 를 설치하고 @import &quot;tailwindcss&quot; 바로 다음에
              @import &quot;tw-animate-css&quot; 를 넣습니다(Tailwind 3 은 tailwindcss-animate 를 plugins 에).
              움직임 줄이기 설정에서는 열고 닫는 애니메이션과 Accordion 이 멈추고, 스피너 · Progress 불확정 같은
              로딩 · 진행 표시는 멈추지 않고 2~3배 느리게 움직입니다.
            </p>
          </div>
          <h3 className="text-lg font-medium mb-3">Tailwind CSS 3</h3>
          <p className="text-muted-foreground">
            tailwind.config 의 presets 에 @axis-ds/tokens/tailwind 를 넣고, content 에
            ./node_modules/@axis-ds/ui-react/**/*.{'{js,jsx}'} 처럼 사용하는 패키지 경로를 더합니다. 전역
            CSS 에는 @axis-ds/tokens/css 와 @axis-ds/tokens/css/shadcn 을 import 합니다.
          </p>
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
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="명령어 복사">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="overflow-x-auto">
              <code className="text-sm">npx @axis-ds/cli add button card input</code>
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
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="명령어 복사">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="overflow-x-auto">
              <code className="text-sm">npx @axis-ds/cli add streaming-text tool-call-card</code>
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

        {/* CLI Commands */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">CLI Commands</h2>
          <p className="text-muted-foreground mb-4">
            @axis-ds/cli는 컴포넌트 설치 외에도 프로젝트 관리를 위한 명령어를 제공합니다.
          </p>

          <h3 className="text-lg font-medium mb-3">axis sync</h3>
          <p className="text-muted-foreground mb-3">
            GitHub Issue와 로컬 WI(Work Item) 상태를 동기화합니다.
          </p>
          <div className="rounded-lg border bg-card p-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Terminal className="h-4 w-4" />
              <span>Terminal</span>
            </div>
            <pre className="overflow-x-auto">
              <code className="text-sm">{`# GitHub Issue와 WI 상태 동기화
npx @axis-ds/cli sync

# 변경 사항 미리보기 (실제 변경 없음)
npx @axis-ds/cli sync --dry-run`}</code>
            </pre>
          </div>

          <h3 className="text-lg font-medium mb-3">axis status</h3>
          <p className="text-muted-foreground mb-3">
            프로젝트 전체 상태를 요약하여 출력합니다.
          </p>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Terminal className="h-4 w-4" />
              <span>Terminal</span>
            </div>
            <pre className="overflow-x-auto">
              <code className="text-sm">{`# 프로젝트 상태 요약 출력
npx @axis-ds/cli status`}</code>
            </pre>
          </div>
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
