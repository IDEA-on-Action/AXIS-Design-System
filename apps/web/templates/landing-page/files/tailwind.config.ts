import type { Config } from 'tailwindcss'
import axisPreset from '@axis-ds/tokens/tailwind'

/** 색 · 둥글기 · 글꼴(Pretendard 스택) · darkMode 는 AXIS preset 이 정합니다 */
const config: Config = {
  presets: [axisPreset],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  plugins: [],
}

export default config
