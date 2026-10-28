# WI-0100: check 의 전역 CSS 파일 선택 릴리스 노트 (초안, 미발행)

> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch | GitHub: #244 | 같은 발행: WI-0097(#241) · WI-0098(#242)
> 발행: 세 WI 를 모두 머지한 뒤 Version PR 하나로 cli 1.7.7 · mcp 1.4.6 (예정). linked 4패키지(tokens · theme · ui-react · agentic-ui)는 1.8.2 그대로
> 이 초안의 「전」 값은 발행본 1.7.6 · 1.4.5 측정값이고, 「후」 값은 구현 뒤 측정으로 바꿔요.

## 바뀐 점

- `axis check` · MCP `axis.check_project` 의 Tailwind 4 `tailwind.config` · `globals.css` · Tailwind 4 `animation` 항목이 `axis.config.json` 의 `globalCss` 가 가리키는 파일을 먼저 판정해요. 지금까지는 고정 후보(루트 `globals.css` → `app/globals.css` → …)에서 처음 찾은 파일만 봐서, globalCss 와 다른 파일(예: 낡은 루트 `globals.css`)을 판정하거나 후보 밖 파일을 못 찾았어요. Tailwind 3 의 `globals.css` 항목도 같아요.
  - globalCss 가 가리키는 파일이 없으면 종전 후보로 넘어가고, 세 항목 문구 끝에 brand 항목과 같은 「(globalCss <값> 없음)」을 붙여요.
  - globalCss 가 `.css` 가 아닌 파일이면 check 는 그 값을 쓰지 않고 후보로 넘어가며 그 사실을 표기해요. 디렉터리면 종전 brand 항목처럼 「(globalCss <값> 없음)」으로 표기해요. `axis theme add` 는 종전대로 거절해요.
  - globalCss 가 프로젝트 밖(`../shared/globals.css` 등)이면 check 는 그 파일을 읽기만 해요. `axis theme add` 는 종전대로 쓰지 않아요.
- brand 항목도 같은 파일을 판정해요. 한 실행에서 항목마다 다른 CSS 파일을 판정하던 경우가 사라져요(측정 R6).
- 전역 CSS 가 프로젝트 안 CSS 를 상대 경로로 `@import "./axis.css";` 하면 그 하위 파일의 근거 줄(`@import "tailwindcss"` · AXIS 토큰 진입점 · tokens CSS · `tw-animate-css` · 브랜드 import 등)을 인정해요. 문구 끝에 「(app/axis.css 의 import)」 형식으로 출처를 적어요. 패키지 경로 줄(`tailwindcss` · 토큰 진입점 · `tw-animate-css` · 컴포넌트 `tailwind.css` 등)은 진입 파일에 있을 때와 같은 WI-0097 해석 판정을 거쳐요. 브랜드 import 는 그 판정 대상이 아니라 진입 파일과 같은 규칙으로 인정해요.

### 종료 코드 영향

- **check 종료 코드가 1 에서 0 으로 바뀔 수 있는 경우**: CSS 가 종전 후보 밖(`src/styles/globals.css` · 임의 이름)에만 있고 globalCss 가 그 파일을 가리키는 프로젝트(`axis init` 이 `src/styles/globals.css` 를 기록한 프로젝트 포함, 측정 R2 · R3 · I1 은 1.7.6 에서 「globals.css 파일을 찾을 수 없습니다」 FAIL), globalCss 가 프로젝트 밖 파일인 프로젝트(측정 mono/app1).
- 0 에서 1 로 바뀌는 경우는 없을 것으로 봐요(추정, 구현 뒤 측정으로 확정).
- 종료 코드는 그대로이고 심각도만 바뀌는 경우: WARN → PASS(globalCss 파일 대신 낡은 루트 파일을 보던 프로젝트, 하위 파일에 근거가 있는 프로젝트), PASS → WARN(globalCss 파일은 비었고 루트 `globals.css` 에만 내용이 있는 프로젝트, 측정 R9. 하위 파일에서 `@axis-ds/ui-react/tailwind.css` 를 import 하는데 ui-react 설치본이 1.4.0 미만이거나 판정할 수 없는 프로젝트는 그 줄이 새로 버전 확인 대상이 돼 WARN 이 될 수 있음, 추정 · 미측정). 하위 파일의 컴포넌트 `tailwind.css` import 로 「컴포넌트 스캔 경로가 없습니다」가 풀리는 프로젝트는 WARN → PASS 예요(추정). CI 에서 WARN 수를 세면 차이가 보여요.

## 바뀌지 않은 점

- globalCss 키가 없는 프로젝트는 종전 후보 순서 그대로예요(WI-0049 D6-범위). 후보 목록은 합치지 않았어요.
- 하위 파일의 create-next-app 기본 정의 · Arial 은 판정하지 않아요(진입 파일만 봄).
- 루트 레이아웃(`app/layout.tsx` 등)의 `import "@axis-ds/tokens/css"` 를 근거로 인정하는 규칙은 그대로예요. 파일명만 선택된 파일로 나와요.
- `axis init` · `axis theme add` 의 동작과 출력은 바꾸지 않았어요. init 의 Tailwind 4 안내는 WI-0095 에서 다뤄요.

## 잔여 · 알려진 한계

- globalCss 키가 없고 루트 `globals.css` 와 `app/globals.css` 가 함께 있으면 brand(app 우선)와 CSS 항목(루트 우선)이 계속 다른 파일을 볼 수 있어요. globalCss 를 적으면 사라져요.
- 프로젝트 밖 전역 CSS 가 다시 상대 `@import` 하는 파일은 따라가지 않아요.
- 프로젝트 밖 전역 CSS 안의 패키지 import 를 빌드 도구가 그 파일 위치 기준으로 해석하는지는 아직 미측정이에요(구현 첫 단계 실빌드로 확인).
- `layer()` · `supports()` · media 조건이 붙은 `@import` 는 무조건 들어오는 것으로 봐요. `@/` · `~/` alias 와 CSS Modules 는 따라가지 않아요.
- Tailwind 4 · Next.js 의 실제 `@import` 처리와 같은지는 구현 첫 단계의 실빌드 1회로 확인해요(아직 미측정).
