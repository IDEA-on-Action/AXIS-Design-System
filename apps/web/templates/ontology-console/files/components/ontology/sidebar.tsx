'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Boxes, ChevronDown, FolderKanban, LayoutDashboard, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { projects, workspace } from '../../lib/demo-data'
import { ThemeToggle } from './theme-toggle'

interface NavLink {
  href: string
  label: string
}

interface NavGroup {
  id: string
  label: string
  icon: LucideIcon
  items: NavLink[]
}

const groups: NavGroup[] = [
  { id: 'ontology', label: '온톨로지', icon: Boxes, items: [{ href: '/entities', label: '요소 목록' }] },
  {
    id: 'projects',
    label: '프로젝트',
    icon: FolderKanban,
    items: projects.map((p) => ({ href: `/projects/${p.id}`, label: p.name })),
  },
]

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * 사이드바: 워크스페이스 이름 · 대메뉴(한 번에 하나만 펼침) · 하위 메뉴 · 화면 모드 전환.
 * 고른 메뉴는 연한 키컬러 바탕 + 진한 키컬러 글자(accent · accent-foreground)로 표시합니다.
 */
export function Sidebar() {
  const pathname = usePathname() ?? '/'
  const current = groups.find((g) => g.items.some((i) => isActive(pathname, i.href)))?.id
  const [open, setOpen] = useState<string | undefined>(current ?? groups[0].id)

  return (
    <nav aria-label="주 메뉴" className="flex min-h-0 flex-col overflow-hidden pb-3 pl-[18px] pr-2.5 pt-3.5">
      <div className="px-1.5 pb-[18px] pt-1">
        <p className="text-base font-extrabold tracking-tight">{workspace.name}</p>
        <p className="mt-px text-[12.5px] text-muted-foreground">{workspace.role}</p>
      </div>

      <ul className="flex min-h-0 flex-col gap-1.5 overflow-y-auto">
        <li>
          <Link
            href="/"
            aria-current={pathname === '/' ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-[15px] font-medium hover:bg-secondary',
              pathname === '/' && 'bg-accent font-semibold text-accent-foreground hover:bg-accent'
            )}
          >
            <LayoutDashboard aria-hidden className="size-[18px] shrink-0" />
            통합 뷰
          </Link>
        </li>
        {groups.map((g) => {
          const expanded = open === g.id
          const Icon = g.icon
          return (
            <li key={g.id}>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`nav-${g.id}`}
                onClick={() => setOpen(expanded ? undefined : g.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-left text-[15px] font-medium hover:bg-secondary',
                  current === g.id && 'font-semibold'
                )}
              >
                <Icon aria-hidden className="size-[18px] shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{g.label}</span>
                <ChevronDown
                  aria-hidden
                  className={cn('size-3.5 text-muted-foreground transition-transform', expanded && 'rotate-180')}
                />
              </button>
              <ul id={`nav-${g.id}`} hidden={!expanded} className="flex flex-col gap-0.5 pb-2.5 pl-3.5 pt-1">
                {g.items.map((item) => {
                  const active = isActive(pathname, item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'block truncate rounded-sm px-3 py-2 text-[14.5px] hover:bg-secondary',
                          active && 'bg-accent font-semibold text-accent-foreground hover:bg-accent'
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto border-t pt-3">
        <ThemeToggle />
      </div>
    </nav>
  )
}
