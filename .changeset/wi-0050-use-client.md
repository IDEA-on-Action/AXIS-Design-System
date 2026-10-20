---
"@axis-ds/ui-react": minor
"@axis-ds/agentic-ui": minor
"@axis-ds/theme": minor
"@axis-ds/tokens": minor
---

Next.js App Router 서버 컴포넌트에서 바로 쓸 수 있게 `"use client"` 경계를 넣었습니다(WI-0050).

- 종전(1.2.1 · 1.3.0 · 1.4.0)에는 `"use client"` 를 쓰지 않은 서버 컴포넌트(create-next-app 기본 `page.tsx` · `layout.tsx`)에서 아래 컴포넌트를 쓰면 `next build` 가 실패했습니다. 이제 패키지 안에 클라이언트 경계가 있어 그대로 렌더됩니다.
  - `@axis-ds/ui-react`: `Avatar`(`useState`), `CommandInput` · `CommandList` · `CommandEmpty` · `CommandGroup` · `CommandItem` · `CommandSeparator`(cmdk 점 접근)
  - `@axis-ds/agentic-ui`: `CodeBlock` · `ContextPanel` · `DiffViewer` · `FeedbackButtons` · `SourcePanel` · `StreamingText` · `ToolCallCard`
  - `@axis-ds/theme`: `ThemeProvider`(import 만 해도 `createContext is not a function` 으로 빌드 전체가 멈췄음). 서버 `app/layout.tsx` 에서 바로 써도 됩니다
- `cn` 과 `*Variants` 7개(`alertVariants` · `avatarVariants` · `badgeVariants` · `buttonVariants` · `progressVariants` · `progressIndicatorVariants` · `toggleVariants`), 합 8개 함수는 지금처럼 서버 컴포넌트에서 호출할 수 있습니다. 루트 배럴과 이 함수들을 담은 파일에는 지시문을 두지 않습니다. `avatarVariants` 는 `Avatar` 컴포넌트와 파일을 나눴고 import 경로 · 이름은 그대로입니다.
- `@axis-ds/agentic-ui` 에 서브패스 6개를 더했습니다: `./agent-avatar` · `./recovery-banner` · `./source-panel` · `./step-timeline` · `./surface-renderer` · `./thinking-indicator`(종전에는 루트로만 import 할 수 있었음).

하위 호환: 루트 `.` 와 기존 서브패스의 exports 경로 · 내보내기 이름 · 타입 선언은 바뀌지 않았습니다.

빌드 산출물 구조 변경: `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 는 번들(공용 `chunk-*.mjs`) 대신 소스 파일 하나가 `dist` 파일 한 벌(`.mjs` · `.js` · `.d.ts` · `.d.mts`)이 되는 모듈 보존 빌드로 바꿨습니다. `dist` 안의 파일 경로를 exports 를 거치지 않고 직접 import 했다면 경로가 달라질 수 있습니다. `@axis-ds/theme` 는 단일 파일 그대로이고 `dist/index.mjs` · `index.js` 앞에 `"use client"` 가 붙습니다.

서버 컴포넌트에서 `onClick` 같은 함수 prop 을 넘길 수 없는 것은 React Server Components 규칙이라 그대로입니다. 핸들러가 필요하면 그 부분을 `"use client"` 파일로 만듭니다(각 패키지 README 「서버 컴포넌트」 절).

`@axis-ds/tokens` 는 코드 변경이 없고, linked 4패키지를 같은 버전으로 맞추려고 함께 올립니다(2026-10-20 결정).
