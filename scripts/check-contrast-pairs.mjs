/**
 * 대비 짝 표 드리프트 검사 (WI-0025 M3, plan 5.3)
 *
 * agentic-ui 소스의 한 className 문자열 안에서 바탕(`bg-[var(--axis-X)]`,
 * `bg-[color:color-mix(in_srgb,var(--axis-X)_N%,transparent)]`)과 글자(`text-[var(--axis-Y)]`)가
 * 함께 나오는 짝 중, 어느 한쪽이 접기 대상 범위(`--axis-status-*` · `--axis-diff-*` · `--axis-agent-*`)인 짝을 뽑아
 * packages/axis-tokens/test/ontology-pairs.mjs 의 CONTRAST_PAIRS(sameString: true)와 대조합니다.
 *
 * - 소스에만 있는 짝: 대비를 검산하지 않은 새 조합이므로 위반입니다(표에 행을 더하고 tokens 테스트로 대비를 확인).
 * - 표에만 있는 짝: 소스가 바뀌어 표가 낡았으므로 위반입니다.
 * - 변형 접두는 `hover:bg-*` 와 접두 없는 `text-*` 를 짝으로 보고, 같은 접두끼리도 짝으로 봅니다.
 * - 부모 · 자식으로 나뉜 짝(아바타 바탕과 글자, 타임라인 점과 아이콘)은 잡지 못합니다. 그런 짝은 표에 손으로 둡니다.
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
const SCOPE = /^--axis-(status|diff|agent)-/
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
    for (const t of texts) {
      if (t.variant !== '' && t.variant !== b.variant) continue
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

  console.log(`${TAG} 검사 파일 ${files.length} · 소스 짝 ${found.size} · 표 짝(sameString) ${table.size} · 소스에만 ${onlySource.length} · 표에만 ${onlyTable.length}`)
  for (const k of onlySource) console.log(`${TAG} [위반] 표에 없는 짝 ${k} (${found.get(k).join(', ')}): ontology-pairs.mjs 에 행을 더하고 대비를 확인하세요`)
  for (const k of onlyTable) console.log(`${TAG} [위반] 소스에 없는 짝 ${k}: 표가 낡았습니다`)
  if (onlySource.length + onlyTable.length > 0) process.exit(1)
  console.log(`${TAG} [OK] 위반 0건`)
}

main()
