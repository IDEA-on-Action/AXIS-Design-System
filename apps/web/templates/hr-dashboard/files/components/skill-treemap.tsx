'use client'

import { useState, useMemo } from 'react'
import type { SkillNode } from '../lib/demo-data'

interface SkillTreemapProps {
  data: SkillNode[]
}

interface TreemapRect {
  x: number
  y: number
  w: number
  h: number
  node: SkillNode
}

/** Squarified treemap 알고리즘 (단순화 버전) */
function squarify(nodes: SkillNode[], x: number, y: number, w: number, h: number): TreemapRect[] {
  const total = nodes.reduce((s, n) => s + n.value, 0)
  if (total === 0 || nodes.length === 0) return []

  const rects: TreemapRect[] = []
  let cx = x
  let cy = y
  let cw = w
  let ch = h
  const sorted = [...nodes].sort((a, b) => b.value - a.value)

  let remaining = total

  let i = 0
  while (i < sorted.length) {
    const isHorizontal = cw >= ch
    const side = isHorizontal ? ch : cw

    // 한 행(row)에 들어갈 노드 모음
    const row: SkillNode[] = [sorted[i]]
    let rowSum = sorted[i].value
    let bestAspect = Infinity

    for (let j = i + 1; j < sorted.length; j++) {
      const testSum = rowSum + sorted[j].value
      const fraction = testSum / remaining
      const rowLength = isHorizontal ? cw * fraction : ch * fraction

      // worst aspect ratio 계산
      let worstAspect = 0
      let accum = 0
      for (const item of [...row, sorted[j]]) {
        accum += item.value
        const itemFraction = item.value / testSum
        const itemLen = side * itemFraction
        const aspect = Math.max(rowLength / itemLen, itemLen / rowLength)
        worstAspect = Math.max(worstAspect, aspect)
      }

      if (row.length === 1) {
        bestAspect = worstAspect
        row.push(sorted[j])
        rowSum = testSum
      } else if (worstAspect <= bestAspect) {
        bestAspect = worstAspect
        row.push(sorted[j])
        rowSum = testSum
      } else {
        break
      }
    }

    // 행 배치
    const fraction = rowSum / remaining
    const rowLength = isHorizontal ? cw * fraction : ch * fraction

    let offset = 0
    for (const item of row) {
      const itemFraction = item.value / rowSum
      const itemLen = side * itemFraction

      if (isHorizontal) {
        rects.push({ x: cx, y: cy + offset, w: rowLength, h: itemLen, node: item })
      } else {
        rects.push({ x: cx + offset, y: cy, w: itemLen, h: rowLength, node: item })
      }
      offset += itemLen
    }

    // 남은 공간 갱신
    if (isHorizontal) {
      cx += rowLength
      cw -= rowLength
    } else {
      cy += rowLength
      ch -= rowLength
    }
    remaining -= rowSum
    i += row.length
  }

  return rects
}

export function SkillTreemap({ data }: SkillTreemapProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  const W = 480
  const H = 280
  const rects = useMemo(() => squarify(data, 0, 0, W, H), [data])

  return (
    <div className="glass-panel p-5">
      <h3 className="text-sm font-semibold mb-4">스킬 분포</h3>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-md overflow-hidden">
        {rects.map((rect) => {
          const isHovered = hovered === rect.node.name
          return (
            <g
              key={rect.node.name}
              onMouseEnter={() => setHovered(rect.node.name)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <rect
                x={rect.x + 1}
                y={rect.y + 1}
                width={Math.max(0, rect.w - 2)}
                height={Math.max(0, rect.h - 2)}
                rx={4}
                fill={rect.node.color}
                opacity={isHovered ? 1 : 0.75}
                className="transition-opacity duration-150"
              />
              {rect.w > 40 && rect.h > 28 && (
                <>
                  <text
                    x={rect.x + rect.w / 2}
                    y={rect.y + rect.h / 2 - 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize={rect.w > 80 ? 13 : 10}
                    fontWeight="600"
                  >
                    {rect.node.name}
                  </text>
                  <text
                    x={rect.x + rect.w / 2}
                    y={rect.y + rect.h / 2 + 12}
                    textAnchor="middle"
                    fill="white"
                    fontSize={9}
                    opacity={0.8}
                  >
                    {rect.node.value}명
                  </text>
                </>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
