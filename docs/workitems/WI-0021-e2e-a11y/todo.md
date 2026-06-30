# WI-0021: E2E Playwright a11y 도입 TODO

> PRD: [prd.md](./prd.md) | 상태: ✅ 완료 (인프라 + 비차단 리포트)

## Phase 1: 인프라 ✅
- [x] @playwright/test + @axe-core/playwright devDep (apps/web)
- [x] Chromium 브라우저 설치
- [x] playwright.config.ts (webServer: pnpm dev, chromium, baseURL :3100)
- [x] test:e2e / test:e2e:a11y 스크립트
- [x] tsconfig e2e 제외 + .gitignore(test-results, playwright-report)

## Phase 2: 테스트 ✅
- [x] e2e/a11y.spec.ts: 9개 대표 페이지 (landing/docs/components·agentic 인덱스·상세)
- [x] nextjs-portal(dev 오버레이) 제외
- [x] 비차단 baseline 정책 + 신규 카테고리 회귀 차단 + 콘솔/첨부 리포트

## Phase 3: 검증 ✅
- [x] 9 테스트 통과(비차단), baseline 위반(color-contrast/button-name) 리포트 확인
- [x] web typecheck/lint 회귀 없음

## Definition of Done
- [x] E2E a11y 인프라 + 테스트
- [x] baseline 위반 문서화 (prd §3)
- [x] release-notes.md 작성

## 후속
- WI-0022: baseline 위반 수정 (color-contrast 디자인 토큰 + button-name 데모 라벨)
- CI 통합: 브라우저 설치 비용으로 main CI 미포함. 별도 워크플로우/수동 실행 검토
