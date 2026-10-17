// @ts-check
/**
 * 테마 모드 공용 모듈 (WI-0033)
 *
 * component 토큰은 라이트 값을 `value`에, 다크 값을 `$extensions.axis.dark`에 함께 둡니다.
 *
 *   "default": { "value": "{color.white}", "$extensions": { "axis": { "dark": "{surface.default}" } } }
 *
 * 다크에서도 같은 값을 쓰는 leaf(채움 버튼 · transparent · 그림자 등)는 같은 값을 두 번 적지 않고
 * `$extensions.axis.themeIndependent: true` 마커만 붙입니다.
 *
 * 폐기 예정 leaf(WI-0025 U23)는 `$extensions.axis.deprecated`에 대체 토큰 경로(점 결합, 예: "card-shadow")를 둡니다.
 * 이 마커는 테마 값에 영향이 없고 CSS 출력도 바꾸지 않습니다(커스텀 포맷은 이름과 값만 냅니다).
 *
 * 다크 빌드는 preprocessor `axis/theme-dark`로 참조 해석 전에 `value`를 다크 값으로 바꿉니다.
 * 확장이 없는 leaf는 건드리지 않으므로, 이 preprocessor를 쓰지 않는 빌드(라이트 · 브랜드)는 종전과 같습니다.
 *
 * 이 모듈은 최상위 실행 코드가 없고 style-dictionary를 직접 import하지 않습니다.
 * build-tokens.mjs(최상위 await)를 import할 수 없는 곳(브랜드 빌드 · 테스트 · CI 검사)에서 그대로 씁니다.
 *
 * 기본 다크 빌드 설정(darkBuildConfig)과, 산출물 `.dark` 값을 검사할 기대값 계산(findDarkValueExpectations)도 여기에 둡니다.
 *
 * 브랜드 다크 빌드에 붙일 때(WI-0025 M2 rebase):
 *   registerThemePreprocessors(StyleDictionary)
 *   new StyleDictionary({ ..., preprocessors: themePreprocessorsFor(theme) })
 */

export const THEME_DARK_PREPROCESSOR = 'axis/theme-dark'

/** `$extensions.axis` 안에서 허용하는 키 (테마 키 2개 + 폐기 예정 메타 1개, WI-0025 U23) */
const THEME_KEYS = new Set(['dark', 'themeIndependent', 'deprecated'])

/** 색이 아닌 값으로 풀리는 참조의 최상위 범주 (그 밖의 참조는 색으로 봅니다) */
const NON_COLOR_REF_ROOTS = new Set(['space', 'radius', 'font', 'shadow', 'size', 'duration', 'opacity', 'z', 'zIndex'])

const NUMBER = String.raw`-?(?:\d+\.?\d*|\.\d+)`
const UNIT = String.raw`(?:px|rem|em|%|vh|vw|ch|ms|s)?`
/** 길이 · 숫자 · 시간 한 개 (예: 4px, 0, 0.5rem, 150ms) */
const LENGTH_RE = new RegExp(`^${NUMBER}${UNIT}$`)
/** 그림자 리터럴: 길이가 두 개 이상 이어진 뒤 색이 오는 형태 (예: 0 1px 3px 0 rgb(0 0 0 / 0.1)) */
const SHADOW_RE = new RegExp(`^(?:inset\\s+)?(?:${NUMBER}${UNIT}\\s+){2,}`)

/**
 * @param {unknown} node
 * @returns {node is Record<string, any>}
 */
function isPlainObject(node) {
  return node !== null && typeof node === 'object' && !Array.isArray(node)
}

/**
 * @param {unknown} node
 * @returns {node is Record<string, any>}
 */
function isLeaf(node) {
  return isPlainObject(node) && Object.prototype.hasOwnProperty.call(node, 'value')
}

