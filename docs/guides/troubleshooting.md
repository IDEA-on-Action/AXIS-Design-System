# 트러블슈팅 가이드

AXIS Design System 사용 중 자주 발생하는 문제와 해결 방법을 정리한 문서입니다.

---

## 1. "useTheme은 ThemeProvider 내부에서만 사용 가능합니다" 에러

### 증상

```
Error: useTheme은 ThemeProvider 내부에서만 사용 가능합니다.
앱 루트에 <ThemeProvider>를 추가하세요.
```

### 원인

`useTheme()` 훅은 React Context를 통해 테마 상태를 제공합니다. `<ThemeProvider>`로 감싸지 않은 컴포넌트 트리에서 `useTheme()`을 호출하면 이 에러가 발생합니다.

### 해결

앱의 최상위(루트)에 `<ThemeProvider>`를 추가합니다.

**React 앱 (Vite 등)**

```tsx
import { ThemeProvider } from '@axis-ds/theme'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="axis-theme">
      <MyApp />
    </ThemeProvider>
  )
}
```

**Next.js App Router**

`@axis-ds/theme` 1.5.0 이상은 서버 컴포넌트인 `app/layout.tsx` 에서 `<ThemeProvider>` 를 바로 써도 됩니다(패키지가 `"use client"` 모듈입니다). 1.4.0 이하는 아래처럼 `'use client'` 래퍼를 둡니다. 래퍼는 1.5.0 이상에서도 그대로 동작합니다.

```tsx
// app/providers.tsx
'use client'

import { ThemeProvider } from '@axis-ds/theme'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="axis-theme">
      {children}
    </ThemeProvider>
  )
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

> `ThemeProvider`의 `defaultTheme` 기본값은 `"system"`이며, `storageKey` 기본값은 `"axis-theme"`입니다. 필요에 따라 변경할 수 있습니다.

---

## 2. Tailwind CSS 스타일 미적용

### 증상

AXIS 컴포넌트가 렌더링되지만 스타일이 전혀 적용되지 않거나, 일부 유틸리티 클래스가 누락됩니다.

### 원인

Tailwind CSS는 스캔한 파일에 나오는 클래스만 생성합니다. AXIS 패키지의 빌드 결과물 경로가 스캔 대상에 없으면 해당 클래스가 최종 CSS에 포함되지 않습니다. Tailwind 3 은 `content` 배열로, Tailwind 4 는 CSS 의 `@source` 로 스캔 대상을 정합니다. Tailwind 4 는 `node_modules` 를 자동으로 스캔하지 않습니다.

### 해결 (Tailwind CSS 4)

`@import "tailwindcss";` 가 있는 전역 CSS 에 토큰 진입점과 사용하는 컴포넌트 패키지의 `tailwind.css` 를 한 줄씩 넣습니다(1.4.0 부터).

```css
/* app/globals.css */
@import "tailwindcss";
@import "@axis-ds/tokens/css/tailwind4";
@import "@axis-ds/ui-react/tailwind.css";
@import "@axis-ds/agentic-ui/tailwind.css"; /* @axis-ds/agentic-ui 를 쓸 때만 */
```

- 패키지의 `tailwind.css` 는 그 파일 기준 상대 경로 `@source "./dist"` 를 담고 있어 npm · pnpm 설치 모두에서 동작합니다. `shamefully-hoist` 는 필요 없습니다. 다만 pnpm 에서는 `@axis-ds/tokens` 를 앱에 직접 설치해야 `@axis-ds/tokens/css/tailwind4` import 가 풀립니다.
- 이 줄들은 `@import "tailwindcss";` 와 같은 파일에 둡니다. 별도 CSS 파일이나 JS/TSX 에서 import 하면 클래스가 생성되지 않습니다.
- Yarn Plug'n'Play(`.pnp.cjs`)에서는 워크스페이스 루트 `package.json` 에만 선언한 패키지의 CSS import(`@axis-ds/ui-react/tailwind.css` · `@axis-ds/tokens/css/tailwind4` 등)를 앱이 해석하지 못해 빌드가 `Can't resolve` 로 실패합니다. 쓰는 패키지를 앱 `package.json` 에 선언합니다(`axis check` 는 1.7.7 부터 이 경우를 WARN 으로 알립니다).
- Yarn Plug'n'Play 에서 앱에 선언해도 패키지는 `.yarn/cache` 의 zip 안에 있어, `tailwind.css` 의 `@source "./dist"` 가 Tailwind 4 스캐너에 보이지 않습니다. import 는 성공하지만 컴포넌트 클래스가 하나도 생성되지 않습니다(`@tailwindcss/cli` · `@tailwindcss/postcss` 모두). Plug'n'Play 루트(`.pnp.cjs` 가 있는 곳) `package.json` 에 아래처럼 `dependenciesMeta` 를 두고 `yarn install` 하면 `.yarn/unplugged` 에 풀려 node_modules 설치와 같은 결과가 나옵니다. 앱 `package.json` 에 두면 Yarn 이 따르지 않습니다(`axis check` 는 1.7.9 부터 이 경우를 WARN 으로 알립니다).

