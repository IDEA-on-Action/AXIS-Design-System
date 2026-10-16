import { test, expect, type Page } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 토큰 CSS 다크 계산값 회귀 테스트 (WI-0033).
 *
 * 빌드된 `@axis-ds/tokens` 의 `dist/css/variables.css` 를 Chromium 에 올려 `getComputedStyle` 계산값을 잽니다.
 * 기준선은 같은 파일에서 `.dark` 블록의 component 토큰 줄을 지운 CSS 입니다(수정 전 구성과 같은 204줄).
 * 단언: 라이트 계산값 변경 0, `html.dark` 와 하위 `div.dark` 두 경우 모두 다크 계산값 변경이 아래 29개와 정확히 같음.
 *
 * 실행: `pnpm --filter @axis-ds/tokens build` 뒤 `pnpm --filter @ax/web test:e2e:tokens`
 * (개발 서버가 필요 없도록 `playwright.tokens.config.ts` 를 씁니다)
 */
const TOKENS_DIR = resolve(__dirname, '../../../packages/axis-tokens')
const VARIABLES_CSS = resolve(TOKENS_DIR, 'dist/css/variables.css')
const COMPONENTS_JSON = resolve(TOKENS_DIR, 'src/component/components.json')

/** 다크 계산값이 바뀌어야 하는 component 토큰 (WI-0033 plan 4.1, placeholder · button-text-disabled 는 다크 값이 라이트와 같아 제외) */
const EXPECTED_DARK_CHANGED = [
  '--axis-badge-default-bg',
  '--axis-badge-default-text',
  '--axis-badge-error-bg',
  '--axis-badge-error-text',
  '--axis-badge-info-bg',
  '--axis-badge-info-text',
  '--axis-badge-success-bg',
  '--axis-badge-success-text',
  '--axis-badge-warning-bg',
  '--axis-badge-warning-text',
  '--axis-button-bg-disabled',
  '--axis-button-ghost-bg-active',
  '--axis-button-ghost-bg-hover',
  '--axis-button-ghost-text-default',
  '--axis-button-secondary-bg-active',
  '--axis-button-secondary-bg-default',
  '--axis-button-secondary-bg-hover',
  '--axis-button-secondary-text-default',
  '--axis-card-bg-default',
  '--axis-card-border-default',
  '--axis-dialog-content-bg',
  '--axis-dialog-content-border',
  '--axis-input-bg-default',
  '--axis-input-bg-disabled',
  '--axis-input-border-default',
  '--axis-input-border-error',
  '--axis-input-border-focus',
  '--axis-input-border-hover',
  '--axis-input-text-default',
]

type Scenario = 'light' | 'html-dark' | 'div-dark'

function blockNames(css: string, selector: string): string[] {
  const start = css.indexOf(`${selector} {\n`)
  if (start < 0) throw new Error(`블록 없음: ${selector}`)
  const end = css.indexOf('\n}\n', start)
  return [...css.slice(start, end).matchAll(/^\s*(--[\w-]+):/gm)].map((m) => m[1])
}

/** `.dark` 블록에서 component 토큰 줄을 지운 기준선 CSS */
function withoutDarkComponentLines(css: string, prefixes: string[]): string {
  const start = css.indexOf('.dark {\n')
  const end = css.indexOf('\n}\n', start)
  const body = css
    .slice(start, end)
    .split('\n')
    .filter((line) => !prefixes.some((p) => line.trimStart().startsWith(p)))
    .join('\n')
  return css.slice(0, start) + body + css.slice(end)
}

async function measure(page: Page, css: string, scenario: Scenario, names: string[]) {
  const htmlClass = scenario === 'html-dark' ? ' class="dark"' : ''
  const body = scenario === 'div-dark' ? '<div class="dark"><div id="probe"></div></div>' : '<div id="probe"></div>'
  await page.setContent(`<!doctype html><html${htmlClass}><head><style>${css}</style></head><body>${body}</body></html>`)
  return page.evaluate((ns) => {
    const style = getComputedStyle(document.getElementById('probe') as HTMLElement)
    return Object.fromEntries(ns.map((n) => [n, style.getPropertyValue(n).trim()]))
  }, names)
}

function changedNames(a: Record<string, string>, b: Record<string, string>): string[] {
  return Object.keys(a)
    .filter((k) => a[k] !== b[k])
    .sort()
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// 산출물이 없으면 건너뛰지 않고 실패합니다(측정 안 함을 통과로 보지 않음)
if (!existsSync(VARIABLES_CSS)) {
  throw new Error(`토큰 빌드 산출물 없음: ${VARIABLES_CSS} (pnpm --filter @axis-ds/tokens build 먼저)`)
}

test.describe('토큰 CSS 다크 계산값 (WI-0033)', () => {
  const css = readFileSync(VARIABLES_CSS, 'utf-8')
  const prefixes = Object.keys(JSON.parse(readFileSync(COMPONENTS_JSON, 'utf-8'))).map((k) => `--axis-${k}-`)
  const baselineCss = withoutDarkComponentLines(css, prefixes)
  const names = blockNames(css, ':root')

  test('기준선 구성: :root 249개, 기준선 .dark 는 component 줄이 빠진 204개', () => {
    expect(names.length).toBe(249)
    expect(blockNames(css, '.dark').sort()).toEqual([...names].sort())
    expect(blockNames(baselineCss, '.dark').length).toBe(204)
  })

  test('라이트: 계산값 변경 0, 모든 변수가 값을 가짐', async ({ page }) => {
    const before = await measure(page, baselineCss, 'light', names)
    const after = await measure(page, css, 'light', names)
    expect(Object.values(after).filter((v) => v === '')).toEqual([])
    expect(changedNames(before, after)).toEqual([])
  })

  for (const scenario of ['html-dark', 'div-dark'] as const) {
    test(`${scenario}: 다크 계산값 변경 ${EXPECTED_DARK_CHANGED.length}개가 목록과 일치`, async ({ page }) => {
      const before = await measure(page, baselineCss, scenario, names)
      const after = await measure(page, css, scenario, names)
      const light = await measure(page, css, 'light', names)
      // 계측 대조: 다크 시나리오가 실제로 다크 값을 읽는지(semantic 은 기준선에서도 다크 값)
      expect(before['--axis-surface-default']).not.toBe(light['--axis-surface-default'])
      expect(changedNames(before, after)).toEqual(EXPECTED_DARK_CHANGED)
      // 다크 화면 대비 (WCAG AA 4.5:1)
      expect(contrast(after['--axis-card-bg-default'], after['--axis-text-primary'])).toBeGreaterThanOrEqual(4.5)
      expect(contrast(after['--axis-dialog-content-bg'], after['--axis-text-primary'])).toBeGreaterThanOrEqual(4.5)
      expect(
        contrast(after['--axis-button-secondary-bg-default'], after['--axis-button-secondary-text-default'])
      ).toBeGreaterThanOrEqual(4.5)
      expect(contrast(after['--axis-input-bg-default'], after['--axis-input-text-placeholder'])).toBeGreaterThanOrEqual(4.5)
    })
  }
})
