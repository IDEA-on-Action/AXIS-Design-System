# @axis-ds/ui-react

AXIS Design System의 React UI 컴포넌트 라이브러리입니다. Button, Input, Card 등 핵심 UI 컴포넌트를 제공합니다.

## 설치

```bash
npm install @axis-ds/ui-react @axis-ds/tokens @axis-ds/theme
# or
pnpm add @axis-ds/ui-react @axis-ds/tokens @axis-ds/theme
```

## Tailwind 연동

### Tailwind CSS 4

Tailwind CSS 4(`@import "tailwindcss"`, create-next-app 15.5 기본)에서는 `@import "tailwindcss"` 가 있는 전역 CSS 에 두 줄을 더합니다.

```css
/* app/globals.css */
@import "tailwindcss";
@import "@axis-ds/tokens/css/tailwind4";
@import "@axis-ds/ui-react/tailwind.css";
```

- `@axis-ds/ui-react/tailwind.css` 는 스타일 규칙 없이 `@source "./dist"` 한 줄만 담습니다. Tailwind 4 는 `node_modules` 를 스캔하지 않아서, 이 줄이 없으면 컴포넌트가 쓰는 `bg-[var(--axis-button-bg-default)]` 같은 클래스가 생성되지 않고 Button 배경이 투명해집니다. 경로는 파일 기준 상대 경로라 npm · pnpm 설치 모두 동작합니다.
- `@import "tailwindcss"` 가 있는 같은 파일에서 import 합니다. 다른 CSS 파일이나 JS/TSX 에서 import 하면 스캔 경로가 그 컴파일에 들어가지 않습니다.
- `@axis-ds/tokens/css/tailwind4` 는 `rounded-md` · `font-mono` 등을 AXIS 변수로 매핑하고 토큰 변수(`css` · `css/shadcn`)를 base 레이어로 함께 불러옵니다. 아래 Tailwind 3 의 `@axis-ds/tokens/css/shadcn` import 는 넣지 않습니다(레이어 없이 넣으면 `border-red-500` 같은 테두리색 유틸리티가 무효가 됩니다). 브랜드 CSS · create-next-app 기본 `:root` 와의 충돌은 `@axis-ds/tokens` README 를 참고하세요.
- `@axis-ds/agentic-ui` 도 쓰면 `@import "@axis-ds/agentic-ui/tailwind.css";` 를 함께 넣습니다.

### Tailwind CSS 3

CSS Variables 설정:

```css
/* globals.css */
@import '@axis-ds/tokens/css/shadcn';
```

`tailwind.config` 에는 `@axis-ds/tokens/tailwind` preset 과 함께 컴포넌트 파일을 `content` 에 넣습니다.

```js
content: [
  "./src/**/*.{js,ts,jsx,tsx}",
  "./node_modules/@axis-ds/ui-react/**/*.{js,jsx}",
],
```

## 사용법

```tsx
import { Button } from '@axis-ds/ui-react';
// 또는 개별 임포트
import { Button } from '@axis-ds/ui-react/button';

export default function App() {
  return <Button variant="default">Click me</Button>;
}
```

## 컴포넌트 목록

Accordion, Alert, Avatar, Breadcrumb, Button, Card, Checkbox, Collapsible, Command, Dialog, Dropdown Menu, Input, Popover, Progress, Radio Group, Scroll Area, Sheet, Skeleton, Slider, Switch, Table, Textarea, Toggle, Tooltip

## 문서

자세한 사용법은 [AXIS Design System 문서](https://axis.minu.best)를 참고하세요.

## 라이선스

MIT
