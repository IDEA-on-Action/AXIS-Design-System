import { Blocks, Bot, Moon, Terminal } from 'lucide-react'

const features = [
  {
    icon: Blocks,
    title: 'shadcn/ui 호환',
    description:
      'Radix UI + Tailwind CSS 기반. 기존 shadcn/ui 프로젝트에 바로 통합할 수 있습니다.',
  },
  {
    icon: Bot,
    title: 'Agentic UI',
    description:
      '스트리밍, 도구 호출, 승인 플로우 등 AI 에이전트 앱에 특화된 18개 컴포넌트.',
  },
  {
    icon: Terminal,
    title: 'CLI 도구',
    description:
      'npx axis-cli add 명령으로 필요한 컴포넌트만 선택적으로 설치.',
  },
  {
    icon: Moon,
    title: '다크모드',
    description:
      '라이트/다크/시스템 테마 자동 지원. CSS 변수 기반 커스터마이징.',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            왜 AXIS인가?
          </h2>
          <p className="mt-3 text-muted-foreground">
            AI 애플리케이션 개발에 필요한 모든 것
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="group rounded-lg border p-6 transition-colors hover:bg-muted/50">
              <feature.icon className="mb-4 h-8 w-8 text-muted-foreground group-hover:text-foreground transition-colors" />
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
