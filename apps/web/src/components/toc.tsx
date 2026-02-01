'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TocItem {
  id: string
  text: string
  level: number
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll('main h2, main h3')
    ).map((element) => ({
      id: element.id,
      text: element.textContent || '',
      level: element.tagName === 'H2' ? 2 : 3,
    }))
    setHeadings(elements)
  }, [])

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    headings.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">On This Page</p>
      <nav className="flex flex-col gap-1">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={cn(
              'text-xs transition-colors hover:text-foreground',
              heading.level === 3 && 'pl-3',
              activeId === heading.id
                ? 'font-medium text-foreground'
                : 'text-muted-foreground'
            )}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  )
}
