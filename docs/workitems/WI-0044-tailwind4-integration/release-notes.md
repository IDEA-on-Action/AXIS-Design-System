# WI-0044 릴리스 노트: Tailwind 4 프로젝트의 AXIS 연동

> 릴리스일: 미정(배포 전) | 유형: feat · 일부 동작 변경(`axis check`) | 영향: `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 1.3.0 → 1.4.0 (minor, linked 로 `@axis-ds/theme` 도 1.4.0), `@axis-ds/cli` 1.3.0 → 1.4.0 (minor), `@axis-ds/mcp` 1.2.1 → 1.2.2 (patch)
> changeset: `.changeset/wi-0044-tailwind4-entry.md` · `.changeset/wi-0044-tailwind4-cli.md`

## 변경 사항

### feat: Tailwind 4 토큰 진입점 `@axis-ds/tokens/css/tailwind4`
- Tailwind 3 preset(`@axis-ds/tokens/tailwind`)과 같은 매핑(색 24 · radius 3 · 글꼴 3)을 `@theme inline` 으로 정의합니다. preset 과 같은 소스(`src/tailwind-preset.ts`)에서 빌드 때 만들어 어긋나지 않습니다.
- `.dark` 클래스 다크 모드를 `@custom-variant dark (&:where(.dark, .dark *))` 로 정의합니다.
- 토큰 변수(`variables.css` · `shadcn-compat.css`)를 base 레이어로 함께 불러와 한 줄 import 로 씁니다. base 레이어라 `border-red-500` 같은 유틸리티가 기본 테두리색보다 우선합니다.

```css
@import "tailwindcss";
@import "@axis-ds/tokens/css/tailwind4";
```

### feat: 컴포넌트 패키지 스캔 진입점 `tailwind.css`
- `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 가 패키지 `dist` 를 가리키는 `@source` 를 담은 `tailwind.css` 를 배포합니다. Tailwind 4 는 `node_modules` 를 스캔하지 않아 Button 배경 같은 컴포넌트 클래스가 생성되지 않았는데, 이 파일을 import 하면 생성됩니다. npm · pnpm 설치 모두 동작합니다.

```css
@import "@axis-ds/ui-react/tailwind.css";
@import "@axis-ds/agentic-ui/tailwind.css"; /* 쓸 때만 */
```

