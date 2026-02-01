'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../lib/utils'
import type { KpiItem } from '../lib/demo-data'

const zoneBarColor: Record<KpiItem['zone'], string> = {
  ingest: 'bg-zone-ingest',
  struct: 'bg-zone-struct',
  graph: 'bg-zone-graph',
  path: 'bg-zone-path',
}

interface KpiCardGridProps {
  items: KpiItem[]
}

export function KpiCardGrid({ items }: KpiCardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            'glass-panel relative overflow-hidden p-5 opacity-0 animate-fade-in-up',
            i === 0 && 'stagger-1',
            i === 1 && 'stagger-2',
            i === 2 && 'stagger-3',
            i === 3 && 'stagger-4'
          )}
        >
          {/* Zone accent bar */}
          <div className={cn('absolute top-0 left-0 right-0 h-1', zoneBarColor[item.zone])} />

          <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
          <p className="text-2xl font-bold tracking-tight">{item.value}</p>

          <div className="mt-2 flex items-center gap-1 text-xs">
            {item.change >= 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-chart-success" />
                <span className="text-chart-success">+{item.change}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 text-chart-alert" />
                <span className="text-chart-alert">{item.change}%</span>
              </>
            )}
            <span className="text-muted-foreground">전월 대비</span>
          </div>
        </div>
      ))}
    </div>
  )
}
