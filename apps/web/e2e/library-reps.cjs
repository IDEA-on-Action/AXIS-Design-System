'use strict'
/**
 * library 상세 화면 대표 항목 (WI-0078 D3-A).
 *
 * 상세 화면(/library/<category>/<slug>/)은 정적 HTML 에 내용이 없고, 클라이언트가 런타임에
 * `/library/components/<id>.json` 을 받아 그린다. 대표 항목을 slug 하드코딩 대신 index.json 에서 규칙으로 고른다.
 * 데이터가 바뀌어 규칙에 맞는 항목이 없으면 조용히 빼지 않고 멈춘다(0건 측정이 통과로 읽히지 않게).
 *
 * - code: 상세 JSON 에 코드 파일이 있는 첫 항목(지금은 AXIS). 코드 탭에 파일이 그려지는 경우.
 * - renamed: slug 가 `<source>-` 로 시작하는 첫 항목(WI-0060 에서 주소가 바뀐 외부 항목, 지금은 shadcn-<slug>).
 *   설치 명령은 slug 가 아니라 원본 이름(id 에서 `<source>-` 를 뗀 값)을 써야 한다.
 * - existing: 코드가 없고 slug 가 바뀌지 않은 항목 가운데 앞의 둘과 source 가 다른 첫 항목(지금은 monet).
 *   설치 명령 접두가 셋 다 달라지도록 source 를 나눈다.
 *
 * a11y-routes.cjs 의 library 상세 대표 경로도 여기 code 를 쓴다(두 검사가 같은 항목을 본다).
 */
const fs = require('node:fs')
const path = require('node:path')

const PUBLIC_DIR = path.join(__dirname, '..', 'public')

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, rel), 'utf-8'))
}

/** 상세 JSON 경로(사이트 주소). component-detail-content.tsx 가 fetch 하는 주소와 같아야 한다 */
function detailDataPath(id) {
  return `/library/components/${id}.json`
}

function readDetail(id) {
  return readJson(`library/components/${id}.json`)
}

function isRenamed(entry) {
  return entry.slug.startsWith(`${entry.source}-`)
}

/**
 * @returns {{ code: object, renamed: object, existing: object }} 각 값은 index 항목 + detail(상세 JSON) + pagePath + dataPath
 */
function pickLibraryReps() {
  const index = readJson('library/index.json')
  const list = index.components
  if (!Array.isArray(list) || list.length === 0) throw new Error('library/index.json 에 components 가 없어요 (대표를 정할 수 없음)')
  const withDetail = (entry) => {
    const detail = readDetail(entry.id)
    return { ...entry, detail, pagePath: `/library/${entry.category}/${entry.slug}/`, dataPath: detailDataPath(entry.id) }
  }
  const all = list.map(withDetail)
  const code = all.find((e) => e.detail.code.files.length > 0)
  if (!code) throw new Error('library: 코드 파일이 있는 항목이 없어요 (대표 code 를 정할 수 없음)')
  const renamed = all.find((e) => isRenamed(e))
  if (!renamed) throw new Error('library: slug 가 `<source>-` 로 시작하는 항목이 없어요 (대표 renamed 를 정할 수 없음)')
  const existing = all.find(
    (e) => e.detail.code.files.length === 0 && !isRenamed(e) && e.source !== code.source && e.source !== renamed.source,
  )
  if (!existing) throw new Error('library: 코드 없고 slug 가 그대로이며 source 가 다른 항목이 없어요 (대표 existing 을 정할 수 없음)')
  return { code, renamed, existing }
}

module.exports = { pickLibraryReps, detailDataPath, isRenamed }

if (require.main === module) {
  const reps = pickLibraryReps()
  for (const [kind, r] of Object.entries(reps)) {
    process.stdout.write(`${kind}\t${r.id}\t${r.pagePath}\tfiles=${r.detail.code.files.length}\n`)
  }
}
