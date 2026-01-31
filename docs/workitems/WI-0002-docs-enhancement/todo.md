# TODO — 문서 사이트 개선

> WI: WI-0002 | PRD 기반 | 상태: In Progress

---

## 실행 순서 (제안)

1. Core UI 컴포넌트 문서 페이지 작성
2. Agentic UI 컴포넌트 문서 페이지 작성
3. 라이브러리 갤러리 페이지 구현
4. 전체 검증 및 접근성 확인

---

## Tasks

### Phase 1: 컴포넌트 문서

- [ ] **T1: Core UI 문서 페이지 완성**
  - AC: AC1, AC3 — Button, Input, Avatar, Badge, Card, Alert 문서
  - 대상 파일: `apps/web/src/app/components/*/page.tsx`
  - 테스트: 빌드 성공, 페이지 접근 가능

- [ ] **T2: Agentic UI 문서 페이지 완성**
  - AC: AC1, AC3 — AgentAvatar, ThinkingIndicator 등 7개 문서
  - 대상 파일: `apps/web/src/app/agentic/*/page.tsx`
  - 테스트: 빌드 성공, 페이지 접근 가능

### Phase 2: 갤러리 및 개선

- [ ] **T3: 라이브러리 갤러리 페이지 구현**
  - AC: AC2 — 전체 컴포넌트 목록 및 미리보기
  - 대상 파일: `apps/web/src/app/library/page.tsx`
  - 테스트: 모든 컴포넌트가 갤러리에 표시

- [ ] **T4: Props 테이블 표준화**
  - AC: AC3 — 일관된 Props 문서 형식
  - 대상 파일: 각 컴포넌트 문서 페이지

---

## Definition of Done (WI)

- [ ] 모든 Task 완료
- [ ] 타입 체크 통과 (`pnpm type-check`)
- [ ] 린트 통과 (`pnpm lint`)
- [ ] 빌드 성공 (`pnpm build`)
- [ ] 문서 업데이트
- [ ] 릴리스 노트 작성
