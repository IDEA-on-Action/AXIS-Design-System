import { ThemeToggle } from './theme-toggle'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 bg-background text-foreground">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">AXIS Theme Only</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          AXIS 디자인 토큰과 테마 시스템이 적용된 최소 구성 템플릿입니다.
        </p>
      </div>

      <ThemeToggle />

      <div className="grid grid-cols-2 gap-4 max-w-lg w-full">
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <h3 className="font-semibold mb-1">디자인 토큰</h3>
          <p className="text-sm text-muted-foreground">CSS 변수 기반 테마 시스템</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <h3 className="font-semibold mb-1">다크모드</h3>
          <p className="text-sm text-muted-foreground">시스템 설정 연동 지원</p>
        </div>
      </div>
    </main>
  )
}
