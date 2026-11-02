---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis check` 와 MCP `axis.check_project` 의 ontology-console 규칙 card-shadow 가 그림자 값이 토큰인지로 판정해요(WI-0109).

- 진짜 카드(`<Card` 태그 · `bg-card` 가 든 클래스 묶음(`hover:bg-card` · `bg-card/90` · `!bg-card` 포함) · 선택자에 card 가 든 CSS 규칙)에서는 `var(--axis-card-shadow…)` 만 토큰으로 인정하고 모양(`rounded-*` 나 `rounded-[…]` 와 `border`)으로만 카드처럼 보이는 묶음에서는 이름에 `shadow` 가 든 `var(--axis-…)` 를 인정해요(떠 있는 레이어용 `--axis-shadow-lg` 포함).
- 클래스(`shadow-*` · `[box-shadow:…]`), `<Card style` 의 `boxShadow`, CSS `box-shadow` · `-webkit-box-shadow`(선언마다) · `@apply` 에 같은 값 판정을 써요. 카드에서 그림자 토큰 변수에 고정값을 대입한 것(`[--axis-card-shadow:…]` · style `'--axis-…shadow…'` 키와 계산 키 `['--axis-…shadow…' as string]` · CSS 선언)도 잡아요.
- 새로 잡는 것: `shadow-[shadow:0_1px_2px_#000]` 처럼 힌트가 붙은 고정값, `!shadow-md` · `shadow-md!` · `shadow-lg/50`, 폴백이나 고정 레이어를 섞은 토큰 값, 진짜 카드에 쓴 `--axis-shadow-lg`, 값 전체로 판정해서 `none` 이나 `0 0 #0000` 뒤에 다른 값이 붙은 CSS · style 값(`0 0 #0000 inset`). `<Card style` 값이 따옴표 문자열 하나로 끝나지 않는 것(`'var(--axis-card-shadow)' + ', 0 1px black'` · `|| x` · 템플릿 리터럴 `${x}` · `as const`). 새로 통과하는 것: 모양으로만 카드인 묶음의 `shadow-[var(--axis-shadow-lg)]` · `shadow-(--axis-shadow-lg)`, 카드 style · CSS 의 `var(--axis-card-shadow)`(`!important` · 대소문자 포함), 그림자 색 클래스(`shadow-primary` 등, 팔레트 색은 palette 가 계속 잡음).
- palette 가 임의값 밑줄 뒤 색(`_#000` · `_rgb(` · `_rgba(` · `_hsl(` · `_hsla(`)도 잡아요. 밑줄 바로 뒤의 `#` + 16진은 URL 안이어도 색으로 봐요(`/docs/page_#abc`).
- 위반은 지금처럼 WARN 이라 종료 코드는 바뀌지 않아요. 이미 만든 프로젝트에 복사된 `scripts/check-ontology.mjs` 는 자동으로 바뀌지 않으니, 같은 판정이 필요하면 템플릿 최신본의 스크립트를 다시 복사하거나 `axis check` 를 써요.