```json
{
  "dependenciesMeta": {
    "@axis-ds/ui-react": { "unplugged": true },
    "@axis-ds/agentic-ui": { "unplugged": true }
  }
}
```

`@axis-ds/ui-react` · `@axis-ds/agentic-ui` 1.8.3 부터는 패키지가 `preferUnplugged` 를 선언해 Yarn 이 자동으로 풀어요. 1.8.2 이하이거나 `dependenciesMeta` 로 `"unplugged": false` 를 준 경우에만 위 설정이 필요해요.

- `@axis-ds/cli` 의 `axis check` 는 Tailwind 4 전역 CSS 에 토큰 진입점이 없거나, `package.json` 에 선언된 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `tailwind.css` 줄이 없거나, 진입점이 있는데 create-next-app 기본 정의(`:root` 의 `--background: #ffffff` · `@theme inline` 의 `--color-background: var(--background)` · `body` 의 `background: var(--background)` 등)가 남아 있으면 WARN 을 내고 넣을 줄 · 실제로 남은 정의 이름을 문구에 보여 줍니다. `tailwind.css` 대신 그 패키지를 가리키는 `@source "../node_modules/@axis-ds/ui-react/dist";` 같은 줄을 같은 CSS 에 직접 썼으면 스캔 경로가 있는 것으로 봅니다(경로 문자열에 `@axis-ds/<패키지>` 가 들어 있는지로 판정, 주석 안 · `@source not` 은 제외). 버전은 설치본(`node_modules/<패키지>/package.json`)을 먼저 보고, 없으면 `package.json` 선언 범위를 봅니다. 1.4.0 미만이면 `(1.4.0 이상 필요: …)`(설치본으로 판정했으면 `@axis-ds/tokens 설치본 1.3.0` 처럼 표시), 설치본이 없고 `catalog:` 처럼 선언으로도 판정할 수 없으면 `(설치된 버전이 1.4.0 이상인지 확인하세요: …)` 가 붙습니다. `tailwind.css` 를 import 하는 패키지가 1.4.0 미만이거나 판정할 수 없으면(설치본이 없고 `catalog:` 등) 다른 문제가 없어도 WARN 입니다.

Tailwind 4 에서 자주 만나는 증상은 다음과 같습니다.

