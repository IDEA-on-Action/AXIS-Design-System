import { test, expect, type Locator, type Page } from '@playwright/test'
import { ONTOLOGY_EXPECTED, hexToRgb, type ThemeName } from './brand-expectations'
import { applyBrand } from './helpers/brand'
import { collectErrors, openDemo, radio } from './helpers/demo'

/**
 * 브랜드 비텍스트 대비 검사 (WI-0025 PRD 3.2 접근성 · 부록 A · B, WCAG 1.4.11).
 *
 * axe 는 비텍스트 대비를 판정하지 않으므로 계산 스타일을 직접 잽니다.
 *   ① Input 포커스 링(ontology 라이트 · 다크): 링 색이 `key`(= `--axis-input-border-focus`)이고 바탕 대비 3:1 이상.
 *      라이트 입력 테두리 `line-2`(#D6DADF, card 위 1.40:1)는 원본 유지 승인(부록 B ③)이라 3:1 을 요구하지 않고,
 *      비포커스 테두리 색이 `line-2` 인지만 확인합니다. 포커스 구분은 테두리가 아니라 링으로 판정합니다(결정 20).
 *      다크 `line-2`(#5F6874)는 card 위 3.12:1 이라 3:1 을 요구합니다.
 *   ② Button 포커스 링(ontology 라이트 · 다크): 링 색이 `key`(= `--axis-button-border-focus`)이고 바탕 대비 3:1 이상.
 *   ③ 상태 표식 실요소(기본 · ontology × 라이트 · 다크, 결정 22 후속): 브랜드 전환 데모(/docs/brand-demo/)가 그린
 *      agentic-ui 실제 컴포넌트(PlanCard 단계 아이콘 · StepTimeline 점과 글리프 · RunProgress 점과 글리프)의
 *      계산 색을 실제 부모 바탕 위에서 잽니다. 도형마다 stroke · fill 과 투명도(opacity · fill-opacity · stroke-opacity 의 곱)를
 *      읽고, 같은 svg 안에서 먼저 그려진 도형이 겹치는 자리면 그 도형을 먼저 바탕에 합성한 뒤 그 위에 합성합니다
 *      (스피너 arc = 0.75 over (트랙 0.25 over 바탕)). 대비는 합성한 색 대 바탕입니다. 단계 상태는 보이는 설명 글자로 정하고,
 *      컴포넌트 소스가 쓰는 변수(EXPECTED_VAR)의 렌더 색과 같은지도 단언합니다. 무한 애니메이션(spin · pulse)은 0 시점에 멈춰 잽니다.
 *      판정 범위(2026-10-19 사용자 결정 D1 「주 표식만 판정」): 정지 상태의 주 표식(상태 아이콘 · 스피너 arc · 상태 점 · 점 안 글리프)만
 *      3:1 로 판정합니다. 스피너 트랙 원(opacity .25) · pulse 최저 시점 · PlanCard 왼쪽 상태 선 · 진행 막대 채움 · RunProgress 머리 점은
 *      재서 기록만 합니다(annotation · 로그, judge 'record').
 *      기본 브랜드 주 표식도 모두 3:1 로 판정합니다(WI-0063 이 `DEFAULT_BRAND_FLOOR` 8쌍을 해소해 표가 비었습니다).
 *      데모에 실요소가 없는 쌍(info · warning 아이콘, surface-secondary 위 아이콘, surface-secondary 위 neutral-muted 점)은
 *      같은 페이지에 프로브를 넣어 계속 잽니다(ontology, PROBE_RESIDUAL). 측정 대상이 M3 프로브보다 줄지 않았는지 기계로 검사합니다.
 *   ④ 대기 · 건너뜀 상태 점 `--axis-status-neutral-muted`: 3:1 에 못 미치는 값을 그대로 두기로 했고
 *      (2026-10-18 사용자 결정, 2026-10-19 디자인 오너가 값 유지를 명시적으로 수락) 3:1 로 판정하지 않고, 측정값이 `NEUTRAL_MUTED_FLOOR` 하한보다 낮아지면 실패하는 회귀 가드로 둡니다.
 *      하한이 없는 (브랜드/테마, 바탕) 쌍은 「하한이 설정되지 않음」으로 실패합니다.
 *   `DEFAULT_BRAND_FLOOR` 의 값은 3 미만이어야 하고(3:1 을 넘는 주 표식을 하한으로 낮추지 않음), 두 하한 표 모두 키가 측정 행과
 *   하나도 맞지 않으면 실패합니다(낡은 키가 조용히 남지 않게).
 *   ⑤ ui-react 폼 컨트롤 · Progress · placeholder 실요소(기본 · ontology × 라이트 · 다크, WI-0079): 컴포넌트 문서 페이지의 실제 요소에서
 *      Checkbox · Radio · Textarea 경계, Switch 꺼짐 · Slider 트랙, Switch 썸 대 트랙, Progress 채움 대 트랙, Input · Select placeholder 를 잽니다
 *      (Select 는 값이 없는 Trigger 의 SelectValue 글자, WI-0082).
 *      경계 · 트랙은 실제 바탕과 함께 컨트롤이 놓일 수 있는 바탕 셋(card = surface-default, panel = surface-secondary,
 *      페이지 = --background)에서 모두 3:1, placeholder 는 입력 바탕 위 4.5:1(1.4.3, axe 가 placeholder 를 판정하지 않음)입니다.
 *      렌더 색이 대상 변수(FORM_TARGETS 의 expectVar)의 렌더 색과 같은지도 단언합니다. 측정 대상은 FORM_TARGETS 표와 정확히 같은 수입니다.
 * 링 판정 쌍은 링 대 바탕(가장 가까운 불투명 바탕을 합성한 색)이고, 링 오프셋 색은 기록만 합니다(결정 21).
 * 측정 대상 개수는 기대값과 정확히 같아야 합니다(미측정 0 · 조용한 축소를 통과로 읽지 않음).
 * 앱 수준 7변수(`--primary` 포함, AC6 결정 23)는 a11y.spec.ts 의 브랜드 양성 대조가 모든 페이지에서 확인합니다.
 *
 * 실행: `pnpm --filter @ax/web build` 뒤 `E2E_SERVER=static pnpm --filter @ax/web test:e2e:nontext`
 */
const BRAND = 'ontology'
const BRANDS = ['default', 'ontology'] as const
const THEMES = ['light', 'dark'] as const satisfies readonly ThemeName[]
const MIN_NONTEXT = 3

/** 부록 A 입력 테두리 `line-2` */
const LINE_2: Record<ThemeName, string> = { light: '#D6DADF', dark: '#5F6874' }

/**
 * M3 프로브가 재던 상태 아이콘 색 (결정 22). plan-card · tool-call-card 단계 아이콘(neutral · running · success · error),
 * approval-card 아이콘(info · warning). 보조 아이콘 `--axis-icon-*`(부록 B 가 bad-line · muted 를 승인)은 넣지 않습니다.
 */
const STATUS_ICON_VARS = [
  // WI-0063: 성공 · 오류 · 경고 · 대기 아이콘은 ontology 값이 같은 text-* 를 써요(ontology 렌더 색은 그대로)
  '--axis-text-tertiary',
  '--axis-status-running',
  '--axis-text-success',
  '--axis-text-error',
  '--axis-status-info',
  '--axis-text-warning',
] as const
const ICON_BACKGROUNDS = ['--axis-surface-default', '--axis-surface-secondary'] as const
const NEUTRAL_MUTED_VAR = '--axis-status-neutral-muted'

