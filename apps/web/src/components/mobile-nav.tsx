'use client'

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@axis-ds/ui-react'
import { Button } from '@axis-ds/ui-react'
import { Menu } from 'lucide-react'
import { SidebarNav } from '@/components/sidebar-nav'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden">
          <Menu className="h-4 w-4" />
          <span className="sr-only">메뉴 열기</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 pr-0">
        <SheetTitle className="sr-only">사이드바 네비게이션</SheetTitle>
        <div className="px-2 py-4">
          <Link href="/" className="flex items-center mb-6" onClick={() => setOpen(false)}>
            <span className="font-bold text-xl">AXIS</span>
          </Link>
          <SidebarNav />
        </div>
      </SheetContent>
    </Sheet>
  )
}
