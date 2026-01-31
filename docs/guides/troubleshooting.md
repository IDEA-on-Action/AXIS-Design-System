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

Tailwind CSS는 `content` 배열에 지정된 경로의 파일만 스캔하여 클래스를 생성합니다. AXIS 패키지의 빌드 결과물 경로가 `content`에 포함되지 않으면 해당 클래스가 최종 CSS에 포함되지 않습니다.

### 해결

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

**pnpm 사용 시 주의**: pnpm은 심볼릭 링크 기반으로 `node_modules`를 관리합니다. 경로가 올바르게 해석되지 않는 경우, 절대 경로로 지정하거나 `.npmrc`에 `shamefully-hoist=true`를 설정합니다.

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
