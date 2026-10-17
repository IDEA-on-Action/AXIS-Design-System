/**
 * 토큰 참조 검사 스크립트 (WI-0025 FR-3)
 *
 * 컴포넌트 소스의 `var(--axis-*)` 참조가 빌드된 토큰 CSS에 정의되어 있는지 검사합니다.
 *
 * 판정
 *   1. 정의 누락: `var(--axis-NAME)`의 NAME이 정의 집합(`:root` 블록)에 없음
 *   2. fallback 인자: `var(--axis-NAME, 대체값)`도 NAME이 정의되어 있어야 함(면제 아님)
 *   3. 판정 불가: `var(--axis-이름)` 정적 참조로 읽을 수 없는 `--axis-` 출현
 *      (템플릿 리터럴, 문자열 조합, 인라인 정의, 주석 속 이름 등)
 *   4. primitive 참조: axis-agentic-ui 소스의 `var(--axis-color-*)` 참조
 *   5. 다크 재정의 누락 (WI-0033): <css-dir>/variables.css 의 `:root` 이름 집합과 `.dark` 이름 집합이 다름
 *      (`:root` 전용 이름 · `.dark` 전용 이름 모두 위반), 또는 다크 값 미반영: `axis.dark` 가 있고 소스로 푼
 *      다크 값이 라이트 값과 다른 component 토큰의 `.dark` 값이 `:root` 값과 같음(다크 빌드의 preprocessor 배선 누락 등)
 *      (기대값 계산은 packages/axis-tokens/scripts/theme-modes.mjs 의 findDarkValueExpectations)
 *   6. 테마 선언 (WI-0033): component 토큰의 색 leaf 에 `$extensions.axis.dark` 도
 *      `$extensions.axis.themeIndependent` 도 없음, 또는 선언 형식 오류
 *      (판정 규칙은 packages/axis-tokens/scripts/theme-modes.mjs 의 findThemeDeclarationViolations)
 *
 * 정의 집합: <css-dir>/variables.css 와 <css-dir>/shadcn-compat.css 의 `:root` 블록 선언
 *
 * 옵션
 *   --css-dir <dir>        정의 CSS 디렉터리 (기본: packages/axis-tokens/dist/css)
 *   --src <dir>            검사 대상 디렉터리, 여러 번 지정 가능
 *                          (기본: packages/axis-ui-react/src, packages/axis-agentic-ui/src)
 *   --component-dir <dir>  component 토큰 JSON 디렉터리 (기본: packages/axis-tokens/src/component)
 *   --token-dir <dir>      다크 값 기대값을 풀 토큰 소스 디렉터리, primitives/ · semantic/light.json · semantic/dark.json
 *                          (기본: packages/axis-tokens/src)
 *
 * 종료 코드
 *   0: 위반 0건이면서 검사 파일 1개 이상 · 참조 1건 이상 · 정의 1개 이상 · `.dark` 정의 1개 이상 · component leaf 1개 이상
 *   1: 위반 있음
 *   2: 측정 실패 (CSS 파일 없음, 정의 0개, `.dark` 정의 0개, 검사 대상 디렉터리 없음, 검사 파일 0개, 참조 0건,
 *      component 디렉터리 없음 · JSON 0개 · leaf 0개, 토큰 소스 파일 없음 · 풀 수 없는 참조)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findDarkValueExpectations, findThemeDeclarationViolations } from '../packages/axis-tokens/scripts/theme-modes.mjs'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const TAG = '[token-refs]'
const CSS_FILES = ['variables.css', 'shadcn-compat.css']
const SRC_EXT = /\.(ts|tsx|css)$/
const SKIP_DIRS = new Set(['node_modules', 'dist'])
const IS_TEST = /(\.(test|spec)\.[jt]sx?$)|([\\/]__tests__[\\/])/
const AGENTIC_SEGMENT = `axis-agentic-ui${sep}`
const IN_CI = process.env.GITHUB_ACTIONS === 'true'

/** 측정 실패: 0건 통과와 구분하기 위해 종료 코드 2로 끝냅니다. */
function measurementFailure(message) {
  console.error(`${TAG} [측정 실패] ${message}`)
  process.exit(2)
}

