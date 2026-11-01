# WI-0109: card-shadow 판정을 토큰 값 기준으로 보정 PRD

> 작성일: 2026-11-02 | 버전: v1.0 | WI: WI-0109 | GitHub: #280 | 상태: 진행 중
> 상위: WI-0107 release-notes 한계 절 · testplan 6.1절, project-todo 120행(2026-11-01 사용자 결정: 후속 WI) | 기준: `main` bd55b1d
> 표기: **측정**(이번에 실행해 얻은 값) · **계산** · **추정**(실행하지 않음)

## 1. 배경

- ontology-console 템플릿 규칙 card-shadow 는 그림자 클래스를 정규식 `SHADOW` 의 모양으로 판정해요. 두 구현(registry-core `template-checks.ts`, 템플릿 `scripts/check-ontology.mjs`)의 판정 로직은 같아요(측정: 최상위 선언 36개가 정규화 뒤 같음).
- 이 정규식은 대괄호 안의 `:` · `#` · `/` 를 받지 않아요. 그래서 판정이 토큰인지가 아니라 이 문자가 있는지로 갈려요(측정).
  - 고정값인데 빠짐: `shadow-[shadow:0_1px_2px_#000]`, `shadow-[0_1px_2px_#000]`, `shadow-[0_1px_2px_rgb(0_0_0/0.1)]`, `!shadow-md`, `shadow-md!`. 앞의 셋 중 일부는 palette 로도 잡히지 않아요.
  - 토큰인데 잡힘: `shadow-[var(--axis-shadow-lg)]`, `shadow-(--axis-shadow-lg)`, 그리고 style `boxShadow` · CSS `box-shadow` 경로의 `var(--axis-shadow-lg)`.
- 모양만 넓히면 ui-react 떠 있는 레이어 10곳(select · toast · popover · dropdown-menu 의 토큰 그림자)이 새로 위반이 돼요(측정). 그래서 「값이 토큰인지」를 보는 판정이 필요해요.

## 2. 사용자 결정(2026-11-02)

| ID | 결정 |
|---|---|
| D1 허용 토큰 | 진짜 카드(`<Card` 태그 · `bg-card` 단위 · 선택자에 card 가 든 CSS 규칙)에서는 이름이 `--axis-card-shadow` 로 시작하는 변수만 토큰으로 인정해요. 클래스 모양(rounded + border)으로만 카드처럼 보이는 단위에서는 `--axis-` 로 시작하고 이름에 `shadow` 가 든 변수를 인정해요(떠 있는 레이어용 `--axis-shadow-lg` 포함) |
| D2 적용 경로 | 클래스 경로 · style `boxShadow` · CSS `box-shadow` 에 같은 값 판정을 써요. 카드 단위에서 그림자 토큰 변수에 고정값을 대입하는 것(임의 속성 `[--axis-…shadow…:값]`, style 의 `'--axis-…shadow…'` 키, CSS 의 `--axis-…shadow…:` 선언)도 같은 판정으로 잡아요 |
| D3 힌트 없는 값 | 힌트 유무와 관계없이 값으로 판정해요. 허용 토큰이면 통과, 나머지는 위반이에요(`shadow-[#000]` · `shadow-[var(--x)]` 도 위반) |
| D4 추가 범위 | 임의 속성 `[box-shadow:…]`, 카드 CSS 규칙의 `@apply shadow-*`, isCardLike 의 `rounded-[…]` 임의값 인식, palette 의 밑줄 뒤 색(`_#hex` · `_rgb(` 등)을 모두 이번에 넣어요 |

결정 없이 보수적인 쪽으로 정한 것(가정, 조사 워크플로의 반박 검토 지적):

