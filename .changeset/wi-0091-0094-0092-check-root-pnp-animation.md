---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis check` · MCP `axis.check_project` 가 워크스페이스 루트 선언과 애니메이션 플러그인을 실제로 쓸 수 있는지 봐요(WI-0091 · WI-0094 · WI-0092). 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같아요.

- Yarn Plug'n'Play(`.pnp.cjs`)에서는 워크스페이스 루트에만 선언한 패키지를 인정하지 않아요. 앱이 자기 `package.json` 에 없는 패키지를 해석하지 못해 빌드가 실패하는데 지금까지는 PASS 였어요. 루트에만 있는 `tailwindcss` 는 「필수 의존성 tailwindcss 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요」 FAIL 이라 **종료 코드가 0 에서 1 로 바뀔 수 있어요**. `clsx` · `tailwind-merge` 는 같은 문구의 WARN 이에요.
- Plug'n'Play 에서 Tailwind 3 CommonJS preset 의 `@axis-ds/tokens`, 마크업 `data-brand` + `ThemeProvider` 구성의 `@axis-ds/theme`, 애니메이션 플러그인 선언이 루트에만 있으면 「앱이 해석하지 못합니다」 WARN 이에요. Tailwind 버전 판정 · 컴포넌트 `tailwind.css` · content 대상 · 1.4.0 안내는 종전대로 루트 선언을 봐요.
- `.pnp.cjs` 는 `.git` 이 있는 층에서 찾기를 멈춰요. 저장소 밖 상위에 남은 `.pnp.cjs` 때문에 node_modules 프로젝트를 Plug'n'Play 로 보던 경우가 사라지고, 그런 프로젝트는 설치본 기준 판정(예: content 의 설치 위치)을 다시 받아요.
- dependencies 항목의 `@axis-ds/*` 설치 확인 대상에 워크스페이스 루트 선언(앱에 없는 것)을 넣어요. 설치되지 않았으면 「워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다: … → <설치 명령>」 WARN 이고, 「워크스페이스 루트에 선언: …」 표시에도 들어가요. 설치돼 있으면 PASS 이고 「N개 확인」 수만 늘어요. 종료 코드는 그대로예요.
- Tailwind 4 animation 은 CSS 줄마다 그 줄이 가리키는 패키지(`@import "tw-animate-css"` 는 `tw-animate-css`, `@plugin "tailwindcss-animate"` 는 `tailwindcss-animate`)의 선언 · 설치본을 봐요. 줄은 있는데 선언이나 설치본이 없으면 「애니메이션 플러그인을 쓸 수 없습니다」 WARN 이에요(지금까지는 줄만 보고 PASS, 실제 빌드는 실패). 다른 이름의 플러그인만 설치된 경우도 PASS 가 아니에요. 종료 코드는 그대로예요.
- `pnpFallbackMode: all` 처럼 루트 선언을 해석해 주는 Yarn 설정은 읽지 않아 이 경우에도 FAIL 이 나요. 앱 `package.json` 에 선언하면 사라져요.
