# WI-0092: Tailwind 4 animation 선언 · 설치본 판정 구현 계획

> PRD: [prd.md](./prd.md) | WI-0091 과 같은 함수(`checkAnimationPlugin`)를 고쳐서 0091 의 PnP 규칙을 먼저 확정한 뒤 이어서 고쳐요

## 1. 바꾸는 곳 (`registry-core/src/template/tailwind-core.ts` `checkAnimationPlugin`)

1. 사유 함수 `pluginProblem(name)` 을 TW3 · TW4 공용으로 둬요. 선언은 `declaredRangeForCheck`(앱 다음 루트, PnP 는 앱만), 없으면 PnP 루트 전용이면 전용 사유 · 아니면 「<이름> 선언 없음」, 선언이 있는데 PnP 가 아니고 `findInstalledPackage` 가 못 찾으면 「<이름> 미설치(선언만 있음)」
2. TW4: CSS 에서 줄을 모아 패키지 목록으로 바꿔요(`@import "tw-animate-css"` → `tw-animate-css`, `@plugin "tailwindcss-animate"` → `tailwindcss-animate`)
   - 줄이 없으면 종전 WARN 그대로
   - 줄마다 `pluginProblem` 을 보고, 하나도 없으면 종전 PASS 문구, 있으면 새 WARN(사유 · 패키지는 문제 있는 줄만)
3. TW3: 종전 `pluginDeclared` · `pluginInstalled` 를 `pluginProblem` 한 번으로 바꿔요(사유 문구는 종전과 같고, PnP 루트 전용만 새 사유)

## 2. 기존 기대 처리 (Q12)

- WI-0074 원 fixture(fx-npm h-rootonly-ui)는 `tw-animate-css` 를 어디에도 선언하지 않았고 ui-react 의 optional peer 라 설치되지 않아요(testplan 1절 근거) → 기대를 WARN 으로 바꿈
- tw4Ok(1535)는 같은 결정으로 WARN 으로 바꾸고, 선언 · 설치본을 갖춘 PASS 행을 새로 둬 종전 PASS 의 의미를 지켜요
- 2553-2568(AC6 회귀 대조군)은 줄이 없는 경우라 문구 바이트가 그대로예요
