/** Tailwind 3 를 PostCSS 플러그인으로 돌립니다(없으면 @tailwind 지시문이 그대로 남아 유틸리티가 생성되지 않음, WI-0037) */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
