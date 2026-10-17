// @ts-check
/**
 * 테마 모드 공용 모듈 테스트 (WI-0033)
 *
 * 1. 색 판정(isNonColorValue): transparent 같은 이름 색을 색으로 보는지
 * 2. preprocessor 본체(applyThemeValues): 확장이 있는 leaf만 바꾸고 `$` 키 아래로 내려가지 않는지
 * 3. 선언 검사(findThemeDeclarationViolations): 누락 · 형식 오류를 잡는지, 실제 components.json은 위반 0인지
 * 4. Style Dictionary 실제 해석: build-tokens.mjs 와 같은 다크 설정(darkBuildConfig)이 component 다크 값으로 풀리는지,
 *    preprocessor를 빼면 라이트 값이 복제되는지(변이 대조), CI 다크 값 축의 기대값(findDarkValueExpectations)과 같은지
 *
 * leaf 수 · 바뀌는 수는 고정값 대신 소스에서 센 값과 비교합니다(WI-0025 M3 처럼 leaf 가 늘어도 그대로 성립).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import StyleDictionary from 'style-dictionary'
import {
  THEME_DARK_PREPROCESSOR,
  applyThemeValues,
  darkBuildConfig,
  findDarkValueExpectations,
  findThemeDeclarationViolations,
  isNonColorValue,
  registerThemePreprocessors,
  resolveTokenValue,
  themePreprocessorsFor,
} from '../scripts/theme-modes.mjs'

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (/** @type {string} */ rel) => JSON.parse(readFileSync(join(PKG, rel), 'utf-8'))
const components = () => readJson('src/component/components.json')

test('색 판정: 이름 색 · 함수 색 · 색 참조는 색, 길이 · 그림자 · 비색 참조만 비색', () => {
  for (const v of ['transparent', 'currentColor', 'red', 'rgba(0, 0, 0, 0.5)', '#FFF', 'hsl(0 0% 0%)',
    '{color.white}', '{surface.default}', '{card.bg.default}', '{unknown.ref}']) {
    assert.equal(isNonColorValue(v), false, `${v}는 색이어야 합니다`)
  }
  for (const v of ['4px', '0', '0.5rem', '150ms', 'none', '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)', '{shadow.sm}', '{space.4}', '{radius.md}', 1]) {
    assert.equal(isNonColorValue(v), true, `${v}는 비색이어야 합니다`)
  }
})

test('applyThemeValues: 확장이 있는 leaf만 다크 값으로 바꿉니다', () => {
  const tree = {
    a: { value: '{color.white}', $extensions: { axis: { dark: '{surface.default}' } } },
    b: { value: 'transparent', $extensions: { axis: { themeIndependent: true } } },
    c: { value: '#123456' },
    $meta: { inner: { value: 'x', $extensions: { axis: { dark: 'y' } } } },
  }
  assert.equal(applyThemeValues(tree, 'dark'), 1)
  assert.equal(tree.a.value, '{surface.default}')
  assert.equal(tree.b.value, 'transparent')
  assert.equal(tree.c.value, '#123456')
  assert.equal(tree.$meta.inner.value, 'x', '$로 시작하는 키 아래는 건드리지 않습니다')
  assert.equal(applyThemeValues({ a: { value: '1', $extensions: { axis: { dark: '2' } } } }, 'light'), 0)
})

test('themePreprocessorsFor: 다크에만 preprocessor를 붙입니다', () => {
  assert.deepEqual(themePreprocessorsFor('dark'), [THEME_DARK_PREPROCESSOR])
  assert.deepEqual(themePreprocessorsFor('light'), [])
})

