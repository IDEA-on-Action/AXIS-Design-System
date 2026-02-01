import { SidebarNav } from '@/components/sidebar-nav'
import { TableOfContents } from '@/components/toc'
import { DocPager } from '@/components/doc-pager'
import { MobileNav } from '@/components/mobile-nav'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container flex-1 items-start lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
      <aside className="fixed top-16 z-30 hidden h-[calc(100vh-4rem)] w-full shrink-0 overflow-y-auto border-r py-6 pr-4 lg:sticky lg:block lg:w-56 xl:w-64">
        <SidebarNav />
      </aside>
      <div className="flex w-full flex-col xl:grid xl:grid-cols-[minmax(0,1fr)_200px] xl:gap-10">
        <div className="min-w-0 py-6">
          {children}
          <DocPager />
        </div>
        <aside className="hidden xl:block">
          <div className="sticky top-16 pt-6">
            <TableOfContents />
          </div>
        </aside>
      </div>
    </div>
  )
}
