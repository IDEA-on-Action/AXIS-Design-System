# WI-0023: 다크 모드 a11y E2E TODO

> PRD: [prd.md](./prd.md) | 상태: ✅ 완료

## Phase 1: 다크 파라미터화 ✅
- [x] a11y.spec.ts THEMES=[light,dark] × 9페이지 = 18 테스트
- [x] colorScheme 에뮬레이션 + html.dark 검증

## Phase 2: 다크 위반 수정 ✅
- [x] shiki dual-theme 다크 구문색 미전환 발견 (대비 1.06~2.18, 85건)
- [x] globals.css `.dark .shiki` color/bg dark 변수 적용

## Phase 3: 검증 ✅
- [x] 18 테스트(라이트9+다크9) 위반 0
- [x] build/typecheck/lint 회귀 0

## DoD
- [x] release-notes.md
