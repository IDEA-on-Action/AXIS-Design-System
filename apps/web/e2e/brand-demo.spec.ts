import { test, expect, type Page } from '@playwright/test'
import {
  AC6_AXIS_VARS,
  ONTOLOGY_EXPECTED,
  SHADCN_RGB_TOLERANCE,
  SHAPE_EXPECTED,
  hexToRgb,
  maxChannelDiff,
  maxShadowAlpha,
  parseCssRgb,
  type ThemeName,
} from './brand-expectations'
import { applyBrand, readBrandState } from './helpers/brand'
import { collectErrors, openDemo, radio } from './helpers/demo'

/**
 * 브랜드 전환 데모 E2E (WI-0025 FR-10 · AC7 · Q8 · Q9).
 *
 * 데모 페이지(/docs/brand-demo/)의 전환 컨트롤을 실제로 클릭해 `<html data-brand>` 와 계산 스타일이 바뀌는지 봐요.
 * 테마 2 x 4 테스트 = 8건. 판정은 E2E_SERVER=static 결과예요.
 * - 측정은 실제 패키지 컴포넌트의 계산 스타일로 해요. 데모의 TokenReadout 표는 근거로 쓰지 않아요(자기 증명 방지).
 * - 거짓 초록 함정: a11y spec 은 applyBrand 로 로드 전에 data-brand 를 붙여요. 데모가 마운트 때 속성을 지우면
 *   ontology 조합이 기본 브랜드를 재고도 통과하므로, T2 가 "사전 부착 유지"를 직접 단언해요.
 * - 하이드레이션 오류는 React 가 <html> 을 다시 그리며 data-brand 를 지우므로, 모든 테스트에서 페이지 오류 0 을 단언해요.
 */

const THEMES = ['light', 'dark'] as const satisfies readonly ThemeName[]

/** 기본 브랜드 버튼 바탕 (variables.css :root · .dark 동일) */
const DEFAULT_BUTTON_BG = '#3B82F6'

const OPPOSITE: Record<ThemeName, ThemeName> = { light: 'dark', dark: 'light' }
const THEME_RADIO: Record<ThemeName, string> = { light: '라이트', dark: '다크' }

type Rgb = [number, number, number]

/** AC6 7변수에 대응하는 실제 요소의 렌더 색 (프로브는 --axis-border-focus · --primary 만) */
interface DemoColors {
  '--axis-button-bg-default': Rgb
  '--axis-button-text-default': Rgb
  '--axis-surface-default': Rgb
  '--axis-text-primary': Rgb
  '--axis-text-secondary': Rgb
  '--axis-border-focus': Rgb
  '--primary': Rgb
}

interface DemoShape {
  cardRadius: string
  buttonRadius: string
  planCardAccentWidth: string
  cardShadowMaxAlpha: number
}

async function readDemoColors(page: Page): Promise<DemoColors> {
  const probe = await readBrandState(page, ['--axis-border-focus'])
  const el = await page.evaluate(() => {
    const q = (sel: string) => {
      const node = document.querySelector(sel)
      if (!node) throw new Error(`요소 없음: ${sel}`)
      return getComputedStyle(node)
    }
    const button = q('[data-testid="demo-button-default"]')
    return {
      buttonBg: button.backgroundColor,
      buttonText: button.color,
      surface: q('[data-testid="demo-plan-card"] [role="region"]').backgroundColor,
      textPrimary: q('[data-testid="demo-plan-card"] [role="region"] h4').color,
      textSecondary: q('[data-testid="demo-card"] p').color,
    }
  })
  return {
    '--axis-button-bg-default': parseCssRgb(el.buttonBg),
    '--axis-button-text-default': parseCssRgb(el.buttonText),
    '--axis-surface-default': parseCssRgb(el.surface),
    '--axis-text-primary': parseCssRgb(el.textPrimary),
    '--axis-text-secondary': parseCssRgb(el.textSecondary),
    '--axis-border-focus': parseCssRgb(probe.rendered['--axis-border-focus']),
    '--primary': parseCssRgb(probe.primaryRgb),
  }
}

async function readDemoShape(page: Page): Promise<DemoShape> {
  return page.evaluate(() => {
    const q = (sel: string) => {
      const node = document.querySelector(sel)
      if (!node) throw new Error(`요소 없음: ${sel}`)
      return getComputedStyle(node)
    }
    const card = q('[data-testid="demo-card"]')
    return {
      cardRadius: card.borderTopLeftRadius,
      buttonRadius: q('[data-testid="demo-button-default"]').borderTopLeftRadius,
      planCardAccentWidth: q('[data-testid="demo-plan-card"] [role="region"]').borderLeftWidth,
      cardShadow: card.boxShadow,
    }
  }).then(({ cardShadow, ...rest }) => ({ ...rest, cardShadowMaxAlpha: maxShadowAlpha(cardShadow) }))
}

