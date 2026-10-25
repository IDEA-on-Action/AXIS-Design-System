import { test, expect, type Page } from '@playwright/test'
import { sourceTypes } from '../src/lib/library-types'

/**
 * library 상세 화면 E2E 스모크 (WI-0078).
 *
 * 상세 화면은 정적 HTML 에 내용이 없고 클라이언트가 런타임에 `/library/components/<id>.json` 을 받아 그린다.
 * 받기에 실패하면 같은 HTTP 200 페이지 안에 h1 「컴포넌트를 찾을 수 없습니다」를 그린다.
 * 문서 200 이나 h1 존재만 보면 이 오류 화면도 통과하므로, 여기서는 요청 · 응답과 화면 내용을 상세 JSON 과 맞대 본다.
 *
 * - 양성 3건: 대표 항목(e2e/library-reps.cjs, index.json 속성으로 후보를 고르고 대표 3개의 상세 JSON 만 읽음)마다 문서 200, 기대 주소 데이터 응답 200,
 *   h1 이 JSON name 과 같고 오류 h1 0건, 설치 명령이 JSON 에서 계산한 값과 같고, 코드 파일 수만큼 코드 블록(또는 「코드가 없습니다.」)이 있는지.
 * - 감지기 자기 검사 1건: page.route 로 데이터 요청을 404 로 바꿔 오류 화면을 관측하고, 같은 판정 함수가 실패를 내는지 단언한다.
 *   판정 함수가 퇴화해 늘 통과하게 되면 이 건이 실패한다(측정이 살아 있음을 매 실행 증명하는 양성 대조).
 * - CI 건수 가드(frontend.yml 「E2E 실행 건수 가드」)는 library:4 와 describe 별 3 · 1 을 본다.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pickLibraryReps } = require('./library-reps.cjs') as {
  pickLibraryReps: (publicDir?: string) => Record<'code' | 'renamed' | 'existing', LibraryRep>
}

interface LibraryRep {
  id: string
  slug: string
  name: string
  source: string
  pagePath: string
  dataPath: string
  detail: {
    id: string
    name: string
    source: { type: string }
    code: { files: Array<{ path: string; content: string }> }
  }
}

const ERROR_H1 = '컴포넌트를 찾을 수 없습니다'
const NO_CODE = '코드가 없습니다.'

const REPS = pickLibraryReps()
const KINDS = ['code', 'renamed', 'existing'] as const
if (Object.keys(REPS).sort().join(',') !== [...KINDS].sort().join(',')) {
  throw new Error(`library-reps.cjs 대표 종류가 달라요: ${Object.keys(REPS).join(',')}`)
}

/** 화면이 보여야 하는 설치 명령. 원본 이름은 id 에서 `<source>-` 를 뗀 값이다(slug 가 바뀐 항목도 원본 이름을 쓴다) */
function expectedInstall(rep: LibraryRep): string {
  const type = rep.detail.source.type
  const prefix = sourceTypes[type]?.installPrefix
  if (!prefix) throw new Error(`sourceTypes 에 ${type} 설치 접두가 없어요 (기대값을 정할 수 없음)`)
  const head = `${type}-`
  const name = rep.detail.id.startsWith(head) ? rep.detail.id.slice(head.length) : rep.slug
  return `${prefix} ${name}`
}

interface Observation {
  docStatus: number | null
  /** 기대 주소(dataPath) 요청의 응답 상태들. 비면 그 주소를 아예 요청하지 않은 것 */
  dataStatuses: number[]
  /** 다른 library/components 주소로 간 요청(경로 drift 단서) */
  otherDataPaths: string[]
  h1Texts: string[]
  installTexts: string[]
  preCount: number
  filePathsShown: string[]
  noCodeCount: number
}

async function observe(page: Page, rep: LibraryRep): Promise<Observation> {
  const dataStatuses: number[] = []
  const otherDataPaths: string[] = []
  page.on('response', (r) => {
    const p = new URL(r.url()).pathname
    if (p === rep.dataPath) dataStatuses.push(r.status())
    else if (p.startsWith('/library/component')) otherDataPaths.push(`${p} ${r.status()}`)
  })
  const res = await page.goto(rep.pagePath)
  // 로드 중(Skeleton)에는 h1 이 없고, 로드 뒤 · 오류 화면에만 h1 이 있다. 시간이 넘으면 h1 없음으로 기록해 판정에 맡긴다
  await page
    .locator('h1')
    .first()
    .waitFor({ state: 'attached', timeout: 15_000 })
    .catch(() => undefined)
  const h1Texts = (await page.locator('h1').allTextContents()).map((t) => t.trim())
  const installSection = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { level: 2, name: '설치', exact: true }) })
  const installTexts = (await installSection.locator('code').allTextContents()).map((t) => t.trim())
  const preCount = await page.locator('pre').count()
  const filePathsShown: string[] = []
  for (const f of rep.detail.code.files) {
    if ((await page.getByText(f.path, { exact: true }).count()) > 0) filePathsShown.push(f.path)
  }
  const noCodeCount = await page.getByText(NO_CODE, { exact: true }).count()
  return {
    docStatus: res?.status() ?? null,
    dataStatuses,
    otherDataPaths,
    h1Texts,
    installTexts,
    preCount,
    filePathsShown,
    noCodeCount,
  }
}

