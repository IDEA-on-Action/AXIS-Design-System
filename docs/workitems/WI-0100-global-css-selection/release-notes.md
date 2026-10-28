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
- 전역 CSS 가 프로젝트 안 CSS 를 상대 경로로 `@import "./axis.css";` 하면 그 하위 파일의 근거 줄(`@import "tailwindcss"` · AXIS 토큰 진입점 · tokens CSS · `--axis-*` 정의 · 컴포넌트 `tailwind.css` · `@source` · `tw-animate-css` · `@plugin "tailwindcss-animate"` · 브랜드 import)을 인정해요(WI-0100b). 문구 끝(`globalCss` 표기 앞)에 「(app/axis.css 의 import)」 형식으로 출처를 적고, 하위 파일이 없으면 종전 문구 그대로예요. 패키지 경로 줄은 진입 파일에 있을 때와 같은 WI-0097 해석 판정을 거쳐요(그 줄이 있는 파일 위치 기준, 하위 파일은 프로젝트 안이라 앱 기준). 브랜드 import 는 그 판정 대상이 아니라 진입 파일과 같은 규칙으로 인정해요.
  - 따라가는 범위: 따옴표 안 `./` · `../` 경로이고 대상 실경로가 프로젝트 안인 일반 파일. 진입 파일에서 5단계까지(초안, Master 확인 대기), 같은 파일은 한 번만(순환 · 자기 import 도 끝남). `url(...)` 형태 · `./` 없는 이름 · 프로젝트 밖 경로 · 밖을 가리키는 심볼릭 링크 · 없는 파일 · 디렉터리는 따라가지 않아요.

### 종료 코드 영향

- **check 종료 코드가 1 에서 0 으로 바뀔 수 있는 경우**: CSS 가 종전 후보 밖(`src/styles/globals.css` · 임의 이름)에만 있고 globalCss 가 그 파일을 가리키는 프로젝트(`axis init` 이 `src/styles/globals.css` 를 기록한 프로젝트 포함, 측정 R2 · R3 · I1 은 1.7.6 에서 「globals.css 파일을 찾을 수 없습니다」 FAIL), globalCss 가 프로젝트 밖 파일인 프로젝트(측정 mono/app1).
- 0 에서 1 로 바뀌는 경우는 없을 것으로 봐요(추정, 구현 뒤 측정으로 확정). 0100b(상대 `@import` 펼침)는 종료 코드를 바꾸지 않아요(착수 fixture 53개를 기준선 2d12ae2 빌드와 나란히 돌려 rc 가 모두 같음, 측정).
- 종료 코드는 그대로이고 심각도만 바뀌는 경우: WARN → PASS(globalCss 파일 대신 낡은 루트 파일을 보던 프로젝트, 하위 파일에 근거가 있는 프로젝트), PASS → WARN(globalCss 파일은 비었고 루트 `globals.css` 에만 내용이 있는 프로젝트, 측정 R9. 진입 파일의 직접 `@source` 로 PASS 였는데 하위 파일의 `@axis-ds/ui-react/tailwind.css` import 가 1.4.0 미만 설치본을 가리키는 프로젝트는 버전 확인 WARN, 측정 p1. 진입 파일의 `--axis-*` 정의로 globals.css PASS 였는데 하위 파일에 해석되지 않는 tokens import 가 있는 프로젝트는 해석 불가 WARN, 측정 p2). 하위 파일의 컴포넌트 `tailwind.css` import 로 「컴포넌트 스캔 경로가 없습니다」가 풀리는 프로젝트는 WARN → PASS 예요(측정 K1). B1 누락 WARN 이던 K2 · K2u 형태는 버전 확인 WARN 으로 문구만 바뀌어요(측정). CI 에서 WARN 수를 세면 차이가 보여요.

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
- `layer()` · `supports()` · media 조건이 붙은 `@import` 는 무조건 들어오는 것으로 봐요. 0100b 착수 실빌드(`@tailwindcss/postcss` 직접 호출)에서 토큰 진입점을 이 조건 안에 넣으면 빌드가 「`@custom-variant` cannot be nested」로 실패했으므로(브랜드 CSS 는 성공) 이 형태는 check PASS 인데 빌드가 깨질 수 있어요(Master 확인 대기). `@/` · `~/` alias 와 CSS Modules 는 따라가지 않아요.
- 순환 import(a → b → a · 자기 import)는 check 가 b 의 근거를 인정해 PASS 이지만, 착수 실빌드는 「Exceeded maximum recursion depth」로 실패했어요(Master 확인 대기, 기대값 E3 는 testplan 대로 PASS).
- 착수 실빌드에서 따옴표 상대 경로(`"./x.css"` · `'./x.css'` · `../`)는 Tailwind 4 · Next.js 15 모두 펼쳐 토큰 변수가 산출 CSS 에 들어갔고, `url(...)` 형태는 펼치지 않고 그대로 남았어요. 그래서 check 도 `url(...)` 형태는 따라가지 않아요(plan 2.2 의 「url() 허용」과 다름, Master 확인 대기). Tailwind 3 + Next 의 `@import "./axis.css"` 도 펼쳐졌어요(t3s).
- 앱 안 하위 파일의 패키지 줄은 앱 기준으로 판정해요. 하위 파일 디렉터리에 중첩 `node_modules` 가 있으면 실빌드는 그 위치에서 풀어 그림자 설치본을 집을 수 있는데(검증 s2: check PASS, 실빌드 AXIS 변수 0), check 는 이 경우를 보지 않아요(Master 확인 대기).
- 공백 없는 `@import"./axis.css"` · 확장자 없는 `@import "./axis"` · 파일명에 작은따옴표가 든 `"./it's.css"` 는 Tailwind 4 실빌드가 펼쳐 토큰 변수를 넣지만 check 는 따라가지 않아 거짓 WARN 이에요(기준선과 같은 WARN, Master 확인 대기).
