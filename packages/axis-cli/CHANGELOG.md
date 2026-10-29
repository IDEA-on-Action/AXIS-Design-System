# @axis-ds/cli

## 1.7.7

### Patch Changes

- e2701fe: `axis check` · MCP `axis.check_project` 의 Tailwind 4 컴포넌트 `tailwind.css` 판정이 「선언됐는가」가 아니라 「이 앱에서 해석되는가」를 봐요(WI-0097). 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같고, `axis theme add` 도 같은 판정 함수를 써서 같은 레이아웃에서 두 명령의 결론이 같아요. 종료 코드는 바뀌지 않아요(새 판정은 모두 WARN).
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

- be61b74: `axis check` · MCP `axis.check_project` · `axis theme add` 가 Yarn Plug'n'Play 의 Tailwind 3 `content` 를 실제 빌드와 맞게 판정 · 안내해요(WI-0098). 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같아요.

  **업데이트 뒤 `axis check` 종료 코드가 1 에서 0 으로 바뀔 수 있어요.** unplugged 를 설정한 Plug'n'Play 프로젝트(`dependenciesMeta` 의 `unplugged: true`)에서 `content` 가 `.yarn/unplugged/*/node_modules/<패키지>` 를 가리키는 glob(상대 · 절대)으로 컴포넌트 패키지를 덮으면 지금까지는 FAIL 이었는데 이제 PASS 예요(실제 빌드에서 클래스가 정상으로 생성되는 경우). 앱 `package.json` 의 선언 범위에 맞는 버전의 unplugged 디렉터리만 인정해요. 종료 코드가 0 에서 1 로 바뀌는 경우는 없어요.
  - Plug'n'Play(`.pnp.cjs`)에서 `content` 가 `./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}`(agentic-ui 도 같음)나 넓은 `./**/*.{js,mjs}` 로만 컴포넌트 패키지를 덮으면 `tailwind.content` 가 PASS 에서 **WARN** 으로 바뀌어요. Plug'n'Play 에는 node_modules 가 없어 그 경로는 스캔되지 않고 컴포넌트 클래스가 생성되지 않았어요. Tailwind 의 `**` · `*` 는 `.yarn` 처럼 점으로 시작하는 디렉터리를 넘지 않아서, 앱이 Plug'n'Play 루트이고 unplugged 를 설정했어도 `./**` 는 WARN 이에요(unplugged 경로는 `.yarn` 을 글자 그대로 쓴 glob 만 인정). 종료 코드는 0 그대로예요.
  - Plug'n'Play 에서 패키지 경로가 없으면 FAIL 은 그대로이고, `./node_modules/...` 를 권하던 제안 대신 `require.resolve` 로 실제 위치를 넣는 동적 형태(정적으로 확인할 수 없어 WARN)를 먼저, unplugged 설정을 대안으로 안내해요. 안내에는 덮지 않은 패키지 이름이 들어가서 그대로 복사해 쓸 수 있어요. unplugged 를 설정한 프로젝트에서는 `.yarn/unplugged/*/node_modules/<패키지>/dist/**/*.{js,mjs}` 를 제안하고, 이미 unplugged 디렉터리가 있는 패키지는 `dependenciesMeta` 설정 안내를 빼요.
  - Plug'n'Play 에서 컴포넌트 패키지를 워크스페이스 루트에만 선언한 앱은 경로를 안내 · 인정하지 않고 「<패키지> 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요」를 내요. severity 는 종전과 같은 방향이에요(종전 PASS 는 WARN, 종전 FAIL 은 FAIL).
  - `axis theme add` 는 Plug'n'Play 에서 `./node_modules` glob 만 있을 때 content 안내를 내지 않던 것을 고쳐 check 와 같은 안내를 내요. 종료 코드는 0 그대로예요.
  - 상위 경로 안내 문구의 어미가 바뀌어요(「…풀려요」 → 「…풀립니다」, 종료 코드 · 판정 불변). `../` 로 시작하는 content 제안 뒤에 붙는 안내로, check · MCP · theme add 가 같은 문구를 써요. 상위 경로 설치본이 앱이 쓰는 설치본과 달라 덮음으로 보지 않을 때 목록 항목에 붙는 안내도 「…보지 않아요」 → 「…보지 않습니다」로 바뀌어요.
  - Plug'n'Play 가 아닌 레이아웃(npm · pnpm · Yarn node-modules · 단일 프로젝트)의 판정 · 종료 코드는 바뀌지 않고, 문구 · theme add 출력도 위 두 상위 경로 안내의 어미 말고는 그대로예요.

