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
 * 다크 빌드는 preprocessor `axis/theme-dark`로 참조 해석 전에 `value`를 다크 값으로 바꿉니다.
 * 확장이 없는 leaf는 건드리지 않으므로, 이 preprocessor를 쓰지 않는 빌드(라이트 · 브랜드)는 종전과 같습니다.
 *
 * 이 모듈은 최상위 실행 코드가 없고 style-dictionary를 직접 import하지 않습니다.
 * build-tokens.mjs(최상위 await)를 import할 수 없는 곳(브랜드 빌드 · 테스트 · CI 검사)에서 그대로 씁니다.
 *
 * 브랜드 다크 빌드에 붙일 때(WI-0025 M2 rebase):
 *   registerThemePreprocessors(StyleDictionary)
 *   new StyleDictionary({ ..., preprocessors: themePreprocessorsFor(theme) })
 */

export const THEME_DARK_PREPROCESSOR = 'axis/theme-dark'

/** `$extensions.axis` 안에서 허용하는 키 */
const THEME_KEYS = new Set(['dark', 'themeIndependent'])

/** 색이 아닌 값으로 풀리는 참조의 최상위 범주 (그 밖의 참조는 색으로 봅니다) */
const NON_COLOR_REF_ROOTS = new Set(['space', 'radius', 'font', 'shadow', 'size', 'duration', 'opacity', 'z', 'zIndex'])

const NUMBER = String.raw`-?(?:\d+\.?\d*|\.\d+)`
const UNIT = String.raw`(?:px|rem|em|%|vh|vw|ch|ms|s)?`
/** 길이 · 숫자 · 시간 한 개 (예: 4px, 0, 0.5rem, 150ms) */
const LENGTH_RE = new RegExp(`^${NUMBER}${UNIT}$`)
/** 그림자 리터럴: 길이가 두 개 이상 이어진 뒤 색이 오는 형태 (예: 0 1px 3px 0 rgb(0 0 0 / 0.1)) */
const SHADOW_RE = new RegExp(`^(?:inset\\s+)?(?:${NUMBER}${UNIT}\\s+){2,}`)

function isPlainObject(node) {
  return node !== null && typeof node === 'object' && !Array.isArray(node)
}

function isLeaf(node) {
  return isPlainObject(node) && Object.prototype.hasOwnProperty.call(node, 'value')
}

/**
 * 색이 아닌 값인지 판정합니다. 판정은 보수적입니다: 길이 · 숫자 · 그림자 · 비색 범주 참조로
 * 확인된 값만 비색이고, 나머지(transparent · currentColor · 이름 있는 색 · rgba() · 알 수 없는 참조)는 모두 색입니다.
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
 */
export function applyThemeValues(tree, theme) {
  let replaced = 0
  ;(function walk(node) {
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

/** Style Dictionary 클래스에 테마 preprocessor를 등록합니다. 여러 번 불러도 같은 이름으로 덮어씁니다. */
export function registerThemePreprocessors(StyleDictionary) {
  StyleDictionary.registerPreprocessor({
    name: THEME_DARK_PREPROCESSOR,
    preprocessor: (dictionary) => {
      applyThemeValues(dictionary, 'dark')
      return dictionary
    },
  })
}

/** 테마 이름에 맞는 preprocessor 목록 (`new StyleDictionary({ preprocessors })`에 그대로 넣습니다) */
export function themePreprocessorsFor(theme) {
  return theme === 'dark' ? [THEME_DARK_PREPROCESSOR] : []
}

/**
 * component 토큰 트리의 테마 선언을 검사합니다.
 *
 * 위반
 *   - 색 leaf에 `axis.dark`도 `axis.themeIndependent`도 없음
 *   - `axis.dark`와 `axis.themeIndependent`를 함께 선언
 *   - `axis.dark`가 문자열이 아니거나 라이트 `value`와 같은 문자열 (같은 값이면 마커를 씁니다)
 *   - `axis.themeIndependent`가 true가 아님, `axis`에 알 수 없는 키 (오타 방지)
 *
 * 돌려주는 값: { leaves, colorLeaves, violations: [{ path, reason }] }
 */
export function findThemeDeclarationViolations(tree) {
  const violations = []
  let leaves = 0
  let colorLeaves = 0
  ;(function walk(node, path) {
    if (!isPlainObject(node)) return
    if (isLeaf(node)) {
      leaves++
      const name = path.join('.')
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
      return
    }
    for (const [key, child] of Object.entries(node)) {
      if (!key.startsWith('$')) walk(child, [...path, key])
    }
  })(tree, [])
  return { leaves, colorLeaves, violations }
}