### feat: `axis init` 의 Tailwind 4 안내
- Tailwind 4 이상이면 전역 CSS 에 넣을 import 줄(토큰 진입점 · `package.json` 에 선언된 컴포넌트 패키지의 `tailwind.css`), create-next-app 기본 `globals.css` 의 `:root` · `@theme inline` · `@media (prefers-color-scheme: dark)` · `body` 블록을 지우라는 주의(quick-start 와 같은 내용), `@axis-ds/tokens` 가 없을 때 lockfile 에 맞춘 설치 명령(`@axis-ds/tokens@^1.4.0`)을 출력합니다. 파일은 고치지 않습니다.
- `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 선언의 버전 조건을 `axis check` 와 같은 규칙으로 안내합니다(보정 2차 A1).
  - 선언 범위의 하한이 1.4.0 미만(`^1.3.0` · `1.x` · `^1.4.0-beta.1` · `1.3.0 - 1.5.0`)이면 그 패키지들을 `^1.4.0` 으로 올리는 명령. 하이픈 범위는 왼쪽 버전, 비교자 여러 개(`>=1.2 >=1.4`)는 가장 높은 하한을 봅니다.
  - 하한을 읽을 수 없으면(`catalog:` · `latest` · `||` · `<2` · `*` 등) 선언을 덮어쓰는 명령 대신 「설치된 버전이 1.4.0 이상인지 확인하세요」.
  - `workspace:` 프로토콜은 안내하지 않습니다(모노레포 링크를 레지스트리 범위로 덮어쓰지 않음).
- Tailwind 4 에서는 없는 `tailwind.config.ts` 를 `axis.config.json` 의 `tailwindConfig` 에 적지 않고, 대화형 실행에서도 묻지 않습니다.

### 동작 변경: `axis check` · MCP `axis.check_project` 의 Tailwind 4 연동 WARN
- Tailwind 4 에서 `@import "tailwindcss"` 가 있어도 같은 CSS 에 아래 문제가 있으면 WARN 입니다. 종전에는 PASS 였습니다. WARN 이라 종료 코드는 0 그대로입니다.
  1. `@axis-ds/tokens/css/tailwind4` import 가 없음 → 넣을 import 줄
  2. `package.json` 에 선언된 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `tailwind.css` import 가 없음 → 빠진 import 줄(보정 2차 B1). 선언이 없으면 요구하지 않습니다.
  3. 진입점이 있는데 create-next-app 기본 정의가 남음 → 남은 정의 이름(보정 2차 B2). create-next-app@15.5.28 기본 `globals.css` 실물의 특징 줄(`--background` · `--foreground` 색값, `--color-background: var(--background)` 류, `--font-sans` · `--font-mono: var(--font-geist-*)`, `background` · `color: var(--background)` 류)을 블록 주석 밖에서 찾습니다.
  4. 진입점이 있는데 `@axis-ds/tokens` 선언이 1.4.0 조건에 걸림(보정 2차 A4)
- 여럿이면 이 순서로 ` / ` 로 이어 한 문구에 내고, 끝에 세 AXIS 패키지 선언의 버전 안내를 한 번 붙입니다(보정 2차 C). 하한이 1.4.0 미만이면 `(1.4.0 이상 필요: <패키지> <선언>)`, 판정할 수 없으면 `(설치된 버전이 1.4.0 이상인지 확인하세요: <패키지> <선언>)`, `workspace:` 는 넣지 않습니다(A1, `axis init` 과 같은 규칙). `@import "tailwindcss"` 가 없으면 종전 WARN 하나만 냅니다.
- B2 를 tailwind 항목에 붙인 이유: 판정 조건(Tailwind 4 이고 진입점이 있음)을 이 항목만 알고, globals.css 항목은 Tailwind 3 과 같이 쓰는 「AXIS 변수 정의 여부」 판정이라 Tailwind 4 전용 규칙을 넣으면 그 의미와 기준선이 흔들립니다. 증상(`bg-background` · `font-mono` 무효)도 Tailwind 4 매핑 쪽입니다. globals.css 항목은 진입점 import 로 계속 PASS 입니다.
- 문구 예: `Tailwind 4: app/globals.css에 create-next-app 기본 정의가 남아 있습니다(:root 색값 --background · @theme --color-background: var(--background) · @theme --font-mono: var(--font-geist-mono) · body background: var(--background)) → 지우세요`

### 동작 변경: `axis check` · MCP `axis.check_project` 의 Tailwind 3 preset 인정 (보정 2차 B3)
- Tailwind 3 설정 파일(`tailwind.config.ts` · `.js` · `.mjs` · `.cjs`)이 `@axis-ds/tokens/tailwind` preset 을 `require` · `import` · `import()` 로 참조하면(큰 · 작은따옴표, `//` · `/* */` 주석 밖) `<파일>에 AXIS 토큰이 설정되어 있습니다 (@axis-ds/tokens/tailwind preset)` 로 PASS 입니다.
- 배포본 1.3.0 과 Tailwind 3 출력이 달라지는 경우:
  - preset 만 쓰고 `hsl(var(` · `--background` 가 없는 `tailwind.config.ts`: 1.3.0 은 WARN `tailwind.config.ts에 AXIS 토큰 설정이 없습니다` → PASS `tailwind.config.ts에 AXIS 토큰이 설정되어 있습니다 (@axis-ds/tokens/tailwind preset)`
  - preset 을 참조하는 `tailwind.config.js` · `.mjs` · `.cjs`(`.ts` 없음): 1.3.0 은 WARN `<파일> 존재 (TypeScript 권장)` → PASS `<파일>에 AXIS 토큰이 설정되어 있습니다 (@axis-ds/tokens/tailwind preset)`
  - 두 경우 모두 WARN 이 PASS 로 바뀌는 것이라 종료 코드는 0 그대로이고, `runCheck` 합계(pass · warn 수)가 1씩 바뀝니다.
- 바뀌지 않는 것: `hsl(var(` · `--background` 로 PASS 이던 `.ts` 는 preset 이 함께 있어도 종전 문구, preset 참조가 없는 `.js` · `.mjs` · `.cjs` 는 종전 WARN, 설정 파일이 없으면 종전 FAIL. 기준선 6개 프로젝트(T4-1)와 MCP 기준선 출력은 그대로입니다(그 fixture 에는 preset 참조가 없음).

### fix: `axis check` · MCP `axis.check_project` 의 globals.css 오탐
- 변수를 직접 정의하지 않고 `@axis-ds/tokens/css` · `@axis-ds/tokens/css/shadcn` · `@axis-ds/tokens/css/tailwind4` 를 import 한 CSS(블록 주석 밖, 작은따옴표 · `url()` · `layer()` 표기 포함)를 AXIS 변수 정의로 인정해 PASS 를 냅니다. 문구 끝에 `(<경로> import)` 가 붙어 import 로 인정했음을 알 수 있습니다. 종전에는 `--background` · `--primary` 문자열이 없으면 WARN 이라 Tailwind 4 진입점 구성이 오탐됐습니다. 판정은 공유 코어(`tailwind-core.ts`)에 있어 CLI · MCP 문구가 같습니다.

