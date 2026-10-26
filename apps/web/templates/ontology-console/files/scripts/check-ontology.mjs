#!/usr/bin/env node
/**
 * 온톨로지 콘솔 규칙 검사 (WI-0027 FR-4a)
 *
 * 디자인 규칙 가운데 소스만 읽고 결정적으로 판정할 수 있는 다섯 가지를 봅니다.
 *   1. em-dash        긴 줄표(U+2014). 주석 · 문구 · 코드 모두
 *   2. exclamation    느낌표(반각 · 전각)가 든 한글 문구(JSX 텍스트 · 문자열)
 *   3. one-side-line  한쪽 색 선: border-l · border-r · border-s · border-e 와 중립이 아닌 테두리 색 클래스를 같은 문자열에 함께 씀,
 *                     CSS border-left · border-right(-color) 에 중립이 아닌 색을 지정
 *   4. card-shadow    카드 그림자: <Card 나 bg-card 와 shadow-* 를 함께 씀, 선택자에 card 가 든 CSS 규칙의 box-shadow
 *   5. palette        팔레트 밖 리터럴 색: hex · rgb() · hsl() 숫자 리터럴, Tailwind 기본 팔레트 클래스(bg-red-500 · text-white 등)
 *
 * 해요체 · 금지 표현은 판정 기준 목록이 아직 없어 보지 않습니다(PRD Q8).
 *
 * 사용: node scripts/check-ontology.mjs [디렉터리 ...]   (기본: app components lib)
 * 종료 코드: 0 위반 없음 / 1 위반 있음 / 2 측정 실패(검사한 파일이 0개)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOT = process.cwd()
const args = process.argv.slice(2)
const targets = args.length > 0 ? args : ['app', 'components', 'lib']
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css'])

/** 긴 줄표 문자. 이 파일 자체에 그 문자를 쓰지 않으려고 코드 포인트로 만듭니다 */
const EM_DASH = String.fromCharCode(0x2014)
/** 전각 느낌표 */
const FULLWIDTH_BANG = String.fromCharCode(0xff01)
const NEUTRAL_BORDER = new Set(['border-border', 'border-input', 'border-transparent', 'border-inherit', 'border-current'])
const SIDE_WIDTH = /(?:^|\s|:)border-[lrse](?:-(?:0|2|4|8|\[[^\]]+\]))?(?=\s|$)/
const BORDER_COLOR =
  /(?:^|\s|:)(border-(?:[lrse]-)?(?!(?:0|2|4|8|x|y|t|b|l|r|s|e|solid|dashed|dotted|double|none|hidden|collapse|separate|spacing)(?:\s|$))[a-z][\w-]*(?:\/\d+)?|border-(?:[lrse]-)?\[(?:#|rgb|hsl)[^\]]*\])(?=\s|$)/g
/** 색이 아닌 테두리 클래스(두께 · 방향 · 선 모양): border-r-0 · border-x-2 · border-dashed 등 */
const BORDER_NOT_COLOR =
  /^border-(?:(?:[lrsetbxy])(?:-(?:0|2|4|8|\[[^\]]+\]))?|0|2|4|8|\[\d[^\]]*\]|solid|dashed|dotted|double|none|hidden|collapse|separate)$/
const SHADOW =/(?:^|\s|:)shadow(?:-(?!none(?:\s|$))[\w[\]().,%-]+)?(?=\s|$)/
const PALETTE_NAMES =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const PALETTE_CLASS = new RegExp(
  `(?:^|[\\s:"'\`])((?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|decoration|shadow|accent|caret|placeholder)-(?:(?:${PALETTE_NAMES})-\\d{2,3}|white|black)(?:\\/\\d+)?)(?=[\\s"'\`]|$)`,
  'g'
)
const HEX = /#[0-9a-fA-F]{3,8}\b/g
const COLOR_FN = /\b(?:rgba?|hsla?)\(\s*\d/g
const HANGUL = /[가-힣]/

/** 주석을 같은 길이의 공백으로 바꿔 줄 번호를 지킵니다(앞이 : 인 // 는 URL 로 보고 남김) */
function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, ' ')
  return src
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:'"`\\])(\/\/[^\n]*)/g, (_, pre, c) => pre + blank(c))
}

function lineOf(src, index) {
  let line = 1
  for (let i = 0; i < index; i++) if (src.charCodeAt(i) === 10) line++
  return line
}

/** 문자열 리터럴과 JSX 텍스트 조각을 위치와 함께 돌려줍니다 */
function textChunks(code, isJsx) {
  const out = []
  const str = /(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g
  let m
  while ((m = str.exec(code))) out.push({ text: m[2], index: m.index, kind: 'string' })
  if (isJsx) {
    // JSX 텍스트: 태그 · 표현식 사이 조각. 따옴표 · = · ; 가 든 조각은 코드로 보고 건너뜁니다
    const jsx = /[>}]([^<>{}]+)(?=[<{])/g
    while ((m = jsx.exec(code))) {
      if (!/["'`=;]/.test(m[1])) out.push({ text: m[1], index: m.index + 1, kind: 'jsx' })
    }
  }
  return out
}

function collect(dir, files) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) collect(p, files)
    else if (EXTS.has(extname(name))) files.push(p)
  }
}

