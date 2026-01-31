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
          trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}
      >
        {change}
      </p>
    </div>
  )
}
