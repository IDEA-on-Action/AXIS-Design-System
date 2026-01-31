/**
 * 템플릿 인덱스 빌드 스크립트
 * templates/ 폴더를 순회하여 public/templates/ 에 인덱스 및 상세 JSON을 생성합니다.
 */
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { join, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const TEMPLATES_DIR = join(__dirname, '..', 'templates')
const OUTPUT_DIR = join(__dirname, '..', 'public', 'templates')

// 파일 타입 매핑
const typeMap = {
  '.tsx': 'tsx',
  '.ts': 'typescript',
  '.css': 'css',
  '.json': 'json',
  '.js': 'javascript',
  '.mjs': 'javascript',
}

async function collectFiles(dir, baseDir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await collectFiles(fullPath, baseDir)
      files.push(...nested)
    } else {
      const content = await readFile(fullPath, 'utf-8')
      const ext = extname(entry.name)
      files.push({
        path: relative(baseDir, fullPath).replace(/\\/g, '/'),
        content,
        type: typeMap[ext] || 'text',
      })
    }
  }

  return files
}

async function build() {
  // 출력 디렉토리 생성
  await mkdir(OUTPUT_DIR, { recursive: true })

  // templates/ 폴더의 모든 디렉토리를 순회
  let entries
  try {
    entries = await readdir(TEMPLATES_DIR, { withFileTypes: true })
  } catch {
    console.log('templates/ 디렉토리가 없습니다. 건너뜁니다.')
    // 빈 인덱스 생성
    const emptyIndex = { version: '1.0.0', updatedAt: new Date().toISOString(), total: 0, templates: [] }
    await writeFile(join(OUTPUT_DIR, 'index.json'), JSON.stringify(emptyIndex, null, 2))
    return
  }

  const templates = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const templateDir = join(TEMPLATES_DIR, entry.name)
    const metaPath = join(templateDir, 'template.json')

    // template.json 존재 확인
    try {
      await stat(metaPath)
    } catch {
      console.warn(`경고: ${entry.name}/template.json 없음, 건너뜁니다.`)
      continue
    }

    // 메타데이터 읽기
    const metaRaw = await readFile(metaPath, 'utf-8')
    const meta = JSON.parse(metaRaw)

    // files/ 디렉토리에서 파일 수집
    const filesDir = join(templateDir, 'files')
    let templateFiles = []
    try {
      templateFiles = await collectFiles(filesDir, filesDir)
    } catch {
      console.warn(`경고: ${entry.name}/files/ 디렉토리 없음`)
    }

    // 상세 JSON 생성
    const detail = {
      ...meta,
      files: templateFiles,
      updatedAt: new Date().toISOString(),
    }
    await writeFile(join(OUTPUT_DIR, `${meta.slug}.json`), JSON.stringify(detail, null, 2))
    console.log(`생성: public/templates/${meta.slug}.json (${templateFiles.length}개 파일)`)

    // 인덱스용 메타데이터 (files 제외)
    templates.push({ ...meta })
  }

  // 인덱스 JSON 생성
  const index = {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    total: templates.length,
    templates,
  }
  await writeFile(join(OUTPUT_DIR, 'index.json'), JSON.stringify(index, null, 2))
  console.log(`생성: public/templates/index.json (${templates.length}개 템플릿)`)
}

build().catch((err) => {
  console.error('빌드 실패:', err)
  process.exit(1)
})
