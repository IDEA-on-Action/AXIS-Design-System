import type { Page } from '@playwright/test'

/**
 * 페이지 로드 전에 `<html>` 에 `data-brand` 를 붙이는 공용 헬퍼 (WI-0025 AC6 · AC8).
 *
 * `page.goto` 전에 호출합니다. 문서가 만들어질 때마다(새로고침 · 이동 포함) 다시 붙습니다.
 * init 스크립트 시점에 `<html>` 이 아직 없으면 DOMContentLoaded 에서 붙입니다.
 * `page.setContent` 는 init 스크립트를 거치지 않을 수 있으므로, setContent 검사는 HTML 에 속성을 직접 적습니다.
 */
export async function applyBrand(page: Page, brand: string): Promise<void> {
  await page.addInitScript((name: string) => {
    const set = () => document.documentElement?.setAttribute('data-brand', name)
    if (document.documentElement) set()
    document.addEventListener('DOMContentLoaded', set, { once: true })
  }, brand)
}
