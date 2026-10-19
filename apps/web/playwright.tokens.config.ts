import { defineConfig, devices } from '@playwright/test'

/**
 * 토큰 CSS 계산값 회귀 테스트 설정 (WI-0033 다크 토큰, WI-0025 AC6 브랜드).
 *
 * 빌드된 `@axis-ds/tokens` CSS 를 `page.setContent` 로 올려 재므로 개발 서버(webServer)를 띄우지 않습니다.
 * 실행: `pnpm --filter @ax/web test:e2e:tokens`
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: ['dark-tokens.spec.ts', 'brand-tokens.spec.ts'],
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