/**
 * 하한 = 실측값(소수 둘째 자리, static out · chromium). 측정값이 이보다 낮아지면 실패합니다.
 *   ontology 라이트 #D6DADF: surface-default #FFFFFF 위 1.40, surface-secondary #F3F4F6 위 1.28 (2026-10-18)
 *   ontology 다크  #5F6874: surface-default #17191D 위 3.12, surface-secondary #1F2227 위 2.83 (2026-10-18)
 *   2026-10-19 실요소 측정에서 더한 쌍(D1, 디자인 오너 사후 확인 완료(2026-10-19), 값 유지):
 *     ontology StepTimeline 점 대 --background 라이트 #F7F7F7 위 1.31 · 다크 #0E1013 위 3.37,
 *     기본 라이트 #D1D5DB 대 #FFFFFF(surface-default 와 --background 가 같은 색) 1.47,
 *     기본 다크 #D1D5DB 대 --background #09090B 위 13.5 · surface-default #030712 위 13.66
 * 다크도 surface-secondary 위에서는 3:1 에 못 미칩니다(2.83). 디자인 오너가 사후 확인에서 값 유지를 명시적으로 수락했습니다(2026-10-19).
 * 값을 올리는 변경(대비 개선)은 통과하므로, 개선했으면 이 하한도 새 측정값으로 올립니다.
 * 이후 값을 바꾸면 plan 5.3 과 todo 「디자인 오너 사후 확인 목록」을 함께 고칩니다.
 * 키는 `브랜드/테마` → 바탕 이름입니다(값이 같은 바탕은 `|` 로 이은 이름). 여기 없는 쌍은 「하한이 설정되지 않음」으로 실패합니다.
 */
const NEUTRAL_MUTED_FLOOR: Record<string, Record<string, number>> = {
  'ontology/light': { '--axis-surface-default': 1.4, '--axis-surface-secondary': 1.28, '--background': 1.31 },
  'ontology/dark': { '--axis-surface-default': 3.12, '--axis-surface-secondary': 2.83, '--background': 3.37 },
  'default/light': { '--axis-surface-default|--background': 1.47 },
  'default/dark': { '--background': 13.5, '--axis-surface-default': 13.66 },
}

/**
 * 기본 브랜드에서 3:1 에 못 미치는 주 표식의 하한 (2026-10-19 사용자 결정 D1).
 * WI-0063(2026-10-25)이 2026-10-19 기록 8쌍(라이트 8 · 다크 3 칸)을 모두 3:1 이상으로 고쳐 비웠습니다
 * (성공 점 · 아이콘 text-success, 대기 아이콘 text-tertiary, 스피너 arc 불투명, 점 위 글리프 짙은 글자 등).
 * 이제 기본 브랜드 주 표식은 모두 3:1 로 판정합니다. 다시 하한이 필요해지면 키는 `표식 종류 변수 @ 바탕 이름`(floorKey),
 * 값은 실측값(소수 둘째 자리, 3 미만)으로 둡니다.
 */
const DEFAULT_BRAND_FLOOR: Record<string, Record<string, number>> = {}

type Rgb = [number, number, number]

function luminance([r, g, b]: Rgb): number {
  const ch = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const hex = (c: Rgb) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()

interface Measured {
  /** 측정 요소 설명 */
  label: string
  /** 요소 색(링 · 아이콘 · 테두리), 불투명 rgb */
  color: Rgb
  /** 색 알파(1 이 아니면 합성 전 색) */
  alpha: number
  /** 뒤 바탕을 합성한 rgb */
  background: Rgb
  /** 바탕 조상 중 background-image 가 있는 요소 수(그라데이션 등은 합성에 넣지 않음) */
  bgImageLayers: number
  /** 링 오프셋 색 (링 측정에서만) */
  offset?: Rgb | null
}

/**
 * 브라우저 안에서 색을 잰다. 색 문자열은 1x1 캔버스에 칠해 rgba 로 정규화한다(color-mix 결과 등 표기와 무관).
 * mode: ring = box-shadow 에서 링 · 오프셋 색, 바탕은 부모부터 / icon = 요소 color, 바탕은 요소부터 / border = border-top-color
 *   / fill = 요소 background-color(상태 점), 바탕은 부모부터
 */
async function measure(locator: Locator, mode: 'ring' | 'icon' | 'border' | 'fill'): Promise<Omit<Measured, 'label'>> {
  return locator.evaluate((el, m) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('canvas 2d 없음')
    const rgba = (css: string): [number, number, number, number] => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = 'rgba(0, 0, 0, 0)'
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2], d[3] / 255]
    }
    const over = (top: [number, number, number, number], under: [number, number, number]) =>
      [0, 1, 2].map((i) => Math.round(top[i] * top[3] + under[i] * (1 - top[3]))) as [number, number, number]

    const start = m === 'ring' || m === 'fill' ? el.parentElement : el
    const chain: Element[] = []
    for (let n: Element | null = start; n; n = n.parentElement) chain.push(n)
    let bg: [number, number, number] = [255, 255, 255] // 캔버스(브라우저 기본) 바탕
    let bgImageLayers = 0
    for (const n of chain.reverse()) {
      const cs = getComputedStyle(n)
      if (cs.backgroundImage !== 'none') bgImageLayers += 1
      const c = rgba(cs.backgroundColor)
      if (c[3] > 0) bg = over(c, bg)
    }

    const cs = getComputedStyle(el)
    let colorCss: string
    let offsetCss: string | null = null
    if (m === 'ring') {
      const parts = cs.boxShadow === 'none' ? [] : cs.boxShadow.split(/,(?![^(]*\))/).map((s) => s.trim())
      const shadows = parts
        .map((p) => {
          const cm = /^(rgba?\([^)]*\)|color\([^)]*\)|#[0-9a-f]+)/i.exec(p)
          const lens = p.replace(cm ? cm[0] : '', '').trim().split(/\s+/).map((v) => parseFloat(v))
          return { color: cm ? cm[0] : '', spread: lens[3] ?? 0, inset: /inset/.test(p) }
        })
        .filter((s) => s.color && !s.inset && rgba(s.color)[3] > 0)
      if (shadows.length === 0) throw new Error(`포커스 링 없음 (box-shadow: ${cs.boxShadow})`)
      const ring = shadows.reduce((a, b) => (b.spread > a.spread ? b : a))
      const offset = shadows.filter((s) => s !== ring).reduce<(typeof shadows)[number] | null>(
        (a, b) => (a && a.spread > b.spread ? a : b),
        null,
      )
      colorCss = ring.color
      offsetCss = offset ? offset.color : null
    } else if (m === 'icon') {
      colorCss = cs.color
    } else if (m === 'fill') {
      colorCss = cs.backgroundColor
    } else {
      colorCss = cs.borderTopColor
    }
    const c = rgba(colorCss)
    const offsetRgba = offsetCss ? rgba(offsetCss) : null
    return {
      color: [c[0], c[1], c[2]] as [number, number, number],
      alpha: c[3],
      background: bg,
      bgImageLayers,
      offset: offsetRgba ? ([offsetRgba[0], offsetRgba[1], offsetRgba[2]] as [number, number, number]) : null,
    }
  }, mode)
}

/** 키보드 이동으로 포커스해 :focus-visible 을 만든다(프로그램 focus 만으로는 버튼에서 보장되지 않음) */
async function keyboardFocus(page: Page, target: Locator) {
  await target.focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  const ok = await target.evaluate((el) => document.activeElement === el && el.matches(':focus-visible'))
  expect(ok, '대상이 키보드 포커스(:focus-visible) 상태가 아님').toBe(true)
}

async function openBranded(page: Page, path: string, theme: ThemeName) {
  await applyBrand(page, BRAND)
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-brand', BRAND)
  if (theme === 'dark') await expect(html).toHaveClass(/dark/)
  else await expect(html).not.toHaveClass(/dark/)
}

