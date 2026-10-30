# WI-0099: init 애니메이션 안내가 check 와 같은 전역 CSS 줄 판정을 씀 릴리스 노트

> 2026-10-31 작성(수정본 측정 반영). Q140 ~ Q147 은 권장안으로 진행했고 사용자 확인 대기예요([prd 7절](./prd.md))
> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch(registry-core 변경, MCP 동작은 그대로) | GitHub: #243 | linked 4패키지(tokens · theme · ui-react · agentic-ui)는 바뀌지 않아요

## 바뀐 점

Tailwind 4 프로젝트에서 `axis init` 의 애니메이션 안내가 `axis check` 의 animation 항목과 같은 전역 CSS(`globalCss` 다음 후보, 상대 `@import` 하위 파일 포함)를 읽고 같은 판정을 써요. CSS 의 줄마다 그 줄이 가리키는 패키지(`@import "tw-animate-css"` → `tw-animate-css`, `@plugin "tailwindcss-animate"` → `tailwindcss-animate`)가 선언 · 설치돼 있으면 안내하지 않고(= check PASS), 아니면 안내해요(= check WARN).

- **줄과 다른 패키지만 설치됨(S9, 종전 침묵)**:
  - 「애니메이션: app/globals.css의 애니메이션 줄을 쓸 수 없습니다(tw-animate-css 선언 없음). 이미 설치된 tailwindcss-animate 를 쓰려면 @import "tw-animate-css"; 줄을 @plugin "tailwindcss-animate"; 로 바꾸고, 아니면 설치하세요: npm install tw-animate-css」
  - 두 줄이 다 있고 한쪽만 설치: 「… 이미 설치된 tw-animate-css 만 쓰려면 @plugin "tailwindcss-animate"; 줄을 지우고, 아니면 설치하세요: npm install tailwindcss-animate」
- **줄 없음 · 패키지 설치됨(종전 침묵)**: 「애니메이션: tw-animate-css 는 설치돼 있지만 app/globals.css에 애니메이션 줄이 없습니다. 전역 CSS 에 @import "tw-animate-css"; 를 넣으세요.」(Yarn PnP 는 「선언돼 있지만」)
- **줄이 있는데 패키지가 없거나 선언만 있음(종전 문구가 다름)**: 「애니메이션: app/globals.css의 애니메이션 줄을 쓸 수 없습니다(<사유>). 설치하세요: <명령>」. 사유는 check 와 같은 문자열(「tw-animate-css 선언 없음」 · 「tw-animate-css 미설치(선언만 있음)」)이고, 명령은 미선언이면 `<추가 명령> <이름>`, 선언 · 미설치면 설치 명령(npm 워크스페이스 루트 선언이면 「워크스페이스 루트에서 npm install」)이에요.
  - 종전에는 CSS 를 보지 않아 줄이 `@plugin "tailwindcss-animate"` 여도 `tw-animate-css` 설치를 안내했고, 선언된 이름이 줄과 다르면 그 선언 이름을 안내했어요. 그대로 따라 하면 check 가 WARN 으로 남았어요(측정)
- 줄이 상대 `@import` 로 들여온 하위 파일에 있으면 파일 표기 뒤에 「 (app/anim.css 의 import)」가 붙어요(check 와 같은 표기).
- 측정(fixture 37칸): init 침묵 · check WARN 어긋남 15 → 3, init 이 줄과 다른 패키지를 안내한 칸 4 → 0. 남은 3칸은 아래 「바뀌지 않은 점」의 전역 CSS 없음 2칸 · Tailwind 3 1칸이에요.

## 종료 코드 · 쓰기

- **바뀌지 않아요.** init 은 안내 한 줄만 달라지고, 종료 코드와 쓰는 파일(`axis.config.json` · `utils.ts` · `package.json`)은 같아요(측정: 37칸 rc 같음, 쓴 파일 123개 sha256 같음).
- `axis check` · MCP `axis.check_project` 의 판정 · 문구 · 종료 코드는 바뀌지 않아요(측정: check 출력 37개 바이트 같음). MCP 에는 init 도구가 없어요.

## 바뀌지 않은 점

- 줄의 패키지가 모두 선언 · 설치됐으면 종전처럼 안내하지 않아요.
- 줄이 없고 패키지도 없거나(종전 「플러그인이 필요합니다」 줄), 줄이 없고 선언만 있으면(종전 「선언돼 있지만 설치되지 않았습니다」 줄) 그대로예요.
- 전역 CSS 파일이 없으면(설정의 globalCss 도 후보도 없음) 종전 판정 그대로예요. 이때 check 는 WARN 이라 어긋남이 남아요(Q143).
- Tailwind 3 은 바뀌지 않아요. `tailwindcss-animate` 가 선언 · 설치됐지만 plugins 에 없을 때 init 은 침묵, check 는 WARN 인 어긋남이 남아요(Q146).
- Yarn PnP 에서 줄의 패키지가 워크스페이스 루트에만 선언된 경우는 종전 그대로예요(WI-0095 에서 다룸, Q144).
- `@axis-ds/ui-react` 를 쓰지 않아 check 에 animation 항목이 없을 때도 init 은 안내해요(종전과 같은 방침, Q145).

## 확인 대기 (Q140 ~ Q147)

새 문구 세 가지(「애니메이션 줄을 쓸 수 없습니다 … 설치하세요: …」, 대안 「이미 설치된 … 를 쓰려면 … 로 바꾸고, 아니면」 · 「… 만 쓰려면 … 줄을 지우고, 아니면」, 「… 는 설치돼 있지만 <파일>에 애니메이션 줄이 없습니다」)와 범위 결정은 사용자 확인 대기예요.
