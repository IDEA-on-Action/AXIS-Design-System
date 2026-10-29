---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis check` · MCP `axis.check_project` 가 Tailwind 4 프로젝트의 AXIS 패키지 CSS import(tokens CSS import `@axis-ds/tokens/css` · `css/shadcn` · `css/tailwind4` 와 컴포넌트 `@axis-ds/ui-react/tailwind.css` · `@axis-ds/agentic-ui/tailwind.css`)를 빌드 도구처럼 풀어요(WI-0103). 그 줄이 있는 앱 안 CSS 파일 위치부터 위로 `node_modules` 를 찾고, 먼저 잡힌 설치본에 `exports` 가 있으면 그 `exports`(조건 `style` · `default`)로만 풀어요. 앱 안에 남은 낡은 중첩 `node_modules`(그림자 설치본) 때문에 빌드는 실패하는데 check 는 PASS 이던 경우를 알려요. 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같아요.

판정이 바뀌는 경우(check 종료 코드는 바뀌지 않아요, 모두 WARN 까지):

- **PASS → WARN**: 먼저 잡히는 중첩 설치본이 앱 기준 설치본과 실경로가 다르고(pnpm 링크가 같은 실체를 가리키면 해당하지 않음) 빌드가 실패하는 모양일 때예요.
  - tokens CSS import 줄: 진입 파일 · 하위 파일 어디에 있든, 그 설치본이 subpath 를 내보내지 않거나(1.4.0 미만 `@axis-ds/tokens` 가 이 모양) 조건이 `style` · `default` 와 맞지 않거나 내보낸 파일이 없을 때(globals.css 항목)
  - 컴포넌트 `tailwind.css` 줄이 진입 파일에 있을 때: 위와 같은 세 경우(Tailwind 구성 항목)
  - 컴포넌트 `tailwind.css` 줄이 하위 파일에 있을 때: 그 설치본에 `tailwind.css` 파일은 있는데 `exports` 가 내보내지 않거나 조건이 맞지 않을 때(파일이 없는 경우는 종전에도 WARN)
  - 앱과 워크스페이스 루트에 설치본이 없고, 그 줄이 있는 파일 위치에서는 풀리지 않는데 같은 전역 CSS 의 다른 파일 위치(예: 진입 파일 쪽 중첩 `node_modules`)에서만 풀릴 때
- **WARN → PASS**: 하위 파일의 컴포넌트 `tailwind.css` 줄에서 먼저 만나는 중첩 설치본에 `exports` 도 `tailwind.css` 도 없어, 빌드 도구가 그 설치본을 건너뛰고 상위 설치본으로 푸는 경우(종전에는 「이 파일 위치에서 … 찾지 못해」 WARN)
- **WARN 그대로, 문구만 바뀜**: 하위 파일의 컴포넌트 `tailwind.css` 줄에서 먼저 만나는 중첩 설치본이 내보내지 않거나 내보낸 파일이 없는 경우. 종전 「… globalCss 를 앱 안 파일로 바꾸세요」 대신 「… 그 줄이 있는 파일 위치에서 먼저 잡히는 <경로>(<버전>)가 <subpath> 를 내보내지 않아 …」 · 「… 내보낸 파일(<대상>)이 없어 …」 문구예요

바뀌지 않는 것: 프로젝트 밖 진입 파일(`globalCss` 가 앱 밖), `@import "tailwindcss"` · `tw-animate-css` 줄, 루트 레이아웃 JS import, 브랜드 import, `axis theme add`, Tailwind 3 프로젝트, Plug'n'Play, 앱 기준 설치본 자체의 판정(1.4.0 미만이면 종전 버전 확인 WARN), 해석되는 그림자 파일의 내용(보지 않음).
