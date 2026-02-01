/**
 * 라이선스 호환성 검증 스크립트
 * data/*.json 내 외부 블록의 소스별 라이선스 호환성을 검증합니다.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const EXTERNAL_DATA_DIR = join(__dirname, '..', 'apps', 'web', 'data')

// MIT 프로젝트와의 라이선스 호환성 매트릭스
const LICENSE_MATRIX = {
  // 호환 라이선스
  'MIT': { compatible: true, level: 'ok' },
  'Apache-2.0': { compatible: true, level: 'ok' },
  'BSD-2-Clause': { compatible: true, level: 'ok' },
  'BSD-3-Clause': { compatible: true, level: 'ok' },
  'ISC': { compatible: true, level: 'ok' },
  'CC0-1.0': { compatible: true, level: 'ok' },
  'Unlicense': { compatible: true, level: 'ok' },
  // 비호환 라이선스
  'GPL-2.0': { compatible: false, level: 'warn' },
  'GPL-3.0': { compatible: false, level: 'warn' },
  'LGPL-2.1': { compatible: false, level: 'warn' },
  'LGPL-3.0': { compatible: false, level: 'warn' },
  'AGPL-3.0': { compatible: false, level: 'block' },
  'SSPL-1.0': { compatible: false, level: 'block' },
}

// 알려진 외부 소스의 라이선스 정보
const KNOWN_SOURCE_LICENSES = {
  'shadcn': { license: 'MIT', url: 'https://github.com/shadcn-ui/ui' },
  'monet': { license: 'MIT', url: 'https://www.monet.design/' },
  'axis': { license: 'MIT', url: '' },
}

async function loadExternalBlocks() {
  const blocks = []
  try {
    const entries = await readdir(EXTERNAL_DATA_DIR, { withFileTypes: true })
    const jsonFiles = entries.filter((e) => e.isFile() && e.name.endsWith('.json'))

    for (const file of jsonFiles) {
      const filePath = join(EXTERNAL_DATA_DIR, file.name)
      const raw = await readFile(filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        blocks.push(...parsed.map((b) => ({ ...b, _file: file.name })))
      }
    }
  } catch {
    console.log('data/ 디렉토리를 찾을 수 없습니다.')
  }
  return blocks
}

async function checkLicenses() {
  console.log('=== 라이선스 호환성 검증 ===\n')

  const blocks = await loadExternalBlocks()
  if (blocks.length === 0) {
    console.log('검증할 외부 블록이 없습니다.')
    return
  }

  // 소스별 그룹화
  const sourceGroups = new Map()
  for (const block of blocks) {
    const source = block.source || 'unknown'
    if (!sourceGroups.has(source)) {
      sourceGroups.set(source, [])
    }
    sourceGroups.get(source).push(block)
  }

  let hasError = false
  let hasWarning = false

  for (const [source, items] of sourceGroups) {
    const known = KNOWN_SOURCE_LICENSES[source]

    if (!known) {
      console.log(`[WARN] 소스 "${source}": 라이선스 정보 미등록 (${items.length}개 블록)`)
      console.log(`       → KNOWN_SOURCE_LICENSES에 라이선스 정보를 추가하세요.\n`)
      hasWarning = true
      continue
    }

    const licenseInfo = LICENSE_MATRIX[known.license]

    if (!licenseInfo) {
      console.log(`[WARN] 소스 "${source}": 라이선스 "${known.license}"가 매트릭스에 없음`)
      hasWarning = true
      continue
    }

    if (licenseInfo.level === 'block') {
      console.log(`[BLOCK] 소스 "${source}": ${known.license} — MIT 비호환 (${items.length}개 블록 차단)`)
      hasError = true
    } else if (licenseInfo.level === 'warn') {
      console.log(`[WARN] 소스 "${source}": ${known.license} — MIT와 호환성 주의 (${items.length}개 블록)`)
      hasWarning = true
    } else {
      console.log(`[OK] 소스 "${source}": ${known.license} — MIT 호환 (${items.length}개 블록)`)
    }
  }

  console.log(`\n총 ${blocks.length}개 외부 블록, ${sourceGroups.size}개 소스 검증 완료`)

  if (hasError) {
    console.error('\n비호환 라이선스가 발견되었습니다. 해당 소스를 제거하거나 라이선스를 확인하세요.')
    process.exit(1)
  }

  if (hasWarning) {
    console.warn('\n경고가 있습니다. 라이선스 정보를 확인하세요.')
  }

  console.log('\n라이선스 검증 통과')
}

checkLicenses().catch((err) => {
  console.error('라이선스 검증 실패:', err)
  process.exit(1)
})
