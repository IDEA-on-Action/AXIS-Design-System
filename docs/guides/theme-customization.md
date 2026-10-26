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

### 밀도 토큰 (1.7.0부터)

컨트롤 높이 · 글자 크기 · 단계별 둥글기를 CSS 변수로 엽니다(WI-0026). 기본값은 1.6.x 의 고정 클래스와 같은 크기라, 브랜드를 지정하지 않은 화면은 바뀌지 않습니다(1.6.3 배포본과 Chromium 계산값 186개 대조, 차이 0). 줄 높이는 토큰이 아니라 크기별 고정값(Button sm · default · lg 16 · 20 · 24px, Input · Table 20px)이라 ontology 에서도 같습니다.

| 변수 | 기본값 | ontology | 쓰는 곳 |
|---|---|---|---|
| `--axis-control-h-sm` · `-md` · `-lg` | 32 · 40 · 48px | 27 · 34 · 42px | Button `sm` · `default`(`icon` 은 높이 · 너비 모두 md) · `lg` |
| `--axis-control-font-size-sm` · `-md` · `-lg` | 12 · 14 · 16px | 13 · 14 · 15px | Button 크기별 글자, Input 글자(md) |
| `--axis-field-h` | 40px | 36px | Input · Select 트리거 높이 |
| `--axis-toggle-h-sm` · `-md` · `-lg` | 36 · 40 · 44px | 기본값과 같음 | Toggle 높이와 최소 너비 |
| `--axis-table-font-size` | 14px | 13.5px | Table 본문 |
| `--axis-table-head-font-size` | 14px | 13px | TableHead |
| `--axis-radius-control` | `calc(var(--radius) - 2px)` (6px) | 8px | Button · Toggle |
| `--axis-radius-field` | `calc(var(--radius) - 2px)` (6px) | 6px | Input · Select 트리거 |
| `--axis-radius-surface` | `var(--radius)` (8px) | 12px | Card · Dialog(640px 이상) |

- 컴포넌트는 `h-[var(--axis-control-h-md,2.5rem)]` 처럼 리터럴 fallback 을 함께 둡니다. 토큰 CSS 가 1.6.x 이하이거나 `--radius` 가 없을 때(`@axis-ds/tokens/css/shadcn` 을 빼고 `@axis-ds/tokens/css` 만 쓸 때)도 위 기본 크기가 나옵니다. 둥글기 3개는 `--radius` 에서 계산되므로, shadcn 을 뺀 구성에서는 1.6.x 의 0px 가 아니라 fallback 6 · 6 · 8px 가 됩니다(Chromium 실측).
- 둥글기 기본값은 `:root` 에서 계산됩니다. 하위 요소에서 `--radius` 만 바꾸면 위 7개 컴포넌트는 따라가지 않으니, 그 요소에서 `--axis-radius-control|field|surface` 를 함께 바꿉니다.
- 대상 밖 컴포넌트(Select 팝업 · Popover · Dropdown Menu · Toast · agentic-ui 등)와 Sheet 는 지금처럼 preset 의 `rounded-*`(`--radius`)를 따릅니다. ontology 에서 Select 팝업은 10px, Sheet 는 0px 로 남습니다(디자인 시스템 v1 의 드로어도 0px).
- 버튼 27 · 34 · 42px 와 입력 36px 는 디자인 시스템 v1 화면의 렌더값(패딩과 Pretendard 줄 높이로 정해진 값)을 옮겨 적은 것입니다. 터치 화면에 쓰는 브랜드는 최소 크기를 브랜드에서 정합니다.

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

> primitive 색(`--axis-color-*`)을 덮어써서 브랜드 색을 바꾸는 방식은 컴포넌트 대부분에 닿지 않습니다. semantic · component 토큰은 빌드 때 hex 값으로 풀려 나가므로(`variables.css`에 `var(` 참조 없음) primitive 값을 바꿔도 따라 바뀌지 않습니다. 1.8.0부터 primitive 색 오버라이드가 닿는 곳은 앱 코드에서 `var(--axis-color-*)`를 직접 쓰는 곳뿐입니다(ui-react · agentic-ui 컴포넌트에는 닿지 않음). 1.2.1 ~ 1.7.x 에서는 ui-react Progress의 `success` · `warning` · `destructive` 채움에도 닿았지만, 1.8.0 에서 Progress 채움이 `--axis-progress-fill-*` component 토큰(빌드 때 hex 로 풀림)으로 옮겨 가 더는 닿지 않습니다. 브랜드 색은 시맨틱 · component 토큰을 덮어쓰거나 「4. 브랜드 테마」를 사용합니다.
>
> 1.8.0부터 ui-react Progress `default` 채움은 `--axis-surface-brand` 가 아니라 `--axis-progress-fill-default` 를 씁니다. 위처럼 `--axis-surface-brand` 만 덮어쓰면 Progress 는 기본 파랑으로 남으니, Progress 도 브랜드 색을 따르게 하려면 `--axis-progress-fill-default` 를 함께 덮어씁니다(`success` · `warning` · `destructive` 는 `--axis-progress-fill-success|warning|destructive`).
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

> 1.8.0부터 폼 컨트롤 일부는 `--axis-border-default` · `--axis-surface-tertiary` 대신 전용 component 토큰을 씁니다. `Checkbox` · `RadioGroupItem` · `Textarea` 경계는 `--axis-form-control-border`, `Switch` 꺼짐 바탕 · `Slider` 트랙은 `--axis-form-control-track` 입니다(`Input` · `Select` 트리거 경계는 전과 같이 `--axis-input-border-default`). 위 예시처럼 `--axis-border-default` · `--axis-surface-tertiary` 만 덮어쓰면 이 컨트롤에는 닿지 않으니, 같은 색을 원하면 두 변수를 함께 덮어씁니다. 경계 · 트랙은 비텍스트 대비 3:1(WCAG 1.4.11) 대상이라 기본값은 흰 바탕 4.83:1 인 gray.500 입니다. 옅은 색으로 바꾸면 그 대비가 깨질 수 있습니다.

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

### 브랜드 적용 빠른 시작

브랜드가 화면에 나타나려면 아래 항목을 모두 갖춰야 합니다. 하나라도 빠지면 CSS 변수는 바뀌어도 컴포넌트가 기본 모양이나 투명한 바탕으로 남습니다. 괄호 안의 값은 tokens · theme · ui-react · agentic-ui 1.6.0 배포본으로 만든 새 프로젝트에서 브라우저 계산 스타일로 잰 것입니다(2026-10-24).

**1. 전역 CSS (Tailwind CSS 4)** - `@import "tailwindcss";` 가 있는 같은 파일에 이 순서로 둡니다.

```css
/* app/globals.css (Tailwind CSS 4) */
@import "tailwindcss";
@import "@axis-ds/tokens/css/tailwind4";
@import "@axis-ds/ui-react/tailwind.css";
@import "@axis-ds/agentic-ui/tailwind.css";        /* @axis-ds/agentic-ui 를 쓸 때만 */
@import "@axis-ds/tokens/css/brands/ontology";     /* 브랜드: 마지막 */
```

