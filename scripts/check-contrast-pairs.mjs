/**
 * 대비 짝 표 드리프트 검사 (WI-0025 M3, plan 5.3)
 *
 * agentic-ui 소스의 한 className 문자열 안에서 바탕(`bg-[var(--axis-X)]`,
 * `bg-[color:color-mix(in_srgb,var(--axis-X)_N%,transparent)]`)과 글자(`text-[var(--axis-Y)]`)가
 * 함께 나오는 짝 중, 어느 한쪽이 접기 대상 범위(`--axis-status-*` · `--axis-diff-*` · `--axis-agent-*` · `--axis-badge-*`)인 짝을 뽑아
 * packages/axis-tokens/test/ontology-pairs.mjs 의 CONTRAST_PAIRS(sameString: true)와 대조합니다.
 *
 * - 소스에만 있는 짝: 대비를 검산하지 않은 새 조합이므로 위반입니다(표에 행을 더하고 tokens 테스트로 대비를 확인).
 * - 표에만 있는 짝: 소스가 바뀌어 표가 낡았으므로 위반입니다.
 * - 변형 접두는 `hover:bg-*` 와 접두 없는 `text-*` 를 짝으로 보고, 같은 접두끼리도 짝으로 봅니다.
 *   단 같은 접두의 글자(`hover:text-*`)가 있으면 그 상태에서는 접두 없는 글자가 덮이므로 같은 접두 글자만 짝으로 봅니다.
 * - 옅은 바탕의 부모 바탕(표의 bg.over)은 한 문자열에서 뽑을 수 없어 짝 키에 넣지 않습니다.
 * - 부모 · 자식으로 나뉜 짝(아바타 바탕과 글자, 타임라인 점과 아이콘)은 잡지 못합니다. 그런 짝은 표에 손으로 둡니다.
 * - 표 행에 parent: { at, fgAt, variant? } 가 있으면(부모 바탕을 손으로 적은 행) 그 근거를 단언합니다:
 *   at 행에 `<variant>bg-[var(부모 바탕)]`(부모 바탕 = 문자열 bg 또는 bg.over), fgAt 행에 `var(fg)` 가 있어야 합니다.
 *   부모 바탕 값은 표에 손으로 적은 것이고 소스에서 다시 만들지 않습니다. 행이 밀리거나 부모 바탕이 바뀌면 위반입니다.
 *   (요소의 중첩 관계까지는 보지 않습니다. 두 행이 같은 요소 안인지는 표를 적을 때 손으로 확인합니다.)
 *
 * tokens 패키지 테스트가 agentic-ui 소스를 읽으면 turbo 캐시 키(패키지 입력)에 agentic-ui 변경이 들어가지 않아
 * 낡은 초록이 날 수 있어, 패키지 경계를 넘는 이 검사는 루트 스크립트로 둡니다(check-token-refs 와 같은 자리).
 *
 * 옵션: --src <dir> (기본 packages/axis-agentic-ui/src, 음성 대조용 사본 지정에 씁니다)
 * 종료 코드: 0 위반 0건(검사 파일 1개 이상 · 범위 안 짝 1건 이상) / 1 위반 / 2 측정 실패
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CONTRAST_PAIRS } from '../packages/axis-tokens/test/ontology-pairs.mjs'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const TAG = '[contrast-pairs]'
const SCOPE = /^--axis-(status|diff|agent|badge)-/
const IS_TEST = /\.(test|spec)\.[jt]sx?$/
const VARIANT = String.raw`((?:[a-z-]+(?:-\[[^\]\s]*\])?:)*)`
const BG_RE = new RegExp(String.raw`(?:^|\s)${VARIANT}bg-\[(?:var\((--axis-[\w-]+)\)|color:color-mix\(in_srgb,var\((--axis-[\w-]+)\)_(\d+)%,transparent\))\]`, 'g')
const TEXT_RE = new RegExp(String.raw`(?:^|\s)${VARIANT}text-\[var\((--axis-[\w-]+)\)\]`, 'g')
const STRING_RE = /"([^"\n]*)"|`([^`]*)`|'([^'\n]*)'/g

function fail(msg) {
  console.error(`${TAG} [측정 실패] ${msg}`)
  process.exit(2)
}

function parseArgs(argv) {
  const i = argv.indexOf('--src')
  return { src: resolve(i >= 0 && argv[i + 1] ? argv[i + 1] : join(ROOT, 'packages/axis-agentic-ui/src')) }
}

function listFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name !== 'node_modules' && name !== 'dist') out.push(...listFiles(full))
    } else if (/\.tsx?$/.test(name) && !IS_TEST.test(name)) {
      out.push(full)
    }
  }
  return out
}

/** parent 근거 단언: 위반 문장 목록을 돌려줍니다 */
function checkParents(src) {
  const rows = CONTRAST_PAIRS.filter(p => p.parent)
  const problems = []
  const lineOf = loc => {
    const m = /^(.+):(\d+)$/.exec(loc ?? '')
    if (!m) return { error: `위치 형식이 '파일:행' 이 아님: ${loc}` }
    const file = join(src, m[1])
    if (!existsSync(file)) return { error: `파일 없음: ${m[1]}` }
    const line = readFileSync(file, 'utf8').split('\n')[Number(m[2]) - 1]
    return line === undefined ? { error: `행 없음: ${loc}` } : { line }
  }
  for (const row of rows) {
    const parentBg = typeof row.bg === 'string' ? row.bg : row.bg.over
    const label = `${row.fg} / ${typeof row.bg === 'string' ? row.bg : `mix(${row.bg.mix} ${row.bg.pct}%) over ${row.bg.over}`}`
    if (!parentBg) { problems.push(`${label}: parent 가 있는데 부모 바탕(bg 또는 bg.over)이 없습니다`); continue }
    const want = `${row.parent.variant ?? ''}bg-[var(${parentBg})]`
    const at = lineOf(row.parent.at)
    if (at.error) problems.push(`${label}: ${at.error}`)
    else if (!new RegExp(String.raw`(?:^|[\s"'\`])${want.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(at.line)) {
      problems.push(`${label}: ${row.parent.at} 에 ${want} 가 없습니다(부모 바탕이 바뀌었거나 행이 밀렸습니다)`)
    }
    const fgAt = lineOf(row.parent.fgAt)
    if (fgAt.error) problems.push(`${label}: ${fgAt.error}`)
    else if (!fgAt.line.includes(`var(${row.fg})`)) problems.push(`${label}: ${row.parent.fgAt} 에 var(${row.fg}) 가 없습니다`)
  }
  return { count: rows.length, problems }
}

const pairKey = (fg, bg) => `${fg} | ${typeof bg === 'string' ? bg : `mix(${bg.mix} ${bg.pct}%)`}`

/** className 문자열 하나에서 바탕 · 글자 짝을 뽑습니다 */
function pairsInString(str) {
  const bgs = [...str.matchAll(BG_RE)].map(m => ({
    variant: m[1],
    bg: m[2] ? m[2] : { mix: m[3], pct: Number(m[4]) },
  }))
  const texts = [...str.matchAll(TEXT_RE)].map(m => ({ variant: m[1], fg: m[2] }))
  const pairs = []
  for (const b of bgs) {
    const overridden = b.variant !== '' && texts.some(t => t.variant === b.variant)
    for (const t of texts) {
      if (t.variant !== '' && t.variant !== b.variant) continue
      if (overridden && t.variant === '') continue
      const bgVar = typeof b.bg === 'string' ? b.bg : b.bg.mix
      if (!SCOPE.test(t.fg) && !SCOPE.test(bgVar)) continue
      pairs.push({ fg: t.fg, bg: b.bg })
    }
  }
  return pairs
}

function main() {
  const { src } = parseArgs(process.argv.slice(2))
  if (!existsSync(src) || !statSync(src).isDirectory()) fail(`검사 대상 디렉터리 없음: ${src}`)
  const files = listFiles(src)
  if (files.length === 0) fail(`검사 파일 0개: ${src}`)

  const found = new Map() // key -> 위치 목록
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(STRING_RE)) {
      const str = m[1] ?? m[2] ?? m[3]
      for (const p of pairsInString(str)) {
        const line = text.slice(0, m.index).split('\n').length
        const key = pairKey(p.fg, p.bg)
        if (!found.has(key)) found.set(key, [])
        found.get(key).push(`${relative(ROOT, file)}:${line}`)
      }
    }
  }
  if (found.size === 0) fail('범위 안 짝 0건(추출 정규식이나 범위가 소스와 맞지 않습니다)')

  const table = new Set(CONTRAST_PAIRS.filter(p => p.sameString).map(p => pairKey(p.fg, p.bg)))
  const onlySource = [...found.keys()].filter(k => !table.has(k))
  const onlyTable = [...table].filter(k => !found.has(k))

  const parents = checkParents(src)
  if (parents.count === 0) fail('parent 근거 행 0건(표에서 parent 를 읽지 못했습니다)')

  console.log(`${TAG} 검사 파일 ${files.length} · 소스 짝 ${found.size} · 표 짝(sameString) ${table.size} · 소스에만 ${onlySource.length} · 표에만 ${onlyTable.length} · 부모 바탕 근거 ${parents.count}행 중 위반 ${parents.problems.length}`)
  for (const k of onlySource) console.log(`${TAG} [위반] 표에 없는 짝 ${k} (${found.get(k).join(', ')}): ontology-pairs.mjs 에 행을 더하고 대비를 확인하세요`)
  for (const k of onlyTable) console.log(`${TAG} [위반] 소스에 없는 짝 ${k}: 표가 낡았습니다`)
  for (const msg of parents.problems) console.log(`${TAG} [위반] 부모 바탕 근거 ${msg}`)
  if (onlySource.length + onlyTable.length + parents.problems.length > 0) process.exit(1)
  console.log(`${TAG} [OK] 위반 0건`)
}

main()