### docs
- 패키지 README(tokens · ui-react · agentic-ui · cli), 가이드(quick-start · troubleshooting · theme-customization · component-usage), 문서 사이트 `/docs` 에 Tailwind 4 절을 더했습니다. Tailwind 3 안내는 그대로입니다.

## 영향 없음 (Tailwind 3)
- Tailwind 3 preset 과 기존 tokens 산출물(`variables.css` · `shadcn-compat.css` · 브랜드 CSS · JSON · JS · preset 13개 파일)은 바이트 단위로 같습니다. 새 파일과 exports 항목만 더해졌습니다.
- Tailwind 3 프로젝트의 `axis init` 출력 · `axis.config.json` 은 바뀌지 않았습니다. `axis check` 의 Tailwind 구성 항목은 위 preset 인정(B3)만 더해졌습니다. globals.css 항목의 import 인정은 Tailwind 버전과 관계없이 적용됩니다(종전 WARN 이던 import 만 있는 CSS 가 PASS 로 바뀜, 변수를 직접 정의한 경우의 문구는 그대로). 기준선 6개 프로젝트 · MCP 기준선 출력은 그대로입니다.

## 알려진 한계
- 색을 지정하지 않은 `ring-2` 는 Tailwind 4 에서 글자색(`currentColor`)으로 그려집니다. 색 미지정 `border-t` 도 Tailwind 4 기본값은 `currentColor` 이지만, 토큰 진입점을 쓰면 진입점이 불러오는 base 규칙으로 AXIS `--border` 색이 됩니다(testplan 5절). Tailwind 3 preset 의 색 미지정 테두리는 preflight gray-200(`#e5e7eb`)이라 기본 라이트에서는 값이 같지만, 다크 · ontology 브랜드에서는 AXIS `--border` 를 따르는 Tailwind 4 진입점과 색이 다릅니다(testplan 6절 B1 · B2).
- 애니메이션: Dialog · Sheet · Popover · Select · DropdownMenu · Tooltip · Toast 가 쓰는 `animate-in` · `fade-in-0` 류 클래스는 토큰 진입점과 preset 모두 정의하지 않아 tailwindcss-animate 류 플러그인을 앱에 따로 설치해야 합니다. 의존 선언과 keyframes 는 WI-0046(#137)에서 다룹니다.
- `axis add` 는 아직 레지스트리를 조회하지 않습니다(WI-0045, #136). 이번 변경은 npm 패키지 경로와 `axis init` · `axis check` 를 다룹니다.
- `dark:` 변형은 Tailwind 4 공식 형태라 Tailwind 3 preset 과 의미가 다릅니다. `.dark` 를 붙인 요소 자신에도 적용되고 명시도를 올리지 않습니다(D5).
- create-next-app 기본 `globals.css` 의 `:root` · `@theme inline` · `body` 블록은 진입점만으로 해소되지 않습니다. 앱 CSS 가 레이어 밖이라 항상 이기므로 문서 안내대로 지워야 합니다.
- 1.4.0 판정은 `package.json` 의 선언 범위 하한만 봅니다(설치본 · lockfile 버전은 보지 않음). 하한을 읽을 수 없는 선언은 확인 문구만 내고, pnpm catalog 를 쓰는 프로젝트는 진입점이 있어도 tokens 확인 WARN 이 남습니다(A4 에 A1 규칙 적용).
- `axis check` 의 Tailwind 4 판정은 처음 찾은 CSS 하나만 봅니다. 컴포넌트 `tailwind.css` 를 다른 CSS 에 둔 구성은 그 CSS 에서 동작하지 않으므로 WARN 이 맞습니다.
- create-next-app 기본 정의 판정(B2)은 특징 줄 검색입니다. `--background: white` 같은 색 이름 값과 선택자 범위는 보지 않습니다. 진입점이 없을 때는 진입점 WARN 만 냅니다.
- preset 인정(B3)은 참조 문자열만 보고 `presets:` 에 실제로 넣었는지는 보지 않습니다. 주석 판정은 정규식 리터럴을 구분하지 않습니다.

## 배포 순서
- `axis init` 이 `@axis-ds/tokens@^1.4.0` 설치를 안내하므로 tokens 1.4.0 이 cli 1.4.0 보다 먼저 또는 같은 publish 에서 배포돼야 합니다.

## 검증
- 패키지별 테스트 · 변이 음성 대조 · pack-smoke 결과와 미측정 항목은 [testplan.md](./testplan.md) 에 있습니다. 실앱(create-next-app) Playwright 판정(AC1 · AC2)과 `turbo --force` 전체(AC6)는 이 문서 작성 시점에 미측정입니다.
