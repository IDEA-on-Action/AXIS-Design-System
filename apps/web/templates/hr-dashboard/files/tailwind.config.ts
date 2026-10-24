import type { Config } from 'tailwindcss'
import axisPreset from '@axis-ds/tokens/tailwind'

/**
 * 색 · 둥글기 · 글꼴(Pretendard 스택) · darkMode 는 AXIS preset 이 정합니다.
 * 템플릿 로컬 확장은 두 가지뿐입니다.
 * - status: AXIS 상태 색(--axis-status-*). 값이 hex 라 Tailwind 3 의 `/20` 투명도 수식이 붙지 않아
 *   옅은 배경은 status-soft(color-mix 20%)로 따로 둡니다
 * - fade-in-up: KPI 카드 진입 애니메이션
 * 차트 · Zone 색은 preset 의 chart-1~5(--chart-1~5)를 씁니다
 */
const config: Config = {
  presets: [axisPreset],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        status: {
          success: 'var(--axis-status-success)',
          warning: 'var(--axis-status-warning)',
          error: 'var(--axis-status-error)',
        },
        'status-soft': {
          success: 'color-mix(in srgb, var(--axis-status-success) 20%, transparent)',
          warning: 'color-mix(in srgb, var(--axis-status-warning) 20%, transparent)',
          error: 'color-mix(in srgb, var(--axis-status-error) 20%, transparent)',
        },
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
