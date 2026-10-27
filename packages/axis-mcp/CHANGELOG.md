# @axis-ds/mcp

## 1.4.5

### Patch Changes

- fdd2394: `axis check` · MCP `axis.check_project` 가 워크스페이스 루트 선언과 애니메이션 플러그인을 실제로 쓸 수 있는지 봐요(WI-0091 · WI-0094 · WI-0092). 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같아요.

  **업데이트 뒤 `axis check` 종료 코드가 0 에서 1 로 바뀔 수 있어요.** CI 에서 check 결과로 빌드를 멈추고 있다면 아래 세 경우를 먼저 확인하세요.
  1. Yarn Plug'n'Play 앱에서 `tailwindcss` 를 워크스페이스 루트에만 선언한 경우: 앱이 실제로 해석하지 못하는 상태라 FAIL 이 맞아요. 앱 `package.json` 에 `tailwindcss` 를 선언하면 사라져요.
  2. `.yarnrc.yml` 에 `pnpFallbackMode: all` 을 둔 Plug'n'Play 앱에서 `tailwindcss` 를 루트에만 선언한 경우: 이 설정에서는 앱이 루트 선언을 해석하지만 check 는 이 설정을 읽지 않아 FAIL 이 나요(알려진 한계). 앱 `package.json` 에 선언하면 사라져요.
  3. 저장소 밖 상위 폴더에 `.pnp.cjs` 가 남아 있던 node_modules 프로젝트: 지금까지 Plug'n'Play 로 잘못 보고 설치본 판정을 건너뛰던 것을 이제 바로 봐서, 가려져 있던 실패(예: tailwind.content 의 설치 위치)가 드러날 수 있어요. 출력의 FAIL 항목 안내대로 고치고, 쓰지 않는 상위 `.pnp.cjs` 는 지워도 돼요.
  - Yarn Plug'n'Play(`.pnp.cjs`)에서는 워크스페이스 루트에만 선언한 패키지를 인정하지 않아요. 앱이 자기 `package.json` 에 없는 패키지를 해석하지 못해 빌드가 실패하는데 지금까지는 PASS 였어요. 루트에만 있는 `tailwindcss` 는 「필수 의존성 tailwindcss 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요」 FAIL 이라 **종료 코드가 0 에서 1 로 바뀔 수 있어요**. `clsx` · `tailwind-merge` 는 같은 문구의 WARN 이에요.
  - Plug'n'Play 에서 Tailwind 3 CommonJS preset 의 `@axis-ds/tokens`, 마크업 `data-brand` + `ThemeProvider` 구성의 `@axis-ds/theme`, 애니메이션 플러그인 선언이 루트에만 있으면 「앱이 해석하지 못합니다」 WARN 이에요. Tailwind 3 애니메이션은 「애니메이션 플러그인 tailwindcss-animate 가 워크스페이스 루트에만 선언돼 … → 앱 package.json 에 tailwindcss-animate 를 선언하세요」 꼴이에요.
  - Plug'n'Play 에서 루트에만 선언한 `@axis-ds/*` 는 dependencies 가 「<이름> 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요」 WARN 으로 알려요(지금까지는 PASS, 종료 코드는 그대로). Tailwind 버전 판정 · 컴포넌트 `tailwind.css` · content 대상 · 1.4.0 안내는 종전대로 루트 선언을 봐요.
  - `.pnp.cjs` 는 `.git` 이 있는 층에서 찾기를 멈춰요. 저장소 밖 상위에 남은 `.pnp.cjs` 때문에 node_modules 프로젝트를 Plug'n'Play 로 보던 경우가 사라지고, 그런 프로젝트는 설치본 기준 판정(예: content 의 설치 위치)을 다시 받아요.
  - dependencies 항목의 `@axis-ds/*` 설치 확인 대상에 워크스페이스 루트 선언(앱에 없는 것)을 넣어요. 설치되지 않았으면 「워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다: … → <설치 명령>」 WARN 이고, 「워크스페이스 루트에 선언: …」 표시에도 들어가요. 설치돼 있으면 PASS 이고 「N개 확인」 수만 늘어요. 종료 코드는 그대로예요.
  - Tailwind 4 animation 은 CSS 줄마다 그 줄이 가리키는 패키지(`@import "tw-animate-css"` 는 `tw-animate-css`, `@plugin "tailwindcss-animate"` 는 `tailwindcss-animate`)의 선언 · 설치본을 봐요. 줄은 있는데 선언이나 설치본이 없으면 「애니메이션 플러그인을 쓸 수 없습니다」 WARN 이에요(지금까지는 줄만 보고 PASS, 실제 빌드는 실패). 다른 이름의 플러그인만 설치된 경우도 PASS 가 아니에요. 종료 코드는 그대로예요.
  - `pnpFallbackMode: all` 처럼 루트 선언을 해석해 주는 Yarn 설정은 읽지 않아 이 경우에도 FAIL 이 나요(종료 코드 0 에서 1). 앱 `package.json` 에 선언하면 사라져요.

- 5d47e47: `axis theme list` · `axis theme info` 와 MCP `axis.list_brands` · `axis.get_brand` 의 `@axis-ds/tokens` 설치 안내가 선언 출처를 따라요(WI-0093).
  - 앱 `package.json` 이나 워크스페이스 루트(pnpm · yarn)에 선언돼 있으면 미설치 안내가 범위를 붙인 추가 명령 대신 「설치: <pm> install」이에요. 종전 추가 명령은 루트에만 선언한 앱에 새 선언을 만들고, 앱 선언 범위를 다시 썼어요.
  - npm 워크스페이스 루트에 선언돼 있으면 「설치: 워크스페이스 루트에서 npm install」이에요(앱 디렉터리의 `npm install` 은 루트 선언을 설치하지 않아요).
  - 루트 선언 설치본이 브랜드를 지원하지 않으면(1.3.0 미만) 「워크스페이스 루트 package.json 의 @axis-ds/tokens 선언을 ^1.3.0 이상으로 올리고 설치하세요.」, 빌드 전이면 재설치를 install 로 안내해요.
  - Yarn Plug'n'Play 에서 앱에 선언이 있으면 설치 명령 대신 「Plug'n'Play 설치라 설치본을 판정하지 못해 브랜드를 읽을 수 없습니다」를 내요. 경계는 `theme add` 와 같아서 PnP 와 앱 디렉터리에 자체 lockfile 이 있는 앱은 루트 선언을 보지 않아요(종전 추가 명령).
  - `axis theme add` 는 앱에 선언된 tokens 가 설치되지 않았으면 「설치: <pm> install」을, 설치본이 빌드 전이면 선언 출처(앱 · 루트)와 상관없이 `theme list` 와 같은 재설치 안내(npm 루트 선언이면 「워크스페이스 루트에서 npm install」)를 더해요. Yarn Plug'n'Play 에서 앱에 선언이 있으면 설치 · 재설치 · 업그레이드 줄 대신 `theme list` 와 같은 판정하지 못했다는 한 줄을 내요.
  - 선언이 없으면 안내는 종전과 같아요. 판정은 registry-core 공용 헬퍼(`dependencyInstallGuide`)로 cli · mcp 가 같이 써요.

## 1.4.4

### Patch Changes