/**
 * 색이 아닌 값인지 판정합니다. 판정은 보수적입니다: 길이 · 숫자 · 그림자 · 비색 범주 참조로
 * 확인된 값만 비색이고, 나머지(transparent · currentColor · 이름 있는 색 · rgba() · 알 수 없는 참조)는 모두 색입니다.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isNonColorValue(value) {
  if (typeof value === 'number' || typeof value === 'boolean') return true
  if (typeof value !== 'string') return false
  const v = value.trim()
  const ref = /^\{([^.}]+)[.}]/.exec(v)
  if (ref) return NON_COLOR_REF_ROOTS.has(ref[1])
  if (v === 'none') return true
  if (LENGTH_RE.test(v)) return true
  if (SHADOW_RE.test(v)) return true
  return false
}

/**
 * 토큰 트리에서 `$extensions.axis[theme]`가 있는 leaf의 `value`를 그 값으로 바꿉니다(제자리 수정).
 * `$`로 시작하는 키 아래로는 내려가지 않습니다. 바꾼 leaf 수를 돌려줍니다.
 *
 * @param {unknown} tree
 * @param {string} theme
 * @returns {number}
 */
export function applyThemeValues(tree, theme) {
  let replaced = 0
  ;(/** @param {unknown} node */ function walk(node) {
    if (!isPlainObject(node)) return
    if (isLeaf(node)) {
      const v = node.$extensions?.axis?.[theme]
      if (v !== undefined) {
        node.value = v
        replaced++
      }
      return
    }
    for (const [key, child] of Object.entries(node)) {
      if (!key.startsWith('$')) walk(child)
    }
  })(tree)
  return replaced
}

/**
 * Style Dictionary 클래스에 테마 preprocessor를 등록합니다. 여러 번 불러도 같은 이름으로 덮어씁니다.
 * 타입 import 만 쓰므로 실행 시에는 style-dictionary 를 불러오지 않습니다.
 *
 * @param {typeof import('style-dictionary').default} StyleDictionary
 * @returns {void}
 */
export function registerThemePreprocessors(StyleDictionary) {
  StyleDictionary.registerPreprocessor({
    name: THEME_DARK_PREPROCESSOR,
    preprocessor: (dictionary) => {
      applyThemeValues(dictionary, 'dark')
      return dictionary
    },
  })
}

/**
 * 테마 이름에 맞는 preprocessor 목록 (`new StyleDictionary({ preprocessors })`에 그대로 넣습니다)
 *
 * @param {string} theme
 * @returns {string[]}
 */
export function themePreprocessorsFor(theme) {
  return theme === 'dark' ? [THEME_DARK_PREPROCESSOR] : []
}

/**
 * 기본 다크 빌드(build-tokens.mjs 의 sdDark) 설정입니다.
 * build-tokens.mjs 와 테스트가 같은 설정을 쓰도록 여기에 둡니다(build-tokens.mjs 는 최상위 await 라 import 하지 않습니다).
 * `root`를 주면 source · buildPath 앞에 붙입니다(테스트용). 주지 않으면 패키지 디렉터리 기준 상대 경로입니다.
 *
 * @param {{ root?: string }} [options]
 */
export function darkBuildConfig({ root } = {}) {
  const at = (/** @type {string} */ p) => (root ? `${root}/${p}` : p)
  return {
    preprocessors: themePreprocessorsFor('dark'),
    source: [
      at('src/primitives/**/*.json'),
      at('src/semantic/dark.json'),
      at('src/component/**/*.json'),
    ],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: at('dist/css/'),
        files: [{
          destination: '_dark.css',
          format: 'css/axis-variables-dark'
        }]
      }
    }
  }
}

/**
 * 토큰 경로를 CSS 변수 이름으로 바꿉니다(build-tokens.mjs 의 cssVarName 과 같은 규칙: 세그먼트의 점은 하이픈)
 *
 * @param {ReadonlyArray<string | number>} path
 * @returns {string}
 */
export function cssVarNameOf(path) {
  return `--axis-${path.map((seg) => String(seg).replace(/\./g, '-')).join('-')}`
}

/**
 * 토큰 트리 여러 개를 { 'a.b.c': value } Map 으로 펼칩니다. `$`로 시작하는 키 아래로는 내려가지 않습니다.
 *
 * @param {unknown[]} trees
 * @returns {Map<string, unknown>}
 */
