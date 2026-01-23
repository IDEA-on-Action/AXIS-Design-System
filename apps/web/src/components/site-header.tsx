'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Github, Menu } from 'lucide-react'
import { Button } from '@ax/ui'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/docs', label: 'Docs' },
  { href: '/components', label: 'Components' },
  { href: '/agentic', label: 'Agentic UI' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">AXIS</span>
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
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <Link
              href="https://github.com/IDEA-on-Action/AXIS-Design-System"
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="ghost" size="icon">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </nav>
        </div>
      </div>
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-2 rounded-md transition-colors hover:bg-accent',
                  pathname?.startsWith(item.href)
                    ? 'bg-accent text-foreground'
                    : 'text-foreground/60'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
