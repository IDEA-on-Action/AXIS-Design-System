# WI-0097: check 의 CSS import 해석 가능성 판정 릴리스 노트

> **초안 · 미발행**(2026-10-28 작성, 수정본 미측정). 문구는 구현 뒤 testplan 확정 값으로 바꿔요
> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch | GitHub: #241
> 발행(예정): WI-0098 · WI-0100 과 한 발행으로 cli 1.7.7 · mcp 1.4.6. linked 4패키지(tokens · theme · ui-react · agentic-ui)는 1.8.2 그대로예요

## 바뀐 점

- Tailwind 4 에서 `axis check` · MCP `axis.check_project` 는 컴포넌트 `tailwind.css` 줄을 「선언됐는가」가 아니라 「이 앱에서 해석되는가」로 판정해요. 지금까지는 워크스페이스 루트에만 선언하고 설치하지 않은 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 에도 `@import "<pkg>/tailwind.css";` 를 넣으라고 안내했고, 그 줄을 넣으면 빌드가 `Can't resolve` 로 실패했어요(측정).
  - 루트 선언 · 미설치: 설치를 먼저 안내해요
  - 루트 선언 · 설치본 1.4.0 미만: 1.4.0 이상으로 올리라고 안내해요
  - 루트 선언 · 1.4.0 이상인데 `tailwind.css` 없음: 다시 설치하라고 안내해요
  - Yarn Plug'n'Play 에서 루트에만 선언: 「워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다」 틀로 앱 선언을 안내해요(사용자 결정 Q22, WI-0091 Q7 을 이 판정에 한해 다시 엶)
  - 앱 디렉터리에 자체 lockfile 이 있으면(워크스페이스 멤버가 아닌 앱) 루트 선언을 선언으로 보지 않아요(`theme add` 와 같음)
  - 위 경우에 해당 줄이 **이미 CSS 에 있으면** tailwind.config 가 PASS 대신 WARN 이에요. 루트 선언 설치본의 버전을 읽을 수 없고 `tailwind.css` 도 없을 때 줄이 있으면 종전 PASS 가 WARN 이 돼요(사용자 결정 Q39)
- globals.css 항목은 `@axis-ds/tokens/css` · `css/shadcn` · `css/tailwind4` import 나 루트 레이아웃의 tokens CSS import 로 PASS 를 내기 전에 `@axis-ds/tokens` 가 해석되는지 봐요. 워크스페이스 루트에만 선언하고 설치하지 않았거나, 선언하지 않았고 설치본도 없거나, Plug'n'Play 에서 루트에만 선언했으면 WARN 이에요. 지금까지는 tokens 를 선언하지도 설치하지도 않은 앱도 PASS 였어요(측정 g1).
- `axis theme add` 의 같은 판정(WI-0087 DEC-2)을 check 와 같은 공용 함수로 옮겼어요. theme add 의 출력과 쓰는 내용은 바뀌지 않아요.

## 종료 코드

- **바뀌지 않아요.** 새로 생긴 판정은 모두 WARN 이에요. check 는 FAIL 이 있을 때만 종료 코드 1 이에요.
- 대신 tailwind.config 나 globals.css 가 PASS 에서 WARN 으로 바뀌는 프로젝트(해석되지 않는 줄이 이미 있는 루트 · PnP 레이아웃, tokens import 가 있지만 tokens 를 앱에 선언하지 않았고 해석되지 않는 앱)는 「N pass / M warn」 집계와 안내 줄이 달라져요. 출력 문구를 grep 하는 스크립트는 확인해 주세요.

## 바뀌지 않은 점

- 앱 `package.json` 에 선언한 컴포넌트 패키지는 설치 여부와 상관없이 종전처럼 줄을 안내하고, 줄이 있으면 종전처럼 판정해요(사용자 결정 Q21). 미설치는 dependencies 항목의 「선언됐지만 설치되지 않은 의존성」 WARN 이 알려요.
- 앱 `package.json` 에 `@axis-ds/tokens` 를 선언했으면 설치하지 않았어도 globals.css 는 종전처럼 PASS 예요(사용자 결정 Q28). 미설치는 dependencies 항목이 알려요.
- Tailwind 4 의 tailwind.config PASS(토큰 진입점)는 그대로이고, tokens 해석 불가는 globals.css 에서만 알려요.
- `axis init` 의 Tailwind 4 안내는 이번에 바꾸지 않았어요(사용자 결정 Q24, WI-0095).

## 잔여 · 알려진 한계

- `.yarnrc.yml` 의 `pnpFallbackMode: all` 처럼 루트 선언이 실제로 해석되는 PnP 에서도 WARN 이에요(잔여 오차, WI-0091 Q1 과 같음). 앱 `package.json` 에 선언하면 사라져요.
- Plug'n'Play 는 설치본(캐시)을 읽지 않아요. 앱에 선언했지만 캐시에서 빠진 경우는 PASS 예요.
- Plug'n'Play 에서 앱에 선언하면 컴포넌트 `tailwind.css` import 는 해석되지만 컴포넌트 클래스가 생성되지 않는 현상이 측정됐어요(`@tailwindcss/cli` 4.1.14). check 는 이 경우를 PASS 로 둬요. WI-0102 로 이관했어요(사용자 결정 Q40).
- Tailwind 3 의 ESM · `.ts` 설정에서 `@axis-ds/tokens/tailwind` preset 을 쓰면 tokens 를 선언 · 설치하지 않아도 PASS 예요. 별도 WI-0101 로 다뤄요(사용자 결정 Q26).
- `axis theme add` 는 Tailwind 4 에서 tokens 진입점 줄을 tokens 설치 여부와 상관없이 넣어요(이번 범위 밖).
- 해석 판정의 근거는 `@tailwindcss/cli` 4.1.14 실빌드예요. Next.js(postcss · css-loader) · Tailwind 3 경로 · 레이아웃 JS import 의 번들러 해석은 재지 않았어요.