- 293500e: `axis check` · MCP `axis.check_project` 에서 전역 CSS 를 읽는 세 항목(Tailwind 4 의 `tailwind.config` · `globals.css` · Tailwind 4 의 `animation`)이 `axis.config.json` 의 `globalCss` 를 먼저 봐요(WI-0100a). 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같아요.

  **업데이트 뒤 `axis check` 종료 코드가 1 에서 0 으로 바뀔 수 있어요.** 아래 두 경우는 지금까지 `globals.css 파일을 찾을 수 없습니다` FAIL(종료 코드 1)이었는데 이제 `globalCss` 가 가리키는 파일을 판정해요.
  1. CSS 를 고정 후보(`globals.css` · `app/globals.css` · `src/app/globals.css` · `src/globals.css` · `styles/globals.css`) 밖에 두고 `globalCss` 로 가리킨 프로젝트(예: `axis init` 이 기록한 `./src/styles/globals.css`, `./styles/app.css`).
  2. `globalCss` 가 프로젝트 밖 파일(예: 모노레포의 `../shared/globals.css`)을 가리키는 프로젝트. check 는 그 파일을 읽기만 하고, `axis theme add` 는 종전대로 밖 파일에 쓰지 않아요.
  - `globalCss` 가 가리키는 파일이 있고 `.css` 이면 그 파일을 판정해요. 없으면 종전 후보 순서 그대로예요. 루트에 낡은 `globals.css` 가 있어 `brand` 항목(`app/globals.css`)과 다른 파일을 판정하던 경우가 사라져요(WARN 에서 PASS 로 바뀔 수 있어요).
  - 반대로 루트 `globals.css` 에 내용이 있고 `globalCss` 가 가리키는 파일은 비어 있으면 PASS 에서 WARN 으로 바뀌어요(종료 코드는 그대로). `globalCss` 를 실제로 쓰는 파일로 고치면 사라져요.
  - `globalCss` 를 쓰지 못하면 종전 후보로 넘어가고 세 항목 문구 끝에 이유를 붙여요. 없는 파일 · 디렉터리는 `(globalCss ./nope.css 없음)`(지금까지 `brand` 항목만 쓰던 표기), `.css` 가 아닌 파일은 `(globalCss ./package.json: .css 파일이 아님)` 이에요. `brand` 항목도 `.css` 가 아닌 파일을 버리고 후보를 판정해요(지금까지는 그 파일을 읽었어요).
  - `globalCss` 키가 없는 프로젝트의 출력은 바뀌지 않아요. 고를 CSS 가 하나도 없으면 종전처럼 `globals.css` FAIL 이에요. 예외는 후보 이름과 같은 디렉터리(예: 루트 `globals.css/`)가 있는 프로젝트 하나예요. 지금까지는 check 가 `EISDIR` 로 멈췄는데(종료 코드 1) 이제 그 후보를 건너뛰고 다음 후보를 판정해요.

- cdc7a71: `axis check` · MCP `axis.check_project` 가 전역 CSS 의 상대 경로 `@import`(`@import "./axis.css";` 등)로 들여온 프로젝트 안 CSS 의 근거 줄도 인정해요(WI-0100b). 두 패키지가 같은 공유 코어(registry-core)를 번들해 판정 · 문구가 같아요.
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

## 1.7.6

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

## 1.7.5

### Patch Changes

- bfc5511: `axis theme add` · `axis init` 이 워크스페이스 루트 `package.json` 에 선언된 의존성을 인정해요(WI-0087).
  - `theme add` 는 루트에 선언된 `@axis-ds/tokens` 를 앱 `package.json` 에 다시 쓰지 않고 「- package.json: @axis-ds/tokens <범위> 가 워크스페이스 루트에 선언돼 있어 앱 package.json 은 바꾸지 않음」을 내요. 설치본이 없으면 다음 줄에 「설치: <명령>」, 설치본이 1.3.0 미만이면 앱 기준 업그레이드 명령 대신 루트 선언을 올리라고 안내해요. 루트에 `@axis-ds/theme` 가 있으면 ThemeProvider 설치 안내를 내지 않아요.
  - `theme add` 는 Tailwind 4 에서 루트에만 선언한 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `tailwind.css` 줄을 설치본에 그 파일이 있을 때만 넣고, 없으면 넣지 않은 이유를 한 줄로 알려요.
  - `init` 의 애니메이션 플러그인 안내는 선언(앱 · 루트)과 설치본을 봐요. 선언 · 설치면 침묵, 선언만 있으면 「선언돼 있지만 설치되지 않았습니다」 안내예요. 앱에만 선언하고 설치하지 않은 경우와 Tailwind 3 에서 `tw-animate-css` 만 선언한 경우에도 새 안내가 나와요.
  - 루트 `devDependencies` 도 선언으로 인정해요. 앱만 따로 운영 설치 · 배포하면 루트 선언이 따라가지 않으니 앱 `package.json` 에 직접 선언하세요.
  - Yarn PnP 와 앱 디렉터리에 자체 lockfile 이 있는 앱은 종전 동작이에요. 쓰기는 계속 앱 파일에만 해요.

## 1.7.4

### Patch Changes

- 9b58ca1: `axis check` · MCP `axis.check_project` 의 `tailwind.content` 가 pnpm 기본 레이아웃에서 실경로가 같은 상위 설치본(`../../node_modules/...`)과 `.pnpm` 스토어 실경로를 상대 경로로 쓴 glob 을 덮은 것으로 봐요(WI-0090). 종전에는 실제 Tailwind 3 빌드가 같은 클래스를 만드는데도 FAIL 이었어요.
  - 실경로가 다른 상위 설치본(다른 버전 등)을 가리키면 종전대로 FAIL 이고, 문구에 그 이유를 붙여요(실측: 루트 1.8.1 · 앱 1.8.2 에서 그 경로는 Select placeholder 클래스 하나를 놓침)
  - 제안 glob 과 그 밖의 문구는 그대로예요

## 1.7.3

### Patch Changes

