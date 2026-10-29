# WI-0097: check 의 CSS import 해석 가능성 판정 릴리스 노트

> **발행**(2026-10-29, cli 1.7.7 · mcp 1.4.6). 2026-10-28 작성, 1부 · 2부 수정본 측정 반영. B1 문구는 사용자 결정 Q43, 2부 새 문구(globals.css · 프로젝트 밖 진입 파일)는 사용자 결정 Q48 로 확정했어요([testplan 4.4 · 4.5](./testplan.md))
> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch | GitHub: #241
> 발행: 2026-10-29, WI-0098 · WI-0100 과 Version PR #251(머지 1e8da06) 하나로 cli 1.7.7 · mcp 1.4.6, publish run 40811479954, provenance 2/2(둘 다 slsa provenance v1). 이 WI 는 #253(e2701fe)로 머지했어요. linked 4패키지(tokens · theme · ui-react · agentic-ui)는 1.8.2 그대로예요

## 바뀐 점

- Tailwind 4 에서 `axis check` · MCP `axis.check_project` 는 컴포넌트 `tailwind.css` 줄을 「선언됐는가」가 아니라 「이 앱에서 해석되는가」로 판정해요. 지금까지는 워크스페이스 루트에만 선언하고 설치하지 않은 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 에도 `@import "<pkg>/tailwind.css";` 를 넣으라고 안내했고, 그 줄을 넣으면 빌드가 `Can't resolve` 로 실패했어요(측정).
  - 루트 선언 · 미설치: 설치를 먼저 안내해요
  - 루트 선언 · 설치본 1.4.0 미만: 1.4.0 이상으로 올리라고 안내해요
  - 루트 선언 · 1.4.0 이상인데 `tailwind.css` 없음: 다시 설치하라고 안내해요
  - Yarn Plug'n'Play 에서 루트에만 선언: 「워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다」 틀로 앱 선언을 안내해요(사용자 결정 Q22, WI-0091 Q7 을 이 판정에 한해 다시 엶)
  - 앱 디렉터리에 자체 lockfile 이 있으면(워크스페이스 멤버가 아닌 앱) 루트 선언을 선언으로 보지 않아요(`theme add` 와 같음)
  - 위 경우에 해당 줄이 **이미 CSS 에 있으면** tailwind.config 가 PASS 대신 WARN 이에요. 루트 선언 설치본의 버전을 읽을 수 없고 `tailwind.css` 도 없을 때 줄이 있으면 종전 PASS 가 WARN 이 돼요(사용자 결정 Q39)
- globals.css 항목은 `@axis-ds/tokens/css` · `css/shadcn` · `css/tailwind4` import 나 루트 레이아웃의 tokens CSS import 로 PASS 를 내기 전에 `@axis-ds/tokens` 가 해석되는지 봐요. 워크스페이스 루트에만 선언하고 설치하지 않았거나, 선언하지 않았고 설치본도 없거나, Plug'n'Play 에서 루트에만 선언했으면 WARN 이에요. 지금까지는 tokens 를 선언하지도 설치하지도 않은 앱도 PASS 였어요(fixture G1 · G5 · G7 · G4 등 7개가 PASS → WARN, rc 는 그대로, testplan 4.2). 선언하지 않았어도 설치본 디렉터리가 있으면 PASS 이고, `--axis-*` 변수를 직접 정의한 CSS 는 이 판정을 거치지 않아요. 단, 해석되지 않는 tokens import 가 함께 있으면 import 판정을 따라 WARN 이에요(G8).
- 프로젝트 밖 전역 CSS(`globalCss` 가 `../shared/globals.css` 처럼 앱 밖)는 그 파일 안의 `@import "tailwindcss"` · 토큰 진입점 · 컴포넌트 `tailwind.css` 줄을 그 파일 위치 기준으로도 봐요(사용자 결정 Q37). 빌드 도구가 그 줄을 CSS 파일 위치부터 상위 `node_modules` 로 풀어서, 설치본이 앱 아래에만 있으면 빌드가 `Can't resolve` 로 실패하기 때문이에요(실빌드 측정: 앱 아래에만 두면 rc 1 세 형태, 공통 상위로 호이스팅하면 rc 0 두 형태). 앱에서는 설치본을 찾는데 그 파일 위치에서는 찾지 못하면 tailwind.config(`tailwindcss` · 컴포넌트 줄) · globals.css(토큰 줄)가 WARN 이에요. 같은 발행의 WI-0100a(밖 `globalCss` 를 읽기 시작함)만으로는 이 경우가 PASS 예요.
- `axis theme add` 의 같은 판정(WI-0087 DEC-2)을 check 와 같은 공용 함수로 옮겼어요. theme add 의 출력과 쓰는 내용은 바뀌지 않아요.

## 종료 코드

