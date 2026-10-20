# @axis-ds/agentic-ui

AXIS Design System의 AI/Agent 전용 UI 컴포넌트 라이브러리입니다. LLM 기반 애플리케이션에 최적화된 컴포넌트를 제공합니다.

## 설치

```bash
npm install @axis-ds/agentic-ui
# or
pnpm add @axis-ds/agentic-ui
```

## Tailwind 연동

### Tailwind CSS 4

Tailwind CSS 4(`@import "tailwindcss"`, create-next-app 15.5 기본)에서는 `@import "tailwindcss"` 가 있는 전역 CSS 에 두 줄을 더합니다.

```css
/* app/globals.css */
@import "tailwindcss";
@import "@axis-ds/tokens/css/tailwind4";
@import "@axis-ds/agentic-ui/tailwind.css";
```

- `@axis-ds/agentic-ui/tailwind.css` 는 스타일 규칙 없이 `@source "./dist"` 한 줄만 담습니다. Tailwind 4 는 `node_modules` 를 스캔하지 않아서, 이 줄이 없으면 컴포넌트가 쓰는 `bg-[var(--axis-agent-avatar-assistant)]` 같은 클래스가 생성되지 않습니다. 경로는 파일 기준 상대 경로라 npm · pnpm 설치 모두 동작합니다.
- `@import "tailwindcss"` 가 있는 같은 파일에서 import 합니다. 다른 CSS 파일이나 JS/TSX 에서 import 하면 스캔 경로가 그 컴파일에 들어가지 않습니다.
- `@axis-ds/tokens/css/tailwind4` 는 `rounded-md` · `font-mono` 등을 AXIS 변수로 매핑하고 토큰 변수를 base 레이어로 함께 불러옵니다. pnpm 처럼 의존성을 끌어올리지 않는 설치에서는 `@axis-ds/tokens` 를 직접 설치해야 이 import 가 풀립니다. 브랜드 CSS · create-next-app 기본 `:root` 와의 충돌은 `@axis-ds/tokens` README 를 참고하세요.
- 이 패키지는 `@axis-ds/ui-react` 에서 유틸리티 함수만 가져옵니다. 앱에서 `@axis-ds/ui-react` 컴포넌트를 직접 쓸 때만 `@import "@axis-ds/ui-react/tailwind.css";` 를 함께 넣습니다.

### Tailwind CSS 3

`tailwind.config` 에는 `@axis-ds/tokens/tailwind` preset 과 함께 컴포넌트 파일을 `content` 에 넣습니다.

```js
content: [
  "./src/**/*.{js,ts,jsx,tsx}",
  "./node_modules/@axis-ds/agentic-ui/**/*.{js,jsx}",
],
```

## 사용법

```tsx
import { StreamingText, ToolCallCard } from '@axis-ds/agentic-ui';
// 또는 개별 임포트
import { StreamingText } from '@axis-ds/agentic-ui/streaming-text';
```

## 컴포넌트 목록

RunProgress, ApprovalCard, StreamingText, ToolCallCard, MessageBubble, FeedbackButtons, CodeBlock, DiffViewer, PlanCard, ContextPanel, TokenUsageIndicator, AttachmentCard

## 문서

자세한 사용법은 [AXIS Design System 문서](https://axis.minu.best)를 참고하세요.

## 라이선스

MIT
