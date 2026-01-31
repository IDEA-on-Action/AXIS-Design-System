# 테마 커스터마이징 가이드

AXIS Design System의 테마 구조와 커스터마이징 방법을 설명합니다.

---

## 1. 토큰 구조

AXIS 토큰은 세 계층으로 구성됩니다. 하위 계층은 상위 계층을 참조하며, CSS 변수 접두사는 `--axis-*`를 사용합니다.

### Primitives (원시값)

색상 팔레트, 폰트 크기, 간격 등 가장 기본이 되는 값입니다. 직접 사용하지 않고 상위 토큰에서 참조합니다.

```
packages/axis-tokens/src/primitives/
├── colors.json       # 색상 팔레트 (gray, blue, green, red, yellow, orange, purple)
├── typography.json   # 폰트 패밀리, 크기, 굵기, 행간
└── spacing.json      # 간격(space), 라운드(radius)
```

CSS 변수 예시:

```css
--axis-color-blue-500: #3B82F6;
--axis-color-gray-900: #111827;
--axis-font-size-base: 1rem;
--axis-space-4: 1rem;
--axis-radius-lg: 0.5rem;
```

### Semantic (의미 기반)

UI 용도에 따라 이름이 부여된 토큰입니다. 라이트/다크 모드별로 다른 원시값을 참조합니다.

```
packages/axis-tokens/src/semantic/
├── light.json    # 라이트 모드 시맨틱 토큰
└── dark.json     # 다크 모드 시맨틱 토큰
```

시맨틱 토큰은 `surface`, `text`, `border`, `icon` 네 카테고리로 구분됩니다.

| 카테고리 | 용도 | 예시 |
|----------|------|------|
| `surface` | 배경색 | `--axis-surface-default`, `--axis-surface-brand` |
| `text` | 텍스트 색상 | `--axis-text-primary`, `--axis-text-error` |
| `border` | 테두리 색상 | `--axis-border-default`, `--axis-border-focus` |
| `icon` | 아이콘 색상 | `--axis-icon-default`, `--axis-icon-brand` |

라이트/다크 모드에서 같은 변수가 다른 값을 가집니다.

```css
/* 라이트 모드 */
--axis-surface-default: #FFFFFF;       /* white */
--axis-text-primary: #111827;          /* gray-900 */

/* 다크 모드 */
--axis-surface-default: #030712;       /* gray-950 */
--axis-text-primary: #F3F4F6;          /* gray-100 */
```

### Component (컴포넌트별)

개별 컴포넌트에 특화된 토큰입니다. 상태(hover, active, disabled 등)별 값을 정의합니다.

```
packages/axis-tokens/src/component/
└── components.json
```

지원 컴포넌트: `button`, `button-secondary`, `button-ghost`, `button-destructive`, `input`, `card`, `badge`, `dialog`

CSS 변수 예시:

```css
--axis-button-bg-default: #3B82F6;
--axis-button-bg-hover: #2563EB;
--axis-button-text-default: #FFFFFF;
--axis-card-border-default: #E5E7EB;
--axis-input-border-focus: #3B82F6;
```

---

## 2. CSS 변수 오버라이드

`:root` 또는 `[data-theme]` 셀렉터로 토큰 값을 오버라이드할 수 있습니다.

### 전역 오버라이드

```css
:root {
  /* 브랜드 색상 변경 */
  --axis-color-blue-500: #6366F1;
  --axis-color-blue-600: #4F46E5;
  --axis-color-blue-700: #4338CA;

  /* 시맨틱 토큰 직접 변경 */
  --axis-surface-brand: #6366F1;
  --axis-text-brand: #4F46E5;
}
```

### 테마별 오버라이드

```css
[data-theme="light"] {
  --axis-surface-default: #FAFAFA;
  --axis-border-default: #E0E0E0;
}

[data-theme="dark"] {
  --axis-surface-default: #0A0A0A;
  --axis-border-default: #2A2A2A;
}
```

### 컴포넌트 토큰 오버라이드

```css
:root {
  /* 버튼 기본 색상을 인디고로 변경 */
  --axis-button-bg-default: #6366F1;
  --axis-button-bg-hover: #4F46E5;
  --axis-button-bg-active: #4338CA;

  /* 카드 스타일 조정 */
  --axis-card-shadow-default: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --axis-card-border-default: transparent;
}
```

---

## 3. 다크모드 설정

### ThemeProvider 설정

앱 루트에 `ThemeProvider`를 추가합니다.

```tsx
import { ThemeProvider } from "@axis-ds/theme"

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="axis-theme">
      <Main />
    </ThemeProvider>
  )
}
```

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `"light" \| "dark" \| "system"` | `"system"` | 초기 테마 모드 |
| `storageKey` | `string` | `"axis-theme"` | localStorage에 테마를 저장할 키 |
| `children` | `ReactNode` | - | 자식 요소 |

