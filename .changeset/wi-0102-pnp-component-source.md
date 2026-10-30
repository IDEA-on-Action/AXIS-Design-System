---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis check` · MCP `axis.check_project` 의 Tailwind 4 tailwind.config 항목이 Yarn Plug'n'Play 에서 컴포넌트 패키지(`@axis-ds/ui-react` · `@axis-ds/agentic-ui`)가 `.yarn/cache` zip 안에만 있는 경우를 알려요(WI-0102). Plug'n'Play 는 패키지를 zip 으로 두고, `tailwind.css` 의 `@source "./dist"` 는 그 zip 안 경로로 풀려요. Tailwind 4 스캐너는 실제 디렉터리만 읽어서 import 는 성공해도(rc 0) 컴포넌트 클래스가 하나도 생성되지 않아요(Yarn 4.5.3 · `@tailwindcss/cli` · `@tailwindcss/postcss` 4.1.14 실빌드, 산출물이 `@import "tailwindcss"` 만 넣은 빌드와 바이트가 같음). Plug'n'Play 루트 `package.json` 의 `dependenciesMeta` 에 `unplugged: true` 를 두면 node_modules 설치와 바이트가 같은 산출물이 나와요. 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같아요.

- **PASS 가 WARN 으로 바뀌는 경우**(종료 코드는 그대로이고 「N pass / M warn」 집계가 달라져요): Plug'n'Play 앱에 컴포넌트 패키지를 선언했고 전역 CSS 에 `@import "<패키지>/tailwind.css";` 가 있는데, 앱 선언 범위에 맞는 `.yarn/unplugged/*/node_modules/<패키지>` 가 없는 경우 → 「`<패키지>/tailwind.css` import 가 있지만 Plug'n'Play 에서 @source "./dist" 가 .yarn/cache zip 안을 가리켜 컴포넌트 클래스가 생성되지 않습니다 → Plug'n'Play 루트(.pnp.cjs 가 있는 곳) package.json 의 dependenciesMeta 에 "<패키지>": { "unplugged": true } 를 두고 yarn install 하세요」
- **WARN 문구만 바뀌는 경우**: 같은 조건에서 줄이 없으면 종전 「컴포넌트 스캔 경로(tailwind.css)가 없습니다 → @import …」 대신 「`<패키지>` 의 tailwind.css 는 … 생성되지 않습니다 → … yarn install 뒤 @import "<패키지>/tailwind.css";」예요(줄만 넣으면 효과가 없어서 설정을 먼저 안내해요)
- 바뀌지 않는 경우: Plug'n'Play 가 아닌 프로젝트, unplugged 설치본이 있는 프로젝트, `workspace:` · `portal:` · `link:` 범위(설치본이 실제 디렉터리), 그 패키지를 가리키는 `@source` 를 직접 쓴 CSS. 판정은 `dependenciesMeta` 설정이 아니라 설치 결과(`.yarn/unplugged` 디렉터리)를 봐요. 앱 `package.json` 의 `dependenciesMeta` 는 Yarn 이 따르지 않아(실측) 그것만으로는 WARN 이 남아요.
- `axis theme add` · `axis init` 의 동작과 출력은 바뀌지 않아요. `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 패키지 자체는 바뀌지 않아요.
