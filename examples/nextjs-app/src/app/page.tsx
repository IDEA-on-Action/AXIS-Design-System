'use client'

import { Button, Card, Input } from '@axis-ds/ui-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            AXIS Design System
          </h1>
          <ThemeToggle />
        </header>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Button Variants</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Input</h2>
          <div className="space-y-3">
            <Input placeholder="Enter your name..." />
            <Input placeholder="Enter your email..." type="email" />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Colors</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-primary p-3 text-primary-foreground">
              Primary
            </div>
            <div className="rounded-lg bg-secondary p-3 text-secondary-foreground">
              Secondary
            </div>
            <div className="rounded-lg bg-muted p-3 text-muted-foreground">
              Muted
            </div>
            <div className="rounded-lg bg-destructive p-3 text-destructive-foreground">
              Destructive
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
