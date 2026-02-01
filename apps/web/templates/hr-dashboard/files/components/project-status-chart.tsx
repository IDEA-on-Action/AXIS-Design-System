'use client'

import { useState } from 'react'
import type { ProjectStatus } from '../lib/demo-data'

interface ProjectStatusChartProps {
  data: ProjectStatus[]
}

export function ProjectStatusChart({ data }: ProjectStatusChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // SVG 도넛 계산
  const cx = 80
  const cy = 80
  const r = 60
  const circumference = 2 * Math.PI * r

  let accumulated = 0
  const arcs = data.map((d) => {
    const ratio = d.value / total
    const dashLength = ratio * circumference
    const dashOffset = circumference - accumulated * circumference
    accumulated += ratio
    return { ...d, dashLength, dashOffset, ratio }
  })

  const centerLabel = hoveredIndex !== null ? data[hoveredIndex] : null

  return (
    <div className="glass-panel p-5">
      <h3 className="text-sm font-semibold mb-4">프로젝트 현황</h3>

      <div className="flex items-center gap-6">
        {/* 도넛 */}
        <svg
          viewBox="0 0 160 160"
          className="w-36 h-36 flex-shrink-0"
        >
          {arcs.map((arc, i) => (
            <circle
              key={arc.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={hoveredIndex === i ? 22 : 18}
              strokeDasharray={`${arc.dashLength} ${circumference - arc.dashLength}`}
              strokeDashoffset={arc.dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
          {/* 중앙 텍스트 */}
          <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground text-2xl font-bold" fontSize="22">
            {centerLabel ? centerLabel.value : total}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground text-[10px]" fontSize="10">
            {centerLabel ? centerLabel.label : '전체'}
          </text>
        </svg>

        {/* 범례 */}
        <div className="flex flex-col gap-2 text-sm">
          {data.map((d, i) => (
            <div
              key={d.label}
              className="flex items-center gap-2 cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span
                className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-muted-foreground">{d.label}</span>
              <span className="font-semibold ml-auto">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
