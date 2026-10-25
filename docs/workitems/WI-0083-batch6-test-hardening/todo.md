# WI-0083: library 대표 선택 · TW3 preset dist 진입점 테스트 보강 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #212 | 상태: 🔄 구현 · 게이트 완료, PR 대기(브랜치 `test/wi-0083`, push · PR 전)

## 결정 · 조사
- [x] 사용자 결정 D1-A · D2-A · D3-A 변형 · D4-A · D5-A · changeset 없음 기록 (PRD 1.3)
- [x] 착수 전 실측: library-reps.cjs · a11y-routes.cjs 읽기 경로, component-detail-content.tsx 가 읽는 code 필드(216 · 217 · 234 · 238 · 243행), Playwright testDir(`./e2e`, 기본 testMatch), cjs-preset.test.mjs makeConsumer(91-116행) · build 스크립트
- [x] 수정 전 음성 대조: 비대표 결손 ENOENT · 앞 항목 code 결손 TypeError · code=renamed 통과 · code 모양 깨짐 rc 0 · 읽기 258/129 재현 (PRD 1.2)

## 구현
- [x] `apps/web/e2e/library-reps.cjs`: publicDir 인자, index 속성 후보, 같은 항목 금지, 대표 3개만 읽기 (AC1 ~ AC5)
- [x] `apps/web/e2e/a11y-routes.cjs`: libraryCodeRep 메모이즈 (AC1)
- [x] `apps/web/e2e/library-detail.spec.ts`: 주석 · 형 선언 (동작 불변)
- [x] `scripts/check-library-links.mjs`: 판정 7 code 모양 (D2)
- [x] `scripts/library-reps.test.mjs` · `scripts/check-library-links.test.mjs` + 루트 `check-library-links` 연결 (D3)
- [x] `.github/workflows/frontend.yml`: 주석 2곳(단계 · 기대값 불변)
- [x] `packages/axis-tokens/test/cjs-preset.test.mjs`: build 스크립트에서 tsup 인자 · 후처리 읽기, dist 세 진입점 테스트 (AC6 · AC7)
- [x] `packages/axis-tokens/test/tw3-border-default.test.mjs`: 주석

## 테스트
- [x] 새 테스트를 수정 전 소스에 태워 실패 확인(library 20/28 실패), 변이 M-a ~ M-e 각각 실패 (AC1 ~ AC4)
- [x] tokens 변이 M1 · M2 · M3 · M4(빌드 파이프라인 쪽)에서 기대한 단언만 실패, 수정 전 테스트는 M1 · M2 를 못 잡음 (AC6 · AC7)
- [x] turbo lint · type-check · build · test 각각 `--force` Cached 0 (AC9)
- [x] frontend.yml run 단계 전체 (testplan 4절)
- [x] E2E library 4 · a11y 236 `E2E_SERVER=static` workers 1 (AC5)
- [x] dist/css sha256 불변 · tailwind4.test 통과 · 브라우저 1회 기록 (AC8)

## 마무리
- [ ] PR 생성 · CI 통과 · 머지 (push · PR 은 이 작업 범위 밖)
- [ ] 머지 뒤 project-todo ✅ · wi-mapping lastStatus ✅ · `gh issue close 212`