- **바뀌지 않아요.** 새로 생긴 판정은 모두 WARN 이에요. check 는 FAIL 이 있을 때만 종료 코드 1 이에요.
- 대신 tailwind.config 나 globals.css 가 PASS 에서 WARN 으로 바뀌는 프로젝트(해석되지 않는 줄이 이미 있는 루트 · PnP 레이아웃, tokens import 가 있지만 tokens 를 앱에 선언하지 않았고 해석되지 않는 앱, 프로젝트 밖 `globalCss` 파일의 패키지 설치본이 앱 쪽에만 있는 모노레포)는 「N pass / M warn」 집계와 안내 줄이 달라져요. 출력 문구를 grep 하는 스크립트는 확인해 주세요.

## 바뀌지 않은 점

- 앱 `package.json` 에 선언한 컴포넌트 패키지는 설치 여부와 상관없이 종전처럼 줄을 안내하고, 줄이 있으면 종전처럼 판정해요(사용자 결정 Q21). 미설치는 dependencies 항목의 「선언됐지만 설치되지 않은 의존성」 WARN 이 알려요.
- 앱 `package.json` 에 `@axis-ds/tokens` 를 선언했으면 설치하지 않았어도 globals.css 는 종전처럼 PASS 예요(사용자 결정 Q28). 미설치는 dependencies 항목이 알려요.
- Tailwind 4 의 tailwind.config PASS(토큰 진입점)는 그대로이고, tokens 해석 불가는 globals.css 에서만 알려요.
- `axis init` 의 Tailwind 4 안내는 이번에 바꾸지 않았어요(사용자 결정 Q24, WI-0095).

## 발행본 재측정 (2026-10-29)

발행본 dist 를 main 1e8da06 로컬 빌드와 비교하니 코드 파일은 바이트가 같았어요(cli 46 · mcp 36개 파일). 다른 것은 `dist/registry/index.json` · `registry.json` 의 version 필드뿐이에요(로컬 1.5.0 은 커밋된 `apps/web/public/r/index.json` 사본이고, 발행본 1.8.2 는 CI 가 레지스트리를 다시 만든 값이라 pages.dev `/r/index.json` 과 같아요). 발행본 CLI `axis check` 와 MCP `axis.check_project` 의 판정 줄은 이 WI · WI-0100 계열 fixture 153개에서 모두 같았고 출력이 빈 것은 0개예요. 1.7.6 발행본 대비 판정 줄이 바뀐 fixture 는 이 WI 계열 4개예요(WI-0100 계열 66 · WI-0098 PnP 앱 21 과 합쳐 91개). 이 재측정은 판정 줄 대조이고, fixture 별 종료 코드 표(testplan 4.2)는 따로 채우지 않았어요.

## 잔여 · 알려진 한계

- `.yarnrc.yml` 의 `pnpFallbackMode: all` 처럼 루트 선언이 실제로 해석되는 PnP 에서도 WARN 이에요(잔여 오차, WI-0091 Q1 과 같음). 앱 `package.json` 에 선언하면 사라져요.
- Plug'n'Play 는 설치본(캐시)을 읽지 않아요. 앱에 선언했지만 캐시에서 빠진 경우는 PASS 예요.
- Plug'n'Play 에서 앱에 선언하면 컴포넌트 `tailwind.css` import 는 해석되지만 컴포넌트 클래스가 생성되지 않는 현상이 측정됐어요(`@tailwindcss/cli` 4.1.14). check 는 이 경우를 PASS 로 둬요. WI-0102 로 이관했어요(사용자 결정 Q40).
- Tailwind 3 의 ESM · `.ts` 설정에서 `@axis-ds/tokens/tailwind` preset 을 쓰면 tokens 를 선언 · 설치하지 않아도 PASS 예요. 별도 WI-0101 로 다뤄요(사용자 결정 Q26).
- `axis theme add` 는 Tailwind 4 에서 tokens 진입점 줄을 tokens 설치 여부와 상관없이 넣어요(이번 범위 밖).
- 해석 판정의 근거는 `@tailwindcss/cli` 4.1.14 실빌드와, 밖 진입 파일은 앱의 `@tailwindcss/postcss` 4.1.14 를 직접 부른 실빌드예요. next build 경유 · Tailwind 3 경로 · 레이아웃 JS import 의 번들러 해석은 재지 않았어요.
- 프로젝트 밖 진입 파일 판정은 Plug'n'Play 이거나(설치본을 읽지 않음) 앱 위치에서 설치본을 찾지 못하면 하지 않아요(앱 선언 · 미설치는 종전 PASS, 미설치는 dependencies 가 알림). 앱에서는 못 찾지만 그 파일 위치에서는 찾는 설치본(예: `shared/node_modules` 에만 있음)은 앱 기준 판정을 그대로 따라요.
