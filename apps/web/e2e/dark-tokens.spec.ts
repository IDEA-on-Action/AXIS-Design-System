import { test, expect, type Page } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 토큰 CSS 다크 계산값 회귀 테스트 (WI-0033).
 *
 * 빌드된 `@axis-ds/tokens` 의 `dist/css/variables.css` 를 Chromium 에 올려 `getComputedStyle` 계산값을 잽니다.
 * 단언
 *   - 라이트: component 토큰의 계산값이 M1 반영 빌드 3b52976 에서 옮긴 고정 기준값(fixtures/dark-tokens-light-3b52976.json)과 같음.
 *     WI-0029 가 라이트 값을 의도적으로 바꾼 버튼 바탕 6개는 fixture 에 새 값으로 고쳐 두었습니다($wi0029).
 *     같은 산출물에서 만든 기준선과 비교하지 않으므로 라이트 값 회귀를 잡습니다. semantic · primitive 의 라이트 값은 범위 밖입니다.
 *   - 다크(`html.dark` · 하위 `div.dark`): 기준선(같은 파일에서 `.dark` 블록의 component 토큰 줄을 지운 CSS, 수정 전 구성)
 *     대비 바뀐 변수가 아래 맵의 이름과 정확히 같고, 각 계산값이 맵의 다크 hex 와 같음(값은 plan.md 4.1 표).
 * 개수(`:root` 변수 수, 기준선 `.dark` 수)는 고정값 대신 산출물과 components.json 에서 센 값으로 비교합니다.
 *
 * CI 에는 배선하지 않았습니다(CI 에 Playwright 브라우저 설치 단계가 없음, WI-0025 M3 a11y CI 배선 때 함께 검토).
 *
 * 실행: `pnpm --filter @axis-ds/tokens build` 뒤 `pnpm --filter @ax/web test:e2e:tokens`
 * (개발 서버가 필요 없도록 `playwright.tokens.config.ts` 를 씁니다)
 */
const TOKENS_DIR = resolve(__dirname, '../../../packages/axis-tokens')
const VARIABLES_CSS = resolve(TOKENS_DIR, 'dist/css/variables.css')
const COMPONENTS_JSON = resolve(TOKENS_DIR, 'src/component/components.json')
const LIGHT_FIXTURE = resolve(__dirname, 'fixtures/dark-tokens-light-3b52976.json')
const SHADCN_CSS = resolve(TOKENS_DIR, 'dist/css/shadcn-compat.css')

/** WI-0026: `--radius`(shadcn-compat.css)에서 계산되는 밀도 둥글기와 shadcn 을 함께 올렸을 때의 계산값 */
const RADIUS_FROM_SHADCN: Record<string, string> = {
  '--axis-radius-control': 'calc(0.5rem - 2px)',
  '--axis-radius-field': 'calc(0.5rem - 2px)',
  '--axis-radius-surface': '0.5rem',
}

/**
 * 다크 계산값이 바뀌어야 하는 component 토큰과 그 다크 값 (WI-0033 plan 4.1, WI-0029 PRD 2.1 · 2.2).
 * placeholder 는 WI-0062 에서 라이트를 gray.500(흰 바탕 4.83)으로 올리고 다크는 gray.400 을 유지해 다크 값이 라이트와 달라져 들어갑니다.
 * button-bg-disabled 다크는 WI-0062 에서 gray.700 → gray.800(비활성 글자 gray.400 과 5.78:1).
 * input-border-default 는 WI-0063 에서 라이트 · 다크 모두 gray.500(테마 무관)이 되어 빠지고, progress-fill 4개는 다크 값이 달라 들어갑니다.
 * form-control-border · track 은 테마 무관 값이라 제외합니다.
 * button-text-disabled 는 다크 text.tertiary 가 gray.400 으로 바뀌어(WI-0029) 라이트 gray.500 과 달라져 들어갑니다.
 * plan-card approve-bg · approve-hover-bg 는 테마 무관 값이라 제외합니다.
 */