- [ ] 쓰는 컴포넌트 패키지의 `tailwind.css` 를 넣었다. 빠지면 변수는 ontology 값(`--axis-button-bg-default` #326ADA)으로 바뀌지만 Button 바탕이 투명(`rgba(0, 0, 0, 0)`)하고 둥글기 0px, PlanCard 왼쪽 색 선 0px 입니다. 넣으면 rgb(50, 106, 218) · 10px · 1px 입니다. 1.7.0 부터 Button 둥글기는 밀도 토큰 `--axis-radius-control` 이라 8px 이고 높이는 34px 입니다(1.7.0 후보 빌드 · Tailwind 4.1 측정용 페이지 실측, 2026-10-25).
- [ ] create-next-app 기본 `globals.css` 의 `:root` · `@theme inline` · `body` 블록을 지웠다([Quick Start](./quick-start.md) 「Tailwind CSS 4」).

**1. 전역 CSS (Tailwind CSS 3)** - preset 과 CSS 를 함께 씁니다. 전체 설정은 [Quick Start](./quick-start.md) 「Tailwind CSS 3」에 있습니다.

```ts
// tailwind.config.ts (요점만)
import axisPreset from "@axis-ds/tokens/tailwind"

export default {
  presets: [axisPreset],
  content: ["./src/**/*.{ts,tsx}", "./node_modules/@axis-ds/ui-react/**/*.{js,jsx}"],
}
```

```css
/* globals.css (Tailwind CSS 3): @import 를 @tailwind 앞에 둡니다 */
@import "@axis-ds/tokens/css";
@import "@axis-ds/tokens/css/shadcn";
@import "@axis-ds/tokens/css/brands/ontology";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] `presets: [axisPreset]` 를 넣었다. 빠지면 브랜드를 켜도 Button 둥글기가 6px(Tailwind 기본 `rounded-md`)이고 글꼴이 Tailwind 기본(`ui-sans-serif`)입니다. 넣으면 10px · Pretendard 스택입니다. 1.7.0 부터 Button · Toggle · Input · Select 트리거 · Card · Dialog 의 둥글기는 preset 이 아니라 밀도 토큰을 읽어 preset 과 상관없이 ontology 8 · 8 · 6 · 6 · 12 · 12px 이고, preset 이 빠지면 `rounded-md` 를 쓰는 Select 팝업 등이 6px 가 됩니다(넣으면 10px, 1.7.0 후보 빌드 · Tailwind 3.4 실측).
- [ ] `@axis-ds/tokens/css/shadcn` 을 넣었다. preset 의 `rounded-*` 는 shadcn 변수 `--radius` 를 읽으므로, 빠지면 브랜드를 켰을 때는 ontology 가 `--radius` 를 정의해 드러나지 않다가 **브랜드를 끄면 둥글기가 0px** 이 됩니다. 넣으면 켬 10px · 끔 6px 입니다. 1.7.0 부터 밀도 토큰 대상(Button 등)은 빠져도 리터럴 fallback 으로 끔 6px(Card · Dialog 8px) · 켬 8px 입니다(1.7.0 후보 빌드 실측). 0px 가 되는 것은 Select 팝업처럼 `rounded-*` 를 쓰는 나머지 컴포넌트입니다.
- [ ] create-next-app 형태 `globals.css` 의 `body { font-family: Arial, Helvetica, sans-serif; }` 를 지웠다(WI-0070). 레이어 밖 규칙이라 preset 의 Pretendard 스택(`html` 에 적용)을 이기고, Button 은 preflight 의 `font-family: inherit` 로 Arial 을 물려받습니다(Tailwind 3.4.19 빌드 CSS 의 Chromium 계산값 실측: 그 줄이 있으면 클래스 없는 `<button>` 이 Arial, 지우면 Pretendard. `font-sans` 를 붙인 요소는 영향 없음). `axis check` 는 1.6.1 부터 이 줄이 남아 있으면 `globals.css` WARN 을 냅니다.
- [ ] 설정 파일이 CommonJS(`module.exports` · `.cjs`)이면 `presets: [require("@axis-ds/tokens/tailwind").default]` 처럼 `.default` 를 붙였다(WI-0072). `@axis-ds/tokens` 1.6.2 이하에서 `.default` 없는 `require` 는 preset 이 아니라 `{ default }` 를 돌려줘 색 · keyframes · 글꼴이 통째로 빠집니다(1.1.0 부터의 결함, 회귀 아님). 1.7.0 부터는 `.default` 없이도 됩니다. `.ts` 의 `export default { presets: [require(...)] }` 와 위 `import axisPreset from` 형태는 Tailwind 가 `.default` 를 꺼내 줘서 모든 버전에서 됩니다.
- [ ] Tailwind 3 CLI(`tailwindcss -i`)나 Vite 의 postcss-import 로 CSS 를 묶으면 `@import "@axis-ds/tokens/css"` 가 `Failed to find '@axis-ds/tokens/css'` 로 실패합니다(이슈 #189 코멘트, Tailwind 3.4.19 CLI 로 다시 실측). postcss-import 는 package.json 의 `exports` 하위 경로를 읽지 않기 때문입니다. 이때는 CSS 대신 앱 진입점 JS 에서 `import "@axis-ds/tokens/css"` · `import "@axis-ds/tokens/css/shadcn"` 처럼 불러오거나(번들러가 `exports` 를 해석, 이 경로는 재지 않음), 실제 파일 경로(`@import "@axis-ds/tokens/dist/css/variables.css";` · `.../dist/css/shadcn-compat.css`)를 씁니다. 실제 파일 경로는 공개 진입점이 아니라 패키지 구조가 바뀌면 깨질 수 있습니다. Next.js 는 CSS `@import` 의 `exports` 하위 경로를 해석합니다(이 가이드의 측정값은 Next 구성).

**2. 브랜드 켜기** - `ThemeProvider` 를 쓰는지에 따라 다릅니다. 브랜드 CSS 를 import 하는 것만으로는 화면이 바뀌지 않습니다.

- [ ] `ThemeProvider` 를 쓰는 앱: 마크업 속성 `<html data-brand="ontology">`, `defaultBrand` 또는 `setBrand`(아래 「브랜드 적용」). `@axis-ds/theme` 1.7.0 부터는 마크업 속성을 초기값으로 읽어 마운트 때 지우지 않고, `setBrand(undefined)` 로 끈 상태도 새로고침 뒤 유지됩니다(WI-0068). 1.6.2 이하는 브랜드가 `undefined` 이면 마운트 때 마크업 속성을 지우므로 마크업만으로는 안 되고, `defaultBrand` 를 쓰면 끈 상태가 새로고침 뒤 풀립니다(같은 절의 「`defaultBrand` 와 해제」)
- [ ] `ThemeProvider` 없이 쓰는 앱: 마크업 속성 `<html data-brand="ontology">` 단독(아래 「Provider 없이 적용 · 첫 화면」)

**3. 글꼴**

- [ ] Pretendard 웹폰트를 앱에서 로드했다. 토큰 패키지는 글꼴 스택(`"Pretendard Variable"` 로 시작)만 지정하고 `@font-face` 는 담지 않습니다(1.6.0 `dist/css` 4개 파일에서 0건). 로드하지 않으면 스택의 다음 글꼴(Apple SD Gothic Neo · Malgun Gothic 등 시스템 글꼴)로 그려집니다.

```bash
pnpm add pretendard
```

```tsx
// 앱 진입점(예: app/layout.tsx). 문서 사이트(apps/web)와 같은 방식입니다
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css"
```

**알아 둘 함정** (자세한 내용은 각 절)

- `@axis-ds/theme` 1.6.2 이하에서 `defaultBrand` 를 쓰면 `setBrand(undefined)` 로 끈 상태가 새로고침 뒤 풀리고, 마크업 `<html data-brand>` 만 두면 마운트 때 지워집니다. 1.7.0 에서 고쳤습니다(「브랜드 적용」, [WI-0068 #182](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/182))
- Tailwind 3 CommonJS 설정의 `.default` 없는 `require("@axis-ds/tokens/tailwind")` 는 `@axis-ds/tokens` 1.6.2 이하에서 preset 이 빠집니다(위 1번, [WI-0072 #191](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/191))
- 브랜드 컨테이너 안쪽 요소에 `.dark` 를 붙이면 그 아래는 브랜드가 꺼진 기본 다크가 됩니다(「선택자와 다크 모드」)
- SPA 첫 화면에서 기본 색에서 브랜드 색으로 넘어가는 전환이 보일 수 있습니다(「Provider 없이 적용 · 첫 화면」)

#### cli 로 적용하기 (`@axis-ds/cli` 1.6.0부터)

`npx @axis-ds/cli init -y` 뒤 `npx @axis-ds/cli theme add ontology` 를 실행하면 위 1번의 전역 CSS 줄과 의존성 · 설정 기록을 cli 가 대신합니다. 2번 · 3번과 Tailwind 3 설정 파일은 cli 가 넣을 줄을 안내만 하고 고치지 않습니다. 아래 내용과 출력 인용은 cli 1.6.0 발행 전 빌드(main 7b0e157 의 `packages/axis-cli`)로 src 없는 Next 15.5.28 프로젝트 2개(Tailwind 3.4.19 · Tailwind 4.3.3, 둘 다 npm)에서 확인했습니다(2026-10-25). 1.5.x 이하의 `theme add` 는 브랜드 줄만 넣고 Provider 예시가 `defaultBrand` 이므로 이 절과 다릅니다.

**theme add 가 자동으로 하는 것**

- 전역 CSS(`axis.config.json` 의 `globalCss`)에 기본 토큰 CSS 와 브랜드 import 를 넣습니다. 위치는 파일 앞쪽 import 구간의 끝, 첫 규칙보다 앞입니다. 이미 있는 줄은 넣지 않고, 같은 명령을 다시 실행하면 「바꾼 파일이 없습니다」로 끝납니다.
  - Tailwind 3: 파일 맨 앞, `@tailwind` 3줄보다 앞에 `@import "@axis-ds/tokens/css";` · `@import "@axis-ds/tokens/css/shadcn";` · `@import "@axis-ds/tokens/css/brands/ontology";` 순서로 넣습니다. 위 체크리스트 블록과 같습니다
  - Tailwind 4: `@import "tailwindcss";` 다음에 `@import "@axis-ds/tokens/css/tailwind4";` · `package.json` 에 선언된 컴포넌트 패키지의 `tailwind.css`(`@axis-ds/ui-react` · `@axis-ds/agentic-ui`) · 브랜드 순서로 넣습니다. 선언하지 않은 패키지의 줄은 넣지 않으므로, 나중에 `@axis-ds/agentic-ui` 를 더했으면 `theme add` 를 다시 실행합니다. 이때 새 줄은 import 구간의 끝, 곧 브랜드 줄 뒤에 들어갑니다. `tailwind.css` 는 `@source` 한 줄이라 위치가 브랜드 값에 영향을 주지 않지만, 위 순서대로 두려면 브랜드 줄을 맨 끝으로 옮깁니다. 1.6.1 부터 출력은 이 줄을 「컴포넌트 스캔 경로, 위치 무관」으로 적고, 「브랜드 앞」은 실제로 브랜드 줄보다 앞에 넣은 기본 토큰 CSS 에만 붙입니다(1.6.0 은 모든 줄을 「기본 토큰 CSS, 브랜드 앞」으로 적었습니다, WI-0070). 기본 토큰 CSS 가 브랜드 줄 뒤에 들어가면(브랜드 줄만 손으로 넣어 둔 경우 등) 브랜드 값이 덮이므로 옮기라는 경고를 냅니다
  - 첫 규칙 뒤에 있는 기존 `@import` 는 옮기지 않고 맨 앞으로 옮기라고 알립니다
- `package.json` 의 `dependencies` 에 `"@axis-ds/tokens": "^1.6.0"` 을 더합니다(이미 선언돼 있으면 범위를 바꾸지 않음). 설치는 실행하지 않고 lockfile 에 맞는 명령(npm 프로젝트면 `npm install`)을 안내합니다. `@axis-ds/tokens` 가 설치돼 있지 않으면 브랜드 이름 규칙만 확인했다고 알립니다
- `axis.config.json` 에 `"brand": "ontology"` 를 기록합니다. 나머지 키와 순서는 그대로입니다

Tailwind 3 프로젝트에서 바뀐 전역 CSS 는 이렇습니다(create-next-app Tailwind 3 형태의 `app/globals.css`, 아래쪽 `:root` · `body` 블록은 그대로).

```diff
+@import "@axis-ds/tokens/css";
+@import "@axis-ds/tokens/css/shadcn";
+@import "@axis-ds/tokens/css/brands/ontology";
 @tailwind base;
 @tailwind components;
 @tailwind utilities;
```

**사람이 해야 하는 것** (cli 는 안내만 함)

- [ ] 브랜드 켜기(위 2번). cli 는 루트 레이아웃(`app/layout.tsx` 등)에서 브랜드를 켜는 코드(`data-brand` · `setBrand(` · `defaultBrand=` 중 하나)를 찾지 못하면 아래 예시를 그대로 출력합니다. 예시의 `lang="ko"` 는 예시 값이니 앱의 `lang` 을 유지합니다. `ThemeProvider` 만 있는 레이아웃([빠른 시작](./quick-start.md) 「3. ThemeProvider 설정」 예시 그대로)은 켜는 코드가 없는 것으로 보고 예시를 냅니다. 이 구성은 마운트 때 브랜드가 지워지기 때문입니다. 켜는 코드를 찾으면 예시 없이 「`app/layout.tsx 에 브랜드를 켜는 코드(data-brand · setBrand 등)가 있습니다. "ontology" 로 켜는지 확인하세요.`」 한 줄만 냅니다.

  ```text
  브랜드 켜기 (ThemeProvider 는 @axis-ds/theme 1.3.0 이상)
    // 1) 루트 레이아웃(app/layout.tsx)의 <html> 에 붙입니다(첫 화면부터 적용)
    //    ThemeProvider 를 함께 쓰면 @axis-ds/theme 1.7.0 이상이 필요합니다(그 아래는 마운트 때 속성을 지움)
    <html lang="ko" data-brand="ontology">

    // 2) 사용자가 고르게 하려면 setBrand 로 켜고 끕니다(저장돼 유지, setBrand(undefined) 로 끈 상태 유지는 1.7.0 이상)
    import { useTheme } from "@axis-ds/theme";
    const { setBrand } = useTheme();
    setBrand("ontology");
    ! app/layout.tsx 에서 브랜드를 켜는 코드(data-brand · setBrand 등)를 찾지 못했습니다. 둘 다 없으면 import 만으로는 화면이 바뀌지 않습니다.
    ThemeProvider 를 쓰면 @axis-ds/theme 설치: npm install "@axis-ds/theme@^1.3.0"
  ```

  위 예시는 cli 1.6.1 출력입니다(1.6.0 은 1) 을 「Provider 없이」, 2) 를 「마운트 때 브랜드가 없으면 속성을 지우므로」로 적었습니다). cli 예시에 `defaultBrand` 가 없는 것은 `@axis-ds/theme` 1.6.2 이하에서 끈 상태가 새로고침 뒤 풀리는 한계(아래 「`defaultBrand` 와 해제」, WI-0068) 때문입니다. 1.7.0 이상이거나 사용자가 끌 수 없게 늘 켜 두는 앱이면 `defaultBrand="ontology"` 를 써도 됩니다(「브랜드 적용」). 마크업 `data-brand` 와 `ThemeProvider` 를 함께 쓰는 레이아웃을 찾으면 「`@axis-ds/theme 1.7.0 이상이어야 마운트 때 지워지지 않습니다`」 경고를 한 줄 더 냅니다(설치본 판정은 `axis check`).
- [ ] Tailwind 3: preset 을 넣습니다. cli 1.6.1 은 `tailwind.config.*` 에 preset 이 없으면 `presets: [require("@axis-ds/tokens/tailwind").default] (ESM · TypeScript 이면 import axisPreset from "@axis-ds/tokens/tailwind" 뒤 presets: [axisPreset])` 를 안내합니다. CommonJS 형태는 모든 tokens 버전에서 되는 `.default` 입니다(1.6.0 이 안내하던 `.default` 없는 형태는 tokens 1.6.2 이하에서 preset 이 빠짐, WI-0072). `content` 가 `componentsDir` 나 선언된 컴포넌트 패키지 경로를 덮지 않으면 넣을 경로도 함께 안내합니다
- [ ] Tailwind 4: create-next-app 기본 `globals.css` 의 `:root` · `@theme inline` · `@media (prefers-color-scheme: dark)` · `body` 블록을 지웁니다. `theme add` 는 이 블록을 그대로 두고, `axis init` 의 안내와 `axis check` 의 WARN 이 남은 정의 이름을 알려 줍니다
- [ ] 안내된 설치 명령(`npm install`, `ThemeProvider` 를 쓰면 `@axis-ds/theme`)을 실행합니다
- [ ] Pretendard 웹폰트를 로드합니다(위 3번). cli 는 글꼴을 다루지 않습니다

**axis check 가 새로 알려 주는 것** (1.6.0부터)

`npx @axis-ds/cli check` 는 아래 항목으로 위 체크리스트의 빠진 단계를 짚습니다. 항목 이름은 MCP `axis.check_project` 결과에 쓰이는 이름이고, cli 화면에는 판정과 문구만 나옵니다. brand · 컴포넌트 패키지 선언 등 해당할 때만 나오는 항목이 있습니다.

| 항목 이름 | 판정 | 언제 | 체크리스트 |
|---|---|---|---|
| `tailwind.config` | WARN | Tailwind 3 에서 `@axis-ds/tokens/tailwind` preset 이 없음. 1.5.x 이하는 자체 CSS 변수 매핑만 있어도 PASS 였습니다. 1.6.1 부터는 CommonJS 설정(`module.exports` · `.cjs`)의 `.default` 없는 `require` 도 설치본 `@axis-ds/tokens` 가 1.7.0 미만이면(설치본이 없으면 선언 하한) WARN 입니다 | 1번 preset |
| `globals.css` | WARN | 1.6.1 부터 AXIS 근거(tokens CSS import · `--axis-*` 정의 · 루트 레이아웃의 `import "@axis-ds/tokens/css"`)가 없으면 WARN. 자체 `--background` · `--primary` 만 있으면 「AXIS 토큰이 없습니다」(1.6.0 은 PASS). Tailwind 3 에서 create-next-app 기본 `body` `font-family: Arial` 이 남아도 WARN | 1번 · 1번 글꼴 |
| `dependencies` | WARN · FAIL(필수 누락, 종료 코드 1) | `tailwindcss` 선언이 없으면 FAIL, `clsx` · `tailwind-merge` 선언이 없으면 WARN. 1.6.1 부터 `package.json` 에 선언된 `tailwindcss` · `clsx` · `tailwind-merge` · `@axis-ds/*` 가 설치되지 않았으면 WARN(상위 디렉터리 `node_modules` 까지 찾음, Plug'n'Play 는 선언 기준). 1.6.0 은 선언만 보고 「모두 설치되어 있습니다」였습니다. cli 1.7.1 · mcp 1.4.1 부터 앱 `package.json` 에 선언이 없으면 워크스페이스 루트(`pnpm-workspace.yaml` 이나 `workspaces` 가 있는 가장 가까운 상위, 그 전에 `.git` 이 나오면 찾지 않음) `package.json` 의 선언도 인정하고 문구에 「워크스페이스 루트에 선언: …」을 붙여요(1.7.0 이하는 루트에만 선언한 앱이 FAIL). 미설치 안내 명령도 앱에 lockfile 이 없으면 그 워크스페이스 루트의 lockfile 을 따라요. cli 1.7.2 · mcp 1.4.2 부터는 두 층에 lockfile 이 없을 때 `package.json` 의 `packageManager`(앱 다음 같은 워크스페이스 루트)도 봐요 | - |
| `brand.activation` | WARN | brand 가 있는데 루트 레이아웃에 브랜드를 켜는 코드(`data-brand` · `setBrand(` · `defaultBrand=`)가 없음. `ThemeProvider` 만 있어도 WARN(문구에 「ThemeProvider 만으로는 마운트 때 꺼짐」). 문구 끝에 `<html data-brand="ontology">` 또는 `setBrand("ontology")` 를 안내. 1.6.1 부터 마크업 `data-brand` 와 `ThemeProvider` 만 있고 `setBrand(` · `defaultBrand=` 가 없으면 설치본 `@axis-ds/theme` 가 1.7.0 미만일 때 WARN | 2번 |
| `tailwind.content` | FAIL(종료 코드 1) | Tailwind 3 `content` 가 `componentsDir` 나 선언된 컴포넌트 패키지 경로를 덮지 않음. 패키지 경로는 설치본 위치 기준이에요: 앱 `node_modules` 에 있으면 `./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}`, npm workspaces · pnpm hoisted 처럼 루트에만 있으면 `../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}`(cli 1.7.1 · mcp 1.4.1 부터, 1.7.0 이하는 늘 `./node_modules` 로 판정). `./**/*.{js,mjs}` 는 `../` 를 넘지 않아 루트 설치본을 덮지 않고, 실제 위치를 가리키는 절대경로는 덮은 것으로 봐요. 상위 경로는 Tailwind 3 가 빌드를 실행한 디렉터리 기준으로 풀리므로(앱 디렉터리에서 빌드하면 맞음), 모노레포 루트에서 빌드하면 `content: { relative: true, files: [...] }` 로 설정 파일 기준으로 바꿔요(판정은 앱 디렉터리 기준). cli 1.7.2 · mcp 1.4.2 부터 컴포넌트 패키지는 앱 `package.json` 에 없으면 워크스페이스 루트 `package.json` 의 선언도 대상으로 봐요(`dependencies` 와 같은 경계, 1.7.1 이하는 루트에만 선언한 앱에서 이 항목이 아예 나오지 않음). `--dir` · `targetDir` 를 심볼릭 링크로 줘도 실경로와 같은 판정이에요 | 1번 content |
| `animation` | WARN | `@axis-ds/ui-react` 를 선언했는데 애니메이션 플러그인(Tailwind 3 `tailwindcss-animate`, Tailwind 4 `tw-animate-css`)이 없음. 1.6.1 부터 Tailwind 3 은 `plugins` 배열 안의 `require("tailwindcss-animate")` 나 그 패키지를 받은 식별자로 판정하고(import 만 있거나 다른 곳의 같은 문자열은 PASS 아님), 「미설치」는 설치본 기준입니다. `plugins` 를 정적으로 다 읽지 못하면(펼침 · 변수) 「확인하지 못함」 WARN. cli 1.7.2 · mcp 1.4.2 부터 `@axis-ds/ui-react` · 플러그인 선언은 워크스페이스 루트 선언도 인정해요 | - |

`brand.activation` 은 루트 레이아웃(과 그 레이아웃이 import 하는 같은 디렉터리의 `./providers` · `./provider`)에서 주석을 뺀 소스에 `data-brand` · `setBrand(` · `defaultBrand=` 글자가 있는지만 봅니다. 그래서 `ThemeProvider` 만 둔 레이아웃은 WARN 이지만, PASS 가 브랜드가 켜졌다는 뜻은 아닙니다. 1.6.0 은 마크업 `<html data-brand="ontology">` 와 `ThemeProvider` 를 함께 두고 `defaultBrand` 를 빼도 PASS 였는데, `@axis-ds/theme` 1.6.2 이하에서는 마운트 때 속성이 지워집니다(위 2번). 1.6.1 은 이 구성에서 설치본(없으면 선언) `@axis-ds/theme` 버전을 보고 1.7.0 미만이거나 판정할 수 없으면 WARN 입니다. `defaultBrand=` 의 값이 다른 브랜드여도 PASS 이니, PASS 가 나오면 `"ontology"` 로 켜는지 확인합니다.

위 Tailwind 3 프로젝트에서 `init -y` · `theme add ontology` 직후의 check 는 cli 1.6.0 에서 6 pass / 2 warn / 0 fail(WARN 은 preset 없음 · `brand.activation`)입니다. 1.6.1 은 create-next-app 기본 `body` 의 `font-family: Arial` 이 남아 있으면 `globals.css` 도 WARN 이라 하나 더 늘어납니다(판정 규칙에서 읽은 값, 같은 프로젝트로 다시 재지는 않음). 레이아웃을 `ThemeProvider` 만 둔 형태로 바꿔도 같고, `defaultBrand="ontology"` 를 더하면 7 pass / 1 warn 입니다. `content` 에서 `./components/**` 를 빼고 `@axis-ds/ui-react` 를 선언한 변형은 `tailwind.content` FAIL · `animation` WARN 으로 종료 코드 1 입니다.

### 템플릿에서 ontology 켜기

`axis template init` 으로 받는 템플릿 4종(`theme-only` · `dashboard` · `landing-page` · `hr-dashboard`)은 2026-10-25(WI-0067)부터 `@axis-ds/tokens` 의 CSS 변수(`@axis-ds/tokens/css` · `@axis-ds/tokens/css/shadcn`)와 Tailwind 3 preset 을 쓰고, `pretendard` 패키지로 Pretendard 를 로드합니다. ontology 브랜드 import 는 `app/globals.css` 에 주석 한 줄로 들어 있습니다. 템플릿에는 `ThemeProvider` 가 없으므로 기본은 마크업 속성으로 켭니다.

1. 템플릿을 받고 설치합니다.

   ```bash
   npx @axis-ds/cli template init theme-only --dir my-app   # 다른 템플릿은 slug 만 바꿉니다
   cd my-app
   pnpm install                                             # npm install 도 됩니다
   ```

   CI · 스크립트처럼 입력이 없는 곳에서 돌릴 때(cli 1.7.0 부터): `--dir` 을 빼면 템플릿 이름 디렉터리로 진행하고 그 값을 한 줄 알립니다. 비어 있지 않은 디렉터리는 rc 1 로 멈추니, 덮어써도 되면 `-y` 를 붙입니다(템플릿과 같은 경로의 파일은 덮어씀).

2. 브랜드 CSS 를 켭니다. `app/globals.css` 의 아래 줄에서 주석을 풉니다.

   ```css
   /* @import "@axis-ds/tokens/css/brands/ontology"; */   ← 이 줄을
   @import "@axis-ds/tokens/css/brands/ontology";         ← 이렇게
   ```

   대신 `npx @axis-ds/cli theme add ontology` 를 실행해도 됩니다. cli 1.6.1 은 tokens CSS 2줄 다음에 같은 import 줄을 새로 넣고(주석 줄은 그대로 남음), `axis.config.json` 에 `"brand": "ontology"` 를 기록합니다. `package.json` 의 `@axis-ds/tokens ^1.7.0` 은 그대로 둡니다.

3. 브랜드를 켭니다. 둘 중 하나입니다.
   - `app/layout.tsx` 의 `<html>` 에 속성을 넣습니다: `<html lang="ko" data-brand="ontology" suppressHydrationWarning>`. hr-dashboard 처럼 `className="dark"` 가 같은 요소에 있어도 됩니다(위 「선택자와 다크 모드」의 같은 요소 구성).
   - `ThemeProvider` 를 쓰는 앱으로 바꿨다면 `pnpm add @axis-ds/theme`(1.7.0 이상) 뒤 `<ThemeProvider defaultBrand="ontology">` 로 감쌉니다(아래 「브랜드 적용」). 이 구성은 템플릿에서 따로 재지 않았습니다.

4. 끄기: 마크업으로 켰다면 `data-brand` 속성을 지웁니다(런타임에는 `document.documentElement.removeAttribute("data-brand")`). `ThemeProvider` 를 쓰면 `useTheme()` 의 `setBrand(undefined)` 이고, `@axis-ds/theme` 1.7.0 부터 끈 상태가 새로고침 뒤에도 유지됩니다(WI-0068). 브랜드 import 줄은 남겨 둬도 속성이 없으면 화면은 기본값입니다.

5. `axis check` 로 확인합니다. `brand` · `brand.activation` 항목은 `axis.config.json` 에 `brand` 가 있을 때만 나옵니다(`theme add` 가 기록, 주석만 풀었다면 `"brand": "ontology"` 를 직접 추가).

   ```bash
   npx @axis-ds/cli check
   ```

   발행본 cli 1.6.1 로 잰 결과(2026-10-25, 이 저장소의 템플릿 JSON 을 `AXIS_TEMPLATE_URL` 로 가리켜 init · pnpm install, tokens 1.7.0 · tailwindcss 3.4.19 · next 15.5.28 설치):

   | 단계 | theme-only · dashboard · landing-page | hr-dashboard |
   |---|---|---|
   | init · 설치 직후 | 5 pass / 1 warn / 0 fail(WARN 은 `utils.ts` 없음, 컴포넌트를 쓰지 않으면 무시) | 6 pass / 0 warn / 0 fail |
   | `theme add ontology` 직후(`data-brand` 없음) | 6 pass / 2 warn / 0 fail(`brand` PASS, `brand.activation` WARN) | - |
   | 주석 해제 · `data-brand` · config `brand` | 7 pass / 1 warn / 0 fail(`brand` · `brand.activation` PASS) | 8 pass / 0 warn / 0 fail |

   `tailwind.config`(`@axis-ds/tokens/tailwind preset`) · `globals.css`(`@axis-ds/tokens/css import`) 는 4종 모두 PASS 입니다. 전환 전 템플릿은 두 항목이 WARN 이었습니다. 레이아웃 주석 안의 `data-brand="ontology"` 글자는 `brand.activation` 이 세지 않습니다(`theme add` 직후 WARN 으로 확인).

**켜진 값(측정)**: theme-only · hr-dashboard 를 `next build` 뒤 `next start` 로 띄워 Chromium 149 에서 잰 계산값입니다. 기대값은 그 프로젝트에 설치된 `@axis-ds/tokens`(1.7.0) 의 `shadcn-compat.css` · `brands/ontology.css` 값이고, 12개 상태 모두 `--primary` · 배경 · 글자 · 테두리가 기대값과 같았습니다. tokens 를 올리면 값이 바뀔 수 있습니다.

| 상태 | `--primary` | 배경 | 글자 | 테두리 |
|---|---|---|---|---|
| 기본 · 라이트 | `221 39% 11%` | rgb(255, 255, 255) | rgb(17, 24, 39) | rgb(229, 231, 235) |
| 기본 · 다크 | `220 14% 96%` | rgb(3, 7, 17) | rgb(243, 244, 246) | rgb(31, 41, 55) |
| ontology · 라이트 | `220 69.4% 52.5%` | rgb(247, 247, 247) | rgb(17, 20, 24) | rgb(230, 232, 235) |
| ontology · 다크 | `219.7 81.6% 68%` | rgb(14, 16, 19) | rgb(241, 243, 245) | rgb(43, 47, 53) |

- `data-brand` 를 지우면 같은 페이지에서 기본 · 라이트와 기본 · 다크 값으로 돌아왔습니다(두 템플릿 모두).
- 글꼴: `body` 의 계산 `font-family` 는 기본에서 `--axis-font-family-sans`(`"Pretendard Variable", Pretendard, -apple-system, ...`), ontology 에서 브랜드 스택(`"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", ...`)이었고 `Pretendard Variable` 이 실제로 로드됐습니다(FontFace status loaded 로 확인).
- 템플릿 `globals.css` 는 tokens CSS 뒤에 `@layer base { * { @apply border-border; } }` 를 둡니다. 빼면 Tailwind 3 preflight 의 `border-color`(gray-200)가 shadcn 호환 CSS 의 `*` 규칙보다 뒤에 와서 이겨, `border` 클래스 테두리가 다크 · 브랜드에서도 rgb(229, 231, 235) 로 남습니다(이 줄을 넣기 전 같은 측정에서 템플릿마다 6개 상태 중 기본 · 라이트 2개를 뺀 4개가 테두리 불일치). 템플릿 밖의 Tailwind 3 프로젝트도 `@axis-ds/tokens` 1.8.0 이하에서는 같은 결함이 있습니다(quick-start 「Tailwind CSS 3」 예시 그대로 만든 Next 15 소비자에서 4개 상태 x 탐침 3개(`border` · `border-t` · `hr`) 12칸 중 기본 · 라이트를 뺀 9칸 불일치, 브라우저 계산값 실측). 1.8.1 부터는 preset 이 preflight 의 기본 테두리색을 `hsl(var(--border, 220 13% 91%))` 로 정해 이 줄 없이도 같고(같은 소비자 0/12), 템플릿의 이 줄은 1.8.0 이하 호환을 위해 그대로 둡니다(WI-0077).

이미 받은 템플릿은 자동으로 바뀌지 않습니다(파일 복사 방식). `npx @axis-ds/cli template diff <slug>` 로 차이를 볼 수 있습니다.

### 개념

브랜드는 테마(라이트 · 다크)와 독립된 축이며, 선택자는 `data-brand` 속성입니다. 같은 브랜드 안에서 라이트 · 다크를 그대로 전환할 수 있습니다. 브랜드를 지정하지 않으면 기본 토큰(`variables.css`, 1.6.0 기준 `:root` · `.dark` 각 263개)이 그대로 쓰입니다. 기본 토큰 값도 버전에 따라 바뀝니다. 1.6.0(WI-0029)에서는 기본 화면의 대비를 맞추려고 변수 11개 값(Button 기본 · destructive 바탕 6개, MessageBubble 사용자 바탕, 다크 보조 · 흐린 글자와 비활성 버튼 글자, PlanCard 거절 hover 글자)이 바뀌고 PlanCard 변수 3개(`--axis-plan-card-approve-bg` · `--axis-plan-card-approve-hover-bg` · `--axis-plan-card-reject-text`)가 새로 생겼습니다(`@axis-ds/tokens` CHANGELOG 1.6.0). 브랜드를 도입한 1.3.0 에서도 agentic-ui의 옅은 바탕 · 테두리 복원(PlanCard 상태 배지 · 거절 버튼 hover, DiffViewer, FeedbackButtons, AttachmentCard error 테두리)으로 기본 화면 일부가 바뀌었고, Card · Dialog에 그림자 색 수식어만 붙인 경우의 동작도 달라졌습니다. 자세한 내용은 1.3.0 릴리스 노트(`docs/workitems/WI-0025-brand-theme/release-notes.md`)의 「agentic-ui: 흰 글자 · 색 선 토큰과 옅은 바탕 복원」 · 「동작이 달라지는 사용 방식」 항목에 있습니다.

- 제공 브랜드: `ontology` 하나
- 브랜드 목록: `@axis-ds/tokens/brands` (`dist/brands/index.json`, 형식 `{ "brands": [{ "name", "css", "meta" }] }`)
- 브랜드 메타데이터: `@axis-ds/tokens/brands/ontology/brand.json` (`name` · `description` · `themes` · `a11y`)
- 브랜드 CSS: `@axis-ds/tokens/css/brands/ontology`

### import 순서

브랜드 CSS는 토큰 CSS와 앱의 shadcn 변수 정의보다 **뒤에** import하는 것을 권장합니다. 다만 순서가 달라도 브랜드 값이 이깁니다.

```tsx
import "@axis-ds/tokens/css"
import "@axis-ds/tokens/css/shadcn"            // shadcn 호환 변수를 쓰는 경우
import "./globals.css"                          // 앱이 --primary 등 shadcn 변수를 직접 정의하는 경우
import "@axis-ds/tokens/css/brands/ontology"    // 권장 위치: 마지막
```

브랜드 선택자는 라이트 · 다크 모두 명시도가 (0,2,0)이고(아래 「선택자와 다크 모드」), 기본 `:root` · `.dark`와 앱이 직접 정의한 shadcn 변수(예: `globals.css`의 `:root` · `.dark`)는 (0,1,0)입니다. 그래서 브랜드 CSS를 토큰 CSS와 `globals.css` 사이에 두거나 `globals.css` 맨 앞에 `@import`해도 `--primary` 등은 브랜드 값을 유지합니다.

```css
/* globals.css */
@import "@axis-ds/tokens/css/brands/ontology";  /* 맨 앞에 두어도 아래 :root 에 지지 않음 */

:root {
  --primary: 240 5.9% 10%;
}
```

반대로 앱 CSS에서 브랜드 값을 다시 덮으려면 (0,2,0)보다 높은 선택자를 쓰거나, 같은 (0,2,0) 선택자를 브랜드 CSS 뒤에 둡니다. `:root`(0,1,0)로는 브랜드 값을 덮을 수 없습니다. 문서 사이트의 `apps/web/src/app/layout.tsx`는 권장 순서(브랜드 마지막)를 따릅니다.

Tailwind CSS 4 에서는 토큰 CSS 대신 토큰 진입점을 쓰고, 브랜드 CSS 를 그 뒤에 둡니다(1.4.0 부터).

```css
/* app/globals.css (Tailwind CSS 4) */
@import "tailwindcss";
@import "@axis-ds/tokens/css/tailwind4";             /* 토큰 변수 + preset 매핑 */
@import "@axis-ds/ui-react/tailwind.css";            /* 컴포넌트 클래스 스캔 경로 */
@import "@axis-ds/agentic-ui/tailwind.css";          /* @axis-ds/agentic-ui 를 쓸 때만 */
@import "@axis-ds/tokens/css/brands/ontology";       /* 브랜드: 진입점 뒤 */
```

컴포넌트 패키지의 `tailwind.css` 는 브랜드와 상관없이 필요합니다. Tailwind 4 는 `node_modules` 를 스캔하지 않아서, 이 줄이 없으면 컴포넌트가 쓰는 `bg-[var(--axis-button-bg-default)]` 같은 클래스가 생성되지 않습니다. 그러면 브랜드 변수는 바뀌어도 Button · PlanCard 바탕이 투명합니다(위 「브랜드 적용 빠른 시작」).

진입점이 `rounded-sm|md|lg` 를 `--radius` 로, `font-mono` · `font-sans` 를 `--axis-font-family-*` 로 매핑하므로 ontology 를 적용한 요소에서는 `rounded-lg` 12px · `rounded-md` 10px 이고 `font-mono` 가 JetBrains Mono 로 시작합니다. 이 매핑은 유틸리티 클래스 자체의 값입니다. 1.7.0 부터 Button · Input 등 밀도 토큰 대상 컴포넌트는 `rounded-md` 대신 `--axis-radius-control|field|surface` 를 직접 읽어 ontology 에서 8 · 6 · 12px 입니다(위 「밀도 토큰」). 진입점은 토큰 변수를 base 레이어로 불러오고 브랜드 CSS 는 레이어가 없어서, 브랜드 값이 토큰 기본값을 이깁니다.

Tailwind CSS 3 에서 같은 CSS 파일에 import 할 때는 `@import` 를 `@tailwind` 지시문보다 앞에 둡니다(CSS 규칙상 `@import` 는 다른 규칙보다 앞에 와야 합니다). 위 「브랜드 적용 빠른 시작」의 값은 이 순서(`tokens/css` · `css/shadcn` · 브랜드 다음 `@tailwind` 3줄)로 잰 것입니다. 이 순서에서는 `@tailwind base` 의 preflight(`*, ::before, ::after { border: 0 solid theme('borderColor.DEFAULT') }`)가 `css/shadcn` 의 `* { border-color: hsl(var(--border)) }` 보다 뒤에 와서 이깁니다. `@axis-ds/tokens` 1.8.1 부터는 preset 이 그 기본값을 `hsl(var(--border, 220 13% 91%))` 로 정해, 색을 지정하지 않은 `border` · `border-t` · `hr` 가 다크 · 브랜드에서도 AXIS `--border` 색입니다(Next 15.5 · Tailwind 3.4.19 소비자, Chromium 계산값 4개 상태 실측). 1.8.0 이하는 gray-200(#e5e7eb)이 이겨 다크 · 브랜드에서도 회색이므로 `@tailwind utilities;` 뒤에 `@layer base { * { @apply border-border; } }` 블록을 두거나 `border-border` 처럼 색을 지정합니다(WI-0077).

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

초기 브랜드는 `@axis-ds/theme` 1.7.0 부터 **저장값 > 서버 마크업 `<html data-brand>` > `defaultBrand`** 순서입니다(WI-0068). 저장값(`brandStorageKey`, 기본 `"axis-brand"`)이 있으면 그것을 쓰고, 없으면 마운트 전 `<html>` 에 있던 `data-brand` 를, 그것도 없으면 `defaultBrand` 를 씁니다. `setBrand(undefined)` 는 `data-brand` 속성을 지우고 저장값에 빈 문자열(「끔」)을 남겨, 새로고침 뒤에도 꺼진 채 유지됩니다.

- 마크업과 `defaultBrand` 가 다르면 마크업이 이깁니다(1.6.2 까지는 `defaultBrand`). 서버가 그린 값을 진실로 보는 규칙입니다(2026-10-25 사용자 결정).
- 서버 렌더와 하이드레이션 첫 렌더는 `defaultBrand` 로 그리고 하이드레이션이 끝난 뒤 위 순서의 값으로 맞춥니다. 그래서 `useTheme().brand` 를 화면에 그려도 하이드레이션 불일치가 나지 않고, 첫 커밋은 서버 마크업 속성을 건드리지 않습니다(jsdom `hydrateRoot` 측정, `packages/axis-theme/src/theme.hydrate.test.tsx`).
- `ThemeProvider` 를 언마운트하면 마운트 전 마크업 값으로 되돌립니다. 다른 `defaultBrand` 로 다시 마운트한 Provider 가 앞 인스턴스가 붙인 속성을 마크업으로 읽지 않게 하려는 것입니다.
- 1.6.2 이하로 내리면 빈 문자열 저장값을 「저장값 없음」으로 읽어 그 버전의 동작(`defaultBrand`)으로 돌아갑니다.
- 남는 한계: 서버 마크업에 `data-brand` 가 있는데 사용자가 끈 상태로 새로고침하면, 하이드레이션이 끝날 때까지 첫 화면에 브랜드가 보입니다(추정, 브라우저로 재지 않음). 없애려면 아래 「Provider 없이 적용 · 첫 화면」의 `<head>` 인라인 스크립트로 저장값을 먼저 반영합니다.

**`defaultBrand` 와 해제 (1.6.2 이하)**: `defaultBrand` 를 지정하면 `setBrand(undefined)` 로 끈 상태가 새로고침 뒤에 유지되지 않습니다. `setBrand(undefined)` 가 저장값을 지우므로 다음 마운트에서는 저장값이 없고, 그러면 `defaultBrand` 가 다시 적용되기 때문입니다(`packages/axis-theme/src/index.ts` 의 `readBrand(brandStorageKey) ?? (defaultBrand || undefined)`). 실측(1.6.0, Vite 앱): `defaultBrand="ontology"` 에서 끈 뒤 새로고침하면 다시 ontology 이고, `defaultBrand` 없이 `setBrand` 로 켜고 끄면 새로고침을 거듭해도 마지막 선택이 유지됩니다. 끈 상태를 저장할 값이 없어서, 지금은 「기본은 ontology 이면서 사용자가 끌 수 있음」을 만들 수 없습니다. 1.7.0 에서 해제 상태를 빈 문자열로 저장해 고쳤습니다([WI-0068 (#182)](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/182)).

| 용도 | 설정 | 새로고침 뒤(1.7.0 부터) | 1.6.2 이하 |
|---|---|---|---|
| 브랜드 고정(끄지 않음) | `defaultBrand="ontology"` 또는 `<html data-brand="ontology">`(첫 화면까지 맞추려면 마크업) | 늘 ontology | 마크업만 두면 마운트 때 지워짐, `defaultBrand` 필요 |
| 기본은 켜고 사용자가 끌 수 있음 | `defaultBrand="ontology"`(또는 마크업) + `setBrand(undefined)` | 마지막 선택 유지(끈 상태는 빈 문자열 저장값) | 끈 상태가 새로고침 뒤 풀림(만들 수 없음) |
| 기본은 끄고 사용자가 켬 | `defaultBrand` 없이 `setBrand("ontology")` · `setBrand(undefined)` | 마지막 선택 유지. 첫 방문은 브랜드 없음 | 같음 |

1.6.2 이하에서는 위 `BrandToggle` 예시의 「기본」 버튼을 `defaultBrand` 와 함께 쓰면 누른 그 화면에서만 꺼지고, 새로고침하면 다시 켜집니다.

### 선택자와 다크 모드

| 테마 | 선택자 |
|------|--------|
| 라이트 | `[data-brand="<brand>"][data-brand="<brand>"]` |
| 다크 | `[data-brand="<brand>"].dark` · `[data-brand="<brand>"][data-theme="dark"]` · `.dark [data-brand="<brand>"]` |

라이트 선택자는 같은 속성 선택자를 두 번 써서 명시도를 (0,2,0)으로 맞춥니다(뜻은 `[data-brand="<brand>"]`와 같습니다). `:root[data-brand]`로 올리지 않은 것은 아래 하위 컨테이너 구성(`<div data-brand>`)에도 맞게 하려는 것입니다. 다크 선택자 3종도 (0,2,0)이라 라이트와 같고, 같은 파일에서 다크 블록이 라이트 블록 뒤에 있어 다크가 이깁니다.

다크 클래스는 `ThemeProvider`나 next-themes가 붙이는 `.dark`를 그대로 사용합니다. 지원하는 구성은 다음과 같습니다.

- 같은 요소: `<html class="dark" data-brand="ontology">`
- `.dark` 조상 아래의 브랜드 컨테이너: `<html class="dark">` 안의 `<div data-brand="ontology">`
- 하위 컨테이너(라이트): `<div data-brand="ontology">`

Tailwind 의 `dark:` 변형도 같은 `.dark` 클래스를 봅니다. Tailwind 3 preset(`darkMode: ["class"]`)은 `.dark` 의 자손에만 적용되고 명시도가 클래스 하나만큼 올라갑니다. Tailwind 4 진입점(`@axis-ds/tokens/css/tailwind4`)은 Tailwind 4 공식 형태 `@custom-variant dark (&:where(.dark, .dark *))` 라서 `.dark` 를 붙인 요소 자신에도 적용되고(`<div class="dark dark:bg-primary">`) 명시도를 올리지 않습니다.

`[data-brand]` 조상 아래에 `.dark` 하위 요소를 두는 구성(`<div data-brand="ontology"><div class="dark">`)은 **지원하지 않습니다.** 그 요소 아래에서는 브랜드가 통째로 꺼지고 기본 다크 값이 됩니다. 실측(1.6.0, Tailwind 3 · `@axis-ds/tokens/css` 구성의 Vite 앱): 그 안의 Button 바탕이 브랜드 다크(#6B98F0)가 아니라 `.dark` 만 둔 대조 요소와 같은 기본 다크 값(#2563EB)이었습니다. 하위 요소에 직접 걸리는 기본 `.dark` 규칙이 조상에서 상속된 브랜드 값을 덮기 때문입니다. Tailwind 4 진입점 구성은 재지 않았지만 같은 구조라 같을 것으로 봅니다(추정).

우회는 둘 중 하나입니다.

- `.dark` 를 브랜드 컨테이너 바깥(조상)에 둡니다: `<div class="dark"><div data-brand="ontology">`(실측 #6B98F0, 위 지원 구성 「`.dark` 조상 아래의 브랜드 컨테이너」)
- `.dark` 를 붙인 요소에 `data-brand` 를 함께 붙입니다: `<div class="dark" data-brand="ontology">`(지원 구성 「같은 요소」)

같은 요소에 `data-brand`와 `.dark`를 함께 붙이면, ontology 라이트 블록에만 있고 다크 블록에 없는 변수 26개(1.7.0, 1.6.x 는 11개) 가운데 기본 `.dark`와 값이 달라지는 19개(`--axis-radius-sm|md|lg`, 글꼴 2개, PlanCard 색 선, Card 그림자 2개, shadcn `--radius` 12px, 밀도 토큰 10개: `--axis-radius-control|field`, `--axis-control-h-sm|md|lg`, `--axis-control-font-size-sm|lg`, `--axis-field-h`, `--axis-table-font-size`, `--axis-table-head-font-size`)는 다크에서도 브랜드 라이트 값이 유지됩니다. 브랜드 라이트 (0,2,0)가 기본 `.dark` (0,1,0)를 이기므로 import 순서와 상관없습니다. 나머지 7개는 화면 차이가 없습니다: `--axis-button-border-default` · `--axis-button-ghost-bg-default` 는 양쪽 모두 `transparent`이고, 밀도 토큰 5개(`--axis-radius-surface` 는 기본 `.dark` 에서도 `var(--radius)` 12px, `--axis-control-font-size-md` 14px, `--axis-toggle-h-*` 는 기본값과 같음)는 계산값이 같습니다(값 대조, 브라우저 미측정).

### Provider 없이 적용 · 첫 화면

`ThemeProvider` 없이 속성을 직접 붙여도 됩니다.

```ts
document.documentElement.setAttribute("data-brand", "ontology")  // 적용
document.documentElement.removeAttribute("data-brand")           // 해제
```

서버 마크업에 `<html data-brand="ontology">`를 넣을 수도 있습니다. 문서 사이트는 next-themes(`attribute="class"`)를 쓰므로 브랜드 전환 데모(`/docs/brand-demo/`)가 이 방식으로 속성을 다룹니다.

- 서버 마크업에 속성을 넣고 `ThemeProvider`를 함께 쓰면, `@axis-ds/theme` 1.7.0 부터는 Provider 가 그 속성을 초기값으로 읽어 유지합니다. 1.6.2 이하는 브랜드가 `undefined`이면 마운트 때 속성을 지우므로 같은 브랜드를 `defaultBrand`로도 지정합니다(`axis check` 1.6.1 의 `brand.activation` 이 설치본 버전으로 가려 알려 줌).
- 브랜드 이름은 검증하지 않습니다. 해당 브랜드 CSS를 import하지 않으면 속성이 있어도 기본 화면입니다.

**첫 화면의 색 전환**: `ThemeProvider` 만 쓰는 SPA 에서는 첫 화면에서 Button 같은 요소가 기본 색에서 브랜드 색으로 넘어가는 전환이 보일 수 있습니다. 원인은 「첫 페인트가 기본 브랜드」가 아닙니다. 다시 잰 결과(Vite SPA, 10회) `data-brand` 는 첫 콘텐츠 페인트(FCP) 전에 붙었지만(10/10), 그보다 먼저 요소 스타일이 기본값으로 계산되고 나서 속성이 붙어, Button 의 `transition-colors` 가 기본 색(rgb(37, 99, 235))에서 브랜드 색(rgb(50, 106, 218))으로 약 150ms 동안 넘어갔습니다. 빈도는 조건에 따라 다릅니다(FCP 시점에 전환이 진행 중이던 비율: 처음 측정 3/10, 다른 Chromium 빌드 · 정적 서버로 다시 잰 값 6/10, CPU 1배 · 4배 모두).

처방은 React 보다 먼저 속성을 붙이는 것입니다.

- 서버에서 그리는 앱이고 브랜드를 고정한다면 서버 마크업에 `<html data-brand="ontology">` 를 넣습니다. `ThemeProvider` 를 함께 쓰면 1.7.0 부터는 그대로 유지되고, 1.6.2 이하는 같은 브랜드를 `defaultBrand` 로도 지정합니다(빼면 마운트 때 속성이 지워집니다).
- SPA 는 `<head>` 의 인라인 스크립트로 저장값을 붙입니다. 이 스크립트를 넣은 측정에서는 FCP 시점의 전환이 없었습니다(CPU 1배 0/9, FCP 를 수집하지 못한 1회 제외 · 4배 0/10).

```html
<!-- index.html 의 <head>, 앱 스크립트보다 앞 -->
<script>
  try {
    var root = document.documentElement;
    var brand = localStorage.getItem("axis-brand"); // ThemeProvider 의 brandStorageKey
    if (brand) root.setAttribute("data-brand", brand);
    var theme = localStorage.getItem("axis-theme") || "system"; // storageKey · defaultTheme
    if (theme === "system") {
      theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    root.classList.add(theme);
    root.setAttribute("data-theme", theme);
  } catch (e) {}
</script>
```

- 저장값이 없으면 브랜드를 붙이지 않습니다. `defaultBrand` 없는 `ThemeProvider` 와 같은 규칙이라, 끈 상태가 새로고침 뒤에도 유지됩니다(위 표의 「기본은 끄고 사용자가 켬」). 1.7.0 의 「끔」은 빈 문자열 저장값이라 `if (brand)` 로 걸러집니다. 기본 브랜드를 두려면 `|| "ontology"` 가 아니라 `brand === null ? "ontology" : brand` 처럼 저장값이 없을 때(`null`)만 대체합니다. `||` 는 빈 문자열(끔)도 바꿔 끈 상태를 풀어 버립니다. 브랜드를 고정하는 앱은 스크립트 대신 마크업 속성을 씁니다.
- 키 이름과 기본값은 `ThemeProvider` 의 `brandStorageKey` · `storageKey` · `defaultTheme` 과 맞춥니다.
- 측정에 쓴 스크립트는 저장값이 없을 때 ontology 를 붙이는 형태였습니다. 위 예시는 해제를 유지하려고 그 대체값만 뺀 것이고, 속성을 붙이는 시점은 같습니다.
- Next.js App Router 에서 이 스크립트를 쓰는 방법(`<html>` 의 `suppressHydrationWarning` 필요 여부 등)은 재지 않았습니다.

### ontology 프리셋: 값의 출처와 접근성 보정

> 아래 보정과 색 결정은 대리 승인(2026-10-16 · 2026-10-17) 뒤 **디자인 오너의 사후 확인을 마쳤습니다(2026-10-19)**. 확인 결과 값은 바뀌지 않았습니다(`brand.json`의 `a11y.status`).

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

**함께 사후 확인을 마친 색 결정**

- 상태 색 접기: 성공 `ink-2`, 경고 · 오류 `bad`, 진행 · 정보 `key`
- warning 단계: 바탕 `bad-light`, 표식 · 글자 `bad`, 강조 `bad-dark`
- PlanCard 색 선 두께 1px, 에이전트 아바타 3색과 아바타 글자(`on-key`), Dialog overlay 기본값 유지
- 승인 범위에 맞추려고 바꾼 값: destructive 버튼 hover · active 바탕(`bad-light`), Alert warning 테두리 · `status.error-border`(`bad`), 비활성 버튼 글자(`sub-aa`)
- PlanCard 거절 버튼 hover 글자 `--axis-plan-card-reject-hover-text`: `status-error-strong`과 같은 값(라이트 #A8281F · 다크 #F49890)
- PlanCard 새 변수 3개(1.6.0부터): 거절 버튼 글자 `--axis-plan-card-reject-text` 라이트 #C8332E · 다크 #F07A72, 승인 버튼 바탕 `--axis-plan-card-approve-bg` #2A2F36 · #D0D4D9, 승인 버튼 hover 바탕 `--axis-plan-card-approve-hover-bg` #111418 · #F1F3F5. 1.5.x 의 PlanCard 가 읽던 ontology `status-error` · `status-success` · `status-success-strong` 과 같은 값이라 ontology 화면은 바뀌지 않았습니다
- 대기 · 건너뜀 상태 점 `status-neutral-muted`는 비텍스트 대비 3:1에 못 미치는 바탕이 있습니다. 라이트 #D6DADF는 `surface-default` 위 1.40:1 · `surface-secondary` 위 1.28:1 · 페이지 바탕(`--background` #F7F7F7) 위 1.31:1, 다크 #5F6874는 3.12:1 · 2.83:1 · 3.37:1(#0E1013)입니다

v1은 색이 무채색 · `key` · `bad` 세 계열이라 상태가 색만으로 구분되지 않습니다. 상태는 글자 · 아이콘과 함께 표시합니다.

---

## 5. 커스텀 테마 생성

브랜드 축(`data-brand`)을 이용해 자기 브랜드를 정의합니다. 앱 안에서 CSS로 정의하는 방법과 tokens 패키지에 브랜드를 추가하는 방법이 있습니다.

### 앱에서 브랜드 CSS 정의

브랜드 컬러에 맞는 변수 셋을 브랜드 선택자로 정의합니다. 덮어쓰는 대상은 semantic · component 변수와, 필요하면 shadcn HSL 변수(`--primary` 등)입니다.

```css
/* styles/brand-acme.css */

/* 라이트 모드 (같은 속성 선택자를 두 번 써서 명시도 (0,2,0)) */
[data-brand="acme"][data-brand="acme"] {
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

  /* Progress 채움 (1.8.0부터 surface-brand 를 따르지 않음) */
  --axis-progress-fill-default: #7C3AED;
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

  --axis-progress-fill-default: #8B5CF6;
}
```

라이트 블록에서 바꾼 색 변수는 다크 블록에도 짝을 둡니다. 짝이 없으면 같은 요소에 `.dark`를 붙였을 때 라이트 값이 다크에도 남습니다.

앱 진입점에서 토큰 CSS(와 앱의 `globals.css`) 뒤에 import하고, `ThemeProvider`를 쓰면 `defaultBrand="acme"`(첫 화면까지 맞추려면 `<html data-brand="acme">`도 함께)로, Provider 없이 쓰면 `<html data-brand="acme">`로 적용합니다. 위 예는 `@axis-ds/tokens` 브랜드와 같은 선택자를 씁니다. 라이트 `[data-brand="acme"][data-brand="acme"]`와 다크 선택자 3종이 모두 (0,2,0)이라 기본 `:root` · `.dark`와 `globals.css`의 `:root` · `.dark`(0,1,0)보다 높으므로, import 순서가 달라도 브랜드 값이 이깁니다(권장 위치는 마지막). 라이트 · 다크 블록끼리는 명시도가 같으므로 다크 블록을 라이트 블록 **뒤에** 둡니다. 라이트 선택자를 `[data-brand="acme"]` 하나로 쓰면 명시도가 (0,1,0)이 되어 나중에 온 쪽이 이기므로, 그때는 브랜드 CSS를 반드시 토큰 CSS와 `globals.css` 뒤에 두어야 합니다.

```tsx
import "@axis-ds/tokens/css"
import "./globals.css"
import "./styles/brand-acme.css"  // 권장 위치: 토큰 CSS와 globals.css 이후
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
   - `shadcn` 키도 `radius`를 빼고는 `dark.json`의 `shadcn`에 짝이 있어야 합니다. 위 예시라면 `dark.json`에 `"shadcn": { "primary": "..." }`를 둡니다.
3. `brand.json`에는 `name`(디렉터리 이름과 같음) · `description` · `themes: ["light", "dark"]` · `a11y` 객체를 둡니다.
4. `packages/axis-tokens/package.json`의 `exports`에 다음 항목을 더합니다(`"./brands"`는 이미 있음).

   ```json
   "./css/brands/<name>": "./dist/css/brands/<name>.css",
   "./brands/<name>/brand.json": "./dist/brands/<name>/brand.json"
   ```

5. `pnpm --filter @axis-ds/tokens build`로 `dist/css/brands/<name>.css` · `dist/brands/<name>/brand.json` · `dist/brands/index.json`을 만듭니다. 위 규칙이나 `exports` 항목을 어기면 빌드가 실패합니다.

### Tailwind 설정 확장

#### Tailwind CSS 4

Tailwind 4 에는 `tailwind.config.ts` 가 없습니다. `bg-primary` · `rounded-md` · `font-mono` 같은 preset 매핑은 `@axis-ds/tokens/css/tailwind4` 가 이미 정의하므로, 그 밖의 토큰을 유틸리티로 쓰려면 전역 CSS 에 `@theme inline` 을 더합니다.

```css
/* app/globals.css */
@import "tailwindcss";
@import "@axis-ds/tokens/css/tailwind4";

@theme inline {
  --color-surface: var(--axis-surface-default);
  --color-surface-brand: var(--axis-surface-brand);
  --color-success: var(--axis-text-success);
  --radius-xl: var(--axis-radius-xl);
}
```

이렇게 하면 `bg-surface` · `bg-surface-brand` · `text-success` · `rounded-xl` 이 각 AXIS 변수로 생성됩니다. 진입점이 이미 정의한 이름(`--color-background` · `--color-foreground` · `--color-border` · `--radius-sm|md|lg` · `--font-sans|serif|mono` 등)을 다시 정의하면 앱 쪽 값이 진입점 매핑을 덮어씁니다. 아래 Tailwind 3 예시의 `foreground` · `border` 처럼 기존 이름을 바꾸는 매핑은 그 점을 알고 씁니다.

#### Tailwind CSS 3

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
