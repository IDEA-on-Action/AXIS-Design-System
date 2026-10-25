import type { Config } from 'tailwindcss'

/**
 * AXIS 컴포넌트가 쓰는 keyframes (WI-0046)
 *
 * - accordion-down · accordion-up: @axis-ds/ui-react Accordion 열고 닫기(Radix 가 주는 --radix-accordion-content-height)
 * - progress-indeterminate: @axis-ds/ui-react Progress 불확정 상태. 막대 폭의 1/3 인 표시기가 왼쪽 끝과 오른쪽 끝을
 *   왕복합니다(translateX 는 표시기 자신의 폭 기준이라 200% 가 트랙 오른쪽 끝)
 *
 * Tailwind 3 preset 과 Tailwind 4 진입점(scripts/tailwind4.mjs 가 @keyframes 와 --animate-* 로 옮김)이 같은 출처로 씁니다.
 * preset 을 쓰지 않는 앱은 이 두 객체만 theme.extend 에 넣을 수 있습니다.
 * Dialog · Popover 등이 쓰는 animate-in · fade-in-0 류 열고 닫는 클래스는 여기 없습니다(애니메이션 플러그인 몫).
 */
export const axisKeyframes = {
  'accordion-down': {
    from: { height: '0' },
    to: { height: 'var(--radix-accordion-content-height)' },
  },
  'accordion-up': {
    from: { height: 'var(--radix-accordion-content-height)' },
    to: { height: '0' },
  },
  'progress-indeterminate': {
    '0%, 100%': { transform: 'translateX(0)' },
    '50%': { transform: 'translateX(200%)' },
  },
} satisfies Record<string, Record<string, Record<string, string>>>

/** axisKeyframes 를 쓰는 animate-* 유틸리티 (animate-accordion-down · animate-accordion-up · animate-progress-indeterminate) */
export const axisAnimation = {
  'accordion-down': 'accordion-down 0.2s ease-out',
  'accordion-up': 'accordion-up 0.2s ease-out',
  'progress-indeterminate': 'progress-indeterminate 1.5s ease-in-out infinite',
} satisfies Record<keyof typeof axisKeyframes, string>

/**
 * Tailwind 3 의 색 없는 `border` · `border-t` · `hr` 기본 테두리색 (WI-0077)
 *
 * Tailwind 3 preflight 는 `*, ::before, ::after { border: 0 solid theme('borderColor.DEFAULT') }` 를 냅니다.
 * DEFAULT 를 정하지 않으면 Tailwind 기본값 gray-200(#e5e7eb)이 되고, 이 규칙이 `@axis-ds/tokens/css/shadcn` 의
 * `* { border-color: hsl(var(--border)) }` 보다 뒤에 와서 이겨 다크 · 브랜드에서도 회색으로 남았습니다(1.8.0 이하).
 * fallback `220 13% 91%` 는 gray-200 의 HSL(rgb(229, 231, 235))이라 `--border` 를 정의하지 않은 앱(shadcn CSS 를
 * 넣지 않은 앱)은 종전 색을 그대로 씁니다. fallback 이 없으면 그 앱의 테두리가 currentColor(글자색)로 바뀝니다.
 * Tailwind 4 진입점은 이 값을 옮기지 않습니다(scripts/tailwind4.mjs 의 TAILWIND3_ONLY_KEYS, 진입점이 base 레이어로
 * 불러오는 같은 `*` 규칙이 맡음).
 */
const axisBorderColorDefault = 'hsl(var(--border, 220 13% 91%))'

const axisPreset: Partial<Config> = {
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        // 토큰 SSOT(--axis-font-family-*) 참조. 변수 미로드 환경 대비 fallback 포함
        sans: "var(--axis-font-family-sans, 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif)",
        serif: "var(--axis-font-family-serif, ui-serif, Georgia, serif)",
        mono: "var(--axis-font-family-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)",
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderColor: {
        DEFAULT: axisBorderColorDefault,
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: axisKeyframes,
      animation: axisAnimation,
    },
  },
}

export default axisPreset
