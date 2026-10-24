// @ts-check
/**
 * Tailwind CSS 4 진입점(dist/css/tailwind4.css) 생성 (WI-0044 FR-1)
 *
 * Tailwind 3 preset(src/tailwind-preset.ts)을 같은 출처로 삼아 Tailwind 4 의 `@theme inline` 과
 * `@custom-variant dark` 로 옮긴다. 손으로 쓴 사본을 두지 않으므로 preset 을 고치면 진입점도 같이 바뀐다.
 *
 * - preset 에 이 변환기가 모르는 키(theme.extend 의 새 항목, darkMode 의 다른 전략 등)가 생기면
 *   조용히 빠뜨리지 않고 throw 한다. 빠진 매핑은 Tailwind 4 에서 클래스가 생성되지 않을 뿐 오류가 없어서
 *   눈에 띄지 않기 때문이다.
 * - theme.extend.keyframes 는 테마 변수가 아니라 `@keyframes` 블록으로, theme.extend.animation 은 `--animate-*` 로 옮긴다
 *   (WI-0046). animation 이 preset 에 없는 keyframes 를 가리키면 throw 한다(Tailwind 4 에서 이름만 있고 동작하지 않음).
 * - 맨 위에서 같은 디렉터리의 variables.css · shadcn-compat.css 를 `layer(base)` 로 불러온다.
 *   사용자는 `@import "@axis-ds/tokens/css/tailwind4";` 한 줄로 토큰 변수와 매핑을 함께 얻는다.
 *   layer(base) 로 넣는 이유: shadcn-compat.css 의 `* { border-color }` · `body { background-color }` 가
 *   레이어 밖에 있으면 Tailwind 4 의 utilities 레이어(`border-red-500`, `bg-*`)보다 항상 이긴다.
 *
 * preset 은 TypeScript 라서 Node 20(CI)에서 바로 import 할 수 없다. typescript(devDependency)의
 * transpileModule 로 JavaScript 로 바꾼 뒤 data: URL 로 import 한다. 테스트도 같은 로더를 쓴다.
 */
import { readFileSync } from 'node:fs'
import ts from 'typescript'

/** Tailwind 4 테마 변수 이름에 쓸 수 있는 키 */
const KEY_RE = /^[a-z0-9][a-z0-9-]*$/i

/** theme.extend 에서 이 변환기가 아는 키와 Tailwind 4 테마 변수 접두사 */
export const NAMESPACES = /** @type {const} */ ({
  colors: 'color',
  borderRadius: 'radius',
  fontFamily: 'font',
  animation: 'animate',
})

/** theme.extend 에서 테마 변수가 아니라 `@keyframes` 블록으로 옮기는 키 */
export const KEYFRAMES_KEY = 'keyframes'

/** keyframes 단계 선택자: from · to · 0% · 12.5% 와 그 쉼표 목록 */
const STEP_RE = /^(?:from|to|\d+(?:\.\d+)?%)(?:, (?:from|to|\d+(?:\.\d+)?%))*$/

/** keyframes 안의 CSS 속성 이름. Tailwind 3 은 camelCase 도 받지만 Tailwind 4 로 그대로 옮기려고 kebab-case 만 받는다 */
const PROP_RE = /^[a-z][a-z-]*$/

/** preset 의 darkMode ['class'] 와 짝을 이루는 Tailwind 4 변형 선택자(.dark 요소 자신과 그 자손) */
export const DARK_VARIANT = '&:where(.dark, .dark *)'

/** 진입점이 함께 불러오는 같은 디렉터리의 토큰 CSS (build-tokens.mjs 가 만드는 파일 이름) */
export const IMPORTED_CSS = ['variables.css', 'shadcn-compat.css']

/**
 * src/tailwind-preset.ts 를 읽어 preset 객체를 돌려준다.
 *
 * @param {string} presetPath
 * @returns {Promise<Record<string, any>>}
 */
export async function loadPresetFromSource(presetPath) {
  const source = readFileSync(presetPath, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
    fileName: presetPath,
  })
  const mod = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
  if (!mod.default || typeof mod.default !== 'object') {
    throw new Error(`${presetPath}: default export 가 객체가 아닙니다`)
  }
  return mod.default
}

