# WI-0095: Plug'n'Play 루트 선언 경계를 init · add 로 넓힘 릴리스 노트

> 2026-10-31 작성(수정본 측정 반영). Q150 ~ Q157 은 권장안으로 진행했고 사용자 확인 대기예요([prd 7절](./prd.md))
> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch(registry-core `missingDependencies` 변경, MCP `axis.install_component` 동작 바뀜) | GitHub: #239 | linked 4패키지(tokens · theme · ui-react · agentic-ui)는 바뀌지 않아요

## 업데이트 뒤 바뀔 수 있는 것 + 해결법

Yarn Plug'n'Play 이고 패키지를 워크스페이스 루트 `package.json` 에만 선언한 앱만 해당해요. pnpm · npm · Yarn node-modules 워크스페이스와 앱에 선언한 PnP 앱은 바뀌지 않아요(측정: 5 fixture 의 모든 출력 · 쓴 파일 바이트 같음).

- **`axis init -y` 가 앱 `package.json` 을 새로 써요.** 루트에만 있던 `clsx` · `tailwind-merge` 를 `dependencies` 에 더해요(종전에는 「이미 있습니다」로 쓰지 않았고, 앱이 그 둘을 해석하지 못해 `utils.ts` 가 동작하지 않았어요). 범위는 루트 선언이 아니라 init 의 범위(Tailwind 4 면 `tailwind-merge@^3.4.0`)예요. 루트와 같은 범위를 쓰려면 앱 `package.json` 의 범위를 루트 값으로 고친 뒤 `yarn install` 하세요.
- **`axis add` · MCP `axis.install_component` 의 의존성 명령이 길어져요.** 루트 전용 의존성(예: `"clsx@^2.1.1" "tailwind-merge@^3.4.0"`)이 들어가요. 그대로 실행하면 돼요.
- **종료 코드는 바뀌지 않아요**(측정: 9 fixture × init · theme add · add · template apply 36칸 rc 같음).

## 바뀐 점

PnP 에서 앱은 자기 `package.json` 에 없는 패키지를 해석하지 못해요(Yarn 4.5.3 실측: 앱 issuer `require.resolve` MODULE_NOT_FOUND, Tailwind 4 빌드 `Can't resolve`). `axis check` 는 1.7.6 부터 이 경계를 지켰고, 이번에 init 과 컴포넌트 추가가 같은 판정을 써요.

- **init utils 의존성**: 「✓ package.json dependencies 에 추가: clsx@^2.1.1, tailwind-merge@^3.4.0」 다음 줄에 「clsx, tailwind-merge 는 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다」.
- **init tailwindcss(새 줄)**: 「! 필수 의존성 tailwindcss 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요」. check 의 dependencies FAIL 과 같은 사유예요. init 은 tailwindcss 를 쓰지 않고, Tailwind 3 · 4 분기는 종전처럼 루트 선언으로 정해요.
- **init Tailwind 4 안내**:
  - 루트 전용 `@axis-ds/ui-react` · `@axis-ds/agentic-ui`: `@import "<패키지>/tailwind.css";` 줄 대신 「! <패키지> 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언한 뒤 @import "<패키지>/tailwind.css";」(check 의 Tailwind 4 항목과 같은 문구). 종전 줄을 넣으면 빌드가 `Can't resolve` 였어요(측정). 이때 「npm 패키지 컴포넌트를 쓰면 …」 예시 줄은 내지 않아요.
  - 루트 전용 `@axis-ds/tokens`: 「@axis-ds/tokens 설치(워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다): yarn add "@axis-ds/tokens@^1.4.0"」(종전에는 설치 줄이 없었어요).
- **init 애니메이션(Tailwind 4, 전역 CSS 에 줄이 있음)**: 줄의 패키지가 루트에만 있으면 「애니메이션: app/globals.css의 애니메이션 줄을 쓸 수 없습니다(tw-animate-css 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다). 설치하세요: yarn add tw-animate-css」. 종전에는 줄이 이미 있는데도 「… 플러그인이 필요합니다. yarn add tw-animate-css 뒤 전역 CSS 에 @import "tw-animate-css"; 를 넣으세요」였어요(WI-0099 이 남긴 칸).
- **add · MCP install_component**: 루트 전용 의존성을 미선언과 같게 추가 명령에 넣어요. 사유 줄은 더하지 않아요.
- 측정 스모크(R4): 수정 init 의 안내대로 하면 check 실패 0 · Tailwind 4 빌드 rc 0, 종전 안내대로 하면 check 실패 1 · 빌드 rc 1 이에요.

## 바뀌지 않은 점

- `axis theme add` 는 이미 PnP 루트 선언을 인정하지 않아(1.7.5, WI-0087 P1) 바뀌지 않아요. tokens 를 앱에 쓰고 루트 전용 컴포넌트 줄은 넣지 않아요.
- `axis template apply` · MCP `axis.apply_template` 은 바뀌지 않아요. Tailwind major 불일치 경고는 루트 선언으로 정하는 것이 맞아요(앱에 선언해도 같은 major).
- `axis check` · MCP `axis.check_project` 의 판정 · 문구 · 종료 코드는 바뀌지 않아요(측정 9 fixture 출력 바이트 같음).
- Tailwind 3 의 애니메이션 안내는 루트 전용이어도 종전 「yarn add tailwindcss-animate 뒤 plugins …」예요. check 는 WI-0091 문구로 WARN 이고 둘 다 앱에 선언하는 방향이에요(잔여).
- `pnpFallbackMode: all` 은 읽지 않아요. 그 설정에서는 루트 전용도 앱이 해석하므로, init 이 clsx · tailwind-merge 를 앱에 한 번 더 선언하게 돼요(무해한 중복, 추정).

## 확인 대기 (Q150 ~ Q157)

새 문구 네 가지(utils 사유 줄, tailwindcss 줄, Tailwind 4 안내의 「! <패키지> … 선언한 뒤 <줄>」 · tokens 설치 줄 사유)와 범위 결정은 사용자 확인 대기예요. 애니메이션 문구는 WI-0099 확정 문구에 check 의 사유를 넣은 것이에요.
