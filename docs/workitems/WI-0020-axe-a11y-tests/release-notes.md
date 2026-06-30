# 릴리스 노트 - WI-0020 axe 자동 a11y 테스트 도입

> 릴리스 날짜: 2026-06-30
> 범위: ui-react / agentic-ui 테스트 인프라 + Slider a11y 수정

---

## 요약

jest-axe 기반 자동 접근성 테스트를 ui-react / agentic-ui에 도입했어요. 38개 컴포넌트 a11y 테스트가 추가되고, 검사 과정에서 발견된 Slider 썸 라벨 누락을 수정했어요.

---

## 변경 내역

### ✨ 추가 (Added)

- **jest-axe 테스트 인프라**
  - `jest-axe` + `@types/jest-axe` devDependency (ui-react, agentic-ui)
  - vitest.setup.ts에 `toHaveNoViolations` matcher 등록 + ResizeObserver 폴리필(jsdom)
  - `src/test-utils/axe.ts`: `axeCheck(ui)` 헬퍼 (렌더 + axe, color-contrast 비활성)
- **a11y 테스트 38개**
  - ui-react `src/a11y.test.tsx`: 20개 (Button, Input, Checkbox, Switch, Slider, Tabs, RadioGroup, Dialog, Table, Breadcrumb 등)
  - agentic-ui `src/a11y.test.tsx`: 18개 (전 컴포넌트)

### 🐛 수정 (Fixed)

- **Slider 썸 접근 가능한 이름 누락**: Radix Slider 썸(`role="slider"`)에 `aria-label`/`aria-labelledby`를 전달할 경로가 없어 axe `aria-input-field-name` 위반. root에서 받은 라벨을 Thumb에 부여하도록 수정.

---

## Breaking Changes

> 없음. Slider는 `aria-label`/`aria-labelledby`를 이제 썸에도 반영하므로 a11y가 개선될 뿐 기존 사용에 영향 없음.

---

## 검증 방법 (How to Verify)

1. `pnpm install`
2. `pnpm --filter @axis-ds/ui-react test` → 100 passed (a11y 20 포함)
3. `pnpm --filter @axis-ds/agentic-ui test` → 72 passed (a11y 18 포함)
4. `pnpm --filter @axis-ds/ui-react test:coverage` 등으로 a11y 테스트만 실행 가능

---

## 알려진 이슈

- **색상 대비(color-contrast)**: jsdom이 레이아웃/색상을 계산하지 않아 비활성. 시각 회귀/E2E 단계에서 별도 검증 필요.
- **문서 페이지 axe**: 본 WI는 컴포넌트 단위. 문서 페이지 전체 axe는 E2E(Playwright) 후속.

---

## 롤백 가이드

```bash
git revert <머지 커밋>
```

---

## 기여자

- @sinclairseo
