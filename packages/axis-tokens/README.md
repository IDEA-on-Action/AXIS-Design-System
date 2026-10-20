# @axis-ds/tokens

AXIS Design System의 디자인 토큰 패키지입니다. 색상, 타이포그래피, 간격 등의 토큰을 CSS 변수, JSON, JS 형태로 제공합니다.

## 설치

```bash
npm install @axis-ds/tokens
# or
pnpm add @axis-ds/tokens
```

## 사용법

### CSS Variables (AXIS 네이티브)

```css
@import '@axis-ds/tokens/css';
```

Light/Dark 모드를 모두 포함하며, `.dark` 클래스로 다크모드가 활성화됩니다.

### shadcn/ui 호환 CSS Variables

외부 프로젝트에서 AXIS 컴포넌트를 사용할 때 권장하는 방식입니다.

```css
@import '@axis-ds/tokens/css/shadcn';
```

별도의 `globals.css` CSS Variables 설정 없이 shadcn 호환 변수(`--background`, `--primary` 등)가 자동으로 설정됩니다.

### Tailwind CSS 4

Tailwind CSS 4(`@import "tailwindcss"`, create-next-app 15.5 기본)에서는 전역 CSS 에 한 줄을 더합니다.

```css
/* app/globals.css */
@import "tailwindcss";
@import "@axis-ds/tokens/css/tailwind4";
```

- 아래 Tailwind 3 preset 과 같은 매핑(색 24 · radius 3 · 글꼴 3)을 `@theme inline` 으로 정의하고, 다크 모드는 `.dark` 클래스(`@custom-variant dark`)로 맞춥니다. `bg-primary` · `rounded-md` · `font-mono` · `dark:bg-primary` 가 AXIS 변수(`--primary` · `--radius` · `--axis-font-family-mono`)로 생성됩니다.
- 토큰 변수(`@axis-ds/tokens/css` · `@axis-ds/tokens/css/shadcn`)를 base 레이어로 함께 불러오므로 따로 import 하지 않아도 됩니다. base 레이어라서 `border-red-500` 같은 유틸리티가 기본 테두리색보다 우선합니다.
- `@import "tailwindcss"` 뒤에 둡니다. 브랜드 CSS(`@axis-ds/tokens/css/brands/ontology` 등)는 이 줄 뒤에 import 합니다.
- create-next-app 기본 `globals.css` 의 `:root { --background: ...; --foreground: ... }`(다크용 `@media` 포함)와 `body { background: var(--background) }` 는 AXIS 의 같은 이름 변수(HSL 값)를 덮어써 `bg-background` 를 무효로 만듭니다. 같은 파일의 기본 `@theme inline`(`--color-background` · `--font-sans` · `--font-mono` 등)도 이 진입점의 매핑을 덮어써 `font-mono` 가 AXIS 글꼴이 아니게 됩니다. 이 블록들은 지웁니다.
- Tailwind 4 는 `node_modules` 를 스캔하지 않습니다. AXIS 컴포넌트 패키지를 쓰면 그 패키지의 클래스가 생성되도록 스캔 경로(`@source`)도 필요합니다. `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 는 이 줄을 담은 `tailwind.css` 를 제공하므로 `@import "@axis-ds/ui-react/tailwind.css";` 처럼 한 줄씩 더합니다.

**Tailwind 3 preset 과 다르게 동작하는 것**

- `dark:` 변형은 Tailwind 4 공식 형태 `@custom-variant dark (&:where(.dark, .dark *))` 입니다. Tailwind 3 preset(`darkMode: ['class']`)은 `.dark` 의 자손에만 적용되고 명시도가 클래스 하나만큼 올라가지만, 이 진입점은 `.dark` 를 붙인 요소 자신에도 적용되고 명시도를 올리지 않습니다.
- 색을 지정하지 않은 `border` · `border-t` 는 이 진입점이 base 레이어로 불러오는 `* { border-color: hsl(var(--border)) }` 때문에 AXIS `--border` 색입니다. Tailwind 3 preset 은 preflight 의 gray-200(`#e5e7eb`)입니다(`@axis-ds/tokens/css/shadcn` 을 따로 import 하지 않을 때). 기본 라이트에서는 둘 다 rgb(229,231,235) 로 같지만, 다크(`--border` rgb(31,41,55))와 ontology 브랜드(라이트 rgb(230,232,235) · 다크 rgb(43,47,53))에서는 Tailwind 3 과 다른 색이 됩니다.

### Tailwind CSS 3 Preset

```ts
// tailwind.config.ts
import axisPreset from '@axis-ds/tokens/tailwind'

export default {
  presets: [axisPreset],
  content: ['./src/**/*.{ts,tsx}'],
}
```

### JavaScript / TypeScript

```ts
import { tokens } from '@axis-ds/tokens'

console.log(tokens.color.blue[500]) // '#3B82F6'
```

### JSON

```ts
import tokens from '@axis-ds/tokens/json'
```

## 문서

자세한 사용법은 [AXIS Design System 문서](https://axis.minu.best)를 참고하세요.

## 라이선스

MIT
