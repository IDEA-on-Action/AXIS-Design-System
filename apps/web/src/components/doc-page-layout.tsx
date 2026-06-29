import Link from 'next/link'
import type { ReactNode } from 'react'

interface DocPageLayoutProps {
  /** 상위 카테고리 라벨 (예: "Components", "Agentic UI") */
  category: string
  /** 카테고리 링크 경로 (예: "/components") */
  categoryHref: string
  /** 페이지 제목 (h1 + breadcrumb 현재 위치) */
  title: string
  /** 페이지 설명 (제목 아래 리드 문단) */
  description: ReactNode
  /** 표준 섹션들 (DocSection) */
  children: ReactNode
}

/**
 * 문서 페이지 표준 레이아웃 (WI-0016).
 *
 * 기존 51개 문서 페이지가 수작업 반복하던 container/max-w-4xl 래퍼 +
 * breadcrumb + h1 + 설명 헤더 블록을 단일 컴포넌트로 표준화한다.
 */
export function DocPageLayout({
  category,
  categoryHref,
  title,
  description,
  children,
}: DocPageLayoutProps) {
  return (
    <div className="container py-12">
      {/* data-pagefind-body: Pagefind가 네비/푸터 제외하고 문서 본문만 인덱싱 (WI-0017) */}
      <div className="max-w-4xl" data-pagefind-body>
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href={categoryHref} className="hover:text-foreground">
              {category}
            </Link>
            <span>/</span>
            <span>{title}</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">{title}</h1>
          <p className="text-lg text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
