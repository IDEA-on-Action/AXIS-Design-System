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

### 애니메이션

- Accordion 열고 닫기 · Progress `indeterminate` 의 keyframes 는 `@axis-ds/tokens` 가 정의합니다(Tailwind 3 preset · Tailwind 4 진입점). 따로 할 일은 없습니다.
- Dialog · Sheet · Popover · Select · DropdownMenu · Tooltip · Toast 의 열고 닫는 애니메이션(`animate-in` · `fade-in-0` 류)은 애니메이션 플러그인이 필요합니다. 선택적 peer 의존으로 선언되어 있어 설치 경고는 나오지 않습니다. 없으면 애니메이션 없이 바로 열리고 닫힙니다.

| Tailwind | 플러그인 | 넣는 곳 |
|---|---|---|
| 4 | `tw-animate-css` | 전역 CSS 의 `@import "tailwindcss";` 바로 다음 줄에 `@import "tw-animate-css";` |
| 3 | `tailwindcss-animate` | `tailwind.config` 의 `plugins: [require("tailwindcss-animate")]` |

- 움직임 줄이기(`prefers-reduced-motion: reduce`) 설정에서는 모든 컴포넌트 애니메이션이 멈춥니다(`motion-reduce:!animate-none`).

## 사용법

```tsx
import { Button } from '@axis-ds/ui-react';
// 또는 개별 임포트
import { Button } from '@axis-ds/ui-react/button';

export default function App() {
  return <Button variant="default">Click me</Button>;
}
```

## 서버 컴포넌트 (Next.js App Router)

1.5.0 부터 `"use client"` 를 쓰지 않은 서버 컴포넌트(create-next-app 기본 `app/page.tsx` · `app/layout.tsx`)에서 바로 import 해 렌더할 수 있습니다. 루트(`@axis-ds/ui-react`)와 서브패스(`@axis-ds/ui-react/button` 등) 결과가 같습니다.

```tsx
// app/page.tsx (서버 컴포넌트)
import { Avatar, Button, Card, buttonVariants, cn } from '@axis-ds/ui-react';

export default function Page() {
  return (
    <Card className={cn('p-6')}>
      <Avatar src="/me.png" alt="프로필" fallback="AX" />
      <Button>저장</Button>
      <a className={buttonVariants({ variant: 'outline' })} href="/docs">문서</a>
    </Card>
  );
}
```

**클라이언트 경계가 있는 컴포넌트**: 아래는 패키지 안에 `"use client"` 경계가 있어 서버 컴포넌트가 렌더하면 그 부분만 브라우저에서 hydrate 됩니다. 쓰는 쪽에서 따로 할 일은 없습니다.

| 경계 | 컴포넌트 |
|---|---|
| 모듈 전체(패키지 `dist` 파일에 `"use client"`) | `Avatar`(이미지 로드 오류 상태와 대체 표시), `Command` · `CommandInput` · `CommandList` · `CommandEmpty` · `CommandGroup` · `CommandItem` · `CommandSeparator`(cmdk) |
| Radix 부분만(Radix 패키지 자체의 `"use client"`) | Accordion · Checkbox · Collapsible · Dialog · Dropdown Menu · Label · Popover · Radio Group · Scroll Area · Select · Separator · Sheet · Slider · Switch · Tabs · Toast · Toggle · Tooltip. 래퍼는 서버에서 렌더되고 Radix 부분이 클라이언트 참조가 됩니다 |
| 없음(서버에서 렌더) | Alert · Badge · Breadcrumb · Button · Card · Input · Progress · Skeleton · Table · Textarea |

판단 기준은 `useState` · `useEffect` · `useContext` · `createContext` 같은 클라이언트 전용 API, DOM 이벤트 핸들러를 직접 만드는 코드, `"use client"` 모듈 내보내기의 점 접근(`Command.Input` 등)입니다. 지시문을 붙이는 파일 목록은 패키지 소스 `scripts/client-modules.mjs` 한 곳에서 관리합니다.

**서버에서 호출할 수 있는 함수**: `cn` 과 `*Variants` 7개(`alertVariants` · `avatarVariants` · `badgeVariants` · `buttonVariants` · `progressVariants` · `progressIndicatorVariants` · `toggleVariants`), 합 8개 함수는 서버 컴포넌트에서 직접 호출할 수 있습니다. 이 함수들을 담은 파일과 루트 배럴에는 `"use client"` 를 두지 않습니다. `avatarVariants` 는 `Avatar` 컴포넌트와 파일을 나눠 서버 호출을 유지했습니다(import 경로 · 이름은 그대로).

**서버 컴포넌트에서 함수 prop 은 넘길 수 없습니다**: `onClick` · `onCheckedChange` · `onSelect` 같은 함수는 서버에서 클라이언트로 직렬화할 수 없어 React 가 오류를 냅니다(React Server Components 규칙이며 이 패키지의 제약이 아닙니다). 핸들러가 필요하면 그 부분을 `"use client"` 파일로 만들고 그 안에서 AXIS 컴포넌트를 씁니다.

```tsx
// app/save-button.tsx
'use client';
import { Button } from '@axis-ds/ui-react';

export function SaveButton() {
  return <Button onClick={() => console.log('저장')}>저장</Button>;
}
```

- 서버 컴포넌트가 루트 배럴을 import 하면 Radix 컴포넌트의 클라이언트 참조가 함께 실려 First Load JS 가 커질 수 있습니다(1.4.0 에도 있던 현상). 크기가 중요하면 서브패스(`@axis-ds/ui-react/button`)로 import 합니다.

## 컴포넌트 목록

Accordion, Alert, Avatar, Breadcrumb, Button, Card, Checkbox, Collapsible, Command, Dialog, Dropdown Menu, Input, Popover, Progress, Radio Group, Scroll Area, Sheet, Skeleton, Slider, Switch, Table, Textarea, Toggle, Tooltip

## 문서

자세한 사용법은 [AXIS Design System 문서](https://axis-design-system.pages.dev)를 참고하세요.

## 라이선스

MIT
