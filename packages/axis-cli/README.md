# @axis-ds/cli

AXIS Design System의 CLI 도구입니다. shadcn 호환 방식으로 컴포넌트를 프로젝트에 설치합니다.

## 설치

```bash
npm install -g @axis-ds/cli
# or
npx @axis-ds/cli
```

## 사용법

```bash
# 프로젝트 초기화
axis init

# 컴포넌트 추가(여러 개 가능)
axis add button input card

# Agentic UI 컴포넌트(아래 두 줄은 같음)
axis add agentic-run-progress
axis add run-progress --agentic

# 레지스트리에서 추가할 수 있는 컴포넌트 목록
axis list
```

## 컴포넌트 추가 (`axis add`) · 목록 (`axis list`)

- 레지스트리에서 항목을 읽어 복사합니다. 조회 순서는 `AXIS_REGISTRY_URL` → `axis.config.json` 의 `registry` → 기본값(`https://axis-design-system.pages.dev/r`)이고, 원격을 읽지 못하면 CLI 에 포함된 레지스트리를 쓰며 그 사실을 한 번 알립니다. 안내 문구는 원격에 닿지 못한 경우(접속 불가 · 타임아웃 · 오류 응답, 「원격 레지스트리에 접근하지 못해」)와 응답은 받았지만 내용이 검증을 통과하지 못한 경우(JSON 아님 · 형식 불일치 · sha256 불일치, 「원격 레지스트리 응답이 형식 검증을 통과하지 못해」)를 구분합니다.
- config 의 `registry` 가 종전 기본값 `https://axis.minu.best/r` 이면(앞뒤 공백을 떼고 스킴 · 호스트 소문자, `:443` 같은 스킴 기본 포트 제거, 경로 끝 `/` 모두 제거로 정규화해 비교. `http://` · `/rx` · 다른 호스트는 다른 값) 새 기본값으로 조회하고 「종전 기본 주소라 새 기본 주소로 조회해요. axis.config.json 의 registry 를 고치면 이 안내가 사라져요」를 한 줄 알립니다(파일은 고치지 않음). 다른 주소는 그대로 쓰고, `AXIS_REGISTRY_URL` 이 있으면 그것이 우선입니다.
- 레지스트리 주소에 공백 · 사용자 정보(`user:pass@`) · 쿼리 · 해시가 있으면 요청하지 않고 접근 실패 안내로 CLI 포함본을 씁니다. 안내 · 오류에 찍히는 주소는 사용자 정보를 `***` 로, 쿼리 · 해시 값을 `?***` · `#***` 로 가립니다. CLI 는 `AXIS_REGISTRY_PUBLIC_URL`(레지스트리 빌드 전용)을 읽지 않습니다.
- 이름이 하나라도 없으면 없는 이름을 모두 알리고 아무것도 쓰지 않습니다(rc 1). `--agentic` 은 이름 앞에 `agentic-` 를 붙여 찾는 별칭이고, 전체 이름을 써도 됩니다.
- `registryDependencies` 를 재귀로 따라가 `utils`(`cn`) · `agentic-a11y-labels` 같은 lib 항목도 함께 설치합니다. 값이 레지스트리 URL 이면 `<base>/<이름>.json` 형태만 받아 그 이름으로 지금 읽는 레지스트리(원격 또는 CLI 포함본)에서 찾습니다. `<base>` 는 원격을 읽을 때 지금 조회 중인 레지스트리 주소 또는 공개 기본 주소(`https://axis-design-system.pages.dev/r`)이고, CLI 포함본을 읽을 때는 공개 기본 주소입니다. 접두 없는 이름도 받습니다. 다른 호스트 · 경로, 공백 · userinfo(`user@`) · 쿼리가 든 URL, `@ns/이름` · 상대 경로 · `.json` 이 아닌 확장자 · 이름 규칙 위반은 형식 불일치로 봅니다.
- 배치: Core UI 와 lib 은 `componentsDir`(utils 는 `axis init` 이 쓰는 `componentsDir/utils.ts` 와 같은 위치), Agentic UI 는 `agenticDir`(없으면 `componentsDir` 옆 `agentic` 디렉터리). 레지스트리 형식의 import(`@/registry/<style>/lib/utils` 등)는 설치 위치 기준 상대 경로로 바꾸고, 설치 뒤 그 경로가 실제 파일을 가리키는지 확인합니다.
- 이미 있는 파일: 내용이 같으면 건너뜀, 다르면 대화형에서는 묻고, `-y` 는 건너뛰며 목록을 알려 주고, `--overwrite` 만 덮어씁니다. 터미널이 아닌 곳(CI · 파이프)에서는 묻지 않고 `-y` 와 같이 건너뜁니다. 출력은 새로 만든 파일 `+`, 덮어쓴 파일 `~ … (덮어씀)`, 같은 내용이라 건너뛴 파일 `=` 입니다. `--overwrite` 는 `registryDependencies` 로 끌려온 파일(예: 고친 `utils.ts`)도 덮어쓰니 출력의 `~` 를 확인하세요.
- 쓰기 전에 실제 경로(심볼릭 링크를 따라간 위치)가 프로젝트 디렉터리 안인지 확인하고, 밖이면 쓰지 않습니다. 기존 대상 파일이 심볼릭 링크여도 내용이 같거나 `-y` 로 건너뛰면 쓰지 않으므로 건너뜁니다(예: 앱 디렉터리 안의 공용 `utils.ts`, 또는 모노레포의 다른 패키지처럼 프로젝트 밖의 `utils.ts` 에 링크해 둔 경우). 밖을 가리키는 링크는 `= <경로> (같은 내용이라 건너뜀, 링크 대상이 프로젝트 밖)` 처럼 그 사실을 함께 알립니다(rc 0). 상위 디렉터리(`componentsDir` 등)가 밖을 가리키는 링크면 경로 이탈로 거부합니다. 설치 대상이 디렉터리(또는 디렉터리를 가리키는 링크)이거나 기존 파일을 읽지 못하면 이유를 알리고 아무것도 쓰지 않고 rc 1 입니다. 링크를 실제로 덮어써야 할 때(`--overwrite` · 대화형 예, 링크가 프로젝트 안 · 밖 어디를 가리켜도)만 아무것도 쓰지 않고 rc 1 로 알립니다. 덮어써야 하는 일반 파일이 다른 경로와 하드링크로 이어져 있으면(링크 수 2 이상) 쓰기 전에 그 경로와 이유를 알리고 아무것도 쓰지 않은 채 rc 1 로 끝내며, 쓰기 직전에도 연 파일로 한 번 더 확인합니다(내용이 같거나 `-y` 로 건너뛰는 파일은 영향 없음). 덮어쓰기를 묻는 동안 새로 설치할 파일과 같은 이름의 파일이 생기면 그 파일을 덮어쓰지 않고 경로를 알린 뒤 rc 1 로 끝냅니다. 검사와 쓰기 사이의 동시 경합은 사후 검사로 감지합니다: 쓴 파일의 실제 위치가 프로젝트 밖이면 그 파일을 지우지 않고 경로를 알린 뒤 rc 1 로 끝냅니다(그 위치의 파일은 사용자 것일 수 있어 CLI 가 지우지 않음).
- `package.json` 에 없는 의존성은 lockfile 에 맞춘 설치 명령으로 안내만 합니다(설치는 하지 않음). 안내 명령은 복사해 실행하는 셸 명령이라, 레지스트리의 `dependencies` 값이 패키지 이름(선택적 `@범위`) 형태가 아니면(`;` · `$` · 따옴표 등) 그 원격 응답을 형식 불일치로 보고 CLI 포함본을 씁니다.
- `axis.config.json` 의 `componentsDir` · `agenticDir` 에 역슬래시(`src\components\ui`)를 적어도 `/` 로 읽습니다.
- `axis list` 는 레지스트리 index 의 Core UI · Agentic UI 항목을 보여 줍니다(`--category ui|agentic`).

