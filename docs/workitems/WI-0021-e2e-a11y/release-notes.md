# 릴리스 노트 - WI-0021 E2E Playwright a11y 도입

> 릴리스 날짜: 2026-06-30
> 범위: apps/web E2E 테스트 인프라 (개발 도구) · 배포 산출물 변경 없음

---

## 요약

Playwright + axe-core 기반 E2E 접근성 테스트를 도입했어요. 실제 브라우저에서 문서 페이지의 WCAG 2.1 A/AA 위반(jsdom이 못 잡는 색상 대비 포함)을 검사해요. 도입 시점 기존 위반은 비차단 baseline으로 기록하고, 신규 위반 카테고리는 회귀 차단해요.

---

## 변경 내역

### ✨ 추가 (Added)

- **E2E a11y 인프라** (apps/web)
  - `@playwright/test` + `@axe-core/playwright` devDependency
  - `playwright.config.ts`: next dev 서버 기동 + Chromium
  - `e2e/a11y.spec.ts`: 9개 대표 페이지(랜딩/docs/components·agentic 인덱스·상세) axe 검사
  - 스크립트: `test:e2e`, `test:e2e:a11y`
- **비차단 baseline 정책**: 도입 시점 위반(`color-contrast`, `button-name`)은 차단하지 않고, baseline 외 신규 위반 카테고리만 실패. 모든 위반은 콘솔 + 첨부(axe-violations.json)로 리포트.

### 🔧 변경 (Changed)

- `tsconfig.json`: `e2e`, `playwright.config.ts` 제외 (Playwright 자체 컴파일)
- `.gitignore`: `test-results/`, `playwright-report/` 추가

---

## 도입 시점 baseline 위반 (별도 WI 대상)

| 위반 | impact | 분포 | 비고 |
|------|--------|------|------|
| color-contrast | serious | 전 페이지 | muted 표 배경/텍스트, Required 뱃지 등 |
| button-name | critical | components/agentic 상세 | 문서 데모 아이콘 버튼 라벨 누락 |

→ 수정은 **WI-0022**로 분리 (디자인 토큰 대비 + 데모 버튼 라벨).

---

## Breaking Changes

> 없음. 개발 도구(E2E 테스트) 추가이며 런타임/배포 영향 없음.

---

## 검증 방법 (How to Verify)

1. `pnpm install`
2. `cd apps/web && npx playwright install chromium`
3. `pnpm --filter @ax/web test:e2e:a11y`
   - 9 테스트 통과(비차단), 콘솔에 페이지별 위반 리포트 출력 확인

---

## 알려진 이슈

- **CI 미통합**: 브라우저 설치 비용으로 main CI에는 포함하지 않음. 로컬/수동 실행. 별도 워크플로우는 후속 검토.
- **dev 서버 기준**: 색상/CSS는 프로덕션과 동일하나 dev 전용 오버레이(nextjs-portal)는 검사에서 제외함.

---

## 롤백 가이드

```bash
git revert <머지 커밋>
```

---

## 기여자

- @sinclairseo
