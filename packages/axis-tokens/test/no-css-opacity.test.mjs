// @ts-check
/**
 * CSS 미생성 가드 fixture 테스트 (WI-0025 M3 리뷰 f3)
 *
 * scripts/check-token-refs.mjs 의 판정 7(NO_CSS_OPACITY: `bg-[var(--axis-x)]/10` 처럼 Tailwind 3.4가
 * CSS를 만들지 않는 임의값 + 불투명도 수식어)을 test/fixtures/no-css-opacity 의 fixture로 실행해
 * 종료 코드와 보고 줄을 확인합니다. CSS · component · 토큰 소스는 dark-completeness 의 양성 fixture를
 * 그대로 써서 판정 5 · 6 은 위반 0 이 되게 둡니다(rc 1 의 원인이 판정 7 하나로 갈립니다).
 * 양성 대조군(allowed)이 rc 0 이어야 음성 fixture(violating)의 rc 1 이 정규식 때문이라는 것이 갈립니다.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..')
const SCRIPT = join(PKG, '../../scripts/check-token-refs.mjs')
const BASE = join(PKG, 'test/fixtures/dark-completeness')
const FIX = join(PKG, 'test/fixtures/no-css-opacity')

/** @param {string} src */
function run(src) {
  const r = spawnSync(process.execPath, [
    SCRIPT,
    '--css-dir', join(BASE, 'css', 'valid'),
    '--src', join(FIX, src),
    '--component-dir', join(BASE, 'component', 'valid'),
    '--token-dir', join(BASE, 'tokens'),
  ], { encoding: 'utf-8', env: { ...process.env, GITHUB_ACTIONS: '' } })
  return { rc: r.status, out: `${r.stdout}${r.stderr}` }
}

/** @param {string} s */
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

test('양성 대조군: color-mix() · 수식어 없는 임의값 · CSS가 생성되는 임의값은 rc 0', () => {
  const r = run('allowed')
  assert.equal(r.rc, 0, r.out)
  assert.doesNotMatch(r.out, /CSS 미생성 \S*classes\.ts/)
  // 측정이 실제로 수행됐는지: 파일 1개를 읽고 var(--axis-*) 참조 3건(2 · 3 · 4행)을 셌어야 합니다
  // (정의 3 = variables.css 2 + shadcn-compat.css 1)
  assert.match(r.out, /검사 파일 1 · 참조 보유 파일 1 · 참조 3 · 정의 3/)
  assert.match(r.out, /정의 누락 0 · primitive 참조 0 · 판정 불가 0 · CSS 미생성 0/)
})

test('음성: var( · color: 힌트 · -- · color-mix( 접두 임의값에 불투명도 수식어가 붙으면 rc 1 (줄마다 1건)', () => {
  const r = run('violating')
  assert.equal(r.rc, 1, r.out)
  /** @type {Array<[number, string]>} */
  const expected = [
    [2, 'bg-[var(--axis-fixture-bg)]/10'],
    [3, 'border-[var(--axis-fixture-text)]/30'],
    [4, 'hover:border-[color:var(--axis-fixture-text)]/[0.3]'],
    [5, 'bg-[--fixture-raw]/20'],
    [6, 'dark:bg-[color:color-mix(in_srgb,var(--axis-fixture-bg)_10%,transparent)]/50'],
  ]
  for (const [line, cls] of expected) {
    assert.match(r.out, new RegExp(`CSS 미생성 \\S*classes\\.ts:${line} ${escapeRe(cls)} \\(`), `${line}행 ${cls}`)
  }
  assert.match(r.out, /정의 누락 0 · primitive 참조 0 · 판정 불가 0 · CSS 미생성 5 /, '다른 판정은 위반이 없어야 rc 1의 원인이 갈립니다')
  assert.match(r.out, /:root 전용 0 · \.dark 전용 0 · 다크 값 대상 1 · 미반영 0/)
  assert.match(r.out, /leaf 3 · 색 leaf 2 · 위반 0/)
})