## 프로젝트 초기화 (`axis init`)

- `axis.config.json` 과 `cn()` 을 담은 `utils.ts` 를 만들고, `clsx` · `tailwind-merge` 가 `package.json` 에 없으면 `dependencies` 에 더합니다. 설치는 실행하지 않고 명령만 안내합니다.
- `axis.config.json` 의 `registry` 는 기본값(`https://axis-design-system.pages.dev/r`)이거나, 이미 있던 config 의 값입니다. 종전 기본값 `https://axis.minu.best/r` 는 Cloudflare 403 이라 바꿨습니다. add · list 는 그 값을 새 기본값으로 바꿔 읽으며 한 줄 알립니다(위 「컴포넌트 추가」, 파일은 고치지 않음). init 을 다시 실행하면 그 값을 새 기본값으로 바꿔 쓰고 「registry 를 새 기본 주소로 갱신」으로 알립니다. 사용자가 지정한 다른 값은 init 도 그대로 둡니다.
- `utils.ts` 가 이미 있으면 같은 내용이면 「유지(이미 같은 내용)」(다시 쓰지 않음), 다르면 init 의 utils 로 덮어쓰고 「덮어씀」으로 알립니다(터미널이 아닌 곳에서 `-y` 없이 실행하면 덮어쓰지 않고 rc 1, 아래 「터미널이 아닌 곳에서 실행」). `utils.ts` 쓰기는 `axis add` 와 같은 규칙입니다: 심볼릭 링크면 같은 내용일 때 「유지(이미 같은 내용, 링크)」로 두고, 내용이 다른 링크(프로젝트 안 · 밖) · 깨진 링크 · 디렉터리 · 읽을 수 없는 파일 · 다른 경로와 하드링크로 이어진 파일은 쓰지 않고 그 사실을 알린 뒤 rc 1 입니다. 이 판정은 쓰기 전에 하므로 이때는 `axis.config.json` · `package.json` 도 쓰지 않습니다. 다른 경로와 하드링크로 이어진 `axis.config.json` 을 다시 써야 할 때도 같습니다.
- 경로 기본값(`-y` 값 · 대화형 초기값)은 실제 프로젝트를 보고 정합니다(1.6.0 부터). `componentsDir` 는 `src/` 가 있으면 `./src/components/ui`, 없으면 `./components/ui` 이고 `src/` 를 새로 만들지 않습니다. `globalCss` 는 `app/globals.css` · `src/app/globals.css` · `styles/globals.css` · `src/styles/globals.css` · `globals.css` 가운데 실제로 있는 첫 파일, `tailwindConfig` 는 있는 `tailwind.config.{ts,js,mjs,cjs}` 가운데 첫 파일입니다. 찾지 못하면 기본값을 기록하고 그 사실을 한 줄 알립니다. Tailwind 4 안내 제목도 이 경로를 씁니다.
- config 가 이미 있으면 출력이 「생성 완료」가 아니라 사실대로 「유지(이미 같은 내용)」 또는 「갱신」입니다. 갱신은 init 이 다루는 키(`$schema` · `componentsDir` · `tailwindConfig` · `globalCss` · `registry`)만 바꾸고, 그 밖의 키(`brand` · `monetDir` · `template` · `agenticDir` 등)는 값과 순서를 그대로 둡니다(1.6.0 부터, 이전에는 빠졌음). 들여쓰기도 기존 파일을 따릅니다. 기존 `componentsDir` 는 그대로 두고, `globalCss` · `tailwindConfig` 는 가리키는 파일이 있으면 그대로, 없으면 찾은 파일로 바꾸고 알립니다(찾지 못하면 그대로 두고 알림). Tailwind 4 이상이면 `tailwindConfig` 를 지우고 알립니다. `registry` 가 종전 기본값이면 위처럼 새 기본값으로 바꿉니다. `AXIS_REGISTRY_URL` 은 config 에 기록하지 않고 add · list 를 실행할 때만 우선합니다.
- 애니메이션 플러그인(`tailwindcss-animate` · `tw-animate-css`)이 `package.json` 에 없으면, Dialog · Select 등의 열고 닫는 애니메이션에 필요하다는 안내 한 줄을 냅니다(Tailwind 3 은 plugins, Tailwind 4 는 `@import "tw-animate-css";`). 1.7.5 부터 선언은 앱 다음 워크스페이스 루트 `package.json` 까지 보고, 이름은 `axis check` 와 같습니다(Tailwind 3 은 `tailwindcss-animate` 만, Tailwind 4 는 `tw-animate-css` · `tailwindcss-animate` 둘 다). 선언과 설치본이 모두 있으면 안내하지 않고, 선언만 있고 설치본이 없으면 「선언돼 있지만 설치되지 않았습니다」와 설치 명령 · 설정 줄을 냅니다. Yarn PnP 는 루트 선언을 인정하지 않고 앱 선언이 있으면 안내하지 않습니다.
- `tailwind-merge` 범위와 아래 안내는 프로젝트의 Tailwind 버전(설치본, 없으면 `package.json` 선언)으로 정합니다. 판정하지 못하면 Tailwind 3 으로 봅니다.
- Tailwind 4 이상이면 전역 CSS 에 넣을 줄을 안내합니다. CSS 파일은 고치지 않습니다.

  ```css
  @import "tailwindcss";
  @import "@axis-ds/tokens/css/tailwind4";
  @import "@axis-ds/ui-react/tailwind.css"; /* npm 패키지 컴포넌트를 쓸 때, agentic-ui 도 같은 방식 */
  ```

  - 컴포넌트 패키지 줄은 `package.json` 에 선언된 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 만큼 냅니다. 선언이 없으면 예시 한 줄만 냅니다(`axis add` 로 복사한 컴포넌트는 프로젝트 소스라 따로 넣을 필요가 없습니다).
  - create-next-app 기본 `globals.css` 의 `:root` · `@theme inline` · `@media (prefers-color-scheme: dark)` · `body` 블록이 AXIS 와 같은 이름(`--background` · `--foreground` · `--color-background` · `--font-sans` · `--font-mono`)을 다른 값으로 정의하니 지우라는 주의를 함께 냅니다(Quick Start 가이드 「Tailwind CSS 4」와 같은 내용).
  - `@axis-ds/tokens` 가 `package.json` 에 없으면 lockfile 에 맞춘 설치 명령(예: `pnpm add "@axis-ds/tokens@^1.4.0"`)을 안내합니다. 토큰 진입점은 1.4.0 부터 있습니다.
  - `package.json` 에 선언된 `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 버전 조건(`axis check` 와 같은 함수 · 같은 판정). 설치본을 먼저 보고, 없으면 선언 범위를 봅니다:
    - 설치본: `node_modules/<패키지>/package.json` 의 `version` 이 정확한 버전이면 그것으로 판정합니다. 1.4.0 이상이면 선언이 `^1.3.0` · `1.x` · `catalog:` 여도 안내하지 않고, 미만이면(`1.4.0-beta.1` 포함) 설치본 버전을 보여 주며 `^1.4.0` 으로 올리는 명령을 냅니다(예: `설치본(@axis-ds/tokens 1.3.0, 선언 ^1.4.0)을 올리세요: pnpm add "@axis-ds/tokens@^1.4.0"`). 다만 설치본이 미만이어도 선언 하한을 읽을 수 없으면(`catalog:` · `npm:` · `latest` · `||` 등) 명령을 내지 않고 선언이 가리키는 버전을 1.4.0 이상으로 올린 뒤 다시 설치하라는 줄만 냅니다(선언을 덮어쓰지 않음).
    - 설치본이 없을 때 선언 범위의 하한이 1.4.0 미만이면(예: `^1.3.0` · `1.x` · `1.3.0 - 1.5.0` · `^1.4.0-beta.1`) 그 패키지들을 `^1.4.0` 으로 올리는 명령(예: `pnpm add "@axis-ds/tokens@^1.4.0"`)을 냅니다. 하이픈 범위는 왼쪽 버전을, 비교자 여러 개(`>=1.2 >=1.4`)는 가장 높은 하한을 봅니다.
    - 하한을 읽을 수 없으면(`catalog:` · `latest` · `||` · `<2` · `*` 등) 선언을 덮어쓰는 명령 대신 「설치된 버전이 1.4.0 이상인지 확인하세요」를 냅니다.
    - `workspace:` 프로토콜은 모노레포 링크라 설치본과 관계없이 안내하지 않습니다(링크된 패키지의 `version` 은 배포 전 소스의 값이라 1.4.0 미만이어도 진입점이 없다는 근거가 아닙니다).
  - Tailwind 4 에는 설정 파일이 없으므로 `axis.config.json` 에 `tailwindConfig` 를 적지 않고, 대화형 실행에서도 묻지 않습니다. Tailwind 3 은 종전과 같습니다.

## 브랜드 테마 (`axis theme`)

프로젝트에 설치된 `@axis-ds/tokens`(1.3.0 이상)의 브랜드를 조회하고 적용합니다. 세 명령 모두 `-d, --dir <path>` 로 대상 디렉터리를 받습니다(기본: 현재 디렉터리).

```bash
# 설치된 브랜드 목록 (이름 · 설명 · 테마)
axis theme list