function report(testInfo: { annotations: { type: string; description?: string }[] }, rows: Measured[]) {
  for (const r of rows) {
    const ratio = contrast(r.color, r.background)
    testInfo.annotations.push({
      type: 'nontext-contrast',
      description: JSON.stringify({
        label: r.label,
        color: hex(r.color),
        alpha: r.alpha,
        background: hex(r.background),
        ratio: Math.round(ratio * 100) / 100,
        offset: r.offset ? hex(r.offset) : null,
        offsetRatio: r.offset ? Math.round(contrast(r.color, r.offset) * 100) / 100 : null,
        bgImageLayers: r.bgImageLayers,
      }),
    })
  }
}

for (const theme of THEMES) {
  test.describe(`nontext (${BRAND}/${theme})`, () => {
    test.use({ colorScheme: theme })
    const exp = ONTOLOGY_EXPECTED[theme]
    const key = hexToRgb(exp.axis['--axis-border-focus'])

    test('Input 포커스 링과 테두리 (/components/input/)', async ({ page }, testInfo) => {
      await openBranded(page, '/components/input/', theme)
      const inputs = page.locator('main input[class*="--axis-input-border-focus"]:visible:not([disabled])')
      const n = await inputs.count()
      expect(n, '측정할 Input 이 없음').toBeGreaterThan(0)
      const target = inputs.first()

      const border = { label: 'input border (비포커스)', ...(await measure(target, 'border')) }
      expect(hex(border.color), '비포커스 테두리 = line-2').toBe(LINE_2[theme])
      await keyboardFocus(page, target)
      const ring = { label: 'input focus ring', ...(await measure(target, 'ring')) }
      report(testInfo, [border, ring])

      expect(ring.alpha).toBe(1)
      expect(hex(ring.color), 'Input 포커스 링 = key').toBe(hex(key))
      expect(contrast(ring.color, ring.background), 'Input 포커스 링 대 바탕').toBeGreaterThanOrEqual(MIN_NONTEXT)
      if (theme === 'dark') {
        expect(contrast(border.color, border.background), '다크 입력 테두리 line-2 대 바탕').toBeGreaterThanOrEqual(
          MIN_NONTEXT,
        )
      }
    })

    test('Button 포커스 링 (/components/button/)', async ({ page }, testInfo) => {
      await openBranded(page, '/components/button/', theme)
      const buttons = page.locator('main button[class*="--axis-button-border-focus"]:visible:not([disabled])')
      const n = await buttons.count()
      expect(n, '측정할 Button 이 없음').toBeGreaterThan(0)
      const target = buttons.first()
      await keyboardFocus(page, target)
      const ring = { label: 'button focus ring', ...(await measure(target, 'ring')) }
      report(testInfo, [ring])

      expect(ring.alpha).toBe(1)
      expect(hex(ring.color), 'Button 포커스 링 = key').toBe(hex(key))
      expect(contrast(ring.color, ring.background), 'Button 포커스 링 대 바탕').toBeGreaterThanOrEqual(MIN_NONTEXT)
    })
  })
}

// ---------------------------------------------------------------------------
// ③ · ④ 상태 표식 실요소 (/docs/brand-demo/)
// ---------------------------------------------------------------------------

type StepState = 'complete' | 'running' | 'error' | 'skipped' | 'pending'

/** 보이는 단계 설명 글자 → 상태 (brand-demo T4 가 같은 글자를 단언) */
const STATE_BY_TEXT: Record<string, StepState> = {
  완료: 'complete',
  '실행 중': 'running',
  오류: 'error',
  건너뜀: 'skipped',
  '대기 중': 'pending',
}

/**
 * 컴포넌트 소스가 상태 표식에 쓰는 변수 (packages/axis-agentic-ui/src).
 *   plan-card 59~86 · step-timeline 64~79 · run-progress 29~54
 * 색 일치로 변수를 역추적하지 않습니다(ontology 는 warning = error 처럼 값이 겹침).
 */
const EXPECTED_VAR = {
  planCardIcon: {
    pending: '--axis-text-tertiary',
    skipped: '--axis-text-tertiary',
    running: '--axis-status-running',
    complete: '--axis-text-success',
    error: '--axis-text-error',
  },
  stepTimelineDot: {
    complete: '--axis-text-success',
    running: '--axis-status-running',
    error: '--axis-status-error',
    skipped: NEUTRAL_MUTED_VAR,
    pending: NEUTRAL_MUTED_VAR,
  },
  stepTimelineGlyph: { complete: '--axis-status-success-contrast' },
  runProgressDot: {
    pending: NEUTRAL_MUTED_VAR,
    running: '--axis-status-running',
    complete: '--axis-text-success',
    error: '--axis-status-error',
  },
  runProgressGlyph: {
    running: '--axis-status-running-contrast',
    complete: '--axis-status-success-contrast',
    error: '--axis-status-error-contrast',
  },
} as const satisfies Record<string, Partial<Record<StepState, string>>>

/** 데모 페이지 실측 개수 (brand-demo-showcase.tsx: PlanCard 5+2단계, StepTimeline 5단계, RunProgress 4+2단계) */
const EXPECTED_COUNT = { planCardIcons: 7, timelineDots: 5, timelineGlyphs: 1, runDots: 6, runGlyphs: 5, runHeadDots: 1 }

/** 바탕 이름 후보. 합성 바탕이 어느 것과도 같지 않으면 'unmatched' 로 실패합니다 */
const NAMED_BACKGROUNDS: Record<string, string> = {
  '--axis-surface-default': 'var(--axis-surface-default)',
  '--axis-surface-secondary': 'var(--axis-surface-secondary)',
  '--background': 'hsl(var(--background))',
}

/** M3 프로브가 재던 (변수, 바탕) 집합. 실요소 측정 + 잔여 프로브가 이 집합을 모두 덮어야 합니다(ontology) */
const PROBE_PAIRS: readonly string[] = [
  ...STATUS_ICON_VARS.flatMap((v) => ICON_BACKGROUNDS.map((b) => `${v}@${b}`)),
  ...ICON_BACKGROUNDS.map((b) => `${NEUTRAL_MUTED_VAR}@${b}`),
]
/**
 * 데모에 실요소가 없어 프로브로 계속 재는 쌍 (2026-10-19 실측 기준).
 * info · warning 아이콘(데모에 ApprovalCard 없음), surface-secondary 위 아이콘, surface-secondary 위 neutral-muted 점.
 */
const PROBE_RESIDUAL: readonly { v: string; bg: (typeof ICON_BACKGROUNDS)[number]; kind: 'icon' | 'dot' }[] = [
  { v: '--axis-status-info', bg: '--axis-surface-default', kind: 'icon' },
  { v: '--axis-text-warning', bg: '--axis-surface-default', kind: 'icon' },
  ...STATUS_ICON_VARS.map((v) => ({ v, bg: '--axis-surface-secondary' as const, kind: 'icon' as const })),
  { v: NEUTRAL_MUTED_VAR, bg: '--axis-surface-secondary', kind: 'dot' },
]

type Judge = 'min3' | 'floor' | 'record'

interface MarkRow {
  component: string
  /** 하한 표 키에 쓰는 표식 종류 (예: 'PlanCard 아이콘', 'PlanCard 스피너 arc', 'RunProgress 점') */
  kind: string
  state: string
  expectVar: string
  part: string
  /** 칠해지는 색(알파 제외) */
  color: Rgb
  colorAlpha: number
  /** 색 알파 × fill/stroke-opacity × 루트까지 opacity 곱 */
  effAlpha: number
  opacity: number
  background: Rgb
  /** 바로 아래 색: 바탕에 같은 svg 안 앞 도형(겹치는 자리)을 합성한 색. 겹치는 도형이 없으면 background 와 같음 */
  under: Rgb
  /** 겹친 앞 도형 목록('-' 이면 없음)과 그 조합이 표본 점에서 차지한 비율 */
  underlay: string
  underShare: number
  /** 스피너 svg 의 도형인지, 그중 트랙 원인지 */
  spinner: boolean
  track: boolean
  bgName: string
  judge: Judge
}

