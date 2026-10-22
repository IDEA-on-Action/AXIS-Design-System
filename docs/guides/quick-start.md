# Quick Start

AXIS Design System을 프로젝트에 설정하고 첫 컴포넌트를 렌더링하는 가이드입니다.

## 사전 요구사항

- Node.js 20+
- React 18+
- Tailwind CSS 3.4+ 또는 Tailwind CSS 4 (Tailwind 4 연동은 `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 1.4.0 부터)

## 1. 패키지 설치

```bash
pnpm add @axis-ds/ui-react @axis-ds/theme @axis-ds/tokens
```

## 2. Tailwind CSS 설정

프로젝트의 Tailwind 버전에 맞는 절을 따릅니다. `package.json` 의 `tailwindcss` 가 `^4` 이거나 전역 CSS 가 `@import "tailwindcss";` 로 시작하면 Tailwind 4 입니다(create-next-app 15.5 의 기본값).

### Tailwind CSS 4

전역 CSS(`app/globals.css` 등)를 아래처럼 씁니다. 한 줄에 하나씩, 이 순서로 import 합니다.

```css
/* app/globals.css */
@import "tailwindcss";
@import "@axis-ds/tokens/css/tailwind4";
@import "@axis-ds/ui-react/tailwind.css";
@import "@axis-ds/agentic-ui/tailwind.css"; /* @axis-ds/agentic-ui 를 쓸 때만 */
```

- `@axis-ds/tokens/css/tailwind4` 는 Tailwind 3 preset 과 같은 매핑(`bg-primary` · `rounded-md` · `font-mono` · `dark:` 변형)을 Tailwind 4 의 `@theme inline` 으로 정의하고, 토큰 변수(`@axis-ds/tokens/css` · `@axis-ds/tokens/css/shadcn`)를 base 레이어로 함께 불러옵니다. 토큰 CSS 를 따로 import 하지 않습니다.
- `@axis-ds/ui-react/tailwind.css` · `@axis-ds/agentic-ui/tailwind.css` 는 패키지 빌드 산출물을 가리키는 `@source` 한 줄입니다. Tailwind 4 는 `node_modules` 를 스캔하지 않아서, 이 줄이 없으면 컴포넌트가 쓰는 `bg-[var(--axis-button-bg-default)]` 같은 클래스가 만들어지지 않고 Button 배경이 투명해집니다. 사용하는 패키지만 넣습니다.
- 모두 `@import "tailwindcss";` 가 있는 같은 파일에 둡니다. 다른 CSS 파일이나 JS/TSX 에서 import 하면 스캔 경로가 Tailwind 컴파일에 들어가지 않습니다.
- `tailwind.config.ts` 는 만들지 않아도 됩니다. 아래 Tailwind 3 의 `content` 와 `@import "@axis-ds/tokens/css"` 도 넣지 않습니다(진입점이 토큰 CSS 를 base 레이어로 이미 불러옵니다). 특히 `@import "@axis-ds/tokens/css/shadcn"` 을 레이어 없이 넣으면 그 안의 `* { border-color }` 가 `border-red-500` 같은 테두리색 유틸리티를 이깁니다.

**create-next-app 기본 `globals.css` 와의 충돌**: create-next-app 이 만든 `globals.css` 에는 아래 블록이 들어 있습니다. AXIS 와 같은 이름(`--background` · `--foreground` · `--color-background` · `--font-sans` · `--font-mono`)을 다른 값으로 정의하므로 지웁니다.

```css
/* 지울 블록: create-next-app 기본값 */
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

이 블록을 남겨 두면 `--background` 가 AXIS 의 HSL 값 대신 `#ffffff` 가 되어 `.dark` 안의 `bg-background` 가 투명해지고, `font-sans` · `font-mono` 가 AXIS 글꼴 대신 `Arial` 로 그려집니다. AXIS 토큰은 base 레이어에 있어서 레이어 없이 쓴 앱 CSS 가 항상 이깁니다.

`axis init`(`@axis-ds/cli`)은 Tailwind 4 프로젝트에서 위 import 줄과 이 네 블록을 지우라는 주의를 출력합니다. 파일은 고치지 않습니다. `package.json` 에 선언된 `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 는 설치본을 먼저 보고 이렇게 안내합니다.

- 설치본(`node_modules/<패키지>/package.json` 의 정확한 `version`)이 1.4.0 이상 → 선언이 `^1.3.0` · `catalog:` 여도 안내하지 않음
- 설치본이 1.4.0 미만 → 설치본 버전을 보여 주고 `^1.4.0` 으로 올리는 명령. 선언 하한을 읽을 수 없으면(`catalog:` · `npm:` · `latest` · `||` 등) 명령 없이 선언이 가리키는 버전을 올리고 다시 설치하라는 줄(선언을 덮어쓰지 않음)
- 설치본이 없고 선언 범위의 하한이 1.4.0 미만(`^1.3.0` · `1.x` · `1.3.0 - 1.5.0` 등) → `^1.4.0` 으로 올리는 명령
- 하한을 읽을 수 없음(`catalog:` · `latest` · `||` 등) → 설치된 버전이 1.4.0 이상인지 확인하라는 줄(선언을 덮어쓰지 않음)
- `workspace:` 프로토콜 → 설치본과 관계없이 안내하지 않음(모노레포 링크)

`axis check` 는 같은 함수로 판정하고, Tailwind 4 에서 토큰 진입점 · 선언된 컴포넌트 패키지의 `tailwind.css` 가 빠졌거나 진입점이 있는데 위 create-next-app 기본 정의가 남아 있거나(실제로 남은 정의 이름을 보여 줌) `@axis-ds/tokens` 가 1.4.0 조건에 걸리거나 import 한 `tailwind.css` 의 패키지가 1.4.0 조건에 걸리면 WARN 을 냅니다. `tailwind.css` 대신 그 패키지를 가리키는 `@source`(예: `@source "../node_modules/@axis-ds/ui-react/dist";`)를 같은 CSS 에 직접 쓴 경우는 스캔 경로가 있는 것으로 봅니다(경로 문자열에 `@axis-ds/<패키지>` 가 들어 있는지로 판정).

**Tailwind 3 과 다르게 동작하는 것**

- 색을 지정하지 않은 `ring-2` 같은 링은 Tailwind 4 에서 글자색(`currentColor`)으로 그려집니다. 링 색은 `ring-ring` 처럼 직접 지정합니다.
- 색을 지정하지 않은 `border` · `border-t` 는 진입점이 불러오는 base 규칙(`* { border-color: hsl(var(--border)) }`) 덕분에 AXIS `--border` 색입니다. 진입점이 없으면 Tailwind 4 기본값인 `currentColor` 가 됩니다. Tailwind 3 preset 의 기본 테두리색은 preflight 의 gray-200(`#e5e7eb`)이라(`@axis-ds/tokens/css/shadcn` 을 따로 넣지 않을 때) 기본 라이트에서는 값이 같지만(AXIS `--border` 도 rgb(229,231,235)), 다크에서는 AXIS `--border` 가 rgb(31,41,55) 로 바뀌고 ontology 브랜드는 라이트 rgb(230,232,235) · 다크 rgb(43,47,53) 이라 Tailwind 3 과 달라집니다.
- `dark:` 변형은 Tailwind 4 공식 형태 `@custom-variant dark (&:where(.dark, .dark *))` 입니다. Tailwind 3 preset(`darkMode: ["class"]`)은 `.dark` 의 자손에만 적용되고 명시도가 클래스 하나만큼 올라가지만, Tailwind 4 진입점은 `.dark` 를 붙인 요소 자신에도 적용되고 명시도를 올리지 않습니다.
- Dialog · Sheet · Popover · Select · DropdownMenu · Tooltip · Toast 가 쓰는 `animate-in` · `fade-in-0` 같은 열고 닫는 애니메이션 클래스는 AXIS 진입점이 정의하지 않습니다. 애니메이션이 필요하면 tailwindcss-animate 류 애니메이션 플러그인을 앱에 따로 설치합니다(Tailwind 3 preset 도 같습니다).

### Tailwind CSS 3

`tailwind.config.ts`의 `content` 배열에 AXIS 패키지 경로를 추가합니다.

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/@axis-ds/ui-react/**/*.{js,jsx}",
    "./node_modules/@axis-ds/agentic-ui/**/*.{js,jsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

AXIS 컴포넌트는 `--axis-*` 접두사의 CSS 변수 기반 테마를 사용합니다. `@axis-ds/tokens` 패키지의 CSS를 글로벌 스타일에 포함하세요.

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@import "@axis-ds/tokens/css";
```

## 3. ThemeProvider 설정

앱 루트에 `ThemeProvider`를 감싸 테마(라이트/다크/시스템)를 적용합니다.

```tsx
import { ThemeProvider } from "@axis-ds/theme";

export default function App({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      {children}
    </ThemeProvider>
  );
}
```

`defaultTheme`은 `"light"`, `"dark"`, `"system"` 중 하나를 지정할 수 있으며 기본값은 `"system"`입니다.

## 4. 첫 컴포넌트 사용

```tsx
import { Button } from "@axis-ds/ui-react";

export function MyPage() {
  return (
    <div className="p-8 space-y-4">
      <Button>기본 버튼</Button>
      <Button variant="secondary">보조 버튼</Button>
      <Button variant="outline" size="lg">큰 아웃라인 버튼</Button>
    </div>
  );
}
```

서브패스 import도 지원합니다.

```tsx
import { Button } from "@axis-ds/ui-react/button";
```

## 5. CLI로 컴포넌트 추가

`@axis-ds/cli`를 사용하면 개별 컴포넌트를 프로젝트에 직접 복사하여 커스터마이징할 수 있습니다.

```bash
npx @axis-ds/cli add button
```

여러 컴포넌트를 한 번에 추가할 수도 있습니다. 이름이 하나라도 레지스트리에 없으면 아무것도 설치하지 않고 실패합니다.

```bash
npx @axis-ds/cli add button input card
```

Agentic UI 컴포넌트는 `agentic-` 이 붙은 이름으로 추가합니다. `--agentic` 을 붙이면 접두를 생략할 수 있습니다.

```bash
npx @axis-ds/cli add agentic-run-progress
npx @axis-ds/cli add run-progress --agentic   # 위와 같음
npx @axis-ds/cli list                         # 추가할 수 있는 이름 목록
```

- 컴포넌트가 쓰는 `utils.ts`(`cn`) · 접근성 레이블 파일도 함께 복사하고, import 는 설치 위치에 맞게 바꿉니다. Core UI 는 `axis.config.json` 의 `componentsDir`, Agentic UI 는 그 옆 `agentic` 디렉터리(`agenticDir` 로 바꿀 수 있음)에 들어갑니다.
- `package.json` 에 없는 의존성은 설치 명령으로 안내만 합니다. 안내된 명령을 실행하세요.
- 이미 있는 파일은 내용이 같으면 건너뛰고, 다르면 덮어쓸지 묻습니다. `-y` 는 묻지 않고 건너뛰며, 덮어쓰려면 `--overwrite` 를 붙입니다. CI · 파이프처럼 터미널이 아닌 곳에서 실행하면 묻지 않고 `-y` 와 같이 건너뜁니다. 출력에서 새로 만든 파일은 `+`, 덮어쓴 파일은 `~` 로 표시합니다. 덮어써야 하는 파일이 심볼릭 링크이거나 다른 경로와 하드링크로 이어져 있으면 아무것도 쓰지 않고 그 경로와 이유를 알린 뒤 실패합니다(`axis init` 의 `utils.ts` 도 같은 규칙).
- 컴포넌트는 레지스트리(기본 `https://axis-design-system.pages.dev/r`, `AXIS_REGISTRY_URL` 이나 `axis.config.json` 의 `registry` 로 바꿀 수 있음)에서 받고, 받지 못하면 CLI 에 포함된 레지스트리로 설치하며 그 사실을 한 번 알립니다.

### shadcn CLI 로 직접 설치하기

AXIS 레지스트리는 shadcn 레지스트리 형식이라 shadcn CLI 로 URL 을 지정해 직접 설치할 수도 있습니다. 이때는 아래 순서를 따릅니다.

```bash
# radix 프리셋(-b radix)과 스타일 프리셋(-p nova)을 함께 지정해 초기화합니다. 기본 프리셋(base-ui)은 쓰지 않습니다
npx shadcn@latest init -b radix -p nova
# init 이 만든 utils.ts 를 AXIS utils 로 바꾸도록 --overwrite 를 붙입니다
npx shadcn@latest add https://axis-design-system.pages.dev/r/button.json --overwrite
```

- `shadcn init` 은 radix 프리셋(`-b radix`)에 스타일 프리셋 `-p nova` 를 함께 붙여 실행합니다. `-p` 를 빼면 프리셋 선택 프롬프트가 뜨고, CI · 파이프처럼 입력이 닫힌 곳에서는 rc 0 으로 끝나면서 `components.json` · `utils.ts` 를 만들지 않습니다(이어서 실행한 `add` 도 rc 0 으로 아무것도 설치하지 않음). 비대화 실행에는 `--yes --no-monorepo` 도 붙입니다.
- 이 순서는 shadcn 4.21.4(저장소 스모크 `pnpm registry-shadcn-smoke` 의 고정 버전)와 4.22.1(확인 당시 `@latest`)에서 확인했습니다. 다른 버전에서는 프롬프트 · 옵션이 다를 수 있습니다.
- `-b radix` 를 쓰는 이유: 기본 프리셋(Base UI 기반, `init --defaults`)으로 만든 프로젝트에서는 select 항목이 shadcn 의 `asChild` → `render` 변환을 거쳐 빌드가 실패합니다.
- `shadcn add` 에는 `--overwrite` 를 붙입니다. init 이 만든 `lib/utils.ts`(npm 패키지 `cn` 을 다시 내보냄)를 AXIS utils(`clsx` + `extendTailwindMerge`)로 바꾸기 위해서입니다. 붙이지 않으면 이미 있는 utils.ts 가 AXIS utils 로 바뀌지 않습니다.
- init 이 `package.json` 에 넣은 npm 패키지 `cn` 은 add 뒤에도 남습니다(설치된 AXIS 파일은 쓰지 않음). 필요 없으면 직접 지웁니다.
- 의존 항목(`utils` · `agentic-a11y-labels`)은 같은 레지스트리 URL 로 함께 받습니다. 공식 레지스트리(`ui.shadcn.com`)에는 `components.json` 의 `baseColor` 색 정의(`/r/colors/`)만 요청합니다.

## 다음 단계

- 전체 컴포넌트 목록은 [컴포넌트 문서](/docs/components)를 참고하세요.
- 다크모드 설정은 `ThemeProvider`의 `defaultTheme="dark"`으로 전환하거나, `useTheme()` 훅으로 런타임에 제어할 수 있습니다.
- AI/Agent 전용 컴포넌트가 필요하다면 `@axis-ds/agentic-ui` 패키지를 확인하세요.
