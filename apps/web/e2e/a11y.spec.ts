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
 * 문서 페이지 E2E a11y 검사 (WI-0021 도입, WI-0022 baseline 해소, WI-0023 다크 모드, WI-0025 브랜드 축, WI-0062 D2 범위 확대).
 *
 * 실제 브라우저 렌더링에 axe-core를 실행해 WCAG 2.1 A/AA 위반(색상 대비 포함)을 검증한다.
 * 기본 · ontology 브랜드 × 라이트 · 다크 × 문서 경로 전부(정적 경로 + 동적 라우트 대표 1개씩).
 * - 경로: e2e/a11y-routes.cjs 가 앱 라우트(page.tsx)와 library · templates index 에서 만든다.
 *   CI 건수 가드(frontend.yml)도 같은 파일에서 기대 건수를 계산하므로 페이지가 늘어도 손으로 고칠 곳이 없다.
 * - 테마: ThemeProvider가 defaultTheme="system" + enableSystem이라 prefers-color-scheme 에뮬레이션만으로 전환된다.
 * - 브랜드: ontology 는 addInitScript(applyBrand)로 <html data-brand="ontology"> 를 붙인다.
 * - 브랜드 적용 양성 대조: 검사 전에 브랜드 값이 실제로 화면에 닿았는지 계산 스타일로 확인한다
 *   (이 단언이 없으면 브랜드 CSS 가 빠져도 기본 값으로 재고 통과한다).
 * - 경로 양성 대조: HTTP 200 이고 준비 선택자(기본 h1)가 보인 뒤에만 잰다. 정적 서버는 없는 경로에도 404 페이지를
 *   돌려주고, library · templates 는 데이터를 받기 전 Skeleton 만 그려서, 둘 다 재면 위반 0 으로 통과하기 때문이다.
 * - incomplete: axe 가 판정을 보류한 color-contrast 노드 중 대비 수치가 4.5(큰 글씨 3) 미만인 것을 실패로 본다(WI-0062 D2).
 *   axe 는 글자가 짧거나(too short) 겹친 요소가 있으면 위반 대신 incomplete 로 보고해, 실제 미달(예: 1.47)이 빠져나갔다.
 *   수치가 없는(0 또는 없음) 노드는 바탕을 정하지 못한 것이라 이 단언의 대상이 아니다.
 * - 기준선 없음(WI-0029 PRD AC1 · AC2): 기본 · ontology 브랜드 모두 위반 0 을 단언한다.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { listA11yRoutes, COMBOS } = require('./a11y-routes.cjs') as {
  listA11yRoutes: () => Array<{ path: string; name: string; kind: string; readySelector: string }>
  COMBOS: string[]
}
const PAGES = listA11yRoutes()

/**
 * incomplete color-contrast 를 실패로 보는 대비 하한: 큰 글씨(axe 의 fontSize · fontWeight 기준, 18pt 이상 또는 14pt 굵게)는 3, 그 밖은 4.5.
 * 판정 함수는 helpers/contrast-threshold.cjs 에 있고, 가짜 노드로 판정을 확인하는 selfTest 가 어긋나면 설정 단계에서 멈춘다.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { isLowIncomplete, incompleteContrastMin, selfTest: contrastThresholdSelfTest } = require('./helpers/contrast-threshold.cjs') as {
  isLowIncomplete: (data: AxeCheckData | null | undefined) => boolean
  incompleteContrastMin: (data: AxeCheckData | null | undefined) => number
  selfTest: () => number
}
contrastThresholdSelfTest()

const THEMES = ['light', 'dark'] as const satisfies readonly ThemeName[]
const BRANDS = ['default', 'ontology'] as const
// CI 건수 가드는 a11y-routes.cjs 의 COMBOS 로 조합 수를 센다. 여기와 어긋나면 가드가 낡으므로 설정 단계에서 멈춘다.
if (COMBOS.join(',') !== BRANDS.flatMap((b) => THEMES.map((t) => `${b}/${t}`)).join(',')) {
  throw new Error(`a11y-routes.cjs COMBOS(${COMBOS.join(',')}) 가 BRANDS x THEMES 와 달라요`)
}

/** 기본 브랜드 버튼 바탕 (variables.css :root · .dark 동일, 브랜드 미적용 확인용. WI-0029 에서 blue.500 → blue.600) */
const DEFAULT_BUTTON_BG = '#2563EB'

interface AxeCheckData {
  fgColor?: string
  bgColor?: string
  contrastRatio?: number
  fontSize?: string
  fontWeight?: string
}
interface AxeNode {
  target: unknown
  html?: string
  any: Array<{
    id: string
    message?: string
    data?: AxeCheckData | null
  }>
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
          const response = await page.goto(path)
          expect(response?.status(), `${path} HTTP 상태`).toBe(200)
          await page.waitForLoadState('networkidle')
          await page.locator(readySelector).first().waitFor({ state: 'attached' })

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
          // incomplete color-contrast 중 대비 수치가 있는데 하한(큰 글씨 3, 그 밖 4.5) 미만인 노드
          const lowIncomplete = (results.incomplete as unknown as AxeViolation[])
            .filter((v) => v.id === 'color-contrast')
            .flatMap((v) => v.nodes)
            .flatMap((n) =>
              n.any
                .filter((c) => c.id === 'color-contrast')
                .map((c) => ({ target: n.target, html: n.html?.slice(0, 200), data: c.data, message: c.message })),
            )
            .filter((x) => isLowIncomplete(x.data))
          // 측정 경로 기록: 검사한 노드가 있었는지(passes)를 남겨, 위반 0 이 미측정 0 이 아님을 확인할 수 있게 한다
          testInfo.annotations.push({
            type: 'a11y-summary',
            description: JSON.stringify({
              brand,
              theme,
              path,
              violations: violations.length,
              passes: results.passes.length,
              incomplete: results.incomplete.length,
              lowIncomplete: lowIncomplete.length,
            }),
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

          if (lowIncomplete.length > 0) {
            await testInfo.attach('axe-incomplete-low-contrast.json', {
              body: JSON.stringify(lowIncomplete, null, 2),
              contentType: 'application/json',
            })
          }

          expect(
            violations,
            `a11y 위반(${brand}/${theme}): ${violations.map((v) => v.id).join(', ') || '없음'}`,
          ).toEqual([])
          expect(
            lowIncomplete.map(
              (x) =>
                `${JSON.stringify(x.target)} ${x.data?.fgColor}/${x.data?.bgColor} ${x.data?.contrastRatio} (하한 ${incompleteContrastMin(x.data)}, ${x.data?.fontSize} ${x.data?.fontWeight})`,
            ),
            `axe incomplete color-contrast 대비 하한 미만(${brand}/${theme} ${path})`,
          ).toEqual([])
        })
      }
    })
  }
}