- 크기 이름(`shadow` · `shadow-{2xs,xs,sm,md,lg,xl,2xl,inner}`)은 고정 그림자예요. 알려진 색 모양(팔레트-숫자, `white` · `black` · `transparent` · `current` · `inherit`, 프리셋 색 키)만 그림자 색으로 빼고, 모르는 이름(`shadow-card` 처럼 config 로 확장한 이름)은 지금처럼 위반이에요.
- 공백 때문에 닫히지 않은 대괄호 · 괄호 조각(`shadow-[0`)은 위반이에요(지금 잡히는 것이 새로 빠지지 않게).
- `!` 접두 · 접미, `/NN` · `/[..]` · `/(..)` 불투명도 접미, 변형 접두(`hover:` · `md:` · `[&>div]:`), Tailwind 4 괄호형 `shadow-(…)`, 대괄호 단축형 `[--x]` 를 처리해요. `none` · `var(` 판정은 대소문자를 가리지 않고, CSS · style 값의 `!important` 를 벗겨요.
- 모든 판정 정규식은 입력 길이에 선형이어야 해요(변수 이름을 먼저 뽑고 `includes` 로 검사).
- 발행은 patch(cli 1.8.1 · mcp 1.5.1)예요. 위반은 지금처럼 WARN · rc 0 이에요.

## 3. 요구사항

- FR-1: 두 구현에 같은 글자의 값 판정 헬퍼를 넣어요. 클래스 토큰을 「그림자 없음 · 그림자 색 · 토큰 · 고정」으로 분류하고, CSS · style 값을 「그림자 없음 · 토큰 · 고정」으로 분류해요(D1 의 단위 종류에 따라 허용 토큰이 달라요).
- FR-2: 클래스 경로 2곳(문자열 청크 · 클래스 묶음)이 「고정」 토큰이 하나라도 있을 때 card-shadow 로 보고해요.
- FR-3: style `boxShadow` · CSS `box-shadow`(선언마다, `-webkit-` 포함) 경로가 같은 값 판정을 써요(D2).
- FR-4: 카드 단위의 그림자 토큰 재정의(임의 속성 · style 키 · CSS 선언)를 같은 값 판정으로 잡아요(D2).
- FR-5: `[box-shadow:…]` 임의 속성과 카드 CSS 규칙의 `@apply` 클래스 목록을 판정해요(D4).
- FR-6: isCardLike 가 `rounded-[…]` 임의값을 카드 모양으로 인식해요(D4).
- FR-7: palette 가 밑줄 뒤에 붙은 색 값(`_#000` · `_rgb(` · `_rgba(` · `_hsl(` · `_hsla(`)을 잡아요(D4).
- FR-8: 보고 메시지를 새 기준에 맞게 바꿔요(스크립트만, 패리티 비교 밖).
- FR-9: 템플릿 공개 JSON 재생성, 템플릿 README 58행 · WI-0107 문서의 판정 서술 현행화, changeset(cli · mcp patch).

## 4. 수용 기준

- AC1: PRD 2절 결정과 가정의 경계 사례 전부가 단위 테스트로 고정되고, 두 구현이 같은 결과를 내요(패리티 테스트에 양성 · 음성으로 등록).
- AC2: 레지스트리 전 컴포넌트 사본 패리티의 위반이 0건으로 유지되고, 템플릿 원본은 위반 0건이에요.
- AC3: 코퍼스(템플릿 · r/ · ui-react · agentic-ui) A/B 에서 card-shadow · palette 차이를 목록으로 내고, 차이마다 의도한 변화인지 설명해요. 같은 코퍼스에서 토큰을 면제하지 않는 변이가 차이를 만드는지(양성 대조군)도 재요.
- AC4: 변이 검증: 토큰 면제를 끈 변이, 힌트를 무시하는 변이, D1 의 카드 단위 구분을 없앤 변이에서 각각 테스트 rc 가 1이 돼요.
- AC5: 새 정규식 · 헬퍼에 대한 적대 입력(8,000자 이름, 깊은 대괄호, 많은 쉼표 레이어)에서 기존 시간 상한 · 작업량 상한 안에 들어요.
- AC6: turbo build · type-check · lint · test `--force`(Cached 0), check-changeset-mcp-tokens, check-token-refs 통과.

## 5. 범위 밖

- 카드 그림자 규칙 밖의 다른 4규칙(em-dash · exclamation · one-side-line)의 판정.
- 문자열 추출의 한계(여러 줄 템플릿 리터럴, 작은따옴표 `<Card className='…'>`, 변수로 분리한 style 객체). release-notes 한계 절에 유지해요.
- 이미 만든 프로젝트에 복사된 `scripts/check-ontology.mjs` 의 자동 갱신.
