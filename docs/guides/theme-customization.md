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

- [ ] 쓰는 컴포넌트 패키지의 `tailwind.css` 를 넣었다. 빠지면 변수는 ontology 값(`--axis-button-bg-default` #326ADA)으로 바뀌지만 Button 바탕이 투명(`rgba(0, 0, 0, 0)`)하고 둥글기 0px, PlanCard 왼쪽 색 선 0px 입니다. 넣으면 rgb(50, 106, 218) · 10px · 1px 입니다.
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

- [ ] `presets: [axisPreset]` 를 넣었다. 빠지면 브랜드를 켜도 Button 둥글기가 6px(Tailwind 기본 `rounded-md`)이고 글꼴이 Tailwind 기본(`ui-sans-serif`)입니다. 넣으면 10px · Pretendard 스택입니다.
- [ ] `@axis-ds/tokens/css/shadcn` 을 넣었다. preset 의 `rounded-*` 는 shadcn 변수 `--radius` 를 읽으므로, 빠지면 브랜드를 켰을 때는 ontology 가 `--radius` 를 정의해 드러나지 않다가 **브랜드를 끄면 둥글기가 0px** 이 됩니다. 넣으면 켬 10px · 끔 6px 입니다.

**2. 브랜드 켜기** - `ThemeProvider` 를 쓰는지에 따라 다릅니다. 브랜드 CSS 를 import 하는 것만으로는 화면이 바뀌지 않습니다.

- [ ] `ThemeProvider` 를 쓰는 앱: `defaultBrand` 또는 `setBrand`(아래 「브랜드 적용」). 첫 화면까지 맞추려면 마크업 속성 `<html data-brand="ontology">` 를 함께 넣되, 마크업 속성만으로는 안 됩니다. 브랜드가 `undefined` 이면 `ThemeProvider` 가 마운트 때 속성을 지웁니다. 사용자가 브랜드를 끌 수 있게 하려면 `defaultBrand` 를 쓰지 않습니다(같은 절의 「`defaultBrand` 와 해제」)
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

- `defaultBrand` 를 쓰면 `setBrand(undefined)` 로 끈 상태가 새로고침 뒤 풀립니다(「브랜드 적용」, [WI-0068 #182](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/182))
- 브랜드 컨테이너 안쪽 요소에 `.dark` 를 붙이면 그 아래는 브랜드가 꺼진 기본 다크가 됩니다(「선택자와 다크 모드」)
- SPA 첫 화면에서 기본 색에서 브랜드 색으로 넘어가는 전환이 보일 수 있습니다(「Provider 없이 적용 · 첫 화면」)

#### cli 로 적용하기 (`@axis-ds/cli` 1.6.0부터)

`npx @axis-ds/cli init -y` 뒤 `npx @axis-ds/cli theme add ontology` 를 실행하면 위 1번의 전역 CSS 줄과 의존성 · 설정 기록을 cli 가 대신합니다. 2번 · 3번과 Tailwind 3 설정 파일은 cli 가 넣을 줄을 안내만 하고 고치지 않습니다. 아래 내용은 cli 1.6.0 발행 전 빌드로 src 없는 Next 15.5.28 프로젝트 2개(Tailwind 3.4.19 · Tailwind 4.3.3, 둘 다 npm)에서 확인했습니다(2026-10-25). 1.5.x 이하의 `theme add` 는 브랜드 줄만 넣고 Provider 예시가 `defaultBrand` 이므로 이 절과 다릅니다.

**theme add 가 자동으로 하는 것**

- 전역 CSS(`axis.config.json` 의 `globalCss`)에 기본 토큰 CSS 와 브랜드 import 를 넣습니다. 위치는 파일 앞쪽 import 구간의 끝, 첫 규칙보다 앞입니다. 이미 있는 줄은 넣지 않고, 같은 명령을 다시 실행하면 「바꾼 파일이 없습니다」로 끝납니다.
  - Tailwind 3: 파일 맨 앞, `@tailwind` 3줄보다 앞에 `@import "@axis-ds/tokens/css";` · `@import "@axis-ds/tokens/css/shadcn";` · `@import "@axis-ds/tokens/css/brands/ontology";` 순서로 넣습니다. 위 체크리스트 블록과 같습니다
  - Tailwind 4: `@import "tailwindcss";` 다음에 `@import "@axis-ds/tokens/css/tailwind4";` · `package.json` 에 선언된 컴포넌트 패키지의 `tailwind.css`(`@axis-ds/ui-react` · `@axis-ds/agentic-ui`) · 브랜드 순서로 넣습니다. 선언하지 않은 패키지의 줄은 넣지 않으므로, 나중에 `@axis-ds/agentic-ui` 를 더했으면 `theme add` 를 다시 실행합니다. 이때 새 줄은 import 구간의 끝, 곧 브랜드 줄 뒤에 들어갑니다. `tailwind.css` 는 `@source` 한 줄이라 위치가 브랜드 값에 영향을 주지 않지만, 위 순서대로 두려면 브랜드 줄을 맨 끝으로 옮깁니다
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

- [ ] 브랜드 켜기(위 2번). cli 는 루트 레이아웃(`app/layout.tsx` 등)에서 `ThemeProvider` · `data-brand` 를 찾지 못하면 아래 예시를 그대로 출력합니다. 예시의 `lang="ko"` 는 예시 값이니 앱의 `lang` 을 유지합니다. `ThemeProvider` · `data-brand` · `setBrand(` 중 하나라도 글자로 있으면 찾은 것으로 보고 예시 없이 「`ThemeProvider` · `data-brand` · `setBrand` 가 있습니다. "ontology" 로 켜는지 확인하세요」 한 줄만 냅니다. 그래서 `<ThemeProvider defaultTheme="system">` 만 있고 `defaultBrand` · `setBrand` 가 없는 레이아웃([빠른 시작](./quick-start.md) 「3. ThemeProvider 설정」 예시 그대로)에서도 예시가 안 나오는데, 이 구성은 마운트 때 브랜드가 지워집니다. `ThemeProvider` 를 쓰는 앱은 이 한 줄이 나와도 `defaultBrand` 나 `setBrand("ontology")` 를 직접 확인합니다.

  ```text
  브랜드 켜기 (ThemeProvider 는 @axis-ds/theme 1.3.0 이상)
    // 1) Provider 없이: 루트 레이아웃(app/layout.tsx)의 <html> 에 붙입니다(첫 화면부터 적용)
    <html lang="ko" data-brand="ontology">

    // 2) ThemeProvider 를 쓰면 마운트 때 브랜드가 없으면 속성을 지우므로 setBrand 로 켭니다(저장돼 유지, setBrand(undefined) 로 끔)
    import { useTheme } from "@axis-ds/theme";
    const { setBrand } = useTheme();
    setBrand("ontology");
    ! app/layout.tsx 에서 ThemeProvider · data-brand 를 찾지 못했습니다. 둘 다 없으면 import 만으로는 화면이 바뀌지 않습니다.
    ThemeProvider 를 쓰면 @axis-ds/theme 설치: npm install "@axis-ds/theme@^1.3.0"
  ```

  cli 예시에 `defaultBrand` 가 없는 것은 끈 상태가 새로고침 뒤 풀리는 한계(아래 「`defaultBrand` 와 해제」, WI-0068) 때문입니다. 사용자가 끌 수 없게 늘 켜 두는 앱이면 `defaultBrand="ontology"` 를 써도 됩니다(「브랜드 적용」).
- [ ] Tailwind 3: preset 을 넣습니다. cli 는 `tailwind.config.*` 에 preset 이 없으면 `presets: [require("@axis-ds/tokens/tailwind")] (ESM 이면 import axisPreset from "@axis-ds/tokens/tailwind")` 를 안내합니다. `content` 가 `componentsDir` 나 선언된 컴포넌트 패키지 경로를 덮지 않으면 넣을 경로도 함께 안내합니다
- [ ] Tailwind 4: create-next-app 기본 `globals.css` 의 `:root` · `@theme inline` · `@media (prefers-color-scheme: dark)` · `body` 블록을 지웁니다. `theme add` 는 이 블록을 그대로 두고, `axis init` 의 안내와 `axis check` 의 WARN 이 남은 정의 이름을 알려 줍니다
- [ ] 안내된 설치 명령(`npm install`, `ThemeProvider` 를 쓰면 `@axis-ds/theme`)을 실행합니다
- [ ] Pretendard 웹폰트를 로드합니다(위 3번). cli 는 글꼴을 다루지 않습니다

**axis check 가 새로 알려 주는 것** (1.6.0부터)

`npx @axis-ds/cli check` 는 아래 항목으로 위 체크리스트의 빠진 단계를 짚습니다. 항목 이름은 MCP `axis.check_project` 결과에 쓰이는 이름이고, cli 화면에는 판정과 문구만 나옵니다. brand · 컴포넌트 패키지 선언 등 해당할 때만 나오는 항목이 있습니다.

| 항목 이름 | 판정 | 언제 | 체크리스트 |
|---|---|---|---|
| `tailwind.config` | WARN | Tailwind 3 에서 `@axis-ds/tokens/tailwind` preset 이 없음. 1.5.x 이하는 자체 CSS 변수 매핑만 있어도 PASS 였습니다 | 1번 preset |
| `brand.activation` | WARN | brand 가 있는데 루트 레이아웃에 `ThemeProvider` · `data-brand` 가 없음. 문구 끝에 `<html data-brand="ontology">` 또는 `setBrand("ontology")` 를 안내 | 2번 |
| `tailwind.content` | FAIL(종료 코드 1) | Tailwind 3 `content` 가 `componentsDir` 나 선언된 컴포넌트 패키지 경로(`./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}` 등)를 덮지 않음 | 1번 content |
| `animation` | WARN | `@axis-ds/ui-react` 를 선언했는데 애니메이션 플러그인(Tailwind 3 `tailwindcss-animate`, Tailwind 4 `tw-animate-css`)이 없음 | - |

`brand.activation` 의 PASS 는 브랜드가 켜졌다는 뜻이 아닙니다. 루트 레이아웃(과 그 레이아웃이 import 하는 같은 디렉터리의 `./providers` · `./provider`)에 `ThemeProvider` · `data-brand` · `setBrand(` 글자가 있는지만 보므로, `defaultBrand` · `setBrand` 없이 `ThemeProvider` 만 둔 레이아웃도 PASS 입니다. 이 구성은 마운트 때 브랜드가 지워지니, `ThemeProvider` 를 쓰는 앱은 PASS 가 나와도 `defaultBrand` 나 `setBrand("ontology")` 를 직접 확인합니다.

위 Tailwind 3 프로젝트에서 `init -y` · `theme add ontology` 직후의 check 는 6 pass / 2 warn / 0 fail(WARN 은 preset 없음 · `brand.activation`)이고, `content` 에서 `./components/**` 를 빼고 `@axis-ds/ui-react` 를 선언한 변형은 `tailwind.content` FAIL · `animation` WARN 으로 종료 코드 1 입니다.

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

진입점이 `rounded-sm|md|lg` 를 `--radius` 로, `font-mono` · `font-sans` 를 `--axis-font-family-*` 로 매핑하므로 ontology 를 적용한 요소에서는 `rounded-lg` 12px · `rounded-md` 10px 이고 `font-mono` 가 JetBrains Mono 로 시작합니다. 진입점은 토큰 변수를 base 레이어로 불러오고 브랜드 CSS 는 레이어가 없어서, 브랜드 값이 토큰 기본값을 이깁니다.

Tailwind CSS 3 에서 같은 CSS 파일에 import 할 때는 `@import` 를 `@tailwind` 지시문보다 앞에 둡니다(CSS 규칙상 `@import` 는 다른 규칙보다 앞에 와야 합니다). 위 「브랜드 적용 빠른 시작」의 값은 이 순서(`tokens/css` · `css/shadcn` · 브랜드 다음 `@tailwind` 3줄)로 잰 것입니다. 이 순서에서는 `@tailwind base` 의 preflight(`*, ::before, ::after { border: 0 solid #e5e7eb }`)가 `css/shadcn` 의 `* { border-color: hsl(var(--border)) }` 보다 뒤에 오므로, 색을 지정하지 않은 `border` 는 다크 · 브랜드에서도 gray-200(#e5e7eb)입니다(Next.js 15.5 빌드 산출 CSS 의 규칙 순서로 확인, 브라우저 계산값은 재지 않음). AXIS `--border` 색이 필요한 곳은 `border-border` 처럼 색을 지정합니다.

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

**`defaultBrand` 와 해제**: `defaultBrand` 를 지정하면 `setBrand(undefined)` 로 끈 상태가 새로고침 뒤에 유지되지 않습니다. `setBrand(undefined)` 가 저장값을 지우므로 다음 마운트에서는 저장값이 없고, 그러면 `defaultBrand` 가 다시 적용되기 때문입니다(`packages/axis-theme/src/index.ts` 의 `readBrand(brandStorageKey) ?? (defaultBrand || undefined)`). 실측(1.6.0, Vite 앱): `defaultBrand="ontology"` 에서 끈 뒤 새로고침하면 다시 ontology 이고, `defaultBrand` 없이 `setBrand` 로 켜고 끄면 새로고침을 거듭해도 마지막 선택이 유지됩니다. 끈 상태를 저장할 값이 없어서, 지금은 「기본은 ontology 이면서 사용자가 끌 수 있음」을 만들 수 없습니다. 해제 상태 저장은 [WI-0068 (#182)](https://github.com/IDEA-on-Action/AXIS-Design-System/issues/182)에서 다룹니다.

| 용도 | 설정 | 새로고침 뒤 |
|---|---|---|
| 브랜드 고정(끄지 않음) | `defaultBrand="ontology"`, 첫 화면까지 맞추려면 `<html data-brand="ontology">` 도 함께 | 늘 ontology |
| 사용자가 켜고 끔 | `defaultBrand` 없이 `setBrand("ontology")` · `setBrand(undefined)` | 마지막 선택 유지(켠 상태는 저장값, 끈 상태는 저장값 없음). 첫 방문은 브랜드 없음 |

위 `BrandToggle` 예시의 「기본」 버튼을 `defaultBrand` 와 함께 쓰면 누른 그 화면에서만 꺼지고, 새로고침하면 다시 켜집니다.

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

같은 요소에 `data-brand`와 `.dark`를 함께 붙이면, ontology 라이트 블록에만 있고 다크 블록에 없는 변수 11개 가운데 기본 `.dark`와 값이 달라지는 9개(`--axis-radius-sm|md|lg`, 글꼴 2개, PlanCard 색 선, Card 그림자 2개, shadcn `--radius` 12px)는 다크에서도 브랜드 라이트 값이 유지됩니다. 브랜드 라이트 (0,2,0)가 기본 `.dark` (0,1,0)를 이기므로 import 순서와 상관없습니다. 나머지 2개(`--axis-button-border-default` · `--axis-button-ghost-bg-default`)는 양쪽 모두 `transparent`라 화면 차이가 없습니다.

### Provider 없이 적용 · 첫 화면

`ThemeProvider` 없이 속성을 직접 붙여도 됩니다.

```ts
document.documentElement.setAttribute("data-brand", "ontology")  // 적용
document.documentElement.removeAttribute("data-brand")           // 해제
```

서버 마크업에 `<html data-brand="ontology">`를 넣을 수도 있습니다. 문서 사이트는 next-themes(`attribute="class"`)를 쓰므로 브랜드 전환 데모(`/docs/brand-demo/`)가 이 방식으로 속성을 다룹니다.

- 서버 마크업에 속성을 넣고 `ThemeProvider`를 함께 쓰면 같은 브랜드를 `defaultBrand`로 지정합니다(브랜드 고정용 조합). 브랜드가 `undefined`이면 `ThemeProvider`가 마운트 때 속성을 지웁니다.
- 브랜드 이름은 검증하지 않습니다. 해당 브랜드 CSS를 import하지 않으면 속성이 있어도 기본 화면입니다.

**첫 화면의 색 전환**: `ThemeProvider` 만 쓰는 SPA 에서는 첫 화면에서 Button 같은 요소가 기본 색에서 브랜드 색으로 넘어가는 전환이 보일 수 있습니다. 원인은 「첫 페인트가 기본 브랜드」가 아닙니다. 다시 잰 결과(Vite SPA, 10회) `data-brand` 는 첫 콘텐츠 페인트(FCP) 전에 붙었지만(10/10), 그보다 먼저 요소 스타일이 기본값으로 계산되고 나서 속성이 붙어, Button 의 `transition-colors` 가 기본 색(rgb(37, 99, 235))에서 브랜드 색(rgb(50, 106, 218))으로 약 150ms 동안 넘어갔습니다. 빈도는 조건에 따라 다릅니다(FCP 시점에 전환이 진행 중이던 비율: 처음 측정 3/10, 다른 Chromium 빌드 · 정적 서버로 다시 잰 값 6/10, CPU 1배 · 4배 모두).

처방은 React 보다 먼저 속성을 붙이는 것입니다.

- 서버에서 그리는 앱이고 브랜드를 고정한다면 서버 마크업에 `<html data-brand="ontology">` 를 넣습니다. `ThemeProvider` 를 함께 쓰면 같은 브랜드를 `defaultBrand` 로도 지정합니다(빼면 마운트 때 속성이 지워집니다).
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

- 저장값이 없으면 브랜드를 붙이지 않습니다. `defaultBrand` 없는 `ThemeProvider` 와 같은 규칙이라, 끈 상태가 새로고침 뒤에도 유지됩니다(위 「`defaultBrand` 와 해제」의 「사용자가 켜고 끔」). 여기에 `|| "ontology"` 를 더하면 `defaultBrand` 와 같은 한계(끈 상태가 새로고침 뒤 풀림)를 그대로 되풀이합니다. 브랜드를 고정하는 앱은 스크립트 대신 마크업 속성을 씁니다.
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
