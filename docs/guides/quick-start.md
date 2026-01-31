# Quick Start

AXIS Design System을 프로젝트에 설정하고 첫 컴포넌트를 렌더링하는 가이드입니다.

## 사전 요구사항

- Node.js 20+
- React 18+
- Tailwind CSS 3.4+

## 1. 패키지 설치

```bash
pnpm add @axis-ds/ui-react @axis-ds/theme @axis-ds/tokens
```

## 2. Tailwind CSS 설정

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

여러 컴포넌트를 한 번에 추가할 수도 있습니다.

```bash
npx @axis-ds/cli add button input card
```

## 다음 단계

- 전체 컴포넌트 목록은 [컴포넌트 문서](/docs/components)를 참고하세요.
- 다크모드 설정은 `ThemeProvider`의 `defaultTheme="dark"`으로 전환하거나, `useTheme()` 훅으로 런타임에 제어할 수 있습니다.
- AI/Agent 전용 컴포넌트가 필요하다면 `@axis-ds/agentic-ui` 패키지를 확인하세요.