| 증상 | 원인 | 해결 |
|------|------|------|
| Button 등 npm 패키지 컴포넌트의 배경이 투명 | 패키지 `tailwind.css`(`@source`)가 없어 `bg-[var(--axis-*)]` 클래스가 생성되지 않음 | 위 `@import "@axis-ds/ui-react/tailwind.css";` 를 넣음 |
| 앱 코드의 `bg-primary` 가 투명, `--radius` 를 바꿔도 `rounded-md` 가 그대로 | 토큰 진입점이 없어 preset 매핑(`@theme inline`)이 없음 | `@import "@axis-ds/tokens/css/tailwind4";` 를 넣음 |
| `.dark` 안의 `bg-background` 가 투명, `font-mono` 가 Arial | create-next-app 기본 `:root` · `@theme inline` · `body` 블록이 같은 이름을 다른 값으로 정의 | 그 블록을 지움([Quick Start](./quick-start.md) 「Tailwind CSS 4」) |
| `border-red-500` 같은 테두리색이 적용되지 않음 | `@axis-ds/tokens/css/shadcn` 을 레이어 없이 직접 import 해 `* { border-color }` 가 유틸리티를 이김 | 직접 import 를 지우고 토큰 진입점만 씀(진입점은 토큰 변수를 base 레이어로 불러옴) |
| 색을 지정하지 않은 `ring-2` 가 글자색 | Tailwind 4 의 링 기본색은 `currentColor` | `ring-ring` 처럼 색을 지정 |
| Dialog · Popover 등이 애니메이션 없이 나타남 | `animate-in` · `fade-in-0` 류 클래스는 AXIS 진입점에 없음 | `tw-animate-css` 를 설치하고 `@import "tailwindcss";` 다음 줄에 `@import "tw-animate-css";` |
| Accordion 이 애니메이션 없이 열리고 Progress `indeterminate` 가 꽉 찬 막대 | 토큰 진입점이 없거나 이 keyframes 가 들어가기 전 버전이라 `accordion-*` · `progress-indeterminate` keyframes 가 없음 | `@import "@axis-ds/tokens/css/tailwind4";` 를 넣고 `@axis-ds/tokens` · `@axis-ds/ui-react` 를 최신으로 올림 |
| 움직임 줄이기 설정인데 애니메이션이 돎 | 앱 코드의 애니메이션 클래스(AXIS 컴포넌트 밖) | 그 요소에 `motion-reduce:animate-none` 을 더함. AXIS 컴포넌트는 열고 닫기 · Accordion 에 `motion-reduce:!animate-none` 을 가짐. 로딩 · 진행 표시(스피너 · Progress 불확정 · Skeleton · 실행 중 표시)는 의도적으로 멈추지 않고 2~3배 느리게 돎(`motion-reduce:![animation-duration:...]`) |

### 해결 (Tailwind CSS 3)

`tailwind.config.js` (또는 `tailwind.config.ts`)의 `content` 배열에 AXIS 패키지 경로를 추가합니다.

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@axis-ds/*/dist/**/*.{js,mjs}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Yarn Plug'n'Play(`.pnp.cjs`)에는 `node_modules` 가 없어 위의 `./node_modules/...` 경로가 스캔되지 않아요. `const path = require("path")` 뒤 `path.join(path.dirname(require.resolve("@axis-ds/ui-react")), "..", "dist/**/*.{js,mjs}")` 처럼 실제 위치를 넣거나, `package.json` 의 `dependenciesMeta` 에 `"@axis-ds/ui-react": { "unplugged": true }` 를 두고 `yarn install` 뒤 `.yarn/unplugged/*/node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}` 를 넣으세요(모노레포 앱이면 앞에 `../../` 같은 상위 경로). 패키지는 앱 `package.json` 에 선언해야 해요.

**애니메이션 (Tailwind 3)**: Dialog · Popover · Select 등이 애니메이션 없이 열리고 닫히면 `tailwindcss-animate` 를 설치하고 `plugins: [require('tailwindcss-animate')]` 로 넣습니다(`animate-in` · `fade-in-0` 류). Accordion · Progress `indeterminate` 의 keyframes 는 `@axis-ds/tokens/tailwind` preset 이 정의하므로 preset 을 `presets` 에 넣으면 됩니다. preset 을 쓰지 않으면 `import { axisKeyframes, axisAnimation } from '@axis-ds/tokens/tailwind'` 를 `theme.extend.keyframes` · `theme.extend.animation` 에 넣습니다.

**복사 설치(`axis add` · shadcn 레지스트리)**: 레지스트리 항목의 `dependencies` 에는 애니메이션 플러그인이 들어 있지 않습니다. 플러그인 이름이 Tailwind 3 · 4 에 따라 다르고 설정 줄도 함께 넣어야 해서 패키지 설치만으로는 해결되지 않기 때문입니다. 위 Tailwind 3 · Tailwind 4 안내대로 직접 넣습니다.

