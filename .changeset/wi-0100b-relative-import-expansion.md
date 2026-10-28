---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis check` · MCP `axis.check_project` 가 전역 CSS 의 상대 경로 `@import`(`@import "./axis.css";` 등)로 들여온 프로젝트 안 CSS 의 근거 줄도 인정해요(WI-0100b). 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같아요.

- **check 종료 코드가 1 에서 0 으로 바뀔 수 있는 경우**: 없어요. 이 변경이 바꾸는 판정은 PASS · WARN 사이뿐이고 FAIL 조건(고를 CSS 파일이 하나도 없음)은 그대로예요(착수 fixture 53개를 기준선 2d12ae2 빌드와 나란히 돌려 종료 코드가 모두 같음). 0 에서 1 로 바뀌는 경우도 없어요.
- **PASS 가 WARN 으로 바뀔 수 있는 경우**(종료 코드는 그대로이고 「N pass / M warn」 집계가 달라져요):
  - 하위 파일의 `@axis-ds/ui-react/tailwind.css` · `@axis-ds/agentic-ui/tailwind.css` import 가 이제 버전 판정에 들어가요. 진입 파일에서 그 패키지를 `@source` 로 직접 가리켜 PASS 였는데 하위 파일의 import 가 1.4.0 미만 설치본을 가리키면 「import 가 있지만 … 버전 확인이 필요합니다」 WARN 이에요.
  - 진입 파일이 `--axis-*` 변수를 직접 정의해 globals.css 가 PASS 였는데, 하위 파일에 이 앱에서 해석되지 않는 tokens CSS import 가 있으면 진입 파일에 그 줄이 있을 때와 같이 import 판정을 따라 WARN 이에요.
- WARN 이 PASS 로 바뀌는 경우: 토큰 진입점 · tokens CSS import · `@import "tailwindcss"` · 컴포넌트 `tailwind.css` · `tw-animate-css` · `@plugin "tailwindcss-animate"` · 브랜드 import 를 하위 파일에 둔 프로젝트. 문구 끝(`globalCss` 표기 앞)에 「(app/axis.css 의 import)」처럼 출처가 붙어요. 하위 파일이 없으면 문구는 종전 바이트 그대로예요.
- 하위 파일의 패키지 경로 줄은 진입 파일에 같은 줄이 있을 때와 같은 해석 판정(WI-0097)을 거쳐요. 워크스페이스 루트에만 선언하고 설치하지 않은 tokens 를 하위 파일에서 import 하면 PASS 가 아니라 「import 가 있지만 … 해석되지 않습니다」 WARN 이에요. 앱 `package.json` 에 선언했으면 설치 여부와 상관없이 막지 않아요. 브랜드 import 는 종전대로 이 판정 없이 위치만 봐요.
- 따라가는 범위: 따옴표 안 `./` · `../` 경로이고 대상 실경로가 프로젝트 안인 일반 파일만이에요. 진입 파일에서 5단계까지 읽고 같은 파일은 한 번만 읽어요(순환 import 도 끝남). 프로젝트 밖으로 나가는 경로 · 밖을 가리키는 심볼릭 링크 · 없는 파일 · `url(...)` 형태 · `./` 없는 이름은 따라가지 않고, 프로젝트 밖 전역 CSS 가 다시 밖 파일을 import 해도 읽지 않아요. 뒤에 붙은 `layer()` · `supports()` · media 조건은 보지 않아요.
- create-next-app 기본 정의 · `font-family: Arial` 같은 결함은 진입 파일에서만 판정해요(하위 파일의 결함은 종전처럼 보지 않음).
- `axis theme add` 의 동작과 출력은 바뀌지 않아요.
