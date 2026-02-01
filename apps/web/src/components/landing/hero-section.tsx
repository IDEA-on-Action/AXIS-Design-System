import Link from 'next/link'
import { Button } from '@axis-ds/ui-react'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32 lg:py-40">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]" />
      </div>

      <div className="container flex flex-col items-center justify-center gap-6 text-center">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          v1.1 — Agentic UI & CLI 배포 완료
        </div>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
            Build AI apps
          </span>
          <br />
          <span className="bg-gradient-to-br from-foreground/80 to-foreground/50 bg-clip-text text-transparent">
            with AXIS
          </span>
        </h1>

        <p className="max-w-[600px] text-lg text-muted-foreground leading-relaxed">
          AI/LLM 애플리케이션을 위한 React 컴포넌트 라이브러리.
          <br className="hidden sm:inline" />
          shadcn/ui 호환. Agentic UI 포함. CLI로 설치.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link href="/docs">
            <Button size="lg" className="w-full sm:w-auto">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/components">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Components
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
