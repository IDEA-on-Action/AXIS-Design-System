# WI-0078: library 상세 화면 E2E 스모크 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #206 | 상태: 구현 · 로컬 검증 완료(2026-10-25), 배치 6 PR 대기

## 결정 · 조사
- [x] 사용자 결정 D1-C · D2-B(READY 는 C) · D3-A · D4-A 기록 (PRD 1.3)
- [x] 착수 전 실측: 상세 화면 런타임 fetch · 오류 h1 · a11y READY 기본 h1 · playwright testDir/필터 확인
- [x] 수정 전 음성 대조: 데이터 파일 누락 사본에서 기존 a11y 4 통과(거짓 초록) 재현 (AC2)

## 구현
- [x] `apps/web/e2e/library-reps.cjs`: 대표 3종 규칙 선택 · 못 고르면 throw (AC1)
- [x] `apps/web/e2e/library-detail.spec.ts`: 양성 3 + 404 주입 자기 검사 1 (AC1 · AC4)
- [x] `apps/web/e2e/a11y-routes.cjs`: library 상세 대표 공유 · READY `h2:text-is("설치")` (AC6)
- [x] `apps/web/package.json` `test:e2e:library`
- [x] `.github/workflows/frontend.yml`: step · 건수 가드 `library:4` · describe 별 3 · 1 · 업로드 if (AC5)

## 테스트
- [x] 정상 out/ 4 통과, 파일 누락 사본 1 실패, fetch 경로 변이 사본 3 실패 (AC1 ~ AC3)
- [x] READY 변경 뒤 파일 누락 사본에서 a11y library 상세 4 실패, 정상 out/ 에서 a11y 236 (AC6)
- [x] 건수 가드 로컬 재현(정상 rc 0 · 기대 건수 변이 · skip 변이 rc 1) (AC5)
- [x] 게이트: turbo lint · type-check · build · test 각각 `--force`, frontend.yml run 단계 (AC7)
- [ ] PR CI run 에서 library 4 · a11y 236 확인 (PR 은 배치 6 묶음에서)

## 생성물 · 릴리스
- [x] build:registry 뒤 r/ version 되돌림, templates updatedAt churn 되돌림
- [x] changeset 없음(private 앱 · CI 만)
