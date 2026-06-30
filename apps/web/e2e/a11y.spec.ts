import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * 문서 페이지 E2E a11y 검사 (WI-0021 도입, WI-0022 baseline 해소 후 엄격 모드).
 *
 * 실제 브라우저 렌더링에 axe-core를 실행해 WCAG 2.1 A/AA 위반(색상 대비 포함)을 검증한다.
 * jsdom 단위 테스트(WI-0020)가 못 잡는 색상 대비/실제 렌더링을 보완한다.
 * WI-0022에서 도입 시점 baseline(color-contrast/button-name)을 전부 해소하여, 이제 위반 0을
 * 단언하는 엄격 게이트로 동작한다.
 */
const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/docs/', name: 'Docs' },
  { path: '/components/', name: 'Components index' },
  { path: '/components/button/', name: 'Button' },
  { path: '/components/dialog/', name: 'Dialog' },
  { path: '/components/select/', name: 'Select' },
  { path: '/agentic/', name: 'Agentic index' },
  { path: '/agentic/plan-card/', name: 'PlanCard' },
  { path: '/agentic/tool-call-card/', name: 'ToolCallCard' },
]

for (const { path, name } of PAGES) {
  test(`a11y: ${name} (${path})`, async ({ page }, testInfo) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      // Next dev 오버레이(nextjs-portal)는 dev 전용 툴링이라 프로덕션에 없음 -> 검사 제외
      .exclude('nextjs-portal')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    // 위반 발생 시 리포트 첨부 (회귀 진단용)
    if (results.violations.length > 0) {
      const summary = results.violations
        .map((v) => `  [${v.impact}] ${v.id} x${v.nodes.length}: ${v.help}`)
        .join('\n')
      // eslint-disable-next-line no-console
      console.log(`\n[a11y] ${name} (${path}) 위반 ${results.violations.length}종:\n${summary}`)
      await testInfo.attach('axe-violations.json', {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      })
    }

    expect(
      results.violations,
      `a11y 위반: ${results.violations.map((v) => v.id).join(', ') || '없음'}`,
    ).toEqual([])
  })
}