test('선언 검사: 누락 · 형식 오류를 잡습니다', () => {
  /** @type {Array<[unknown, RegExp]>} */
  const cases = [
    [{ x: { value: 'transparent' } }, /axis.dark도 axis.themeIndependent도 없습니다/],
    [{ x: { value: 'rgba(0, 0, 0, 0.5)' } }, /axis.dark도 axis.themeIndependent도 없습니다/],
    [{ x: { value: '{color.white}', $extensions: { axis: { dark: '{color.white}' } } } }, /라이트 value와 같습니다/],
    [{ x: { value: '{color.white}', $extensions: { axis: { dark: '{surface.default}', themeIndependent: true } } } }, /함께 선언/],
    [{ x: { value: '{color.white}', $extensions: { axis: { drak: '{surface.default}' } } } }, /알 수 없는 키: drak/],
    [{ x: { value: '{color.white}', $extensions: { axis: { themeIndependent: false } } } }, /true만 허용/],
    [{ x: { value: '{color.white}', $extensions: { axis: { dark: 1 } } } }, /문자열이 아닙니다/],
  ]
  for (const [tree, reason] of cases) {
    const { violations } = findThemeDeclarationViolations(tree)
    assert.ok(violations.some((v) => reason.test(v.reason)), `${JSON.stringify(tree)} -> ${JSON.stringify(violations)}`)
  }
  // 비색 leaf는 선언이 없어도 됩니다
  assert.equal(findThemeDeclarationViolations({ w: { value: '4px' }, s: { value: '{shadow.sm}' } }).violations.length, 0)
})

test('선언 검사: 실제 components.json은 위반 0 (leaf 수는 소스에서 센 값, 색 leaf 43)', () => {
  const r = findThemeDeclarationViolations(components())
  assert.deepEqual(r.violations, [])
  // 측정 대상이 0이면 위반 0도 의미가 없으므로 leaf 수를 별도 순회로 센 값과 함께 단언합니다
  assert.ok(componentPaths().length > 0)
  assert.equal(r.leaves, componentPaths().length)
  // 색 leaf 43 은 고정값입니다(main 45 leaf · WI-0025 M3 47 leaf 모두 43, plan 6장)
  assert.equal(r.colorLeaves, 43)
})

test('resolveTokenValue: 참조를 끝까지 풀고, 풀 수 없는 참조 · 순환은 예외', () => {
  const map = new Map([['a', '{b}'], ['b', '#111'], ['c', '1px solid {b}'], ['x', '{y}'], ['y', '{x}']])
  assert.equal(resolveTokenValue(map, '{a}'), '#111')
  assert.equal(resolveTokenValue(map, '{c}'), '1px solid #111')
  assert.throws(() => resolveTokenValue(map, '{nope}'), /풀 수 없는 참조/)
  assert.throws(() => resolveTokenValue(map, '{x}'), /순환 참조/)
})

test('findDarkValueExpectations: axis.dark 가 있고 풀린 값이 다른 leaf만 대상', () => {
  const base = [{ color: { white: { value: '#FFF' }, gray: { value: '#888' } } }]
  const light = { surface: { default: { value: '{color.white}' }, muted: { value: '{color.gray}' } } }
  const dark = { surface: { default: { value: '{color.gray}' }, muted: { value: '{color.gray}' } } }
  const comp = {
    k: {
      changed: { value: '{color.white}', $extensions: { axis: { dark: '{surface.default}' } } },
      same: { value: '{color.gray}', $extensions: { axis: { dark: '{surface.muted}' } } },
      fixed: { value: '{color.white}', $extensions: { axis: { themeIndependent: true } } },
    },
  }
  const r = findDarkValueExpectations({ base, light, dark, components: [comp] })
  assert.equal(r.declared, 2)
  assert.deepEqual(r.changed, [{ path: 'k.changed', name: '--axis-k-changed', light: '#FFF', dark: '#888' }])
  assert.equal(comp.k.changed.value, '{color.white}', '입력 트리를 바꾸지 않습니다')
})

/**
 * Style Dictionary 설정으로 CSS 플랫폼 토큰을 { 'card.bg.default': 값 } 형태로 돌려줍니다.
 *
 * @param {{ platforms: Record<string, object> } & Record<string, any>} config
 */
