import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {
  AC6_AXIS_VARS,
  ONTOLOGY_EXPECTED,
  SHADCN_RGB_TOLERANCE,
  hexToRgb,
  maxChannelDiff,
  parseCssRgb,
  type ThemeName,
} from './brand-expectations'
import { applyBrand, readBrandState } from './helpers/brand'

/**
 * 문서 페이지 E2E a11y 검사 (WI-0021 도입, WI-0022 baseline 해소, WI-0023 다크 모드, WI-0025 브랜드 축).
 *
 * 실제 브라우저 렌더링에 axe-core를 실행해 WCAG 2.1 A/AA 위반(색상 대비 포함)을 검증한다.
 * 기본 · ontology 브랜드 × 라이트 · 다크 × 10페이지 = 40건 (AC8, M4 에서 브랜드 전환 데모를 더함).
 * - 테마: ThemeProvider가 defaultTheme="system" + enableSystem이라 prefers-color-scheme 에뮬레이션만으로 전환된다.
 * - 브랜드: ontology 는 addInitScript(applyBrand)로 <html data-brand="ontology"> 를 붙인다.
 * - 브랜드 적용 양성 대조: 검사 전에 브랜드 값이 실제로 화면에 닿았는지 계산 스타일로 확인한다
 *   (이 단언이 없으면 브랜드 CSS 가 빠져도 기본 값으로 재고 통과한다).
 * - 기본 브랜드 기준선(D1, PRD AC8): WI-0029 흰 글자 대비 두 쌍만 노드 단위로 허용하고, 페이지별 상한을 둔다.
 *   그 밖의 위반은 0, ontology 에는 기준선을 적용하지 않는다(온톨로지 전용 예외 0).
 * - 데모 경로 기준선(M4, PRD AC8 변경 주석): /docs/brand-demo/ 에서만, 기본 브랜드 패키지 토큰 결함 쌍을
 *   테마별 fg/bg 정확값과 실측 상한으로 따로 허용한다. ontology 에는 적용하지 않는다.
 */
const PAGES: ReadonlyArray<{ path: string; name: string; readySelector?: string }> = [
  { path: '/', name: 'Home' },
  { path: '/docs/', name: 'Docs' },
  { path: '/components/', name: 'Components index' },
  { path: '/components/button/', name: 'Button' },
  { path: '/components/dialog/', name: 'Dialog' },
  { path: '/components/select/', name: 'Select' },
  { path: '/agentic/', name: 'Agentic index' },
  { path: '/agentic/plan-card/', name: 'PlanCard' },
  { path: '/agentic/tool-call-card/', name: 'ToolCallCard' },
  // WI-0025 M4 브랜드 전환 데모(FR-10 · AC7). 실제 패키지 컴포넌트를 렌더하는 유일한 페이지예요.
  // 하이드레이션 전에는 컨트롤 fieldset 이 disabled 라 라벨이 대비 검사에서 빠지므로, 컨트롤이 준비된 뒤 검사해요.
  { path: '/docs/brand-demo/', name: 'Brand demo', readySelector: '[data-testid="brand-demo-controls"][data-ready="true"]' },
]

const THEMES = ['light', 'dark'] as const satisfies readonly ThemeName[]
const BRANDS = ['default', 'ontology'] as const
type BrandName = (typeof BRANDS)[number]

/** 기본 브랜드 버튼 바탕 (variables.css :root · .dark 동일, 브랜드 미적용 확인용) */
const DEFAULT_BUTTON_BG = '#3B82F6'

/**
 * WI-0029(#94) 기본 브랜드 흰 글자 대비 미달 두 쌍. 기본 브랜드에서만, 이 쌍의 color-contrast 노드만 거른다.
 * 값을 바꾸면 기본 출력(AC3)이 바뀌므로 M3 에서는 고치지 않는다(U20).
 */
const WI0029_KNOWN_PAIRS = [
  { fg: '#ffffff', bg: '#3b82f6' },
  { fg: '#ffffff', bg: '#ef4444' },
] as const

/**
 * 기본 브랜드 기준선 상한: 페이지 · 테마별로 걸러도 되는 최대 노드 수.
 * 측정 조건: 2026-10-17, HEAD 위 이 spec 커밋 직전 트리, `pnpm turbo run build --filter=@ax/web... --force` 로 만든
 * apps/web/out 을 E2E_SERVER=static(python3 -m http.server 3101)으로 띄워 Chromium(Desktop Chrome 1280x720)에서 측정.
 * f64825d 본문의 15건 · 144노드는 측정 조건이 달라 근거로 쓰지 않는다.
 * 실측값보다 노드가 늘면 실패하고, 0 이 되면 기준선을 지우라는 실패를 낸다(낡은 예외 방지).
 */
