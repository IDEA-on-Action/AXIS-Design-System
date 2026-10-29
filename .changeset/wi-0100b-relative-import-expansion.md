---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis check` · MCP `axis.check_project` 가 전역 CSS 의 상대 경로 `@import`(`@import "./axis.css";` 등)로 들여온 프로젝트 안 CSS 의 근거 줄도 인정해요(WI-0100b). 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같아요.

- **check 종료 코드가 1 에서 0 으로 바뀔 수 있는 경우**: 없어요. 이 변경이 바꾸는 판정은 PASS · WARN 사이뿐이고 FAIL 조건(고를 CSS 파일이 하나도 없음)은 그대로예요(착수 fixture 53개를 기준선 2d12ae2 빌드와 나란히 돌려 종료 코드가 모두 같음). 0 에서 1 로 바뀌는 경우도 없어요.
- **PASS 가 WARN 으로 바뀔 수 있는 경우**(종료 코드는 그대로이고 「N pass / M warn」 집계가 달라져요):
  - 하위 파일의 `@axis-ds/ui-react/tailwind.css` · `@axis-ds/agentic-ui/tailwind.css` import 가 이제 버전 판정에 들어가요. 진입 파일에서 그 패키지를 `@source` 로 직접 가리켜 PASS 였는데 하위 파일의 import 가 1.4.0 미만 설치본을 가리키면 「import 가 있지만 … 버전 확인이 필요합니다」 WARN 이에요.
  - 진입 파일이 `--axis-*` 변수를 직접 정의해 globals.css 가 PASS 였는데, 하위 파일에 이 앱에서 해석되지 않는 tokens CSS import 가 있으면 진입 파일에 그 줄이 있을 때와 같이 import 판정을 따라 WARN 이에요.
  - 상대 import 가 순환하는 프로젝트(자기 import · 조건 붙은 import 로 닫히는 순환 · 32단계 밖에서 닫히는 순환 포함)는 진입 파일에 근거가 있어 globals.css 가 PASS 였어도 이제 globals.css 가 WARN 이에요(진입 파일 판정 문구 뒤에 「 / 」와 순환 문구).
- WARN 이 PASS 로 바뀌는 경우: 토큰 진입점 · tokens CSS import · `@import "tailwindcss"` · 컴포넌트 `tailwind.css` · `tw-animate-css` · `@plugin "tailwindcss-animate"` · 브랜드 import 를 하위 파일에 둔 프로젝트. 문구 끝(`globalCss` 표기 앞)에 「(app/axis.css 의 import)」처럼 출처가 붙어요. 하위 파일이 없으면 문구는 종전 바이트 그대로예요.
- 하위 파일의 패키지 경로 줄은 진입 파일에 같은 줄이 있을 때와 같은 해석 판정(WI-0097)을 그 하위 파일의 디렉터리 기준으로 거쳐요. 그 디렉터리의 중첩 `node_modules` 에 `tailwind.css` 가 없는 컴포넌트 설치본이 있으면 PASS 가 아니라 「이 파일 위치에서 … 해석되지 않습니다」 WARN 이에요. 워크스페이스 루트에만 선언하고 설치하지 않은 tokens 를 하위 파일에서 import 하면 PASS 가 아니라 「import 가 있지만 … 해석되지 않습니다」 WARN 이에요. 앱 `package.json` 에 선언했으면 설치 여부와 상관없이 막지 않아요. 브랜드 import 는 종전대로 이 판정 없이 위치만 봐요.
- 알려진 한계(WI-0103 에서 다뤄요): 하위 파일 디렉터리의 중첩 `node_modules` 는 첫 위치의 설치본만 봐요. `exports` 가 없고 파일도 없는 그림자는 실빌드가 건너뛰어 상위 설치본으로 푸는데 check 는 해석 불가 WARN 이고, `exports` 가 경로를 막는 tokens 그림자 · 내용이 다른 그림자는 check 가 PASS 예요. 이 경우 WARN 문구는 프로젝트 밖 CSS 용 안내(「설치본이 앱 쪽 node_modules 에만 있음 → … globalCss 를 앱 안 파일로 바꾸세요」)를 그대로 써서 상황과 맞지 않아요.
- 따라가는 범위: 따옴표 안 `./` · `../` 경로이고 대상 실경로가 프로젝트 안인 일반 파일만이에요. 공백 없는 `@import"./axis.css"` · 다른 따옴표가 든 이름 `"./it's.css"` 도 따라가고, 확장자 없는 `"./axis"` 는 적힌 이름의 파일이 먼저이고 없으면 `axis.css` 를 봐요(Tailwind 4 와 같은 규칙). 진입 파일에서 32단계까지 읽고 같은 파일은 한 번만 읽어요. 프로젝트 밖으로 나가는 경로 · 밖을 가리키는 심볼릭 링크 · 없는 파일 · 디렉터리 · `url(...)` 형태 · `layer()` · `supports()` · media 조건이 붙은 import · `./` 없는 이름은 따라가지 않고, 프로젝트 밖 전역 CSS 가 다시 밖 파일을 import 해도 읽지 않아요.
- 상대 import 가 순환하면(a → b → a · 자기 import, 실제 빌드가 「Exceeded maximum recursion depth」로 실패) globals.css 항목은 진입 파일만으로 판정한 문구 뒤에 「 / 」로 순환 문구를 붙여 WARN 을 내요(예: 「app/globals.css에 AXIS CSS 변수가 없습니다 / app/globals.css · app/b.css 이 서로 @import 해 빌드가 순환으로 실패합니다 → 순환하는 @import 를 없애세요」). 진입 파일이 PASS 였어도 항목은 WARN 이고, 순환에 든 파일이 하나(자기 자신 import)면 「app/globals.css 이 자기 자신을 @import 해 빌드가 순환으로 실패합니다 → …」예요. 종료 코드는 그대로이고, 이때는 하위 파일의 근거를 인정하지 않아 모든 항목이 진입 파일만으로 판정해요(순환 문구는 globals.css 항목에만).
- 순환은 근거보다 넓게 찾아요: `layer()` · `supports()` · media 조건이 붙은 상대 import 도 순환 판정에 넣고(조건 import 로만 닿는 파일도 순환을 찾으려고 읽음), Tailwind 4 의 재귀 한도와 같은 100단계까지 읽어요(32단계 밖에서 닫히는 순환도 찾음). 근거로 인정하는 범위는 그대로예요(조건 붙은 import 제외 · 32단계까지).
- create-next-app 기본 정의 · `font-family: Arial` 같은 결함은 진입 파일에서만 판정해요(하위 파일의 결함은 종전처럼 보지 않음).
- `axis theme add` 의 동작과 출력은 바뀌지 않아요.
