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
 * - 기준선 없음(WI-0029 PRD AC1 · AC2): 기본 · ontology 브랜드 모두 위반 0 을 단언한다. WI-0025 때 두었던
 *   WI-0029 흰 글자 대비 기준선과 데모 경로 기준선은 WI-0029 에서 토큰을 고쳐 지웠다.
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

/** 기본 브랜드 버튼 바탕 (variables.css :root · .dark 동일, 브랜드 미적용 확인용. WI-0029 에서 blue.500 → blue.600) */
const DEFAULT_BUTTON_BG = '#2563EB'

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
          // 측정 경로 기록: 검사한 노드가 있었는지(passes)를 남겨, 위반 0 이 미측정 0 이 아님을 확인할 수 있게 한다
          testInfo.annotations.push({
            type: 'a11y-summary',
            description: JSON.stringify({ brand, theme, path, violations: violations.length, passes: results.passes.length }),
          })
          expect(results.passes.length, `axe 통과 규칙 0 (${brand}/${theme} ${path}): 측정 실패`).toBeGreaterThan(0)

          if (violations.length > 0) {
            const summary = violations
              .map((v) => `  [${v.impact}] ${v.id} x${v.nodes.length}: ${v.help}`)
              .join('\n')
            // eslint-disable-next-line no-console
            console.log(
              `\n[a11y/${brand}/${theme}] ${name} (${path}) 위반 ${violations.length}종:\n${summary}`,
            )
            await testInfo.attach('axe-violations.json', {
              body: JSON.stringify(violations, null, 2),
              contentType: 'application/json',
            })
          }

          expect(
            violations,
            `a11y 위반(${brand}/${theme}): ${violations.map((v) => v.id).join(', ') || '없음'}`,
          ).toEqual([])
        })
      }
    })
  }
}