const EXPECTED_DARK: Record<string, string> = {
  '--axis-button-bg-disabled': '#1F2937',
  '--axis-button-text-disabled': '#9CA3AF',
  '--axis-button-secondary-bg-default': '#111827',
  '--axis-button-secondary-bg-hover': '#1F2937',
  '--axis-button-secondary-bg-active': '#374151',
  '--axis-button-secondary-text-default': '#F3F4F6',
  '--axis-button-ghost-bg-hover': '#111827',
  '--axis-button-ghost-bg-active': '#1F2937',
  '--axis-button-ghost-text-default': '#D1D5DB',
  '--axis-input-bg-default': '#030712',
  '--axis-input-bg-disabled': '#111827',
  '--axis-input-text-default': '#F3F4F6',
  '--axis-input-text-placeholder': '#9CA3AF',
  '--axis-input-border-hover': '#9CA3AF',
  '--axis-input-border-focus': '#60A5FA',
  '--axis-input-border-error': '#F87171',
  '--axis-card-bg-default': '#030712',
  '--axis-card-border-default': '#1F2937',
  '--axis-badge-default-bg': '#111827',
  '--axis-badge-default-text': '#D1D5DB',
  '--axis-badge-success-bg': '#052E16',
  '--axis-badge-success-text': '#4ADE80',
  '--axis-badge-warning-bg': '#422006',
  '--axis-badge-warning-text': '#FACC15',
  '--axis-badge-error-bg': '#450A0A',
  '--axis-badge-error-text': '#F87171',
  '--axis-badge-info-bg': '#172554',
  '--axis-badge-info-text': '#60A5FA',
  '--axis-dialog-content-bg': '#030712',
  '--axis-dialog-content-border': '#1F2937',
  '--axis-plan-card-reject-hover-text': '#F87171',
  '--axis-plan-card-reject-text': '#EF4444',
  '--axis-progress-fill-default': '#3B82F6',
  '--axis-progress-fill-success': '#22C55E',
  '--axis-progress-fill-warning': '#EAB308',
  '--axis-progress-fill-destructive': '#EF4444',
}

/** components.json leaf 수 */
function countLeaves(node: unknown): number {
  if (!node || typeof node !== 'object') return 0
  if ('value' in node) return 1
  return Object.entries(node)
    .filter(([k]) => !k.startsWith('$'))
    .reduce((n, [, c]) => n + countLeaves(c), 0)
}

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
  const componentTree = JSON.parse(readFileSync(COMPONENTS_JSON, 'utf-8'))
  const componentLeaves = countLeaves(componentTree)
  const prefixes = Object.keys(componentTree).map((k) => `--axis-${k}-`)
  const baselineCss = withoutDarkComponentLines(css, prefixes)
  const names = blockNames(css, ':root')
  const lightFixture: Record<string, string> = JSON.parse(readFileSync(LIGHT_FIXTURE, 'utf-8')).values

  test('기준선 구성: .dark 이름 집합 = :root, 기준선 .dark 는 component leaf 수만큼 빠짐', () => {
    expect(names.length).toBeGreaterThan(0)
    expect(componentLeaves).toBeGreaterThan(0)
    expect(blockNames(css, '.dark').sort()).toEqual([...names].sort())
    // 접두사 필터가 component 줄만 정확히 지웠는지(semantic 줄을 함께 지우면 수가 어긋남)
    expect(blockNames(baselineCss, '.dark').length).toBe(names.length - componentLeaves)
  })

  test('라이트: component 토큰 계산값이 M1 반영 빌드(3b52976) 고정 기준값과 같음, 모든 :root 변수가 값을 가짐', async ({ page }) => {
    const fixtureNames = Object.keys(lightFixture)
    expect(fixtureNames.length).toBeGreaterThan(0)
    const after = await measure(page, css, 'light', names)
    // WI-0026 AC5: 밀도 둥글기 3개는 shadcn-compat.css 의 --radius 에서 계산돼, variables.css 만 올리면 비어요
    // (guaranteed-invalid, 컴포넌트는 리터럴 fallback 을 씀). 그 밖의 변수는 모두 값을 가져야 해요.
    expect(
      Object.entries(after)
        .filter(([, v]) => v === '')
        .map(([n]) => n)
        .sort(),
    ).toEqual(Object.keys(RADIUS_FROM_SHADCN).sort())
    // shadcn-compat.css 를 함께 올리면 세 변수도 값을 가지고, 1.6.3 의 rounded-md · rounded-lg 와 같은 식이에요
    const withShadcn = await measure(page, `${css}\n${readFileSync(SHADCN_CSS, 'utf-8')}`, 'light', names)
    expect(Object.values(withShadcn).filter((v) => v === '')).toEqual([])
    expect(Object.fromEntries(Object.keys(RADIUS_FROM_SHADCN).map((n) => [n, withShadcn[n]]))).toEqual(RADIUS_FROM_SHADCN)
    const measured = Object.fromEntries(fixtureNames.map((n) => [n, after[n]]))
    expect(measured).toEqual(lightFixture)
  })

  for (const scenario of ['html-dark', 'div-dark'] as const) {
    test(`${scenario}: 다크 계산값이 바뀌는 ${Object.keys(EXPECTED_DARK).length}개의 이름과 다크 값이 기대 맵과 일치`, async ({ page }) => {
      const before = await measure(page, baselineCss, scenario, names)
      const after = await measure(page, css, scenario, names)
      const light = await measure(page, css, 'light', names)
      // 계측 대조: 다크 시나리오가 실제로 다크 값을 읽는지(semantic 은 기준선에서도 다크 값)
      expect(before['--axis-surface-default']).not.toBe(light['--axis-surface-default'])
      expect(changedNames(before, after)).toEqual(Object.keys(EXPECTED_DARK).sort())
      const measuredDark = Object.fromEntries(Object.keys(EXPECTED_DARK).map((n) => [n, after[n]]))
      expect(measuredDark).toEqual(EXPECTED_DARK)
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
