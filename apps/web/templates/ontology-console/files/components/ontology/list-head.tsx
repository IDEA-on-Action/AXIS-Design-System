interface ListHeadProps {
  title: string
  count?: number
  description?: string
  tools?: React.ReactNode
}

/** 목록 머리: 제목 · 개수 · 설명 + 오른쪽 동작. 메뉴의 첫 화면은 이 머리를 가진 목록 페이지입니다 */
export function ListHead({ title, count, description, tools }: ListHeadProps) {
  return (
    <div className="mb-[18px] flex items-start gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold leading-snug tracking-tight">
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-secondary px-2.5 py-px text-[13px] font-bold text-secondary-foreground">
              {count}
            </span>
          )}
        </h1>
        {description && <p className="mt-1 text-[13.5px] text-muted-foreground">{description}</p>}
      </div>
      {tools && <div className="flex shrink-0 items-center gap-2">{tools}</div>}
    </div>
  )
}
