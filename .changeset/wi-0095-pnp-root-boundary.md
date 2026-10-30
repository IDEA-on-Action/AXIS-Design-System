---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

Yarn Plug'n'Play 에서 워크스페이스 루트에만 선언한 패키지를 「선언됨」으로 보지 않는 경계(1.7.6 부터 `axis check` · MCP `axis.check_project` 에만 있던 것)를 `axis init` 과 컴포넌트 추가(`axis add` · MCP `axis.install_component`)로 넓혀요(WI-0095). PnP 의 앱은 자기 `package.json` 에 없는 패키지를 해석하지 못해서(Yarn 4.5.3 실측: `require.resolve` MODULE_NOT_FOUND, Tailwind 4 빌드 `Can't resolve`), 종전 안내대로 하면 빌드가 실패했어요.

**업데이트 뒤 바뀔 수 있는 것 + 해결법** (Yarn PnP 이고 패키지를 워크스페이스 루트 `package.json` 에만 선언한 앱만 해당해요. pnpm · npm · Yarn node-modules 는 바뀌지 않아요)

- `axis init -y` 가 앱 `package.json` 의 `dependencies` 에 `clsx` · `tailwind-merge` 를 새로 써요(종전에는 「이미 있습니다」로 쓰지 않음). 루트 선언과 범위가 다를 수 있으니, 루트와 같은 범위를 쓰려면 앱 `package.json` 의 범위를 루트 값으로 고친 뒤 `yarn install` 하세요. 앱에 쓰지 않으려면 init 전에 앱 `package.json` 에 직접 선언하세요(앱 선언은 종전처럼 「이미 있음」).
- `axis add` · MCP `axis.install_component` 의 의존성 명령에 루트 전용 `clsx` · `tailwind-merge` 등이 들어가요(종전에는 빠짐). 안내대로 앱에 추가하면 돼요.
- 종료 코드는 바뀌지 않아요(fixture 9개 × init · theme add · add · template apply 36칸 rc 같음).

바뀐 안내(새 문구는 사용자 확인 대기)

- init: `tailwindcss` 가 루트에만 있으면 「! 필수 의존성 tailwindcss 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요」(check 의 dependencies FAIL 과 같은 사유). init 은 tailwindcss 를 쓰지 않고, Tailwind 3 · 4 분기는 종전처럼 루트 선언으로 정해요.
- init 의 Tailwind 4 안내: 루트 전용 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 는 `@import "<패키지>/tailwind.css";` 줄 대신 「! <패키지> 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언한 뒤 @import "<패키지>/tailwind.css";」(check 의 Tailwind 4 항목과 같은 문구), 루트 전용 `@axis-ds/tokens` 는 「@axis-ds/tokens 설치(워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다): yarn add "@axis-ds/tokens@^1.4.0"」(종전에는 설치 줄이 없었음).
- init 의 애니메이션 안내: 전역 CSS 의 줄이 가리키는 패키지가 루트에만 있으면 WI-0099 의 줄 판정으로 「애니메이션: app/globals.css의 애니메이션 줄을 쓸 수 없습니다(tw-animate-css 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다). 설치하세요: yarn add tw-animate-css」(종전 「… 플러그인이 필요합니다. yarn add tw-animate-css 뒤 …」).
- `axis theme add` · `axis template apply` · MCP `axis.apply_template` 는 바뀌지 않아요(측정상 결함 없음: theme add 는 이미 PnP 루트 선언을 인정하지 않고, template apply 의 Tailwind major 경고는 루트 선언으로 정하는 것이 맞음). `axis check` · MCP `axis.check_project` 의 판정 · 문구도 그대로예요.
- 공유 코어(registry-core `missingDependencies`)를 바꿔 cli · mcp 를 함께 올려요.
