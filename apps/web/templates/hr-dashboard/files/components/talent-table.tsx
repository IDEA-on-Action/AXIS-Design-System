'use client'

import { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { cn } from '../lib/utils'
import { type TalentRow, departments } from '../lib/demo-data'

interface TalentTableProps {
  data: TalentRow[]
}

type SortKey = 'name' | 'experience' | 'rating'
type SortDir = 'asc' | 'desc'

const ratingOrder: Record<string, number> = { S: 4, A: 3, B: 2, C: 1 }
const ratingColor: Record<string, string> = {
  S: 'bg-chart-success/20 text-chart-success',
  A: 'bg-chart-blue/20 text-chart-blue',
  B: 'bg-chart-warning/20 text-chart-warning',
  C: 'bg-chart-alert/20 text-chart-alert',
}
const riskColor: Record<string, string> = {
  low: 'text-chart-success',
  mid: 'text-chart-warning',
  high: 'text-chart-alert',
}
const riskLabel: Record<string, string> = { low: '낮음', mid: '보통', high: '높음' }

export function TalentTable({ data }: TalentTableProps) {
  const [dept, setDept] = useState('전체')
  const [sortKey, setSortKey] = useState<SortKey>('rating')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggle = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const filtered = dept === '전체' ? data : data.filter((r) => r.department === dept)
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
    else if (sortKey === 'experience') cmp = a.experience - b.experience
    else cmp = (ratingOrder[a.rating] ?? 0) - (ratingOrder[b.rating] ?? 0)
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">인재 현황</h3>
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="text-xs bg-secondary text-secondary-foreground rounded-md px-2 py-1 border border-border"
        >
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 font-medium text-muted-foreground">ID</th>
              <th className="pb-2 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggle('name')}>
                <span className="inline-flex items-center gap-1">이름 <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th className="pb-2 font-medium text-muted-foreground">부서</th>
              <th className="pb-2 font-medium text-muted-foreground">역할</th>
              <th className="pb-2 font-medium text-muted-foreground">스킬</th>
              <th className="pb-2 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggle('experience')}>
                <span className="inline-flex items-center gap-1">경력 <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th className="pb-2 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggle('rating')}>
                <span className="inline-flex items-center gap-1">평가 <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th className="pb-2 font-medium text-muted-foreground">이직위험</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                <td className="py-2.5 text-muted-foreground">{row.id}</td>
                <td className="py-2.5 font-medium">{row.name}</td>
                <td className="py-2.5 text-muted-foreground">{row.department}</td>
                <td className="py-2.5 text-muted-foreground">{row.role}</td>
                <td className="py-2.5">
                  <div className="flex gap-1 flex-wrap">
                    {row.skills.map((s) => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-secondary text-[11px]">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5">{row.experience}년</td>
                <td className="py-2.5">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', ratingColor[row.rating])}>
                    {row.rating}
                  </span>
                </td>
                <td className={cn('py-2.5 text-xs font-medium', riskColor[row.riskLevel])}>
                  {riskLabel[row.riskLevel]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