interface RawMark {
  part: string
  color: Rgb
  colorAlpha: number
  effAlpha: number
  opacity: number
  background: Rgb
  under: Rgb
  underlay: string
  underShare: number
  spinner: boolean
  track: boolean
}

/**
 * 상태 표식을 잰다. 바탕은 요소의 부모부터 루트까지 불투명 background-color 를 합성한다(캔버스로 정규화).
 * mode: shapes = svg 안 도형마다 stroke · fill / fill = background-color(점 · 막대) / border-left = border-left-color
 * shapes 는 도형 영역 안 24x24 격자 점마다, 같은 svg 안 앞 도형 가운데 그 점을 덮는 것(isPointInFill · isPointInStroke)을
 * 칠 순서대로 바탕에 합성해 바로 아래 색(under)을 구하고, 표본 점에서 가장 많이 나온 조합을 쓴다.
 * 도형을 각각 바탕 위에 따로 합성하면 스피너 arc 처럼 반투명 도형이 겹친 자리의 실제 픽셀과 달라진다(2026-10-19 정정).
 * 합성 경로에 opacity < 1 이면서 그 아래(또는 자신)에 바탕이 있는 조상이 있으면 합성이 틀리므로 throw 한다.
 */
async function measureMark(locator: Locator, mode: 'shapes' | 'fill' | 'border-left'): Promise<RawMark[]> {
  return locator.evaluate((el, m) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('canvas 2d 없음')
    const rgba = (css: string): [number, number, number, number] => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = 'rgba(0, 0, 0, 0)'
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2], d[3] / 255]
    }
    const over = (top: [number, number, number, number], under: [number, number, number]) =>
      [0, 1, 2].map((i) => Math.round(top[i] * top[3] + under[i] * (1 - top[3]))) as [number, number, number]
    const opacityOf = (n: Element) => parseFloat(getComputedStyle(n).opacity)
    const pathOpacity = (n: Element) => {
      let p = 1
      for (let x: Element | null = n; x; x = x.parentElement) p *= opacityOf(x)
      return p
    }

    const chain: Element[] = []
    for (let n: Element | null = el.parentElement; n; n = n.parentElement) chain.push(n)
    let bg: [number, number, number] = [255, 255, 255]
    let fadedAbove: string | null = null
    for (const n of chain.reverse()) {
      const cs = getComputedStyle(n)
      const c = rgba(cs.backgroundColor)
      const op = parseFloat(cs.opacity)
      if (c[3] > 0) {
        if (fadedAbove || op < 1) {
          throw new Error(`바탕 합성 경로에 opacity < 1 조상이 있음 (${fadedAbove ?? n.tagName}), 합성 불가`)
        }
        bg = over(c, bg)
      }
      if (op < 1 && !fadedAbove) fadedAbove = `${n.tagName}.${n.getAttribute('class') ?? ''}`
    }

    type Rgb3 = [number, number, number]
    const out: {
      part: string
      color: Rgb3
      colorAlpha: number
      effAlpha: number
      opacity: number
      background: Rgb3
      under: Rgb3
      underlay: string
      underShare: number
      spinner: boolean
      track: boolean
    }[] = []
    if (m === 'shapes') {
      // 스피너(animate-spin)는 트랙 원 1개 + arc path 1개 구조여야 한다(구조가 바뀌면 트랙 · arc 구분이 틀리므로 실패)
      const spinner = (el.getAttribute('class') ?? '').split(/\s+/).includes('animate-spin')
      const shapes = Array.from(
        el.querySelectorAll('path, circle, rect, line, polyline, polygon, ellipse'),
      ) as SVGGeometryElement[]
      if (spinner) {
        const tags = shapes.map((x) => x.tagName.toLowerCase()).join(',')
        if (tags !== 'circle,path') throw new Error(`스피너 구조가 트랙 원 + arc path 가 아님: ${tags}`)
      }
      // SVG 칠 순서: 문서 순서대로, 한 도형 안에서는 fill 다음 stroke
      const layers: {
        shape: SVGGeometryElement
        prop: 'fill' | 'stroke'
        part: string
        rgba: [number, number, number, number]
        eff: number
        opacity: number
        track: boolean
      }[] = []
      shapes.forEach((shape, i) => {
        const cs = getComputedStyle(shape)
        for (const prop of ['fill', 'stroke'] as const) {
          const v = cs[prop]
          if (!v || v === 'none') continue
          if (v.startsWith('url(')) throw new Error(`${shape.tagName}[${i}].${prop} 가 paint server(${v})라 잴 수 없음`)
          const c = rgba(v)
          if (c[3] === 0) continue
          const po = parseFloat(prop === 'stroke' ? cs.strokeOpacity : cs.fillOpacity)
          const op = pathOpacity(shape)
          layers.push({
            shape,
            prop,
            part: `${shape.tagName.toLowerCase()}[${i}].${prop}`,
            rgba: c,
            eff: c[3] * po * op,
            opacity: op,
            track: spinner && shape.tagName.toLowerCase() === 'circle',
          })
        }
      })
      if (layers.length === 0) throw new Error('svg 안에 칠해지는 도형이 없음')
      const inLayer = (L: (typeof layers)[number], p: DOMPoint) =>
        L.prop === 'fill' ? L.shape.isPointInFill(p) : L.shape.isPointInStroke(p)
      const GRID = 24
      layers.forEach((L, k) => {
        // 도형 영역 안 격자 점마다 앞 도형 중 그 점을 덮는 것을 차례로 합성해 바로 아래 색을 구하고, 가장 많은 조합을 쓴다
        const b = L.shape.getBBox()
        const pad = L.prop === 'stroke' ? (parseFloat(getComputedStyle(L.shape).strokeWidth) || 0) / 2 : 0
        const tally = new Map<string, { n: number; under: Rgb3 }>()
        let total = 0
        for (let gx = 0; gx < GRID; gx += 1) {
          for (let gy = 0; gy < GRID; gy += 1) {
            const p = new DOMPoint(
              b.x - pad + ((b.width + 2 * pad) * (gx + 0.5)) / GRID,
              b.y - pad + ((b.height + 2 * pad) * (gy + 0.5)) / GRID,
            )
            if (!inLayer(L, p)) continue
            total += 1
            let under: Rgb3 = bg
            const names: string[] = []
            for (const E of layers.slice(0, k)) {
              if (!inLayer(E, p)) continue
              // 중간 합성은 반올림하지 않는다(최종 칠 색만 8비트로 반올림해 실제 픽셀과 맞춤)
              under = [0, 1, 2].map((ch) => E.rgba[ch] * E.eff + under[ch] * (1 - E.eff)) as Rgb3
              names.push(E.part)
            }
            const key = names.length ? names.join('+') : '-'
            const t = tally.get(key)
            if (t) t.n += 1
            else tally.set(key, { n: 1, under })
          }
        }
        if (total === 0) throw new Error(`${L.part} 영역에서 표본 점을 하나도 얻지 못함`)
        const [underlay, top] = [...tally.entries()].reduce((a, x) => (x[1].n > a[1].n ? x : a))
        out.push({
          part: L.part,
          color: [L.rgba[0], L.rgba[1], L.rgba[2]],
          colorAlpha: L.rgba[3],
          effAlpha: L.eff,
          opacity: L.opacity,
          background: bg,
          under: top.under,
          underlay,
          underShare: top.n / total,
          spinner,
          track: L.track,
        })
      })
    } else {
      const cs = getComputedStyle(el)
      const c = rgba(m === 'fill' ? cs.backgroundColor : cs.borderLeftColor)
      const op = pathOpacity(el)
      out.push({
        part: m,
        color: [c[0], c[1], c[2]],
        colorAlpha: c[3],
        effAlpha: c[3] * op,
        opacity: op,
        background: bg,
        under: bg,
        underlay: '-',
        underShare: 1,
        spinner: false,
        track: false,
      })
    }
    return out
  }, mode)
}

