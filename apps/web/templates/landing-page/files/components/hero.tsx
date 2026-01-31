export function Hero() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        AXIS Design System
      </h1>
      <p className="max-w-lg text-lg text-muted-foreground">
        React 기반 디자인 시스템으로 빠르고 일관된 UI를 구축하세요.
      </p>
      <div className="flex gap-4">
        <a
          href="#features"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          시작하기
        </a>
        <a
          href="https://ds.minu.best"
          className="inline-flex h-10 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          문서 보기
        </a>
      </div>
    </section>
  )
}
