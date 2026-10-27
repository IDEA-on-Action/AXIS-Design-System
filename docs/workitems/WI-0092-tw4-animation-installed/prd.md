# WI-0092: Tailwind 4 check animation 의 선언 · 설치본 판정 PRD

> 작성일: 2026-10-27 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0092 | GitHub: #235 | 우선순위: P3 | 상태: Approved (2026-10-27 사용자 결정 Q9 · Q10 · Q12)
> 기준: `main` ffbda57 (cli 1.7.5 · mcp 1.4.4) 위 worktree 브랜치. WI-0091 · WI-0094 와 한 PR(사용자 결정 Q4)
> 표기: **측정**(이번에 실행해 얻은 값) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정)

`checkAnimationPlugin` 의 Tailwind 4 분기는 후보 첫 CSS 파일의 `@import "tw-animate-css"` · `@plugin "tailwindcss-animate"` 정규식만 봤어요. 선언 · 설치본 · Plug'n'Play 를 보지 않고, 어느 이름이 맞았는지도 구분하지 않았어요.

- 「줄은 있는데 미설치 → 빌드 rc 1 · out.css 없음 → check · MCP PASS」 상태가 8건(S2 · S3 · S6 · S9 · P2 · P4 · P5 · H3), PnP Y2 를 넣으면 9건이었어요(조사 단계 측정, 빌드 성공 여부는 레이아웃 9가지에서 `findInstalledPackage` 결과와 1:1, `@tailwindcss/postcss` 4.1.14 경로도 CLI 와 같음).
- 같은 check 의 Tailwind 3 분기는 「선언 · 미설치」를 이미 WARN 으로 내고 있어서(실빌드도 rc 1) 두 분기가 엇갈렸어요.

### 1.2 결정 (2026-10-27 사용자 결정)

| # | 결정 |
|---|---|
| Q9 | TW4 animation 은 CSS 줄마다 그 줄이 가리키는 패키지(`tw-animate-css` · `tailwindcss-animate`)의 선언(앱 다음 루트, PnP 는 WI-0091 Q1 규칙) + 설치본을 봐요. 다른 이름만 설치된 경우(S9)도 PASS 가 아니에요 |
| Q10 | 「줄은 있는데 미설치」는 WARN(TW3 와 대칭, 종료 코드 불변). TW3 쪽 심각도는 바꾸지 않아요 |
| Q12 | 결함 상태를 PASS 로 고정한 기존 기대(CLI tw4Ok · h-rootonly-ui, MCP h-rootonly-ui)는 WI-0074 원 실측 fixture 에 `tw-animate-css` 가 실제로 설치돼 있었는지 먼저 확인해요. 설치돼 있지 않았다면 기대를 WARN 으로 바꿔요. 근거를 testplan 에 남겨요. AC6 회귀 대조군(2553-2568)은 바뀌면 안 돼요 |

### 1.2.1 구현 후 추가 결정 (2026-10-27 사용자 확정)

| # | 결정 |
|---|---|
| A2 | TW4 CSS 에 두 줄(`@import "tw-animate-css"` · `@plugin "tailwindcss-animate"`)이 모두 있으면 모든 줄이 선언 · 설치돼야 PASS 예요(구현 유지). 근거(한 줄이 해석되지 않으면 실제 빌드가 실패하는지)를 실제 Tailwind 4 빌드로 재서 testplan 4절에 남겨요. 실빌드가 성공하면 규칙을 바꾸지 않고 미결로 돌려요 |
| A1 · A3 | WI-0091 prd 1.2.1 참고(TW3 PnP animation 문구 틀, PnP 루트 전용 `@axis-ds/*` 알림) |
| 공통 | cli 1.7.6 · mcp 1.4.5 로 PR-B 와 함께 발행해요 |

### 1.3 범위

- 포함: registry-core `tailwind-core.ts` `checkAnimationPlugin` 의 TW4 분기(줄별 패키지 · 선언 · 설치본), 사유 생성 `pluginProblem`(TW3 와 공용)
- 제외: TW3 심각도(Q10), init 의 S9 침묵(WI-0099), CSS 가 다른 파일을 `@import` 하는 경우 · 후보 첫 파일 고정(WI-0100), PnP 설치본(캐시) 판독

## 2. 수용 기준

- **AC1**: 줄 + 선언 + 설치본 → PASS(종전 문구 「<파일>에 애니메이션 플러그인이 있습니다」 그대로)
- **AC2**: 줄은 있는데 선언 없음(유령 설치 포함) · 미설치 → WARN 「<파일>의 애니메이션 플러그인을 쓸 수 없습니다(<사용 근거>, <사유>): … → <패키지> 를 package.json 에 선언 · 설치하세요」. 종료 코드 불변
- **AC3**: `@import "tw-animate-css"` 줄에 `tailwindcss-animate` 만 설치(S9) → WARN. `@plugin "tailwindcss-animate"` 줄은 `tailwindcss-animate` 로 판정
- **AC4**: 루트 선언 · 루트 설치(호이스팅) → PASS. PnP 는 앱 선언이면 PASS, 루트 전용이면 WI-0091 전용 사유 WARN
- **AC5**: 줄이 없으면 종전 WARN 문구 바이트 그대로(AC6 회귀 대조군 2553-2568 불변)
- **AC6**: CLI · MCP 같은 문구
