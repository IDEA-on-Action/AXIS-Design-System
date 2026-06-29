# WI-0016: 문서 페이지 표준화 TODO

> PRD: [prd.md](./prd.md) | 상태: 🔄 진행 예정

## Phase 1: 감사
- [ ] 51개 페이지 섹션 충족 매트릭스 작성 (Overview/Import/Usage/Props/Examples/Accessibility)
- [ ] 누락·불일치 섹션 목록화
- [ ] 표준 섹션 순서·네이밍 확정 (AC1)

## Phase 2: 공용 컴포넌트
- [ ] `components/docs/doc-page-layout.tsx` 구현 (AC2)
- [ ] `components/docs/doc-section.tsx` 구현
- [ ] `components/docs/props-table.tsx` 표준화 (기존 개선분 재활용)
- [ ] `components/docs/usage-block.tsx` 구현

## Phase 3: 마이그레이션
- [ ] components 25개 페이지 표준 구조 적용
- [ ] agentic 22개 페이지 표준 구조 적용
- [ ] 감사 매트릭스 100% 확인 (AC3)

## Definition of Done
- [ ] 타입 체크 통과
- [ ] 린트 통과
- [ ] 빌드 성공 (정적 export 회귀 없음)
- [ ] release-notes.md 작성
