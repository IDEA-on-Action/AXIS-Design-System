# 릴리스 노트 - WI-0022 a11y baseline 위반 수정

> 릴리스 날짜: 2026-06-30
> 범위: 문서 사이트 a11y 수정 + E2E 엄격 모드 전환

---

## 요약

WI-0021 E2E a11y가 기록한 도입 시점 위반(색상 대비 ~71, button-name ~22)을 전부 해소했어요. 9개 대표 페이지 axe 위반이 0이 되어 E2E a11y를 엄격 게이트로 전환했어요.

---

## 변경 내역

### 🐛 수정 (Fixed)

**button-name (아이콘 버튼 접근 가능한 이름)**
- CodeBlock 복사 버튼 `aria-label` (모든 코드블록)
- install-command 복사 버튼 `aria-label`
- docs 페이지 복사 버튼 3개 `aria-label`
- Button Sizes 데모 / Select 데모 trigger `aria-label`

**color-contrast (대비 4.5:1 충족)**
- `--muted-foreground` 46.1% -> 43% (muted 배경 위 텍스트 4.39 -> 통과)
- Required 뱃지 `text-destructive` -> `text-red-700 dark:text-red-300` (3.29 -> 통과)
- 코드 구문 강조: shiki `github-light/dark` -> `github-light-high-contrast`/`github-dark-high-contrast` (#d73a49 4.38 -> 통과)
- 쇼케이스 StreamingText 텍스트: `animate-pulse`(opacity 저하) 제거 + `text-muted-foreground` (3.79 -> 통과)

### 🔧 변경 (Changed)

- `e2e/a11y.spec.ts`: baseline 면제 제거 -> **위반 0 엄격 단언** (회귀 차단 게이트)

---

## Breaking Changes

> 없음. 시각적으로는 muted 텍스트가 약간 진해지고, 코드 구문/Required 뱃지 색이 대비 강화로 조정됨. 기능 영향 없음.

---

## 검증 방법 (How to Verify)

1. `pnpm --filter @ax/web test:e2e:a11y` -> 9 테스트 통과 (위반 0)
2. `pnpm --filter @ax/web build` -> 빌드 성공 (shiki high-contrast 테마 유효)
3. 단위 테스트(WI-0020)/typecheck/lint 회귀 없음

---

## 알려진 이슈

- 다크 모드는 본 E2E가 검사하지 않음(기본 라이트). 다크 모드 a11y는 후속 검토.

---

## 롤백 가이드

```bash
git revert <머지 커밋>
```

---

## 기여자

- @sinclairseo
