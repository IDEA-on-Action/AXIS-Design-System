'use client'

import { Button } from '@axis-ds/ui-react'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const packageManagers = [
  { id: 'pnpm', label: 'pnpm', command: 'pnpm dlx axis-cli add button' },
  { id: 'npm', label: 'npm', command: 'npx axis-cli add button' },
  { id: 'bun', label: 'bun', command: 'bunx axis-cli add button' },
] as const

export function InstallCommand() {
  const [active, setActive] = useState<string>('pnpm')
  const [copied, setCopied] = useState(false)

  const activeManager = packageManagers.find((pm) => pm.id === active)!

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeManager.command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight">설치</h2>
          <p className="mt-3 text-muted-foreground">
            CLI 한 줄로 원하는 컴포넌트를 설치하세요.
          </p>
        </div>
        <div className="mx-auto max-w-xl">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            {/* 패키지 매니저 탭 */}
            <div className="flex border-b">
              {packageManagers.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setActive(pm.id)}
                  className={cn(
                    'flex-1 px-4 py-2.5 text-xs font-medium transition-colors',
                    active === pm.id
                      ? 'bg-muted/50 text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {pm.label}
                </button>
              ))}
            </div>
            {/* 명령어 */}
            <div className="flex items-center justify-between px-4 py-4">
              <code className="text-sm font-mono">{activeManager.command}</code>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