/** CSS 식(var(--x) 등)을 렌더 rgb 로 푼다(캔버스 정규화, 프로덕션 압축 표기와 무관) */
async function resolveColors(page: Page, exprs: Record<string, string>): Promise<Record<string, Rgb>> {
  return page.evaluate((map) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('canvas 2d 없음')
    const probe = document.createElement('span')
    document.body.appendChild(probe)
    const out: Record<string, [number, number, number]> = {}
    for (const [k, expr] of Object.entries(map)) {
      probe.style.color = ''
      probe.style.color = expr
      const css = getComputedStyle(probe).color
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = 'rgba(0, 0, 0, 0)'
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      if (d[3] !== 255) throw new Error(`${k} (${expr}) 가 불투명하지 않음: ${css}`)
      out[k] = [d[0], d[1], d[2]]
    }
    probe.remove()
    return out
  }, exprs)
}

/**
 * 정지 상태 만들기: 유한 애니메이션(전환 transition-colors · transition-all)은 끝날 때까지 기다리고,
 * 무한 애니메이션(spin · pulse)은 멈춰 0 시점에 둔다(pulse keyframes 는 50%{opacity:.5} 하나라 0 시점 opacity 1).
 * 반환값은 멈춘 무한 애니메이션 수(0 이면 미측정).
 */
async function settle(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const finite = document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity)
    await Promise.all(finite.map((a) => a.finished.catch(() => undefined)))
    const infinite = document.getAnimations().filter((a) => a.effect?.getTiming().iterations === Infinity)
    for (const a of infinite) {
      a.pause()
      a.currentTime = 0
    }
    return infinite.length
  })
}

/** pulse 애니메이션만 최저 시점(duration/2)으로 옮긴다. 반환값은 옮긴 수 */
async function pulseToMid(page: Page): Promise<number> {
  return page.evaluate(() => {
    const pulses = document
      .getAnimations()
      .filter((a) => (a as Animation & { animationName?: string }).animationName === 'pulse')
    for (const a of pulses) {
      const d = Number(a.effect?.getTiming().duration ?? 0)
      a.currentTime = d / 2
    }
    return pulses.length
  })
}

/** 기본 브랜드 하한 표 키: 표식 종류 · 변수 · 바탕 이름 */
const floorKey = (r: Pick<MarkRow, 'kind' | 'expectVar' | 'bgName'>) => `${r.kind} ${r.expectVar} @ ${r.bgName}`

const sameRgb = (a: Rgb, b: Rgb) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
const blend = (c: Rgb, alpha: number, under: Rgb): Rgb =>
  [0, 1, 2].map((i) => Math.round(c[i] * alpha + under[i] * (1 - alpha))) as Rgb
const round2 = (x: number) => Math.round(x * 100) / 100

async function stateOf(item: Locator): Promise<StepState> {
  const text = ((await item.locator('p').last().textContent()) ?? '').trim()
  const state = STATE_BY_TEXT[text]
  if (!state) throw new Error(`단계 설명 글자로 상태를 정하지 못함: '${text}'`)
  return state
}

