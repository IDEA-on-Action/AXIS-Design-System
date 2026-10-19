import { expect, type Page } from '@playwright/test'

/**
 * 브랜드 전환 데모 페이지(/docs/brand-demo/) 진입 공용 헬퍼 (WI-0025 FR-10 · AC7).
 *
 * brand-demo.spec.ts 와 brand-nontext-contrast.spec.ts 가 데모 진입(openDemo)에 같이 써요.
 * 첫 진입의 컨트롤 준비 대기(`data-ready`)는 openDemo 에 둬요. 새로고침 · 뒤로 가기 뒤의 같은 대기(brand-demo.spec.ts T2 · T3)와
 * a11y.spec.ts 의 PAGES readySelector · DEMO_PATH 는 아직 각 spec 에 따로 있으니, 대기 조건을 바꾸면 그 셋도 함께 고쳐요.
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
