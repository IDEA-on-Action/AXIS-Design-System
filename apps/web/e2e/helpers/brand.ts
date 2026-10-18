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

/**
 * <html> 의 브랜드 속성과 계산 스타일을 읽는다.
 * a11y spec 과 브랜드 전환 데모 spec(brand-demo.spec.ts)이 같이 써요.
 * 변수 원문은 프로덕션 CSS 압축으로 표기가 바뀌므로(#FFFFFF -> #FFF) 원문이 아니라 렌더 rgb 로 비교한다.
 */
export async function readBrandState(page: Page, vars: readonly string[]) {
  return page.evaluate((names) => {
    const html = document.documentElement
    const probe = document.createElement('span')
    html.appendChild(probe)
    const render = (expr: string) => {
      probe.style.color = ''
      probe.style.color = expr
      return getComputedStyle(probe).color
    }
    const rendered: Record<string, string> = {}
    for (const n of names) rendered[n] = render(`var(${n}, rgb(1, 2, 3))`)
    const primaryRgb = render('hsl(var(--primary))')
    probe.remove()
    return { brand: html.getAttribute('data-brand'), rendered, primaryRgb }
  }, vars)
}
