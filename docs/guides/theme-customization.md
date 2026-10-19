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
  /* 브랜드 색상: 시맨틱 토큰을 직접 변경 */
  --axis-surface-brand: #6366F1;
  --axis-text-brand: #4F46E5;
}
```

> primitive 색(`--axis-color-*`)을 덮어써서 브랜드 색을 바꾸는 방식은 컴포넌트 대부분에 닿지 않습니다. semantic · component 토큰은 빌드 때 hex 값으로 풀려 나가므로(`variables.css`에 `var(` 참조 없음) primitive 값을 바꿔도 따라 바뀌지 않습니다. 1.2.1부터 primitive 색 오버라이드가 닿는 곳은 ui-react Progress의 `success` · `warning` · `destructive` 채움과 앱 코드에서 `var(--axis-color-*)`를 직접 쓰는 곳뿐입니다(agentic-ui에는 닿지 않음). 브랜드 색은 시맨틱 · component 토큰을 덮어쓰거나 「4. 브랜드 테마」를 사용합니다.
>
> `:root`에서 덮어쓴 값은 기본 `.dark` 블록과 명시도가 같고 뒤에 오므로 다크 모드에서도 그대로 유지됩니다. 라이트 · 다크에 다른 값을 쓰려면 아래 「테마별 오버라이드」를 사용합니다.

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
  --axis-card-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --axis-card-border-default: transparent;
}
```

> Card 그림자는 `--axis-card-shadow`로 조정합니다(1.3.0부터, 기본값은 `--axis-shadow-sm`과 같은 값). 기존 `--axis-card-shadow-default`는 1.3.0부터 폐기 예정이며 Card에 반영되지 않습니다. 1.x 동안 이름과 값은 그대로 남습니다.

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
| `defaultBrand` | `string` | - | 초기 브랜드 이름, `<html data-brand>`에 붙음 (1.3.0부터) |
| `brandStorageKey` | `string` | `"axis-brand"` | localStorage에 브랜드를 저장할 키 (1.3.0부터) |
| `children` | `ReactNode` | - | 자식 요소 |

`ThemeProvider`는 `<html>` 요소에 `data-theme` 속성과 클래스(`light` 또는 `dark`)를 자동으로 설정합니다. `"system"` 모드에서는 OS의 `prefers-color-scheme` 설정을 감지하여 자동 전환합니다. 브랜드를 지정하면 `data-brand` 속성도 붙입니다(「4. 브랜드 테마」 참고).

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
| `brand` | `string \| undefined` | 현재 브랜드 (없으면 기본 토큰) (1.3.0부터) |
| `setBrand` | `(brand: string \| undefined) => void` | 브랜드를 변경하는 함수, `undefined`면 속성과 저장값을 지움 (1.3.0부터) |

> `useTheme`은 반드시 `ThemeProvider` 내부에서 사용해야 합니다.

---

## 4. 브랜드 테마 (1.3.0부터)

### 개념

브랜드는 테마(라이트 · 다크)와 독립된 축이며, 선택자는 `data-brand` 속성입니다. 같은 브랜드 안에서 라이트 · 다크를 그대로 전환할 수 있고, 브랜드를 지정하지 않으면 1.2.1과 같은 화면입니다.

- 제공 브랜드: `ontology` 하나
- 브랜드 목록: `@axis-ds/tokens/brands` (`dist/brands/index.json`, 형식 `{ "brands": [{ "name", "css", "meta" }] }`)
- 브랜드 메타데이터: `@axis-ds/tokens/brands/ontology/brand.json` (`name` · `description` · `themes` · `a11y`)
- 브랜드 CSS: `@axis-ds/tokens/css/brands/ontology`

### import 순서

브랜드 CSS는 토큰 CSS와 앱의 shadcn 변수 정의보다 **뒤에** import합니다.

```tsx
import "@axis-ds/tokens/css"
import "@axis-ds/tokens/css/shadcn"            // shadcn 호환 변수를 쓰는 경우
import "./globals.css"                          // 앱이 --primary 등 shadcn 변수를 직접 정의하는 경우
import "@axis-ds/tokens/css/brands/ontology"    // 항상 마지막
```

라이트 선택자 `[data-brand="ontology"]`와 `:root` · `.dark`는 명시도가 같아서(0,1,0) 나중에 온 쪽이 이깁니다. 브랜드 CSS를 토큰 CSS와 `globals.css` 사이에 두면 `globals.css`의 `:root`가 브랜드 값을 덮어써 `--primary` 등이 기본값으로 돌아갑니다. 문서 사이트의 `apps/web/src/app/layout.tsx`가 이 순서를 따릅니다.

### 브랜드 적용

`ThemeProvider`에 `defaultBrand`를 지정합니다.

```tsx
import { ThemeProvider } from "@axis-ds/theme"

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" defaultBrand="ontology">
      <Main />
    </ThemeProvider>
  )
}
```

`useTheme()`의 `brand` · `setBrand`로 전환합니다.

```tsx
import { useTheme } from "@axis-ds/theme"

function BrandToggle() {
  const { brand, setBrand } = useTheme()

  return (
    <div>
      <p>현재 브랜드: {brand ?? "기본"}</p>
      <button onClick={() => setBrand("ontology")}>Ontology</button>
      <button onClick={() => setBrand(undefined)}>기본</button>
    </div>
  )
}
```

`brandStorageKey`(기본 `"axis-brand"`)에 저장값이 있으면 `defaultBrand`보다 저장값이 먼저 적용됩니다. `setBrand(undefined)`는 `data-brand` 속성과 저장값을 함께 지웁니다.

### 선택자와 다크 모드

| 테마 | 선택자 |
|------|--------|
| 라이트 | `[data-brand="<brand>"]` |
| 다크 | `[data-brand="<brand>"].dark` · `[data-brand="<brand>"][data-theme="dark"]` · `.dark [data-brand="<brand>"]` |

다크 클래스는 `ThemeProvider`나 next-themes가 붙이는 `.dark`를 그대로 사용합니다. 지원하는 구성은 다음과 같습니다.

- 같은 요소: `<html class="dark" data-brand="ontology">`
- `.dark` 조상 아래의 브랜드 컨테이너: `<html class="dark">` 안의 `<div data-brand="ontology">`
- 하위 컨테이너(라이트): `<div data-brand="ontology">`

`[data-brand]` 조상 아래에 `.dark` 하위 요소를 두는 구성(`<div data-brand="ontology"><div class="dark">`)은 브랜드 다크 선택자에 걸리지 않습니다. 이 구성은 CSS 선택자 기준으로 판단한 것이며 E2E로 측정하지 않았습니다.

같은 요소에 `data-brand`와 `.dark`를 함께 붙이면, ontology 라이트 블록에만 있는 변수 9개(`--axis-radius-sm|md|lg`, 글꼴 2개, PlanCard 색 선, Card 그림자 2개, shadcn `--radius` 12px)는 import 순서대로 다크에서도 브랜드 라이트 값이 유지됩니다.

### Provider 없이 적용 · 첫 화면

`ThemeProvider` 없이 속성을 직접 붙여도 됩니다.

```ts
document.documentElement.setAttribute("data-brand", "ontology")  // 적용
document.documentElement.removeAttribute("data-brand")           // 해제
```

서버 마크업에 `<html data-brand="ontology">`를 넣을 수도 있습니다. 문서 사이트는 next-themes(`attribute="class"`)를 쓰므로 브랜드 전환 데모(`/docs/brand-demo/`)가 이 방식으로 속성을 다룹니다.

- `ThemeProvider`는 마운트 뒤 effect에서 속성을 붙이므로 첫 페인트는 기본 브랜드입니다. 첫 화면부터 브랜드를 보이려면 서버 마크업에 속성을 넣습니다.
- 서버 마크업에 속성을 넣고 `ThemeProvider`를 함께 쓰면 같은 브랜드를 `defaultBrand`로 지정합니다. 브랜드가 `undefined`이면 `ThemeProvider`가 마운트 때 속성을 지웁니다.
- 브랜드 이름은 검증하지 않습니다. 해당 브랜드 CSS를 import하지 않으면 속성이 있어도 기본 화면입니다.

### ontology 프리셋: 값의 출처와 접근성 보정

> 아래 보정과 색 결정은 대리 승인(2026-10-16 · 2026-10-17) 상태이며 **디자인 오너의 사후 확인을 기다립니다**. 확인 결과에 따라 이후 patch에서 값이 바뀔 수 있습니다(`brand.json`의 `a11y.status`).

값의 출처는 디자인 시스템 「온톨로지 플랫폼」 v1입니다. 라이트는 WCAG AA를 맞추려고 원본 값에 한 값만 보정했고, 다크는 원본 그대로입니다.

**보정한 값** (원본과 같은 색상(hue) · 채도를 유지하고 명도만 낮춤, 바탕 색은 바꾸지 않음)

| 역할 | 원본 | 보정 | 원본 대비 | 보정 후 대비 | 적용 변수 |
|---|---|---|---|---|---|
| 보조 · 흐린 글자 (`card` · `bg` · `panel` · `panel-2` 위) | `sub` #6B7280 | #5F6673 | 4.83 · 4.51 · 4.39 · 4.08:1 | 5.78 · 5.39 · 5.25 · 4.88:1 | `--axis-text-secondary` · `--axis-text-tertiary` · shadcn `--muted-foreground` |

**보정하지 않고 처리한 미달 쌍** (통과하는 단계 토큰을 골라 해결)

| 미달 쌍 (원본) | 대비 | 처리 |
|---|---|---|
| `key`/`key-light` (고른 칩 · 메뉴 글자) | 4.32:1 | brand · info 글자는 `key-dark`(#2757B8)를 씁니다(5.79:1) |
| `muted`/`card` (흐린 글) | 2.61:1 | 글자에 쓰지 않고 placeholder · 보조 아이콘 · 입력 hover 테두리에만 씁니다 |
| `line-2`/`card` (입력 테두리) | 1.40:1 | 원본을 유지하고, 키보드 포커스 때 `key` 색 2px 링으로 구분합니다(링 대비 라이트 4.66:1 · 다크 6.69:1) |
| `bad-line`/`card` (주의 점) | 1.52:1 | warning 아이콘에만 쓰고, 상태는 늘 글자와 함께 표시합니다 |

**함께 사후 확인을 기다리는 색 결정**

- 상태 색 접기: 성공 `ink-2`, 경고 · 오류 `bad`, 진행 · 정보 `key`
- warning 단계: 바탕 `bad-light`, 표식 · 글자 `bad`, 강조 `bad-dark`
- PlanCard 색 선 두께 1px, 에이전트 아바타 3색, Dialog overlay 기본값 유지
- 승인 범위에 맞추려고 바꾼 값: destructive 버튼 hover · active 바탕(`bad-light`), Alert warning 테두리 · `status.error-border`(`bad`), 비활성 버튼 글자(`sub-aa`)
- 대기 · 건너뜀 상태 점 `status-neutral-muted`는 비텍스트 대비 3:1에 못 미칩니다. 라이트 #D6DADF는 `surface-default` 위 1.40:1 · `surface-secondary` 위 1.28:1, 다크 #5F6874는 3.12:1 · 2.83:1입니다

v1은 색이 무채색 · `key` · `bad` 세 계열이라 상태가 색만으로 구분되지 않습니다. 상태는 글자 · 아이콘과 함께 표시합니다.

---

## 5. 커스텀 테마 생성

브랜드 축(`data-brand`)을 이용해 자기 브랜드를 정의합니다. 앱 안에서 CSS로 정의하는 방법과 tokens 패키지에 브랜드를 추가하는 방법이 있습니다.

### 앱에서 브랜드 CSS 정의

브랜드 컬러에 맞는 변수 셋을 브랜드 선택자로 정의합니다. 덮어쓰는 대상은 semantic · component 변수와, 필요하면 shadcn HSL 변수(`--primary` 등)입니다.

```css
/* styles/brand-acme.css */

/* 라이트 모드 */
[data-brand="acme"] {
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

/* 다크 모드 */
[data-brand="acme"].dark,
[data-brand="acme"][data-theme="dark"],
.dark [data-brand="acme"] {
  --axis-surface-brand: #8B5CF6;
  --axis-text-brand: #A78BFA;
  --axis-icon-brand: #8B5CF6;
  --axis-border-focus: #8B5CF6;

  --axis-button-bg-default: #7C3AED;
  --axis-button-bg-hover: #8B5CF6;
  --axis-button-bg-active: #6D28D9;
  --axis-button-border-focus: #7C3AED;

  --axis-badge-info-bg: #2E1065;
  --axis-badge-info-text: #C4B5FD;
}
```

라이트 블록에서 바꾼 색 변수는 다크 블록에도 짝을 둡니다. 짝이 없으면 같은 요소에 `.dark`를 붙였을 때 라이트 값이 다크에도 남습니다.

앱 진입점에서 토큰 CSS(와 앱의 `globals.css`) 뒤에 import하고, `<html data-brand="acme">`나 `ThemeProvider`의 `defaultBrand="acme"`로 적용합니다.

```tsx
import "@axis-ds/tokens/css"
import "./globals.css"
import "./styles/brand-acme.css"  // 토큰 CSS와 globals.css 이후에 import
```

### tokens 패키지에 브랜드 추가 (기여자용)

`@axis-ds/tokens`에 브랜드를 추가하면 빌드가 검증과 CSS 생성을 맡습니다. 실제 예는 `packages/axis-tokens/src/brands/ontology/`입니다.

1. `packages/axis-tokens/src/brands/<name>/`에 `light.json` · `dark.json` · `brand.json` 세 파일을 둡니다. 이름은 kebab-case입니다.
2. `light.json` · `dark.json`은 기본 토큰과 같은 경로에 값을 둡니다.

   ```json
   {
     "surface": { "brand": { "value": "#7C3AED" } },
     "button": { "bg": { "default": { "value": "#7C3AED" } } },
     "shadcn": { "primary": "262 83% 58%", "radius": "12px" }
   }
   ```

   - 덮어쓸 수 있는 범위는 semantic · component 토큰과 `radius` · `font.family` · `shadow`입니다. primitive 색(`color.*`)은 덮어쓸 수 없습니다.
   - 기본 토큰에 없는 경로나 기본 변수명 집합에 없는 변수명은 쓸 수 없습니다.
   - 최상위 예약 키 `shadcn`에는 shadcn 호환 변수 값을 HSL 삼중값(`"H S% L%"`) 또는 6자리 hex로 적습니다. `radius`는 px · rem 길이입니다.
   - 라이트에 둔 semantic 범주와 색 값은 `dark.json`에도 짝이 있어야 합니다.
3. `brand.json`에는 `name`(디렉터리 이름과 같음) · `description` · `themes: ["light", "dark"]` · `a11y` 객체를 둡니다.
4. `packages/axis-tokens/package.json`의 `exports`에 다음 항목을 더합니다(`"./brands"`는 이미 있음).

   ```json
   "./css/brands/<name>": "./dist/css/brands/<name>.css",
   "./brands/<name>/brand.json": "./dist/brands/<name>/brand.json"
   ```

5. `pnpm --filter @axis-ds/tokens build`로 `dist/css/brands/<name>.css` · `dist/brands/<name>/brand.json` · `dist/brands/index.json`을 만듭니다. 위 규칙이나 `exports` 항목을 어기면 빌드가 실패합니다.

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
- 브랜드 소스: `packages/axis-tokens/src/brands/`
- 빌드된 브랜드 CSS: `@axis-ds/tokens/css/brands/<brand>`
- 브랜드 전환 데모: 문서 사이트 `/docs/brand-demo/`