# 브랜드 상세: import 경로 · Provider 예시 · 주요 토큰 · 보정 내역(a11y 메타)
axis theme info ontology

# 브랜드 적용: 전역 CSS import · package.json 의존성 · axis.config.json 의 brand
axis theme add ontology
```

- `axis theme add` 는 `axis.config.json` 의 `globalCss` → `app/globals.css` → `src/app/globals.css` → `styles/globals.css` → `src/styles/globals.css` → 루트 `globals.css` 순으로 찾은 파일의 앞쪽 import 구간 끝(`@tailwind` 등 규칙보다 앞)에 줄을 넣습니다. 1.6.0 부터 브랜드 import 앞에 기본 토큰 CSS 도 넣습니다: Tailwind 3 은 `@axis-ds/tokens/css` · `@axis-ds/tokens/css/shadcn`, Tailwind 4 는 `@axis-ds/tokens/css/tailwind4` 와 `package.json` 에 선언된 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `tailwind.css` 입니다. 1.7.5 부터 워크스페이스 루트에만 선언한 패키지는 설치본에 `tailwind.css` 가 실제로 있을 때만 넣고, 없으면(미설치 · 1.4.0 미만) 넣지 않은 이유를 한 줄로 알립니다. 이미 있는 줄은 다시 넣지 않으므로 여러 번 실행해도 같습니다. 규칙 뒤에 있는 기존 `@import` 는 CSS 규칙상 무시될 수 있어 맨 앞으로 옮기라고 알립니다(Next.js 15 는 위치와 관계없이 앞으로 끌어올려 적용함을 측정).
- `package.json` 에 `@axis-ds/tokens` 가 없으면 `dependencies` 에 `^1.6.0`(1.6.0 부터, 이전에는 `^1.3.0`)을 더하고 설치 명령만 안내합니다. 설치는 실행하지 않습니다. 설치 · 업그레이드 안내 명령은 lockfile 로 고릅니다(`npm install` · `yarn add` · `pnpm add`). lockfile 이 없으면 `package.json` 의 `packageManager`(`npm@…` · `yarn@…` · `pnpm@…`)를 보고, 둘 다 없으면 `pnpm` 입니다(1.7.2 부터 `packageManager` 를 봄).
  - 1.7.5 부터 `@axis-ds/tokens` 가 워크스페이스 루트 `package.json`(`dependencies` · `devDependencies`)에 선언돼 있으면 앱 `package.json` 에 쓰지 않고 「워크스페이스 루트에 선언돼 있어 앱 package.json 은 바꾸지 않음」으로 알립니다. 설치본이 없으면 설치 명령을, 업그레이드 안내 때는 루트 선언을 올리라는 줄을 더합니다. 루트에 `@axis-ds/theme` 가 있으면 ThemeProvider 설치 안내를 내지 않습니다. 앱만 따로 운영 설치 · 배포하면 루트 선언이 따라가지 않으니 앱에 직접 선언합니다. Yarn PnP 와 앱 디렉터리에 자체 lockfile 이 있는 앱은 루트 선언을 보지 않습니다(종전).
- 브랜드 CSS 는 `[data-brand="<brand>"]` 선택자로 적용되므로 루트 레이아웃의 `<html data-brand>` 나 `ThemeProvider` 의 `setBrand` 가 있어야 화면이 바뀝니다. 코드는 고치지 않고, 레이아웃에서 찾지 못하면 두 방법의 예시를 냅니다(`defaultBrand` 는 `@axis-ds/theme` 1.6.2 이하에서 `setBrand(undefined)` 로 끈 상태가 새로고침 뒤 유지되지 않아 예시에 쓰지 않습니다). 마크업 `data-brand` 와 `ThemeProvider` 를 함께 쓰는 레이아웃이면 theme 1.7.0 이상이 필요하다고 한 줄 더 알립니다(1.6.1 부터). Tailwind 3 이면 preset · content 가 빠졌을 때 넣을 줄도 안내합니다(설정 파일은 고치지 않음). preset 안내는 1.6.1 부터 CommonJS 에서 모든 tokens 버전에 되는 `require("@axis-ds/tokens/tailwind").default` 입니다(1.6.0 의 `.default` 없는 형태는 tokens 1.6.2 이하에서 preset 이 빠짐).
- 넣은 import 줄의 출력은 1.6.1 부터 실제 위치 · 분류를 따릅니다. 컴포넌트 `tailwind.css` 는 「컴포넌트 스캔 경로, 위치 무관」, 기본 토큰 CSS 는 브랜드 줄보다 앞에 들어갔을 때만 「브랜드 앞」이고 뒤에 들어가면 옮기라고 경고합니다.
- `@axis-ds/tokens` 가 없거나 1.3.0 미만이면 목록 대신 설치 · 업그레이드 안내를 내고 종료 코드 1 로 끝납니다.
  - 1.7.6 부터 `theme list` · `theme info` 의 안내는 선언 출처를 따릅니다. 앱이나 pnpm · yarn 워크스페이스 루트에 선언돼 있으면 「설치: <pm> install」, npm 워크스페이스 루트에 선언돼 있으면 「설치: 워크스페이스 루트에서 npm install」, 루트 선언이 1.3.0 미만이면 루트 선언을 올리라는 줄, 빌드 전 재설치도 install 입니다. Yarn PnP 에서 앱에 선언이 있으면 설치본을 판정하지 못했다는 한 줄을 냅니다. 선언이 없으면(또는 PnP · 앱 자체 lockfile 이라 루트 선언을 보지 않으면) 종전 추가 명령입니다.
  - 같은 1.7.6 부터 `theme add` 는 앱에 선언된 tokens 가 설치되지 않았으면 「설치: <pm> install」을, 설치본이 빌드 전이면 선언 출처(앱 · 루트)와 상관없이 `theme list` 와 같은 재설치 안내(npm 워크스페이스 루트 선언이면 「워크스페이스 루트에서 npm install」)를 더합니다. Yarn PnP 에서 앱에 선언이 있으면 설치 · 재설치 · 업그레이드 줄 대신 `theme list` 와 같은 판정하지 못했다는 한 줄을 냅니다. 루트 선언 미설치의 「설치: <pm> install」 줄은 npm 이어도 앱 디렉터리 명령 그대로입니다.
- `axis check` 는 `axis.config.json` 의 `brand` 와 CSS 의 브랜드 import 가 맞는지도 봅니다.

## 프로젝트 검증 (`axis check`)

- 전역 CSS 선택(1.7.7 부터): 전역 CSS 를 읽는 세 항목(Tailwind 4 의 Tailwind 구성 항목 · globals.css 항목 · Tailwind 4 의 animation 항목)은 같은 파일 하나를 봅니다. `axis.config.json` 의 `globalCss` 가 가리키는 파일이 있고 `.css` 이면 그 파일입니다. 모노레포의 `../shared/globals.css` 처럼 프로젝트 밖 경로도 읽기만 합니다(`axis theme add` 는 종전대로 밖 파일에 쓰지 않습니다). `globalCss` 키가 없거나 그 파일을 쓸 수 없으면 `globals.css` · `app/globals.css` · `src/app/globals.css` · `src/globals.css` · `styles/globals.css` 순으로 처음 찾은 파일이고, 쓸 수 없었던 이유를 항목 문구 끝에 붙입니다. 없는 파일 · 디렉터리면 `(globalCss ./nope.css 없음)`, `.css` 가 아닌 파일이면 `(globalCss ./package.json: .css 파일이 아님)` 입니다. brand 항목도 같은 `globalCss` 규칙과 표기를 쓰지만 후보 목록이 다릅니다(`app/globals.css` → `src/app/globals.css` → `styles/globals.css` → `src/styles/globals.css` → 루트 `globals.css`). 세 항목도 후보 이름과 같은 디렉터리(예: 루트 `globals.css/`)는 건너뜁니다(1.7.6 까지는 check 가 `EISDIR` 로 멈췄습니다). 1.7.6 까지는 세 항목이 `globalCss` 를 보지 않아, CSS 를 후보 밖(`src/styles/globals.css` 등)에 두고 `globalCss` 로 가리킨 프로젝트도 globals.css FAIL(종료 코드 1)이었고, 루트에 다른 `globals.css` 가 있으면 brand 와 다른 파일을 판정했습니다.
- Tailwind 구성 항목: Tailwind 4 이상(설치본, 없으면 `package.json` 선언으로 판정)은 설정 파일 대신 위 전역 CSS 선택이 고른 파일 하나를 봅니다. Tailwind 3 이하는 `tailwind.config.ts` · `.js` · `.mjs` · `.cjs` 를 찾습니다.
  - Tailwind 4: `@import "tailwindcss"` 가 있는 CSS 에서 아래 문제가 하나도 없으면 PASS 이고, 하나라도 있으면 WARN 입니다(블록 주석 안은 없는 것으로 봅니다). `@import "tailwindcss"` 가 없으면 그 WARN 하나만 냅니다.
    1. 토큰 진입점 `@import "@axis-ds/tokens/css/tailwind4";` 이 없음 → 문구에 넣을 import 줄. 진입점이 없으면 `bg-primary` · `rounded-md` 같은 AXIS 매핑이 만들어지지 않습니다. `@axis-ds/tokens/css` · `css/shadcn` · `tailwind`(Tailwind 3 preset)는 진입점으로 치지 않습니다.
    2. `package.json` 에 선언된 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `tailwind.css` import 가 없음 → 빠진 import 줄. 선언이 없으면(복사 설치) 요구하지 않습니다. `tailwind.css` 대신 그 패키지를 가리키는 `@source` 를 같은 CSS 에 직접 썼으면(예: `@source "../node_modules/@axis-ds/ui-react/dist";`, 작은따옴표 · 다른 상대 경로 포함) 스캔 경로가 있는 것으로 봅니다. 경로 문자열에 `@axis-ds/<패키지>` 가 들어 있고 그 바로 뒤가 경로 끝 · `/` · `\` 이면(`@axis-ds/ui-react-extra` 같은 다른 이름은 아님) 그 패키지를 가리킨다고 판정합니다(경로가 실제로 있는지는 보지 않음). 주석 안 · `@source not` · `@source inline()` 은 인정하지 않고, brace 확장(`@source "{…/@axis-ds/ui-react,…}/dist"`) · `@import "…" source("…")` 형태도 인정하지 않습니다(WARN 쪽으로 판정).
    3. 진입점이 있는데 create-next-app 기본 정의가 남음 → 실제로 남은 정의 이름(예: `--font-sans` 만 남았으면 `@theme --font-sans: var(--font-geist-sans)` 만 표시). `--background` · `--foreground` 를 색값(`#ffffff` · `rgb()` · `oklch()` 등)으로 정의, `--color-background: var(--background)` 류, `--font-sans` · `--font-mono: var(--font-geist-*)`, `background` · `color: var(--background)` 류 직접 사용을 봅니다(create-next-app 15.5.28 기본 `globals.css` 실물 기준). AXIS 의 HSL 삼중값(`0 0% 100%`) 재정의나 `hsl(var(--background))` 는 걸리지 않습니다. 표시 앞머리(`:root 색값` · `@theme` · `body`)는 create-next-app 기본 블록 이름이라, 같은 선언이 다른 선택자에 있어도 그 이름으로 표시됩니다.
    4. 진입점이 있는데 `@axis-ds/tokens` 가 아래 버전 조건에 걸림.
    5. `@axis-ds/ui-react/tailwind.css` · `@axis-ds/agentic-ui/tailwind.css` 를 import 하는데 그 패키지가 아래 버전 조건에 걸림(`tailwind.css` 는 1.4.0 부터 있음). 직접 `@source` 로 스캔하는 패키지는 `tailwind.css` 가 필요 없으므로 이 문제를 만들지 않습니다.
  - 문제가 여럿이면 위 순서대로 ` / ` 로 이어 한 항목에 냅니다. 끝에는 `package.json` 에 선언된 세 AXIS 패키지 가운데 1.4.0 미만인 것을 `(1.4.0 이상 필요: @axis-ds/tokens ^1.3.0)`, 판정할 수 없는 것을 `(설치된 버전이 1.4.0 이상인지 확인하세요: @axis-ds/agentic-ui catalog:)` 로 한 번 덧붙입니다. 버전은 `axis init` 과 같은 함수로 판정합니다: 설치본(`node_modules/<패키지>/package.json` 의 정확한 `version`)이 있으면 그것으로 보고(`(1.4.0 이상 필요: @axis-ds/ui-react 설치본 1.3.0)`, 1.4.0 이상이면 선언과 관계없이 넣지 않음), 없으면 선언 범위의 하한, 하한도 읽을 수 없으면(`catalog:` · `latest` · `||` 등) 판정 불가입니다. `workspace:` 는 넣지 않습니다.
  - 문구 예: `Tailwind 4: globals.css에 AXIS 토큰 진입점이 없습니다 → @import "@axis-ds/tokens/css/tailwind4"; / 컴포넌트 스캔 경로(tailwind.css)가 없습니다 → @import "@axis-ds/ui-react/tailwind.css"; (1.4.0 이상 필요: @axis-ds/tokens ^1.3.0 · @axis-ds/ui-react ^1.3.0)`
  - Tailwind 3: 설정 파일(`.ts` · `.js` · `.mjs` · `.cjs`)이 `@axis-ds/tokens/tailwind` preset 을 `require` · `import` 하면(주석 밖) `tailwind.config.ts에 AXIS 토큰이 설정되어 있습니다 (@axis-ds/tokens/tailwind preset)` 처럼 PASS 이고, 없으면 WARN 입니다(1.6.0 부터. 이전에는 `--background` · `hsl(var(` 문자열만 있어도 PASS 여서 AXIS 참조가 없는 자체 매핑도 통과했습니다).
  - Tailwind 3 CommonJS(1.6.1 부터): 설정이 `.cjs` 이거나 `module.exports` 를 쓰고 `.default` 없는 `require("@axis-ds/tokens/tailwind")` 가 있으면, 설치본(없으면 선언 하한) `@axis-ds/tokens` 가 1.7.0 미만일 때 WARN 입니다. 1.6.2 이하의 이 형태는 preset 이 아니라 `{ default }` 를 받아 색 · keyframes 가 빠집니다(1.1.0 부터). `.ts` · `.mjs` 의 `export default` 안 `require` 와 `import` 형태는 Tailwind 가 `.default` 를 꺼내 줘서 PASS 입니다.
