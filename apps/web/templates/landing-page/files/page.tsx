import { Hero } from './components/hero'

const features = [
  {
    title: '디자인 토큰',
    description: 'CSS 변수 기반으로 일관된 스타일을 유지합니다.',
  },
  {
    title: '다크모드',
    description: '시스템 설정과 연동되는 다크모드를 지원합니다.',
  },
  {
    title: '반응형 레이아웃',
    description: '모바일부터 데스크톱까지 최적화된 레이아웃을 제공합니다.',
  },
  {
    title: '접근성',
    description: 'WCAG 2.1 AA 기준을 충족하는 컴포넌트를 사용합니다.',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />

      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">주요 기능</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border bg-card p-6 text-card-foreground"
            >
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Built with AXIS Design System
      </footer>
    </main>
  )
}