- d7ae4a5: `SelectTrigger` 의 placeholder 글자가 `--axis-input-text-placeholder` 색으로 보여요(WI-0082). 종전에는 `placeholder:` 클래스가 Trigger(button)에 붙어 있었는데, `::placeholder` 는 input · textarea 에만 적용돼서 placeholder 글자(`SelectValue`)가 입력한 값과 같은 진한 색으로 보였어요.
  - 값이 없을 때 Radix 가 Trigger 에 붙이는 `data-placeholder` 상태에 글자색을 줘요(`[&[data-placeholder]>span]:text-[var(--axis-input-text-placeholder)]`). Trigger 가 아니라 안내 글자 span 에만 줘서 화살표 아이콘은 종전 색(3:1 이상)을 유지해요
  - 기본 브랜드 라이트 #6B7280 · 다크 #9CA3AF, ontology 라이트 #5F6673 · 다크 #9CA3AD 로 입력 바탕 위 4.5:1 이상이에요(Chromium 실측 4.83 · 7.93 · 5.78 · 6.92)
  - 값을 고른 뒤의 글자색은 그대로예요. `axis add select` 레지스트리 사본과 library 사본도 같은 소스로 바뀌어요
  - cli 는 동봉 레지스트리 사본(원격 레지스트리를 받지 못할 때 쓰는 폴백)에 바뀐 select 소스가 실리도록 함께 올려요

## 1.7.2

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

## 1.7.1

### Patch Changes

- 79c3208: Tailwind 3 프로젝트의 `tailwind.content` 판정(`axis check` · `axis.check_project`)과 `axis theme add` 의 content 안내가 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 실제 설치 위치를 따라요(WI-0080). 종전에는 표본 · 제안을 `./node_modules/<pkg>` 로 고정해서 npm workspaces · pnpm hoisted 모노레포에서 실제 위치 `../../node_modules/...` 를 넣어도 FAIL 이었고, 제안대로 `./node_modules/...` 를 넣으면 클래스가 하나도 생기지 않는데 PASS 였어요.
  - 호이스팅 앱의 제안은 `"../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"` 이고, 상위 경로는 Tailwind 3 가 빌드를 실행한 디렉터리 기준으로 풀린다는 안내(`relative: true` 권장)가 함께 나와요.
  - `./**/*.{js,mjs}` 같은 glob 은 `../` 를 넘지 않으므로 호이스팅 설치본을 덮은 것으로 보지 않아요. 실제 설치 위치를 가리키는 절대경로 glob 은 인정해요(pnpm `.pnpm` 스토어 실경로 포함). 중괄호 안에 깊이가 다른 경로를 섞은 glob(`{./src,../../node_modules/...}/**`)은 갈래마다 판정해요.
  - 설치본이 앱 `node_modules` 에 있는 구조(pnpm 기본 · 단일 프로젝트)와 설치본이 없거나 Plug'n'Play 인 경우의 판정 · 문구는 그대로예요(절대경로 glob 인정만 달라짐).

- 79c3208: 워크스페이스(모노레포) 앱에서 설치 안내 명령과 `dependencies` 판정이 워크스페이스 루트를 봐요(WI-0081). 종전에는 lockfile 과 의존성 선언을 앱 디렉터리 한 층에서만 봐서, npm · yarn 워크스페이스 앱에 `pnpm install` · `pnpm add` 를 안내했고, 루트에만 `tailwindcss` 를 선언한 앱을 「필수 의존성 누락」 FAIL(종료 코드 1)로 판정했어요.
  - 설치 명령(`axis init` 의 「설치:」 · 애니메이션 안내, `axis theme add` 의 토큰 · theme 설치 안내, `axis add` · MCP `axis.install_component` 의 의존성 명령, `axis check` · `axis.check_project` 의 미설치 안내): 앱에 lockfile 이 없으면 가장 가까운 워크스페이스 루트(`pnpm-workspace.yaml` 이나 `package.json` `workspaces`)의 lockfile 을 따라요. 그 전에 `.git` 이 나오거나 루트를 못 찾으면 종전처럼 `pnpm install` 이에요. 앱에 lockfile 이 있으면 그것이 먼저이고, `packageManager` 필드는 보지 않아요.
  - `dependencies`(`axis check` · `axis.check_project`): 앱에 선언이 없으면 워크스페이스 루트 `package.json` 의 선언도 인정하고 문구에 「워크스페이스 루트에 선언: …」을 붙여요. 그런 앱의 `axis check` 종료 코드가 1 에서 0 으로 바뀔 수 있어요. 워크스페이스가 아닌 상위 디렉터리의 선언은 여전히 FAIL 이에요.
  - lockfile 과 상관없이 pnpm 으로 고정된 안내(template apply · MCP brand · template 등)는 이번에 바꾸지 않았어요(WI-0085).

## 1.7.0

### Minor Changes

