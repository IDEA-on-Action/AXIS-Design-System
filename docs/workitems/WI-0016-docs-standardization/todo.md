# WI-0016: 문서 페이지 표준화 TODO

> PRD: [prd.md](./prd.md) | 상태: 🔄 레이아웃 전용 마이그레이션 완료, 심화 표준화 후속 분리

> **범위 결정 (사용자, 2026-06-30)**: 1차는 **레이아웃 전용** (기존 섹션·순서 보존, 공용 컴포넌트로만 래핑, 시각 변화 0). 순서 재정렬·데모 명칭 통일·Accessibility 섹션 추가는 후속 WI로 분리.

## Phase 1: 감사 ✅
- [x] 48개 컴포넌트/Agentic 페이지 섹션 매트릭스 작성 (헤더/CodeBlock/PropsTable + h2 섹션)
- [x] 불일치 식별 (순서 차이, "Interactive Demo" 명칭 혼재, Accessibility 부재, Type 섹션 산재)
- [x] 보일러플레이트 패턴 확정 (container/max-w-4xl 헤더 + section/h2)

## Phase 2: 공용 컴포넌트 ✅
- [x] `components/doc-page-layout.tsx` 구현 (container + breadcrumb + h1 + 설명) (AC2)
- [x] `components/doc-section.tsx` 구현 (section + h2 + TOC 앵커 id 자동 slugify)
- [x] 기존 `props-table.tsx`/`code-block.tsx` 재활용 (별도 표준화 불필요)
- [x] 배럴(index.ts) 등록

## Phase 3: 마이그레이션 (레이아웃 전용) ✅
- [x] button pilot 검증 (typecheck+lint PASS)
- [x] components 26개 페이지 마이그레이션
- [x] agentic 22개 페이지 마이그레이션
- [x] 코드모드 + prettier 일괄 변환 + 중복 섹션 주석 97개 제거
- [x] 감사 매트릭스 100% (구식 패턴 0건 잔존, DocPageLayout 48건 적용) (AC3)

## Definition of Done
- [x] 타입 체크 통과
- [x] 린트 통과
- [x] 빌드 성공 (정적 페이지 214개 생성, 회귀 없음)
- [ ] release-notes.md 작성

## 후속 (심화 표준화 - 별도 WI 후보)
- [ ] 섹션 순서 표준 정렬 (agentic Demo→Usage 위치 통일)
- [ ] 데모 섹션 명칭 통일 ("Interactive Demo" 등)
- [ ] Accessibility 섹션 추가 (AC4 일부)
- [ ] Type 섹션 표준 위치·명칭
