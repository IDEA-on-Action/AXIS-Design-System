# WI-0092: Tailwind 4 animation 선언 · 설치본 판정 릴리스 노트

> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch (같은 PR: WI-0091 · WI-0094, changeset 1개) | GitHub: #235
> 발행: PR-A · PR-B(WI-0093)를 모두 머지한 뒤 Version PR 하나로 cli 1.7.6 · mcp 1.4.5 (예정)

## 바뀐 점

- `axis check` · MCP `axis.check_project` 의 animation 항목이 Tailwind 4 에서 CSS 의 줄마다 그 줄이 가리키는 패키지를 봐요.
  - `@import "tw-animate-css"` 는 `tw-animate-css`, `@plugin "tailwindcss-animate"` 는 `tailwindcss-animate` 예요.
  - 그 패키지가 `package.json`(앱 다음 워크스페이스 루트)에 선언되고 설치돼 있어야 PASS 예요(PASS 문구는 종전과 같음).
  - 줄은 있는데 선언이 없거나 설치되지 않았으면 「<파일>의 애니메이션 플러그인을 쓸 수 없습니다(…, tw-animate-css 미설치(선언만 있음)): … → tw-animate-css 를 package.json 에 선언 · 설치하세요」 WARN 이에요. 지금까지는 줄만 보고 PASS 였는데, 이 상태의 실제 빌드는 import 를 찾지 못해 실패해요(측정 8건).
  - 다른 이름의 플러그인만 설치된 경우(`@import "tw-animate-css"` 인데 `tailwindcss-animate` 만 있음)도 PASS 가 아니에요.
  - 두 줄이 모두 있으면 두 패키지가 모두 선언 · 설치돼야 PASS 예요. 하나라도 해석되지 않으면 Tailwind 4.1.14 빌드가 실패해요(측정 5/5, 추가 결정 A2).
  - 선언 없이 설치본만 있는 경우(유령 설치)도 WARN 이에요.
  - 종료 코드는 바뀌지 않아요(WARN, Tailwind 3 의 「선언 · 미설치」와 같은 심각도).
- Plug'n'Play 는 설치본을 읽지 않고 앱 선언 기준이에요. 루트에만 선언했으면 「워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다」 사유예요(WI-0091).
- 줄이 없을 때의 WARN 문구는 그대로예요.

## 잔여 · 알려진 한계

- Plug'n'Play 에서 앱에 선언했지만 캐시에서 빠진 경우(측정 Y2, 빌드 실패)는 PASS 예요.
- 후보 첫 CSS 파일만 읽어요. 그 파일이 다른 CSS 를 `@import` 하고 그 안에 줄이 있으면 보지 않아요(WI-0100).
- 하위 경로(`tw-animate-css/dist/...`) · `layer()` · `@plugin "tw-animate-css"` 표기는 줄로 인식하지 않아요(종전과 같음).
- init 의 S9 침묵(다른 animation 패키지만 설치)은 그대로예요(WI-0099).
- Tailwind 4.0.x · 4.2 이상, yarn 1 · bun 레이아웃은 재지 않았어요.
