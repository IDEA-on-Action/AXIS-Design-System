---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis check` · MCP `axis.check_project` 에서 전역 CSS 를 읽는 세 항목(Tailwind 4 의 `tailwind.config` · `globals.css` · Tailwind 4 의 `animation`)이 `axis.config.json` 의 `globalCss` 를 먼저 봐요(WI-0100a). 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같아요.

**업데이트 뒤 `axis check` 종료 코드가 1 에서 0 으로 바뀔 수 있어요.** 아래 두 경우는 지금까지 `globals.css 파일을 찾을 수 없습니다` FAIL(종료 코드 1)이었는데 이제 `globalCss` 가 가리키는 파일을 판정해요.

1. CSS 를 고정 후보(`globals.css` · `app/globals.css` · `src/app/globals.css` · `src/globals.css` · `styles/globals.css`) 밖에 두고 `globalCss` 로 가리킨 프로젝트(예: `axis init` 이 기록한 `./src/styles/globals.css`, `./styles/app.css`).
2. `globalCss` 가 프로젝트 밖 파일(예: 모노레포의 `../shared/globals.css`)을 가리키는 프로젝트. check 는 그 파일을 읽기만 하고, `axis theme add` 는 종전대로 밖 파일에 쓰지 않아요.

- `globalCss` 가 가리키는 파일이 있고 `.css` 이면 그 파일을 판정해요. 없으면 종전 후보 순서 그대로예요. 루트에 낡은 `globals.css` 가 있어 `brand` 항목(`app/globals.css`)과 다른 파일을 판정하던 경우가 사라져요(WARN 에서 PASS 로 바뀔 수 있어요).
- 반대로 루트 `globals.css` 에 내용이 있고 `globalCss` 가 가리키는 파일은 비어 있으면 PASS 에서 WARN 으로 바뀌어요(종료 코드는 그대로). `globalCss` 를 실제로 쓰는 파일로 고치면 사라져요.
- `globalCss` 를 쓰지 못하면 종전 후보로 넘어가고 세 항목 문구 끝에 이유를 붙여요. 없는 파일 · 디렉터리는 `(globalCss ./nope.css 없음)`(지금까지 `brand` 항목만 쓰던 표기), `.css` 가 아닌 파일은 `(globalCss ./package.json: .css 파일이 아님)` 이에요. `brand` 항목도 `.css` 가 아닌 파일을 버리고 후보를 판정해요(지금까지는 그 파일을 읽었어요).
- `globalCss` 키가 없는 프로젝트의 출력은 바뀌지 않아요. 고를 CSS 가 하나도 없으면 종전처럼 `globals.css` FAIL 이에요. 예외는 후보 이름과 같은 디렉터리(예: 루트 `globals.css/`)가 있는 프로젝트 하나예요. 지금까지는 check 가 `EISDIR` 로 멈췄는데(종료 코드 1) 이제 그 후보를 건너뛰고 다음 후보를 판정해요.