- 4a5e185: 입력이 닫힌 곳(CI · `</dev/null` · 빈 파이프)에서 질문이 남으면 「질문 한 줄만 찍고 아무것도 만들지 않은 채 rc 0」으로 끝나던 결함을 고쳐요(WI-0075). 질문의 성격에 따라 처리해요.
  - 기본값이 있고 파괴적이지 않은 질문은 기본값으로 진행하고 쓴 값을 한 줄 알려요: `axis template init <name>`(`--dir` 없음)은 `./<name>` 에 만들고, `axis init`(`-y` 없음)은 `-y` 와 같은 기본값으로 진행해요. 단 내용이 다른 기존 `utils.ts` 가 있으면 덮어쓰기 확인이라 진행하지 않고 rc 1 이에요(아무것도 쓰지 않음, `-y` 면 종전처럼 덮어씀).
  - 기본값이 없는 입력과 덮어쓰기 확인은 아무것도 쓰지 않고 rc 1 에 필요한 옵션을 안내해요: 이름 없는 `template init`, 비어 있지 않은 디렉터리의 `template init`, 충돌 파일이 있는 `template apply`, `v0 import` · `monet import`.
  - `axis template init` 에 `-y` 를 추가해요. 질문을 기본값으로 답하고, 비어 있지 않은 디렉터리도 진행해요(템플릿과 같은 경로의 파일은 덮어씀, `template apply -y` 와 같은 뜻).
  - 판정은 stdin 이 터미널인지 하나라, `printf 'x\n' | axis template init dashboard` 처럼 파이프로 응답을 넣던 스크립트는 이제 묻지 않고 기본값(`./dashboard`)으로 진행해요. 값은 `--dir` · `-y` 로 주세요.
  - 진입점이 명령을 끝까지 기다려요(`await program.parseAsync()`). 앞으로 가드를 빠뜨린 질문이 들어와도 rc 0 대신 rc 1(또는 Node 의 rc 13)로 드러나요. 다른 명령의 종료 코드는 그대로예요.

### Patch Changes

- 4a5e185: `axis check` · `axis.check_project` 의 Tailwind 판정과 Tailwind 4 버전 안내가 설치본을 프로젝트 디렉터리부터 상위로 찾아요(WI-0074). 종전에는 `node_modules` 한 층만 읽어 npm workspaces · pnpm hoisted 모노레포에서 설치본을 못 찾고 선언(`latest` · `^1.3.0` · 선언 없음)으로 판정해 거짓 FAIL · WARN 이 났어요(예: 앱 선언 `tailwindcss: "latest"` 이면 「tailwind.config 파일이 없습니다」 FAIL).
  - 같은 판정을 쓰는 `axis init`(tailwind-merge 범위 · Tailwind 4 버전 안내), `axis theme add`(Tailwind 4 기본 CSS), `axis template apply`(major 경고), `axis add`(tailwind-merge 범위)도 상위 설치본을 따라요.
  - 가장 가까운 설치본이 앞서고, Plug'n'Play(`.pnp.cjs`)면 종전처럼 선언으로 판정해요. 설치본이 프로젝트 디렉터리에 있는 구조는 판정이 바뀌지 않아요.

## 1.6.2

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

- f8a05be: `axis library publish` · `axis library refresh-axis` 가 만드는 library 데이터에서 같은 slug 의 항목끼리 상세 데이터가 섞이던 결함을 고쳤어요(WI-0060).
  - 상세 데이터 파일 키가 slug 에서 항목 id 로 바뀌었어요: `components/<slug>.json` → `components/<id>.json`(예: `components/axis-button.json` · `components/shadcn-button.json`). 항목마다 자기 파일을 가져서, 예전처럼 shadcn 상세에 AXIS 코드가 나오거나(25개) AXIS 상세에 shadcn 데이터가 나오지(5개) 않아요. 옛 이름의 파일은 `refresh-axis` 가 지워요.
  - 같은 상세 주소(`/library/<category>/<slug>`)를 쓰는 항목이 있으면 AXIS 항목이 slug 를 지키고, 나머지는 slug 가 `<source>-<slug>` 가 돼요(예: shadcn/ui button 은 `/library/ui/shadcn-button`). `index.json` · `search-index.json`(slug · url) · `categories/*.json` · 상세 파일에 같은 값을 써요. 카테고리가 다르면 주소가 달라 바꾸지 않아요. 한 주소에 AXIS 항목이 둘이거나 바꾼 뒤에도 겹치면 쓰지 않고 멈춰요.
  - `refresh-axis` 결과의 `shadowedAxis`(외부 파일과 겹쳐 파일을 못 가진 AXIS 항목)는 없어지고, slug 를 바꾼 항목을 알리는 `renamedSlugs` 가 생겼어요.
  - `components/<slug>.json` 을 직접 읽던 소비자는 `index.json` 에서 항목 id 를 찾아 `components/<id>.json` 을 읽어야 해요.

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

## 1.6.1

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

## 1.6.0

### Minor Changes

