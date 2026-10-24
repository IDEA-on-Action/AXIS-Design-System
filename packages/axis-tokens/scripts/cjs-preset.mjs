// @ts-check
/**
 * Tailwind preset CommonJS 진입점 후처리 (WI-0072)
 *
 * tsup 의 cjs 산출물은 `export default` 를 `module.exports.default` 로 감싼다. 그래서 1.1.0 부터
 * `module.exports = { presets: [require("@axis-ds/tokens/tailwind")] }` 같은 CommonJS 설정(.cjs, type 이 없는 .js,
 * .ts 안의 module.exports)은 `{ default, axisKeyframes, axisAnimation }` 를 preset 으로 받아 색 · keyframes 가
 * 통째로 빠졌다. 이 스크립트는 tsup 이 만든 dist/tailwind-preset.js 끝에서 module.exports 를 preset 객체 자체로 바꾸고,
 * default · axisKeyframes · axisAnimation 은 열거되지 않는 속성으로 붙인다.
 * - `require(...).default` 를 쓰는 기존 구성은 그대로 동작한다(default 가 자기 자신).
 * - `...preset` 으로 펼쳐도 붙인 속성이 섞이지 않는다(non-enumerable).
 * - ESM(import 조건)은 .mjs 를 그대로 쓰므로 영향이 없다.
 *
 * 타입: require 조건용 dist/tailwind-preset.d.cts 를 `export =` 형식으로 쓴다(런타임과 같은 모양).
 *
 * 사용: node scripts/cjs-preset.mjs [dist 디렉터리] (기본: 패키지의 dist)
 * 종료 코드: 0 정상(이미 처리된 파일이면 건너뜀), 1 대상 파일이 없거나 tsup 산출물 모양이 예상과 다름
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..')

/** 후처리 표지(중복 실행 방지) */
export const CJS_MARKER = '// @axis-ds/tokens WI-0072: CommonJS 진입점이 preset 자체를 내보냄'

/** dist/tailwind-preset.js 끝에 붙이는 코드 */
export const CJS_FOOTER = `${CJS_MARKER}
var __axisCjs = module.exports;
var __axisPreset = __axisCjs.default;
Object.defineProperty(__axisPreset, "default", { value: __axisPreset, enumerable: false });
Object.defineProperty(__axisPreset, "axisKeyframes", { value: __axisCjs.axisKeyframes, enumerable: false });
Object.defineProperty(__axisPreset, "axisAnimation", { value: __axisCjs.axisAnimation, enumerable: false });
module.exports = __axisPreset;
`

/** require 조건용 타입(export = 형식) */
export const CJS_DTS = `import type { Config } from 'tailwindcss'
import type { axisAnimation as AxisAnimation, axisKeyframes as AxisKeyframes } from './tailwind-preset.js'

/**
 * CommonJS 로 받은 AXIS Tailwind preset (WI-0072)
 * require("@axis-ds/tokens/tailwind") 결과가 preset 객체 자체이고, default · axisKeyframes · axisAnimation 도 속성으로 읽을 수 있다.
 */
type AxisTailwindPreset = Partial<Config> & {
  readonly default: AxisTailwindPreset
  readonly axisKeyframes: typeof AxisKeyframes
  readonly axisAnimation: typeof AxisAnimation
}

declare const axisPreset: AxisTailwindPreset
export = axisPreset
`

/**
 * dist 디렉터리의 CommonJS preset 을 후처리한다
 * @param {string} distDir
 * @returns {{ patched: boolean }}
 */
export function patchCjsPreset(distDir) {
  const jsPath = join(distDir, 'tailwind-preset.js')
  if (!existsSync(jsPath)) throw new Error(`${jsPath} 가 없습니다(tsup 을 먼저 실행하세요)`)
  const src = readFileSync(jsPath, 'utf-8')
  let patched = false
  if (!src.includes(CJS_MARKER)) {
    if (!src.includes('module.exports = __toCommonJS(')) {
      throw new Error(`${jsPath} 가 예상한 tsup cjs 산출물 모양이 아닙니다(module.exports = __toCommonJS 없음)`)
    }
    writeFileSync(jsPath, `${src.replace(/\n*$/, '\n')}${CJS_FOOTER}`)
    patched = true
  }
  writeFileSync(join(distDir, 'tailwind-preset.d.cts'), CJS_DTS)
  return { patched }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const distDir = resolve(process.argv[2] ?? join(PKG, 'dist'))
  try {
    const { patched } = patchCjsPreset(distDir)
    console.log(patched ? `CJS preset 후처리 완료: ${distDir}` : `이미 처리됨: ${distDir}`)
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}
