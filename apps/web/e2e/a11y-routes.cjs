'use strict'
/**
 * a11y E2E 경로 목록 (WI-0062 D2 게이트, 배치 4).
 *
 * 경로를 손으로 적지 않고 앱 라우트(src/app 의 page.tsx)와 데이터 index 에서 만든다.
 * 손으로 쓴 목록과 CI 건수 가드(예전 40 · 10)는 문서 페이지가 늘 때마다 낡았기 때문이다.
 * a11y.spec.ts 와 .github/workflows/frontend.yml 「E2E 실행 건수 가드」가 같은 이 파일을 읽는다.
 *
 * - 정적 경로: page.tsx 마다 1개. 경로 그룹 `(docs)` 같은 세그먼트는 주소에서 빠지고, `_` 로 시작하는 폴더는 라우트가 아니다.
 * - 동적 경로: 대표 1개씩. 고르는 규칙은 DYNAMIC 에 적고, 규칙이 없는 동적 라우트가 생기면 조용히 빼지 않고 멈춘다.
 *   library 는 WI-0060 머지 뒤 index.json 기준(상세 주소는 항목마다 하나)이다.
 * - next.config.ts 가 trailingSlash: true 라 모든 경로는 `/` 로 끝난다.
 *
 * CLI: `node e2e/a11y-routes.cjs --count` 는 경로 수, `--combos` 는 조합(공백 구분), 인자가 없으면 경로 · 종류 · 라우트를 한 줄에 하나씩 출력한다.
 */
const fs = require('node:fs')
const path = require('node:path')
const { pickLibraryReps } = require('./library-reps.cjs')

const WEB_ROOT = path.join(__dirname, '..')
const APP_DIR = path.join(WEB_ROOT, 'src', 'app')
const PUBLIC_DIR = path.join(WEB_ROOT, 'public')

/** 브랜드 x 테마 조합 수(a11y.spec.ts 의 BRANDS · THEMES 와 같아야 한다) */
const COMBOS = ['default/light', 'default/dark', 'ontology/light', 'ontology/dark']

/**
 * 하이드레이션 · 데이터 로드 뒤에만 검사해야 하는 경로의 준비 선택자.
 * 지정이 없으면 공통으로 `h1` 이 보일 때까지 기다린다(library · templates 는 index.json 을 받기 전에 Skeleton 만 그린다).
 * 정적 경로는 READY 에 주소로 적고, 동적 라우트는 DYNAMIC 규칙이 주소와 함께 준비 선택자를 돌려준다(대표 주소가 데이터로 정해지기 때문).
 */
const READY = {
  // 하이드레이션 전에는 컨트롤 fieldset 이 disabled 라 라벨이 대비 검사에서 빠진다(WI-0025 M4)
  '/docs/brand-demo/': '[data-testid="brand-demo-controls"][data-ready="true"]',
}

/**
 * library 상세 준비 선택자(WI-0078 D2-C): 상세 JSON 을 받아 그린 뒤에만 있는 「설치」 h2.
 * 기본 `h1` 은 데이터 요청이 실패한 오류 화면(h1 「컴포넌트를 찾을 수 없습니다」)에도 있어서, 데이터가 비어도 오류 화면을 재고 통과했다.
 * 로드 중(Skeleton) · 오류 화면에는 h2 가 없다.
 */
const LIBRARY_DETAIL_READY = 'h2:text-is("설치")'

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, rel), 'utf-8'))
}

/** 코드 파일이 있는 첫 항목(지금은 AXIS). library-detail.spec.ts 의 code 대표와 같은 항목이다(e2e/library-reps.cjs) */
function libraryCodeRep() {
  return pickLibraryReps().code
}

/** 동적 라우트(세그먼트 패턴) -> 대표 경로 1개. 문자열 또는 { path, ready } 를 돌려준다 */
const DYNAMIC = {
  'library/[category]': () => `/library/${libraryCodeRep().category}/`,
  'library/[category]/[slug]': () => ({ path: libraryCodeRep().pagePath, ready: LIBRARY_DETAIL_READY }),
  'templates/[slug]': () => {
    const index = readJson('templates/index.json')
    // 상세 JSON 이 있는 첫 템플릿(없는 slug 는 상세 페이지가 notFound)
    const t = index.templates.find((x) => fs.existsSync(path.join(PUBLIC_DIR, 'templates', `${x.slug}.json`)))
    if (!t) throw new Error('templates/index.json 에 상세 JSON 이 있는 템플릿이 없어요')
    return `/templates/${t.slug}/`
  },
}

function findPages(dir, segs, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (ent.name.startsWith('_') || ent.name.startsWith('@')) continue
      findPages(path.join(dir, ent.name), [...segs, ent.name], out)
    } else if (ent.name === 'page.tsx' || ent.name === 'page.ts' || ent.name === 'page.jsx' || ent.name === 'page.js') {
      out.push(segs)
    }
  }
  return out
}

function nameOf(p) {
  return p === '/' ? 'Home' : p.replace(/^\/|\/$/g, '')
}

/** @returns {Array<{ path: string, name: string, kind: 'static' | 'dynamic', route: string, readySelector: string }>} */
function listA11yRoutes() {
  if (!fs.existsSync(APP_DIR)) throw new Error(`앱 라우트 폴더가 없어요: ${APP_DIR}`)
  const pages = findPages(APP_DIR, [], [])
  const routes = []
  for (const segs of pages) {
    const urlSegs = segs.filter((s) => !(s.startsWith('(') && s.endsWith(')')))
    const route = urlSegs.join('/')
    let p
    let ready
    let kind = 'static'
    if (urlSegs.some((s) => s.includes('['))) {
      const pick = DYNAMIC[route]
      if (!pick) throw new Error(`대표 경로 규칙이 없는 동적 라우트예요: ${route} (a11y-routes.cjs DYNAMIC 에 추가)`)
      const picked = pick()
      if (typeof picked === 'string') p = picked
      else ({ path: p, ready } = picked)
      kind = 'dynamic'
    } else {
      p = route === '' ? '/' : `/${route}/`
    }
    routes.push({ path: p, name: nameOf(p), kind, route: route || '/', readySelector: ready ?? READY[p] ?? 'h1' })
  }
  routes.sort((a, b) => a.path.localeCompare(b.path))
  const dup = routes.map((r) => r.path).filter((v, i, a) => a.indexOf(v) !== i)
  if (dup.length > 0) throw new Error(`같은 주소가 두 번 나왔어요: ${dup.join(', ')}`)
  if (routes.length === 0) throw new Error('page.tsx 를 하나도 찾지 못했어요 (측정 실패)')
  return routes
}

module.exports = { listA11yRoutes, COMBOS }

if (require.main === module) {
  const routes = listA11yRoutes()
  if (process.argv.includes('--count')) {
    process.stdout.write(`${routes.length}\n`)
  } else if (process.argv.includes('--combos')) {
    process.stdout.write(`${COMBOS.join(' ')}\n`)
  } else {
    for (const r of routes) process.stdout.write(`${r.path}\t${r.kind}\t${r.route}\n`)
  }
}