const files = []
for (const t of targets) {
  const p = join(ROOT, t)
  if (!existsSync(p)) continue
  if (statSync(p).isDirectory()) collect(p, files)
  else if (EXTS.has(extname(p))) files.push(p)
}

const violations = []
const report = (file, src, index, rule, detail) =>
  violations.push({ file: relative(ROOT, file), line: lineOf(src, index), rule, detail })

for (const file of files) {
  const raw = readFileSync(file, 'utf8')
  const ext = extname(file)
  const code = stripComments(raw)

  // 1. 긴 줄표: 주석 안까지 봅니다
  for (let i = raw.indexOf(EM_DASH); i !== -1; i = raw.indexOf(EM_DASH, i + 1)) {
    report(file, raw, i, 'em-dash', '긴 줄표(U+2014) 대신 하이픈 · 쉼표 · 가운뎃점을 써요')
  }

  if (ext === '.css') {
    // 3. CSS 한쪽 색 선
    const side = /border-(?:left|right|inline-start|inline-end)(?:-color)?\s*:\s*([^;}]+)/g
    let m
    while ((m = side.exec(code))) {
      const value = m[1].trim()
      const neutral =
        /^(?:0|none|hidden)$/.test(value) || /var\(--border\)|hsl\(var\(--border\)\)|transparent|currentColor/.test(value)
      const colored = /#|rgb|hsl|var\(--/.test(value)
      if (colored && !neutral) report(file, code, m.index, 'one-side-line', `한쪽 색 선: ${m[0].trim()}`)
    }
    // 4. 선택자에 card 가 든 규칙의 box-shadow
    const rule = /([^{}]+)\{([^{}]*)\}/g
    while ((m = rule.exec(code))) {
      if (/card/i.test(m[1]) && /box-shadow\s*:\s*(?!none\b|0 0 #0000)/.test(m[2])) {
        report(file, code, m.index + m[1].length, 'card-shadow', `카드 그림자: ${m[1].trim()}`)
      }
    }
  } else {
    const isJsx = ext === '.tsx' || ext === '.jsx'
    for (const chunk of textChunks(code, isJsx)) {
      const t = chunk.text
      // 2. 느낌표가 든 한글 문구
      if (HANGUL.test(t) && (t.includes('!') || t.includes(FULLWIDTH_BANG))) {
        report(file, code, chunk.index, 'exclamation', `느낌표가 든 문구: ${t.trim().slice(0, 40)}`)
      }
      if (chunk.kind !== 'string') continue
      // 3. 한쪽 색 선(클래스 문자열)
      if (SIDE_WIDTH.test(t)) {
        const colors = [...t.matchAll(BORDER_COLOR)]
          .map((x) => x[1])
          .filter((c) => !NEUTRAL_BORDER.has(c.replace(/^border-[lrse]-/, 'border-')) && !BORDER_NOT_COLOR.test(c))
        if (colors.length > 0) report(file, code, chunk.index, 'one-side-line', `한쪽 색 선: ${colors.join(' ')}`)
      }
      // 4. 카드 그림자(bg-card 와 shadow 를 같은 문자열에)
      if (/(?:^|\s)bg-card(?=\s|$)/.test(t) && SHADOW.test(t)) {
        report(file, code, chunk.index, 'card-shadow', `카드 그림자: ${t.trim().slice(0, 60)}`)
      }
    }
    // 4. <Card ... className="... shadow-*">
    const card = /<Card\b[^>]*?className=(?:"([^"]*)"|\{[^}]*?["'`]([^"'`]*)["'`])/g
    let m
    while ((m = card.exec(code))) {
      const cls = m[1] ?? m[2] ?? ''
      if (SHADOW.test(cls)) report(file, code, m.index, 'card-shadow', `Card 에 그림자: ${cls.trim().slice(0, 60)}`)
    }
  }

  // 5. 팔레트 밖 리터럴 색(주석 제외)
  let m
  HEX.lastIndex = 0
  while ((m = HEX.exec(code))) {
    if (code[m.index - 1] === '&') continue // HTML 엔티티(&#123;)
    report(file, code, m.index, 'palette', `리터럴 색 ${m[0]}: 토큰 클래스(bg-primary · text-muted-foreground 등)를 써요`)
  }
  COLOR_FN.lastIndex = 0
  while ((m = COLOR_FN.exec(code))) {
    report(file, code, m.index, 'palette', `리터럴 색 함수 ${m[0]}...: 토큰 변수를 써요`)
  }
  PALETTE_CLASS.lastIndex = 0
  while ((m = PALETTE_CLASS.exec(code))) {
    report(file, code, m.index, 'palette', `Tailwind 기본 팔레트 ${m[1]}: AXIS 토큰 클래스를 써요`)
  }
}

if (files.length === 0) {
  console.error(`[check:ontology] 측정 실패: 검사할 파일이 없어요 (대상: ${targets.join(', ')})`)
  process.exit(2)
}

for (const v of violations) console.log(`${v.file}:${v.line}  ${v.rule}  ${v.detail}`)
console.log(`\n[check:ontology] 검사 파일 ${files.length}개, 위반 ${violations.length}건`)
process.exit(violations.length > 0 ? 1 : 0)
