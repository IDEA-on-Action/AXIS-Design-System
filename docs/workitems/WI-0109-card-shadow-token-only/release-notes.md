# WI-0109: card-shadow 값 판정 릴리스 노트

> 발행(2026-11-02, Version PR #282, run 41374101810, provenance 2/2) | 대상: `@axis-ds/cli` patch → 1.8.1 · `@axis-ds/mcp` patch → 1.5.1 · ontology-console 템플릿 스크립트 | GitHub: #280
> registry-core 는 private 이라 cli · mcp 가 번들해요. ui-react · agentic-ui · tokens · theme 은 바뀌지 않아요

## 바뀐 점

- `axis check` 와 MCP `axis.check_project` 의 ontology-console 규칙 card-shadow 가 클래스 모양이 아니라 **그림자 값이 토큰인지**로 판정해요. 템플릿에 들어 있는 `scripts/check-ontology.mjs` 도 같은 판정이에요.
- 진짜 카드(`<Card` 태그 · `bg-card` 가 든 클래스 묶음(`hover:bg-card` · `bg-card/90` · `!bg-card` 포함) · 선택자에 card 가 든 CSS 규칙)는 `var(--axis-card-shadow…)` 만 토큰으로 인정해요.
- 모양(`rounded-*` 나 `rounded-[…]` 와 `border`)으로만 카드처럼 보이는 묶음은 이름에 `shadow` 가 든 `var(--axis-…)` 를 인정해요. 떠 있는 레이어용 `--axis-shadow-lg` 가 여기에 들어가요.
- 같은 값 판정을 클래스(`shadow-*` · `[box-shadow:…]`), `<Card style` 의 `boxShadow`, CSS `box-shadow` · `-webkit-box-shadow`(선언마다), 카드 CSS 규칙의 `@apply` 에 써요. 카드에서 그림자 토큰 변수에 고정값을 넣은 것(`[--axis-card-shadow:…]`, style `'--axis-…shadow…'` 키와 계산 키, CSS 선언)도 잡아요.
- palette 가 임의값 밑줄 뒤의 색(`_#000` · `_rgb(` · `_rgba(` · `_hsl(` · `_hsla(`)도 잡아요.
- 스크립트 보고 문구가 「카드 그림자 값이 토큰이 아니에요(허용: …): 고정으로 본 클래스」 꼴로 바뀌었어요.

## 새로 잡는 것과 새로 통과하는 것

- 새로 잡아요: `shadow-[shadow:0_1px_2px_#000]` 처럼 힌트가 붙은 고정값, `!shadow-md` · `shadow-md!` · `shadow-lg/50`, 폴백이나 고정 레이어를 섞은 토큰 값, 진짜 카드에 쓴 `--axis-shadow-lg`, `none` 이나 `0 0 #0000` 뒤에 다른 값이 붙은 CSS · style 값(`0 0 #0000 inset`), 따옴표 문자열 하나로 끝나지 않는 `<Card style` 값(`'var(--axis-card-shadow)' + ', 0 1px black'` · `|| x` · 템플릿 리터럴 `${x}` · `as const`).
- 새로 통과해요: 모양으로만 카드인 묶음의 `shadow-[var(--axis-shadow-lg)]` · `shadow-(--axis-shadow-lg)`, 카드 style · CSS 의 `var(--axis-card-shadow)`(`!important` · `! important` · 대소문자 포함), 그림자 색 클래스(`shadow-primary` 등. 팔레트 색은 palette 가 계속 잡아요).
- 레포의 템플릿 · 레지스트리 · ui-react · agentic-ui 소스 138파일에서는 판정이 종전과 같았어요(위반 9건 대 9건, 차이 0).

## 바뀌지 않은 점

- 위반은 지금처럼 WARN 이라 종료 코드가 바뀌지 않아요. `axis.config.json` 에 template 값이 없으면 출력도 종전과 같아요.
- 다른 규칙(em-dash · exclamation · one-side-line)의 판정은 그대로예요.

## 이미 만든 프로젝트

- 이미 만든 프로젝트에 복사된 `scripts/check-ontology.mjs` 는 자동으로 바뀌지 않아요. cli · mcp 를 올리면 `axis check` 는 새 판정을 쓰므로, 한동안 두 결과가 다를 수 있어요. 달라지는 곳은 card-shadow · palette(밑줄 뒤 색) · 카드 모양 인식(`rounded-[…]`)이고, 어느 한쪽이 고장 난 것이 아니에요.
- 같은 판정이 필요하면 **템플릿 최신본의 `scripts/check-ontology.mjs` 를 다시 복사하거나 `axis check` 를 써요.**

## 알려진 한계

- 카드 단위 밖에서 그림자 토큰을 다시 정의한 것(조상 요소의 `[--axis-card-shadow:…]`, 전역 CSS `:root`)은 보지 않아요. 테마 정의와 구분할 수 없어서예요. `--axis-card-shadow` 로 시작하는 아무 이름(`--axis-card-shadow-x`)도 토큰으로 인정해요.
- 그림자 토큰인지는 이름 규약으로 판단해요(`--axis-` 로 시작하고 이름에 `shadow` 가 들어감). `--axis-shadow-color` 같은 이름의 색 변수가 생기면 토큰으로 통과해요.
- Tailwind 내부 변수(`[--tw-shadow:…]` · CSS `--tw-shadow:` 선언)로 넣은 고정 그림자는 보지 않아요.
- `inherit` · `0 0 transparent` 는 그림자 없음으로 면제하지 않아요(`none` · `0 0 #0000` 만 면제). 카드에 쓰면 위반이에요.
- 진짜 카드로 보지 않는 꼴: 임의값 카드 바탕(`bg-[hsl(var(--card))]`), `cva()` 로 정의해 `<Card className={v()}>` 에 넘긴 클래스, 작은따옴표 `<Card className='…'>`, `className` 앞 속성에 JSX 요소 · `<` `>` 비교식 · TS 제네릭이 있는 `<Card`. 같은 묶음에 `rounded` + `border` 가 있으면 모양 단위로 보아 `--axis-shadow-lg` 가 통과해요.
- 방향이 붙은 `rounded-t-lg` 같은 클래스는 카드 모양으로 인식하지 않아요.
- style 은 `<Card` 태그에서만, 따옴표로 시작하는 값만 봐요(변수 · 삼항 · 함수 호출 값, 백틱 계산 키, 다른 따옴표가 섞인 값은 보지 않음). `boxShadow` 대신 문자열 키 `'box-shadow'` · `WebkitBoxShadow`, 변수로 분리한 style 객체, 여러 줄 템플릿 리터럴도 보지 않아요.
- 재정의 키 꼴 문자열(`'--axis-card-shadow': 'x'`)이 style 객체 밖의 삼항 안에 들어가도 잡혀요(보수적인 쪽 오탐).
- palette 는 밑줄 바로 뒤의 `#` + 16진을 URL 안에서도 색으로 보고(`/docs/page_#abc`), snake_case 함수 호출(`to_rgb(1`)도 색 함수로 봐요.
- (WI-0109 이전부터) CSS 에서 앞이 `:` 가 아닌 `//` 를 줄 주석으로 보고 그 줄 끝까지 지워요. 문자열 안 `//` 뒤에 같은 줄로 이어진 선언은 판정에서 빠져요.
- config 로 늘린 `boxShadow` 이름과 프리셋 밖의 색 이름은 고정으로 봐요.
