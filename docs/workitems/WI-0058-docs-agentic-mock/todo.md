# WI-0058: 문서 사이트 agentic 페이지 mock 을 실제 컴포넌트로 TODO

> PRD: [prd.md](./prd.md) | GitHub: #157

## 1단계 실측 · 결정
- [x] 배치 2 브리프 실측(18페이지 import 0 · mock 17 · 모조 HTML 1, 교체 scratch tsc 0 · build rc 0)
- [x] 반박 검토 major 지적 반영(#418 처방 구체화 · surface-renderer 미측정 분리 · `/components` 분리)
- [x] 사용자 결정 반영(D1~D4 권장안, 2026-10-24), PRD v1.0

## FR-1 16페이지 교체
- [x] mock 블록 제거 · `@axis-ds/agentic-ui` import(외부 패키지 import 묶음 안으로)
- [x] 미사용 import 제거(lint 가 잡지 않아 grep 으로 확인)
- [x] Props 표 누락 3개 추가(streaming-text `className`, tool-call-card `description` · `className`)

## FR-2 · FR-3 surface-renderer · approval-dialog
- [x] surface-renderer: 실제 `SurfaceRenderer` 렌더(text · table · code · custom), Props · Surface · SurfaceType 을 패키지 API 로, 코드 예시 import 경로 정정
- [x] approval-dialog: 경로 유지, `ApprovalCard` 문서 · 실렌더(심각도 전환 데모 · 3단계 예시 · ApprovalAction 표)
- [x] 사이드바 `config/docs.ts` · agentic 인덱스 라벨 `ApprovalCard`

## FR-4 · FR-5 페이지 결함
- [x] `useClientNow()` 로 데모 시각을 마운트 뒤에만 생성(message-bubble · step-timeline)
- [x] token-usage-indicator 슬라이더 `label htmlFor` 연결

## 검증 · 문서
- [x] type-check(양성 대조) · lint · build, cli collector 테스트, library 링크 검사
- [x] 기존 a11y 게이트 40/40
- [x] 18페이지 × 기본 · ontology × 라이트 · 다크 측정, 위반을 WI-0062 · WI-0069 로 분류(testplan)
- [x] release-notes, project-todo · wi-mapping 🔄
- [x] PR · 머지 · Pages 배포 뒤 pages.dev 확인(Master) 완료 (2026-10-25 실측: 배포 후 재측정 워크플로, npm 1.6.2 · cli 1.6.0 · pages.dev, env 주입 없음). agentic 18페이지 실컴포넌트 렌더 · #418 0건 · 404 양성 대조
