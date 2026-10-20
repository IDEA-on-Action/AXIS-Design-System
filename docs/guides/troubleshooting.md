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
- `@axis-ds/cli` 의 `axis check` 는 Tailwind 4 전역 CSS 에 토큰 진입점이 없거나, `package.json` 에 선언된 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `tailwind.css` 줄이 없거나, 진입점이 있는데 create-next-app 기본 정의(`:root` 의 `--background: #ffffff` · `@theme inline` 의 `--color-background: var(--background)` · `body` 의 `background: var(--background)` 등)가 남아 있으면 WARN 을 내고 넣을 줄 · 실제로 남은 정의 이름을 문구에 보여 줍니다. `tailwind.css` 대신 그 패키지를 가리키는 `@source "../node_modules/@axis-ds/ui-react/dist";` 같은 줄을 같은 CSS 에 직접 썼으면 스캔 경로가 있는 것으로 봅니다(경로 문자열에 `@axis-ds/<패키지>` 가 들어 있는지로 판정, 주석 안 · `@source not` 은 제외). 버전은 설치본(`node_modules/<패키지>/package.json`)을 먼저 보고, 없으면 `package.json` 선언 범위를 봅니다. 1.4.0 미만이면 `(1.4.0 이상 필요: …)`(설치본으로 판정했으면 `@axis-ds/tokens 설치본 1.3.0` 처럼 표시), 설치본이 없고 `catalog:` 처럼 선언으로도 판정할 수 없으면 `(설치된 버전이 1.4.0 이상인지 확인하세요: …)` 가 붙습니다. `tailwind.css` 를 import 하는 패키지가 1.4.0 미만이거나 판정할 수 없으면(설치본이 없고 `catalog:` 등) 다른 문제가 없어도 WARN 입니다.

Tailwind 4 에서 자주 만나는 증상은 다음과 같습니다.

| 증상 | 원인 | 해결 |
|------|------|------|
| Button 등 npm 패키지 컴포넌트의 배경이 투명 | 패키지 `tailwind.css`(`@source`)가 없어 `bg-[var(--axis-*)]` 클래스가 생성되지 않음 | 위 `@import "@axis-ds/ui-react/tailwind.css";` 를 넣음 |
| 앱 코드의 `bg-primary` 가 투명, `--radius` 를 바꿔도 `rounded-md` 가 그대로 | 토큰 진입점이 없어 preset 매핑(`@theme inline`)이 없음 | `@import "@axis-ds/tokens/css/tailwind4";` 를 넣음 |
| `.dark` 안의 `bg-background` 가 투명, `font-mono` 가 Arial | create-next-app 기본 `:root` · `@theme inline` · `body` 블록이 같은 이름을 다른 값으로 정의 | 그 블록을 지움([Quick Start](./quick-start.md) 「Tailwind CSS 4」) |
| `border-red-500` 같은 테두리색이 적용되지 않음 | `@axis-ds/tokens/css/shadcn` 을 레이어 없이 직접 import 해 `* { border-color }` 가 유틸리티를 이김 | 직접 import 를 지우고 토큰 진입점만 씀(진입점은 토큰 변수를 base 레이어로 불러옴) |
| 색을 지정하지 않은 `ring-2` 가 글자색 | Tailwind 4 의 링 기본색은 `currentColor` | `ring-ring` 처럼 색을 지정 |
| Dialog · Popover 등이 애니메이션 없이 나타남 | `animate-in` · `fade-in-0` 류 클래스는 AXIS 진입점에 없음 | tailwindcss-animate 류 애니메이션 플러그인을 앱에 설치 |

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

사용할 수 있습니다. `ThemeProvider`는 내부적으로 `useState`, `useEffect` 등 클라이언트 훅을 사용하므로 **클라이언트 컴포넌트**로 래핑해야 합니다.

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
