'use client'

import { useState } from 'react'
import type { WorkforceFlowMonth } from '../lib/demo-data'

interface WorkforceFlowChartProps {
  data: WorkforceFlowMonth[]
}

export function WorkforceFlowChart({ data }: WorkforceFlowChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // 차트 영역 크기
  const W = 720
  const H = 320
  const padL = 50
  const padR = 50
  const padT = 20
  const padB = 40
  const chartW = W - padL - padR
  const chartH = H - padT - padB

  // 바 스케일 (유입/유출)
  const maxBar = Math.max(...data.map((d) => Math.max(d.inflow, d.outflow)))
  const barScale = chartH / (maxBar * 1.3)
  const barW = chartW / data.length * 0.3
  const gap = chartW / data.length

  // 라인 스케일 (인원수)
  const allHeadcounts = data.flatMap((d) => [d.actualHeadcount, d.predictedHeadcount].filter((v): v is number => v !== null && v > 0))
  const minHC = Math.min(...allHeadcounts) - 10
  const maxHC = Math.max(...allHeadcounts) + 10
  const hcRange = maxHC - minHC || 1

  function hcY(v: number) {
    return padT + chartH - ((v - minHC) / hcRange) * chartH
  }

  // 실제 라인
  const actualPoints = data
    .filter((d) => d.actualHeadcount > 0)
    .map((d, _i) => {
      const idx = data.indexOf(d)
      return `${padL + idx * gap + gap / 2},${hcY(d.actualHeadcount)}`
    })
    .join(' ')

  // 예측 라인
  const predictedPoints = data
    .filter((d) => d.predictedHeadcount !== null)
    .map((d) => {
      const idx = data.indexOf(d)
      return `${padL + idx * gap + gap / 2},${hcY(d.predictedHeadcount!)}`
    })
    .join(' ')

  return (
    <div className="glass-panel p-5">
      <h3 className="text-sm font-semibold mb-4">인력 유입/유출 및 인원 추이</h3>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Y축 눈금 (바) */}
        {[0, Math.round(maxBar / 2), maxBar].map((v) => {
          const y = padT + chartH - v * barScale
          return (
            <g key={`bar-y-${v}`}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="hsl(var(--border))" strokeDasharray="4" />
              <text x={padL - 6} y={y + 4} textAnchor="end" className="fill-muted-foreground" fontSize="10">{v}</text>
            </g>
          )
        })}

        {/* Y축 눈금 (라인) */}
        {[minHC, Math.round((minHC + maxHC) / 2), maxHC].map((v) => (
          <text key={`hc-y-${v}`} x={padL + chartW + 6} y={hcY(v) + 4} textAnchor="start" className="fill-muted-foreground" fontSize="10">
            {v}
          </text>
        ))}

        {/* 바 */}
        {data.map((d, i) => {
          const x = padL + i * gap + gap / 2
          return (
            <g
              key={d.month}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* 유입 바 */}
              {d.inflow > 0 && (
                <rect
                  x={x - barW - 1}
                  y={padT + chartH - d.inflow * barScale}
                  width={barW}
                  height={d.inflow * barScale}
                  rx={2}
                  fill="hsl(var(--chart-blue))"
                  opacity={hoveredIdx === i ? 1 : 0.7}
                  className="transition-opacity"
                />
              )}
              {/* 유출 바 */}
              {d.outflow > 0 && (
                <rect
                  x={x + 1}
                  y={padT + chartH - d.outflow * barScale}
                  width={barW}
                  height={d.outflow * barScale}
                  rx={2}
                  fill="hsl(var(--chart-alert))"
                  opacity={hoveredIdx === i ? 1 : 0.7}
                  className="transition-opacity"
                />
              )}
              {/* X축 레이블 */}
              <text x={x} y={H - padB + 16} textAnchor="middle" className="fill-muted-foreground" fontSize="11">
                {d.month}
              </text>
            </g>
          )
        })}

        {/* 실제 라인 */}
        <polyline
          points={actualPoints}
          fill="none"
          stroke="hsl(var(--chart-success))"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {data.filter((d) => d.actualHeadcount > 0).map((d) => {
          const idx = data.indexOf(d)
          return (
            <circle
              key={`act-${d.month}`}
              cx={padL + idx * gap + gap / 2}
              cy={hcY(d.actualHeadcount)}
              r={3}
              fill="hsl(var(--chart-success))"
            />
          )
        })}

        {/* 예측 라인 (점선) */}
        <polyline
          points={predictedPoints}
          fill="none"
          stroke="hsl(var(--chart-warning))"
          strokeWidth={2}
          strokeDasharray="6 3"
          strokeLinejoin="round"
        />
        {data.filter((d) => d.predictedHeadcount !== null).map((d) => {
          const idx = data.indexOf(d)
          return (
            <circle
              key={`pred-${d.month}`}
              cx={padL + idx * gap + gap / 2}
              cy={hcY(d.predictedHeadcount!)}
              r={3}
              fill="hsl(var(--chart-warning))"
              strokeWidth={1}
              stroke="hsl(var(--background))"
            />
          )
        })}

        {/* 호버 툴팁 */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          (() => {
            const d = data[hoveredIdx]
            const x = padL + hoveredIdx * gap + gap / 2
            return (
              <g>
                <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="hsl(var(--foreground))" strokeOpacity={0.15} />
                <rect x={x - 48} y={padT - 2} width={96} height={38} rx={4} fill="hsl(var(--card))" stroke="hsl(var(--border))" />
                <text x={x} y={padT + 12} textAnchor="middle" className="fill-foreground" fontSize="10" fontWeight="600">
                  유입 {d.inflow} / 유출 {d.outflow}
                </text>
                {(d.actualHeadcount > 0 || d.predictedHeadcount !== null) && (
                  <text x={x} y={padT + 26} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
                    인원 {d.actualHeadcount > 0 ? d.actualHeadcount : d.predictedHeadcount}
                  </text>
                )}
              </g>
            )
          })()
        )}
      </svg>

      {/* 범례 */}
      <div className="flex gap-5 mt-3 text-xs text-muted-foreground justify-center">
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[hsl(217,91%,60%)] inline-block" /> 유입</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[hsl(0,72%,51%)] inline-block" /> 유출</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[hsl(142,71%,45%)] inline-block" /> 실제 인원</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[hsl(38,92%,50%)] inline-block border-dashed" /> 예측 인원</span>
      </div>
    </div>
  )
}
