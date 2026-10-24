# WI-0029 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-24 | 기준: `feat/wi-0029-default-contrast`(ea37116 위 작업트리)

대비 표기는 axe 와 같은 소수 둘째 자리 버림이에요. 빌드는 모두 turbo `--force`(Cached 0)로 했고, E2E 는 `E2E_SERVER=static` Chromium 이에요.

## 1. 기준선 재측정 (착수 전)

| 항목 | 결과 |
|---|---|
| 기본 브랜드 위반 | 46노드(기준선 14건 · 40노드 + 데모 라이트 2 · 다크 4), 2026-10-17~18 기록과 같음 |
| ontology 브랜드 | 위반 0(같은 첨부 경로가 기본 브랜드 위반을 실어 와 실측된 0) |

## 2. 단위 테스트 (`packages/axis-tokens/test`)

| 테스트 | 내용 | 결과 |
|---|---|---|
| `default-contrast.test.mjs`(신규) | dist `variables.css` 의 :root · .dark 에서 PRD 2.1 · 2.2 의 15쌍(테마별 26건)이 4.5 이상이고 PRD 표 값과 같음 | 29/29 통과 |
| `baseline-1.2.1.test.mjs` | WI-0029 예외 목록(:root 7 · .dark 10, 새 변수 3개, shadcn 다크 `--muted-foreground` 1줄)만 허용, 목록 밖은 1.2.1 불변 | 통과 |
| `ontology-values` · `theme-modes` · `brands` | 기대값 갱신(reject-hover-text 기본 참조, 색 leaf 44 → 47), U18 초안 대조 | 통과 |
| tokens 전체 | | 275/275 |

변이(주입 뒤 원복, 원복은 `git diff` 로 확인):

| 변이 | 잡은 테스트 |
|---|---|
| 예외 밖 변수 변경(다크 text.inverse, 라이트 text.secondary, 다크 text.primary) | baseline-1.2.1 rc 1 |
| button.bg.default 를 blue.500 으로 복원 | baseline(exceptionMismatch) · default-contrast(3.68 미달) |
| plan-card.approve-bg 삭제 · 다크 reject-text 변경 · 새 변수 추가 | baseline(newAbsent · newMismatch · unexpected) · theme-modes |
| 다크 text.tertiary 를 gray.500 으로 복원 | baseline(text-tertiary · button-text-disabled) · default-contrast |
| shadcn 다른 줄 변경 · 예외 줄을 1.2.1 값으로 | baseline shadcn 비교 rc 1 |

## 3. E2E (`apps/web/e2e`)

| 실행 | 결과 |
|---|---|
| a11y · brand-nontext-contrast · brand-demo | 56 passed, 위반 로그 0줄 |
| tokens 설정(dark-tokens 등) | 22 passed |
| 독립 재측정(기본 · ontology x 라이트 · 다크 x 10페이지) | 40건 모두 위반 0 |
| 양성 대조: button.bg.default 를 옛 값으로 빌드(가드만 옛 값인 임시 사본) | 14 failed, color-contrast 라이트 · 다크 각 17노드 |
| 양성 대조: 런타임에 옛 값 주입 · #777/#888 probe | 모두 위반을 잡음 |
| PlanCard 거절 hover(Playwright hover 뒤 계산 스타일) | 라이트 #B91C1C 글자, 4.5 이상 |

## 4. 게이트 (AC7)

turbo type-check(10/10) · lint(4/4) · test(6/6: tokens 275 · ui-react 117 · agentic-ui 90 · theme 31 · mcp 138 · cli 661) · build(8/8) 모두 `--force` rc 0. check-token-refs · check-contrast-pairs · check-types-versions · check-library-links · build:registry · test:registry 모두 rc 0.

## 5. 남은 한계

- 커밋되는 a11y.spec 만으로는 옛 버튼 바탕이 돌아왔을 때 `DEFAULT_BUTTON_BG` 가드가 axe 보다 먼저 실패해요. axe 경로의 검출력은 위 임시 사본으로 확인했어요
- `default-contrast.test.mjs` 는 낡은 dist 판정을 `baseline-1.2.1.test.mjs` 의 stale 가드에 맡겨요(tokens `test` 스크립트는 두 파일을 함께 실행해요)
- 다크 shadcn `--muted-foreground` 새 값은 apps/web 화면에 쓰이지 않아(globals.css 가 따로 정의) E2E 가 아니라 baseline 단위 테스트로만 단언해요
