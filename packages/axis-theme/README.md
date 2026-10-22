# @axis-ds/theme

AXIS Design System의 테마 프로바이더 및 다크모드 지원 패키지입니다.

## 설치

```bash
npm install @axis-ds/theme
# or
pnpm add @axis-ds/theme
```

## 사용법

```tsx
import { ThemeProvider, useTheme } from '@axis-ds/theme';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <YourApp />
    </ThemeProvider>
  );
}
```

## 서버 컴포넌트 (Next.js App Router)

1.5.0 부터 패키지 전체가 `"use client"` 모듈이라, 서버 컴포넌트인 `app/layout.tsx` 에서 `ThemeProvider` 를 바로 써도 됩니다. 별도 `providers.tsx`(`'use client'`) 래퍼는 필요 없습니다(1.4.0 이하는 서버 컴포넌트가 import 만 해도 `createContext is not a function` 으로 빌드가 멈춰 래퍼가 필요했습니다. 기존 래퍼는 그대로 둬도 동작합니다).

```tsx
// app/layout.tsx (서버 컴포넌트)
import { ThemeProvider } from '@axis-ds/theme';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

- `ThemeProvider` 의 props(`defaultTheme` · `storageKey` · `defaultBrand` · `brandStorageKey`)는 모두 문자열이라 서버에서 넘길 수 있습니다. `children` 으로 넘긴 서버 컴포넌트는 서버에서 렌더됩니다.
- `useTheme()` 은 훅이라 클라이언트 컴포넌트(`'use client'` 파일)에서만 호출합니다. 서버 컴포넌트에서 부르면 `Attempted to call useTheme() from the server` 오류가 납니다.
- 이 패키지에는 서버에서 호출할 함수(상수 · 유틸)가 없습니다.

## 문서

자세한 사용법은 [AXIS Design System 문서](https://axis-design-system.pages.dev)를 참고하세요.

## 라이선스

MIT
