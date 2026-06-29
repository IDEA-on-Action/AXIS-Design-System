import type { ReactNode } from 'react'

/** 제목을 TOC 앵커용 슬러그로 변환 ("With Icon" → "with-icon") */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface DocSectionProps {
  /** 섹션 제목 (h2) */
  title: string
  /** 앵커 id. 미지정 시 title을 슬러그화해 자동 부여 */
  id?: string
  /** 섹션 본문 */
  children: ReactNode
}

/**
 * 문서 페이지 표준 섹션 (WI-0016).
 *
 * 기존 페이지가 반복하던 `<section className="mb-12">` + `<h2 className="text-2xl
 * font-semibold mb-4">` 패턴을 표준화하고, TOC 연동을 위한 앵커 id를 자동 부여한다.
 */
export function DocSection({ title, id, children }: DocSectionProps) {
  return (
    <section id={id ?? slugify(title)} className="mb-12 scroll-mt-20">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      {children}
    </section>
  )
}
