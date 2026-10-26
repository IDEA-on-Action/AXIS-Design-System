import { Sidebar } from './sidebar'

/**
 * 앱 틀: 바탕 위 사이드바 240px + 콘텐츠 영역(카드 한 장).
 * 높이는 100vh 로 고정하고 스크롤은 카드 안에서 일어납니다. 바탕 여백은 위아래 16px · 오른쪽 18px,
 * 사이드바와 카드 사이는 8px 입니다(프로토타입 v0.28 `.o-app`). 브레드크럼 · 상단 머리는 두지 않습니다.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-ontology-shell=""
      className="grid h-screen grid-cols-[240px_minmax(0,1fr)] gap-x-2 overflow-hidden bg-background py-4 pr-[18px]"
    >
      <Sidebar />
      <main className="flex min-h-0 min-w-0 flex-col">{children}</main>
    </div>
  )
}