- 7b0e157: `axis init` · `axis theme add` · `axis check` 가 실제 프로젝트 구조와 브랜드 적용 전제를 다루도록 바꿨습니다(WI-0037 · WI-0041 · WI-0049 · WI-0065).
  - `axis init`: 경로 기본값을 프로젝트에서 찾습니다. `src/` 가 없으면 `componentsDir` 가 `./components/ui` 이고 `src/` 를 만들지 않습니다. `globalCss` · `tailwindConfig` 는 실제로 있는 파일을 기록하고, 찾지 못하면 기본값과 함께 알립니다.
  - `axis init` 재실행: init 이 다루는 키만 바꾸고 `brand` · `monetDir` · `template` 등 나머지 키와 순서 · 들여쓰기를 지킵니다. 기존 `componentsDir` 는 그대로 두고, 없는 파일을 가리키는 `globalCss` · `tailwindConfig` 는 찾은 파일로 바꾸며 알립니다. 애니메이션 플러그인이 없으면 안내 한 줄을 냅니다.
  - `axis theme add`: 브랜드 import 앞에 기본 토큰 CSS(Tailwind 3 `@axis-ds/tokens/css` · `css/shadcn`, Tailwind 4 `css/tailwind4` · 선언된 컴포넌트 패키지 `tailwind.css`)를 넣습니다. 규칙 뒤의 `@import` 는 맨 앞으로 옮기라고 알리고, Tailwind 3 preset · content 와 브랜드를 켜는 코드(`<html data-brand>` · `setBrand`)는 감지 결과로 안내합니다. 설치 안내는 lockfile 을 따르고 `@axis-ds/tokens` 기록 범위는 `^1.6.0` 입니다.
  - `axis check`: Tailwind 3 은 AXIS preset 이 있어야 PASS 입니다(종전에는 CSS 변수 문자열만 있어도 PASS). 해당할 때만 `brand.activation`(WARN) · `tailwind.content`(FAIL, 종료 코드 1) · `animation`(WARN) 항목을 더합니다.
  - `axis template init` 이 기록하는 `globalCss` 가 `./app/globals.css` 이고, `axis template apply` 는 Tailwind major 나 `src/app` 구조가 다르면 경고합니다.
  - MCP: `axis.check_project` 가 같은 공유 코어로 같은 항목 · 문구를 내고(도구 이름 · 입력 · 결과 모양은 그대로), `axis.get_brand` 의 Provider 예시가 `defaultBrand` 대신 `data-brand` · `setBrand` 이며, 설치 안내 범위가 `^1.6.0` 입니다.

## 1.5.4

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

## 1.5.3

### Patch Changes

- 901fb35: 원격 레지스트리와 포함본을 `version` 이 아니라 항목 내용(sha256)으로 비교합니다(WI-0061). 레지스트리 `version` 은 `@axis-ds/ui-react` 버전을 따라가서, ui-react 만 새로 나오면 내용이 같아도 `axis list` · `axis add` 마다 「version 이 다릅니다」 안내가 떴습니다. 이제 실제로 내용이 다른 항목이 있을 때만 「내용이 다른 항목이 N개 있습니다(button, card …)」로 알리고, 원격을 우선 쓰는 동작은 같습니다. 항목에 sha256 이 없어 비교할 수 없으면 종전처럼 version 으로 판정합니다.

## 1.5.2

### Patch Changes

- d73447e: MCP 컴포넌트 도구가 레지스트리를 읽고 `npx @axis-ds/cli add` 와 같은 결과로 설치합니다(WI-0055).
  - `axis.install_component` 가 하드코딩 템플릿 5개(shadcn 원형) 대신 레지스트리 항목을 설치합니다. 의존 항목(`utils` · `agentic-a11y-labels`)을 함께 설치하고, import 를 설치 위치 기준 상대 경로로 바꾸며, 프로젝트 밖으로 나가는 경로 · 링크는 쓰지 않습니다. 종전에는 separator · dialog 등 5개 밖의 ui 와 agentic 전부가 설치되지 않았습니다.
  - 내용이 다른 기존 파일은 덮어쓰지 않고 건너뛰며 응답 첫머리에 건너뛴 수를 적습니다. `overwrite: true` 일 때만 덮어씁니다(종전에는 묻지 않고 덮어썼습니다).
  - `targetDir` 는 이미 있는 프로젝트 루트입니다. `axis.config.json` 이 있으면 그 배치, 없으면 `components/ui` · `components/agentic` 에 설치하고 알립니다. 없는 디렉터리는 만들지 않고 실패합니다. 여러 개는 `names` 배열로 줍니다.
  - 의존성은 설치하지 않고 lockfile 에 맞는 설치 명령을 안내합니다.
  - `axis.list_components` · `axis.search_components` 가 Core UI 10개 · Agentic UI 18개(28개)를 보여 주고, `category` 에 `ui` 를 더했습니다(종전 값은 그대로). `axis.get_component` 는 레지스트리의 설명 · 의존성 · 파일에 Props · 예제를 덧붙입니다.
  - 레지스트리는 `AXIS_REGISTRY_URL` → `axis.config.json` 의 `registry` → `https://axis-design-system.pages.dev/r` 순으로 읽고, 원격에 닿지 못하면 패키지에 포함된 레지스트리(`dist/registry`)를 씁니다. 응답에 사용한 주소와 출처를 항상 적습니다.
  - 보안: `axis.config.json` 의 `registry` 는 https 이고 루프백 · 사설 · 링크로컬 주소가 아닐 때만 씁니다. 아니면 무시하고 기본 주소로 조회하며 알리고, 쓰는 경우에도 리다이렉트를 따라가지 않습니다(신뢰할 수 없는 저장소의 config 로 내부망에 요청하는 것을 막음). 사내 레지스트리는 환경변수 `AXIS_REGISTRY_URL` 로 주세요(제한 없음). 판정은 IANA 특수 목적 주소(문서용 · 벤치마크 · 6to4 · Teredo · NAT64 등 포함) 전부이고, 연결 단계에서 고른 주소를 다시 판정해 DNS 리바인딩도 막습니다.
  - `@axis-ds/cli` 는 설치 코어를 MCP 와 공유하도록 내부 구조만 바꿨습니다. 명령 동작과 출력은 같습니다.

