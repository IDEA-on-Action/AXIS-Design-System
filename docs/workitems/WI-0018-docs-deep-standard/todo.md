# WI-0018: 문서 페이지 심화 표준화 TODO

> PRD: [prd.md](./prd.md) | 상태: 🔧 구현 중

> **표준 확정 (사용자 ratify, 2026-06-30)**: ①Usage 먼저(Demo 뒤로) ②데모 명칭 "Interactive Demo" ③Type 섹션 `{TypeName} Type` 패턴 ④Accessibility는 WI-0019 분리

## Phase 1: 데모 명칭 통일 (저위험) ✅
- [x] "Demo"(tooltip, thinking-indicator) / "Animated Demo"(progress) → "Interactive Demo" (18종 전부 통일)

## Phase 2: Type 섹션 명칭 (저위험) ✅
- [x] surface-renderer "SurfaceType" → "SurfaceType Type" ({TypeName} Type 패턴)
- [x] 기존 준수분 유지(PlanStep/ModelInfo/Step/TimelineStep/Source Type)
- [x] 열거형(File Types, Allowed Surface Types) + 변이 쇼케이스(agent-avatar Types) 제외 확인

## Phase 3: 섹션 순서 재정렬 (중위험) ✅
- [x] Usage 블록을 Installation 직후로 이동 (정규 순서). agentic 16 inversion + agent-avatar(Usage=5) = 17페이지
- [x] 코드모드 + prettier, DocSection 여닫기 균형 검증

## Phase 4: 검증 ✅
- [x] Demo 역전 0건, Usage=2번째 **48/48**
- [x] 데모 명칭 1종(Interactive Demo), Type 패턴 보정 완료

## Definition of Done
- [x] 48개 페이지 표준 적용
- [x] 타입 체크 / 린트 / 빌드 통과 (정적 214페이지 + Pagefind 48 인덱싱 유지)
- [x] release-notes.md 작성

## 후속
- WI-0019: Accessibility 섹션 추가 (컴포넌트별 a11y 콘텐츠 authoring)