for (const brand of BRANDS) {
  for (const theme of THEMES) {
    test.describe(`nontext status (${brand}/${theme})`, () => {
      test.use({ colorScheme: theme })

      let errors: string[] = []
      test.beforeEach(({ page }) => {
        errors = collectErrors(page)
      })
      test.afterEach(() => {
        expect(errors, '페이지 · 콘솔 오류').toEqual([])
      })

      test('상태 표식 실요소 (/docs/brand-demo/)', async ({ page }, testInfo) => {
        const combo = `${brand}/${theme}`
        await openDemo(page)
        const html = page.locator('html')
        if (brand === 'ontology') {
          await radio(page, 'Ontology').click()
          await expect.poll(() => html.getAttribute('data-brand')).toBe('ontology')
        } else {
          expect(await html.getAttribute('data-brand'), '기본 브랜드는 data-brand 없음').toBeNull()
        }
        if (theme === 'dark') await expect(html).toHaveClass(/dark/)
        else await expect(html).not.toHaveClass(/dark/)

        const stopped = await settle(page)
        expect(stopped, '멈춘 무한 애니메이션(spin · pulse) 수').toBeGreaterThan(0)

        const allVars = new Set<string>()
        for (const table of Object.values(EXPECTED_VAR)) for (const v of Object.values(table)) allVars.add(v)
        // 왼쪽 선 · 진행 막대(기록만)는 status-warning · status-success 를 그대로 쓴다
        for (const v of [...STATUS_ICON_VARS, '--axis-status-warning', '--axis-status-success']) allVars.add(v)
        const rendered = await resolveColors(page, {
          ...NAMED_BACKGROUNDS,
          ...Object.fromEntries([...allVars].map((v) => [v, `var(${v})`])),
        })
        const nameBg = (bg: Rgb) => {
          const names = Object.keys(NAMED_BACKGROUNDS).filter((n) => sameRgb(rendered[n], bg))
          return names.length ? names.join('|') : 'unmatched'
        }

        const rows: MarkRow[] = []
        // 스피너 트랙 원은 판정하지 않고 기록만 한다(D1). arc 는 주 표식이라 base 판정을 그대로 쓴다
        const push = (raw: RawMark[], base: Omit<MarkRow, keyof RawMark | 'bgName'>, bgName?: string) => {
          for (const r of raw) {
            const kind = r.track ? `${base.kind} 스피너 트랙` : r.spinner ? `${base.kind} 스피너 arc` : base.kind
            rows.push({ ...base, ...r, kind, judge: r.track ? 'record' : base.judge, bgName: bgName ?? nameBg(r.background) })
          }
        }
        const judgeFor = (v: string): Judge => (v === NEUTRAL_MUTED_VAR ? 'floor' : 'min3')

        // a. PlanCard 단계 아이콘
        let planIcons = 0
        for (const id of ['demo-plan-card', 'demo-plan-card-completed']) {
          const items = page.getByTestId(id).getByRole('list', { name: '실행 단계' }).getByRole('listitem')
          const n = await items.count()
          for (let i = 0; i < n; i += 1) {
            const item = items.nth(i)
            const state = await stateOf(item)
            const svg = item.locator(':scope > [aria-hidden="true"] svg')
            expect(await svg.count(), `${id} ${i + 1}단계 아이콘`).toBe(1)
            planIcons += 1
            const v = EXPECTED_VAR.planCardIcon[state]
            push(await measureMark(svg, 'shapes'), {
              component: `PlanCard(${id})`, kind: 'PlanCard 아이콘', state, expectVar: v, judge: judgeFor(v),
            })
          }
        }
        expect(planIcons, 'PlanCard 단계 아이콘 수').toBe(EXPECTED_COUNT.planCardIcons)

        // b. StepTimeline 점 · 글리프 (점 앞에 연결선이 있어 마지막 직계 표식)
        const tItems = page.getByRole('list', { name: '작업 타임라인' }).getByRole('listitem')
        let tDots = 0
        let tGlyphs = 0
        for (let i = 0, n = await tItems.count(); i < n; i += 1) {
          const item = tItems.nth(i)
          const state = await stateOf(item)
          const dot = item.locator(':scope > [aria-hidden="true"]').last()
          const dv = EXPECTED_VAR.stepTimelineDot[state]
          push(await measureMark(dot, 'fill'), {
            component: 'StepTimeline 점', kind: 'StepTimeline 점', state, expectVar: dv, judge: judgeFor(dv),
          })
          tDots += 1
          const glyph = dot.locator('svg')
          if ((await glyph.count()) > 0) {
            const gv = (EXPECTED_VAR.stepTimelineGlyph as Partial<Record<StepState, string>>)[state]
            expect(gv, `StepTimeline ${state} 글리프 기대 변수`).toBeTruthy()
            push(
              await measureMark(glyph, 'shapes'),
              { component: 'StepTimeline 글리프', kind: 'StepTimeline 글리프', state, expectVar: gv as string, judge: 'min3' },
              `dot ${dv}`,
            )
            tGlyphs += 1
          }
        }
        expect(tDots, 'StepTimeline 점 수').toBe(EXPECTED_COUNT.timelineDots)
        expect(tGlyphs, 'StepTimeline 글리프 수').toBe(EXPECTED_COUNT.timelineGlyphs)

        // c. RunProgress 점 · 글리프
        let rDots = 0
        let rGlyphs = 0
        for (const id of ['demo-run-progress', 'demo-run-progress-error']) {
          const items = page.getByTestId(id).getByRole('list', { name: '실행 단계' }).getByRole('listitem')
          for (let i = 0, n = await items.count(); i < n; i += 1) {
            const item = items.nth(i)
            const state = await stateOf(item)
            const dot = item.locator(':scope > [aria-hidden="true"]')
            expect(await dot.count(), `${id} ${i + 1}단계 점`).toBe(1)
            const dv = (EXPECTED_VAR.runProgressDot as Partial<Record<StepState, string>>)[state]
            expect(dv, `RunProgress ${state} 점 기대 변수`).toBeTruthy()
            push(await measureMark(dot, 'fill'), {
              component: `RunProgress 점(${id})`, kind: 'RunProgress 점', state, expectVar: dv as string,
              judge: judgeFor(dv as string),
            })
            rDots += 1
            const glyph = dot.locator('svg')
            if ((await glyph.count()) > 0) {
              const gv = (EXPECTED_VAR.runProgressGlyph as Partial<Record<StepState, string>>)[state]
              expect(gv, `RunProgress ${state} 글리프 기대 변수`).toBeTruthy()
              push(
                await measureMark(glyph, 'shapes'),
                { component: `RunProgress 글리프(${id})`, kind: 'RunProgress 글리프', state, expectVar: gv as string, judge: 'min3' },
                `dot ${dv}`,
              )
              rGlyphs += 1
            }
          }
        }
        expect(rDots, 'RunProgress 점 수').toBe(EXPECTED_COUNT.runDots)
        expect(rGlyphs, 'RunProgress 글리프 수').toBe(EXPECTED_COUNT.runGlyphs)

        // d. 기록만(D1, 2026-10-19): PlanCard 왼쪽 상태 선, 진행 막대 채움, RunProgress 머리 점
        const planRegion = (id: string) => page.getByTestId(id).getByRole('region')
        push(await measureMark(planRegion('demo-plan-card'), 'border-left'), {
          component: 'PlanCard 왼쪽 선(pending)', kind: 'PlanCard 왼쪽 선', state: '-', expectVar: '--axis-status-warning',
          judge: 'record',
        })
        push(await measureMark(planRegion('demo-plan-card-completed'), 'border-left'), {
          component: 'PlanCard 왼쪽 선(completed)', kind: 'PlanCard 왼쪽 선', state: '-', expectVar: '--axis-status-success',
          judge: 'record',
        })
        for (const id of ['demo-plan-card', 'demo-plan-card-completed']) {
          const fill = planRegion(id).locator('[aria-hidden="true"][style*="width"]')
          expect(await fill.count(), `${id} 진행 막대 채움`).toBe(1)
          push(await measureMark(fill, 'fill'), {
            component: `PlanCard 진행 막대(${id})`, kind: 'PlanCard 진행 막대', state: '-', expectVar: '--axis-status-success',
            judge: 'record',
          })
        }
        for (const id of ['demo-run-progress', 'demo-run-progress-error']) {
          const fill = page.getByTestId(id).getByRole('progressbar').locator(':scope > div')
          expect(await fill.count(), `${id} 진행 막대 채움`).toBe(1)
          push(await measureMark(fill, 'fill'), {
            component: `RunProgress 진행 막대(${id})`, kind: 'RunProgress 진행 막대', state: '-',
            expectVar: '--axis-status-running', judge: 'record',
          })
        }
        // 머리 점: status="running" 인 RunProgress 헤더의 w-2 h-2 점 (run-progress 83~85). role · testid 가 없어 클래스로 찾는다
        let rHead = 0
        for (const id of ['demo-run-progress', 'demo-run-progress-error']) {
          const heads = page.getByTestId(id).locator('div.w-2.h-2.rounded-full')
          for (let i = 0, n = await heads.count(); i < n; i += 1) {
            push(await measureMark(heads.nth(i), 'fill'), {
              component: `RunProgress 머리 점(${id})`, kind: 'RunProgress 머리 점', state: 'running',
              expectVar: '--axis-status-running', judge: 'record',
            })
            rHead += 1
          }
        }
        expect(rHead, 'RunProgress 머리 점 수').toBe(EXPECTED_COUNT.runHeadDots)

        // e. 잔여 프로브(ontology): 데모에 실요소가 없는 쌍
        if (brand === 'ontology') {
          const made = await page.evaluate((pairs) => {
            const main = document.querySelector('main')
            if (!main) return 0
            const root = document.createElement('div')
            root.setAttribute('data-nontext-probe', '')
            for (const p of pairs) {
              const box = document.createElement('div')
              box.style.background = `var(${p.bg})`
              box.style.padding = '8px'
              const host = document.createElement('span')
              host.setAttribute('data-probe', `${p.v}@${p.bg}`)
              if (p.kind === 'dot') {
                host.style.display = 'inline-block'
                host.style.width = host.style.height = '12px'
                host.style.borderRadius = '9999px'
                host.style.background = `var(${p.v})`
              } else {
                host.style.color = `var(${p.v})`
                host.innerHTML =
                  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 13l4 4L19 7"/></svg>'
              }
              box.appendChild(host)
              root.appendChild(box)
            }
            main.prepend(root)
            return root.querySelectorAll('[data-probe]').length
          }, PROBE_RESIDUAL)
          expect(made, '잔여 프로브 수').toBe(PROBE_RESIDUAL.length)
          for (const p of PROBE_RESIDUAL) {
            const host = page.locator(`[data-nontext-probe] [data-probe="${p.v}@${p.bg}"]`)
            const target = p.kind === 'dot' ? host : host.locator('svg')
            push(await measureMark(target, p.kind === 'dot' ? 'fill' : 'shapes'), {
              component: '프로브(실요소 없음)', kind: p.kind === 'dot' ? '프로브 점' : '프로브 아이콘', state: '-', expectVar: p.v,
              judge: p.kind === 'dot' ? 'floor' : 'min3',
            })
          }
        }

        // f. pulse 최저 시점(opacity .5)은 기록만(D1, 2026-10-19)
        const moved = await pulseToMid(page)
        expect(moved, 'pulse 애니메이션 수').toBeGreaterThan(0)
        const pulseRows: MarkRow[] = []
        // 위치가 아니라 단계 상태로 실행 중 항목을 고른다(데모 단계 순서가 바뀌어도 다른 점을 기록하지 않게)
        const runningItem = async (list: Locator, label: string): Promise<Locator> => {
          const found: Locator[] = []
          for (let i = 0, n = await list.getByRole('listitem').count(); i < n; i += 1) {
            const item = list.getByRole('listitem').nth(i)
            if ((await stateOf(item)) === 'running') found.push(item)
          }
          expect(found.length, `${label} 실행 중 단계 수`).toBe(1)
          return found[0]
        }
        const runningDots = [
          (await runningItem(page.getByRole('list', { name: '작업 타임라인' }), 'StepTimeline'))
            .locator(':scope > [aria-hidden="true"]').last(),
          (await runningItem(page.getByTestId('demo-run-progress').getByRole('list', { name: '실행 단계' }), 'RunProgress'))
            .locator(':scope > [aria-hidden="true"]'),
        ]
        for (const [i, dot] of runningDots.entries()) {
          const measured = await measureMark(dot, 'fill')
          expect(measured.length, `pulse50 측정 행 수 (${i})`).toBeGreaterThan(0)
          for (const r of measured) {
            const component = i === 0 ? 'StepTimeline 점 pulse50' : 'RunProgress 점 pulse50'
            // pulse 최저 시점으로 실제로 옮겨졌는지(keyframes 50%{opacity:.5})
            expect(r.opacity, `${component} 불투명도`).toBeCloseTo(0.5, 1)
            pulseRows.push({
              component, kind: component, state: 'running', expectVar: '--axis-status-running', ...r, judge: 'record',
              bgName: nameBg(r.background),
            })
          }
        }

        // 계산과 기록 (판정보다 먼저 전부 출력)
        const surface = rendered['--axis-surface-default']
        const all = [...rows, ...pulseRows]
        const calc = all.map((r) => {
          const painted = blend(r.color, r.effAlpha, r.under)
          return {
            r,
            painted,
            ratio: contrast(painted, r.background),
            rawRatio: contrast(r.color, r.background),
            probeRatio: contrast(rendered[r.expectVar] ?? r.color, surface),
          }
        })
        for (const { r, painted, ratio, rawRatio, probeRatio } of calc) {
          testInfo.annotations.push({
            type: 'nontext-contrast',
            description: JSON.stringify({
              combo, component: r.component, state: r.state, part: r.part, var: r.expectVar,
              color: hex(r.color), effAlpha: round2(r.effAlpha), opacity: round2(r.opacity), painted: hex(painted),
              background: hex(r.background), bgName: r.bgName, under: hex(r.under), underlay: r.underlay,
              underShare: round2(r.underShare), ratio: round2(ratio), rawRatio: round2(rawRatio),
              probeRatio: round2(probeRatio), judge: r.judge, floorKey: floorKey(r),
            }),
          })
          console.log(
            `[nontext-record] ${combo} ${r.component} ${r.state} ${r.part} ${r.expectVar}: ${hex(r.color)} a=${round2(r.effAlpha)}` +
              (r.underlay === '-' ? '' : ` over ${hex(r.under)}(${r.underlay} ${round2(r.underShare)})`) +
              ` → ${hex(painted)} 대 ${hex(r.background)}(${r.bgName}) = ${round2(ratio)}:1 (불투명 ${round2(rawRatio)}, 프로브식 ${round2(probeRatio)}) [${r.judge}]`,
          )
        }

        // 측정 대상 보존: 실요소 + 잔여 프로브가 M3 프로브 집합을 덮는지(ontology)
        if (brand === 'ontology') {
          const covered = new Set(
            rows.filter((r) => r.judge !== 'record' && !r.bgName.startsWith('dot ')).flatMap((r) => r.bgName.split('|').map((b) => `${r.expectVar}@${b}`)),
          )
          const missing = PROBE_PAIRS.filter((p) => !covered.has(p))
          expect(missing, 'M3 프로브가 재던 쌍 중 이번에 재지 않은 쌍').toEqual([])
        }

        // 판정
        const usedDefaultFloor = new Set<string>()
        const usedMutedFloor = new Set<string>()
        for (const { r, ratio } of calc) {
          const where = `${combo} ${r.component} ${r.state} ${r.part}`
          expect.soft(r.bgName, `${where} 바탕 이름`).not.toBe('unmatched')
          if (r.bgName.startsWith('dot ')) {
            const dotVar = r.bgName.slice(4)
            expect.soft(hex(r.background), `${where} 글리프 바탕 = ${dotVar}`).toBe(hex(rendered[dotVar]))
          }
          if (!r.component.endsWith('pulse50')) {
            expect.soft(hex(r.color), `${where} 색 = ${r.expectVar}`).toBe(hex(rendered[r.expectVar]))
          }
          if (r.judge === 'min3') {
            const floor = brand === 'default' ? DEFAULT_BRAND_FLOOR[combo]?.[floorKey(r)] : undefined
            if (floor !== undefined) {
              usedDefaultFloor.add(floorKey(r))
              expect.soft(round2(ratio), `${where} 가 기본 브랜드 하한 ${floor} 보다 낮아짐`).toBeGreaterThanOrEqual(floor)
            } else {
              expect.soft(ratio, `${where} ${hex(r.color)} 대 ${hex(r.background)} (${r.bgName})`).toBeGreaterThanOrEqual(MIN_NONTEXT)
            }
          } else if (r.judge === 'floor') {
            const floor = NEUTRAL_MUTED_FLOOR[combo]?.[r.bgName]
            expect.soft(floor ?? 0, `${where} 하한이 설정되지 않음 (${r.bgName})`).toBeGreaterThan(1)
            if (floor) {
              usedMutedFloor.add(r.bgName)
              expect.soft(round2(ratio), `${where} 가 기록된 하한 ${floor} 보다 낮아짐`).toBeGreaterThanOrEqual(floor)
            }
          }
        }

        // 하한 표 점검: 기본 브랜드 하한은 3 미만만(3:1 대상을 낮추지 않음), 두 표 모두 이번 측정에 쓰이지 않은 키가 없어야 함
        for (const [k, v] of Object.entries(DEFAULT_BRAND_FLOOR[combo] ?? {})) {
          expect.soft(v, `DEFAULT_BRAND_FLOOR ${combo} '${k}' 는 3 미만이어야 함`).toBeLessThan(MIN_NONTEXT)
          expect.soft(usedDefaultFloor.has(k), `DEFAULT_BRAND_FLOOR ${combo} '${k}' 가 측정 행과 맞지 않음`).toBe(true)
        }
        for (const k of Object.keys(NEUTRAL_MUTED_FLOOR[combo] ?? {})) {
          expect.soft(usedMutedFloor.has(k), `NEUTRAL_MUTED_FLOOR ${combo} '${k}' 가 측정 행과 맞지 않음`).toBe(true)
        }
      })
    })
  }
}

