interface SectionProps {
  title: string
  count?: number
  children: React.ReactNode
}

/** 절(중제목 + 내용): 밑줄 없이 간격으로 나눕니다. 절 사이 40px, 제목과 내용 사이 14px */
export function Section({ title, count, children }: SectionProps) {
  return (
    <section className="mb-10 last:mb-2">
      <h2 className="mb-3.5 flex items-center gap-2.5 text-base font-bold">
        {title}
        {count !== undefined && <span className="text-[13px] font-semibold text-muted-foreground">{count}</span>}
      </h2>
      {children}
    </section>
  )
}

/** 설명 목록(이름 110px + 값) */
export function KeyValue({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
      {items.map((it) => (
        <div key={it.label} className="contents">
          <dt className="text-muted-foreground">{it.label}</dt>
          <dd className="min-w-0">{it.value}</dd>
        </div>
      ))}
    </dl>
  )
}