- 006836a: `axis library` 의 AXIS 수집기가 문서 사이트에 없는 페이지로 링크하던 문제를 고쳤습니다(WI-0057).
  - 문서 링크는 문서 사이트에 그 페이지(`apps/web/src/app/(docs)/<경로>/page.tsx`)가 있을 때만 만듭니다. 이름이 다른 것은 별칭 표로 잇고(`approval-card` → `/agentic/approval-dialog`), 둘 다 없으면 링크를 비웁니다. 종전에는 이름 그대로 `/agentic/<이름>` 을 만들어 404 가 났습니다.
  - 문서 사이트 데모 페이지(`page.tsx`)를 컴포넌트로 잡지 않습니다. 패키지 루트의 단일 파일(`a11y.test.tsx` 등)과 컴포넌트 디렉터리 안의 테스트 · 스토리 파일도 수집하지 않습니다. 코드 파일 순서는 이름순입니다.
  - 설명은 컴포넌트 이름으로 선언된 곳 바로 앞의 JSDoc 을 먼저 씁니다(종전에는 파일의 첫 JSDoc 이라 Props 설명이 나오기도 했습니다).
  - `axis library refresh-axis` 를 더했습니다. AXIS 항목만 저장소 소스에서 다시 만들고 외부 소스(shadcn · monet) 항목은 그대로 둡니다. 원격에 접속하지 않고, 같은 소스로 다시 돌리면 아무 파일도 바뀌지 않습니다.

## 1.5.1

### Patch Changes

- 6b61f24: `axis.minu.best`(Cloudflare 403) 를 가리키던 기본 주소를 `https://axis-design-system.pages.dev` 로 바꿨습니다(WI-0056).
  - `axis template list` · `axis template init` 과 MCP 템플릿 도구(`axis.list_templates` 등)의 기본 템플릿 주소가 `https://axis-design-system.pages.dev/templates` 입니다. 종전에는 기본 설정에서 「템플릿 인덱스를 가져올 수 없습니다 (403)」로 실패했습니다. `AXIS_TEMPLATE_URL` 이 있으면 그것이 우선합니다(종전과 같음).
  - `axis init` · `axis template init` 이 기록하는 `$schema` 가 `https://axis-design-system.pages.dev/schema.json` 입니다. 이 주소에 `axis.config.json` 의 JSON Schema 를 새로 배포해, 에디터가 키 자동완성 · 오타 검사를 할 수 있습니다. 이미 있는 config 의 종전 `$schema` 값은 그대로 읽고, `axis init` 을 다시 실행하면 새 주소로 바뀝니다.
  - `axis.config.json` 이 없을 때 `axis add` 가 안내하는 문서 링크를 GitHub 의 Quick Start 문서로 바꿨습니다(종전 링크는 403).
  - `axis library` 수집 결과의 문서 링크 호스트를 pages.dev 로 바꿨습니다.

## 1.5.0

### Minor Changes

