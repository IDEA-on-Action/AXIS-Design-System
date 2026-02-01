# @axis-ds/ui-react

AXIS Design System의 React UI 컴포넌트 라이브러리입니다. Button, Input, Card 등 핵심 UI 컴포넌트를 제공합니다.

## 설치

```bash
npm install @axis-ds/ui-react @axis-ds/tokens @axis-ds/theme
# or
pnpm add @axis-ds/ui-react @axis-ds/tokens @axis-ds/theme
```

CSS Variables 설정:

```css
/* globals.css */
@import '@axis-ds/tokens/css/shadcn';
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
