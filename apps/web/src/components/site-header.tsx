'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Github } from 'lucide-react'
import { Button } from '@axis-ds/ui-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileNav } from '@/components/mobile-nav'

const navItems = [
  { href: '/docs', label: 'Docs' },
  { href: '/components', label: 'Components' },
  { href: '/agentic', label: 'Agentic UI' },
  { href: '/library', label: 'Library' },
  { href: '/templates', label: 'Templates' },
  { href: '/contribute', label: 'Contribute' },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <MobileNav />
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-lg">AXIS</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  pathname?.startsWith(item.href)
                    ? 'text-foreground'
                    : 'text-foreground/60'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-1">
          <ThemeToggle />
          <Link
            href="https://github.com/IDEA-on-Action/AXIS-Design-System"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