/** ontology 기대값과 같은지: --axis-* 는 정확히, --primary 는 채널당 ±1 */
function ontologyMismatches(colors: DemoColors, theme: ThemeName): string[] {
  const exp = ONTOLOGY_EXPECTED[theme]
  const out: string[] = []
  for (const v of AC6_AXIS_VARS) {
    if (maxChannelDiff(colors[v], hexToRgb(exp.axis[v])) !== 0) out.push(`${v}=${colors[v]} 기대 ${exp.axis[v]}`)
  }
  if (maxChannelDiff(colors['--primary'], hexToRgb(exp.shadcn['--primary'])) > SHADCN_RGB_TOLERANCE) {
    out.push(`--primary=${colors['--primary']} 기대 ${exp.shadcn['--primary']}`)
  }
  return out
}

/** 두 스냅샷이 같은지 (모든 변수 정확히 같음) */
function snapshotMismatches(a: DemoColors, b: DemoColors): string[] {
  return (Object.keys(a) as (keyof DemoColors)[])
    .filter((k) => maxChannelDiff(a[k], b[k]) !== 0)
    .map((k) => `${k}: ${a[k]} 대 ${b[k]}`)
}

const htmlBrand = (page: Page) => page.evaluate(() => document.documentElement.getAttribute('data-brand'))
const htmlIsDark = (page: Page) => page.evaluate(() => document.documentElement.classList.contains('dark'))

/** 전환 끝(버튼 transition-colors 150ms)까지 기다리며 ontology 기대값을 단언해요 */
async function expectOntology(page: Page, theme: ThemeName) {
  await expect.poll(async () => ontologyMismatches(await readDemoColors(page), theme), { message: `ontology/${theme} 7변수` }).toEqual([])
  await expect.poll(() => readDemoShape(page), { message: `ontology 모양` }).toEqual(SHAPE_EXPECTED.ontology)
}

async function expectDefaultShape(page: Page) {
  const shape = await readDemoShape(page)
  expect({ ...shape, cardShadowMaxAlpha: shape.cardShadowMaxAlpha > 0 }).toEqual({
    ...SHAPE_EXPECTED.default,
    cardShadowMaxAlpha: true,
  })
  expect(shape.cardShadowMaxAlpha, '기본 Card 그림자 최대 알파').toBeCloseTo(SHAPE_EXPECTED.default.cardShadowMaxAlpha, 2)
}

/** 같은 스냅샷이 될 때까지 기다려요 */
async function expectSnapshot(page: Page, want: DemoColors, label: string) {
  await expect.poll(async () => snapshotMismatches(await readDemoColors(page), want), { message: label }).toEqual([])
}

/** 버튼 바탕이 기본값이 된 뒤 스냅샷을 떠요(전환 중간값 방지) */
async function snapshotDefault(page: Page): Promise<DemoColors> {
  await expect
    .poll(async () => (await readDemoColors(page))['--axis-button-bg-default'], { message: '기본 버튼 바탕' })
    .toEqual(hexToRgb(DEFAULT_BUTTON_BG))
  return readDemoColors(page)
}

const current = (page: Page) => page.getByTestId('brand-demo-current')

