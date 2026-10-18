/**
 * 브랜드 계산 스타일 기대값 (WI-0025 AC6).
 *
 * 값의 원천은 PRD 부록 A(docs/workitems/WI-0025-brand-theme/prd.md, v1 기준)입니다.
 * 빌드 산출물(dist)에서 읽지 않고 문서 값을 손으로 옮겨 적었으므로, 산출물이 바뀌면 이 표와 어긋나 테스트가 실패합니다.
 * brand-tokens.spec.ts(AC6)와 a11y spec 이 같은 표를 import 합니다.
 */

export type ThemeName = 'light' | 'dark'

/** AC6 검사 대상 `--axis-*` 6개 (부록 A, 계산값이 hex 와 정확히 같아야 함) */
export const AC6_AXIS_VARS = [
  '--axis-button-bg-default',
  '--axis-button-text-default',
  '--axis-surface-default',
  '--axis-text-primary',
  '--axis-text-secondary',
  '--axis-border-focus',
] as const

/** AC6 검사 대상 shadcn HSL 변수 (렌더 rgb 를 채널당 ±1 로 비교) */
export const AC6_SHADCN_VARS = ['--primary'] as const

export type Ac6AxisVar = (typeof AC6_AXIS_VARS)[number]
export type Ac6ShadcnVar = (typeof AC6_SHADCN_VARS)[number]

/** shadcn HSL 렌더 비교 허용 오차 (채널당, PRD AC6 2026-10-16 결정) */
export const SHADCN_RGB_TOLERANCE = 1

export interface BrandThemeExpectation {
  /** `--axis-*` 변수의 기대 hex (대문자 #RRGGBB) */
  axis: Record<Ac6AxisVar, string>
  /** shadcn HSL 변수가 렌더돼야 하는 hex (대문자 #RRGGBB) */
  shadcn: Record<Ac6ShadcnVar, string>
}

/** ontology 브랜드 기대값 (부록 A) */
export const ONTOLOGY_EXPECTED: Record<ThemeName, BrandThemeExpectation> = {
  light: {
    axis: {
      '--axis-button-bg-default': '#326ADA', // key
      '--axis-button-text-default': '#FFFFFF', // on-key
      '--axis-surface-default': '#FFFFFF', // card
      '--axis-text-primary': '#111418', // ink
      '--axis-text-secondary': '#5F6673', // sub (AA 보정)
      '--axis-border-focus': '#326ADA', // key
    },
    shadcn: {
      '--primary': '#326ADA', // key, 원문 220 69.4% 52.5%
    },
  },
  dark: {
    axis: {
      '--axis-button-bg-default': '#6B98F0',
      '--axis-button-text-default': '#0E1013',
      '--axis-surface-default': '#17191D',
      '--axis-text-primary': '#F1F3F5',
      '--axis-text-secondary': '#9CA3AD',
      '--axis-border-focus': '#6B98F0',
    },
    shadcn: {
      '--primary': '#6B98F0', // key, 원문 219.7 81.6% 68%
    },
  },
}

/** 브랜드 이름별 기대값 (지금은 ontology 하나) */
export const BRAND_EXPECTED = {
  ontology: ONTOLOGY_EXPECTED,
} as const

export type ExpectedBrandName = keyof typeof BRAND_EXPECTED

/** `#RRGGBB` 를 [r, g, b] 로 */
export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim())
  if (!m) throw new Error(`hex 형식 아님: ${hex}`)
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
}

/** 계산 스타일 `rgb(r, g, b)` · `rgba(r, g, b, 1)` 를 [r, g, b] 로 (알파가 1 이 아니면 실패) */
export function parseCssRgb(value: string): [number, number, number] {
  const m = /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/.exec(value.trim())
  if (!m) throw new Error(`rgb 형식 아님: ${value}`)
  if (m[4] !== undefined && Number(m[4]) !== 1) throw new Error(`불투명 색 아님: ${value}`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

/** 채널당 최대 차이 */
export function maxChannelDiff(a: [number, number, number], b: [number, number, number]): number {
  return Math.max(...a.map((v, i) => Math.abs(v - b[i])))
}

/**
 * 브랜드별 모양 기대값 (WI-0025 FR-9 · Q9, 브랜드 전환 데모 spec 이 씁니다).
 *
 * 출처는 PRD FR-9(prd.md 「FR-9」 줄과 변경 주석)이고, 손으로 옮겨 적었습니다.
 * - 둥글기: `--radius` 기본 0.5rem(8px) · ontology 12px. Card `rounded-lg` = `--radius`, Button `rounded-md` = `--radius` - 2px.
 * - PlanCard 왼쪽 색 선: `--axis-plan-card-accent-width` 기본 4px · ontology 1px(plan U8).
 * - Card 그림자: `--axis-card-shadow` 기본 `0 1px 2px 0 rgb(0 0 0 / 0.05)` · ontology `0 0 #0000`(plan U2).
 *   계산 box-shadow 는 ring-offset · ring · shadow 세 레이어이고 앞 두 레이어는 늘 알파 0 이라,
 *   첫 레이어만 읽으면 ontology 의 「알파 0」 단언이 브랜드 CSS 없이도 통과합니다. 그래서 모든 레이어의 최대 알파로 비교합니다.
 * 라이트 · 다크 값이 같습니다(ontology 다크는 이 셋을 다시 정의하지 않음).
 */
export const SHAPE_EXPECTED = {
  default: { cardRadius: '8px', buttonRadius: '6px', planCardAccentWidth: '4px', cardShadowMaxAlpha: 0.05 },
  ontology: { cardRadius: '12px', buttonRadius: '10px', planCardAccentWidth: '1px', cardShadowMaxAlpha: 0 },
} as const

/**
 * 계산 box-shadow 의 모든 레이어 중 최대 알파 (`none` 은 0).
 * 색 표기 `rgb(r, g, b)` · `rgba(r, g, b, a)` 를 레이어마다 찾아 읽습니다(쉼표로 단순히 나누면 rgba 안 쉼표에서 깨짐).
 */
export function maxShadowAlpha(boxShadow: string): number {
  if (boxShadow.trim() === 'none') return 0
  const colors = [...boxShadow.matchAll(/rgba?\(([^)]*)\)/g)]
  if (colors.length === 0) throw new Error(`box-shadow 색을 읽지 못함: ${boxShadow}`)
  return Math.max(
    ...colors.map((m) => {
      const parts = m[1].split(',').map((p) => p.trim())
      return parts.length === 4 ? Number(parts[3]) : 1
    }),
  )
}
