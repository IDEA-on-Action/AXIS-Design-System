# WI-0111: TODO

> PRD: [prd.md](./prd.md) | 테스트: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #286 | 상태: 진행 중

## 조사
- [x] 경합 재현 · dist 를 읽는 테스트 전수 · CI 경로 · 시간 한도, 설계 · 반박(조사 워크플로, 2026-11-02)
- [x] 사용자 결정 D1 ~ D5 (prd 2절)

## 구현
- [ ] 패키지별 turbo.json 3개 (FR-1)
- [ ] ui-react build 끝 fix-cva-dts 검사 (FR-2)
- [ ] 후속 후보 등록 (FR-4)

## 검증
- [ ] 사본 음성 · 양성 대조 (AC1 · AC2)
- [ ] dry-run 의존 그래프 (AC3)
- [ ] build 끝 검사 양성 · 음성 (AC4)
- [ ] 레포 turbo 게이트, PR CI 시간 · 캐시 비교 (AC5)

## 릴리스
- [ ] testplan.md · release-notes.md (FR-3)
- [ ] PR 리뷰 · 머지(발행 없음)
- [ ] 머지 뒤 Issue #286 닫기 · project-todo 현행화