- 9b58ca1: `axis check` · MCP `axis.check_project` 의 `tailwind.content` 가 pnpm 기본 레이아웃에서 실경로가 같은 상위 설치본(`../../node_modules/...`)과 `.pnpm` 스토어 실경로를 상대 경로로 쓴 glob 을 덮은 것으로 봐요(WI-0090). 종전에는 실제 Tailwind 3 빌드가 같은 클래스를 만드는데도 FAIL 이었어요.
  - 실경로가 다른 상위 설치본(다른 버전 등)을 가리키면 종전대로 FAIL 이고, 문구에 그 이유를 붙여요(실측: 루트 1.8.1 · 앱 1.8.2 에서 그 경로는 Select placeholder 클래스 하나를 놓침)
  - 제안 glob 과 그 밖의 문구는 그대로예요

## 1.4.3

### Patch Changes

- d7ae4a5: ontology 브랜드에 남아 있던 대비 미달을 고쳤어요(WI-0079). Progress warning 만 AXIS 원시색 노랑이고 나머지는 v1 팔레트 안의 값이에요. 기본 브랜드 값은 그대로예요. 디자인 오너 확인 문서의 권장안으로 먼저 반영했고, 오너가 다른 값을 고르면 다시 발행해요.
  - `--axis-form-control-border` · `--axis-form-control-track`(Checkbox · Radio · Textarea 경계, Switch 꺼짐 · Slider 트랙): 라이트 `sub` #6B7280 · 다크 `muted` #7A828D. 페이지 · card · panel 바탕 위 최저 라이트 4.39 · 다크 4.11(종전 1.08~1.42), Switch 흰 썸 대 트랙 4.83 · 3.89
  - `--axis-progress-fill-success` · `-destructive`: `ink-2` · `bad-dark`(라이트 #2A2F36 · #A8281F, 다크 #D0D4D9 · #F49890). 트랙 위 라이트 11.39 · 5.94(종전 success 1.93)
  - `--axis-progress-fill-warning`: AXIS 원시색 노랑, 라이트 yellow-700 #A16207 · 다크 yellow-500 #EAB308(다크는 종전 값). 트랙 위 라이트 4.16 · 다크 7.12(종전 라이트 1.62). destructive(빨강)와 색상이 갈리도록 v1 팔레트 밖의 노랑을 썼어요(v1 에는 노랑이 없어요)
  - `--axis-input-text-placeholder`: 라이트 `sub-aa` #5F6673 · 다크 `sub` #9CA3AD(입력 바탕 위 5.78 · 6.92, 종전 라이트 2.61). WI-0025 부록 B ② 의 「`muted` 는 placeholder 에만」 처리를 철회했어요. Textarea placeholder 와 같은 값이에요
  - Input · Select 트리거 테두리 `--axis-input-border-default`(부록 B ③ 예외)는 바꾸지 않았어요
  - mcp 는 tokens 를 올리면 함께 올리는 규칙(check-changeset-mcp-tokens)에 따라 올려요. 동봉 토큰 데이터(`dist/data/tokens.json`)는 기본 브랜드 값만 담아 이번 변경으로 바뀌지 않아요

## 1.4.2

### Patch Changes

- 7d1915b: 설치 · 실행 안내가 대상 프로젝트의 패키지 매니저를 따라요(WI-0085). 종전에는 일부 안내가 lockfile 판정을 거치지 않고 `pnpm` 으로 고정이라 npm · yarn 프로젝트에도 pnpm 명령이 나왔어요.
  - `axis template apply` 의 「필요한 의존성」 · MCP `axis.apply_template`: 대상 디렉터리의 매니저로 `npm install …` · `npm install -D …` · `yarn add …` · `yarn add -D …` · `pnpm add …` 를 내고, 다른 안내처럼 범위를 따옴표로 감싸요(`"react@^19.0.0"`, `^` 가 셸에서 사라지지 않게). 매니저는 템플릿 파일을 쓰기 전의 프로젝트로 골라요.
  - `axis template init` 의 다음 단계: `npm install` · `npm run dev`, `yarn install` · `yarn dev`, `pnpm install` · `pnpm dev` 가운데 새 프로젝트 디렉터리에 맞는 것.
  - `axis theme list` · `axis theme info` · MCP `axis.list_brands` · `axis.get_brand` 의 tokens 빌드 전 안내: 워크스페이스 빌드 명령이 `pnpm --filter @axis-ds/tokens build` · `npm run build -w @axis-ds/tokens` · `yarn workspace @axis-ds/tokens build` 로 매니저를 따라요. MCP 브랜드 도구의 설치 · 업그레이드 · 재설치 명령도 CLI 처럼 `targetDir` 의 매니저를 따라요(종전 pnpm 한 가지).
  - `axis monet import` 다음 단계의 의존성 설치 줄도 현재 디렉터리의 매니저를 따라요.
  - 설치 명령 판정(`axis init` · `axis theme add` · `axis add` · `axis check` 등 모든 안내 공통): 앱 층과 워크스페이스 루트 층에 lockfile 이 없으면 `package.json` 의 `packageManager`(`npm@…` · `yarn@…` · `pnpm@…`, 앱 다음 같은 워크스페이스 루트)를 봐요. lockfile 이 있으면 종전처럼 lockfile 이 먼저이고, 모르는 이름(`bun@…` 등)은 무시해 종전 기본값 `pnpm` 이에요. 그래서 lockfile 없이 `packageManager` 만 있는 프로젝트는 이미 lockfile 을 따르던 안내도 npm · yarn 명령으로 바뀌어요.
  - lockfile · `packageManager` 가 없는 프로젝트의 명령은 종전과 같아요. 다만 template apply · init 의 pnpm 의존성 줄에는 따옴표가 붙어요.
  - MCP `axis.get_brand` 도구 설명의 예시를 `defaultBrand` 대신 실제 응답과 같은 `<html data-brand>` · `setBrand` 로 고쳤어요.

- 7d1915b: 워크스페이스(모노레포) 앱에서 Tailwind · 컴포넌트 패키지 판정과 의존성 안내가 워크스페이스 루트 `package.json` 의 선언도 봐요(WI-0086). 종전에는 `dependencies` 항목만 루트 선언을 인정하고 나머지 판정은 앱 선언만 봐서, 같은 화면에서 판정이 갈렸어요.
  - `axis check` · `axis.check_project`: 루트에만 `@axis-ds/ui-react` 를 선언한 Tailwind 3 앱에 `tailwind.content` · `animation` 항목이 새로 나와요. `content` 가 컴포넌트 경로를 덮지 않으면 `tailwind.content` FAIL 이라 종료 코드가 0 에서 1 로 바뀔 수 있어요(실제 빌드에서 컴포넌트 클래스가 만들어지지 않던 상태예요. 제안 경로를 `content` 에 넣으세요).
  - 루트에만 `tailwindcss` ^4 를 선언하고 아직 설치하지 않은 앱은 Tailwind 4 로 판정해 「tailwind.config 파일이 없습니다」 FAIL 이 사라져요(종료 코드 1 에서 0). Tailwind 4 의 1.4.0 안내 · 컴포넌트 `tailwind.css` 안내, Tailwind 3 preset 버전 게이트, brand 의 `@axis-ds/theme` 버전 게이트도 루트 선언을 근거로 써요(설치본이 있으면 종전처럼 설치본이 먼저).
  - `axis init`: 루트에 선언된 `clsx` · `tailwind-merge` 를 앱 `package.json` 에 다시 쓰지 않고 「워크스페이스 루트에 선언: …」으로 알려요. 루트에만 `tailwindcss` ^4 가 있으면 앱에 새로 쓰는 `tailwind-merge` 범위가 `^2.6.0` 에서 `^3.4.0` 으로 바뀌어요(Tailwind 4 판정). Tailwind 4 안내의 「@axis-ds/tokens 설치:」 · 컴포넌트 `tailwind.css` 줄도 루트 선언을 봐요(루트에 있는 tokens 를 앱에 다시 설치하라고 하지 않아요). `axis add` · MCP `axis.install_component` 의 의존성 안내에서도 루트에 선언된 것은 빠져요.
  - `--dir` · MCP `targetDir` 를 앱 디렉터리를 가리키는 심볼릭 링크로 줘도 실경로와 같은 판정이에요(종전에는 링크 쪽 상위를 올라가 루트 · 설치본을 못 찾았어요).
  - `axis theme add`: 루트에만 `tailwindcss` ^4 를 선언한(미설치) 앱에서 전역 CSS 에 넣는 기본 토큰 줄이 Tailwind 3 의 `@import "@axis-ds/tokens/css"` · `@import "@axis-ds/tokens/css/shadcn"` 에서 `@import "@axis-ds/tokens/css/tailwind4"` 로 바뀌어요(Tailwind 판정이 루트 선언을 보기 때문). 같은 자리의 컴포넌트 `tailwind.css` 줄은 아직 앱 선언만 봐서, 루트에만 `@axis-ds/ui-react` 가 있으면 넣지 않아요(WI-0087).
  - 워크스페이스가 아닌 상위 · `.git` 너머의 선언은 여전히 인정하지 않고, 쓰기는 앱 `package.json` 에만 해요. `axis theme add` 가 루트 선언을 앱 `package.json` 에 다시 쓰는 경로는 이번에 바꾸지 않았어요(WI-0087).

## 1.4.1

### Patch Changes

- 79c3208: Tailwind 3 프로젝트의 `tailwind.content` 판정(`axis check` · `axis.check_project`)과 `axis theme add` 의 content 안내가 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 실제 설치 위치를 따라요(WI-0080). 종전에는 표본 · 제안을 `./node_modules/<pkg>` 로 고정해서 npm workspaces · pnpm hoisted 모노레포에서 실제 위치 `../../node_modules/...` 를 넣어도 FAIL 이었고, 제안대로 `./node_modules/...` 를 넣으면 클래스가 하나도 생기지 않는데 PASS 였어요.
  - 호이스팅 앱의 제안은 `"../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"` 이고, 상위 경로는 Tailwind 3 가 빌드를 실행한 디렉터리 기준으로 풀린다는 안내(`relative: true` 권장)가 함께 나와요.
  - `./**/*.{js,mjs}` 같은 glob 은 `../` 를 넘지 않으므로 호이스팅 설치본을 덮은 것으로 보지 않아요. 실제 설치 위치를 가리키는 절대경로 glob 은 인정해요(pnpm `.pnpm` 스토어 실경로 포함). 중괄호 안에 깊이가 다른 경로를 섞은 glob(`{./src,../../node_modules/...}/**`)은 갈래마다 판정해요.
  - 설치본이 앱 `node_modules` 에 있는 구조(pnpm 기본 · 단일 프로젝트)와 설치본이 없거나 Plug'n'Play 인 경우의 판정 · 문구는 그대로예요(절대경로 glob 인정만 달라짐).

- 79c3208: 워크스페이스(모노레포) 앱에서 설치 안내 명령과 `dependencies` 판정이 워크스페이스 루트를 봐요(WI-0081). 종전에는 lockfile 과 의존성 선언을 앱 디렉터리 한 층에서만 봐서, npm · yarn 워크스페이스 앱에 `pnpm install` · `pnpm add` 를 안내했고, 루트에만 `tailwindcss` 를 선언한 앱을 「필수 의존성 누락」 FAIL(종료 코드 1)로 판정했어요.
  - 설치 명령(`axis init` 의 「설치:」 · 애니메이션 안내, `axis theme add` 의 토큰 · theme 설치 안내, `axis add` · MCP `axis.install_component` 의 의존성 명령, `axis check` · `axis.check_project` 의 미설치 안내): 앱에 lockfile 이 없으면 가장 가까운 워크스페이스 루트(`pnpm-workspace.yaml` 이나 `package.json` `workspaces`)의 lockfile 을 따라요. 그 전에 `.git` 이 나오거나 루트를 못 찾으면 종전처럼 `pnpm install` 이에요. 앱에 lockfile 이 있으면 그것이 먼저이고, `packageManager` 필드는 보지 않아요.
  - `dependencies`(`axis check` · `axis.check_project`): 앱에 선언이 없으면 워크스페이스 루트 `package.json` 의 선언도 인정하고 문구에 「워크스페이스 루트에 선언: …」을 붙여요. 그런 앱의 `axis check` 종료 코드가 1 에서 0 으로 바뀔 수 있어요. 워크스페이스가 아닌 상위 디렉터리의 선언은 여전히 FAIL 이에요.
  - lockfile 과 상관없이 pnpm 으로 고정된 안내(template apply · MCP brand · template 등)는 이번에 바꾸지 않았어요(WI-0085).

## 1.4.0

### Minor Changes

- 4a5e185: 토큰 도구(`axis.list_tokens` · `axis.get_token`)의 데이터를 빌드 때 `@axis-ds/tokens` 빌드 산출물에서 생성합니다(WI-0076). 1.3.5 까지 동봉한 손 사본은 처음 만든 뒤 갱신되지 않아 41개 가운데 16개 값이 tokens 1.8.0 과 달랐어요(예: `colors.primary` 가 `hsl(222.2 47.4% 11.2%)`, 실제 `hsl(221 39% 11%)`).
  - 토큰 309개(tokens 1.8.0 기준): 기존 경로 36개는 그대로 두고 tokens 의 모든 변수를 더했어요. 밀도 토큰(`control.h.md` · `radius.control` 등 15개)과 shadcn 변수 `card` · `popover` · `input` · `chart-1~5` · `radius` 가 새로 나와요.
  - 항목마다 다크 값(`dark`)과 실제로 정의된 CSS 변수 이름을 함께 돌려줘요. `path` 는 기존 경로, tokens 이름 기반 경로(예: `space.5`), CSS 변수 이름(예: `--axis-control-h-md`)을 받아요.
  - 응답 계약 변경: tokens 에 원천이 없던 `shadow.md` · `animation.duration.fast` · `animation.duration.normal` · `animation.duration.slow` · `animation.easing.default` 5개 경로를 뺐고, `category` 의 `animation` 을 빼고 `density` · `component` 를 더했어요. 없는 경로의 `axis.get_token` 은 `isError: true` 로 답해요. `cssVariable` 을 바로잡았어요: `radius.none` · `sm` · `lg` · `full` 은 존재하지 않는 `--radius-*` 에서 `--axis-radius-*` 로, `radius.md` 는 shadcn 변수 `--radius`(0.5rem, 값 0.375rem 과 다름)에서 `--axis-radius-md` 로 바뀌어요(값은 그대로). `axis.list_tokens` 표 열은 `경로 | 값 | 다크 | CSS | 설명` 으로 바뀌어요.
  - 브랜드 값은 계속 `axis.list_brands` · `axis.get_brand` 가 맡아요.

### Patch Changes

- 4a5e185: `axis check` · `axis.check_project` 의 Tailwind 판정과 Tailwind 4 버전 안내가 설치본을 프로젝트 디렉터리부터 상위로 찾아요(WI-0074). 종전에는 `node_modules` 한 층만 읽어 npm workspaces · pnpm hoisted 모노레포에서 설치본을 못 찾고 선언(`latest` · `^1.3.0` · 선언 없음)으로 판정해 거짓 FAIL · WARN 이 났어요(예: 앱 선언 `tailwindcss: "latest"` 이면 「tailwind.config 파일이 없습니다」 FAIL).
  - 같은 판정을 쓰는 `axis init`(tailwind-merge 범위 · Tailwind 4 버전 안내), `axis theme add`(Tailwind 4 기본 CSS), `axis template apply`(major 경고), `axis add`(tailwind-merge 범위)도 상위 설치본을 따라요.
  - 가장 가까운 설치본이 앞서고, Plug'n'Play(`.pnp.cjs`)면 종전처럼 선언으로 판정해요. 설치본이 프로젝트 디렉터리에 있는 구조는 판정이 바뀌지 않아요.

## 1.3.5

### Patch Changes

- f3dae65: 배치 4 접근성 묶음(WI-0062 · WI-0063 · WI-0069 · WI-0073)의 업그레이드 안내예요. 문서 사이트 59경로 x 기본 · ontology x 라이트 · 다크(236회) axe 검사에서 위반 0, 판정 보류(incomplete) 중 4.5 미만 대비 0 을 확인했어요. **ontology 브랜드의 기존 토큰 값은 바뀌지 않아요.**

  컴포넌트를 그대로 쓰면 코드를 바꿀 필요가 없어요. 아래에 해당하면 확인하세요.
  - **기본 테마 토큰 값을 직접 참조**한다면(CSS `var(--axis-...)` · tokens JS 값 · 복사한 값) 아래 변수의 값이 바뀌었어요. 새 값은 WI-0062 · WI-0063 릴리스 노트 「업그레이드」 표에 있어요. 그 변수가 놓이는 바탕(아바타 · 버튼 비활성 바탕 · 상태 점 글리프는 그 위 글자)과의 대비가 커지는 쪽이에요. 라이트에서는 짙어지고, 다크에서는 입력 경계 · hover · diff 삭제 글자처럼 밝아지는 것도 있어요. 하나 예외로 다크 `--axis-button-border-focus` 는 라이트와 같은 #3B82F6 이 되어 다크 바탕 대비가 7.92 에서 5.47 로 줄었어요(3:1 이상).
    - 라이트 · 다크: `--axis-input-border-default` · `--axis-input-border-hover` · `--axis-button-border-focus` · `--axis-agent-avatar-assistant` · `--axis-agent-avatar-tool` · `--axis-diff-removed-text` · `--axis-status-running-contrast` · `--axis-status-neutral-muted-contrast`
    - 라이트만: `--axis-input-text-placeholder` · `--axis-border-warning` · `--axis-diff-added-text` · `--axis-button-text-disabled` · shadcn `--destructive`
    - 다크만: `--axis-button-bg-disabled` · `--axis-status-success-contrast`
  - **상태 색(`--axis-status-*`)을 글자나 아이콘에** 쓰고 있다면 `--axis-text-success` · `--axis-text-warning` · `--axis-text-error` · `--axis-text-tertiary` 로 바꾸세요. 상태 색 값은 그대로이고 점 · 막대 · 바탕용이에요.
  - **회색 바탕(`--axis-surface-secondary` · `-tertiary`) 위 보조 글자**는 `--axis-text-tertiary` 대신 `--axis-text-secondary` 를 쓰세요.
  - **점 위 글리프 색(`--axis-status-*-contrast`)** 중 running(전체) · success(다크) · neutral-muted 가 흰색에서 짙은 색으로 바뀌었어요. 성공 바탕 버튼 글자로 썼다면 `--axis-button-text-default` 로 바꾸세요.
  - **새 변수** `--axis-form-control-border` · `--axis-form-control-track` · `--axis-progress-fill-{default,success,warning,destructive}` 를 ui-react 와 library 사본이 참조해요. 각 참조에는 1.7.0 이 읽던 변수(`--axis-border-default` · `--axis-surface-tertiary` · `--axis-surface-brand` · `--axis-color-{green,yellow,red}-500`)를 fallback 으로 두어서, 1.7.0 tokens 와 섞여도 1.7.0 렌더로 물러나요. 3:1 대비는 `@axis-ds/tokens` 1.8.0 이상과 함께 쓸 때 나와요.
  - **CSS 변수를 덮어써서 테마 · 브랜드를 만들었다면**(`:root` · `[data-theme]` · `[data-brand]` 블록) 새 변수도 함께 덮어쓰세요. 1.8.0 에서 `Progress` 채움은 `--axis-surface-brand` · `--axis-color-{green,yellow,red}-500` 대신 `--axis-progress-fill-{default,success,warning,destructive}`, `Checkbox` · `RadioGroupItem` · `Textarea` 경계는 `--axis-border-default` 대신 `--axis-form-control-border`, `Switch` 꺼짐 · `Slider` 트랙은 `--axis-surface-tertiary` 대신 `--axis-form-control-track` 을 써요. 예전 변수만 덮어쓰면 그 컴포넌트는 기본값(파랑 채움 · gray.500 경계)으로 남아요. 예시는 테마 커스터마이징 가이드 「2. CSS 변수 오버라이드」 · 「5. 커스텀 테마 생성」에 있어요.
  - **cli · mcp**: 동봉 레지스트리(toast · dialog · agentic 항목)가 새 소스로 바뀌어요. 이미 `axis add` 로 설치한 사본은 자동으로 바뀌지 않아요. 새 소스가 필요하면 `axis add <이름> --overwrite` 로 다시 받으세요(직접 고친 부분은 덮어써져요).
  - `MessageBubble` · `StepTimeline` 의 시각은 `timeZone` 을 주지 않으면 하이드레이션 뒤에 채워져요. 서버 렌더에서 시각을 바로 보이게 하려면 `locale` · `timeZone`(또는 `formatTime`)을 주세요.

- f3dae65: 기본 테마(브랜드 미지정)에서 4.5:1 에 못 미치던 글자 대비를 맞췄어요(WI-0062). ontology 브랜드 출력은 바뀌지 않아요.
  - tokens 기본값: `--axis-agent-avatar-assistant` purple.500 → purple.600 · `--axis-agent-avatar-tool` blue.500 → blue.600(흰 이니셜 3.95 · 3.67 → 5.38 · 5.17), `--axis-status-neutral-muted-contrast` 흰색 → gray.700(대기 단계 숫자 1.47 → 7.00), `--axis-diff-added-text` 라이트 green.600 → green.700 · `--axis-diff-removed-text` 라이트 red.600 → red.700 · 다크 red.400, `--axis-input-text-placeholder` 라이트 gray.400 → gray.500(다크 gray.400 유지), `--axis-button-text-disabled` 라이트 gray.500 → gray.600 · `--axis-button-bg-disabled` 다크 gray.700 → gray.800, shadcn 호환 `--destructive` 라이트 red.500 → red.600(흰 글자 3.76 → 4.83). 전역 `status.*` 값은 그대로예요.
  - ui-react `Toast` 설명에서 `opacity-90` 을 뺐어요(성공 · 경고 바탕 3.99 · 3.98, ontology 경고 · 오류 3.95 → 불투명 글자). `DropdownMenuShortcut` 은 포커스 바탕 위에서도 읽히게 `text-secondary` 를 써요.
  - agentic-ui: `TokenUsageIndicator` 경고 · 초과 글자는 `text-warning` · `text-error`, `DiffViewer` 헤더 `+N` · `-N` 은 `text-secondary` · `text-error`, 보기 탭 · 줄 번호와 `CodeBlock` 언어 배지 · `ContextPanel` 제공자 · 버전 · `ToolCallCard` 소요 시간은 회색 바탕 위라 `text-secondary` 를 써요.
  - cli · mcp: 동봉 레지스트리의 toast · agentic 5개 항목(code-block · context-panel · diff-viewer · token-usage-indicator · tool-call-card) 소스가 새 코드로 바뀌었어요.

- f3dae65: 기본 테마(브랜드 미지정)의 비텍스트 대비(WCAG 1.4.11, 3:1)를 맞췄어요(WI-0063). ontology 브랜드의 기존 토큰 값과 렌더 색은 바뀌지 않아요.
  - tokens 새 변수: `--axis-form-control-border` · `--axis-form-control-track`(기본 gray.500, 흰 바탕 4.83), `--axis-progress-fill-default` · `-success` · `-warning` · `-destructive`(기본 라이트 blue.600 · green.700 · yellow.700 · red.600, 다크 blue.500 · green.500 · yellow.500 · red.500). ontology 는 1.7.0 에서 그 자리에 그려지던 값을 그대로 가져요.
  - tokens 기본값: `--axis-input-border-default` gray.300(다크 gray.700) → gray.500(1.47 · 1.95 → 4.83 · 4.16), `--axis-input-border-hover` 라이트 gray.600 · 다크 gray.400, `--axis-button-border-focus` blue.400 → blue.500(흰 바탕 2.54 → 3.68), `--axis-border-warning` 라이트 yellow.500 → yellow.700(1.85 → 4.76), `--axis-status-running-contrast` 흰색 → gray.950, `--axis-status-success-contrast` 다크 흰색 → gray.950. 전역 `status.*` 점 · 막대 색은 그대로예요.
  - ui-react: `Checkbox` · `RadioGroupItem` · `Textarea` 경계는 `form-control-border`, `Switch` 꺼짐 · `Slider` 트랙은 `form-control-track`, `Progress` 채움은 `progress-fill-*` 를 써요.
  - agentic-ui: 성공 · 경고 · 대기 아이콘과 상태 점(PlanCard · ToolCallCard · ApprovalCard · CodeBlock · FeedbackButtons · AgentAvatar · StepTimeline · RunProgress 완료)은 `text-success` · `text-warning` · `text-tertiary`, 오류 아이콘은 `text-error` 를 써요. PlanCard · ToolCallCard 진행 스피너 arc 는 불투명이에요. RecoveryBanner · AttachmentCard 오류 테두리는 `border-error`, PlanCard 승인 글자는 `button-text-default` 예요.
  - cli · mcp: 동봉 레지스트리의 agentic 10개 항목(agent-avatar · approval-card · attachment-card · code-block · feedback-buttons · plan-card · recovery-banner · run-progress · step-timeline · tool-call-card) 소스가 새 코드로 바뀌었어요. ui-react 폼 컨트롤 library 사본은 새 토큰(tokens 1.8.0)을 참조해요.

- f3dae65: 문서 페이지 axe 에서 나온 비대비 접근성 결함을 고치고, 시각 표시에 하이드레이션 안전 prop 을 더했어요(WI-0069).
  - agentic-ui `MessageBubble` · `StepTimeline`: `locale` · `timeZone` · `formatTime` prop 을 더했어요. `timeZone`(StepTimeline 은 `locale` 도) 을 주지 않으면 시각을 하이드레이션 뒤에 브라우저 시간대로 채워, 서버와 브라우저 시간대가 달라 생기던 하이드레이션 오류(React #418)가 나지 않아요. 최종 표시는 이전과 같아요. 두 모듈 산출물에 `"use client"` 가 붙어요.
  - agentic-ui `MessageBubble` 전송 상태 아이콘이 `role="img"` 와 `aria-label` 로 읽혀요(역할 없는 span 의 aria-label, axe aria-prohibited-attr).
  - agentic-ui `CodeBlock` 코드 스크롤 영역이 Tab 으로 포커스를 받는 이름 있는 region 이에요(axe scrollable-region-focusable).
  - agentic-ui `DiffViewer` 추가 · 삭제 줄 수를 aria-label 대신 화면 낭독 전용 문장으로 읽어요.
  - agentic-ui `RecoveryBanner` 재시도 버튼이 description 이 없을 때 없는 id 를 `aria-describedby` 로 가리키지 않아요.
  - ui-react `Dialog` · `Sheet` · `Popover`: 닫힌 동안 트리거에 `aria-controls` 를 두지 않아요(없는 id 참조, axe aria-valid-attr-value). open · defaultOpen · onOpenChange 는 그대로이고, 세 모듈 산출물에 `"use client"` 가 붙어요.
  - ui-react `CommandSeparator` 가 listbox 안에서 `role="separator"` 대신 보조기술에서 숨긴 장식 요소예요(axe aria-required-children). 검색 중 숨김 · `alwaysRender` 는 그대로예요.
  - ui-react `ScrollArea` 뷰포트가 Tab 으로 포커스를 받아 키보드로 스크롤할 수 있어요.
  - cli · mcp: 동봉 레지스트리의 dialog · agentic 5개 항목(code-block · diff-viewer · message-bubble · recovery-banner · step-timeline) 소스가 새 코드로 바뀌었어요.

## 1.3.4

### Patch Changes

- 4f54bba: 배치 3 묶음 ①: Tailwind 3 CommonJS preset, ThemeProvider 브랜드 해제 유지 · 마크업 존중, check 판정 정확도 (WI-0072 · WI-0068 · WI-0070 · WI-0051)
  - tokens(WI-0072): CommonJS 의 `require("@axis-ds/tokens/tailwind")` 가 preset 객체 자체를 돌려줘요. 1.1.0~1.6.2 는 `{ default, axisKeyframes, axisAnimation }` 를 돌려줘 `module.exports` · `.cjs` 설정에서 preset 이 통째로 빠졌어요(회귀가 아니라 첫 발행부터의 결함). `.default` · `axisKeyframes` · `axisAnimation` 은 열거되지 않는 속성으로 남아 기존 `require(...).default` 와 이름 내보내기도 그대로예요. require 조건용 타입 `tailwind-preset.d.cts`(`export =`)와 import 조건용 `tailwind-preset.d.mts` 를 exports 에 연결했어요. 토큰 값은 바뀌지 않아요.
  - theme(WI-0068, 동작 변경): `setBrand(undefined)` 가 저장값을 지우지 않고 빈 문자열(「끔」)을 남겨 새로고침 뒤에도 꺼진 채 유지돼요. 초기 브랜드는 저장값 > 서버 마크업 `<html data-brand>` > `defaultBrand` 순서예요. 마크업과 `defaultBrand` 가 다르면 이제 마크업이 이겨요(1.6.2 까지는 `defaultBrand`). 마크업만 있는 구성도 마운트 때 지우지 않아요. 하이드레이션 첫 렌더는 서버와 같은 값(`defaultBrand`)으로 그리고 끝난 뒤 맞춰 `ctx.brand` 불일치가 나지 않아요. 언마운트하면 마운트 전 마크업 값으로 되돌려요. 1.6.2 이하로 내리면 빈 문자열을 저장값 없음으로 읽어 그 버전 동작으로 돌아가요.
  - cli · mcp(WI-0072 · WI-0068 · WI-0070 · WI-0051): `axis check` · `axis.check_project` 판정을 설치본 기준으로 바꿨어요. 설치본은 상위 디렉터리까지 찾는 공유 판독 함수 하나로 읽어요.
    - dependencies: 선언만 있고 설치되지 않으면 WARN 과 설치 명령(종전 「모두 설치되어 있습니다」 거짓 PASS). 선언된 `@axis-ds/*` 도 대상, Plug'n'Play 는 선언 기준
    - tailwind.config: CommonJS 설정의 `.default` 없는 bare require 는 설치본 tokens 1.7.0 미만이면 WARN(`.ts` · `.mjs` 의 export default 형태는 PASS)
    - brand.activation: 마크업 `data-brand` + `ThemeProvider` 만 있는 구성은 설치본 theme 1.7.0 미만이면 WARN
    - globals.css: AXIS 근거(tokens CSS import · `--axis-*` 정의 · 루트 레이아웃 JS import)가 있을 때만 PASS. 자체 `--background` · `--primary` 만 있으면 WARN(템플릿 4종은 WI-0067 까지 WARN). Tailwind 3 에서 create-next-app 기본 `body` 의 `font-family: Arial` 이 남으면 WARN
    - animation: Tailwind 3 은 `plugins` 배열 안의 참조로 판정(import 만 · 무관한 문자열은 PASS 아님), 「미설치」는 설치본 기준
    - `theme add`: CommonJS preset 안내를 모든 버전에서 되는 `require("@axis-ds/tokens/tailwind").default` 로, 넣은 import 줄 문구를 실제 위치 · 분류(컴포넌트 스캔 경로 · 브랜드 앞)대로, 마크업 + ThemeProvider 구성에는 theme 1.7.0 조건을 안내
    - WARN 만 늘어나고 FAIL 조건은 그대로라 종료 코드는 바뀌지 않아요

## 1.3.3

### Patch Changes

- 7b0e157: `axis init` · `axis theme add` · `axis check` 가 실제 프로젝트 구조와 브랜드 적용 전제를 다루도록 바꿨습니다(WI-0037 · WI-0041 · WI-0049 · WI-0065).
  - `axis init`: 경로 기본값을 프로젝트에서 찾습니다. `src/` 가 없으면 `componentsDir` 가 `./components/ui` 이고 `src/` 를 만들지 않습니다. `globalCss` · `tailwindConfig` 는 실제로 있는 파일을 기록하고, 찾지 못하면 기본값과 함께 알립니다.
  - `axis init` 재실행: init 이 다루는 키만 바꾸고 `brand` · `monetDir` · `template` 등 나머지 키와 순서 · 들여쓰기를 지킵니다. 기존 `componentsDir` 는 그대로 두고, 없는 파일을 가리키는 `globalCss` · `tailwindConfig` 는 찾은 파일로 바꾸며 알립니다. 애니메이션 플러그인이 없으면 안내 한 줄을 냅니다.
  - `axis theme add`: 브랜드 import 앞에 기본 토큰 CSS(Tailwind 3 `@axis-ds/tokens/css` · `css/shadcn`, Tailwind 4 `css/tailwind4` · 선언된 컴포넌트 패키지 `tailwind.css`)를 넣습니다. 규칙 뒤의 `@import` 는 맨 앞으로 옮기라고 알리고, Tailwind 3 preset · content 와 브랜드를 켜는 코드(`<html data-brand>` · `setBrand`)는 감지 결과로 안내합니다. 설치 안내는 lockfile 을 따르고 `@axis-ds/tokens` 기록 범위는 `^1.6.0` 입니다.
  - `axis check`: Tailwind 3 은 AXIS preset 이 있어야 PASS 입니다(종전에는 CSS 변수 문자열만 있어도 PASS). 해당할 때만 `brand.activation`(WARN) · `tailwind.content`(FAIL, 종료 코드 1) · `animation`(WARN) 항목을 더합니다.
  - `axis template init` 이 기록하는 `globalCss` 가 `./app/globals.css` 이고, `axis template apply` 는 Tailwind major 나 `src/app` 구조가 다르면 경고합니다.
  - MCP: `axis.check_project` 가 같은 공유 코어로 같은 항목 · 문구를 내고(도구 이름 · 입력 · 결과 모양은 그대로), `axis.get_brand` 의 Provider 예시가 `defaultBrand` 대신 `data-brand` · `setBrand` 이며, 설치 안내 범위가 `^1.6.0` 입니다.

## 1.3.2

### Patch Changes

- e6f6eef: 기본 테마(브랜드 미지정)에서 흰 글자와 일부 보조 글자가 WCAG AA 4.5:1 에 못 미치던 색을 고쳤습니다(WI-0029). primitive 값과 전역 `status-*` 는 그대로이고, 미달을 일으키던 component · semantic 참조만 한 단계 진하게 옮겼습니다. `data-brand="ontology"` 화면은 바뀌지 않고, `shadcn-compat.css` 는 아래 다크 `--muted-foreground` 한 줄만 바뀝니다.

  기본 화면에서 바뀌는 색(라이트 · 다크 공통이 아니면 테마를 적었습니다):
  - Button 기본 바탕 `--axis-button-bg-default · hover · active`: #3B82F6 · #2563EB · #1D4ED8 → #2563EB · #1D4ED8 · #1E40AF (흰 글자 3.67 → 5.16)
  - Button destructive 바탕 `--axis-button-destructive-bg-default · hover · active`: #EF4444 · #DC2626 · #B91C1C → #DC2626 · #B91C1C · #991B1B (흰 글자 3.76 → 4.82)
  - MessageBubble 사용자 바탕 `--axis-agent-message-user-bg`: #3B82F6 → #2563EB
  - 다크 보조 글자 `--axis-text-secondary` #9CA3AF → #D1D5DB, `--axis-text-tertiary` #6B7280 → #9CA3AF (다크 `--axis-button-text-disabled` 도 #9CA3AF 로 같이 바뀝니다). 다크 `--axis-input-text-placeholder` 는 #9CA3AF 그대로입니다
  - shadcn 호환 다크 `--muted-foreground`(`shadcn-compat.css` 의 `.dark`): `218 11% 65%`(#9CA3AF) → `216 12% 84%`(#D1D5DB). 종전처럼 `text.secondary` 에서 파생되어 함께 바뀝니다. 라이트 값과 그 밖의 줄은 그대로입니다
  - PlanCard 거절 hover 글자 `--axis-plan-card-reject-hover-text`: #EF4444 → 라이트 #B91C1C · 다크 #F87171

  새 CSS 변수 3개(PlanCard 전용, 기본값 라이트 / 다크):
  - `--axis-plan-card-approve-bg` #15803D / #15803D: 승인 버튼 바탕(종전 `--axis-status-success`)
  - `--axis-plan-card-approve-hover-bg` #166534 / #166534: 승인 버튼 hover 바탕(종전 `--axis-status-success-strong`)
  - `--axis-plan-card-reject-text` #B91C1C / #EF4444: 거절 버튼 글자(종전 `--axis-status-error`)

  PlanCard 는 이 새 변수를 씁니다. ontology 브랜드 CSS 에는 새 변수 3개를 종전과 같은 값(`status-success` · `status-success-strong` · `status-error`)으로 더해 화면이 바뀌지 않습니다.

  마이그레이션: 토큰 변수(`var(--axis-button-bg-default)` 등)로 색을 쓰고 있다면 할 일이 없습니다. 위 hex 값을 직접 적어 AXIS 버튼 색과 맞추던 곳(스크린샷 비교, 하드코딩한 #3B82F6 · #EF4444 등)은 새 값으로 고치세요. 자체 브랜드 CSS 로 PlanCard 색을 바꾸던 경우에는 승인 버튼 · 거절 글자가 이제 `--axis-status-*` 대신 새 변수 3개를 읽으므로, 같은 값을 새 변수에도 지정하세요.

  cli · mcp 는 동봉 레지스트리의 PlanCard(`agentic-plan-card`) 항목을 위 새 변수 3개를 쓰는 소스로 갱신합니다. `axis add plan-card` 는 원격 레지스트리(pages.dev)를 먼저 읽으므로, 받는 소스는 문서 사이트가 배포된 뒤부터 새 변수를 씁니다. 원격에 닿지 못해 동봉본으로 폴백할 때는 이 cli · mcp 버전부터 새 소스가 설치됩니다.

  `axis add plan-card` 로 PlanCard 소스를 이미 프로젝트에 복사해 간 경우, 토큰 패키지만 올려서는 승인 · 거절 버튼 대비가 고쳐지지 않습니다. 복사본은 여전히 `--axis-status-success` · `--axis-status-success-strong` · `--axis-status-error` 를 읽기 때문입니다. `axis add plan-card` 로 다시 받거나, 복사본의 className 3곳을 새 변수로 바꾸세요: `bg-[var(--axis-status-success)]` -> `bg-[var(--axis-plan-card-approve-bg)]`, `hover:bg-[var(--axis-status-success-strong)]` -> `hover:bg-[var(--axis-plan-card-approve-hover-bg)]`, 거절 버튼의 `text-[var(--axis-status-error)]` -> `text-[var(--axis-plan-card-reject-text)]`.

## 1.3.1

### Patch Changes

- 901fb35: 원격 레지스트리와 포함본을 `version` 이 아니라 항목 내용(sha256)으로 비교합니다(WI-0061). 레지스트리 `version` 은 `@axis-ds/ui-react` 버전을 따라가서, ui-react 만 새로 나오면 내용이 같아도 `axis list` · `axis add` 마다 「version 이 다릅니다」 안내가 떴습니다. 이제 실제로 내용이 다른 항목이 있을 때만 「내용이 다른 항목이 N개 있습니다(button, card …)」로 알리고, 원격을 우선 쓰는 동작은 같습니다. 항목에 sha256 이 없어 비교할 수 없으면 종전처럼 version 으로 판정합니다.

## 1.3.0

### Minor Changes

- d73447e: MCP 컴포넌트 도구가 레지스트리를 읽고 `npx @axis-ds/cli add` 와 같은 결과로 설치합니다(WI-0055).
  - `axis.install_component` 가 하드코딩 템플릿 5개(shadcn 원형) 대신 레지스트리 항목을 설치합니다. 의존 항목(`utils` · `agentic-a11y-labels`)을 함께 설치하고, import 를 설치 위치 기준 상대 경로로 바꾸며, 프로젝트 밖으로 나가는 경로 · 링크는 쓰지 않습니다. 종전에는 separator · dialog 등 5개 밖의 ui 와 agentic 전부가 설치되지 않았습니다.
  - 내용이 다른 기존 파일은 덮어쓰지 않고 건너뛰며 응답 첫머리에 건너뛴 수를 적습니다. `overwrite: true` 일 때만 덮어씁니다(종전에는 묻지 않고 덮어썼습니다).
  - `targetDir` 는 이미 있는 프로젝트 루트입니다. `axis.config.json` 이 있으면 그 배치, 없으면 `components/ui` · `components/agentic` 에 설치하고 알립니다. 없는 디렉터리는 만들지 않고 실패합니다. 여러 개는 `names` 배열로 줍니다.
  - 의존성은 설치하지 않고 lockfile 에 맞는 설치 명령을 안내합니다.
  - `axis.list_components` · `axis.search_components` 가 Core UI 10개 · Agentic UI 18개(28개)를 보여 주고, `category` 에 `ui` 를 더했습니다(종전 값은 그대로). `axis.get_component` 는 레지스트리의 설명 · 의존성 · 파일에 Props · 예제를 덧붙입니다.
  - 레지스트리는 `AXIS_REGISTRY_URL` → `axis.config.json` 의 `registry` → `https://axis-design-system.pages.dev/r` 순으로 읽고, 원격에 닿지 못하면 패키지에 포함된 레지스트리(`dist/registry`)를 씁니다. 응답에 사용한 주소와 출처를 항상 적습니다.
  - 보안: `axis.config.json` 의 `registry` 는 https 이고 루프백 · 사설 · 링크로컬 주소가 아닐 때만 씁니다. 아니면 무시하고 기본 주소로 조회하며 알리고, 쓰는 경우에도 리다이렉트를 따라가지 않습니다(신뢰할 수 없는 저장소의 config 로 내부망에 요청하는 것을 막음). 사내 레지스트리는 환경변수 `AXIS_REGISTRY_URL` 로 주세요(제한 없음). 판정은 IANA 특수 목적 주소(문서용 · 벤치마크 · 6to4 · Teredo · NAT64 등 포함) 전부이고, 연결 단계에서 고른 주소를 다시 판정해 DNS 리바인딩도 막습니다.
  - `@axis-ds/cli` 는 설치 코어를 MCP 와 공유하도록 내부 구조만 바꿨습니다. 명령 동작과 출력은 같습니다.

## 1.2.3

### Patch Changes

- 6b61f24: `axis.minu.best`(Cloudflare 403) 를 가리키던 기본 주소를 `https://axis-design-system.pages.dev` 로 바꿨습니다(WI-0056).
  - `axis template list` · `axis template init` 과 MCP 템플릿 도구(`axis.list_templates` 등)의 기본 템플릿 주소가 `https://axis-design-system.pages.dev/templates` 입니다. 종전에는 기본 설정에서 「템플릿 인덱스를 가져올 수 없습니다 (403)」로 실패했습니다. `AXIS_TEMPLATE_URL` 이 있으면 그것이 우선합니다(종전과 같음).
  - `axis init` · `axis template init` 이 기록하는 `$schema` 가 `https://axis-design-system.pages.dev/schema.json` 입니다. 이 주소에 `axis.config.json` 의 JSON Schema 를 새로 배포해, 에디터가 키 자동완성 · 오타 검사를 할 수 있습니다. 이미 있는 config 의 종전 `$schema` 값은 그대로 읽고, `axis init` 을 다시 실행하면 새 주소로 바뀝니다.
  - `axis.config.json` 이 없을 때 `axis add` 가 안내하는 문서 링크를 GitHub 의 Quick Start 문서로 바꿨습니다(종전 링크는 403).
  - `axis library` 수집 결과의 문서 링크 호스트를 pages.dev 로 바꿨습니다.

## 1.2.2

### Patch Changes

- 4f578fc: Tailwind CSS 4 프로젝트의 `axis init` 안내와 `axis check` 판정을 고쳤습니다(WI-0044).
  - `axis init`: Tailwind 4 이상이면 전역 CSS 에 넣을 줄(`@import "tailwindcss";` · `@import "@axis-ds/tokens/css/tailwind4";` · `package.json` 에 선언된 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `tailwind.css`)과 create-next-app 기본 `globals.css` 의 `:root` · `@theme inline` · `@media (prefers-color-scheme: dark)` · `body` 블록을 지우라는 주의를 출력합니다. `@axis-ds/tokens` 가 선언돼 있지 않으면 lockfile 에 맞춘 설치 명령(`@axis-ds/tokens@^1.4.0`)을 안내합니다. 선언된 `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 는 설치본(`node_modules/<패키지>/package.json` 의 정확한 `version`)을 먼저 보고, 1.4.0 이상이면 선언과 관계없이 안내하지 않고 미만이면 설치본 버전과 함께 `^1.4.0` 으로 올리는 명령을 냅니다(선언 하한을 읽을 수 없는 `catalog:` · `npm:` 등이면 명령 대신 선언이 가리키는 버전을 올리고 다시 설치하라는 줄). 설치본이 없으면 선언의 하한이 1.4.0 미만일 때 `^1.4.0` 으로 올리는 명령을, 하한을 읽을 수 없으면(`catalog:` · `latest` · `||` 등) 설치된 버전이 1.4.0 이상인지 확인하라는 줄을 냅니다. `workspace:` 프로토콜은 설치본과 관계없이 안내하지 않습니다. 파일은 고치지 않습니다.
  - `axis init`: Tailwind 4 에서는 존재하지 않는 `tailwind.config.ts` 를 `axis.config.json` 의 `tailwindConfig` 에 적지 않고, 대화형 실행에서도 묻지 않습니다.
  - `axis check` · MCP `axis.check_project`: Tailwind 4 에서 `@import "tailwindcss"` 가 있어도 같은 CSS 에 아래 문제가 있으면 WARN 을 냅니다. 종전에는 `@import "tailwindcss"` 만 있으면 PASS 였습니다. WARN 이라 종료 코드는 그대로 0 입니다.
    - 토큰 진입점 `@axis-ds/tokens/css/tailwind4` import 가 없음(넣을 import 줄을 보여 줌)
    - `package.json` 에 선언된 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `tailwind.css` import 가 없음(빠진 줄을 보여 줌). 그 패키지를 가리키는 `@source`(경로 문자열에 `@axis-ds/<패키지>` 가 들어 있음, 주석 · `@source not` 제외)를 직접 쓴 경우는 스캔 경로로 인정합니다.
    - 진입점이 있는데 create-next-app 기본 정의(`--background` 색값 · `--color-background: var(--background)` · `--font-mono: var(--font-geist-mono)` · `background: var(--background)` 류)가 남음(실제로 남은 정의 이름을 중복 없이 보여 줌)
    - 진입점이 있는데 `@axis-ds/tokens` 가 1.4.0 미만이거나 판정할 수 없음
    - `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `tailwind.css` 를 import 하는데 그 패키지가 1.4.0 미만이거나 판정할 수 없음
    - 여럿이면 이 순서로 `/` 로 이어 한 문구에 내고, 끝에 `(1.4.0 이상 필요: …)` · `(설치된 버전이 1.4.0 이상인지 확인하세요: …)` 를 한 번 붙입니다. 버전은 `axis init` 과 같은 함수로 설치본 → 선언 하한 → 판정 불가 순으로 보고, 설치본으로 판정했으면 `@axis-ds/tokens 설치본 1.3.0` 처럼 표시합니다(`workspace:` 는 제외).
  - `axis check` · MCP `axis.check_project` 의 Tailwind 3 항목: 설정 파일(`tailwind.config.ts` · `.js` · `.mjs` · `.cjs`)이 `@axis-ds/tokens/tailwind` preset 을 `require` · `import` 하면(주석 밖) `(@axis-ds/tokens/tailwind preset)` 을 붙여 PASS 입니다. 종전에는 preset 만 쓰는 `.ts` 가 WARN(AXIS 토큰 설정이 없습니다), `.js` · `.mjs` · `.cjs` 가 WARN(TypeScript 권장)이었습니다.
  - `axis check` · MCP `axis.check_project` 의 globals.css 항목: 변수를 직접 정의하지 않아도 `@axis-ds/tokens/css` · `css/shadcn` · `css/tailwind4` import 가 있으면 PASS 입니다(문구에 import 경로 표시). 종전에는 WARN(오탐)이었습니다.

  Tailwind 3 프로젝트의 `axis init` 출력 · `axis.config.json` 은 바뀌지 않았습니다. `axis check` 의 Tailwind 3 항목은 위 preset 인정만 더해졌고, `hsl(var(` · `--background` 로 PASS 이던 설정 파일의 문구는 그대로입니다. globals.css 항목은 Tailwind 버전과 관계없이 위 import 인정이 적용됩니다(변수를 직접 정의한 경우의 문구는 그대로).

## 1.2.1

### Patch Changes

- c364b82: `axis check` · MCP `axis.check_project` 의 Tailwind 구성 항목을 고쳤습니다(WI-0042). Tailwind 4 이상은 `tailwind.config` 파일 대신 전역 CSS 의 `@import "tailwindcss"` 를 보고(종전에는 설정 파일이 없다고 FAIL), Tailwind 3 은 `tailwind.config.mjs` · `.cjs` 도 인정합니다. `axis check` 는 FAIL 이 있으면 종료 코드 1 로 끝납니다(종전에는 항상 0). CI 에서 `axis check` 를 쓰고 있다면 FAIL 이 실패로 잡히게 됩니다.

## 1.2.0

### Minor Changes

- b43c921: feat: 브랜드 테마 명령과 MCP 브랜드 도구 추가 (WI-0028)
  - CLI `axis theme list` · `axis theme info <brand>` · `axis theme add <brand>` 를 더했어요. 대상 프로젝트에 설치된 `@axis-ds/tokens`(1.3.0 이상)의 `./brands` 산출물을 읽어요
  - `axis theme add` 는 globals.css 에 브랜드 `@import` 한 줄, `package.json` 에 `@axis-ds/tokens`, `axis.config.json` 에 `brand` 를 기록해요. 두 번 실행해도 결과가 같고, 설치는 실행하지 않고 안내만 해요
  - `axis check` 와 MCP `axis.check_project` 가 `axis.config.json` 의 `brand` 와 실제 import 가 맞는지 검사해요. `brand` 가 없는 프로젝트의 결과는 그대로예요
  - MCP 도구 `axis.list_brands` · `axis.get_brand` 를 더했어요(도구 16개 → 18개). CLI 와 같은 코어로 대상 디렉터리를 읽어요
  - CLI `--version` 과 MCP `serverInfo.version` 이 `package.json` 의 버전을 읽어요(종전 `0.1.0` 고정)

## 1.1.5

### Patch Changes

- c5964e8: fix: 레지스트리 도구가 번들 데이터를 찾지 못해 실패하던 결함 수정
  - 1.1.0 부터 1.1.4 까지 `axis.list_components` · `axis.list_tokens` · `axis.search_components` · `axis.get_component` · `axis.get_token` · `axis.install_component` 가 `ENOENT` 로 실패했어요. 번들 `dist/index.js` 는 `dist/data/` 에서 `components.json` · `tokens.json` 을 찾는데 빌드가 `dist/registry/data/` 로 복사하고 있었어요
  - 빌드의 데이터 복사 위치를 `dist/data/` 로 바꿨어요. 코드와 데이터 내용은 그대로예요

## 1.1.4

### Patch Changes

- chore: npm Trusted Publishing(OIDC) 배포 경로로 첫 발행하고, `repository.url`을 실제 저장소(`IDEA-on-Action/AXIS-Design-System`)로 정정
  - 코드 변경은 없어요. npm 패키지 페이지의 Repository 링크와 provenance 출처가 실제 저장소를 가리키게 돼요

## 1.1.3

### Patch Changes

- fix: 죽은 도메인 `ds.minu.best` 참조를 `axis.minu.best`로 통합
  - CLI 기본 `REGISTRY_URL`/`$schema`, 템플릿 URL을 살아있는 도메인으로 교체 (기존 `ds.minu.best`는 NXDOMAIN이라 컴포넌트/템플릿 fetch 실패)
  - 문서 URL 경로 정합: `getDocsUrl`이 `agentic`은 `/agentic/`, 그 외 카테고리는 `/components/`로 매핑 (기존 `/ui/`는 실 라우트 404)

## 1.1.0

### Minor Changes

- dc711a8: 외부 프로젝트 연동을 위한 패키지 설정 개선
  - @axis-ds/tokens: Dark mode CSS Variables 빌드 추가, shadcn 호환 CSS Variables (shadcn-compat.css) 생성, Tailwind CSS preset 추가
  - 전체 패키지: sideEffects 필드 추가, README 개선
  - examples/nextjs-app: 외부 프로젝트 연동 예제 추가
