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

컴포넌트마다 서브패스(`@axis-ds/agentic-ui/<컴포넌트 이름의 kebab-case>`)가 있습니다. 1.5.0 에서 그동안 루트로만 import 할 수 있던 `agent-avatar` · `recovery-banner` · `source-panel` · `step-timeline` · `surface-renderer` · `thinking-indicator` 서브패스를 더했습니다.

## 서버 컴포넌트 (Next.js App Router)

1.5.0 부터 `"use client"` 를 쓰지 않은 서버 컴포넌트(create-next-app 기본 `app/page.tsx` 등)에서 바로 import 해 렌더할 수 있습니다. 루트와 서브패스 결과가 같습니다.

```tsx
// app/page.tsx (서버 컴포넌트)
import { CodeBlock, MessageBubble, StreamingText } from '@axis-ds/agentic-ui';

export default function Page() {
  return (
    <>
      <MessageBubble role="assistant" content="안녕하세요" />
      <CodeBlock code="pnpm add @axis-ds/agentic-ui" language="bash" />
      <StreamingText text="응답을 생성하고 있어요" />
    </>
  );
}
```

**클라이언트 경계가 있는 컴포넌트**: 아래 7개는 패키지 `dist` 파일에 `"use client"` 가 있어, 서버 컴포넌트가 렌더하면 그 컴포넌트만 브라우저에서 hydrate 됩니다(복사 · 펼침 · 보기 모드 전환 · 피드백 선택 · 타이핑 애니메이션).

`CodeBlock` · `ContextPanel` · `DiffViewer` · `FeedbackButtons` · `SourcePanel` · `StreamingText` · `ToolCallCard`

나머지 11개(`AgentAvatar` · `ApprovalCard` · `AttachmentCard` · `MessageBubble` · `PlanCard` · `RecoveryBanner` · `RunProgress` · `StepTimeline` · `SurfaceRenderer` · `ThinkingIndicator` · `TokenUsageIndicator`)와 루트 배럴에는 지시문이 없어 서버에서 렌더됩니다. 판단 기준은 `useState` · `useEffect` · `useRef` 같은 클라이언트 전용 API 와 컴포넌트 안에서 이벤트 핸들러를 직접 만드는지이며, 목록은 패키지 소스 `scripts/client-modules.mjs` 한 곳에서 관리합니다.

**서버 컴포넌트에서 함수 prop 은 넘길 수 없습니다**: `onCopy` · `onFeedback` · `onComplete` · `onRetry` · `onApprove` 같은 함수는 서버에서 클라이언트로 직렬화할 수 없어 React 가 오류를 냅니다(React Server Components 규칙). 함수 prop 없이 쓰면 서버에서 렌더되고, 핸들러가 필요하면 그 부분을 `"use client"` 파일로 만들어 그 안에서 씁니다.

```tsx
// app/feedback.tsx
'use client';
import { FeedbackButtons } from '@axis-ds/agentic-ui';

export function Feedback({ messageId }: { messageId: string }) {
  return <FeedbackButtons messageId={messageId} onFeedback={(id, f) => console.log(id, f)} />;
}
```

- 이 패키지는 `@axis-ds/ui-react` 루트에서 `cn` 을 가져옵니다. 그래서 서브패스 하나만 import 해도 서버 그래프에 `@axis-ds/ui-react` 의 Radix 클라이언트 참조가 함께 실릴 수 있습니다(1.4.0 에도 있던 현상).

## 컴포넌트 목록

AgentAvatar, ApprovalCard, AttachmentCard, CodeBlock, ContextPanel, DiffViewer, FeedbackButtons, MessageBubble, PlanCard, RecoveryBanner, RunProgress, SourcePanel, StepTimeline, StreamingText, SurfaceRenderer, ThinkingIndicator, TokenUsageIndicator, ToolCallCard

## 문서

자세한 사용법은 [AXIS Design System 문서](https://axis.minu.best)를 참고하세요.

## 라이선스

MIT
