# WI-0100: check 의 전역 CSS 파일 선택 릴리스 노트 (초안, 미발행)

> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch | GitHub: #244 | 같은 발행: WI-0097(#241) · WI-0098(#242)
> 발행: 세 WI 를 모두 머지한 뒤 Version PR 하나로 cli 1.7.7 · mcp 1.4.6 (예정). linked 4패키지(tokens · theme · ui-react · agentic-ui)는 1.8.2 그대로
> 이 초안의 「전」 값은 발행본 1.7.6 · 1.4.5 측정값이고, 「후」 값은 구현 뒤 측정으로 바꿔요.

## 바뀐 점

- `axis check` · MCP `axis.check_project` 의 Tailwind 4 `tailwind.config` · `globals.css` · Tailwind 4 `animation` 항목이 `axis.config.json` 의 `globalCss` 가 가리키는 파일을 먼저 판정해요. 지금까지는 고정 후보(루트 `globals.css` → `app/globals.css` → …)에서 처음 찾은 파일만 봐서, globalCss 와 다른 파일(예: 낡은 루트 `globals.css`)을 판정하거나 후보 밖 파일을 못 찾았어요. Tailwind 3 의 `globals.css` 항목도 같아요.
  - globalCss 가 가리키는 파일이 없으면 종전 후보로 넘어가고, 세 항목 문구 끝에 brand 항목과 같은 「 (globalCss <값> 없음)」을 붙여요(모든 심각도).
  - globalCss 가 `.css` 가 아닌 파일이면 check 는 그 값을 쓰지 않고 후보로 넘어가며 세 항목 · brand 문구 끝에 「 (globalCss <값>: .css 파일이 아님)」을 붙여요. 디렉터리면 종전 brand 항목처럼 「(globalCss <값> 없음)」으로 표기해요. `axis theme add` 는 종전대로 거절해요.
  - globalCss 가 프로젝트 밖(`../shared/globals.css` 등)이면 check 는 그 파일을 읽기만 해요. `axis theme add` 는 종전대로 쓰지 않아요.
- brand 항목도 같은 파일을 판정해요. 한 실행에서 항목마다 다른 CSS 파일을 판정하던 경우가 사라져요(측정 R6).
- 전역 CSS 가 프로젝트 안 CSS 를 상대 경로로 `@import "./axis.css";` 하면 그 하위 파일의 근거 줄(`@import "tailwindcss"` · AXIS 토큰 진입점 · tokens CSS · `--axis-*` 정의 · 컴포넌트 `tailwind.css` · `@source` · `tw-animate-css` · `@plugin "tailwindcss-animate"` · 브랜드 import)을 인정해요(WI-0100b). 문구 끝(`globalCss` 표기 앞)에 「(app/axis.css 의 import)」 형식으로 출처를 적고, 하위 파일이 없으면 종전 문구 그대로예요. 패키지 경로 줄은 진입 파일에 있을 때와 같은 WI-0097 해석 판정을 거쳐요(하위 파일의 줄은 그 파일의 디렉터리 기준이라 그 디렉터리의 중첩 `node_modules` 도 봐요). 브랜드 import 는 그 판정 대상이 아니라 진입 파일과 같은 규칙으로 인정해요.
  - 따라가는 범위: 따옴표 안 `./` · `../` 경로이고 대상 실경로가 프로젝트 안인 일반 파일. `@import"./axis.css"`(공백 없음) · `"./it's.css"`(다른 따옴표가 든 이름)도 따라가고, 확장자 없는 `"./axis"` 는 Tailwind 4 처럼 적힌 이름의 파일이 먼저, 없으면 `axis.css` 를 봐요. 진입 파일에서 32단계까지, 같은 파일은 한 번만 읽어요. `url(...)` 형태 · `layer()` · `supports()` · media 조건이 붙은 import · `./` 없는 이름 · 프로젝트 밖 경로 · 밖을 가리키는 심볼릭 링크 · 없는 파일 · 디렉터리는 따라가지 않아요.
  - 상대 import 가 순환하면(a → b → a · 자기 import) globals.css 항목은 진입 파일만으로 판정한 문구 뒤에 「 / 」로 순환 문구를 붙여 WARN 을 내요(예: 「app/globals.css에 AXIS CSS 변수가 없습니다 / app/globals.css · app/b.css 이 서로 @import 해 빌드가 순환으로 실패합니다 → 순환하는 @import 를 없애세요」, 종료 코드 그대로). 진입 파일이 PASS 였어도 WARN 이고, 자기 자신을 import 하면 「app/globals.css 이 자기 자신을 @import 해 빌드가 순환으로 실패합니다 → 순환하는 @import 를 없애세요」예요. 이때는 하위 파일의 근거를 인정하지 않고 모든 항목이 진입 파일만 봐요(순환 문구는 globals.css 항목에만). 같은 파일을 두 갈래로 들여오는 것은 순환이 아니에요.
  - 순환은 근거보다 넓게 찾아요: `layer()` · `supports()` · media 조건이 붙은 상대 import 도 순환 판정에 넣고, Tailwind 4 의 재귀 한도와 같은 100단계까지 읽어요(32단계 밖에서 닫히는 순환도 찾음). 근거로 인정하는 범위(조건 없는 import · 32단계)는 그대로예요.

