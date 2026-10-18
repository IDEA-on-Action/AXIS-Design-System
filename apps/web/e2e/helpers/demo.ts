import { expect, type Page } from '@playwright/test'

/**
 * 브랜드 전환 데모 페이지(/docs/brand-demo/) 진입 공용 헬퍼 (WI-0025 FR-10 · AC7).
 *
 * brand-demo.spec.ts 와 brand-nontext-contrast.spec.ts 가 같이 써요.
 * 컨트롤 준비 대기(`data-ready`)를 spec 마다 복제하면 한쪽만 바뀌어 낡으므로 여기 한 곳에 둬요.
 */
export const DEMO_PATH = '/docs/brand-demo/'

/** 페이지 오류 · 콘솔 오류 수집 (하이드레이션 불일치 #418 등) */
export function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })
  return errors
}

/** 데모 페이지를 열고 전환 컨트롤이 준비될 때까지 기다려요 */
export async function openDemo(page: Page) {
  await page.goto(DEMO_PATH)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('brand-demo-controls')).toHaveAttribute('data-ready', 'true')
}

/** 전환 컨트롤의 라디오 (이름 정확히 일치) */
export const radio = (page: Page, name: string) => page.getByRole('radio', { name, exact: true })
