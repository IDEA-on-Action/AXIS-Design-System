---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis init` 의 Tailwind 4 애니메이션 안내가 `axis check` 의 animation 항목과 같은 전역 CSS 줄 판정을 써요(WI-0099). 판정은 공유 코어(registry-core)의 `inspectTailwind4Animation` 하나이고, check 는 그 함수를 쓰도록 옮겼을 뿐 판정 · 문구가 바이트 그대로예요.

- **init 이 새로 안내하는 경우**(종전 침묵, check 는 이미 WARN):
  - 전역 CSS 의 줄이 가리키는 패키지와 설치된 패키지가 다를 때(예: `@import "tw-animate-css";` 인데 `tailwindcss-animate` 만 설치) → 「애니메이션: app/globals.css의 애니메이션 줄을 쓸 수 없습니다(tw-animate-css 선언 없음). 이미 설치된 tailwindcss-animate 를 쓰려면 @import "tw-animate-css"; 줄을 @plugin "tailwindcss-animate"; 로 바꾸고, 아니면 설치하세요: npm install tw-animate-css」. 두 줄이 다 있는데 한쪽만 설치됐으면 대안은 「… 만 쓰려면 <줄> 줄을 지우고」예요
  - 줄은 없는데 패키지가 선언 · 설치돼 있을 때 → 「애니메이션: tw-animate-css 는 설치돼 있지만 app/globals.css에 애니메이션 줄이 없습니다. 전역 CSS 에 @import "tw-animate-css"; 를 넣으세요.」(Yarn PnP 는 「선언돼 있지만」)
- **init 안내가 바뀌는 경우**(CSS 에 줄이 있을 때): 미설치 · 미선언이면 줄이 가리키는 패키지로 「… 애니메이션 줄을 쓸 수 없습니다(<check 와 같은 사유>). 설치하세요: <명령>」이에요. 종전에는 CSS 를 보지 않아 줄이 `@plugin "tailwindcss-animate"` 여도 `tw-animate-css` 설치를 안내해, 따라 해도 check 가 WARN 으로 남았어요. 선언 · 미설치는 종전처럼 설치 명령이고 npm 루트 선언이면 「워크스페이스 루트에서 npm install」(WI-0096)이에요
- **바뀌지 않는 경우**: 줄의 패키지가 모두 선언 · 설치됐으면 종전처럼 침묵해요. 전역 CSS 파일이 없거나(고를 파일이 없음) Tailwind 3 이면 종전 판정 그대로예요. 줄이 없고 패키지도 없거나 선언 · 미설치면 종전 줄 그대로예요. Yarn PnP 에서 줄의 패키지가 워크스페이스 루트에만 선언된 경우도 종전 그대로예요(WI-0095 에서 다룸).
- init 의 종료 코드와 쓰는 파일(`axis.config.json` · `utils.ts` · `package.json`)은 바뀌지 않아요(fixture 37개에서 수정 전후 rc · 파일 해시 같음).
- `axis check` · MCP `axis.check_project` 의 판정 · 문구 · 종료 코드는 바뀌지 않아요. MCP 에는 init 도구가 없어 MCP 의 동작은 그대로이고, 공유 코어를 번들하므로 함께 올려요.