// ---------------------------------------------------------------------------
// ⑤ ui-react 폼 컨트롤 · Progress · placeholder 실요소 (WI-0079)
// ---------------------------------------------------------------------------

/**
 * how: border = border-top-color, 바탕은 부모부터 / bg = background-color, 바탕은 부모부터(썸은 트랙 위)
 *   / fill = 첫 자식(채움) background-color, 바탕은 요소(트랙)부터 / placeholder = ::placeholder color, 바탕은 요소(입력)부터
 *   / selectph = Trigger 안 첫 span(SelectValue) color, 바탕은 요소(Trigger)부터
 * surfaces: true 이면 실제 바탕에 더해 card · panel · 페이지 바탕 위에서도 min 을 요구합니다(컨트롤이 놓일 수 있는 바탕).
 * expectVar: 렌더 색이 이 변수(또는 고정 색 '#RRGGBB')의 렌더 색과 같아야 합니다(엉뚱한 요소를 재면 실패).
 */
const FORM_TARGETS = [
  { id: 'checkbox-border', path: '/components/checkbox/', sel: 'main button[role="checkbox"][data-state="unchecked"]:not([disabled])', how: 'border', min: MIN_NONTEXT, surfaces: true, expectVar: '--axis-form-control-border' },
  { id: 'radio-border', path: '/components/radio-group/', sel: 'main button[role="radio"][data-state="unchecked"]:not([disabled])', how: 'border', min: MIN_NONTEXT, surfaces: true, expectVar: '--axis-form-control-border' },
  { id: 'textarea-border', path: '/components/textarea/', sel: 'main textarea:not([disabled])', how: 'border', min: MIN_NONTEXT, surfaces: true, expectVar: '--axis-form-control-border' },
  { id: 'switch-track', path: '/components/switch/', sel: 'main button[role="switch"][data-state="unchecked"]:not([disabled])', how: 'bg', min: MIN_NONTEXT, surfaces: true, expectVar: '--axis-form-control-track' },
  { id: 'switch-thumb/track', path: '/components/switch/', sel: 'main button[role="switch"][data-state="unchecked"]:not([disabled]) > span', how: 'bg', min: MIN_NONTEXT, surfaces: false, expectVar: '#FFFFFF' },
  { id: 'slider-track', path: '/components/slider/', sel: 'main span[class*="form-control-track"]', how: 'bg', min: MIN_NONTEXT, surfaces: true, expectVar: '--axis-form-control-track' },
  { id: 'progress-default/track', path: '/components/progress/', sel: 'main [role="progressbar"][aria-label="Default 25%"]', how: 'fill', min: MIN_NONTEXT, surfaces: false, expectVar: '--axis-progress-fill-default' },
  { id: 'progress-success/track', path: '/components/progress/', sel: 'main [role="progressbar"][aria-label="Success 50%"]', how: 'fill', min: MIN_NONTEXT, surfaces: false, expectVar: '--axis-progress-fill-success' },
  { id: 'progress-warning/track', path: '/components/progress/', sel: 'main [role="progressbar"][aria-label="Warning 75%"]', how: 'fill', min: MIN_NONTEXT, surfaces: false, expectVar: '--axis-progress-fill-warning' },
  { id: 'progress-destructive/track', path: '/components/progress/', sel: 'main [role="progressbar"][aria-label="Destructive 90%"]', how: 'fill', min: MIN_NONTEXT, surfaces: false, expectVar: '--axis-progress-fill-destructive' },
  { id: 'input-placeholder', path: '/components/input/', sel: 'main input[placeholder]:not([disabled])', how: 'placeholder', min: 4.5, surfaces: false, expectVar: '--axis-input-text-placeholder' },
  // WI-0082: Select 의 placeholder 글자(SelectValue span). 값이 없는 Trigger 에만 Radix 가 data-placeholder 를 붙인다
  { id: 'select-placeholder', path: '/components/select/', sel: 'main button[role="combobox"][data-placeholder]:not([disabled])', how: 'selectph', min: 4.5, surfaces: false, expectVar: '--axis-input-text-placeholder' },
] as const

