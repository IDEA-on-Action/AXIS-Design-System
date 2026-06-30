import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * 문서 페이지 E2E a11y 검사 (WI-0021).
 *
 * 실제 브라우저 렌더링에 axe-core를 실행해 WCAG 2.1 A/AA 위반(색상 대비 포함)을 검증한다.
 * 단위 axe 테스트(WI-0020, jsdom)가 못 잡는 색상 대비/실제 렌더링을 보완한다.
 *
 * 정책 (비차단 리포트): 도입 시점의 기존 위반(BASELINE_RULES)은 별도 WI로 분리하여 차단하지
 * 않는다. 다만 BASELINE 외 신규 위반 카테고리는 차단하여 회귀를 막는다. 모든 위반은
 * 콘솔 + 첨부로 리포트한다.
 */

// 도입 시점 known backlog (별도 WI에서 수정 예정). 신규 카테고리는 아래 필터로 차단됨.
const BASELINE_RULES = ['color-contrast', 'button-name']

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

    // 전체 위반 리포트 (비차단, 기록용)
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

    // 비차단: BASELINE(color-contrast/button-name)은 별도 WI. BASELINE 외 신규 위반만 차단.
    const unexpected = results.violations.filter((v) => !BASELINE_RULES.includes(v.id))
    expect(
      unexpected,
      `신규 a11y 위반(baseline 외): ${unexpected.map((v) => v.id).join(', ') || '없음'}`,
    ).toEqual([])
  })
}
