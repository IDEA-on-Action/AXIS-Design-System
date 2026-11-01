#!/usr/bin/env node
/**
 * 온톨로지 콘솔 규칙 검사 (WI-0027 FR-4a, WI-0107)
 *
 * 디자인 규칙 가운데 소스만 읽고 결정적으로 판정할 수 있는 다섯 가지를 봅니다.
 *   1. em-dash        긴 줄표(U+2014). 주석 · 문구 · 코드 모두
 *   2. exclamation    느낌표(반각 · 전각)가 든 한글 문구(JSX 텍스트 · 문자열)
 *   3. one-side-line  한쪽 색 선: border-l · border-r · border-s · border-e 와 중립이 아닌 테두리 색 클래스를 같은 클래스 묶음에 함께 씀,
 *                     CSS border-left · border-right(-color) 나 style 객체 borderLeft · borderRight 등에 중립이 아닌 색을 지정
 *   4. card-shadow    카드 그림자: <Card · bg-card · 카드 모양(rounded-* + border) 과 shadow-* 를 같은 클래스 묶음에 함께 씀,
 *                     <Card style 의 boxShadow, 선택자에 card 가 든 CSS 규칙의 box-shadow
 *   5. palette        팔레트 밖 리터럴 색: hex · rgb() · hsl() 숫자 리터럴, CSS 이름 색(red · white 등),
 *                     Tailwind 기본 팔레트 클래스(bg-red-500 · text-white 등)
 *
 * 클래스 묶음: 문자열 하나, className={...} 표현식 안의 문자열 전체, cn() · clsx() · cva() · twMerge() 인자 안의 문자열 전체.
 * 조건부로 나뉜 클래스(cn('border-l-4', active && 'border-primary'))도 합쳐서 봅니다.
 *
 * 해요체 · 금지 표현은 판정 기준 목록이 아직 없어 보지 않습니다(PRD Q8).
 *
 * axis check · MCP axis.check_project 도 같은 판정을 axis 에 내장한 규칙으로 돌립니다(WI-0107, 이 파일을 실행하지는 않음).
 * 두 구현은 같은 입력에 같은 위반 목록(파일 · 줄 · 규칙)을 내도록 AXIS 레포의 패리티 테스트로 맞춰 둡니다.
 * 이 파일을 고치면 axis check 결과와 달라질 수 있어요.
 *
 * 읽는 범위(WI-0107):
 * - 디렉터리는 lstat 로 훑고, 심볼릭 링크는 실경로가 프로젝트 실경로 안일 때만 따라가요(밖 · 깨진 링크는 건너뜀).
 * - 같은 실경로 디렉터리 · 파일은 한 번만 읽고, 디렉터리 깊이 32 단계까지만 내려가요(순환 링크 차단).
 * - 256KB 를 넘는 파일은 건너뛰고 건수를 알려요(생성 · 압축 파일). 줄 길이 상한은 없고, 판정은 선형 시간으로 묶어요.
 * - 8,000자를 넘는 클래스 묶음 · 문자열은 클래스 규칙으로 보지 않아요(레지스트리 컴포넌트에서 가장 긴 묶음은 약 2,000자).
 * - 클래스 묶음 훑기가 파일 길이에 비례한 작업량 상한을 넘으면 그 파일의 클래스 묶음 판정만 멈추고 「일부만 판정」으로 세요.
 * - 위반은 파일 · 줄 · 규칙 순으로 정렬해 보여 줘요.
 *
 * 사용: node scripts/check-ontology.mjs [디렉터리 ...]   (기본: app components lib)
 * 종료 코드: 0 위반 없음 / 1 위반 있음 / 2 측정 실패(검사한 파일이 0개, 읽기 오류,
 *            또는 위반은 없지만 크기 상한 · 깊이 한도 · 작업량 상한으로 판정하지 못한 파일이 있음)
 */
import { lstatSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { extname, isAbsolute, join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const args = process.argv.slice(2)
const targets = args.length > 0 ? args : ['app', 'components', 'lib']
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css'])
/** 파일 크기 상한(바이트). 넘으면 건너뜁니다 */
const MAX_FILE_BYTES = 256 * 1024
/** 디렉터리 깊이 상한 */
const DIR_DEPTH_LIMIT = 32
/** 클래스 묶음(className={...} · cn() 인자) 길이 상한(글자 수). 넘는 묶음은 보지 않습니다(겹친 묶음을 거듭 읽는 시간 상한) */
const MAX_UNIT_CHARS = 8000
/** 클래스 묶음 훑기 작업량 상한: 파일 글자 수 × 16 + 100,000 걸음 */
const SCAN_STEPS_PER_CHAR = 16
const SCAN_STEPS_BASE = 100000
/** 규칙 순서(정렬 · 요약) */
const RULE_IDS = ['em-dash', 'exclamation', 'one-side-line', 'card-shadow', 'palette']

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
const SHADOW = /(?:^|\s|:)shadow(?:-(?!none(?:\s|$))[\w[\]().,%-]+)?(?=\s|$)/
const PALETTE_NAMES =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const PALETTE_CLASS = new RegExp(
  `(?:^|[\\s:"'\`])((?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|decoration|shadow|accent|caret|placeholder)-(?:(?:${PALETTE_NAMES})-\\d{2,3}|white|black)(?:\\/\\d+)?)(?=[\\s"'\`]|$)`,
  'g'
)
const HEX = /#[0-9a-fA-F]{3,8}\b/g
/** CSS 이름 색(transparent · currentColor · inherit 는 색이 아니라 통과) */
const NAMED_COLORS = new Set(
  (
    'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue ' +
    'chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey ' +
    'darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray ' +
    'darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen ' +
    'fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki ' +
    'lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen ' +
    'lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime ' +
    'limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue ' +
    'mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive ' +
    'olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum ' +
    'powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue ' +
    'slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke ' +
    'yellow yellowgreen'
  ).split(' ')
)
/** 색을 받는 CSS 속성(케밥) · style 객체 키(카멜) */
const CSS_COLOR_PROP =
  /(?:^|[;{\s])((?:background|border|outline|text-decoration|column-rule)(?:-(?:top|right|bottom|left|inline-start|inline-end))?(?:-color)?|color|fill|stroke|caret-color|accent-color|box-shadow)\s*:\s*([^;}]+)/g
const STYLE_COLOR_KEY =
  /\b((?:background|border|outline|textDecoration|columnRule)(?:Top|Right|Bottom|Left|InlineStart|InlineEnd)?(?:Color)?|color|fill|stroke|caretColor|accentColor|boxShadow)\s*:\s*(["'`])([^"'`]*)\2/g
const COLOR_FN = /\b(?:rgba?|hsla?)\(\s*\d/g
const HANGUL = /[가-힣]/

/**
 * 주석을 같은 길이의 공백으로 바꿔 줄 번호를 지킵니다(앞이 : 인 // 는 URL 로 보고 남김).
 * 블록 주석은 정규식 대신 indexOf 로 한 번 훑어요(닫히지 않은 /* 가 많아도 선형). 결과는 /\/\*[\s\S]*?\*\//g 와 같아요
 */
function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, ' ')
  let out = ''
  let last = 0
  for (let i = src.indexOf('/*'); i !== -1; i = src.indexOf('/*', last)) {
    const end = src.indexOf('*/', i + 2)
    if (end === -1) break
    out += src.slice(last, i) + blank(src.slice(i, end + 2))
    last = end + 2
  }
  out += src.slice(last)
  return out.replace(/(^|[^:'"`\\])(\/\/[^\n]*)/g, (_, pre, c) => pre + blank(c))
}

/** 줄 번호 찾기: 줄바꿈 위치 목록을 한 번 만들고 이분 탐색합니다 */
function lineIndex(src) {
  const breaks = []
  for (let i = src.indexOf('\n'); i !== -1; i = src.indexOf('\n', i + 1)) breaks.push(i)
  return (index) => {
    let lo = 0
    let hi = breaks.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (breaks[mid] < index) lo = mid + 1
      else hi = mid
    }
    return lo + 1
  }
}

const isLineTerminator = (c) => c === '\n' || c === '\r' || c === '\u2028' || c === '\u2029'

/** 따옴표 q 의 문자열 내용이 i 에서 시작할 때 닫는 따옴표 위치(-1: 이 줄에서 닫히지 않음). 오른쪽에서 왼쪽으로 한 번 만듭니다 */
function literalEnds(code, q) {
  const n = code.length
  const end = new Int32Array(n + 2).fill(-1)
  for (let i = n - 1; i >= 0; i--) {
    const c = code[i]
    if (c === q) end[i] = i
    else if (c === '\n') end[i] = -1
    else if (c === '\\') end[i] = i + 1 < n && !isLineTerminator(code[i + 1]) ? end[i + 2] : -1
    else end[i] = end[i + 1]
  }
  return end
}

/**
 * 문자열 리터럴(내용 · 여는 따옴표 위치). 정규식 /(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g 와 같은 결과를 선형으로 내요
 * (닫히지 않은 따옴표가 많은 줄에서 시작점마다 줄 끝까지 다시 훑는 2차 시간을 피함)
 */
function stringLiterals(code) {
  const ends = { '"': literalEnds(code, '"'), "'": literalEnds(code, "'"), '`': literalEnds(code, '`') }
  const out = []
  for (let i = 0; i < code.length; i++) {
    const c = code[i]
    if (c !== '"' && c !== "'" && c !== '`') continue
    const e = ends[c][i + 1]
    if (e === -1) continue
    out.push({ text: code.slice(i + 1, e), index: i })
    i = e
  }
  return out
}

/** 문자열 리터럴과 JSX 텍스트 조각을 위치와 함께 돌려줍니다 */
function textChunks(code, isJsx) {
  const out = stringLiterals(code).map((x) => ({ text: x.text, index: x.index, kind: 'string' }))
  let m
  if (isJsx) {
    // JSX 텍스트: 태그 · 표현식 사이 조각. = · ; 가 든 조각은 코드로 보고 건너뜁니다.
    // 따옴표가 든 조각은 문자열 리터럴을 지운 나머지를 봅니다(「현황이에요! "확인"」은 잡고, 코드 속 '문구' 는 문자열 검사에 맡김)
    const jsx = /[>}]([^<>{}]+)(?=[<{])/g
    while ((m = jsx.exec(code))) {
      if (/[=;]/.test(m[1])) continue
      const text = m[1].replace(/(["'`])(?:(?!\1)[^\n])*\1/g, ' ')
      out.push({ text, index: m.index + 1, kind: 'jsx' })
    }
  }
  return out
}

/** 작업량 상한을 넘었다는 신호(그 파일의 클래스 묶음 판정만 멈춤) */
const SCAN_BUDGET_EXCEEDED = Symbol('scan-budget-exceeded')

function spend(budget, steps) {
  budget.left -= steps
  if (budget.left < 0) throw SCAN_BUDGET_EXCEEDED
}

/** 괄호 짝 찾기에서 따옴표 q 로 연 문자열을 i 부터 건너뛸 때 닫는 따옴표 위치(없으면 길이). 역슬래시 다음 글자는 건너뜁니다 */
function skipEnds(code, q) {
  const n = code.length
  const end = new Int32Array(n + 2).fill(n)
  for (let i = n - 1; i >= 0; i--) {
    const c = code[i]
    end[i] = c === q ? i : c === '\\' ? end[Math.min(i + 2, n)] : end[i + 1]
  }
  return end
}

/**
 * open 위치의 여는 괄호에 짝이 맞는 닫는 괄호 위치(문자열 안 괄호는 건너뜀). 묶음 길이가 MAX_UNIT_CHARS 를 넘거나 못 찾으면 -1.
 * - 문자열은 표(skipEnds)로 한 번에 건너뛰어요.
 * - 안에서 연 괄호의 짝을 기억해 두고, 이미 아는 괄호를 만나면 그 짝으로 바로 넘어가요(같은 상태에서 훑는 것이라 결과가 같음).
 *   그 괄호가 -1 이면 그것을 품은 바깥 괄호도 모두 상한을 넘으므로 -1 이에요.
 * - 상한 거리까지 닫지 못하면 그 open 만 -1 로 기억하고 멈춰요.
 */
function closeMatcher(code, budget) {
  const memo = new Map()
  const pair = { '(': ')', '{': '}' }
  const skips = { '"': skipEnds(code, '"'), "'": skipEnds(code, "'"), '`': skipEnds(code, '`') }
  return (open) => {
    const known = memo.get(open)
    if (known !== undefined) return known
    const limit = open + MAX_UNIT_CHARS
    const stack = [pair[code[open]]]
    const opens = [open]
    let steps = 0
    for (let i = open + 1; i < code.length; i++) {
      if (++steps === 1024) {
        spend(budget, steps)
        steps = 0
      }
      if (i >= limit) {
        spend(budget, steps)
        memo.set(open, -1)
        return -1
      }
      const c = code[i]
      if (c === '"' || c === "'" || c === '`') {
        i = skips[c][i + 1]
        continue
      }
      if (c === '(' || c === '{') {
        const inner = memo.get(i)
        if (inner !== undefined) {
          if (inner === -1) {
            spend(budget, steps)
            for (const p of opens) memo.set(p, -1)
            return -1
          }
          i = inner
          continue
        }
        stack.push(pair[c])
        opens.push(i)
      } else if (c === stack[stack.length - 1]) {
        stack.pop()
        memo.set(opens.pop(), i)
        if (stack.length === 0) {
          spend(budget, steps)
          return i
        }
      }
    }
    spend(budget, steps)
    for (const p of opens) memo.set(p, -1)
    return -1
  }
}

/** 코드 조각 안 문자열 리터럴 내용을 공백으로 이어 붙입니다 */
function joinStrings(expr, budget) {
  spend(budget, expr.length)
  return stringLiterals(expr)
    .map((x) => x.text)
    .join(' ')
}

/** at 위치에서 `<Card` 태그가 시작하는가(뒤가 단어 글자가 아니거나 end) */
function isCardTagAt(code, at, end) {
  if (at < 0 || at + 5 > end || !code.startsWith('<Card', at)) return false
  const next = at + 5
  return next >= end || !/\w/.test(code[next])
}

/** index 이하에서 가장 가까운 `<` 위치. 위치가 늘어나는 순서로만 물어서 한 번만 훑어요 */
function lastLtFinder(code) {
  let pos = 0
  let last = -1
  return (index) => {
    for (; pos <= index && pos < code.length; pos++) if (code[pos] === '<') last = pos
    return last
  }
}

/**
 * `<Card ... className="..."` 의 className 문자열. 정규식 /<Card\b(?:[^<>]|=>)*?className="([^"]*)"/g 와 같은 결과를
 * 선형으로 찾아요(닫는 따옴표가 없는 className=" 가 많아도 끝까지 반복해 훑지 않음)
 */
function cardClassStrings(code) {
  const out = []
  let from = 0
  let noQuoteAfter = Infinity
  for (let at = code.indexOf('<Card', from); at !== -1; at = code.indexOf('<Card', from)) {
    from = at + 1
    if (!isCardTagAt(code, at, code.length)) continue
    for (let k = at + 5; k < code.length; k++) {
      if (k + 11 <= code.length && code.startsWith('className="', k) && k + 11 < noQuoteAfter) {
        const q = code.indexOf('"', k + 11)
        if (q !== -1) {
          out.push({ text: code.slice(k + 11, q), index: at, card: true })
          from = q + 1
          break
        }
        noQuoteAfter = k + 11
      }
      const c = code[k]
      if (c === '<') break
      if (c === '>' && !(k - 1 >= at + 5 && code[k - 1] === '=')) break
    }
  }
  return out
}

/**
 * 클래스 묶음: className={...} 표현식과 cn() · clsx() · cva() · twMerge() 인자 안의 문자열을 하나로 합칩니다.
 * <Card 의 className 묶음은 card: true 로 표시합니다.
 */
function classUnits(code, budget) {
  const out = []
  const matchClose = closeMatcher(code, budget)
  const lastLt = lastLtFinder(code)
  let m
  const attr = /className=\{/g
  while ((m = attr.exec(code))) {
    const open = m.index + m[0].length - 1
    const close = matchClose(open)
    if (close === -1 || close - open + 1 > MAX_UNIT_CHARS) continue
    out.push({ text: joinStrings(code.slice(open, close + 1), budget), index: m.index, card: isCardTagAt(code, lastLt(m.index), m.index) })
  }
  const call = /\b(?:cn|clsx|cva|twMerge)\(/g
  while ((m = call.exec(code))) {
    const open = m.index + m[0].length - 1
    const close = matchClose(open)
    if (close === -1 || close - open + 1 > MAX_UNIT_CHARS) continue
    out.push({ text: joinStrings(code.slice(open, close + 1), budget), index: m.index, card: false })
  }
  out.push(...cardClassStrings(code))
  return out
}

/**
 * CSS 규칙(선택자 { 본문 })을 한 번 훑어 나눕니다. 정규식 /([^{}]+)\{([^{}]*)\}/g 와 같은 결과를 선형으로 내요
 * (중괄호 없는 긴 구간에서 시작점마다 끝까지 훑는 2차 시간을 피함)
 */
function cssRules(code) {
  const out = []
  const nextBrace = (from) => {
    for (let k = from; k < code.length; k++) if (code[k] === '{' || code[k] === '}') return k
    return -1
  }
  let i = 0
  while (i < code.length) {
    if (code[i] === '{' || code[i] === '}') {
      i++
      continue
    }
    const open = nextBrace(i)
    if (open === -1) break
    if (code[open] !== '{') {
      i = open + 1
      continue
    }
    const close = nextBrace(open + 1)
    if (close === -1) break
    if (code[close] !== '}') {
      i = open + 1
      continue
    }
    out.push({ selector: code.slice(i, open), body: code.slice(open + 1, close), open })
    i = close + 1
  }
  return out
}

/** 한쪽 테두리 폭 클래스와 함께 쓴, 중립이 아닌 테두리 색 클래스 */
function oneSideColors(t) {
  if (!SIDE_WIDTH.test(t)) return []
  return [...t.matchAll(BORDER_COLOR)]
    .map((x) => x[1])
    .filter((c) => !NEUTRAL_BORDER.has(c.replace(/^border-[lrse]-/, 'border-')) && !BORDER_NOT_COLOR.test(c))
}

/** 카드로 볼 클래스 묶음인가: <Card · bg-card · 카드 모양(rounded-* 와 border 를 함께) */
function isCardLike(t, card) {
  return card || /(?:^|\s)bg-card(?=\s|$)/.test(t) || (/(?:^|\s)rounded(?:-[\w[\]]+)?(?=\s|$)/.test(t) && /(?:^|\s)border(?:-(?:0|2|4|8))?(?=\s|$)/.test(t))
}

/** CSS 값 또는 style 값이 한쪽 색 선인가 */
function sideValueColored(value) {
  const v = value.trim()
  const neutral = /^(?:0|none|hidden)$/.test(v) || /var\(--border\)|hsl\(var\(--border\)\)|transparent|currentColor/.test(v)
  const colored = /#|rgb|hsl|var\(--/.test(v) || v.split(/[\s,()]+/).some((w) => NAMED_COLORS.has(w.toLowerCase()))
  return colored && !neutral
}

/** child 실경로가 parent 실경로와 같거나 그 안인가 */
function isInside(parent, child) {
  const rel = relative(parent, child)
  return rel === '' || !(rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))
}

/** 검사할 파일 목록. 읽기 오류는 그대로 던져 측정 실패로 다룹니다 */
function collectFiles() {
  const rootReal = realpathSync(ROOT)
  const found = { files: [], skippedLarge: 0, skippedLinks: 0, skippedDeep: 0, partialFiles: 0 }
  const visitedDirs = new Set()
  const seenFiles = new Set()

  /** 경로의 실제 대상. 링크가 밖 · 깨졌으면 undefined */
  const resolveEntry = (p, st) => {
    if (!st.isSymbolicLink()) return { st, real: undefined }
    let real
    let target
    try {
      real = realpathSync(p)
      target = statSync(real)
    } catch {
      found.skippedLinks++
      return undefined
    }
    if (!isInside(rootReal, real)) {
      found.skippedLinks++
      return undefined
    }
    return { st: target, real }
  }

  const addFile = (p, real, st) => {
    if (seenFiles.has(real)) return
    seenFiles.add(real)
    if (st.size > MAX_FILE_BYTES) {
      found.skippedLarge++
      return
    }
    found.files.push({ path: p, real })
  }

  const walk = (dir, dirReal, depth) => {
    const names = readdirSync(dir).sort()
    for (const name of names) {
      if (name === 'node_modules' || name.startsWith('.')) continue
      const p = join(dir, name)
      const entry = resolveEntry(p, lstatSync(p))
      if (!entry) continue
      const real = entry.real ?? join(dirReal, name)
      if (entry.st.isDirectory()) {
        if (visitedDirs.has(real)) continue
        if (depth >= DIR_DEPTH_LIMIT) {
          found.skippedDeep++
          continue
        }
        visitedDirs.add(real)
        walk(p, real, depth + 1)
      } else if (entry.st.isFile() && EXTS.has(extname(name))) {
        addFile(p, real, entry.st)
      }
    }
  }

  for (const t of targets) {
    const p = join(ROOT, t)
    let st
    try {
      st = lstatSync(p)
    } catch (e) {
      if (e && e.code === 'ENOENT') continue
      throw e
    }
    const entry = resolveEntry(p, st)
    if (!entry) continue
    const real = entry.real ?? realpathSync(p)
    if (!isInside(rootReal, real)) {
      found.skippedLinks++
      continue
    }
    if (entry.st.isDirectory()) {
      if (visitedDirs.has(real)) continue
      visitedDirs.add(real)
      walk(p, real, 1)
    } else if (entry.st.isFile() && EXTS.has(extname(p))) {
      addFile(p, real, entry.st)
    }
  }
  return found
}

let found
try {
  found = collectFiles()
} catch (e) {
  console.error(`[check:ontology] 측정 실패: 파일 목록을 읽지 못했어요 (${e && e.code ? e.code : e})`)
  process.exit(2)
}

const violations = []
const seen = new Set()
let checked = 0

for (const { path: file, real } of found.files) {
  let raw
  try {
    raw = readFileSync(real, 'utf8')
  } catch (e) {
    console.error(`[check:ontology] 측정 실패: ${relative(ROOT, file)} 를 읽지 못했어요 (${e && e.code ? e.code : e})`)
    process.exit(2)
  }
  checked++
  const ext = extname(file)
  const code = stripComments(raw)
  const lineOf = lineIndex(raw)
  const fileViolations = []
  const report = (index, rule, detail) => {
    const v = { file: relative(ROOT, file), line: lineOf(index), rule, detail }
    const key = `${v.file}:${v.line}:${v.rule}`
    if (seen.has(key)) return // 문자열 검사와 클래스 묶음 검사가 같은 줄을 두 번 보고하지 않게
    seen.add(key)
    fileViolations.push(v)
  }

  // 1. 긴 줄표: 주석 안까지 봅니다
  for (let i = raw.indexOf(EM_DASH); i !== -1; i = raw.indexOf(EM_DASH, i + 1)) {
    report(i, 'em-dash', '긴 줄표(U+2014) 대신 하이픈 · 쉼표 · 가운뎃점을 써요')
  }

  if (ext === '.css') {
    // 3. CSS 한쪽 색 선
    const side = /border-(?:left|right|inline-start|inline-end)(?:-color)?\s*:\s*([^;}]+)/g
    let m
    while ((m = side.exec(code))) {
      if (sideValueColored(m[1])) report(m.index, 'one-side-line', `한쪽 색 선: ${m[0].trim()}`)
    }
    // 4. 선택자에 card 가 든 규칙의 box-shadow
    for (const r of cssRules(code)) {
      if (/card/i.test(r.selector) && /box-shadow\s*:(?!\s*(?:none\b|0 0 #0000))/.test(r.body)) {
        report(r.open, 'card-shadow', `카드 그림자: ${r.selector.trim()}`)
      }
    }
  } else {
    const isJsx = ext === '.tsx' || ext === '.jsx'
    for (const chunk of textChunks(code, isJsx)) {
      const t = chunk.text
      // 2. 느낌표가 든 한글 문구
      if (HANGUL.test(t) && (t.includes('!') || t.includes(FULLWIDTH_BANG))) {
        report(chunk.index, 'exclamation', `느낌표가 든 문구: ${t.trim().slice(0, 40)}`)
      }
      if (chunk.kind !== 'string') continue
      // 3 · 4. 문자열 하나 안의 클래스(클래스 묶음 상한보다 긴 문자열은 클래스로 보지 않음)
      if (t.length > MAX_UNIT_CHARS) continue
      const colors = oneSideColors(t)
      if (colors.length > 0) report(chunk.index, 'one-side-line', `한쪽 색 선: ${colors.join(' ')}`)
      if (isCardLike(t, false) && SHADOW.test(t)) {
        report(chunk.index, 'card-shadow', `카드 그림자: ${t.trim().slice(0, 60)}`)
      }
    }
    // 3 · 4. 여러 문자열로 나뉜 클래스 묶음(className={...} · cn() 인자). 작업량 상한을 넘으면 이 판정만 멈추고 일부만 판정으로 세요
    let units = []
    try {
      units = classUnits(code, { left: code.length * SCAN_STEPS_PER_CHAR + SCAN_STEPS_BASE })
    } catch (e) {
      if (e !== SCAN_BUDGET_EXCEEDED) throw e
      found.partialFiles++
    }
    for (const unit of units) {
      const t = unit.text
      const colors = oneSideColors(t)
      if (colors.length > 0) report(unit.index, 'one-side-line', `한쪽 색 선: ${colors.join(' ')}`)
      if (isCardLike(t, unit.card) && SHADOW.test(t)) {
        report(unit.index, 'card-shadow', `${unit.card ? 'Card 에 그림자' : '카드 그림자'}: ${t.trim().slice(0, 60)}`)
      }
    }
    // 3 · 4 · 5. style 객체: borderLeft · borderRight 등 한쪽 색 선, <Card style 의 boxShadow, 이름 색
    const lastLt = lastLtFinder(code)
    let m
    STYLE_COLOR_KEY.lastIndex = 0
    while ((m = STYLE_COLOR_KEY.exec(code))) {
      const [, key, , value] = m
      if (/^border(?:Left|Right|InlineStart|InlineEnd)(?:Color)?$/.test(key) && sideValueColored(value)) {
        report(m.index, 'one-side-line', `한쪽 색 선(style): ${key}: ${value}`)
      }
      if (key === 'boxShadow' && !/^(?:none|0 0 #0000)$/.test(value.trim())) {
        if (isCardTagAt(code, lastLt(m.index), code.length)) report(m.index, 'card-shadow', `Card 에 그림자(style): ${value}`)
      }
      const named = value.split(/[\s,()]+/).find((w) => NAMED_COLORS.has(w.toLowerCase()))
      if (named) report(m.index, 'palette', `이름 색 ${named}(style ${key}): 토큰 변수를 써요`)
    }
  }

  // 5. CSS 이름 색
  if (ext === '.css') {
    let m
    CSS_COLOR_PROP.lastIndex = 0
    while ((m = CSS_COLOR_PROP.exec(code))) {
      const named = m[2].split(/[\s,()]+/).find((w) => NAMED_COLORS.has(w.toLowerCase()))
      if (named) report(m.index, 'palette', `이름 색 ${named}(${m[1]}): 토큰 변수를 써요`)
    }
  }

  // 5. 팔레트 밖 리터럴 색(주석 제외)
  let m
  HEX.lastIndex = 0
  while ((m = HEX.exec(code))) {
    if (code[m.index - 1] === '&') continue // HTML 엔티티(&#123;)
    if (/[\w/]/.test(code[m.index - 1] ?? '')) continue // URL 조각(/entities#abc)
    if (/(?:href|to|id)=\{?\s*["'`]$/.test(code.slice(Math.max(0, m.index - 12), m.index))) continue // 앵커(href="#add")
    report(m.index, 'palette', `리터럴 색 ${m[0]}: 토큰 클래스(bg-primary · text-muted-foreground 등)를 써요`)
  }
  COLOR_FN.lastIndex = 0
  while ((m = COLOR_FN.exec(code))) {
    report(m.index, 'palette', `리터럴 색 함수 ${m[0]}...: 토큰 변수를 써요`)
  }
  PALETTE_CLASS.lastIndex = 0
  while ((m = PALETTE_CLASS.exec(code))) {
    report(m.index, 'palette', `Tailwind 기본 팔레트 ${m[1]}: AXIS 토큰 클래스를 써요`)
  }
  // 줄 · 규칙 순서로 정렬(첫 줄이 실제로 가장 앞의 위반)
  fileViolations.sort((a, b) => a.line - b.line || RULE_IDS.indexOf(a.rule) - RULE_IDS.indexOf(b.rule))
  violations.push(...fileViolations)
}

const skipped = []
if (found.skippedLarge > 0) skipped.push(`크기 상한(256KB) 초과 ${found.skippedLarge}개`)
if (found.skippedLinks > 0) skipped.push(`프로젝트 밖 · 깨진 링크 ${found.skippedLinks}개`)
if (found.skippedDeep > 0) skipped.push(`깊이 ${DIR_DEPTH_LIMIT} 단계 밖 디렉터리 ${found.skippedDeep}개`)
if (found.partialFiles > 0) skipped.push(`클래스 묶음 작업량 상한 초과(일부만 판정) ${found.partialFiles}개`)
const skippedNote = skipped.length > 0 ? ` (건너뜀: ${skipped.join(' · ')})` : ''
/** 검사 범위 안인데 판정하지 못한 것이 있는가(링크는 범위 밖이라 세지 않음) */
const incomplete = found.skippedLarge > 0 || found.skippedDeep > 0 || found.partialFiles > 0

if (checked === 0) {
  console.error(`[check:ontology] 측정 실패: 검사할 파일이 없어요 (대상: ${targets.join(', ')})${skippedNote}`)
  process.exit(2)
}

for (const v of violations) console.log(`${v.file}:${v.line}  ${v.rule}  ${v.detail}`)
console.log(`\n[check:ontology] 검사 파일 ${checked}개, 위반 ${violations.length}건${skippedNote}`)
if (violations.length > 0) process.exit(1)
if (incomplete) {
  console.error('[check:ontology] 일부 측정 실패: 판정하지 못한 파일이 있어 통과로 보지 않아요 (건너뜀 참고)')
  process.exit(2)
}
process.exit(0)