/** 관측값을 상세 JSON 과 맞대 문제 목록을 낸다. 빈 배열이면 통과 */
function judge(rep: LibraryRep, o: Observation): string[] {
  const problems: string[] = []
  if (o.docStatus !== 200) problems.push(`문서 HTTP ${o.docStatus} (기대 200)`)
  if (o.dataStatuses.length === 0) {
    problems.push(`데이터 ${rep.dataPath} 요청이 관측되지 않음 (다른 주소: ${o.otherDataPaths.join(', ') || '없음'})`)
  } else if (!o.dataStatuses.includes(200)) {
    problems.push(`데이터 ${rep.dataPath} 응답 ${o.dataStatuses.join(',')} (기대 200)`)
  }
  if (o.h1Texts.includes(ERROR_H1)) problems.push(`오류 h1 「${ERROR_H1}」 이 보임`)
  if (o.h1Texts.length !== 1 || o.h1Texts[0] !== rep.detail.name) {
    problems.push(`h1 ${JSON.stringify(o.h1Texts)} (기대 [${JSON.stringify(rep.detail.name)}])`)
  }
  const install = expectedInstall(rep)
  if (o.installTexts.length !== 1 || o.installTexts[0] !== install) {
    problems.push(`설치 명령 ${JSON.stringify(o.installTexts)} (기대 [${JSON.stringify(install)}])`)
  }
  const files = rep.detail.code.files
  if (files.length > 0) {
    if (o.preCount !== files.length) problems.push(`코드 블록 pre ${o.preCount}개 (기대 ${files.length}개)`)
    const missing = files.map((f) => f.path).filter((p) => !o.filePathsShown.includes(p))
    if (missing.length > 0) problems.push(`코드 파일 경로가 안 보임: ${missing.join(', ')}`)
    if (o.noCodeCount !== 0) problems.push(`코드가 있는데 「${NO_CODE}」 ${o.noCodeCount}건`)
  } else if (o.noCodeCount !== 1) {
    problems.push(`코드 없는 항목인데 「${NO_CODE}」 ${o.noCodeCount}건 (기대 1)`)
  }
  return problems
}

test.describe('library detail (양성)', () => {
  for (const kind of KINDS) {
    const rep = REPS[kind]
    test(`${kind}: ${rep.id} (${rep.pagePath})`, async ({ page }, testInfo) => {
      const o = await observe(page, rep)
      testInfo.annotations.push({ type: 'library-observation', description: JSON.stringify(o) })
      expect(judge(rep, o), `${rep.pagePath} 상세 화면 판정`).toEqual([])
    })
  }
})

test.describe('library detail (감지기 자기 검사)', () => {
  const rep = REPS.code
  test(`데이터 404 주입이면 판정이 실패를 낸다: ${rep.id}`, async ({ page }, testInfo) => {
    await page.route(`**${rep.dataPath}`, (route) =>
      route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found (WI-0078 주입)' }),
    )
    const o = await observe(page, rep)
    const problems = judge(rep, o)
    testInfo.annotations.push({ type: 'library-negative', description: JSON.stringify({ o, problems }) })
    // 주입이 실제로 닿았는지(요청이 일어나 404 를 받았는지)와 화면이 오류 상태인지 먼저 본다. 안 닿았으면 이 검사는 측정 실패다
    expect(o.dataStatuses, '주입한 404 가 관측되지 않음 (측정 실패)').toEqual([404])
    expect(o.h1Texts, '오류 화면이 관측되지 않음').toEqual([ERROR_H1])
    expect(problems, '판정 함수가 오류 화면을 실패로 보지 않음').toEqual(
      expect.arrayContaining([
        `데이터 ${rep.dataPath} 응답 404 (기대 200)`,
        `오류 h1 「${ERROR_H1}」 이 보임`,
      ]),
    )
  })
})