### 종료 코드 영향

- **check 종료 코드가 1 에서 0 으로 바뀔 수 있는 경우**: CSS 가 종전 후보 밖(`src/styles/globals.css` · 임의 이름)에만 있고 globalCss 가 그 파일을 가리키는 프로젝트(`axis init` 이 `src/styles/globals.css` 를 기록한 프로젝트 포함, 측정 R2 · R3 · I1 은 1.7.6 에서 「globals.css 파일을 찾을 수 없습니다」 FAIL), globalCss 가 프로젝트 밖 파일인 프로젝트(측정 mono/app1).
- 0 에서 1 로 바뀌는 경우는 없을 것으로 봐요(추정, 구현 뒤 측정으로 확정). 0100b(상대 `@import` 펼침)는 종료 코드를 바꾸지 않아요(착수 fixture 53개를 기준선 2d12ae2 빌드와 나란히 돌려 rc 가 모두 같음, 측정).
- 종료 코드는 그대로이고 심각도만 바뀌는 경우: WARN → PASS(globalCss 파일 대신 낡은 루트 파일을 보던 프로젝트, 하위 파일에 근거가 있는 프로젝트), PASS → WARN(globalCss 파일은 비었고 루트 `globals.css` 에만 내용이 있는 프로젝트, 측정 R9. 진입 파일의 직접 `@source` 로 PASS 였는데 하위 파일의 `@axis-ds/ui-react/tailwind.css` import 가 1.4.0 미만 설치본을 가리키는 프로젝트는 버전 확인 WARN, 측정 p1. 진입 파일의 `--axis-*` 정의로 globals.css PASS 였는데 하위 파일에 해석되지 않는 tokens import 가 있는 프로젝트는 해석 불가 WARN, 측정 p2. 상대 import 가 순환하는 프로젝트(자기 import · 조건 붙은 import 로 닫히는 순환 · 32단계 밖에서 닫히는 순환 포함)는 진입 파일에 근거가 있어 globals.css 가 PASS 였어도 WARN, 테스트 E3s · 측정 z7). 하위 파일의 컴포넌트 `tailwind.css` import 로 「컴포넌트 스캔 경로가 없습니다」가 풀리는 프로젝트는 WARN → PASS 예요(측정 K1). B1 누락 WARN 이던 K2 · K2u 형태는 버전 확인 WARN 으로 문구만 바뀌어요(측정). CI 에서 WARN 수를 세면 차이가 보여요.

## 바뀌지 않은 점

- globalCss 키가 없는 프로젝트는 종전 후보 순서 그대로예요(WI-0049 D6-범위). 후보 목록은 합치지 않았어요. 예외 하나: 후보 이름과 같은 디렉터리(예: 루트 `globals.css/`)가 있으면 1.7.6 은 check 가 `EISDIR` 로 멈췄고(종료 코드 1, MCP 는 「오류: EISDIR」), 이제 그 후보를 건너뛰고 다음 후보를 판정해요(검증 fixture d-rootdir · verify-dirfx 실측, 후보 판정이 존재 확인에서 일반 파일 확인으로 바뀐 결과).
- 하위 파일의 create-next-app 기본 정의 · Arial 은 판정하지 않아요(진입 파일만 봄).
- 루트 레이아웃(`app/layout.tsx` 등)의 `import "@axis-ds/tokens/css"` 를 근거로 인정하는 규칙은 그대로예요. 파일명만 선택된 파일로 나와요.
- `axis init` · `axis theme add` 의 동작과 출력은 바꾸지 않았어요. init 의 Tailwind 4 안내는 WI-0095 에서 다뤄요.