**pnpm 사용 시 주의 (Tailwind 3)**: pnpm은 심볼릭 링크 기반으로 `node_modules`를 관리합니다. 경로가 올바르게 해석되지 않는 경우, 절대 경로로 지정하거나 `.npmrc`에 `shamefully-hoist=true`를 설정합니다.

```ini
# .npmrc
shamefully-hoist=true
```

설정 변경 후 개발 서버를 재시작하세요.

---

## 3. TypeScript 타입 에러

### 증상

```
Type error: Could not find a declaration file for module '@axis-ds/ui-react'.
```

또는 JSX 관련 타입 에러가 발생합니다.

```
Type 'ReactNode' is not assignable to type 'ReactElement'.
```

### 원인

- `@types/react` 버전이 설치되지 않았거나, React 버전과 불일치
- `tsconfig.json`의 `moduleResolution` 설정이 패키지의 `exports` 필드를 지원하지 않음

### 해결

**1단계: peerDependencies 확인**

AXIS 패키지는 `react >= 18.0.0`을 요구합니다. 프로젝트의 React 버전을 확인하세요.

```bash
pnpm list react react-dom @types/react
```

**2단계: @types/react 설치**

```bash
pnpm add -D @types/react @types/react-dom
```

**3단계: tsconfig.json 설정 확인**

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

핵심 설정:

| 옵션 | 권장값 | 이유 |
|------|--------|------|
| `moduleResolution` | `"bundler"` | package.json `exports` 필드를 올바르게 해석 |
| `jsx` | `"react-jsx"` | React 17+ JSX Transform 지원 |
| `skipLibCheck` | `true` | 외부 패키지 타입 충돌 방지 |

> `moduleResolution`이 `"node"`인 경우 `exports` 필드가 무시되어 서브패스 import(`@axis-ds/ui-react/button` 등)가 동작하지 않을 수 있습니다. `"bundler"` 또는 `"node16"`으로 변경하세요.

---

## 4. 빌드 에러

### 4-1. "Module not found" 에러

#### 증상

```
Module not found: Can't resolve '@axis-ds/ui-react'
```

#### 원인

의존성이 설치되지 않았거나, 패키지 매니저의 lock 파일이 동기화되지 않은 상태입니다.

#### 해결

```bash
# 의존성 재설치
pnpm install

# lock 파일 문제 시 클린 설치
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 1.5.0 으로 올린 뒤 `./chunk-*.mjs` 를 찾지 못할 때

```
Module not found: Can't resolve './chunk-QXQWVRXN.mjs'
```

1.5.0 부터 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `dist` 는 공용 `chunk-*.mjs` 없이 소스 파일 단위로 나옵니다. 이전 버전으로 빌드한 Next.js webpack 캐시(`.next/cache`)가 남아 있으면 사라진 chunk 파일을 찾다가 실패합니다. `.next` 를 지우고 다시 빌드하세요.

```bash
rm -rf .next
pnpm build
```

### 4-2. ESM/CJS 호환성 에러

#### 증상

```
SyntaxError: Cannot use import statement outside a module
```

또는

```
require() of ES Module not supported
```

#### 원인

AXIS 패키지는 ESM(`*.mjs`)과 CJS(`*.js`) 모두 제공합니다. 번들러 설정에 따라 잘못된 포맷이 로드될 수 있습니다.

#### 해결

`package.json`의 `exports` 필드가 올바르게 해석되는지 확인합니다. AXIS 패키지는 다음 구조로 export됩니다:

```jsonc
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",   // ESM
      "require": "./dist/index.js"    // CJS
    }
  }
}
```

번들러가 `exports` 필드를 지원하지 않는 경우, `main` 또는 `module` 필드를 통해 진입점을 확인하세요.

### 4-3. Next.js에서 사용 시 에러

#### 증상

```
SyntaxError: Unexpected token 'export'
```

Next.js가 외부 패키지의 ESM 코드를 트랜스파일하지 못하는 경우 발생합니다.

#### 해결

`next.config.js`에 `transpilePackages`를 추가합니다.

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@axis-ds/ui-react',
    '@axis-ds/theme',
    '@axis-ds/tokens',
    '@axis-ds/agentic-ui',
  ],
}

module.exports = nextConfig
```

