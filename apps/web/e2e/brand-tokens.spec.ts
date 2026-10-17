import { test, expect, type Page } from '@playwright/test'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  AC6_AXIS_VARS,
  AC6_SHADCN_VARS,
  ONTOLOGY_EXPECTED,
  SHADCN_RGB_TOLERANCE,
  hexToRgb,
  maxChannelDiff,
  parseCssRgb,
  type ThemeName,
} from './brand-expectations'
import { applyBrand } from './helpers/brand'

/**
 * 브랜드 계산 스타일 검사 (WI-0025 AC6).
 *
 * 빌드된 `@axis-ds/tokens` dist 3파일(variables.css · shadcn-compat.css · brands/ontology.css)을 이 순서(U11)로
 * `page.setContent` 에 올리고, `data-brand="ontology"` 라이트 · 다크에서 7개 변수의 계산값을 잽니다.
 *   - `--axis-*` 6개: 변수 원문과 렌더 rgb 가 부록 A hex 와 정확히 같음
 *   - `--primary`(shadcn HSL): `hsl(var(--primary))` 렌더 rgb 가 부록 A hex 와 채널당 ±1 이내
 * 선택자 갈래: 라이트는 `<html>` 속성 · 하위 컨테이너, 다크는 FR-5 의 3종
 * (`[data-brand].dark` · `[data-brand][data-theme="dark"]` · `.dark [data-brand]`)을 모두 잽니다.
 * 계측 대조: 브랜드 속성이 없을 때는 같은 변수가 기대값과 달라야 합니다(브랜드 CSS 가 실제로 값을 바꿨는지).
 * `applyBrand` 헬퍼(addInitScript)는 가로챈 가짜 주소로 이동해 따로 확인합니다(개발 서버 불필요).
 *
 * 실행: `pnpm --filter @axis-ds/tokens build` 뒤 `pnpm --filter @ax/web test:e2e:tokens`
 */
const TOKENS_DIR = resolve(__dirname, '../../../packages/axis-tokens')
const DIST_FILES = ['dist/css/variables.css', 'dist/css/shadcn-compat.css', 'dist/css/brands/ontology.css'].map((p) =>
  resolve(TOKENS_DIR, p),
)
/** dist 를 만드는 입력. 이보다 오래된 dist 는 낡은 산출물로 보고 실패합니다 */
const BUILD_INPUTS = [resolve(TOKENS_DIR, 'src'), resolve(TOKENS_DIR, 'build-tokens.mjs'), resolve(TOKENS_DIR, 'scripts')]

function newestMtime(path: string): number {
  const st = statSync(path)
  if (!st.isDirectory()) return st.mtimeMs
  return readdirSync(path).reduce((m, name) => Math.max(m, newestMtime(join(path, name))), st.mtimeMs)
}

// 산출물이 없거나 입력보다 오래되면 건너뛰지 않고 실패합니다(측정 안 함 · 낡은 값 측정을 통과로 보지 않음)
for (const f of DIST_FILES) {
  if (!existsSync(f)) throw new Error(`토큰 빌드 산출물 없음: ${f} (pnpm --filter @axis-ds/tokens build 먼저)`)
}
{
  const oldestDist = Math.min(...DIST_FILES.map((f) => statSync(f).mtimeMs))
  const newestInput = Math.max(...BUILD_INPUTS.filter((p) => existsSync(p)).map(newestMtime))
  if (oldestDist < newestInput) {
    throw new Error('토큰 빌드 산출물이 src 보다 오래됨 (pnpm --filter @axis-ds/tokens build 다시 실행)')
  }
}

const CSS = DIST_FILES.map((f) => readFileSync(f, 'utf-8')).join('\n')
const ALL_VARS = [...AC6_AXIS_VARS, ...AC6_SHADCN_VARS]

interface Measured {
  /** 변수 원문(getPropertyValue) */
  raw: Record<string, string>
  /** 렌더 rgb (axis 는 var(), shadcn 은 hsl(var())) */
  rgb: Record<string, [number, number, number]>
}

/** 문서 안의 `#probe` 아래에 변수마다 칠한 상자를 만들어 계산값을 읽습니다 */
async function readProbe(page: Page): Promise<Measured> {
  const out = await page.evaluate(
    ({ axis, shadcn }) => {
      const probe = document.getElementById('probe')
      if (!probe) throw new Error('probe 없음')
      const raw: Record<string, string> = {}
      const rgb: Record<string, string> = {}
      const style = getComputedStyle(probe)
      for (const name of [...axis, ...shadcn]) {
        raw[name] = style.getPropertyValue(name).trim()
        const box = document.createElement('div')
        box.style.backgroundColor = shadcn.includes(name) ? `hsl(var(${name}))` : `var(${name})`
        probe.appendChild(box)
        rgb[name] = getComputedStyle(box).backgroundColor
        box.remove()
      }
      return { raw, rgb }
    },
    { axis: [...AC6_AXIS_VARS] as string[], shadcn: [...AC6_SHADCN_VARS] as string[] },
  )
  return {
    raw: out.raw,
    rgb: Object.fromEntries(Object.entries(out.rgb).map(([k, v]) => [k, parseCssRgb(v)])),
  }
}

function doc(htmlAttrs: string, body: string): string {
  return `<!doctype html><html${htmlAttrs}><head><style>${CSS}</style></head><body>${body}</body></html>`
}

