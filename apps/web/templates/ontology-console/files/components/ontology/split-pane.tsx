interface SplitPaneProps {
  left: React.ReactNode
  children: React.ReactNode
}

/**
 * 카드 안 좌우 분할: 왼쪽 열 300px + 1px 중립 선 + 오른쪽 본문(프로토타입 v0.28 `.o-split`).
 * 선은 기본 테두리색(--border)이라 「한쪽 색 선」이 아닙니다. 1199px 이하에서는 1열로 쌓이고 선은 아래쪽으로 바뀝니다.
 */
export function SplitPane({ left, children }: SplitPaneProps) {
  return (
    <div
      data-ontology-split=""
      className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] max-[1199px]:grid-cols-1 max-[1199px]:grid-rows-none"
    >
      <aside
        aria-label="목록"
        className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r max-[1199px]:border-b max-[1199px]:border-r-0"
      >
        {left}
      </aside>
      <div className="min-h-0 overflow-y-auto px-[26px] pb-[30px] pt-6 max-[1199px]:overflow-visible max-[1199px]:px-5">
        {children}
      </div>
    </div>
  )
}
