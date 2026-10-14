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
 *
 * 정의 집합: <css-dir>/variables.css 와 <css-dir>/shadcn-compat.css 의 `:root` 블록 선언
 *
 * 옵션
 *   --css-dir <dir>  정의 CSS 디렉터리 (기본: packages/axis-tokens/dist/css)
 *   --src <dir>      검사 대상 디렉터리, 여러 번 지정 가능
 *                    (기본: packages/axis-ui-react/src, packages/axis-agentic-ui/src)
 *
 * 종료 코드
 *   0: 위반 0건이면서 검사 파일 1개 이상 · 참조 1건 이상 · 정의 1개 이상
 *   1: 위반 있음
 *   2: 측정 실패 (CSS 파일 없음, 정의 0개, 검사 대상 디렉터리 없음, 검사 파일 0개, 참조 0건)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

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
  const opts = { cssDir: null, src: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--css-dir' || arg === '--src') {
      const value = argv[i + 1]
      if (value === undefined || value.startsWith('--')) {
        measurementFailure(`${arg} 다음에 경로가 없습니다`)
      }
      if (arg === '--css-dir') opts.cssDir = value
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
  }
}

/** CSS 텍스트에서 `:root { ... }` 블록 안의 `--이름:` 선언을 모읍니다. */
function collectRootDefinitions(css) {
  const names = new Set()
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const blockRe = /(^|[}\s;])([^{}]*?)\{([^{}]*)\}/g
  let m
  while ((m = blockRe.exec(withoutComments)) !== null) {
    const selectors = m[2].split(',').map((s) => s.trim())
    if (!selectors.includes(':root')) continue
    for (const d of m[3].matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) names.add(d[1])
  }
  return names
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
  const { cssDir, src } = parseArgs(process.argv.slice(2))

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

  const violations = counts.missing + counts.primitive + counts.dynamic
  console.log(
    `${TAG} 검사 파일 ${files.length} · 참조 보유 파일 ${counts.refFiles} · 참조 ${counts.refs} · 정의 ${defined.size}` +
      ` · 정의 누락 ${counts.missing} · primitive 참조 ${counts.primitive} · 판정 불가 ${counts.dynamic}` +
      ` (그중 [test] ${counts.testViolations})`
  )

  if (counts.refs === 0) measurementFailure('참조 0건: 검사 대상에서 var(--axis-*) 참조를 찾지 못했습니다')
  if (violations > 0) process.exit(1)
  console.log(`${TAG} [OK] 위반 0건`)
}

main()