/**
 * @param {string} where
 * @param {unknown} value
 * @returns {string}
 */
function stringValue(where, value) {
  if (typeof value === 'string' && value.trim() !== '') return value
  if (Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'string')) return value.join(', ')
  throw new Error(`${where}: 문자열 값이 아닙니다 (${JSON.stringify(value)})`)
}

/**
 * Tailwind 3 의 중첩 키(primary.DEFAULT, primary.foreground, chart.1)를 Tailwind 4 이름으로 펼친다.
 * DEFAULT 는 부모 이름 그대로(primary), 나머지는 하이픈으로 잇는다(primary-foreground, chart-1).
 *
 * @param {string} where
 * @param {Record<string, unknown>} obj
 * @param {string[]} [path]
 * @returns {Array<[string, string]>}
 */
function flatten(where, obj, path = []) {
  /** @type {Array<[string, string]>} */
  const out = []
  for (const [key, value] of Object.entries(obj)) {
    if (key !== 'DEFAULT' && !KEY_RE.test(key)) throw new Error(`${where}: 쓸 수 없는 키 "${key}"`)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out.push(...flatten(where, /** @type {Record<string, unknown>} */ (value), [...path, key]))
      continue
    }
    const names = key === 'DEFAULT' ? path : [...path, key]
    if (names.length === 0) throw new Error(`${where}: 최상위 DEFAULT 는 이름을 만들 수 없습니다`)
    out.push([names.join('-'), stringValue(`${where}.${[...path, key].join('.')}`, value)])
  }
  return out
}

/**
 * theme.extend.keyframes 를 `@keyframes` 블록 목록으로 바꾼다. 형태는 { 이름: { 단계: { 속성: 값 } } } 만 받는다.
 *
 * @param {unknown} keyframes
 * @returns {Array<{ name: string, steps: Array<{ selector: string, decls: Array<[string, string]> }> }>}
 */
function keyframesBlocks(keyframes) {
  const where = `preset.theme.extend.${KEYFRAMES_KEY}`
  if (!keyframes || typeof keyframes !== 'object' || Array.isArray(keyframes)) throw new Error(`${where}: 객체가 아닙니다`)
  return Object.entries(keyframes).map(([name, steps]) => {
    if (!KEY_RE.test(name)) throw new Error(`${where}: 쓸 수 없는 이름 "${name}"`)
    if (!steps || typeof steps !== 'object' || Array.isArray(steps) || Object.keys(steps).length === 0) {
      throw new Error(`${where}.${name}: 단계 객체가 아닙니다`)
    }
    return {
      name,
      steps: Object.entries(steps).map(([selector, decls]) => {
        if (!STEP_RE.test(selector)) throw new Error(`${where}.${name}: 단계 선택자가 아닙니다 "${selector}"`)
        if (!decls || typeof decls !== 'object' || Array.isArray(decls) || Object.keys(decls).length === 0) {
          throw new Error(`${where}.${name}["${selector}"]: 선언 객체가 아닙니다`)
        }
        return {
          selector,
          decls: Object.entries(decls).map(([prop, value]) => {
            if (!PROP_RE.test(prop)) throw new Error(`${where}.${name}["${selector}"]: kebab-case 속성 이름이 아닙니다 "${prop}"`)
            if (typeof value !== 'string' || value.trim() === '') {
              throw new Error(`${where}.${name}["${selector}"].${prop}: 문자열 값이 아닙니다 (${JSON.stringify(value)})`)
            }
            return /** @type {[string, string]} */ ([prop, value])
          }),
        }
      }),
    }
  })
}

/**
 * preset 을 Tailwind 4 테마 변수 목록으로 바꾼다. 순서는 preset 선언 순서를 따른다.
 *
 * @param {Record<string, any>} preset
 * @returns {{
 *   darkSelector: string,
 *   vars: Array<{ namespace: string, name: string, value: string }>,
 *   keyframes: ReturnType<typeof keyframesBlocks>,
 * }}
 */
