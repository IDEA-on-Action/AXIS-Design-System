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
