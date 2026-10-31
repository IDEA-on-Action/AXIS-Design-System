# WI-0106: a11y 게이트 템플릿 상세 경로 확대 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #270 | 상태: 🔄 구현 · 검증 완료, PR 리뷰 대기

## 결정
- [x] 사용자 결정 D1(상세 JSON 이 있는 템플릿 전부) · D2(name 기반 준비 선택자) · D3(결과 앱 UI 범위 밖) 기록 (PRD 1.2) (2026-11-01)

## 구현
- [x] `apps/web/e2e/a11y-routes.cjs`: `templateDetailRoutes` · `templateDetailReady` · `TEMPLATE_DETAIL_REQUIRED`, DYNAMIC 배열 반환 지원, 머리 주석 (AC1 · AC2 · AC3)
- [x] `apps/web/e2e/a11y.spec.ts` 머리 주석(경로 범위 · 준비 선택자)
- [x] `.github/workflows/frontend.yml` 193행 · 246행 주석(63경로 x 4 = 252). 가드 로직 무변경
- [x] WI-0027 todo 후속 체크박스 a11y 부분 완료 · release-notes 한계 줄 해소 메모

## 테스트
- [x] `--count` 수정 전 59 · 수정 뒤 63, 경로 목록 diff 는 templates 4줄 추가뿐 (AC1)
- [x] 준비 선택자 5개 확인 (AC2)
- [x] 설정 단계 throw 4종 · 무변경 대조군 (AC3)
- [x] 정적 빌드 E2E a11y 전체 252 통과, 조합마다 63 (AC4)
- [x] 음성 대조 ① axe 위반 주입 4조합 실패 · 원복 4조합 통과 (AC5)
- [x] 음성 대조 ② 상세 JSON 없는 slug 4조합 준비 선택자 실패 · 종전 `h1` 대조 (AC6)
- [x] `pnpm check-library-links` rc 0, `@ax/web` type-check · lint `--force` Cached 0 통과 (AC7)

## 릴리스
- [x] changeset 없음 확인(`@ax/web` private, 발행 패키지 소스 변경 0)
- [x] release-notes.md
- [ ] PR 리뷰 · 머지 · Pages 배포 · CI 건수 가드 252 확인(Master)
- [ ] 머지 뒤 현행화: project-todo · wi-mapping · CLAUDE.md (Master)
