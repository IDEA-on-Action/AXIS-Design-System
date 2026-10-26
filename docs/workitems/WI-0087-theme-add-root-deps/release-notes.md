# WI-0087 릴리스 노트: theme add · init 애니메이션 안내가 워크스페이스 루트 선언을 봐요

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #222 | 예상 버전: `@axis-ds/cli` 1.7.5 (patch). mcp · tokens · theme · ui-react · agentic-ui 는 바뀌지 않아요

## 바뀐 점

- `axis theme add` 는 `@axis-ds/tokens` 가 워크스페이스 루트 `package.json`(`dependencies` · `devDependencies`)에 선언돼 있으면 앱 `package.json` 에 다시 쓰지 않아요. 출력은 「- package.json: @axis-ds/tokens <범위> 가 워크스페이스 루트에 선언돼 있어 앱 package.json 은 바꾸지 않음」이에요.
  - tokens 설치본이 없으면 다음 줄에 「설치: <설치 명령>」(lockfile 에 맞춘 `npm install` · `pnpm install` 등)을 내요.
  - 설치본이 1.3.0 미만이면 앱 기준 업그레이드 명령 대신 「워크스페이스 루트 package.json 의 @axis-ds/tokens 선언을 ^1.3.0 이상으로 올리고 설치하세요.」를 내요. 앱 디렉터리에서 업그레이드 명령을 실행하면 앱에 새 선언이 생기기 때문이에요.
  - 루트 선언 범위가 낮아도 범위 안내는 하지 않아요(업그레이드 조건은 종전대로 설치본 1.3.0 미만).
- `axis theme add` 는 루트에 `@axis-ds/theme` 가 선언돼 있으면 「ThemeProvider 를 쓰면 @axis-ds/theme 설치」 안내를 내지 않아요.
- Tailwind 4 에서 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 를 루트에만 선언했으면, 설치본에 `tailwind.css` 가 실제로 있을 때만 전역 CSS 에 `@import "<패키지>/tailwind.css";` 를 넣어요. 종전에는 이 줄이 빠져 컴포넌트 클래스가 만들어지지 않았고 theme add 직후 `axis check` 가 「컴포넌트 스캔 경로」 WARN 을 냈어요(실측 빌드 클래스 4→6줄). 설치본이 없거나 `tailwind.css` 가 없는 버전(1.4.0 부터 제공)이면 줄을 넣지 않고 이유와 할 일을 한 줄로 알려요(1.4.0 이상인데 파일만 없으면 다시 설치를 안내해요). 전역 CSS 에 그 줄이 이미 있으면 안내하지 않아요. 넣으면 빌드가 「Can't resolve」로 깨지기 때문이에요.
- `axis init` 의 애니메이션 플러그인 안내가 루트 선언과 설치본을 봐요.
  - 선언(앱 또는 루트)과 설치본이 모두 있으면 안내하지 않아요. 종전에는 루트에만 선언 · 설치한 앱에도 설치를 권했어요.
  - 선언은 있는데 설치본이 없으면 「애니메이션: <이름> 는 (워크스페이스 루트에 )선언돼 있지만 설치되지 않았습니다. <설치 명령> 뒤 …」로 설치와 설정 줄(Tailwind 3 `plugins` 에 `require("tailwindcss-animate")`, Tailwind 4 `@import "tw-animate-css";` 또는 `@plugin "tailwindcss-animate";`)을 알려요.
  - 판정하는 이름은 `axis check` 와 같아요. Tailwind 3 은 `tailwindcss-animate` 만, Tailwind 4 는 `tw-animate-css` · `tailwindcss-animate` 둘 다(둘 다 있으면 `tw-animate-css`)예요.

## 앱에만 선언한 사용자에게도 바뀌는 것

- `axis init`: 앱에 애니메이션 플러그인을 선언했지만 설치하지 않았으면, 종전에는 아무것도 내지 않았지만 이제 「… 선언돼 있지만 설치되지 않았습니다 …」 줄을 내요.
- `axis init`: Tailwind 3 에서 앱이 `tw-animate-css` 만 선언했으면, 종전에는 침묵했지만 이제 종전 미선언 안내 줄(`tailwindcss-animate`)을 내요. Tailwind 3 플러그인은 `tailwindcss-animate` 이기 때문이에요.
- `axis theme add` 는 앱 선언이면 출력과 파일이 종전과 같아요(실측 바이트 같음).

## 바뀌지 않은 점

- 쓰기는 앱 `package.json` · 전역 CSS · `axis.config.json` 에만 해요. 루트 `package.json` 은 고치지 않아요.
- 앱과 루트에 모두 선언돼 있으면 앱 선언이 먼저예요.
- Yarn Plug'n'Play(`.pnp.cjs`) 프로젝트와, 앱 디렉터리에 자체 lockfile(`package-lock.json` · `pnpm-lock.yaml` · `yarn.lock` · `bun.lockb` · `bun.lock`)이 있는 앱은 theme add 가 루트 선언을 인정하지 않고 종전처럼 동작해요. PnP 는 `axis init` 애니메이션 안내도 종전이에요.
- 워크스페이스가 아닌 상위 디렉터리의 선언은 인정하지 않아요.

## 알아둘 점

- **루트 `devDependencies` 도 선언으로 인정해요.** 앱만 따로 운영 설치하거나 배포하면(예: 앱 디렉터리에서 `npm install --omit=dev`, 앱만 담은 이미지) 루트 선언은 따라가지 않으니, 그 경우에는 `@axis-ds/tokens` 등을 앱 `package.json` 에 직접 선언하세요.
- `axis check` 쪽의 Yarn PnP 루트 선언 판정, Tailwind 4 애니메이션 판정, `theme list` · `info` 의 설치 안내, `dependencies` 항목의 `@axis-ds/*` 설치 확인 대상은 이번에 바꾸지 않았어요(별도 WI).