- globals.css 항목: 위 전역 CSS 선택이 고른 CSS 하나를 봅니다(Tailwind 3 이하도 같음). 고를 파일이 하나도 없으면 FAIL 입니다. 1.6.1 부터 AXIS 근거가 있을 때만 PASS 입니다: `@axis-ds/tokens/css` · `@axis-ds/tokens/css/shadcn` · `@axis-ds/tokens/css/tailwind4` import(블록 주석 밖, 작은따옴표 · `url()` · `layer()` 표기 포함, 문구 끝에 `(@axis-ds/tokens/css/tailwind4 import)` 처럼 경로), `--axis-*` 변수 정의, 또는 루트 레이아웃(`app/layout.tsx` 등)의 `import "@axis-ds/tokens/css"`. 자체 `--background` · `--primary` 만 있으면 「자체 CSS 변수만 있고 AXIS 토큰이 없습니다」 WARN 입니다(1.6.0 까지는 PASS). Tailwind 3 에서 create-next-app 기본 `body` 의 `font-family: Arial` 이 남아 있으면 PASS 조건을 채워도 WARN 입니다(Tailwind 4 는 tailwind.config 항목의 create-next-app 기본 정의로 냅니다).
- dependencies 항목(1.6.1 부터): `tailwindcss` 선언이 없으면 FAIL, `clsx` · `tailwind-merge` 선언이 없으면 WARN(종전과 같음). 여기에 선언된 `tailwindcss` · `clsx` · `tailwind-merge` · `@axis-ds/*` 가 `node_modules` 에 없으면 「선언됐지만 설치되지 않은 의존성」 WARN 과 lockfile 에 맞는 설치 명령을 냅니다. 상위 디렉터리의 `node_modules`(모노레포 호이스팅)도 찾고, Plug'n'Play(`.pnp.cjs`)는 설치본을 읽지 않고 선언 기준입니다. 1.6.0 까지는 선언만 보고 「모두 설치되어 있습니다」였습니다.
  - 1.7.6 부터 워크스페이스 루트 `package.json` 에 선언한 `@axis-ds/*`(앱에 없는 것)도 설치 확인 대상이고, 설치되지 않았으면 「워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다」 WARN 입니다(종료 코드는 그대로, 1.7.5 까지는 앱 선언만 봐서 PASS).
  - 1.7.6 부터 Plug'n'Play 는 워크스페이스 루트 선언을 인정하지 않습니다. 앱이 자기 `package.json` 에 없는 패키지를 해석하지 못하기 때문입니다. 루트에만 있는 `tailwindcss` 는 「워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다」 FAIL, `clsx` · `tailwind-merge` · `@axis-ds/*` 는 같은 문구의 WARN 입니다(1.7.5 까지는 PASS). `.pnp.cjs` 는 `.git` 이 있는 층에서 찾기를 멈춥니다. `pnpFallbackMode: all` 설정은 읽지 않습니다.
