// Claude Code 훅 입력(stdin JSON)을 읽어 훅을 실행할지 판정한다.
// jq 대신 Node 를 쓰는 이유: jq 는 Git for Windows 에 기본 포함되지 않아, 없으면 훅이
// 오류 없이 건너뛰어진다. Node 는 이 프로젝트의 필수 런타임이다.
//
// 사용: node .claude/hooks/hook-filter.mjs <commit|tsx|registry>
// 종료코드:
//   0 = 조건 일치 (tsx 모드는 대상 패키지 이름을 stdout 으로 낸다)
//   1 = 조건 불일치 (훅을 건너뛴다)
//   2 = 판정 실패 (입력 파싱 실패·패키지 이름 판독 실패 - 호출 측이 경고로 보고한다)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const MATCH = 0
const SKIP = 1
const FAIL = 2

const mode = process.argv[2]

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}')
} catch (error) {
  process.stderr.write(`hook-filter: 입력 JSON 파싱 실패 (${error.message})\n`)
  process.exit(FAIL)
}

const toolInput = input.tool_input ?? {}

if (mode === 'commit') {
  const command = String(toolInput.command ?? '')
  process.exit(/(^|[;&|\s])git\s+commit\b/.test(command) ? MATCH : SKIP)
}

// Windows 경로(`C:\...\packages\...`)도 같은 조건으로 판정하도록 구분자를 `/` 로 맞춘다
const filePath = String(toolInput.file_path ?? '').replace(/\\/g, '/')

if (mode === 'tsx') {
  const matched = filePath.match(/\/packages\/(axis-[^/]+)\/src\/.+\.tsx$/)
  if (!matched) process.exit(SKIP)
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd()
  try {
    const pkg = JSON.parse(readFileSync(join(projectDir, 'packages', matched[1], 'package.json'), 'utf8'))
    if (!pkg.name) throw new Error('name 필드 없음')
    process.stdout.write(pkg.name)
    process.exit(MATCH)
  } catch (error) {
    process.stderr.write(`hook-filter: packages/${matched[1]} 패키지 이름 판독 실패 (${error.message})\n`)
    process.exit(FAIL)
  }
}

if (mode === 'registry') {
  process.exit(/\/packages\/[^/]+\/registry\/registry\.json$/.test(filePath) ? MATCH : SKIP)
}

process.stderr.write(`hook-filter: 알 수 없는 모드 '${mode}'\n`)
process.exit(FAIL)