async function resolveTokens(config) {
  registerThemePreprocessors(StyleDictionary)
  // 파일을 쓰지 않으므로 files(커스텀 포맷은 build-tokens.mjs 에서만 등록)는 빼고 해석만 합니다
  const platforms = Object.fromEntries(Object.entries(config.platforms).map(([k, v]) => [k, { ...v, files: [] }]))
  const sd = new StyleDictionary({ ...config, platforms, log: { verbosity: 'silent' } })
  const dictionary = await sd.getPlatformTokens('css')
  return new Map(dictionary.allTokens.map((t) => [t.path.join('.'), t.value]))
}

/** 라이트 빌드(build-tokens.mjs 의 sdLight css 플랫폼)와 같은 source */
const lightConfig = () => ({
  source: [
    join(PKG, 'src/primitives/**/*.json'),
    join(PKG, 'src/semantic/light.json'),
    join(PKG, 'src/component/**/*.json'),
  ],
  platforms: { css: { transformGroup: 'css' } },
})

/** CI 다크 값 축(check-token-refs 판정 5)과 같은 입력으로 계산한 기대값 */
function expectations() {
  const base = readdirSync(join(PKG, 'src/primitives')).filter((f) => f.endsWith('.json')).sort()
    .map((f) => readJson(`src/primitives/${f}`))
  return findDarkValueExpectations({
    base,
    light: readJson('src/semantic/light.json'),
    dark: readJson('src/semantic/dark.json'),
    components: [components()],
  })
}

/** components.json leaf 경로 목록 */
function componentPaths() {
  /** @type {string[]} */
  const out = []
  ;(/** @param {any} node @param {string[]} path */ function walk(node, path) {
    if (node && typeof node === 'object' && 'value' in node) return out.push(path.join('.'))
    for (const [k, c] of Object.entries(node)) if (!k.startsWith('$')) walk(c, [...path, k])
  })(components(), [])
  return out
}

test('Style Dictionary 해석: build-tokens 의 다크 설정(darkBuildConfig)은 component 다크 값으로 풀립니다', async () => {
  const light = await resolveTokens(lightConfig())
  const dark = await resolveTokens(darkBuildConfig({ root: PKG }))
  assert.deepEqual(darkBuildConfig().preprocessors, themePreprocessorsFor('dark'), '다크 빌드 설정에 preprocessor 가 배선되어 있어야 합니다')
  assert.equal(light.get('card.bg.default'), '#FFFFFF')
  assert.equal(dark.get('card.bg.default'), '#030712')
  assert.equal(dark.get('button-secondary.text.default'), '#F3F4F6')
  assert.equal(dark.get('input.text.placeholder'), '#9CA3AF', '다크 placeholder는 gray.400 (text.secondary)')
  assert.equal(dark.get('button.bg.default'), light.get('button.bg.default'), '채움 버튼은 테마 무관')
  const paths = componentPaths()
  assert.ok(paths.length > 0)
  for (const p of paths) {
    assert.notEqual(light.get(p), undefined, `라이트 해석에 ${p} 없음`)
    assert.notEqual(dark.get(p), undefined, `다크 해석에 ${p} 없음`)
  }
  const changed = paths.filter((p) => light.get(p) !== dark.get(p)).sort()
  // CI 다크 값 축의 기대값과 같은 목록이어야 산출물 검사가 실제 빌드와 같은 대상을 봅니다
  const expected = expectations().changed
  assert.deepEqual(changed, expected.map((e) => e.path).sort())
  assert.ok(changed.length > 0)
  for (const e of expected) assert.equal(dark.get(e.path), e.dark, `${e.path} 다크 값`)
})

test('변이 대조: preprocessor를 빼면 다크 component 값이 라이트 값을 복제합니다 (원인 C2 재현)', async () => {
  const light = await resolveTokens(lightConfig())
  const darkWithout = await resolveTokens({ ...darkBuildConfig({ root: PKG }), preprocessors: [] })
  const changed = componentPaths().filter((p) => light.get(p) !== darkWithout.get(p))
  assert.equal(changed.length, 0)
  // 대조: 같은 빌드에서 semantic 토큰은 다크 값으로 풀립니다(계측이 살아 있음)
  assert.notEqual(light.get('surface.default'), darkWithout.get('surface.default'))
})