function parseArgs(argv) {
  const opts = { cssDir: null, src: [], componentDir: null, tokenDir: null }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--css-dir' || arg === '--src' || arg === '--component-dir' || arg === '--token-dir') {
      const value = argv[i + 1]
      if (value === undefined || value.startsWith('--')) {
        measurementFailure(`${arg} 다음에 경로가 없습니다`)
      }
      if (arg === '--css-dir') opts.cssDir = value
      else if (arg === '--component-dir') opts.componentDir = value
      else if (arg === '--token-dir') opts.tokenDir = value
      else opts.src.push(value)
      i++
    } else {
      measurementFailure(`알 수 없는 인자: ${arg}`)
    }
  }
  return {
    cssDir: resolve(opts.cssDir ?? join(ROOT, 'packages/axis-tokens/dist/css')),
    src: (opts.src.length > 0
      ? opts.src
      : [join(ROOT, 'packages/axis-ui-react/src'), join(ROOT, 'packages/axis-agentic-ui/src')]
    ).map((d) => resolve(d)),
    componentDir: resolve(opts.componentDir ?? join(ROOT, 'packages/axis-tokens/src/component')),
    tokenDir: resolve(opts.tokenDir ?? join(ROOT, 'packages/axis-tokens/src')),
  }
}

/** CSS 텍스트에서 선택자가 `selector`인 블록 안의 `--이름:` 선언을 모읍니다. */
function collectBlockDefinitions(css, selector) {
  const names = new Set()
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const blockRe = /(^|[}\s;])([^{}]*?)\{([^{}]*)\}/g
  let m
  while ((m = blockRe.exec(withoutComments)) !== null) {
    const selectors = m[2].split(',').map((s) => s.trim())
    if (!selectors.includes(selector)) continue
    for (const d of m[3].matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) names.add(d[1])
  }
  return names
}

/** CSS 텍스트에서 `:root { ... }` 블록 안의 `--이름:` 선언을 모읍니다. */
function collectRootDefinitions(css) {
  return collectBlockDefinitions(css, ':root')
}

/** 선택자 블록 안에서 `name` 선언이 있는 줄 번호 (못 찾으면 1) */
function declarationLine(css, selector, name) {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) return 1
  const at = css.indexOf(`${name}:`, start)
  return at < 0 ? 1 : lineOf(css, at)
}

/** JSON 텍스트에서 경로(키 목록)의 마지막 키가 나오는 줄 번호 (키를 문서 순서대로 따라갑니다, 못 찾으면 1) */
function jsonPathLine(text, path) {
  let at = 0
  for (const key of path) {
    const next = text.indexOf(JSON.stringify(key), at)
    if (next < 0) return 1
    at = next + 1
  }
  return lineOf(text, at - 1)
}

/** 선택자 블록 안의 `--이름: 값;` 선언을 Map 으로 모읍니다(같은 이름이 여러 번 나오면 마지막 값). */
function collectBlockValues(css, selector) {
  const values = new Map()
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const blockRe = /(^|[}\s;])([^{}]*?)\{([^{}]*)\}/g
  let m
  while ((m = blockRe.exec(withoutComments)) !== null) {
    const selectors = m[2].split(',').map((s) => s.trim())
    if (!selectors.includes(selector)) continue
    for (const d of m[3].matchAll(/(--[A-Za-z0-9_-]+)\s*:\s*([^;]*);/g)) values.set(d[1], d[2].trim())
  }
  return values
}

/** 다크 값 기대값을 풀 토큰 소스(primitives · 라이트 · 다크 semantic)를 읽습니다. 없으면 측정 실패입니다. */
function loadTokenSources(tokenDir) {
  const primitivesDir = join(tokenDir, 'primitives')
  if (!existsSync(primitivesDir) || !statSync(primitivesDir).isDirectory()) {
    measurementFailure(`토큰 소스 primitives 디렉터리 없음: ${display(primitivesDir)}`)
  }
  const read = (abs) => {
    if (!existsSync(abs)) measurementFailure(`토큰 소스 파일 없음: ${display(abs)}`)
    try {
      return JSON.parse(readFileSync(abs, 'utf-8'))
    } catch (e) {
      measurementFailure(`JSON 파싱 실패: ${display(abs)} (${e.message})`)
    }
  }
  const base = readdirSync(primitivesDir, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => read(join(primitivesDir, f)))
  if (base.length === 0) measurementFailure(`토큰 소스 primitives JSON 0개: ${display(primitivesDir)}`)
  return { base, light: read(join(tokenDir, 'semantic/light.json')), dark: read(join(tokenDir, 'semantic/dark.json')) }
}

