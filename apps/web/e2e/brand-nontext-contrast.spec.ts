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
 *   ④ 대기 · 건너뜀 상태 점 `--axis-status-neutral-muted`(step-timeline 71 · 72, run-progress 30 의 바탕 채움):
 *      같은 바탕 2종 위에서 재고 기록합니다. 라이트 `line-2`(#D6DADF)는 1.40:1 로 3:1 에 못 미치지만
 *      (다크 #5F6874 도 surface-secondary 위 2.83:1) 값은 바꾸지 않고 디자인 오너 사후 확인 대상으로 둡니다(2026-10-18 사용자 결정, 기본 테마 gray-300 도 1.47:1 수준의 기존 미달).
 *      그래서 3:1 로 실패시키지 않고, 측정값이 아래 `NEUTRAL_MUTED_FLOOR` 하한보다 낮아지면 실패하는 회귀 가드로 둡니다.
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

/**
 * 대기 · 건너뜀 상태 점(바탕 채움) 색. 3:1 미달을 알고 두는 값이라 판정은 하한 고정 회귀 가드입니다.
 * 바탕은 run-progress 컨테이너(surface-default, 76행)와 현재 단계 행(surface-secondary, 122행)입니다.
 */
const NEUTRAL_MUTED_VAR = '--axis-status-neutral-muted'
/**
 * 하한 = 2026-10-18 실측값(소수 둘째 자리, static out · chromium). 측정값이 이보다 낮아지면 실패합니다.
 *   ontology 라이트 #D6DADF: surface-default #FFFFFF 위 1.40, surface-secondary #F3F4F6 위 1.28
 *   ontology 다크  #5F6874: surface-default #17191D 위 3.12, surface-secondary #1F2227 위 2.83
 * 다크도 surface-secondary 위에서는 3:1 에 못 미칩니다(2.83). 함께 사후 확인 대상입니다.
 * 값을 올리는 변경(대비 개선)은 통과하므로, 개선했으면 이 하한도 새 측정값으로 올립니다.
 * 디자인 오너 확인으로 값이 바뀌면 plan 5.3 과 todo 「디자인 오너 사후 확인 목록」을 함께 고칩니다.
 */
const NEUTRAL_MUTED_FLOOR: Record<ThemeName, Record<(typeof ICON_BACKGROUNDS)[number], number>> = {
  light: { '--axis-surface-default': 1.4, '--axis-surface-secondary': 1.28 },
  dark: { '--axis-surface-default': 3.12, '--axis-surface-secondary': 2.83 },
}

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

    test('상태 아이콘 색 (토큰 프로브, /agentic/plan-card/)', async ({ page }, testInfo) => {
      await openBranded(page, '/agentic/plan-card/', theme)
      // 문서 페이지는 agentic-ui 패키지 컴포넌트가 아니라 페이지 안 시연용 구현(Tailwind gray · green 등)을 그려서
      // --axis-status-* 아이콘이 화면에 0개예요(2026-10-17 실측, out HTML 에 axis-status 0건).
      // 그래서 같은 페이지(브랜드 CSS 가 실제로 걸린 문서)에 컴포넌트와 같은 구조의 svg 를 넣어 잽니다.
      // 바탕은 PlanCard · ToolCallCard 컨테이너(surface-default)와 hover · 하단 영역(surface-secondary)입니다.
      const statuses = await page.evaluate(
        ({ vars, backgrounds, dotVar }) => {
          const main = document.querySelector('main')
          if (!main) return 0
          const root = document.createElement('div')
          root.setAttribute('data-nontext-probe', '')
          for (const bg of backgrounds) {
            const box = document.createElement('div')
            box.style.background = `var(${bg})`
            box.style.padding = '8px'
            box.setAttribute('data-bg', bg)
            // 상태 점 프로브(step-timeline 점과 같은 크기의 바탕 채움)
            const dot = document.createElement('span')
            dot.style.display = 'inline-block'
            dot.style.width = dot.style.height = '12px'
            dot.style.borderRadius = '9999px'
            dot.style.background = `var(${dotVar})`
            dot.setAttribute('data-nontext-dot', dotVar)
            box.appendChild(dot)
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
        { vars: STATUS_ICON_VARS, backgrounds: ICON_BACKGROUNDS, dotVar: NEUTRAL_MUTED_VAR },
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

      // ④ 대기 · 건너뜀 상태 점: 기록 + 하한 회귀 가드(3:1 로 판정하지 않음)
      const dots = page.locator('[data-nontext-probe] [data-nontext-dot]')
      expect(await dots.count(), '측정할 상태 점 프로브가 없음').toBe(ICON_BACKGROUNDS.length)
      const dotRows: (Measured & { bg: (typeof ICON_BACKGROUNDS)[number] })[] = []
      for (let i = 0; i < ICON_BACKGROUNDS.length; i++) {
        const dot = dots.nth(i)
        const bg = (await dot.evaluate((el) => el.closest('[data-bg]')?.getAttribute('data-bg'))) as (typeof ICON_BACKGROUNDS)[number]
        expect(ICON_BACKGROUNDS, '상태 점 바탕').toContain(bg)
        dotRows.push({ label: `${NEUTRAL_MUTED_VAR} dot on ${bg} (기록 · 하한 가드)`, bg, ...(await measure(dot, 'fill')) })
      }
      report(testInfo, [...rows, ...dotRows])

      for (const r of rows) {
        expect(r.alpha, `${r.label} 알파`).toBe(1)
        expect(contrast(r.color, r.background), `${r.label} ${hex(r.color)} 대 ${hex(r.background)}`).toBeGreaterThanOrEqual(
          MIN_NONTEXT,
        )
      }
      const ratioOf = (r: Measured) => Math.round(contrast(r.color, r.background) * 100) / 100
      // 판정 전에 전부 출력해 하나가 실패해도 나머지 측정값이 로그(list reporter stdout)에 남게 합니다
      for (const r of dotRows) {
        console.log(
          `[nontext-record] ${BRAND}/${theme} ${r.label}: ${hex(r.color)} 대 ${hex(r.background)} = ${ratioOf(r)}:1 (하한 ${NEUTRAL_MUTED_FLOOR[theme][r.bg]}, 기준 ${MIN_NONTEXT}:1 미적용)`,
        )
      }
      for (const r of dotRows) {
        const ratio = ratioOf(r)
        const floor = NEUTRAL_MUTED_FLOOR[theme][r.bg]
        expect(r.alpha, `${r.label} 알파`).toBe(1)
        expect(floor, `${r.label} 하한이 설정되지 않음`).toBeGreaterThan(1)
        expect(ratio, `${r.label} ${hex(r.color)} 대 ${hex(r.background)} 가 기록된 하한 ${floor} 보다 낮아짐`).toBeGreaterThanOrEqual(
          floor,
        )
      }
    })
  })
}
