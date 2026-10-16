/**
 * 다크 완전성 가드 fixture 테스트 (WI-0033)
 *
 * scripts/check-token-refs.mjs 의 판정 5(다크 재정의 누락 · 다크 값 미반영)와 판정 6(테마 선언)을
 * test/fixtures/dark-completeness 의 양성 · 음성 fixture로 실행해 종료 코드와 보고 줄을 확인합니다.
 * 양성 fixture가 rc 0이어야 음성 fixture의 rc 1이 해당 판정 때문이라는 것이 갈립니다.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..')
const SCRIPT = join(PKG, '../../scripts/check-token-refs.mjs')
const FIX = join(PKG, 'test/fixtures/dark-completeness')

function run(css, component, tokens = 'tokens') {
  const r = spawnSync(process.execPath, [
    SCRIPT,
    '--css-dir', join(FIX, 'css', css),
    '--src', join(FIX, 'src'),
    '--component-dir', join(FIX, 'component', component),
    '--token-dir', join(FIX, tokens),
  ], { encoding: 'utf-8', env: { ...process.env, GITHUB_ACTIONS: '' } })
  return { rc: r.status, out: `${r.stdout}${r.stderr}` }
}

test('양성 대조군: 이름 집합이 같고 선언이 모두 있으면 rc 0', () => {
  const r = run('valid', 'valid')
  assert.equal(r.rc, 0, r.out)
  assert.match(r.out, /:root 2 · \.dark 2 · :root 전용 0 · \.dark 전용 0 · 다크 값 대상 1 · 미반영 0/)
  assert.match(r.out, /leaf 3 · 색 leaf 2 · 위반 0/)
})

test('음성: 다크 값이 라이트와 달라야 하는 토큰의 .dark 값이 :root 와 같으면 rc 1 (preprocessor 배선 누락)', () => {
  const r = run('dark-unapplied', 'valid')
  assert.equal(r.rc, 1, r.out)
  assert.match(r.out, /다크 값 미반영 .*variables\.css:8 --axis-fixture-bg \(\.dark 값 #FFFFFF 이 :root 와 같음, 기대 다크 #030712\)/)
  assert.match(r.out, /:root 전용 0 · \.dark 전용 0 · 다크 값 대상 1 · 미반영 1/, '이름 집합은 같아서 값 축만 위반입니다')
  assert.match(r.out, /leaf 3 · 색 leaf 2 · 위반 0/)
})

test('음성: .dark 재정의 누락(:root 전용 1)이면 rc 1', () => {
  const r = run('root-only', 'valid')
  assert.equal(r.rc, 1, r.out)
  assert.match(r.out, /다크 재정의 누락 .*variables\.css:4 --axis-fixture-text \(:root 에만 있음\)/)
  assert.match(r.out, /:root 전용 1 · \.dark 전용 0/)
  assert.match(r.out, /정의 누락 0 · primitive 참조 0 · 판정 불가 0/, '다른 판정은 위반이 없어야 rc 1의 원인이 갈립니다')
})

test('음성: .dark 전용 이름이 있으면 rc 1', () => {
  const r = run('dark-only', 'valid')
  assert.equal(r.rc, 1, r.out)
  assert.match(r.out, /다크 재정의 누락 .*--axis-fixture-extra \(\.dark 에만 있음\)/)
  assert.match(r.out, /:root 전용 0 · \.dark 전용 1/)
})

test('음성: transparent leaf에 테마 선언이 없으면 rc 1', () => {
  const r = run('valid', 'undeclared')
  assert.equal(r.rc, 1, r.out)
  assert.match(r.out, /테마 선언 .*components\.json:4 fixture\.border: 색 leaf\("transparent"\)/)
  assert.match(r.out, /:root 전용 0 · \.dark 전용 0/)
  assert.match(r.out, /위반 1/)
})

test('측정 실패: 토큰 소스 디렉터리가 없으면 rc 2', () => {
  const r = run('valid', 'valid', 'no-such-dir')
  assert.equal(r.rc, 2, r.out)
  assert.match(r.out, /토큰 소스 primitives 디렉터리 없음/)
})

test('측정 실패: component 디렉터리가 없으면 rc 2', () => {
  const r = run('valid', 'no-such-dir')
  assert.equal(r.rc, 2, r.out)
  assert.match(r.out, /component 디렉터리 없음/)
})
