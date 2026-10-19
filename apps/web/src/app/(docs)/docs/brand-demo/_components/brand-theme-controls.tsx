'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { setDocumentBrand, useClearBrandOnLeave, useDocumentBrand, type DemoBrand } from './document-brand'

const BRAND_OPTIONS: { value: DemoBrand; label: string }[] = [
  { value: 'default', label: '기본' },
  { value: 'ontology', label: 'Ontology' },
]

const THEME_OPTIONS: { value: 'system' | 'light' | 'dark'; label: string }[] = [
  { value: 'system', label: '시스템' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
]

function brandLabel(brand: string): string {
  return BRAND_OPTIONS.find((option) => option.value === brand)?.label ?? brand
}

/**
 * 브랜드 · 테마 전환 컨트롤 (WI-0025 FR-10 · AC7).
 *
 * 네이티브 fieldset · legend · radio 를 써요. 화살표 키 이동 · 단일 탭 정지 · 체크 상태 낭독이 브라우저 기본이고,
 * 측정 대상인 패키지 RadioGroup 으로 컨트롤을 만들면 검사가 자기 자신을 재는 순환이 생겨요.
 * 하이드레이션 전에는 fieldset 을 disabled 로 두고 아무것도 체크하지 않아요(서버는 브랜드 · 테마를 몰라요).
 * 테마는 next-themes 전역 상태(헤더 ThemeToggle 과 같은 저장소)를 그대로 써요. `.dark` 클래스는 직접 만지지 않아요.
 */
export function BrandThemeControls() {
  const brand = useDocumentBrand()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [ready, setReady] = useState(false)

  useClearBrandOnLeave()

  // 마운트 때는 ready 만 켜요. data-brand 속성은 건드리지 않아요.
  useEffect(() => {
    setReady(true)
  }, [])

  const active = ready && brand !== null
  const themeLabel = resolvedTheme === 'dark' ? '다크' : '라이트'

  return (
    <div
      data-testid="brand-demo-controls"
      data-ready={active ? 'true' : 'false'}
      className="rounded-lg border bg-card p-4 text-card-foreground"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
        <fieldset disabled={!active} className="min-w-0">
          <legend className="mb-2 text-sm font-semibold">브랜드</legend>
          <div className="flex flex-wrap gap-4">
            {BRAND_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="demo-brand"
                  value={option.value}
                  checked={active && brand === option.value}
                  onChange={() => setDocumentBrand(option.value)}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset disabled={!active} className="min-w-0">
          <legend className="mb-2 text-sm font-semibold">테마</legend>
          <div className="flex flex-wrap gap-4">
            {THEME_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="demo-theme"
                  value={option.value}
                  checked={active && theme === option.value}
                  onChange={() => setTheme(option.value)}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <p data-testid="brand-demo-current" aria-live="polite" className="mt-4 text-sm">
        {active
          ? `현재: 브랜드 ${brandLabel(brand ?? '')} · 테마 ${themeLabel}${theme === 'system' ? ' (시스템)' : ''}`
          : '현재 설정을 읽는 중이에요'}
      </p>
    </div>
  )
}
