import { test, expect, type Locator, type Page } from '@playwright/test'
import { ONTOLOGY_EXPECTED, hexToRgb, type ThemeName } from './brand-expectations'
import { applyBrand } from './helpers/brand'

/**
 * ontology 브랜드 비텍스트 대비 검사 (WI-0025 PRD 3.2 접근성 · 부록 A · B, WCAG 1.4.11).
 *
 * axe 는 비텍스트 대비를 판정하지 않으므로 계산 스타일을 직접 잽니다. 라이트 · 다크 2조합.
 *   ① Input 포커스 링: 링 색이 `key`(= `--axis-input-border-focus`)이고 바탕 대비 3:1 이상.
 *      라이트 입력 테두리 `line-2`(#D6DADF, card 위 1.40:1)는 원본 유지 승인(부록 B ③)이라 3:1 을 요구하지 않고,
 *      비포커스 테두리 색이 `line-2` 인지만 확인합니다. 포커스 구분은 테두리가 아니라 링으로 판정합니다(결정 20).
 *      다크 `line-2`(#5F6874)는 card 위 3.12:1 이라 3:1 을 요구합니다.
 *   ② Button 포커스 링: 링 색이 `key`(= `--axis-button-border-focus`)이고 바탕 대비 3:1 이상.
 *   ③ 상태 아이콘 색(컴포넌트가 아이콘에 쓰는 `--axis-status-*` 6개): surface-default · surface-secondary 위 3:1 이상(결정 22).
 *      문서 페이지가 패키지 컴포넌트를 그리지 않아 같은 페이지에 svg 프로브를 넣어 잽니다.
 * 판정 쌍은 링 대 바탕(가장 가까운 불투명 바탕을 합성한 색)이고, 링 오프셋 색은 기록만 합니다(결정 21).
 * 측정 대상 요소가 0개면 실패합니다(미측정 0 을 통과로 읽지 않음).
 * 앱 수준 7변수(`--primary` 포함, AC6 결정 23)는 a11y.spec.ts 의 브랜드 양성 대조가 모든 페이지에서 확인합니다.
 *
 * 실행: `pnpm --filter @ax/web build` 뒤 `E2E_SERVER=static pnpm --filter @ax/web test:e2e:nontext`
 */
const BRAND = 'ontology'
const THEMES = ['light', 'dark'] as const satisfies readonly ThemeName[]
const MIN_NONTEXT = 3

/** 부록 A 입력 테두리 `line-2` */
const LINE_2: Record<ThemeName, string> = { light: '#D6DADF', dark: '#5F6874' }

/**
 * 컴포넌트가 아이콘에 쓰는 상태 색 (결정 22: 실제 렌더하는 상태 아이콘의 status-* 색).
 * plan-card · tool-call-card 단계 아이콘(neutral · running · success · error), approval-card 아이콘(info · warning).
 * 보조 아이콘 `--axis-icon-*`(부록 B 가 bad-line · muted 를 승인)은 넣지 않습니다.
 */
const STATUS_ICON_VARS = [
  '--axis-status-neutral',
  '--axis-status-running',
  '--axis-status-success',
  '--axis-status-error',
  '--axis-status-info',
  '--axis-status-warning',
] as const
const ICON_BACKGROUNDS = ['--axis-surface-default', '--axis-surface-secondary'] as const

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

const hex = (c: Rgb) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()

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
 */
async function measure(locator: Locator, mode: 'ring' | 'icon' | 'border'): Promise<Omit<Measured, 'label'>> {
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

    const start = m === 'ring' ? el.parentElement : el
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

    test('상태 아이콘 색 (토큰 프로브, /agentic/plan-card/)', async ({ page }, testInfo) => {
      await openBranded(page, '/agentic/plan-card/', theme)
      // 문서 페이지는 agentic-ui 패키지 컴포넌트가 아니라 페이지 안 시연용 구현(Tailwind gray · green 등)을 그려서
      // --axis-status-* 아이콘이 화면에 0개예요(2026-10-17 실측, out HTML 에 axis-status 0건).
      // 그래서 같은 페이지(브랜드 CSS 가 실제로 걸린 문서)에 컴포넌트와 같은 구조의 svg 를 넣어 잽니다.
      // 바탕은 PlanCard · ToolCallCard 컨테이너(surface-default)와 hover · 하단 영역(surface-secondary)입니다.
      const statuses = await page.evaluate(
        ({ vars, backgrounds }) => {
          const main = document.querySelector('main')
          if (!main) return 0
          const root = document.createElement('div')
          root.setAttribute('data-nontext-probe', '')
          for (const bg of backgrounds) {
            const box = document.createElement('div')
            box.style.background = `var(${bg})`
            box.style.padding = '8px'
            box.setAttribute('data-bg', bg)
            for (const v of vars) {
              const host = document.createElement('span')
              host.style.color = `var(${v})`
              host.setAttribute('data-status', v)
              host.innerHTML =
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 13l4 4L19 7"/></svg>'
              box.appendChild(host)
            }
            root.appendChild(box)
          }
          main.prepend(root)
          return root.querySelectorAll('svg').length
        },
        { vars: STATUS_ICON_VARS, backgrounds: ICON_BACKGROUNDS },
      )
      expect(statuses, '측정할 아이콘 프로브가 없음').toBe(STATUS_ICON_VARS.length * ICON_BACKGROUNDS.length)

      const rows: Measured[] = []
      const svgs = page.locator('[data-nontext-probe] svg')
      for (let i = 0; i < statuses; i++) {
        const svg = svgs.nth(i)
        const label = await svg.evaluate(
          (el) => `${el.parentElement?.getAttribute('data-status')} on ${el.closest('[data-bg]')?.getAttribute('data-bg')}`,
        )
        rows.push({ label, ...(await measure(svg, 'icon')) })
      }
      report(testInfo, rows)
      for (const r of rows) {
        expect(r.alpha, `${r.label} 알파`).toBe(1)
        expect(contrast(r.color, r.background), `${r.label} ${hex(r.color)} 대 ${hex(r.background)}`).toBeGreaterThanOrEqual(
          MIN_NONTEXT,
        )
      }
    })
  })
}