export function presetToTheme(preset) {
  for (const key of Object.keys(preset)) {
    if (key !== 'darkMode' && key !== 'theme') throw new Error(`preset.${key}: Tailwind 4 진입점 변환을 모르는 키입니다`)
  }
  const darkMode = preset.darkMode
  const isClass = darkMode === 'class' || (Array.isArray(darkMode) && darkMode.length === 1 && darkMode[0] === 'class')
  if (!isClass) throw new Error(`preset.darkMode: ['class'] 만 지원합니다 (${JSON.stringify(darkMode)})`)

  const theme = preset.theme ?? {}
  for (const key of Object.keys(theme)) {
    if (key !== 'extend') throw new Error(`preset.theme.${key}: extend 밖의 테마 키는 지원하지 않습니다`)
  }
  const extend = theme.extend ?? {}
  /** @type {Array<{ namespace: string, name: string, value: string }>} */
  const vars = []
  /** @type {ReturnType<typeof keyframesBlocks>} */
  let keyframes = []
  for (const [key, value] of Object.entries(extend)) {
    if (key === KEYFRAMES_KEY) {
      keyframes = keyframesBlocks(value)
      continue
    }
    const namespace = /** @type {Record<string, string>} */ (NAMESPACES)[key]
    if (!namespace) throw new Error(`preset.theme.extend.${key}: Tailwind 4 진입점 변환을 모르는 키입니다`)
    if (!value || typeof value !== 'object') throw new Error(`preset.theme.extend.${key}: 객체가 아닙니다`)
    for (const [name, v] of flatten(`preset.theme.extend.${key}`, value)) vars.push({ namespace, name, value: v })
  }
  const seen = new Set()
  for (const v of vars) {
    const id = `--${v.namespace}-${v.name}`
    if (seen.has(id)) throw new Error(`${id}: 같은 테마 변수가 두 번 만들어집니다`)
    seen.add(id)
  }
  const keyframeNames = new Set(keyframes.map(k => k.name))
  for (const v of vars) {
    if (v.namespace !== NAMESPACES.animation) continue
    const ref = v.value.trim().split(/\s+/)[0]
    if (!keyframeNames.has(ref)) {
      throw new Error(`preset.theme.extend.animation.${v.name}: preset.theme.extend.keyframes 에 없는 "${ref}" 를 가리킵니다`)
    }
  }
  return { darkSelector: DARK_VARIANT, vars, keyframes }
}

/**
 * dist/css/tailwind4.css 내용을 만든다.
 *
 * @param {Record<string, any>} preset
 * @returns {string}
 */
export function buildTailwind4Css(preset) {
  const { darkSelector, vars, keyframes } = presetToTheme(preset)
  const imports = IMPORTED_CSS.map(f => `@import "./${f}" layer(base);`).join('\n')
  const decls = vars.map(v => `  --${v.namespace}-${v.name}: ${v.value};`).join('\n')
  const keyframesCss = keyframes
    .map(k => {
      const steps = k.steps
        .map(st => `  ${st.selector} {\n${st.decls.map(([p, v]) => `    ${p}: ${v};`).join('\n')}\n  }`)
        .join('\n')
      return `\n@keyframes ${k.name} {\n${steps}\n}\n`
    })
    .join('')
  return `/**
 * AXIS Design System - Tailwind CSS 4 진입점
 * Generated from src/tailwind-preset.ts (Tailwind 3 preset 과 같은 매핑)
 * Do not edit directly
 *
 * Usage (@import "tailwindcss" 뒤에):
 *   @import "tailwindcss";
 *   @import "@axis-ds/tokens/css/tailwind4";
 *
 * 토큰 변수(variables.css · shadcn-compat.css)를 base 레이어로 함께 불러옵니다.
 * 브랜드 CSS(@axis-ds/tokens/css/brands/*)는 이 줄 뒤에 import 합니다.
 * keyframes(accordion · progress)는 아래 @keyframes 와 --animate-* 로 정의합니다.
 * animate-in · fade-in-0 류 열고 닫는 애니메이션은 애니메이션 플러그인(tw-animate-css 등)이 따로 필요합니다.
 */

${imports}

@custom-variant dark (${darkSelector});

@theme inline {
${decls}
}
${keyframesCss}`
}
