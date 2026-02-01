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

### Tailwind CSS Preset

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