const PROBE = '<div id="probe"></div>'

/** 선택자 갈래별 문서 (`brand` 를 빼면 같은 구조의 대조 문서) */
const SCENARIOS: { name: string; theme: ThemeName; html: (brand: boolean) => string }[] = [
  { name: 'html[data-brand]', theme: 'light', html: (b) => doc(b ? ' data-brand="ontology"' : '', PROBE) },
  {
    name: '하위 div[data-brand]',
    theme: 'light',
    html: (b) => doc('', b ? `<div data-brand="ontology">${PROBE}</div>` : `<div>${PROBE}</div>`),
  },
  {
    name: 'html[data-brand].dark',
    theme: 'dark',
    html: (b) => doc(b ? ' data-brand="ontology" class="dark"' : ' class="dark"', PROBE),
  },
  {
    name: 'html[data-brand][data-theme=dark]',
    theme: 'dark',
    // 기본 토큰은 .dark 만 보므로 대조 문서(브랜드 없음)는 라이트 기본값이 나옵니다(PRD FR-5 참고)
    html: (b) => doc(b ? ' data-brand="ontology" data-theme="dark"' : ' data-theme="dark"', PROBE),
  },
  {
    name: '.dark 아래 div[data-brand]',
    theme: 'dark',
    html: (b) => doc(' class="dark"', b ? `<div data-brand="ontology">${PROBE}</div>` : `<div>${PROBE}</div>`),
  },
]

function axisExpected(theme: ThemeName) {
  return ONTOLOGY_EXPECTED[theme].axis
}

function assertMatches(m: Measured, theme: ThemeName) {
  const exp = ONTOLOGY_EXPECTED[theme]
  // 변수 원문 (대소문자만 정규화)
  const rawAxis = Object.fromEntries(AC6_AXIS_VARS.map((n) => [n, m.raw[n].toUpperCase()]))
  expect(rawAxis).toEqual(axisExpected(theme))
  // 렌더 rgb: axis 는 정확히 같음
  const rgbAxis = Object.fromEntries(AC6_AXIS_VARS.map((n) => [n, m.rgb[n]]))
  expect(rgbAxis).toEqual(Object.fromEntries(AC6_AXIS_VARS.map((n) => [n, hexToRgb(exp.axis[n])])))
  // shadcn HSL 은 채널당 ±1
  for (const n of AC6_SHADCN_VARS) {
    expect(m.raw[n], `${n} 원문`).not.toBe('')
    const diff = maxChannelDiff(m.rgb[n], hexToRgb(exp.shadcn[n]))
    expect(diff, `${n} 렌더 rgb(${m.rgb[n].join(', ')}) 와 ${exp.shadcn[n]} 의 채널 차이`).toBeLessThanOrEqual(
      SHADCN_RGB_TOLERANCE,
    )
  }
}

test.describe('브랜드 계산 스타일 ontology (WI-0025 AC6)', () => {
  test('기대값 표 구성: 7개 변수 x 라이트 · 다크', () => {
    expect(ALL_VARS).toHaveLength(7)
    for (const theme of ['light', 'dark'] as const) {
      expect(Object.keys(ONTOLOGY_EXPECTED[theme].axis).sort()).toEqual([...AC6_AXIS_VARS].sort())
      expect(Object.keys(ONTOLOGY_EXPECTED[theme].shadcn).sort()).toEqual([...AC6_SHADCN_VARS].sort())
    }
  })

  for (const s of SCENARIOS) {
    test(`${s.theme} · ${s.name}: 7개 변수가 부록 A 와 일치`, async ({ page: p }) => {
      await p.setContent(s.html(true))
      assertMatches(await readProbe(p), s.theme)
    })

    test(`${s.theme} · ${s.name} 대조: 브랜드 속성이 없으면 기대값과 다름`, async ({ page: p }) => {
      await p.setContent(s.html(false))
      const m = await readProbe(p)
      // 모든 변수가 값을 가짐(빈 값이 우연히 '다름'으로 잡히지 않게)
      expect(ALL_VARS.filter((n) => m.raw[n] === '')).toEqual([])
      const exp = ONTOLOGY_EXPECTED[s.theme]
      expect(m.raw['--axis-button-bg-default'].toUpperCase()).not.toBe(exp.axis['--axis-button-bg-default'])
      expect(maxChannelDiff(m.rgb['--primary'], hexToRgb(exp.shadcn['--primary']))).toBeGreaterThan(SHADCN_RGB_TOLERANCE)
    })
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`applyBrand 헬퍼(addInitScript) · ${theme}: 이동한 문서의 <html> 에 data-brand 가 붙고 값이 부록 A 와 일치`, async ({
      page: p,
    }) => {
      const url = 'http://axis-brand.test/'
      await p.route(url, (route) =>
        route.fulfill({ contentType: 'text/html', body: doc(theme === 'dark' ? ' class="dark"' : '', PROBE) }),
      )
      await applyBrand(p, 'ontology')
      await p.goto(url)
      expect(await p.evaluate(() => document.documentElement.getAttribute('data-brand'))).toBe('ontology')
      assertMatches(await readProbe(p), theme)
      // 새로고침 뒤에도 다시 붙음
      await p.reload()
      expect(await p.evaluate(() => document.documentElement.getAttribute('data-brand'))).toBe('ontology')
    })
  }
})