- 803769c: `axis add` 가 AXIS 레지스트리를 실제로 읽어 컴포넌트를 설치합니다(WI-0045). 종전(최초 배포 ~ 1.4.0)에는 레지스트리를 조회하지 않고 CLI 안에 박힌 shadcn 원형 button 하나만 설치했고, 나머지 이름은 모두 「찾을 수 없습니다」로 실패했습니다.
  - 레지스트리 조회: `AXIS_REGISTRY_URL` → `axis.config.json` 의 `registry` → 기본값(`https://axis-design-system.pages.dev/r`) 순으로 원격을 읽습니다. 원격을 읽지 못하면(접속 불가 · 타임아웃 · 오류 응답 · JSON 아님 · 형식 불일치) CLI 에 포함된 레지스트리로 설치하고 그 사실을 한 번 알립니다. 안내는 원격에 닿지 못한 경우(「접근하지 못해」)와 응답이 형식 검증을 통과하지 못한 경우(「형식 검증을 통과하지 못해」)를 구분합니다. 원격과 포함본의 version 이 다르면 원격을 우선 쓰면서 한 번 알립니다. 항목을 받는 도중 원격이 실패하면 처음부터 포함본으로 다시 받아 한 번의 add 에 두 출처를 섞지 않습니다. 종전에는 `registry` 설정과 `AXIS_REGISTRY_URL` 이 `axis init` 기록에만 쓰였습니다. 레지스트리 주소에 공백 · 사용자 정보 · 쿼리 · 해시가 있으면 요청하지 않고 포함본을 쓰며, 안내 · 오류에 찍히는 주소는 사용자 정보와 쿼리 · 해시 값(`?***` · `#***`)을 가립니다.
  - 여러 이름: `axis add button input card` 처럼 여러 개를 받습니다. 종전에는 첫 이름만 처리하고 나머지를 버린 채 rc 0 이었습니다. 이름이 하나라도 레지스트리에 없으면 없는 이름을 모두 알리고 아무것도 쓰지 않습니다(rc 1).
  - 함께 설치: `registryDependencies` 를 따라 `utils`(`cn`) · `agentic-a11y-labels` 를 함께 복사하고, import 를 설치 위치 기준 상대 경로로 바꿉니다. `registryDependencies` 가 레지스트리 URL 이면 지금 조회 중인 원격 주소나 공개 기본 주소(`https://axis-design-system.pages.dev/r`, 포함본은 공개 기본 주소만)로 시작하는 `<주소>/<이름>.json` 만 받아 그 이름으로 지금 읽는 레지스트리에서 찾고, 접두 없는 이름도 받습니다. 다른 호스트 · 경로, 공백 · userinfo · 쿼리가 든 URL, `@ns/이름` · 상대 경로 · 다른 확장자는 형식 불일치입니다. `package.json` 에 없는 의존성은 lockfile 에 맞춘 설치 명령으로 안내만 합니다(설치는 하지 않음). 레지스트리의 `dependencies` 값이 패키지 이름(선택적 `@범위`) 형태가 아니면 형식 불일치로 보고 포함본을 씁니다(안내 명령에 셸 메타 문자가 들어가지 않게).
  - 배치: Core UI 와 lib 은 `componentsDir`, Agentic UI 는 `axis.config.json` 의 `agenticDir`(없으면 `componentsDir` 옆 `agentic` 디렉터리)에 접두 없는 파일명으로 들어갑니다. 쓰기 전에 실제 경로(심볼릭 링크를 따라간 위치)가 프로젝트 디렉터리 안인지 확인하고, 밖이면 아무것도 쓰지 않습니다(`..ui` 같은 하위 이름은 안). 기존 대상 파일이 심볼릭 링크여도(프로젝트 밖을 가리켜도) 내용이 같거나 `-y` 로 건너뛰면 쓰지 않고 건너뛰며(밖이면 그 사실을 알림), 실제로 덮어써야 하는 링크만 아무것도 쓰지 않고 rc 1 로 알립니다. 덮어쓰기를 묻는 동안 같은 이름의 새 파일이 생기면 덮어쓰지 않고 rc 1 로 끝냅니다. 대상이 디렉터리이거나 기존 파일을 읽지 못하면 아무것도 쓰지 않고 rc 1 로 알립니다. 덮어써야 하는 파일이 다른 경로와 하드링크로 이어져 있으면(링크 수 2 이상) 쓰기 전에 그 경로와 이유를 알리고 아무것도 쓰지 않은 채 rc 1 로 끝내며, 쓰기 직전에도 연 파일로 한 번 더 확인합니다(내용이 같거나 `-y` 로 건너뛰는 파일은 영향 없음). 쓴 뒤 실제 위치를 다시 보고 밖이면(동시 경합) 그 파일은 지우지 않고 경로를 알린 뒤 rc 1 로 끝냅니다. 레지스트리 파일 경로가 절대 경로이거나 `..` · 역슬래시를 포함하거나 `.ts` · `.tsx` 가 아니면 거부합니다. `componentsDir` · `agenticDir` 의 역슬래시는 `/` 로 읽습니다.
  - `--agentic`: 이름 앞에 `agentic-` 를 붙여 찾는 별칭입니다(`add run-progress --agentic` = `add agentic-run-progress`). 종전에는 이 플래그가 무시됐고, 이미 붙였는데도 「--agentic 옵션을 추가하세요」라고 안내했습니다.
  - `axis list`: 레지스트리 index 의 Core UI 10개 · Agentic UI 18개를 그 이름(`agentic-run-progress` 등)으로 보여 줍니다. 종전에는 CLI 에 적힌 20개(레지스트리에만 있는 Agentic 8개 빠짐)를 접두 없는 이름으로 보여 줬습니다.
  - `axis init`: 만드는 `utils.ts` 를 레지스트리 `utils`(`@axis-ds/ui-react` 의 `cn` 과 같은 `extendTailwindMerge` 판)와 같은 내용으로 바꿨습니다. 그래서 `axis add` 가 끌어오는 utils 와 겹쳐도 「같은 내용」으로 건너뜁니다. 1.4.0 이하로 init 한 프로젝트의 `utils.ts`(twMerge 기본판)는 내용이 달라 `add -y` 가 건너뛰고 목록에 알립니다. `cn` 은 그대로 동작하고, 바꾸려면 `--overwrite` 를 씁니다. init 은 `AXIS_REGISTRY_URL` 값을 `axis.config.json` 에 기록하지 않습니다(기본값 또는 기존 config 값만 기록, 환경변수는 실행할 때만 우선). 종전에는 init 할 때 준 환경변수 값이 config 에 남았습니다. `utils.ts` 가 이미 있으면 「유지(이미 같은 내용)」 또는 「덮어씀」으로 알립니다. `utils.ts` 쓰기에는 add 와 같은 링크 규칙을 적용해, 심볼릭 링크면 내용이 같을 때 「유지(이미 같은 내용, 링크)」로 두고 내용이 다르거나 깨진 링크 · 디렉터리 · 읽을 수 없는 파일 · 하드링크면 아무것도 쓰지 않고(config 포함) 그 사실을 알린 뒤 rc 1 로 끝냅니다. 읽지 못한 파일을 「생성 완료」로 적던 문제도 고쳤습니다. config 가 이미 있으면 출력이 「생성 완료」가 아니라 「유지」 또는 「갱신」이고, 갱신 때 `registry` · `agenticDir` 는 기존 값을 지키며 빠지는 다른 키는 알립니다. 다만 `registry` 가 종전 기본값(`https://axis.minu.best/r`)이면 새 기본값으로 바꿔 쓰고 그렇게 알립니다.

  동작 변경(확인 필요):
  - 기본 레지스트리 주소를 `https://axis.minu.best/r` 에서 `https://axis-design-system.pages.dev/r` 로 바꿨습니다(`axis.minu.best` 는 Cloudflare 403). `axis init` 이 새 config 에 적는 값도 같습니다. 이미 config 의 `registry` 가 종전 기본값(`https://axis.minu.best/r`. 스킴 · 호스트 대소문자, `:443`, 경로 끝 `/` 차이는 같은 값으로 봄)인 프로젝트는 add · list 가 새 기본값으로 바꿔 조회하고 한 줄 알립니다(파일은 고치지 않음, config 를 고치거나 `axis init` 을 다시 실행하면 안내가 사라짐). 다른 주소는 그대로 쓰고, `AXIS_REGISTRY_URL` 이 있으면 그것이 우선입니다.
  - 덮어쓴 파일은 출력에서 `~ <경로> (덮어씀)` 로 표시합니다(새로 만든 파일은 `+`).
  - `-y` 의 뜻이 바뀌었습니다. 종전에는 묻지 않고 **덮어썼고**, 이제는 내용이 다른 기존 파일을 **건너뛰고** 그 목록을 알립니다. 덮어쓰려면 `--overwrite` 를 붙입니다(`-y --overwrite` 도 덮어씀). 대화형 실행은 내용이 다른 파일마다 묻고, 내용이 같은 파일은 묻지 않고 건너뜁니다. 터미널이 아닌 곳(CI · 파이프)에서는 묻지 않고 `-y` 와 같이 건너뜁니다.
  - `add button` 이 설치하는 파일 내용이 바뀌었습니다. 종전 button 은 shadcn 원형(`bg-primary` 계열, AXIS 색이 아님)이었고, 이제는 `@axis-ds/ui-react` 의 Button 과 같은 AXIS button 입니다. 종전 button 을 설치한 프로젝트에서 `add button -y` 를 다시 실행하면 내용이 달라 건너뜁니다. 바꾸려면 `--overwrite` 를 씁니다(파일을 고쳤다면 먼저 백업).
  - 종전 오류 문구 「네트워크 문제인 경우 인터넷 연결을 확인하세요」는 add 가 네트워크를 쓰지 않던 때의 잘못된 안내라 지웠습니다.

