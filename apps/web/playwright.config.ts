import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

/**
 * E2E a11y 테스트 설정 (WI-0021 도입, WI-0025 서버 분기 U10).
 *
 * 실제 브라우저(Chromium)에서 문서 페이지에 axe를 실행한다.
 * jsdom 단위 테스트(WI-0020)가 못 잡는 색상 대비·실제 렌더링을 검증한다.
 *
 * 서버 방식(E2E_SERVER):
 * - `dev`(로컬 기본): `next dev`를 3100 포트에 띄운다.
 * - `static`(CI 기본): `pnpm build`가 만든 `out/`을 `python3 -m http.server`로 3101 포트에 띄운다.
 *   next.config.ts 가 trailingSlash: true 라서 `/docs/` 같은 경로는 `out/docs/index.html`로 풀린다.
 *   판정 근거는 static 결과다(dev 결과와 갈릴 수 있음).
 * 포트를 나눈 이유: 로컬에서 reuseExistingServer 가 켜져 있어, 같은 포트면 static 요청이
 * 이미 떠 있는 dev 서버를 조용히 재사용해 측정이 섞인다.
 */
const mode = process.env.E2E_SERVER ?? (process.env.CI ? 'static' : 'dev')
if (mode !== 'static' && mode !== 'dev') {
  throw new Error(`E2E_SERVER 는 static 또는 dev 여야 합니다: ${mode}`)
}

const outDir = join(__dirname, 'out')
// static 인데 out 이 없으면 빈 디렉터리 목록을 서빙해 측정 없이 통과로 읽힐 수 있으므로 설정 단계에서 멈춘다.
if (mode === 'static' && !existsSync(join(outDir, 'index.html'))) {
  throw new Error(`E2E_SERVER=static 인데 ${outDir}/index.html 이 없습니다. 먼저 pnpm --filter @ax/web build 를 실행하세요.`)
}

const server =
  mode === 'static'
    ? {
        command: 'python3 -m http.server 3101 --bind 127.0.0.1 -d out',
        url: 'http://127.0.0.1:3101',
      }
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3100',
      }

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: server.url,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: server.command,
    url: server.url,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