## 잔여 · 알려진 한계

- globalCss 키가 없고 루트 `globals.css` 와 `app/globals.css` 가 함께 있으면 brand(app 우선)와 CSS 항목(루트 우선)이 계속 다른 파일을 볼 수 있어요. globalCss 를 적으면 사라져요.
- 프로젝트 밖 전역 CSS 가 다시 상대 `@import` 하는 파일은 따라가지 않아요.
- 프로젝트 밖 전역 CSS 안의 패키지 import 는 빌드 도구가 그 파일 위치 기준으로 해석해요(착수 측정 실빌드: 설치본이 앱 아래에만 있으면 빌드 실패, 상위로 호이스팅하면 성공). 이 경우 check 가 PASS 를 내도 빌드가 깨질 수 있어요. **WI-0097 2부로 이관(Q37)**: WI-0097 의 해석 게이트가 WARN 으로 알려요. 이 변경(0100a)은 그 판정을 하지 않아요.
- 심볼릭 링크로 연 앱에서 globalCss 가 프로젝트 밖 상대 경로이면 brand 항목과 CSS 항목의 판정 기준이 어긋날 수 있어요(Q38, 잔여).
- `layer()` · `supports()` · media 조건이 붙은 상대 `@import` 는 따라가지 않아요. Tailwind 4 실빌드에서 토큰 진입점을 그 안에 넣으면 「`@custom-variant` cannot be nested」로 실패하기 때문이에요. 브랜드 CSS 처럼 조건 안에 둬도 빌드되는 줄과, Tailwind 3 + Next(조건이 붙어도 펼침)에서는 근거를 인정하지 않아 WARN 이 남아요. `@/` · `~/` alias 와 CSS Modules 는 따라가지 않아요.
- 33단계보다 깊은 사슬과 디렉터리 import(`"./axis"` 가 `axis/index.css` · `package.json` 의 `style` 로 풀리는 꼴)는 실빌드가 펼치지만 check 는 따라가지 않아 WARN 이에요.
- 착수 실빌드에서 따옴표 상대 경로(`"./x.css"` · `'./x.css'` · `../`)는 Tailwind 4 · Next.js 15 모두 펼쳐 토큰 변수가 산출 CSS 에 들어갔고, `url(...)` 형태는 펼치지 않고 그대로 남았어요. 그래서 check 도 `url(...)` 형태는 따라가지 않아요(사용자 결정 Q50 으로 확정). Tailwind 3 + Next 의 `@import "./axis.css"` 도 펼쳐졌어요(t3s).
- 하위 파일 디렉터리의 중첩 `node_modules` 는 첫 위치의 설치본만 봐요(알려진 한계, WI-0103(#254) 에서 다뤄요). 실빌드는 `exports` 가 없고 파일도 없는 그림자를 건너뛰어 상위 설치본으로 푸는데 check 는 해석 불가 WARN 이에요(측정 s3). 반대로 `exports` 가 경로를 막는 tokens 그림자(측정 s7, 빌드 실패) · 내용이 다른 그림자(측정 s9 · s2, AXIS 변수 0)는 check 가 PASS 예요. 이 경우 WARN 문구는 프로젝트 밖 CSS 용 「설치본이 앱 쪽 node_modules 에만 있음 → … globalCss 를 앱 안 파일로 바꾸세요」를 그대로 써서 상황과 맞지 않아요.
- 순환 판정은 Tailwind 4 의 재귀 한도와 같은 100 단계까지만 읽어요(Q57). 101 단계 이상에서 닫히는 순환 · 순환 없는 102 단계 이상 사슬은 Tailwind 4 빌드도 재귀 한도로 실패하는데 check 는 PASS 예요(측정 z2f · z2g). 실제 프로젝트에서 나오기 어려운 깊이라 한계로 둬요.
