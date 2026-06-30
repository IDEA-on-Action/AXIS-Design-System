import { defineConfig, devices } from '@playwright/test'

/**
 * E2E a11y 테스트 설정 (WI-0021).
 *
 * next dev 서버를 띄우고 실제 브라우저(Chromium)에서 문서 페이지에 axe를 실행한다.
 * jsdom 단위 테스트(WI-0020)가 못 잡는 색상 대비·실제 렌더링을 검증한다.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
