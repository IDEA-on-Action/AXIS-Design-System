import { test, expect, type Page } from '@playwright/test'

/**
 * Tooltip 지속성 E2E (WI-0073 · WCAG 1.4.13 지속성).
 *
 * Radix Tooltip 은 트리거를 담은 요소가 스크롤되면 닫힌다. 화면 밖 트리거로 Tab 하면 브라우저가 트리거를
 * 화면 안으로 스크롤하고, 그 스크롤이 막 열린 툴팁을 닫아 키보드 사용자는 툴팁을 보지 못했다(1280x720 실측).
 * ui-react 래퍼는 트리거에 포커스가 있는 동안 스크롤로 생긴 닫힘만 무시한다. 판정은 E2E_SERVER=static 결과예요.
 *
 * 대조:
 * - 720 높이: 첫 트리거 「Hover me」는 Tab 때 스크롤된다(scrollY > 0 을 먼저 단언해 재현 조건을 증명).
 * - 3000 높이: 스크롤이 없는 음성 대조. 5개 트리거가 모두 열린 채여야 한다(회귀 없음).
 * - 정상 닫힘 경로 3가지(Esc · 포인터 이탈 · 다른 요소 포커스)와 포커스 없는 hover 툴팁의 스크롤 닫힘은 그대로다.
 * 테스트 6건.
 */

const PATH = '/components/tooltip/'
const TRIGGERS = ['Hover me', 'Top', 'Right', 'Bottom', 'Left'] as const
/** Radix 기본 delayDuration(700ms) 보다 길게 기다려 hover 열림을 확정한다 */
const HOVER_WAIT = 1000
/** 재현 당시 닫힘을 관측한 대기 시간 */
const SETTLE = 800

async function focusedText(page: Page) {
  return page.evaluate(() => (document.activeElement?.textContent ?? '').trim())
}

/** 문서 처음부터 Tab 으로 이동해 해당 글자의 트리거에 포커스한다(키보드 실경로, focus() 직접 호출 아님) */
async function tabTo(page: Page, text: string) {
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press('Tab')
    if ((await focusedText(page)) === text) return
  }
  throw new Error(`Tab 120번 안에 「${text}」 트리거에 닿지 못했어요`)
}

function trigger(page: Page, text: string) {
  return page.getByRole('button', { name: text, exact: true })
}

const tooltips = (page: Page) => page.locator('[role="tooltip"]')

test.describe('tooltip persistence (1280x720)', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test.beforeEach(async ({ page }) => {
    await page.goto(PATH, { waitUntil: 'networkidle' })
  })

  test('화면 밖 트리거로 Tab 하면 스크롤 뒤에도 열린 채 남는다', async ({ page }) => {
    expect(await page.evaluate(() => scrollY)).toBe(0)
    await tabTo(page, 'Hover me')
    await page.waitForTimeout(SETTLE)
    // 재현 조건: 포커스 때문에 스크롤이 실제로 일어났다
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0)
    await expect(trigger(page, 'Hover me')).toHaveAttribute('data-state', /open/)
    await expect(tooltips(page)).toHaveCount(1)
    await expect(tooltips(page)).toHaveText('Tooltip content')
  })

  test('Esc 를 누르면 닫힌다', async ({ page }) => {
    await tabTo(page, 'Hover me')
    await page.waitForTimeout(SETTLE)
    await expect(tooltips(page)).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(trigger(page, 'Hover me')).toHaveAttribute('data-state', 'closed')
    await expect(tooltips(page)).toHaveCount(0)
    // 포커스는 트리거에 남는다(닫힘은 포커스 이동 때문이 아니다)
    expect(await focusedText(page)).toBe('Hover me')
  })

  test('다른 요소로 포커스가 옮겨 가면 닫히고 다음 트리거가 열린다', async ({ page }) => {
    await tabTo(page, 'Hover me')
    await page.waitForTimeout(SETTLE)
    await page.keyboard.press('Tab')
    expect(await focusedText(page)).toBe('Top')
    await page.waitForTimeout(SETTLE)
    await expect(trigger(page, 'Hover me')).toHaveAttribute('data-state', 'closed')
    await expect(trigger(page, 'Top')).toHaveAttribute('data-state', /open/)
    await expect(tooltips(page)).toHaveCount(1)
    await expect(tooltips(page)).toHaveText('Top tooltip')
  })

  test('포인터 이탈 · 포커스 없는 hover 중 스크롤은 이전처럼 닫힌다', async ({ page }) => {
    const top = trigger(page, 'Top')
    await top.scrollIntoViewIfNeeded()
    // 포인터 이탈
    await top.hover()
    await page.waitForTimeout(HOVER_WAIT)
    await expect(top).toHaveAttribute('data-state', /open/)
    await page.mouse.move(5, 5, { steps: 10 })
    await expect(top).toHaveAttribute('data-state', 'closed')
    await expect(tooltips(page)).toHaveCount(0)
    // 포커스 없이 hover 로 연 툴팁은 스크롤에 닫힌다(Radix 기본 동작 유지)
    await top.hover()
    await page.waitForTimeout(HOVER_WAIT)
    await expect(top).toHaveAttribute('data-state', /open/)
    expect(await focusedText(page)).not.toBe('Top')
    await page.evaluate(() => window.scrollBy(0, 40))
    await expect(top).toHaveAttribute('data-state', 'closed')
  })
})

test.describe('tooltip persistence (1280x3000)', () => {
  test.use({ viewport: { width: 1280, height: 3000 } })

  test('스크롤이 없으면 5개 트리거 모두 Tab 뒤 열린 채다(음성 대조)', async ({ page }) => {
    await page.goto(PATH, { waitUntil: 'networkidle' })
    for (const text of TRIGGERS) {
      await tabTo(page, text)
      await page.waitForTimeout(SETTLE)
      expect(await page.evaluate(() => scrollY)).toBe(0)
      await expect(trigger(page, text)).toHaveAttribute('data-state', /open/)
      await expect(tooltips(page)).toHaveCount(1)
    }
  })

  test('스크롤이 없을 때도 Esc 로 닫힌다', async ({ page }) => {
    await page.goto(PATH, { waitUntil: 'networkidle' })
    await tabTo(page, 'Hover me')
    await page.waitForTimeout(SETTLE)
    await expect(tooltips(page)).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(tooltips(page)).toHaveCount(0)
  })
})
