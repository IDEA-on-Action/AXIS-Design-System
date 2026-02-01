'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { docsConfig } from '@/config/docs'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="w-full">
      {docsConfig.sidebarNav.map((group) => (
        <SidebarGroup
          key={group.title}
          title={group.title}
          items={group.items}
          pathname={pathname}
        />
      ))}
    </nav>
  )
}

function SidebarGroup({
  title,
  items,
  pathname,
}: {
  title: string
  items: { title: string; href: string }[]
  pathname: string
}) {
  const isActive = items.some((item) => item.href === pathname)
  const [open, setOpen] = useState(true)

  return (
    <div className="pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1 text-sm font-semibold"
      >
        {title}
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground transition-transform',
            open && 'rotate-90'
          )}
        />
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-0.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-md px-3 py-1.5 text-sm transition-colors',
                pathname === item.href
                  ? 'bg-accent font-medium text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
