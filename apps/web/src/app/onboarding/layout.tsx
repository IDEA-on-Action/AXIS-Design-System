'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Rocket,
  BookOpen,
  GitBranch,
  Monitor,
  Terminal,
  HelpCircle
} from 'lucide-react'

const sidebarItems = [
  { href: '/onboarding', label: 'Quick Start', icon: Rocket },
  { href: '/onboarding/concepts', label: 'Core Concepts', icon: BookOpen },
  { href: '/onboarding/workflows', label: 'Workflows', icon: GitBranch },
  { href: '/onboarding/web-ui', label: 'Web UI Guide', icon: Monitor },
  { href: '/onboarding/cli', label: 'CLI Commands', icon: Terminal },
  { href: '/onboarding/faq', label: 'FAQ', icon: HelpCircle },
]

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
      {/* Sidebar */}
      <aside className="fixed top-16 z-30 -ml-2 hidden h-[calc(100vh-4rem)] w-full shrink-0 md:sticky md:block">
        <div className="h-full py-6 pr-6 lg:py-8">
          <nav className="flex flex-col gap-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile navigation */}
      <div className="md:hidden py-4 border-b mb-4">
        <nav className="flex flex-wrap gap-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main content */}
      <main className="py-6 lg:py-8">{children}</main>
    </div>
  )
}