export function flattenTokens(trees) {
  /** @type {Map<string, unknown>} */
  const out = new Map()
  for (const tree of trees) {
    ;(/** @param {unknown} node @param {string[]} path */ function walk(node, path) {
      if (!isPlainObject(node)) return
      if (isLeaf(node)) {
        out.set(path.join('.'), node.value)
        return
      }
      for (const [key, child] of Object.entries(node)) {
        if (!key.startsWith('$')) walk(child, [...path, key])
      }
    })(tree, [])
  }
  return out
}

/**
 * `{a.b}` 참조를 끝까지 풉니다. 풀 수 없는 참조나 순환은 예외를 던집니다(측정 실패로 다룹니다).
 * Style Dictionary 의 값 변환(transform)은 하지 않으므로, 라이트 · 다크 값이 같은지 비교하는 데에만 씁니다.
 *
 * @param {Map<string, unknown>} map
 * @param {unknown} value
 * @param {string[]} [seen]
 * @returns {string}
 */
export function resolveTokenValue(map, value, seen = []) {
  if (typeof value !== 'string') return String(value)
  return value.replace(/\{([^{}]+)\}/g, (_, ref) => {
    if (seen.includes(ref)) throw new Error(`순환 참조: ${[...seen, ref].join(' -> ')}`)
    if (!map.has(ref)) throw new Error(`풀 수 없는 참조: {${ref}}`)
    return resolveTokenValue(map, map.get(ref), [...seen, ref])
  })
}

/**
 * 다크 값이 라이트 값과 달라야 하는 component leaf 목록을 소스에서 계산합니다.
 *
 * 대상: `axis.dark`가 있고, 다크 소스(primitives + 다크 semantic + 다크 값을 넣은 component)로 푼 값이
 * 라이트 소스(primitives + 라이트 semantic + component)로 푼 값과 다른 leaf. 산출물 `.dark` 값이 `:root` 값과
 * 같다면 다크 빌드가 다크 선언을 반영하지 않은 것입니다(preprocessor 배선 누락 같은 회귀).
 *
 * 돌려주는 값: { declared: axis.dark leaf 수, changed: [{ path, name, light, dark }] }
 *
 * @param {{ base: unknown[], light: unknown, dark: unknown, components: unknown[] }} sources
 * @returns {{ declared: number, changed: Array<{ path: string, name: string, light: string, dark: string }> }}
 */
export function findDarkValueExpectations({ base, light, dark, components }) {
  const darkComponents = components.map((tree) => {
    const copy = structuredClone(tree)
    applyThemeValues(copy, 'dark')
    return copy
  })
  const lightMap = flattenTokens([...base, light, ...components])
  const darkMap = flattenTokens([...base, dark, ...darkComponents])
  /** @type {Array<{ path: string, name: string, light: string, dark: string }>} */
  const changed = []
  let declared = 0
  for (const tree of components) {
    ;(/** @param {unknown} node @param {string[]} path */ function walk(node, path) {
      if (!isPlainObject(node)) return
      if (isLeaf(node)) {
        if (node.$extensions?.axis?.dark === undefined) return
        declared++
        const key = path.join('.')
        const l = resolveTokenValue(lightMap, lightMap.get(key))
        const d = resolveTokenValue(darkMap, darkMap.get(key))
        if (l !== d) changed.push({ path: key, name: cssVarNameOf(path), light: l, dark: d })
        return
      }
      for (const [k, child] of Object.entries(node)) {
        if (!k.startsWith('$')) walk(child, [...path, k])
      }
    })(tree, [])
  }
  return { declared, changed }
}