- 해당할 때만 더하는 항목(1.6.0 부터, brand 항목 뒤 이 순서):
  - `brand.activation`: `brand` 가 있을 때 루트 레이아웃(`app/layout.tsx` · `src/app/layout.tsx` · `pages/_app` 등, 그 레이아웃이 import 하는 같은 디렉터리의 `./providers` 한 단계 포함)에 `data-brand` · `setBrand(` · `defaultBrand=` 가 없으면 WARN 입니다(휴리스틱, `ThemeProvider` 단독은 켜는 코드가 아님). 1.6.1 부터 마크업 `data-brand` 와 `ThemeProvider` 만 있고 `setBrand(` · `defaultBrand=` 가 없으면 설치본(없으면 선언) `@axis-ds/theme` 가 1.7.0 미만이거나 판정할 수 없을 때 WARN 입니다(1.6.2 이하는 마운트 때 속성을 지움). 1.7.6 부터 Plug'n'Play 에서 `@axis-ds/theme` 가 워크스페이스 루트에만 선언돼 있으면 「앱이 해석하지 못합니다」 WARN 입니다(Tailwind 3 CommonJS preset 의 `@axis-ds/tokens` 판정도 같음).
  - `tailwind.content`: Tailwind 3 설정 파일이 있고 `componentsDir` 나 선언된 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 가 있을 때, `content` 의 문자열 glob 이 그 경로를 덮지 않으면 FAIL 입니다(그 경로의 클래스가 생성되지 않음). `content` 를 정적으로 다 읽지 못하면(변수 · 펼침) WARN 입니다. 패키지 경로는 프로젝트 디렉터리부터 상위로 찾은 설치본 위치 기준이라, npm workspaces · pnpm hoisted 처럼 루트에만 설치된 앱은 `../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}` 를 안내합니다(1.7.1 부터, 설치본이 없거나 Plug'n'Play 면 `./node_modules/...`). `**` 는 `../` 를 넘지 않는 것으로, 절대경로 glob 은 실제 위치와 비교해 판정합니다. 1.7.4 부터 pnpm 기본 레이아웃처럼 앱 설치본이 링크이면 실경로가 같은 상위 설치본(`../../node_modules/...`)과 `.pnpm` 스토어 실경로를 상대 경로로 쓴 glob 도 인정하고, 실경로가 다른 상위 설치본을 가리키면 FAIL 문구에 그 이유를 붙입니다. 상위 경로는 Tailwind 3 가 빌드를 실행한 디렉터리 기준으로 풀리므로 모노레포 루트에서 빌드하면 `content: { relative: true, files: [...] }` 를 쓰세요(판정은 프로젝트 디렉터리에서 빌드한다고 보고 함).
  - `animation`: `@axis-ds/ui-react` 선언이나 `componentsDir` 의 `animate-in` 류 클래스가 있을 때 애니메이션 플러그인(Tailwind 3 `tailwindcss-animate` 선언 + 설치본 + `plugins` 배열 참조, Tailwind 4 는 전역 CSS 선택이 고른 파일의 `@import "tw-animate-css"`)이 없으면 WARN 입니다. 1.6.1 부터 Tailwind 3 은 `plugins` 배열 안의 `require("tailwindcss-animate")` 나 그 패키지를 받은 식별자(`import animate from` · `const animate = require(...)`)만 인정합니다(import 만 있거나 다른 곳의 같은 문자열은 아님). 배열을 정적으로 다 읽지 못하면(펼침 · 단축 속성) 「확인하지 못함」 WARN 입니다. 1.7.6 부터 Tailwind 4 는 CSS 의 줄마다 그 줄의 패키지(`tw-animate-css` · `tailwindcss-animate`)가 선언 · 설치돼 있어야 PASS 이고, 줄은 있는데 선언이나 설치본이 없으면 「애니메이션 플러그인을 쓸 수 없습니다」 WARN 입니다(1.7.5 까지는 줄만 보고 PASS, 실제 빌드는 실패). Plug'n'Play 에서는 플러그인 선언을 앱 `package.json` 에서만 봅니다.
