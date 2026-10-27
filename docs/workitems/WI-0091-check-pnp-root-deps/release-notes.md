# WI-0091: check 의 Plug'n'Play 루트 선언 판정 릴리스 노트

> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch (같은 PR: WI-0094 · WI-0092, changeset 1개) | GitHub: #234
> 발행: PR-A · PR-B(WI-0093)를 모두 머지한 뒤 Version PR 하나로 cli 1.7.6 · mcp 1.4.5 (예정)

## 바뀐 점

- Yarn Plug'n'Play(`.pnp.cjs`)에서 `axis check` · MCP `axis.check_project` 는 워크스페이스 루트에만 선언한 패키지를 인정하지 않아요. 앱이 자기 `package.json` 에 없는 패키지를 해석하지 못해 빌드가 실패하는데 지금까지 PASS 였어요.
  - `tailwindcss` 가 루트에만 있으면 「필수 의존성 tailwindcss 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요」 FAIL 이에요. **이 상태의 PnP 앱은 check 종료 코드가 0 에서 1 로 바뀌어요.**
  - `clsx` · `tailwind-merge` 가 루트에만 있으면 같은 문구의 WARN 이에요.
  - Tailwind 3 CommonJS 의 `.default` 없는 preset require 에서 `@axis-ds/tokens` 가, 마크업 `data-brand` + `ThemeProvider` 구성에서 `@axis-ds/theme` 가 루트에만 있으면 「앱이 해석하지 못합니다(워크스페이스 루트 선언 <범위>)」 WARN 이에요.
  - Tailwind 3 애니메이션 플러그인 선언이 루트에만 있으면 animation 이 「애니메이션 플러그인 tailwindcss-animate 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다(…) … → 앱 package.json 에 tailwindcss-animate 를 선언하세요」 WARN 이에요(다른 PnP 문구와 같은 틀, 추가 결정 A1).
  - `@axis-ds/*` 가 루트에만 있으면 dependencies 가 「@axis-ds/ui-react 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요」 WARN 이에요(종료 코드 불변, 추가 결정 A3). 지금까지는 PASS 였어요(측정 M5 · M6 · M7).
- `.pnp.cjs` 탐색은 `.git` 이 있는 층에서 멈춰요. 저장소 밖 상위에 남은 `.pnp.cjs` 때문에 node_modules 프로젝트를 PnP 로 보던 경우가 사라지고, 그런 프로젝트는 설치본 기준 판정을 다시 받아요(측정: refute-stray C 는 content FAIL 이 새로 나와 rc 0 → 1, 같은 레이아웃 대조군과 같은 결과). 이 판정은 init · theme add · add 도 함께 써서 같은 상황에서는 그쪽도 node_modules 기준으로 바뀌어요.

## 바뀌지 않은 점

- Tailwind 버전 판정(TW3/TW4 분기) · 컴포넌트 `tailwind.css`(B1) · content 대상 · 1.4.0 안내 · animation 의 ui-react 사용 판정은 루트 선언을 계속 봐요(사용자 결정 Q6 · Q7).
- npm · pnpm · Yarn node-modules 의 루트 선언 인정, 앱에 선언한 PnP 앱의 판정은 그대로예요.
- init · theme add · `axis add` · template apply 는 이번에 바꾸지 않았어요(사용자 결정 Q2, WI-0095).

## 잔여 · 알려진 한계

- `.yarnrc.yml` 의 `pnpFallbackMode: all`(루트 선언을 앱이 해석함)도 FAIL 이에요(사용자 결정 Q1, 측정 D: 9/0/0 rc 0 → 5/3/1 rc 1). 앱 `package.json` 에 선언하면 사라져요.
- 게이트가 돌지 않는 모양(Tailwind 3 ESM · `.ts` 설정의 preset, `setBrand` 구성)에서는 tokens · theme 이 루트 전용이어도 아무 항목도 알리지 않아요(사용자 결정 Q7).
- PnP 는 여전히 설치본(캐시 · 압축 파일)을 읽지 않아요. 앱에 선언했지만 캐시에서 빠진 경우(WI-0092 측정 Y2)는 PASS 예요.
- PnP 에서 루트에만 선언한 `@axis-ds/*` 는 설치 확인 대상 수(「N개」)에는 넣지 않아요(PnP 는 설치본을 읽지 않음). 필수 의존성이 루트 전용이라 dependencies 가 FAIL 이면 그 FAIL 만 나오고 `@axis-ds/*` · 권장 WARN 은 함께 나오지 않아요(측정 R7 · real yarnpnp).
- Next.js 실제 빌드 · ESM 로더(`.pnp.loader.mjs`) 경로, Windows 는 재지 않았어요.