`ThemeProvider`는 `<html>` 요소에 `data-theme` 속성과 클래스(`light` 또는 `dark`)를 자동으로 설정합니다. `"system"` 모드에서는 OS의 `prefers-color-scheme` 설정을 감지하여 자동 전환합니다.

### useTheme 훅으로 테마 전환

```tsx
import { useTheme } from "@axis-ds/theme"

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <div>
      <p>현재 설정: {theme}</p>
      <p>실제 적용: {resolvedTheme}</p>

      <button onClick={() => setTheme("light")}>라이트</button>
      <button onClick={() => setTheme("dark")}>다크</button>
      <button onClick={() => setTheme("system")}>시스템</button>
    </div>
  )
}
```

**반환값**:

| 속성 | Type | Description |
|------|------|-------------|
| `theme` | `"light" \| "dark" \| "system"` | 현재 설정된 테마 모드 |
| `setTheme` | `(theme: Theme) => void` | 테마를 변경하는 함수 |
| `resolvedTheme` | `"light" \| "dark"` | 실제 적용된 테마 (`"system"`이면 OS 설정 기준) |

> `useTheme`은 반드시 `ThemeProvider` 내부에서 사용해야 합니다.

---

## 4. 커스텀 테마 생성

### CSS 변수 셋 정의

브랜드 컬러에 맞는 커스텀 테마를 CSS 파일로 정의합니다.

```css
/* styles/custom-theme.css */

/* 라이트 모드 커스텀 테마 */
[data-theme="light"] {
  /* 브랜드 계열 */
  --axis-surface-brand: #7C3AED;
  --axis-text-brand: #6D28D9;
  --axis-icon-brand: #7C3AED;
  --axis-border-focus: #7C3AED;

  /* 버튼 */
  --axis-button-bg-default: #7C3AED;
  --axis-button-bg-hover: #6D28D9;
  --axis-button-bg-active: #5B21B6;
  --axis-button-border-focus: #A78BFA;

  /* 배지 */
  --axis-badge-info-bg: #EDE9FE;
  --axis-badge-info-text: #6D28D9;
}

/* 다크 모드 커스텀 테마 */
[data-theme="dark"] {
  --axis-surface-brand: #8B5CF6;
  --axis-text-brand: #A78BFA;
  --axis-icon-brand: #8B5CF6;
  --axis-border-focus: #8B5CF6;

  --axis-button-bg-default: #7C3AED;
  --axis-button-bg-hover: #8B5CF6;
  --axis-button-bg-active: #6D28D9;
  --axis-button-border-focus: #7C3AED;
}
```

앱 진입점에서 import합니다.

```tsx
import "@axis-ds/tokens/css"
import "./styles/custom-theme.css"  // 토큰 CSS 이후에 import
```

### Tailwind 설정 확장

`tailwind.config.ts`에서 AXIS 토큰을 Tailwind 유틸리티로 연결합니다.

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 시맨틱 토큰을 Tailwind 색상으로 매핑
        surface: {
          DEFAULT: "var(--axis-surface-default)",
          secondary: "var(--axis-surface-secondary)",
          brand: "var(--axis-surface-brand)",
        },
        foreground: {
          DEFAULT: "var(--axis-text-primary)",
          secondary: "var(--axis-text-secondary)",
          brand: "var(--axis-text-brand)",
        },
        border: {
          DEFAULT: "var(--axis-border-default)",
          focus: "var(--axis-border-focus)",
        },
        // 상태 색상
        success: "var(--axis-text-success)",
        warning: "var(--axis-text-warning)",
        error: "var(--axis-text-error)",
        info: "var(--axis-text-info)",
      },
      borderRadius: {
        sm: "var(--axis-radius-sm)",
        md: "var(--axis-radius-md)",
        lg: "var(--axis-radius-lg)",
        xl: "var(--axis-radius-xl)",
      },
      fontFamily: {
        sans: "var(--axis-font-family-sans)",
        mono: "var(--axis-font-family-mono)",
      },
    },
  },
}

export default config
```

이렇게 설정하면 Tailwind 클래스에서 AXIS 토큰을 직접 사용할 수 있습니다.

```tsx
<div className="bg-surface text-foreground border-border rounded-lg">
  <h2 className="text-foreground-brand">제목</h2>
  <p className="text-foreground-secondary">설명</p>
</div>
```

---

## 참고

- 토큰 소스: `packages/axis-tokens/src/`
- 테마 프로바이더 소스: `packages/axis-theme/src/index.ts`
- 빌드된 CSS 변수: `@axis-ds/tokens/css`
- 빌드된 JSON 토큰: `@axis-ds/tokens/json`