/** 판정 5: variables.css 의 `:root` 이름 집합과 `.dark` 이름 집합 비교, 다크 값 미반영 */
function checkDarkCompleteness(cssPath, expectations) {
  const css = readFileSync(cssPath, 'utf-8')
  const root = collectBlockDefinitions(css, ':root')
  const dark = collectBlockDefinitions(css, '.dark')
  if (dark.size === 0) measurementFailure(`.dark 정의 0개: ${display(cssPath)}`)
  const rootOnly = [...root].filter((n) => !dark.has(n))
  const darkOnly = [...dark].filter((n) => !root.has(n))
  // 다크 값 축: `.dark` 에 이름이 없으면 위의 이름 집합 판정이 잡으므로, 양쪽에 있는 이름만 값을 비교합니다
  const rootValues = collectBlockValues(css, ':root')
  const darkValues = collectBlockValues(css, '.dark')
  const unapplied = []
  for (const e of expectations.changed) {
    if (!rootValues.has(e.name)) {
      unapplied.push({ ...e, line: 1, detail: `${e.name} (:root 에 없어 다크 값을 비교할 수 없음, 기대 다크 ${e.dark})` })
    } else if (darkValues.has(e.name) && darkValues.get(e.name) === rootValues.get(e.name)) {
      unapplied.push({
        ...e,
        line: declarationLine(css, '.dark', e.name),
        detail: `${e.name} (.dark 값 ${darkValues.get(e.name)} 이 :root 와 같음, 기대 다크 ${e.dark})`,
      })
    }
  }
  return {
    root: root.size,
    dark: dark.size,
    rootOnly: rootOnly.map((name) => ({ name, line: declarationLine(css, ':root', name) })),
    darkOnly: darkOnly.map((name) => ({ name, line: declarationLine(css, '.dark', name) })),
    valueTargets: expectations.changed.length,
    unapplied,
  }
}

/** 판정 6: component 토큰 JSON 의 테마 선언 검사 */
function checkThemeDeclarations(componentDir) {
  if (!existsSync(componentDir) || !statSync(componentDir).isDirectory()) {
    measurementFailure(`component 디렉터리 없음: ${display(componentDir)}`)
  }
  const files = readdirSync(componentDir, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith('.json'))
    .sort()
  if (files.length === 0) measurementFailure(`component JSON 0개: ${display(componentDir)}`)
  const result = { files: files.length, leaves: 0, colorLeaves: 0, violations: [], trees: [] }
  for (const f of files) {
    const abs = join(componentDir, f)
    const text = readFileSync(abs, 'utf-8')
    let tree
    try {
      tree = JSON.parse(text)
    } catch (e) {
      measurementFailure(`JSON 파싱 실패: ${display(abs)} (${e.message})`)
    }
    result.trees.push(tree)
    const r = findThemeDeclarationViolations(tree)
    result.leaves += r.leaves
    result.colorLeaves += r.colorLeaves
    for (const v of r.violations) {
      result.violations.push({ file: display(abs), line: jsonPathLine(text, v.path.split('.')), ...v })
    }
  }
  if (result.leaves === 0) measurementFailure(`component leaf 0개: ${display(componentDir)}`)
  return result
}

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name), out)
    } else if (entry.isFile() && SRC_EXT.test(entry.name)) {
      out.push(join(dir, entry.name))
    }
  }
  return out
}

/** 저장소 안 경로는 상대 경로(`/` 구분)로, 밖은 절대 경로로 표시합니다. */
function display(p) {
  const rel = relative(ROOT, p)
  return rel.startsWith('..') || rel === '' ? p : rel.split(sep).join('/')
}

function lineOf(text, index) {
  let line = 1
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++
  return line
}

/** 한 파일을 검사해 정적 참조와 판정 불가 출현을 돌려줍니다. */
function scanFile(text) {
  const refs = []
  const covered = new Set()
  // 정적 참조: var( 다음 이름이 끝난 자리가 `)` · `,` · 공백이어야 정적으로 읽을 수 있습니다.
  const varRe = /var\(\s*(--axis-[A-Za-z0-9-]*)/g
  let m
  while ((m = varRe.exec(text)) !== null) {
    const name = m[1]
    const nameStart = m.index + m[0].length - name.length
    const next = text[m.index + m[0].length] ?? ''
    if (name.length > '--axis-'.length && !name.endsWith('-') && /[),\s]/.test(next)) {
      refs.push({ name, index: nameStart, fallback: /^\s*,/.test(text.slice(m.index + m[0].length)) })
      covered.add(nameStart)
    }
  }
  const dynamic = []
  for (const d of text.matchAll(/--axis-/g)) {
    if (!covered.has(d.index)) {
      const snippet = text.slice(d.index, d.index + 40).split('\n')[0]
      dynamic.push({ index: d.index, snippet })
    }
  }
  return { refs, dynamic }
}

function report(kind, file, line, detail, isTest) {
  const mark = isTest ? ' [test]' : ''
  console.log(`${TAG} ${kind}${mark} ${file}:${line} ${detail}`)
  if (IN_CI) {
    const msg = `${kind}: ${detail}`.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')
    console.log(`::error file=${file},line=${line}::${msg}`)
  }
}