- FAIL 이 하나라도 있으면 종료 코드 1 로 끝납니다. WARN 만 있으면 0 입니다(1.3.0 부터, 이전에는 결과와 관계없이 0).
- MCP `axis.check_project` 도 같은 항목 · 문구를 냅니다.

## 터미널이 아닌 곳에서 실행 (CI · 파이프 · `</dev/null`)

stdin 이 터미널이 아니면 질문을 띄우지 않습니다(1.7.0 부터). 이전에는 `axis add` 말고는 입력이 닫힌 곳(`</dev/null` · 빈 파이프)에서 질문 한 줄만 찍고 아무것도 하지 않은 채 rc 0 으로 끝났고, 파이프로 응답을 넣으면 그 값으로 동작했습니다. 질문의 성격에 따라 이렇게 합니다.

| 명령 | 터미널이 아닐 때 |
|---|---|
| `axis init`(`-y` 없음) | `-y` 와 같은 기본값으로 진행하고 쓴 값을 한 줄 알림. 단 내용이 다른 기존 `utils.ts` 가 있으면 덮어쓰지 않고 rc 1, 아무것도 쓰지 않음(`-y` 면 덮어씀) |
| `axis template init <name>`(`--dir` 없음) | 템플릿 이름 디렉터리(`./<name>`)로 진행하고 한 줄 알림 |
| `axis template init`(이름 없음) | rc 1, 템플릿 이름 안내(템플릿 선택에는 기본값이 없음) |
| `axis template init` 대상이 비어 있지 않음 | rc 1, 아무것도 쓰지 않음. `-y` 면 진행(템플릿과 같은 경로의 파일은 덮어씀) |
| `axis template apply` 충돌 파일 있음 | rc 1, 아무것도 쓰지 않음. `-y` 면 덮어씀, `--dry-run` 으로 미리보기 |
| `axis add` 내용이 다른 기존 파일 | `-y` 와 같이 건너뛰고 목록을 알림(종전과 같음) |
| `axis v0 import` · `axis monet import` | rc 1, 대화형 터미널에서 실행하라는 안내(`v0` 는 `axis v0 convert <file>` 도 안내) |

