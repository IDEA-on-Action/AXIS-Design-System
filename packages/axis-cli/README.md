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

# 컴포넌트 추가
axis add button

# 설치된 컴포넌트 목록
axis list
```

## 프로젝트 초기화 (`axis init`)

- `axis.config.json` 과 `cn()` 을 담은 `utils.ts` 를 만들고, `clsx` · `tailwind-merge` 가 `package.json` 에 없으면 `dependencies` 에 더합니다. 설치는 실행하지 않고 명령만 안내합니다.
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

- `axis theme add` 는 `axis.config.json` 의 `globalCss` → `app/globals.css` → `src/app/globals.css` → 루트 `globals.css` 순으로 찾은 파일에 `@import "@axis-ds/tokens/css/brands/<brand>";` 를 한 줄 넣습니다. 여러 번 실행해도 같은 줄을 다시 넣지 않습니다.
- `package.json` 에 `@axis-ds/tokens` 가 없으면 `dependencies` 에 `^1.3.0` 을 더하고 설치 명령만 안내합니다. 설치는 실행하지 않습니다.
- 브랜드 CSS 는 `[data-brand="<brand>"]` 선택자로 적용되므로 `ThemeProvider defaultBrand` 나 `<html data-brand>` 가 있어야 화면이 바뀝니다. 코드는 고치지 않고 예시만 출력합니다.
- `@axis-ds/tokens` 가 없거나 1.3.0 미만이면 목록 대신 설치 · 업그레이드 안내를 내고 종료 코드 1 로 끝납니다.
- `axis check` 는 `axis.config.json` 의 `brand` 와 CSS 의 브랜드 import 가 맞는지도 봅니다.

## 프로젝트 검증 (`axis check`)

- Tailwind 구성 항목: Tailwind 4 이상(설치본, 없으면 `package.json` 선언으로 판정)은 설정 파일 대신 전역 CSS(`globals.css` · `app/globals.css` · `src/app/globals.css` · `src/globals.css` · `styles/globals.css` 순으로 처음 찾은 파일 하나)를 봅니다. Tailwind 3 이하는 `tailwind.config.ts` · `.js` · `.mjs` · `.cjs` 를 찾습니다.
  - Tailwind 4: `@import "tailwindcss"` 가 있는 CSS 에서 아래 문제가 하나도 없으면 PASS 이고, 하나라도 있으면 WARN 입니다(블록 주석 안은 없는 것으로 봅니다). `@import "tailwindcss"` 가 없으면 그 WARN 하나만 냅니다.
    1. 토큰 진입점 `@import "@axis-ds/tokens/css/tailwind4";` 이 없음 → 문구에 넣을 import 줄. 진입점이 없으면 `bg-primary` · `rounded-md` 같은 AXIS 매핑이 만들어지지 않습니다. `@axis-ds/tokens/css` · `css/shadcn` · `tailwind`(Tailwind 3 preset)는 진입점으로 치지 않습니다.
    2. `package.json` 에 선언된 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `tailwind.css` import 가 없음 → 빠진 import 줄. 선언이 없으면(복사 설치) 요구하지 않습니다. `tailwind.css` 대신 그 패키지를 가리키는 `@source` 를 같은 CSS 에 직접 썼으면(예: `@source "../node_modules/@axis-ds/ui-react/dist";`, 작은따옴표 · 다른 상대 경로 포함) 스캔 경로가 있는 것으로 봅니다. 경로 문자열에 `@axis-ds/<패키지>` 가 들어 있고 그 바로 뒤가 경로 끝 · `/` · `\` 이면(`@axis-ds/ui-react-extra` 같은 다른 이름은 아님) 그 패키지를 가리킨다고 판정합니다(경로가 실제로 있는지는 보지 않음). 주석 안 · `@source not` · `@source inline()` 은 인정하지 않고, brace 확장(`@source "{…/@axis-ds/ui-react,…}/dist"`) · `@import "…" source("…")` 형태도 인정하지 않습니다(WARN 쪽으로 판정).
    3. 진입점이 있는데 create-next-app 기본 정의가 남음 → 실제로 남은 정의 이름(예: `--font-sans` 만 남았으면 `@theme --font-sans: var(--font-geist-sans)` 만 표시). `--background` · `--foreground` 를 색값(`#ffffff` · `rgb()` · `oklch()` 등)으로 정의, `--color-background: var(--background)` 류, `--font-sans` · `--font-mono: var(--font-geist-*)`, `background` · `color: var(--background)` 류 직접 사용을 봅니다(create-next-app 15.5.28 기본 `globals.css` 실물 기준). AXIS 의 HSL 삼중값(`0 0% 100%`) 재정의나 `hsl(var(--background))` 는 걸리지 않습니다. 표시 앞머리(`:root 색값` · `@theme` · `body`)는 create-next-app 기본 블록 이름이라, 같은 선언이 다른 선택자에 있어도 그 이름으로 표시됩니다.
    4. 진입점이 있는데 `@axis-ds/tokens` 가 아래 버전 조건에 걸림.
    5. `@axis-ds/ui-react/tailwind.css` · `@axis-ds/agentic-ui/tailwind.css` 를 import 하는데 그 패키지가 아래 버전 조건에 걸림(`tailwind.css` 는 1.4.0 부터 있음). 직접 `@source` 로 스캔하는 패키지는 `tailwind.css` 가 필요 없으므로 이 문제를 만들지 않습니다.
  - 문제가 여럿이면 위 순서대로 ` / ` 로 이어 한 항목에 냅니다. 끝에는 `package.json` 에 선언된 세 AXIS 패키지 가운데 1.4.0 미만인 것을 `(1.4.0 이상 필요: @axis-ds/tokens ^1.3.0)`, 판정할 수 없는 것을 `(설치된 버전이 1.4.0 이상인지 확인하세요: @axis-ds/agentic-ui catalog:)` 로 한 번 덧붙입니다. 버전은 `axis init` 과 같은 함수로 판정합니다: 설치본(`node_modules/<패키지>/package.json` 의 정확한 `version`)이 있으면 그것으로 보고(`(1.4.0 이상 필요: @axis-ds/ui-react 설치본 1.3.0)`, 1.4.0 이상이면 선언과 관계없이 넣지 않음), 없으면 선언 범위의 하한, 하한도 읽을 수 없으면(`catalog:` · `latest` · `||` 등) 판정 불가입니다. `workspace:` 는 넣지 않습니다.
  - 문구 예: `Tailwind 4: globals.css에 AXIS 토큰 진입점이 없습니다 → @import "@axis-ds/tokens/css/tailwind4"; / 컴포넌트 스캔 경로(tailwind.css)가 없습니다 → @import "@axis-ds/ui-react/tailwind.css"; (1.4.0 이상 필요: @axis-ds/tokens ^1.3.0 · @axis-ds/ui-react ^1.3.0)`
  - Tailwind 3: `tailwind.config.ts` 에 `--background` · `hsl(var(` 가 있으면 종전 문구로 PASS 입니다. 그렇지 않아도 설정 파일(`.ts` · `.js` · `.mjs` · `.cjs`)이 `@axis-ds/tokens/tailwind` preset 을 `require` · `import` 하면(주석 밖) `tailwind.config.mjs에 AXIS 토큰이 설정되어 있습니다 (@axis-ds/tokens/tailwind preset)` 처럼 PASS 입니다. 1.3.0 에서는 preset 만 쓰는 `.ts` 가 WARN(`AXIS 토큰 설정이 없습니다`), `.js` · `.mjs` · `.cjs` 가 WARN(`TypeScript 권장`)이었습니다.
- globals.css 항목: 같은 후보에서 처음 찾은 CSS 하나를 봅니다. `--background` 와 `--primary` 를 직접 정의하거나, `@axis-ds/tokens/css` · `@axis-ds/tokens/css/shadcn` · `@axis-ds/tokens/css/tailwind4` 를 import 하면(블록 주석 밖, 작은따옴표 · `url()` · `layer()` 표기 포함) PASS 입니다. import 로 인정한 경우 문구 끝에 `(@axis-ds/tokens/css/tailwind4 import)` 처럼 경로가 붙습니다. 1.4.0 부터이고, 이전에는 import 만 있으면 WARN 이었습니다.
- FAIL 이 하나라도 있으면 종료 코드 1 로 끝납니다. WARN 만 있으면 0 입니다(1.3.0 부터, 이전에는 결과와 관계없이 0).
- MCP `axis.check_project` 도 같은 항목 · 문구를 냅니다.

## 문서

자세한 사용법은 [AXIS Design System 문서](https://axis.minu.best)를 참고하세요.

## 라이선스

MIT