---

## 5. 자주 묻는 질문 (FAQ)

### Q: Tailwind CSS 없이 사용할 수 있나요?

AXIS 컴포넌트는 CSS 변수 기반 디자인 토큰을 사용하므로 Tailwind 없이도 동작은 가능합니다. 다만 컴포넌트 내부에서 Tailwind 유틸리티 클래스를 사용하고 있어 스타일이 올바르게 적용되지 않을 수 있습니다. **Tailwind CSS와 함께 사용하는 것을 권장합니다.**

Tailwind 없이 사용하려면 AXIS 패키지의 빌드 결과물에 포함된 CSS 변수를 직접 정의하고, 누락된 유틸리티 클래스에 대응하는 CSS를 별도로 작성해야 합니다.

### Q: Next.js App Router에서 사용할 수 있나요?

사용할 수 있습니다. 1.5.0 부터 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` · `@axis-ds/theme` 는 `"use client"` 를 쓰지 않은 서버 컴포넌트(`app/page.tsx` · `app/layout.tsx`)에서 바로 import 해 렌더할 수 있습니다. 클라이언트 상태가 필요한 컴포넌트(ui-react 의 `Avatar` · `Command` 계열, agentic-ui 의 `CodeBlock` · `StreamingText` 등 7개, theme 의 `ThemeProvider`)는 패키지 안에 클라이언트 경계가 있어 쓰는 쪽에서 할 일이 없습니다. 목록과 판단 기준은 각 패키지 README 의 「서버 컴포넌트」 절을 참고하세요.

- `cn` 과 `buttonVariants` · `avatarVariants` 등 `*Variants` 함수는 서버 컴포넌트에서 직접 호출할 수 있습니다.
- 서버 컴포넌트에서 `onClick` · `onFeedback` 같은 **함수 prop 은 넘길 수 없습니다**(React Server Components 규칙). `Event handlers cannot be passed to Client Component props` 류 오류가 나면 핸들러를 쓰는 부분을 `'use client'` 파일로 옮깁니다.

1.4.0 이하에서는 `ThemeProvider` · `Avatar` · `Command` 하위 컴포넌트 · agentic-ui 7개 컴포넌트를 서버 컴포넌트에서 쓰면 `next build` 가 실패합니다(`createContext is not a function` · `useState is not a function` · `Element type is invalid`). 1.5.0 으로 올리거나, 쓰는 파일에 `'use client'` 를 두거나, 아래처럼 클라이언트 컴포넌트로 감쌉니다.

```tsx
// app/providers.tsx
'use client'

import { ThemeProvider } from '@axis-ds/theme'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      {children}
    </ThemeProvider>
  )
}
```

서버 컴포넌트에서는 `useTheme()`을 호출할 수 없습니다. 테마 정보가 필요한 컴포넌트는 `'use client'` 지시문을 추가하세요.

### Q: 다크모드 전환 시 깜빡임(FOUC)을 방지하려면?

SSR/SSG 환경에서 초기 렌더링 시 테마 클래스가 적용되기 전 잠깐 기본 스타일이 보이는 현상(Flash of Unstyled Content)이 발생할 수 있습니다.

**해결 방법**: `<html>` 태그에 `suppressHydrationWarning`을 추가하고, `<head>`에 인라인 스크립트를 삽입하여 렌더링 전에 테마 클래스를 적용합니다.

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('axis-theme') || 'system';
                var resolved = theme;
                if (theme === 'system') {
                  resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark' : 'light';
                }
                document.documentElement.classList.add(resolved);
                document.documentElement.setAttribute('data-theme', resolved);
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

이 스크립트는 브라우저가 HTML을 파싱하는 즉시 실행되어, React 하이드레이션 전에 올바른 테마 클래스를 `<html>` 요소에 적용합니다. `suppressHydrationWarning`은 서버/클라이언트 간 클래스 불일치로 인한 React 경고를 억제합니다.
