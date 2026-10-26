import type { Config } from 'tailwindcss'
import axisPreset from '@axis-ds/tokens/tailwind'
import animate from 'tailwindcss-animate'

/**
 * 색 · 둥글기 · 글꼴(Pretendard 스택) · darkMode 는 AXIS preset 이 정합니다.
 * content 의 마지막 줄은 @axis-ds/ui-react 컴포넌트가 쓰는 클래스를 생성하려고 설치본 dist 를 덮습니다
 * (빼면 Button 이 투명 · 둥글기 0 이 되고 `axis check` 의 tailwind.content 가 FAIL)
 */
const config: Config = {
  presets: [axisPreset],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}',
  ],
  plugins: [animate],
}

export default config
