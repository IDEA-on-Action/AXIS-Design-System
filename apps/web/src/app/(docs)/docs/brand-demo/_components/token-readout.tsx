'use client'

import { useEffect, useState } from 'react'

interface ReadoutRow {
  label: string
  testId: string
  /** 그 요소에서 읽을 계산 스타일 속성 */
  property: 'border-radius' | 'box-shadow' | 'background-color' | 'border-left-width'
  /** 대상 요소가 래퍼 안쪽에 있을 때 쓰는 선택자 */
  inner?: string
}

const ROWS: ReadoutRow[] = [
  { label: 'Card 둥글기', testId: 'demo-card', property: 'border-radius' },
  { label: 'Card 그림자', testId: 'demo-card', property: 'box-shadow' },
  { label: 'Button 둥글기', testId: 'demo-button-default', property: 'border-radius' },
  { label: 'Button 바탕', testId: 'demo-button-default', property: 'background-color' },
  { label: 'PlanCard 왼쪽 선', testId: 'demo-plan-card', property: 'border-left-width', inner: '[role="region"]' },
]

function findTarget(row: ReadoutRow): HTMLElement | null {
  const host = document.querySelector<HTMLElement>(`[data-testid="${row.testId}"]`)
  return (row.inner ? host?.querySelector<HTMLElement>(row.inner) : host) ?? null
}

function readValues(): string[] {
  return ROWS.map((row) => {
    const el = findTarget(row)
    if (!el) return '찾지 못함'
    return getComputedStyle(el).getPropertyValue(row.property).trim()
  })
}

function sameValues(a: string[] | null, b: string[]): boolean {
  return a !== null && a.length === b.length && a.every((value, index) => value === b[index])
}

/**
 * 지금 화면의 계산 스타일을 글자로 보여 주는 표 (WI-0025 Q9 보조).
 *
 * 색 차이가 작아도 둥글기 · 그림자 · 선 두께가 숫자로 바뀌는 것을 보이려는 안내용이에요.
 * E2E 는 이 표를 근거로 쓰지 않고 실제 요소의 계산 스타일을 직접 재요(자기 증명 방지).
 * `<html>` 의 data-brand · class 가 바뀔 때마다 다음 프레임에 다시 읽어요.
 * Button 처럼 transition-colors 를 쓰는 대상은 그 프레임에 아직 이전 색이라, 대상 요소의
 * transitionend · transitioncancel 때 한 번 더 읽어 전환이 끝난 값을 보여 줘요.
 */
export function TokenReadout() {
  const [values, setValues] = useState<string[] | null>(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = readValues()
        setValues((prev) => (sameValues(prev, next) ? prev : next))
      })
    }
    const onTransitionDone = (event: Event) => {
      const target = event.target
      if (target instanceof Element && ROWS.some((row) => findTarget(row) === target)) update()
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-brand', 'class'] })
    document.addEventListener('transitionend', onTransitionDone, true)
    document.addEventListener('transitioncancel', onTransitionDone, true)
    return () => {
      observer.disconnect()
      document.removeEventListener('transitionend', onTransitionDone, true)
      document.removeEventListener('transitioncancel', onTransitionDone, true)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <table className="w-full text-sm">
      <caption className="mb-2 text-left text-sm text-muted-foreground">지금 화면에서 읽은 계산 스타일</caption>
      <thead>
        <tr className="border-b">
          <th scope="col" className="py-2 pr-4 text-left font-medium">항목</th>
          <th scope="col" className="py-2 text-left font-medium">값</th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row, index) => (
          <tr key={`${row.testId}-${row.property}`} className="border-b last:border-0">
            <th scope="row" className="py-2 pr-4 text-left font-normal">{row.label}</th>
            <td className="py-2 font-mono text-xs break-all" data-testid={`demo-readout-${index}`}>
              {values ? values[index] : '읽는 중'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
