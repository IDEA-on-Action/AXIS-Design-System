'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getDocPagerLinks } from '@/config/docs'

export function DocPager() {
  const pathname = usePathname()
  const { prev, next } = getDocPagerLinks(pathname)

  if (!prev && !next) return null

  return (
    <div className="flex items-center justify-between py-8">
      {prev ? (
        <Link
          href={prev.href}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {prev.title}
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={next.href}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
        >
          {next.title}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <div />
      )}
    </div>
  )
}
