---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis check` · MCP `axis.check_project` 가 Tailwind 4 프로젝트의 AXIS 패키지 CSS import(`@axis-ds/tokens/css/tailwind4` · `@axis-ds/ui-react/tailwind.css` · `@axis-ds/agentic-ui/tailwind.css`)를 빌드 도구처럼 풀어요(WI-0103). 줄이 있는 CSS 파일 위치부터 위로 `node_modules` 를 찾고, 먼저 잡힌 설치본에 `exports` 가 있으면 그 `exports`(조건 `style` · `default`)로만 풀어요. 앱 안의 낡은 중첩 `node_modules`(그림자 설치본) 때문에 빌드는 실패하는데 check 는 PASS 이던 경우를 알려요. 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같아요.

판정이 바뀌는 경우(check 종료 코드는 바뀌지 않아요, 모두 WARN 까지):

- **PASS → WARN**
  - 앱 안 CSS(진입 파일 또는 상대 `@import` 로 들여온 하위 파일) 위치에서 먼저 잡히는 중첩 설치본이 그 subpath 를 내보내지 않음(1.4.0 미만 AXIS 패키지가 이 모양), 조건이 `style` · `default` 와 맞지 않음, 내보낸 파일이 없음. 앱 기준 설치본과 실경로가 같은 설치본(pnpm 링크 포함)은 해당하지 않아요
  - 앱 루트에는 설치본이 없고 진입 파일 쪽 중첩 `node_modules` 에만 있어, 다른 디렉터리의 하위 파일 줄이 풀리지 않음
- **WARN → PASS**
  - 하위 파일 쪽 중첩 설치본에 `exports` 도 `tailwind.css` 도 없어 빌드 도구가 건너뛰고 앱 설치본으로 푸는 경우(종전에는 「이 파일 위치에서 … 찾지 못해」 WARN)
- **WARN 그대로, 문구만 바뀜**
  - 하위 파일 쪽 중첩 설치본의 미노출 · 내보낸 파일 없음은 종전 「globalCss 를 앱 안 파일로 바꾸세요」 대신 「먼저 잡히는 <경로>(<버전>)가 <subpath> 를 내보내지 않아 …」 · 「… 내보낸 파일(<대상>)이 없어 …」 문구예요

바뀌지 않는 것: 프로젝트 밖 진입 파일(`globalCss` 가 앱 밖), `@import "tailwindcss"` 줄, 루트 레이아웃 JS import, 브랜드 import, `axis theme add`, Tailwind 3 프로젝트, Plug'n'Play.
