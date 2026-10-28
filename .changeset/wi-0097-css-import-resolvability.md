---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis check` · MCP `axis.check_project` 의 Tailwind 4 컴포넌트 `tailwind.css` 판정이 「선언됐는가」가 아니라 「이 앱에서 해석되는가」를 봐요(WI-0097). 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같고, `axis theme add` 도 같은 판정 함수를 써서 같은 레이아웃에서 두 명령의 결론이 같아요. 종료 코드는 바뀌지 않아요(새 판정은 모두 WARN).

- 워크스페이스 루트에만 선언한 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 가 설치되지 않았거나 설치본에 `tailwind.css` 가 없으면, `@import "<패키지>/tailwind.css";` 를 바로 권하지 않고 먼저 할 일(설치 · 1.4.0 이상으로 올림 · 다시 설치)을 알려요. 지금까지는 그 줄을 권해서 따르면 빌드가 `Can't resolve` 로 깨졌어요.
- Yarn Plug'n'Play 에서 루트에만 선언했으면 「워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언한 뒤 …」 WARN 이에요(Yarn 4.5.3 · `@tailwindcss/cli` 4.1.14 실빌드에서 루트 전용 CSS `@import` 가 rc 1 이고 앱에도 선언하면 rc 0).
- 루트에만 선언한 패키지가 설치되지 않았거나, 설치본이 1.4.0 이상인데 `tailwind.css` 가 없거나, Plug'n'Play 에서 루트에만 선언했을 때 그 줄이 이미 있으면 PASS 가 아니라 「import 가 있지만 … 해석되지 않습니다」 WARN 이에요(지금까지는 PASS 였어요). 「N pass / M warn」 집계가 달라질 수 있어요. 설치본이 1.4.0 미만이면 종전과 같은 버전 확인 WARN 이에요. 설치본 버전을 읽을 수 없고 `tailwind.css` 도 없으면 종전 PASS 가 아니라 해석 불가 WARN 이에요.
- 앱 디렉터리에 lockfile 이 따로 있는 앱(워크스페이스 멤버가 아닌 독립 앱)은 루트 선언 컴포넌트 패키지의 `tailwind.css` 를 요구하지 않아요(`theme add` 와 같은 경계).
- 앱 `package.json` 에 선언한 컴포넌트 패키지는 설치 여부와 상관없이 종전과 같아요(미설치는 dependencies 항목이 알려요).
- globals.css 항목도 tokens 근거(`@axis-ds/tokens/css` · `css/shadcn` · `css/tailwind4` import, 루트 레이아웃의 `import "@axis-ds/tokens/css"`)를 이 앱에서 해석될 때만 PASS 로 인정해요. 앱 `package.json` 에 `@axis-ds/tokens` 를 선언했으면 설치 여부와 상관없이 종전 PASS 이고(미설치는 dependencies 항목이 알려요), 선언이 없거나 루트에만 선언했어도 설치본 디렉터리가 있으면 PASS 예요. `--axis-*` 변수를 직접 정의한 CSS 는 이 판정을 거치지 않아요. 단, 해석되지 않는 tokens import 가 함께 있으면 import 판정을 따라 WARN 이에요.
- 프로젝트 밖 전역 CSS(`axis.config.json` 의 `globalCss` 가 앱 밖, 예: `../shared/globals.css`)는 그 파일 안의 `@import "tailwindcss"` · 토큰 진입점 · 컴포넌트 `tailwind.css` 줄을 그 파일 위치 기준으로도 봐요. 빌드 도구가 그 줄을 CSS 파일 위치부터 상위 `node_modules` 로 풀어서, 설치본이 앱 아래에만 있으면 빌드가 `Can't resolve` 로 실패해요(공통 상위로 호이스팅하면 성공). 앱에서는 설치본을 찾는데 그 파일 위치에서는 찾지 못하면 「import 가 있지만 이 파일 위치에서 <패키지> 를 찾지 못해 해석되지 않습니다」 WARN 이에요. Plug'n'Play 이거나 앱 위치에서 설치본을 찾지 못하면 이 판정을 하지 않아요.
- 이 두 판정으로 PASS 가 WARN 으로 바뀌는 경우(종료 코드는 그대로이고, 「N pass / M warn」 집계와 「권장 항목을 확인하세요」 출력이 달라져요):
  - globals.css: tokens 미선언이고 설치본도 없는데 tokens CSS import 나 루트 레이아웃의 tokens import 가 있는 앱
  - globals.css: tokens 를 워크스페이스 루트에만 선언했고 설치본이 없는 앱(npm 루트면 「워크스페이스 루트에서 npm install」 안내), 앱 디렉터리에 lockfile 이 따로 있어 루트 선언을 인정하지 않는 앱
  - globals.css: Yarn Plug'n'Play 에서 tokens 를 루트에만 선언했거나 어디에도 선언하지 않은 앱
  - tailwind.config · globals.css: 프로젝트 밖 `globalCss` 파일의 `tailwindcss` · tokens · 컴포넌트 패키지 설치본이 앱 쪽 `node_modules` 에만 있는 모노레포