/**
 * component 토큰 트리의 테마 선언을 검사합니다.
 *
 * 위반
 *   - 색 leaf에 `axis.dark`도 `axis.themeIndependent`도 없음
 *   - `axis.dark`와 `axis.themeIndependent`를 함께 선언
 *   - `axis.dark`가 문자열이 아니거나 라이트 `value`와 같은 문자열 (같은 값이면 마커를 씁니다)
 *   - `axis.themeIndependent`가 true가 아님, `axis`에 알 수 없는 키 (오타 방지)
 *   - `axis.deprecated`가 빈 문자열 · 문자열이 아님, 대체 경로가 같은 트리의 leaf가 아니거나 그 자신 · 폐기 예정 leaf
 *
 * 돌려주는 값: { leaves, colorLeaves, violations: [{ path, reason }] }
 *
 * @param {unknown} tree
 * @returns {{ leaves: number, colorLeaves: number, violations: Array<{ path: string, reason: string }> }}
 */
export function findThemeDeclarationViolations(tree) {
  /** @type {Array<{ path: string, reason: string }>} */
  const violations = []
  let leaves = 0
  let colorLeaves = 0
  /** @type {Set<string>} 같은 트리의 leaf 경로 (폐기 예정 대체 경로 판정용) */
  const leafPaths = new Set()
  /** @type {Map<string, string>} 폐기 예정 leaf 경로 -> 대체 경로 */
  const deprecated = new Map()
  ;(/** @param {unknown} node @param {string[]} path */ function walk(node, path) {
    if (!isPlainObject(node)) return
    if (isLeaf(node)) {
      leaves++
      const name = path.join('.')
      leafPaths.add(name)
      const isColor = !isNonColorValue(node.value)
      if (isColor) colorLeaves++
      const axis = node.$extensions?.axis
      if (axis !== undefined && !isPlainObject(axis)) {
        violations.push({ path: name, reason: '$extensions.axis가 객체가 아닙니다' })
        return
      }
      const hasDark = axis !== undefined && Object.prototype.hasOwnProperty.call(axis, 'dark')
      const hasIndependent = axis !== undefined && Object.prototype.hasOwnProperty.call(axis, 'themeIndependent')
      for (const key of Object.keys(axis ?? {})) {
        if (!THEME_KEYS.has(key)) violations.push({ path: name, reason: `$extensions.axis에 알 수 없는 키: ${key}` })
      }
      if (hasDark && hasIndependent) {
        violations.push({ path: name, reason: 'axis.dark와 axis.themeIndependent를 함께 선언했습니다' })
      }
      if (hasDark && typeof axis.dark !== 'string') {
        violations.push({ path: name, reason: 'axis.dark가 문자열이 아닙니다' })
      } else if (hasDark && axis.dark === node.value) {
        violations.push({ path: name, reason: 'axis.dark가 라이트 value와 같습니다. axis.themeIndependent: true를 쓰세요' })
      }
      if (hasIndependent && axis.themeIndependent !== true) {
        violations.push({ path: name, reason: 'axis.themeIndependent는 true만 허용합니다' })
      }
      if (isColor && !hasDark && !hasIndependent) {
        violations.push({ path: name, reason: `색 leaf(${JSON.stringify(node.value)})에 axis.dark도 axis.themeIndependent도 없습니다` })
      }
      if (axis !== undefined && Object.prototype.hasOwnProperty.call(axis, 'deprecated')) {
        if (typeof axis.deprecated !== 'string' || axis.deprecated.trim() === '') {
          violations.push({ path: name, reason: 'axis.deprecated는 대체 토큰 경로(비어 있지 않은 문자열)여야 합니다' })
        } else {
          deprecated.set(name, axis.deprecated)
        }
      }
      return
    }
    for (const [key, child] of Object.entries(node)) {
      if (!key.startsWith('$')) walk(child, [...path, key])
    }
  })(tree, [])
  for (const [name, target] of deprecated) {
    if (target === name) {
      violations.push({ path: name, reason: 'axis.deprecated가 자기 자신을 가리킵니다' })
    } else if (!leafPaths.has(target)) {
      violations.push({ path: name, reason: `axis.deprecated 대체 경로가 같은 트리의 leaf가 아닙니다: ${target}` })
    } else if (deprecated.has(target)) {
      violations.push({ path: name, reason: `axis.deprecated 대체 경로도 폐기 예정입니다: ${target}` })
    }
  }
  return { leaves, colorLeaves, violations }
}
