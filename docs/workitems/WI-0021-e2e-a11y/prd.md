# WI-0021: E2E Playwright a11y 도입 PRD

> 작성일: 2026-06-30 | 작성자: AXIS Team | 상태: Done
> 선행: WI-0020(단위 axe). 본 WI는 실 브라우저 E2E a11y(색상 대비 포함).

---

## 1. 개요

### 1.1 배경
WI-0020 단위 axe는 jsdom 기반이라 **색상 대비**와 실제 렌더링을 검증하지 못한다. Playwright + axe-core로 실 브라우저에서 문서 페이지 a11y를 검사한다.

### 1.2 목표
- Playwright + @axe-core/playwright E2E a11y 인프라
- 대표 문서 페이지에 WCAG 2.1 A/AA 검사(색상 대비 포함)
- 도입 시점 위반은 비차단 baseline, 신규 위반 카테고리는 회귀 차단

### 1.3 범위
- 포함: playwright config + e2e a11y spec, 대표 9페이지, 비차단 리포트 정책
- 제외(Non-goals): 기존 위반 수정(별도 WI), CI 자동 실행(브라우저 설치 비용 - 로컬/수동)

---

## 2. 접근

- **next dev** 서버를 Playwright webServer로 기동, Chromium에서 검사
- Next dev 오버레이(`nextjs-portal`)는 dev 전용이라 axe에서 제외
- **비차단 baseline 정책**: 도입 시점 위반(`color-contrast`, `button-name`)은 차단 안 함. baseline 외 신규 카테고리만 `expect` 실패. 모든 위반은 콘솔 + 첨부 리포트.

---

## 3. 도입 시점 baseline 위반 (실측, 별도 WI 대상)

9개 대표 페이지 기준:

| 위반 | impact | 분포 | 원인(추정) |
|------|--------|------|-----------|
| color-contrast | serious | 전 페이지(페이지당 1~19) | `bg-muted/50`·`bg-muted/30` 표 배경 + `text-muted-foreground`, `bg-destructive/10`+`text-destructive`(Required 뱃지) |
| button-name | critical | components/agentic 상세(페이지당 1~7) | 문서 데모의 아이콘 전용 버튼(`size="icon"`) 등 accessible name 누락 |

→ **WI-0022(후속)**: baseline 위반 수정 (디자인 토큰 대비 + 데모 버튼 라벨).

---

## 4. 요구사항 (AC)
- AC1: `pnpm --filter @ax/web test:e2e` 로 E2E a11y 실행
- AC2: 9개 대표 페이지 axe 검사 (색상 대비 포함)
- AC3: baseline 위반 비차단 + 신규 카테고리 차단
- AC4: 모든 위반 콘솔/첨부 리포트
- 비기능: typecheck/build 회귀 없음, e2e는 tsconfig 제외

---

## 5. Definition of Done
- [x] @playwright/test + @axe-core/playwright devDep + Chromium
- [x] playwright.config.ts (webServer: next dev, chromium)
- [x] e2e/a11y.spec.ts (9페이지, baseline 정책)
- [x] tsconfig e2e 제외 + .gitignore 산출물
- [x] 9 테스트 통과(비차단), baseline 위반 리포트 확인
- [x] release-notes.md 작성