for (const theme of THEMES) {
  test.describe(`brand demo (${theme})`, () => {
    test.use({ colorScheme: theme })

    let errors: string[] = []
    test.beforeEach(({ page }) => {
      errors = collectErrors(page)
    })
    test.afterEach(() => {
      expect(errors, '페이지 · 콘솔 오류(하이드레이션 불일치 포함)').toEqual([])
    })

    test('T1 전환 클릭으로 4상태를 순회해요', async ({ page }) => {
      const opp = OPPOSITE[theme]
      await openDemo(page)

      // ① 기본/처음 테마(시스템)
      expect(await htmlBrand(page), '처음에는 data-brand 가 없어야 함').toBeNull()
      await expect(radio(page, '기본')).toBeChecked()
      await expect(radio(page, '시스템')).toBeChecked()
      expect(await htmlIsDark(page)).toBe(theme === 'dark')
      const d0 = await snapshotDefault(page)
      await expectDefaultShape(page)

      // ② 기본/반대 테마
      await radio(page, THEME_RADIO[opp]).click()
      await expect.poll(() => htmlIsDark(page)).toBe(opp === 'dark')
      expect(await htmlBrand(page)).toBeNull()
      const d0Opp = await snapshotDefault(page)
      expect(snapshotMismatches(d0, d0Opp), '테마를 바꾸면 기본 브랜드 값도 바뀌어야 함').not.toEqual([])

      // ③ ontology/반대 테마
      await radio(page, 'Ontology').click()
      await expect.poll(() => htmlBrand(page)).toBe('ontology')
      await expect(radio(page, 'Ontology')).toBeChecked()
      await expect(current(page)).toContainText('Ontology')
      await expectOntology(page, opp)

      // ④ ontology/처음 테마: 테마만 바꿔도 브랜드 속성은 유지
      await radio(page, THEME_RADIO[theme]).click()
      await expect.poll(() => htmlIsDark(page)).toBe(theme === 'dark')
      expect(await htmlBrand(page)).toBe('ontology')
      await expectOntology(page, theme)

      // ⑤ 기본/처음 테마: 속성을 지워요("default" 문자열을 붙이지 않음)
      await radio(page, '기본').click()
      await expect.poll(() => page.evaluate(() => document.documentElement.hasAttribute('data-brand'))).toBe(false)
      await expect(current(page)).toContainText('기본')
      await expectSnapshot(page, d0, `기본/${theme} 가 처음 값과 같아야 함`)
      await expectDefaultShape(page)

      // ⑥ 기본/반대 테마도 처음에 잰 값으로 돌아와요
      await radio(page, THEME_RADIO[opp]).click()
      await expectSnapshot(page, d0Opp, `기본/${opp} 가 처음 값과 같아야 함`)

      // ⑦ 시스템으로 되돌리면 처음 상태와 같아요
      await radio(page, '시스템').click()
      await expect.poll(() => htmlIsDark(page)).toBe(theme === 'dark')
      await expect(current(page)).toContainText('(시스템)')
      await expectSnapshot(page, d0, '시스템으로 되돌린 값이 처음 값과 같아야 함')
    })

    test('T2 로드 전에 붙은 data-brand 를 마운트 때 지우지 않아요', async ({ page }) => {
      await applyBrand(page, 'ontology')
      for (const round of ['첫 로드', '새로고침']) {
        if (round === '첫 로드') await openDemo(page)
        else {
          await page.reload()
          await page.waitForLoadState('networkidle')
          await expect(page.getByTestId('brand-demo-controls')).toHaveAttribute('data-ready', 'true')
        }
        expect(await htmlBrand(page), `${round}: 준비 뒤에도 data-brand 유지`).toBe('ontology')
        await expect(radio(page, 'Ontology'), round).toBeChecked()
        await expect(current(page), round).toContainText('Ontology')
        await expectOntology(page, theme)
      }
      // 사용자 선택은 그대로 동작해요
      await radio(page, '기본').click()
      await expect.poll(() => htmlBrand(page)).toBeNull()
      await snapshotDefault(page)
    })

    test('T3 데모 페이지를 떠나면 data-brand 를 지워요', async ({ page }) => {
      await openDemo(page)
      await radio(page, 'Ontology').click()
      await expect.poll(() => htmlBrand(page)).toBe('ontology')

      // 사이드바 링크로 클라이언트 이동
      await page.getByRole('link', { name: 'Introduction', exact: true }).click()
      await expect(page).toHaveURL(/\/docs\/$/)
      await expect.poll(() => htmlBrand(page), { message: '이탈 뒤 data-brand' }).toBeNull()
      const state = await readBrandState(page, ['--axis-button-bg-default'])
      expect(parseCssRgb(state.rendered['--axis-button-bg-default'])).toEqual(hexToRgb(DEFAULT_BUTTON_BG))

      // 뒤로 가기로 돌아와도 기본 브랜드예요
      await page.goBack()
      await expect(page).toHaveURL(/\/docs\/brand-demo\/$/)
      await expect(page.getByTestId('brand-demo-controls')).toHaveAttribute('data-ready', 'true')
      expect(await htmlBrand(page)).toBeNull()
      await expect(radio(page, '기본')).toBeChecked()
    })

    test('T4 화면 구성: AC7 7종 · 상태 컴포넌트 · Q8 · Q9', async ({ page }) => {
      await openDemo(page)

      // ① 패키지가 그린 요소를 직접 확인해요(래퍼 div 개수는 안의 컴포넌트가 비어도 남으므로 세지 않음)
      await expect(page.getByRole('region', { name: '문서 사이트 배포 계획' }), 'PlanCard').toBeVisible()
      await expect(page.getByTestId('demo-message-bubble').getByRole('article'), 'MessageBubble').toHaveCount(3)
      const timeline = page.getByRole('list', { name: '작업 타임라인' })
      await expect(timeline, 'StepTimeline').toBeVisible()
      await expect(timeline.getByRole('listitem')).toHaveCount(5)
      await expect(page.getByTestId('demo-run-progress').getByRole('progressbar'), 'RunProgress').toBeVisible()
      await expect(page.getByTestId('demo-alert-warning'), 'Alert').toHaveAttribute('role', 'alert')
      const pkg = await page.evaluate(() => {
        const cs = (sel: string) => {
          const node = document.querySelector(sel)
          return node ? getComputedStyle(node) : null
        }
        const card = cs('[data-testid="demo-card"]')
        const button = cs('[data-testid="demo-button-default"]')
        const input = cs('[data-testid="demo-input"]')
        const badge = cs('[data-testid="demo-badge-success"]')
        return {
          card: card && { borderLeftWidth: card.borderLeftWidth, borderStyle: card.borderLeftStyle },
          button: button && { whiteSpace: button.whiteSpace, height: button.height, paddingLeft: button.paddingLeft },
          input: input && { height: input.height, borderStyle: input.borderLeftStyle },
          badge: badge && { radius: badge.borderTopLeftRadius },
        }
      })
      // 패키지 클래스가 만든 계산 스타일: Card border(1px solid) · Button whitespace-nowrap h-10 px-4 · Input h-10 border · Badge rounded-full
      // (Button 의 inline-flex 는 CardFooter 가 flex 라 블록화돼 계산값이 flex 가 되므로 쓰지 않아요)
      expect(pkg).toEqual({
        card: { borderLeftWidth: '1px', borderStyle: 'solid' },
        button: { whiteSpace: 'nowrap', height: '40px', paddingLeft: '16px' },
        input: { height: '40px', borderStyle: 'solid' },
        badge: { radius: '9999px' },
      })

      // ② Q8: 상태는 색만이 아니라 보이는 글자로도 구분돼요
      await expect(page.getByTestId('demo-alert-success').getByText('성공', { exact: true })).toBeVisible()
      await expect(page.getByTestId('demo-alert-warning').getByText('경고', { exact: true })).toBeVisible()
      await expect(page.getByTestId('demo-badge-success')).toHaveText('성공')
      await expect(page.getByTestId('demo-badge-warning')).toHaveText('경고')
      await expect(page.getByTestId('demo-badge-success')).toBeVisible()
      await expect(page.getByTestId('demo-badge-warning')).toBeVisible()
      const stepLists = [
        { name: 'StepTimeline', list: timeline, want: ['완료', '실행 중', '오류', '건너뜀', '대기 중'] },
        {
          name: 'RunProgress',
          list: page.getByTestId('demo-run-progress').getByRole('list', { name: '실행 단계' }),
          want: ['완료', '실행 중', '오류', '대기 중'],
        },
        {
          name: 'PlanCard',
          list: page.getByRole('region', { name: '문서 사이트 배포 계획' }).getByRole('list', { name: '실행 단계' }),
          want: ['완료', '실행 중', '오류', '건너뜀', '대기 중'],
        },
      ]
      for (const { name, list, want } of stepLists) {
        const items = list.getByRole('listitem')
        await expect(items, name).toHaveCount(want.length)
        for (let i = 0; i < want.length; i += 1) {
          const item = items.nth(i)
          // 보이는 상태 글자(단계 설명). sr-only 글자는 toBeVisible 에서 걸러지지 않으므로 화면 크기도 봐요
          const text = item.getByText(want[i], { exact: true })
          await expect(text, `${name} ${i + 1}단계 상태 글자`).toBeVisible()
          const box = await text.boundingBox()
          expect(box && box.width > 1 && box.height > 1, `${name} ${i + 1}단계 상태 글자가 화면 크기를 가짐`).toBe(true)
          // 같은 줄의 상태 표식(aria-hidden 아이콘 · 점). StepTimeline 은 앞에 연결선이 있어 마지막 직계 표식을 봐요
          await expect(
            item.locator(':scope > [aria-hidden="true"]').last(),
            `${name} ${i + 1}단계 상태 표식`,
          ).toBeVisible()
        }
      }

      // ③ Q9: 색 차이가 작아도 모양 차이가 숫자로 보여요
      await expectDefaultShape(page)
      await radio(page, 'Ontology').click()
      await expect.poll(() => htmlBrand(page)).toBe('ontology')
      await expect.poll(() => readDemoShape(page)).toEqual(SHAPE_EXPECTED.ontology)
      await radio(page, '기본').click()
      await expect.poll(() => htmlBrand(page)).toBeNull()
      await expectDefaultShape(page)
    })
  })
}
