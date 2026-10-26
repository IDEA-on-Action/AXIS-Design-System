import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@axis-ds/ui-react/button'

interface DetailHeadProps {
  backHref: string
  backLabel: string
  title: string
  subtitle?: string
  lead?: React.ReactNode
  badges?: React.ReactNode
  prevHref?: string
  nextHref?: string
}

/**
 * depth 상세 머리: 뒤로 · (타일) · 제목 · 이전 · 다음.
 * 브레드크럼 대신 뒤로 버튼 하나로 목록에 돌아갑니다.
 */
export function DetailHead({ backHref, backLabel, title, subtitle, lead, badges, prevHref, nextHref }: DetailHeadProps) {
  return (
    <div className="mb-[18px] flex items-start gap-3">
      <Button asChild variant="ghost" size="icon" className="-ml-2 shrink-0">
        <Link href={backHref} aria-label={backLabel}>
          <ArrowLeft aria-hidden className="size-5" />
        </Link>
      </Button>
      {lead}
      <div className="min-w-0 flex-1">
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold leading-snug tracking-tight">
          {title}
          {badges}
        </h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <PagerLink href={prevHref} label="이전" icon="prev" />
        <PagerLink href={nextHref} label="다음" icon="next" />
      </div>
    </div>
  )
}

function PagerLink({ href, label, icon }: { href?: string; label: string; icon: 'prev' | 'next' }) {
  const content = (
    <>
      {icon === 'prev' && <ChevronLeft aria-hidden className="size-4" />}
      {label}
      {icon === 'next' && <ChevronRight aria-hidden className="size-4" />}
    </>
  )
  if (!href) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1">
        {content}
      </Button>
    )
  }
  return (
    <Button asChild variant="outline" size="sm" className="gap-1">
      <Link href={href}>{content}</Link>
    </Button>
  )
}
