# WI-0072: Tailwind 3 CommonJS preset TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #191 | 상태: 구현 · 검증 완료(2026-10-25), PR 대기

## 결정
- [x] 결함 범위를 CommonJS 형태(`module.exports` · `.cjs`)로 좁혀 기록, 1.1.0 부터의 결함(회귀 아님) (PRD 1.1)
- [x] CJS 진입점 · non-enumerable 속성 · d.cts/d.mts · 안내 `.default` · check 조건 · bump 근거 · tokens 하한 유지 (PRD D1~D8)

## 구현
- [x] `packages/axis-tokens/scripts/cjs-preset.mjs`(후처리, 표지 · 모양 검증) + build 스크립트 연결
- [x] tokens `package.json` exports `./tailwind`: require(d.cts · js) · import(d.mts · mjs) · types(d.ts)
- [x] `scripts/types-resolution-gate.mjs` 조건별 기대 파일, `scripts/pack-install-smoke.mjs` 중첩 조건 · `require-preset`
- [x] registry-core `tailwind-core.ts`: CommonJS bare require + `packageVersionGate`(설치본 → 선언 하한)
- [x] cli `theme/index.ts` preset 안내 `.default`
- [x] 문서: tokens README · quick-start · theme-customization 4절 · cli README

## 테스트
- [x] `test/cjs-preset.test.mjs`(10형태 · 음성 대조 · 모양 · ESM · 재실행 · tsc 타입)
- [x] cli · mcp check 테스트, theme-add 문구 테스트
- [x] 배포 경로: pack tarball loadConfig 10형태(npm 1.6.2 대조), pack-smoke 음성 대조, check · theme add

## 릴리스
- [x] changeset(묶음 ① 공통 `.changeset/wi-0051-0068-0070-0072-check-brand-cjs.md`, tokens patch)
- [x] PR · 머지 · Release PR 버전 1.7.0 대조 · 발행 (2026-10-25 #196 머지, Release #197 1.7.0 대조, npm 1.7.0 · cli 1.6.1 · mcp 1.3.4, run 40137182470, provenance 6/6)
- [x] 발행본 1.7.0 으로 testplan 2.1 다시 재기 (2026-10-25 완료: CJS · .cjs · .js · .ts 등 10형태 loadConfig · 빌드 CSS 일치, 1.6.2 음성 대조로 결함 재현)
