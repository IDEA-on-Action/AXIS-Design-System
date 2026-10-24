# WI-0066: 문서 사이트 `/components` mock 페이지를 실제 컴포넌트로 TODO

> PRD: [prd.md](./prd.md) | GitHub: #180

## 1단계 실측 · 결정
- [x] 배치 3 브리프 실측(4페이지 mock, 교체 스크래치 tsc 0 · build rc 0 · axe 위반 0)
- [x] 반박 검토 ③ 지적 반영(착수 기준을 현재 main 778e1dd 로, Skeleton reduce 기대값은 5초 느린 펄스)
- [x] 사용자 결정 반영(D1~D4 권장안, 2026-10-25), PRD v1.0

## FR-1 4페이지 교체
- [x] avatar: mock · `next/image` 삭제, `Avatar` import
- [x] alert: mock 삭제, `Alert` · `AlertDescription` · `AlertTitle` import
- [x] skeleton: mock 삭제, `Skeleton` import
- [x] tooltip: mock 삭제, `Tooltip` · `TooltipContent` · `TooltipProvider` · `TooltipTrigger` import
- [x] 미사용 import 0(grep, 양성 대조)

## 검증 · 문서
- [x] `turbo type-check lint test build --force`(Cached 0/28), tsc 양성 대조
- [x] `frontend.yml` run 단계 전체(검사 7종 · pack-smoke · cli-smoke · registry-install-smoke · E2E 4종 건수 가드)
- [x] 4페이지 + progress 대조군 x 기본 · ontology x 라이트 · 다크 axe 측정(before · after), skeleton reduce · tooltip 키보드 · avatar 폴백 · alert 토큰(testplan)
- [x] 빌드 churn(templates · registry version) 되돌림
- [x] release-notes, project-todo · wi-mapping 🔄
- [ ] PR · 머지 · Pages 배포 뒤 pages.dev 확인(Master, testplan 5절)
