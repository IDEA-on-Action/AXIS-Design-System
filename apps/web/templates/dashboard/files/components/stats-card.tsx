interface StatsCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
}

export function StatsCard({ title, value, change, trend }: StatsCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p
        className={`text-xs mt-1 ${
          trend === 'up'
            ? 'text-[var(--axis-status-success-strong)] dark:text-[var(--axis-status-success)]'
            :'text-[var(--axis-status-error-strong)] dark:text-[var(--axis-status-error)]'
        }`}
      >
        {change}
      </p>
    </div>
  )
}