## 1.4.0

### Minor Changes

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

## 1.3.0

### Minor Changes

- c364b82: `axis check` · MCP `axis.check_project` 의 Tailwind 구성 항목을 고쳤습니다(WI-0042). Tailwind 4 이상은 `tailwind.config` 파일 대신 전역 CSS 의 `@import "tailwindcss"` 를 보고(종전에는 설정 파일이 없다고 FAIL), Tailwind 3 은 `tailwind.config.mjs` · `.cjs` 도 인정합니다. `axis check` 는 FAIL 이 있으면 종료 코드 1 로 끝납니다(종전에는 항상 0). CI 에서 `axis check` 를 쓰고 있다면 FAIL 이 실패로 잡히게 됩니다.

## 1.2.1

### Patch Changes

- 97e5d92: fix: `axis init` 이 utils.ts 의존성을 추가하고 실행 안내를 `@axis-ds/cli` 로 정정 (WI-0038)
  - `axis init` 이 만드는 `utils.ts` 가 import 하는 `clsx` · `tailwind-merge` 를 `package.json` 의 `dependencies` 에 없을 때만 추가해요(`clsx ^2.1.1`, `tailwind-merge` 는 설치된 tailwindcss 나 `package.json` 선언(범위면 하한)이 Tailwind 4 이상이면 `^3.4.0`, 3 이하이거나 판정할 수 없으면 `^2.6.0`). 판정할 수 없어 기본값을 썼거나 설치본과 선언이 다르면 경고 줄로 알려요. 이미 `dependencies` 나 `devDependencies` 에 있으면 범위를 그대로 둬요
  - 설치는 실행하지 않고 lockfile 로 고른 설치 명령(`pnpm install` · `yarn install` · `npm install`)을 안내해요. `package.json` 이 없거나 쓸 수 없으면 바꾸지 않고 추가 명령을 안내해요
  - `package.json` 의 키 순서 · 들여쓰기 · CRLF · 끝 줄바꿈 · BOM 을 유지하고, 다시 실행해도 결과가 같아요
  - CLI 출력과 문서의 실행 안내 `npx axis-cli ...` 를 `npx @axis-ds/cli ...` 로 고쳤어요. `axis-cli` 는 npm 에서 unpublish 된 다른 이름이라 실행하면 안 돼요

## 1.2.0

### Minor Changes

- b43c921: feat: 브랜드 테마 명령과 MCP 브랜드 도구 추가 (WI-0028)
  - CLI `axis theme list` · `axis theme info <brand>` · `axis theme add <brand>` 를 더했어요. 대상 프로젝트에 설치된 `@axis-ds/tokens`(1.3.0 이상)의 `./brands` 산출물을 읽어요
  - `axis theme add` 는 globals.css 에 브랜드 `@import` 한 줄, `package.json` 에 `@axis-ds/tokens`, `axis.config.json` 에 `brand` 를 기록해요. 두 번 실행해도 결과가 같고, 설치는 실행하지 않고 안내만 해요
  - `axis check` 와 MCP `axis.check_project` 가 `axis.config.json` 의 `brand` 와 실제 import 가 맞는지 검사해요. `brand` 가 없는 프로젝트의 결과는 그대로예요
  - MCP 도구 `axis.list_brands` · `axis.get_brand` 를 더했어요(도구 16개 → 18개). CLI 와 같은 코어로 대상 디렉터리를 읽어요
  - CLI `--version` 과 MCP `serverInfo.version` 이 `package.json` 의 버전을 읽어요(종전 `0.1.0` 고정)

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
