// @ts-check
/**
 * JS 타입 검사 opt-in 현황 가드 (WI-0034)
 *
 * tsconfig.typecheck.json 은 checkJs 를 끄고, 파일 맨 앞 주석에 `// @ts-check` 가 있는 JS 파일만 검사합니다.
 * 그래서 type-check 의 오류 0건만으로는 "검사해서 0건"인지 "검사하지 않아서 0건"인지 구분되지 않습니다.
 * 이 스크립트는 tsc 가 실제로 읽는 파일 목록(같은 tsconfig 를 TypeScript API 로 해석)에서
 * JS 파일 수와 `@ts-check` 가 없는 파일 수를 출력합니다.
 *
 * 종료 코드
 *   0: 정상 측정(미적용 파일이 있어도 0입니다. 정보 출력이며 CI 를 막지 않습니다)
 *   2: 측정 실패(tsconfig 를 읽지 못함, 대상 JS 파일 0개)
 *
 * 사용: node scripts/check-ts-optin.mjs [--project <tsconfig 경로>]
 */
import { readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..')
const JS_RE = /\.(?:mjs|cjs|js)$/

const argIndex = process.argv.indexOf('--project')
const project = argIndex >= 0 ? process.argv[argIndex + 1] : join(PKG, 'tsconfig.typecheck.json')

/**
 * 파일 맨 앞(shebang 과 빈 줄 · 주석만 있는 구간)에 `// @ts-check` 가 있는지 봅니다.
 * TypeScript 와 같은 위치 규칙입니다. `@ts-nocheck` 가 함께 있으면 적용되지 않은 것으로 봅니다.
 *
 * @param {string} source
 * @returns {boolean}
 */
function hasTsCheck(source) {
  const body = source.replace(/^#![^\n]*\n/, '')
  const head = /^(?:\s|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*/.exec(body)?.[0] ?? ''
  if (/@ts-nocheck\b/.test(head)) return false
  return /\/\/\s*@ts-check\b/.test(head)
}

/** @param {string} message */
function fail(message) {
  console.error(`ts opt-in 측정 실패: ${message}`)
  process.exit(2)
}

const config = ts.getParsedCommandLineOfConfigFile(project, {}, {
  ...ts.sys,
  onUnRecoverableConfigFileDiagnostic: (d) => fail(ts.flattenDiagnosticMessageText(d.messageText, '\n')),
})
if (!config) fail(`${project} 를 읽지 못했습니다`)
else {
  const jsFiles = config.fileNames.filter((f) => JS_RE.test(f)).sort()
  if (jsFiles.length === 0) fail(`${relative(PKG, project)} 의 대상에 JS 파일이 없습니다`)
  const missing = jsFiles.filter((f) => !hasTsCheck(readFileSync(f, 'utf-8')))
  console.log(
    `ts opt-in: 대상 ${config.fileNames.length}개 중 JS ${jsFiles.length}개 · @ts-check ${jsFiles.length - missing.length}개 · 미적용 ${missing.length}개`,
  )
  for (const f of missing) console.log(`  미적용: ${relative(PKG, f)}`)
}