const DEFAULT_BASELINE_CAP: Record<ThemeName, Record<string, number>> = {
  // 라이트 · 다크 각 7페이지 20노드, 합계 14건 · 40노드 (그 밖 3페이지는 0)
  // /docs/brand-demo/ 는 아래 DEMO_BASELINE 과 같은 측정(2026-10-18): 흰 글자/#3B82F6 6노드 + 흰 글자/#EF4444 1노드 = 7, 라이트 · 다크 같음.
  light: {
    '/': 2,
    '/docs/': 1,
    '/components/button/': 7,
    '/components/dialog/': 1,
    '/agentic/plan-card/': 1,
    '/agentic/tool-call-card/': 1,
    '/docs/brand-demo/': 7,
  },
  dark: {
    '/': 2,
    '/docs/': 1,
    '/components/button/': 7,
    '/components/dialog/': 1,
    '/agentic/plan-card/': 1,
    '/agentic/tool-call-card/': 1,
    '/docs/brand-demo/': 7,
  },
}

/** 데모 경로 기준선이 적용되는 유일한 경로 */
const DEMO_PATH = '/docs/brand-demo/'

/**
 * 데모 경로 기준선(WI-0025 M4, WI-0029(#94) 확장): 브랜드 전환 데모가 실제 패키지 컴포넌트를 처음 문서 사이트에 그리면서
 * 드러난 기본 브랜드 패키지 토큰 결함 쌍. 기본 브랜드 · DEMO_PATH 에서만, 테마별로 이 fg/bg 정확값의 color-contrast 노드만 거른다.
 * 값을 바꾸면 기본 출력(AC3)이 바뀌므로 WI-0025 에서는 고치지 않는다. ontology 에는 적용하지 않는다(온톨로지 전용 예외 0).
 * - 라이트: 흰 글자/#22c55e 2.27:1(PlanCard 승인 버튼, status-success 바탕 · status-success-contrast 글자),
 *   #ef4444/#f3f4f6 3.41:1(PlanCard 거절 버튼 글자 status-error, hover 바탕 상태로 측정됨)
 * - 다크: 흰 글자/#22c55e 2.27:1(같은 승인 버튼), #6b7280/#030712 4.16:1(PlanCard 진행률 text-tertiary 2노드),
 *   #6b7280/#09090b 4.11:1(MessageBubble metadata text-tertiary)
 * 측정 조건: 2026-10-18, `pnpm turbo run build --filter=@ax/web... --force` 로 만든 apps/web/out 을 E2E_SERVER=static 으로 띄워
 * Chromium(Desktop Chrome 1280x720, Playwright 1.61.1)에서 4회 같은 값(트리 1ba3e4d + 후보 1회, 독립 검증 사본 2회, 20ee226 + 이 변경 1회).
 * 상한은 실측 노드 수 그대로다. 늘면 실패하고, 0 이 되면 항목을 지우라는 실패를 낸다.
 */
const DEMO_KNOWN_PAIRS: Record<ThemeName, ReadonlyArray<{ fg: string; bg: string }>> = {
  light: [
    { fg: '#ffffff', bg: '#22c55e' },
    { fg: '#ef4444', bg: '#f3f4f6' },
  ],
  dark: [
    { fg: '#ffffff', bg: '#22c55e' },
    { fg: '#6b7280', bg: '#030712' },
    { fg: '#6b7280', bg: '#09090b' },
  ],
}
const DEMO_BASELINE_CAP: Record<ThemeName, number> = { light: 2, dark: 4 }

interface AxeNode {
  target: unknown
  any: Array<{ id: string; data?: { fgColor?: string; bgColor?: string; contrastRatio?: number } | null }>
}
interface AxeViolation {
  id: string
  impact?: string | null
  help: string
  nodes: AxeNode[]
}

function matchesPair(ruleId: string, node: AxeNode, pairs: ReadonlyArray<{ fg: string; bg: string }>): boolean {
  if (ruleId !== 'color-contrast') return false
  const data = node.any.find((c) => c.id === 'color-contrast')?.data
  const fg = data?.fgColor?.toLowerCase()
  const bg = data?.bgColor?.toLowerCase()
  return pairs.some((p) => p.fg === fg && p.bg === bg)
}

/** 기본 브랜드 기준선을 적용한 남은 위반과 걸러진 노드 수(WI-0029 · 데모 경로 따로) */
function applyBaseline(brand: BrandName, theme: ThemeName, path: string, violations: AxeViolation[]) {
  if (brand !== 'default') return { remaining: violations, filtered: 0, demoFiltered: 0 }
  const demoPairs = path === DEMO_PATH ? DEMO_KNOWN_PAIRS[theme] : []
  let filtered = 0
  let demoFiltered = 0
  const remaining: AxeViolation[] = []
  for (const v of violations) {
    const nodes = v.nodes.filter((n) => {
      if (matchesPair(v.id, n, WI0029_KNOWN_PAIRS)) {
        filtered += 1
        return false
      }
      if (matchesPair(v.id, n, demoPairs)) {
        demoFiltered += 1
        return false
      }
      return true
    })
    if (nodes.length > 0) remaining.push({ ...v, nodes })
  }
  return { remaining, filtered, demoFiltered }
}

