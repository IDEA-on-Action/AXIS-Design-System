'use client'

const navItems = [
  { label: '대시보드', href: '/', active: true },
  { label: '분석', href: '/analytics', active: false },
  { label: '사용자', href: '/users', active: false },
  { label: '설정', href: '/settings', active: false },
]

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
      <div className="p-6">
        <h2 className="text-lg font-bold">AXIS Dashboard</h2>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              item.active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">AXIS Design System v0.7</p>
      </div>
    </aside>
  )
}