function main() {
  const { cssDir, src, componentDir, tokenDir } = parseArgs(process.argv.slice(2))

  // 정의 집합
  const defined = new Set()
  for (const f of CSS_FILES) {
    const p = join(cssDir, f)
    if (!existsSync(p)) measurementFailure(`CSS 파일 없음: ${display(p)}`)
    for (const n of collectRootDefinitions(readFileSync(p, 'utf-8'))) defined.add(n)
  }
  if (defined.size === 0) measurementFailure(`정의 0개: ${cssDir}`)

  // 검사 대상
  const files = []
  for (const d of src) {
    if (!existsSync(d) || !statSync(d).isDirectory()) measurementFailure(`검사 대상 디렉터리 없음: ${d}`)
    walk(d, files)
  }
  if (files.length === 0) measurementFailure(`검사 파일 0개: ${src.join(', ')}`)

  const counts = { refFiles: 0, refs: 0, missing: 0, primitive: 0, dynamic: 0, testViolations: 0 }
  for (const abs of files.sort()) {
    const text = readFileSync(abs, 'utf-8')
    const rel = display(abs)
    const isTest = IS_TEST.test(abs)
    const isAgentic = abs.includes(AGENTIC_SEGMENT)
    const { refs, dynamic } = scanFile(text)
    if (refs.length > 0 || dynamic.length > 0) counts.refFiles++
    counts.refs += refs.length

    for (const r of refs) {
      const line = lineOf(text, r.index)
      if (!defined.has(r.name)) {
        counts.missing++
        if (isTest) counts.testViolations++
        report('정의 누락', rel, line, r.fallback ? `${r.name} (fallback 있음)` : r.name, isTest)
      }
      if (isAgentic && r.name.startsWith('--axis-color-')) {
        counts.primitive++
        if (isTest) counts.testViolations++
        report('primitive 참조', rel, line, r.name, isTest)
      }
    }
    for (const d of dynamic) {
      counts.dynamic++
      if (isTest) counts.testViolations++
      report('판정 불가', rel, lineOf(text, d.index), d.snippet.trim(), isTest)
    }
  }

  // 판정 6의 component JSON 을 판정 5의 다크 값 기대값 계산에도 씁니다(보고 순서는 5 → 6)
  const theme = checkThemeDeclarations(componentDir)
  let expectations
  try {
    expectations = findDarkValueExpectations({ ...loadTokenSources(tokenDir), components: theme.trees })
  } catch (e) {
    measurementFailure(`다크 값 기대값 계산 실패: ${e.message}`)
  }

  // 판정 5: 다크 재정의 누락 · 다크 값 미반영
  const variablesPath = join(cssDir, 'variables.css')
  const dark = checkDarkCompleteness(variablesPath, expectations)
  for (const d of dark.rootOnly) {
    report('다크 재정의 누락', display(variablesPath), d.line, `${d.name} (:root 에만 있음)`, false)
  }
  for (const d of dark.darkOnly) {
    report('다크 재정의 누락', display(variablesPath), d.line, `${d.name} (.dark 에만 있음)`, false)
  }
  for (const d of dark.unapplied) report('다크 값 미반영', display(variablesPath), d.line, d.detail, false)

  // 판정 6: component 토큰 테마 선언
  for (const v of theme.violations) report('테마 선언', v.file, v.line, `${v.path}: ${v.reason}`, false)

  const darkViolations = dark.rootOnly.length + dark.darkOnly.length + dark.unapplied.length
  const violations = counts.missing + counts.primitive + counts.dynamic + darkViolations + theme.violations.length
  console.log(
    `${TAG} 검사 파일 ${files.length} · 참조 보유 파일 ${counts.refFiles} · 참조 ${counts.refs} · 정의 ${defined.size}` +
      ` · 정의 누락 ${counts.missing} · primitive 참조 ${counts.primitive} · 판정 불가 ${counts.dynamic}` +
      ` (그중 [test] ${counts.testViolations})`
  )
  console.log(
    `${TAG} 다크 완전성: :root ${dark.root} · .dark ${dark.dark} · :root 전용 ${dark.rootOnly.length} · .dark 전용 ${dark.darkOnly.length}` +
      ` · 다크 값 대상 ${dark.valueTargets} · 미반영 ${dark.unapplied.length}` +
      ` | 테마 선언: JSON ${theme.files} · leaf ${theme.leaves} · 색 leaf ${theme.colorLeaves} · 위반 ${theme.violations.length}`
  )

  if (counts.refs === 0) measurementFailure('참조 0건: 검사 대상에서 var(--axis-*) 참조를 찾지 못했습니다')
  if (violations > 0) process.exit(1)
  console.log(`${TAG} [OK] 위반 0건`)
}

main()
