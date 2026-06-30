# WI-0020: axe 자동 a11y 테스트 도입 TODO

> PRD: [prd.md](./prd.md) | 상태: ✅ 완료

## Phase 1: 인프라 ✅
- [x] jest-axe + @types/jest-axe devDep (ui-react, agentic-ui)
- [x] vitest.setup.ts에 toHaveNoViolations 등록 + ResizeObserver 폴리필
- [x] `src/test-utils/axe.ts` axeCheck 헬퍼 (color-contrast 비활성)

## Phase 2: 테스트 작성 ✅
- [x] ui-react `src/a11y.test.tsx` 20개 (Button~Breadcrumb)
- [x] agentic-ui `src/a11y.test.tsx` 18개 (전 컴포넌트)

## Phase 3: 위반 수정 ✅
- [x] Slider 썸 accessible name 누락 → aria-label/labelledby thumb 전달
- [x] Radix 커스텀 컨트롤(Checkbox/Radio) 테스트는 aria-labelledby로 이름 부여

## Definition of Done
- [x] 38개 a11y 테스트 전부 통과
- [x] 기존 테스트 회귀 없음 (ui-react 100, agentic 72)
- [x] typecheck / build 통과
- [x] release-notes.md 작성

## 후속
- E2E(Playwright) a11y로 문서 페이지·색상 대비 검증 (jsdom 미지원분)