- `axis template init -y` 는 질문을 기본값으로 답하고, 비어 있지 않은 디렉터리도 진행합니다(`template apply -y` 와 같은 뜻). 터미널에서도 같습니다.
- 판정은 stdin 이 터미널인지 하나로 합니다. 그래서 `printf '\n' | axis template init dashboard` 처럼 파이프로 응답을 넣던 스크립트도 이제는 묻지 않고 위 표대로 동작합니다. 값은 `--dir` · `-y` 같은 옵션으로 주세요.
- `axis template apply` 의 「필요한 의존성」 명령과 `axis template init` 의 다음 단계(`install` · `dev`)는 대상 디렉터리의 lockfile(없으면 `packageManager`)로 매니저를 고르고 범위를 따옴표로 감쌉니다(1.7.2 부터, 1.7.1 까지는 `pnpm` 고정).
- Windows Git Bash(mintty)처럼 사람이 앞에 있어도 stdin 이 터미널로 잡히지 않는 환경에서는 질문 없이 위 표대로 동작할 수 있습니다(실측 전). 질문이 뜨지 않으면 `winpty npx axis ...` 로 실행하거나, PowerShell · Windows Terminal 에서 실행하거나, `--dir` · `-y` 같은 옵션으로 값을 주세요.

## 문서

자세한 사용법은 [AXIS Design System 문서](https://axis-design-system.pages.dev)를 참고하세요.

## 라이선스

MIT
