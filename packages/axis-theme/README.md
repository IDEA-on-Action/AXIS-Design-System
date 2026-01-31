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

## 문서

자세한 사용법은 [AXIS Design System 문서](https://axis.minu.best)를 참고하세요.

## 라이선스

MIT
