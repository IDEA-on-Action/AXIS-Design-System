# WI-0071: 움직임 줄이기에서 로딩 · 진행 표시는 느리게 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #190 | 상태: 구현 · 검증 완료(2026-10-25), PR 대기

## 결정 · 분류
- [x] 사용자 결정 기록(로딩 · 진행 표시는 느리게, 열고 닫기 · Accordion 은 정지) (PRD D1 · D2)
- [x] `animate-*` 22곳 전수 분류표: stop 11 · slow 11 (PRD 2.1)
- [x] 느린 주기 값과 근거: spin 3s · bounce 2.5s · pulse 5s · progress-indeterminate 4s (PRD 2.2)

## 구현
- [x] slow 11곳 `motion-reduce:!animate-none` → `motion-reduce:![animation-duration:<값>]` (ui-react progress · skeleton, agentic-ui 9곳)
- [x] Progress · Skeleton 주석을 새 동작으로
- [x] `reduced-motion.test.ts`(두 패키지): 큰따옴표 · 작은따옴표 · 백틱 스캐너, 이름별 stop/slow 규칙 · 배율 2~3, 분류 안 된 이름 실패, 양성 대조 정확 개수
- [x] `progress.test.tsx`: 불확정 reduce 클래스 단언을 새 클래스로
- [x] 문서: ui-react README · quick-start · troubleshooting · 문서 사이트 docs · components/progress

## 테스트
- [x] 단위 테스트 · 변이 2종(작은따옴표 stop 누락 · slow 를 멈춤으로) · 구판 테스트 음성 대조
- [x] Tailwind 3 · 4 소비자 빌드(이 브랜치 pack 결과) + Playwright reduce · no-preference 실측

## 생성물 · 릴리스
- [x] `build:registry`(version 1.5.0 유지, agentic 7항목 sha256) · `library:refresh-axis`(재실행 변경 0) · 템플릿 churn 되돌림
- [x] changeset `.changeset/wi-0071-reduced-motion-slow-loading.md`(ui-react · agentic-ui patch, tokens · theme 소스 변경 없음)
- [x] 게이트: `turbo run type-check lint test build --force`(Cached 0) · frontend.yml run 단계
- [x] PR 생성 · 머지 · 배포(#192 · #193, 2026-10-25, npm ui-react · agentic-ui 1.6.3 provenance, 배포본 클래스 확인)
- [x ] 배포 뒤 발행본(ui-react · agentic-ui) 을 소비자에 설치해 testplan 2절 다시 재기 (2026-10-25 완료: npm 1.6.3 · Tailwind 3.4 · 4.1 소비자, 28항목 testplan 과 일치 · 불일치 0, PlanCard · MessageBubble · StepTimeline 첫 실측)