for (const brand of BRANDS) {
  for (const theme of THEMES) {
    test.describe(`a11y (${brand}/${theme})`, () => {
      test.use({ colorScheme: theme })

      for (const { path, name, readySelector } of PAGES) {
        test(`${name} (${path})`, async ({ page }, testInfo) => {
          if (brand !== 'default') await applyBrand(page, brand)
          await page.goto(path)
          await page.waitForLoadState('networkidle')
          if (readySelector) await page.locator(readySelector).waitFor({ state: 'attached' })

          // 테마 적용 확인 (next-themes가 html에 dark 클래스 토글)
          if (theme === 'dark') {
            await expect(page.locator('html')).toHaveClass(/dark/)
          } else {
            await expect(page.locator('html')).not.toHaveClass(/dark/)
          }

          // 브랜드 적용 양성 대조
          const state = await readBrandState(page, AC6_AXIS_VARS)
          if (brand === 'default') {
            expect(state.brand, 'data-brand 가 없어야 함').toBeNull()
            expect(parseCssRgb(state.rendered['--axis-button-bg-default'])).toEqual(hexToRgb(DEFAULT_BUTTON_BG))
          } else {
            const exp = ONTOLOGY_EXPECTED[theme]
            expect(state.brand).toBe(brand)
            for (const v of AC6_AXIS_VARS) {
              expect(parseCssRgb(state.rendered[v]), `${v} (${brand}/${theme})`).toEqual(hexToRgb(exp.axis[v]))
            }
            const diff = maxChannelDiff(parseCssRgb(state.primaryRgb), hexToRgb(exp.shadcn['--primary']))
            expect(diff, `--primary 렌더 ${state.primaryRgb} 대 ${exp.shadcn['--primary']}`).toBeLessThanOrEqual(
              SHADCN_RGB_TOLERANCE,
            )
          }

          const results = await new AxeBuilder({ page })
            // Next dev 오버레이(nextjs-portal)는 dev 전용 툴링이라 프로덕션에 없음 -> 검사 제외
            .exclude('nextjs-portal')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze()

          const violations = results.violations as unknown as AxeViolation[]
          const { remaining, filtered, demoFiltered } = applyBaseline(brand, theme, path, violations)
          const cap = brand === 'default' ? (DEFAULT_BASELINE_CAP[theme][path] ?? 0) : 0
          const demoCap = brand === 'default' && path === DEMO_PATH ? DEMO_BASELINE_CAP[theme] : 0
          testInfo.annotations.push({
            type: 'wi0029-baseline',
            description: JSON.stringify({ brand, theme, path, filtered, cap, demoFiltered, demoCap }),
          })

          if (violations.length > 0) {
            const summary = violations
              .map((v) => `  [${v.impact}] ${v.id} x${v.nodes.length}: ${v.help}`)
              .join('\n')
            // eslint-disable-next-line no-console
            console.log(
              `\n[a11y/${brand}/${theme}] ${name} (${path}) 위반 ${violations.length}종 (WI-0029 기준선 ${filtered}노드 · 데모 기준선 ${demoFiltered}노드):\n${summary}`,
            )
            await testInfo.attach('axe-violations.json', {
              body: JSON.stringify(violations, null, 2),
              contentType: 'application/json',
            })
          }

          expect(
            remaining,
            `a11y 위반(${brand}/${theme}): ${remaining.map((v) => v.id).join(', ') || '없음'}`,
          ).toEqual([])
          expect(filtered, `WI-0029 기준선 노드 ${filtered} > 상한 ${cap} (${theme} ${path})`).toBeLessThanOrEqual(cap)
          if (cap > 0) {
            expect(
              filtered,
              `WI-0029 기준선 노드가 0 이에요. 해결됐으면 DEFAULT_BASELINE_CAP 의 ${theme} ${path} 항목을 지우세요`,
            ).toBeGreaterThan(0)
          }
          expect(demoFiltered, `데모 기준선 노드 ${demoFiltered} > 상한 ${demoCap} (${theme} ${path})`).toBeLessThanOrEqual(
            demoCap,
          )
          if (demoCap > 0) {
            expect(
              demoFiltered,
              `데모 기준선 노드가 0 이에요. 해결됐으면 DEMO_KNOWN_PAIRS · DEMO_BASELINE_CAP 의 ${theme} 항목을 지우세요`,
            ).toBeGreaterThan(0)
          }
        })
      }
    })
  }
}