async function measureForm(locator: Locator, how: (typeof FORM_TARGETS)[number]['how']) {
  return locator.evaluate((el, m) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('canvas 2d 없음')
    const rgba = (css: string): [number, number, number, number] => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = 'rgba(0, 0, 0, 0)'
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2], d[3] / 255]
    }
    const over = (top: [number, number, number, number], under: [number, number, number]) =>
      [0, 1, 2].map((i) => Math.round(top[i] * top[3] + under[i] * (1 - top[3]))) as [number, number, number]
    const behind = (start: Element | null) => {
      const chain: Element[] = []
      for (let n: Element | null = start; n; n = n.parentElement) chain.push(n)
      let bg: [number, number, number] = [255, 255, 255]
      for (const n of chain.reverse()) {
        const c = rgba(getComputedStyle(n).backgroundColor)
        if (c[3] > 0) bg = over(c, bg)
      }
      return bg
    }
    const cs = getComputedStyle(el)
    let css: string
    let under: [number, number, number]
    if (m === 'border') {
      css = cs.borderTopColor
      under = behind(el.parentElement)
    } else if (m === 'bg') {
      css = cs.backgroundColor
      under = behind(el.parentElement)
    } else if (m === 'fill') {
      const fill = el.firstElementChild
      if (!fill) throw new Error('Progress 채움 요소 없음')
      css = getComputedStyle(fill).backgroundColor
      under = behind(el)
    } else if (m === 'selectph') {
      const span = el.querySelector('span')
      if (!span) throw new Error('Select 값 표시 span 없음')
      css = getComputedStyle(span).color
      under = behind(el)
    } else {
      css = getComputedStyle(el, '::placeholder').color
      under = behind(el)
    }
    const c = rgba(css)
    return { color: [c[0], c[1], c[2]] as [number, number, number], alpha: c[3], background: under }
  }, how)
}

interface FormRow {
  id: string
  color: Rgb
  alpha: number
  background: Rgb
  expect: Rgb
  surfaces: Record<string, Rgb> | null
  min: number
}

for (const brand of BRANDS) {
  for (const theme of THEMES) {
    test.describe(`nontext form controls (${brand}/${theme})`, () => {
      test.use({ colorScheme: theme })

      test('폼 컨트롤 경계 · 트랙 · Progress 채움 · placeholder (WI-0079)', async ({ page }, testInfo) => {
        if (brand !== 'default') await applyBrand(page, brand)
        const rows: FormRow[] = []
        for (const path of [...new Set(FORM_TARGETS.map((t) => t.path))]) {
          await page.goto(path)
          await page.waitForLoadState('networkidle')
          const html = page.locator('html')
          if (brand === 'default') await expect(html).not.toHaveAttribute('data-brand', /.+/)
          else await expect(html).toHaveAttribute('data-brand', brand)
          if (theme === 'dark') await expect(html).toHaveClass(/dark/)
          else await expect(html).not.toHaveClass(/dark/)
          const targets = FORM_TARGETS.filter((t) => t.path === path)
          const named = await resolveColors(page, {
            card: 'var(--axis-surface-default)',
            panel: 'var(--axis-surface-secondary)',
            page: 'hsl(var(--background))',
            ...Object.fromEntries(targets.map((t) => [t.id, t.expectVar.startsWith('#') ? t.expectVar : `var(${t.expectVar})`])),
          })
          for (const t of targets) {
            const loc = page.locator(t.sel)
            expect(await loc.count(), `${t.id}: 측정할 요소가 없음 (${t.sel})`).toBeGreaterThan(0)
            const m = await measureForm(loc.first(), t.how)
            rows.push({
              id: t.id,
              ...m,
              expect: named[t.id],
              surfaces: t.surfaces ? { card: named.card, panel: named.panel, page: named.page } : null,
              min: t.min,
            })
          }
        }

        expect(rows.length, '측정 대상 수 = FORM_TARGETS').toBe(FORM_TARGETS.length)
        for (const r of rows) {
          const actual = contrast(r.color, r.background)
          const extra: Record<string, number> = r.surfaces
            ? Object.fromEntries(Object.entries(r.surfaces).map(([k, v]) => [k, round2(contrast(r.color, v))]))
            : {}
          testInfo.annotations.push({
            type: 'nontext-form',
            description: JSON.stringify({
              id: r.id,
              color: hex(r.color),
              alpha: r.alpha,
              background: hex(r.background),
              ratio: round2(actual),
              ...extra,
            }),
          })
          expect.soft(r.alpha, `${r.id} 불투명`).toBe(1)
          expect.soft(hex(r.color), `${r.id} 렌더 색 = 대상 변수`).toBe(hex(r.expect))
          expect.soft(actual, `${r.id} ${hex(r.color)} / 실제 바탕 ${hex(r.background)}`).toBeGreaterThanOrEqual(r.min)
          for (const [k, v] of Object.entries(extra)) {
            expect.soft(v, `${r.id} ${hex(r.color)} / ${k}`).toBeGreaterThanOrEqual(r.min)
          }
        }
        // Q3(WI-0079): warning 과 destructive 막대는 서로 다른 색이어야 함(ontology 는 bad · bad-dark 두 단계)
        const colorOf = (id: string) => {
          const row = rows.find((r) => r.id === id)
          expect(row, `${id} 측정 행 없음`).toBeDefined()
          return hex(row!.color)
        }
        expect(colorOf('progress-warning/track'), 'Progress warning 과 destructive 가 같은 색').not.toBe(
          colorOf('progress-destructive/track'),
        )
      })
    })
  }
}
