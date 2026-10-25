'use strict'
/**
 * library 상세 화면 대표 항목 (WI-0078 D3-A, WI-0083 D1-A).
 *
 * 상세 화면(/library/<category>/<slug>/)은 정적 HTML 에 내용이 없고, 클라이언트가 런타임에
 * `/library/components/<id>.json` 을 받아 그린다. 대표 항목을 slug 하드코딩 대신 index.json 에서 규칙으로 고른다.
 * 데이터가 바뀌어 규칙에 맞는 항목이 없으면 조용히 빼지 않고 멈춘다(0건 측정이 통과로 읽히지 않게).
 *
 * 후보는 index.json 속성(source · slug)만으로 먼저 정하고, 상세 JSON 은 고른 대표 3개만 읽는다(WI-0083).
 * 대표와 무관한 항목의 파일 결손 · code 모양은 여기서 보지 않는다. 그 판정은 scripts/check-library-links.mjs(4 · 7)가 맡는다.
 *
 * - code: source 가 `axis` 인 첫 항목. 상세 JSON 에 코드 파일이 1개 이상 있어야 한다(없으면 멈춤).
 *   코드 탭에 파일이 그려지는 경우. 2026-10-26 데이터에서 코드가 있는 항목은 axis 48개뿐이다.
 * - renamed: slug 가 `<source>-` 로 시작하는 첫 항목(WI-0060 에서 주소가 바뀐 외부 항목, 지금은 shadcn-<slug>).
 *   설치 명령은 slug 가 아니라 원본 이름(id 에서 `<source>-` 를 뗀 값)을 써야 한다.
 * - existing: slug 가 바뀌지 않은 항목 가운데 앞의 둘과 source 가 다른 첫 항목(지금은 monet).
 *   상세 JSON 에 코드 파일이 없어야 한다(있으면 멈춤). 설치 명령 접두가 셋 다 달라지도록 source 를 나눈다.
 * - 세 대표는 서로 다른 항목(id · 상세 주소)이어야 한다. 같은 항목이면 두 검사가 한 화면만 보게 되므로 멈춘다.
 *
 * a11y-routes.cjs 의 library 상세 대표 경로도 여기 code 를 쓴다(두 검사가 같은 항목을 본다).
 * 단위 테스트: scripts/library-reps.test.mjs (`pnpm check-library-links` 가 함께 돌린다).
 */
const fs = require('node:fs')
const path = require('node:path')

const PUBLIC_DIR = path.join(__dirname, '..', 'public')

/** code 대표를 고르는 source (코드 파일을 가진 항목의 source) */
const CODE_SOURCE = 'axis'

/** 상세 JSON 경로(사이트 주소). component-detail-content.tsx 가 fetch 하는 주소와 같아야 한다 */
function detailDataPath(id) {
  return `/library/components/${id}.json`
}

function isRenamed(entry) {
  return entry.slug.startsWith(`${entry.source}-`)
}

/**
 * @param {string} [publicDir] apps/web/public 에 해당하는 디렉터리(기본: 이 파일 기준 ../public). 테스트가 사본을 넘긴다
 * @returns {{ code: object, renamed: object, existing: object }} 각 값은 index 항목 + detail(상세 JSON) + pagePath + dataPath
 */
function pickLibraryReps(publicDir = PUBLIC_DIR) {
  const index = JSON.parse(fs.readFileSync(path.join(publicDir, 'library', 'index.json'), 'utf-8'))
  const list = index.components
  if (!Array.isArray(list) || list.length === 0) throw new Error('library/index.json 에 components 가 없어요 (대표를 정할 수 없음)')

  // 1. 후보: index.json 속성만으로 고른다(상세 JSON 을 읽지 않음)
  const codeEntry = list.find((e) => e.source === CODE_SOURCE)
  if (!codeEntry) throw new Error(`library: source 가 ${CODE_SOURCE} 인 항목이 없어요 (대표 code 를 정할 수 없음)`)
  const renamedEntry = list.find((e) => isRenamed(e))
  if (!renamedEntry) throw new Error('library: slug 가 `<source>-` 로 시작하는 항목이 없어요 (대표 renamed 를 정할 수 없음)')
  const existingEntry = list.find(
    (e) => !isRenamed(e) && e.source !== codeEntry.source && e.source !== renamedEntry.source,
  )
  if (!existingEntry) throw new Error('library: slug 가 그대로이며 source 가 다른 항목이 없어요 (대표 existing 을 정할 수 없음)')

  // 2. 같은 항목 금지
  const entries = { code: codeEntry, renamed: renamedEntry, existing: existingEntry }
  const pageOf = (e) => `/library/${e.category}/${e.slug}/`
  const kinds = Object.keys(entries)
  for (let i = 0; i < kinds.length; i++) {
    for (let j = i + 1; j < kinds.length; j++) {
      const a = entries[kinds[i]]
      const b = entries[kinds[j]]
      if (a.id === b.id || pageOf(a) === pageOf(b)) {
        throw new Error(`library: 대표 ${kinds[i]} 와 ${kinds[j]} 가 같은 항목이에요 (${a.id} · ${pageOf(a)}). 대표 규칙이나 데이터를 확인하세요`)
      }
    }
  }

  // 3. 대표 3개만 상세 JSON 을 읽고, 대표 자신의 결손은 종류 · id 를 담아 멈춘다
  const withDetail = (kind, entry) => {
    const dataPath = detailDataPath(entry.id)
    let detail
    try {
      detail = JSON.parse(fs.readFileSync(path.join(publicDir, 'library', 'components', `${entry.id}.json`), 'utf-8'))
    } catch (err) {
      throw new Error(`library: 대표 ${kind} ${entry.id} 의 상세 JSON(${dataPath})을 읽지 못했어요: ${err.message}`)
    }
    if (!detail || typeof detail !== 'object' || !detail.code || !Array.isArray(detail.code.files)) {
      throw new Error(`library: 대표 ${kind} ${entry.id} 의 상세 JSON(${dataPath})에 code.files 배열이 없어요`)
    }
    return { ...entry, detail, pagePath: pageOf(entry), dataPath }
  }
  const code = withDetail('code', codeEntry)
  if (code.detail.code.files.length === 0) {
    throw new Error(`library: 대표 code ${code.id} 의 상세 JSON(${code.dataPath})에 코드 파일이 없어요 (source ${CODE_SOURCE} 첫 항목이어야 함)`)
  }
  const renamed = withDetail('renamed', renamedEntry)
  const existing = withDetail('existing', existingEntry)
  if (existing.detail.code.files.length !== 0) {
    throw new Error(`library: 대표 existing ${existing.id} 의 상세 JSON(${existing.dataPath})에 코드 파일이 있어요 (코드 없는 항목이어야 함)`)
  }
  return { code, renamed, existing }
}

module.exports = { pickLibraryReps, detailDataPath, isRenamed, CODE_SOURCE }

if (require.main === module) {
  const reps = pickLibraryReps()
  for (const [kind, r] of Object.entries(reps)) {
    process.stdout.write(`${kind}\t${r.id}\t${r.pagePath}\tfiles=${r.detail.code.files.length}\n`)
  }
}
