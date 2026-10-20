# WI-0050 릴리스 노트: 서버 컴포넌트(RSC) 호환 - "use client" 경계

> 릴리스일: 미배포(PR · Version PR 전) | 유형: fix · 빌드 산출물 구조 변경 | 영향: `@axis-ds/ui-react` · `@axis-ds/agentic-ui` · `@axis-ds/theme` 1.4.0 → 1.5.0 (minor, `changeset status` 기준. `@axis-ds/tokens` 는 변경이 없어 1.4.0 유지)
> changeset: `.changeset/wi-0050-use-client.md`

## 변경 사항

### fix: 서버 컴포넌트에서 빌드가 실패하던 컴포넌트에 클라이언트 경계
1.2.1 · 1.3.0 · 1.4.0 에서는 `"use client"` 를 쓰지 않은 서버 컴포넌트(create-next-app 기본 `page.tsx` · `layout.tsx`)에서 아래 컴포넌트를 쓰면 `next build` 가 실패했습니다. 이제 패키지 안에 `"use client"` 경계가 있어 쓰는 쪽에서 할 일 없이 렌더됩니다.

| 패키지 | 컴포넌트 | 종전 원인 |
|---|---|---|
| ui-react | `Avatar` | `useState` → `useState is not a function` |
| ui-react | `CommandInput` · `CommandList` · `CommandEmpty` · `CommandGroup` · `CommandItem` · `CommandSeparator` | cmdk(`"use client"` 모듈)의 `Command.Input` 같은 점 접근 → `Element type is invalid` |
| agentic-ui | `CodeBlock` · `ContextPanel` · `DiffViewer` · `FeedbackButtons` · `SourcePanel` · `StreamingText` · `ToolCallCard` | `useState`(StreamingText 는 `useEffect` · `useRef` 도) |
| theme | `ThemeProvider`(import 만 해도) | 모듈 최상위 `createContext` → `Collecting page data` 단계에서 빌드 전체 중단 |

- `@axis-ds/theme` 는 패키지 전체가 클라이언트 모듈입니다. 서버 `app/layout.tsx` 에서 `ThemeProvider` 를 바로 써도 됩니다. 기존 `'use client'` 래퍼(`providers.tsx`)는 그대로 둬도 동작합니다.
- Radix 기반 컴포넌트와 Button · Card 등 순수 컴포넌트, agentic-ui 나머지 11개는 종전처럼 동작합니다.

### 유지: 서버에서 호출하는 `cn` · `*Variants`
- `cn` 과 `*Variants` 7개(`alertVariants` · `avatarVariants` · `badgeVariants` · `buttonVariants` · `progressVariants` · `progressIndicatorVariants` · `toggleVariants`), 합 8개 함수는 지금처럼 서버 컴포넌트에서 호출할 수 있습니다. 루트 배럴과 이 함수들을 담은 파일에는 지시문을 두지 않습니다.
- `avatarVariants` 는 `Avatar` 컴포넌트(클라이언트)와 파일을 나눠 서버 호출을 유지했습니다. import 경로(`@axis-ds/ui-react` · `@axis-ds/ui-react/avatar`)와 이름은 그대로입니다.

### feat: agentic-ui 서브패스 6개
- `@axis-ds/agentic-ui/agent-avatar` · `/recovery-banner` · `/source-panel` · `/step-timeline` · `/surface-renderer` · `/thinking-indicator`. 종전에는 빌드 산출물은 있었지만 `exports` 에 없어 루트로만 import 할 수 있었습니다.

### 빌드 산출물 구조 변경 (ui-react · agentic-ui)
- 번들(공용 `chunk-*.mjs`) 대신 소스 파일 하나가 `dist` 파일 한 벌(`.mjs` · `.js` · `.d.ts` · `.d.mts`)이 되는 모듈 보존 빌드(tsup `bundle:false`)로 바꿨습니다. esbuild 번들은 `"use client"` 를 공용 chunk 로 옮기지 않아, 필요한 컴포넌트만 클라이언트로 표시하려면 모듈 단위 출력이 필요했습니다.
- 지시문을 붙이는 파일은 각 패키지 `scripts/client-modules.mjs` 한 곳에서 관리하고(ui-react 2개 · agentic-ui 7개, 항목마다 근거), 빌드 후처리(`scripts/postbuild.mjs`)가 ESM · CJS 맨 앞에 붙입니다.
- `@axis-ds/theme` 는 단일 파일 그대로이고 `dist/index.mjs` 1행 · `dist/index.js` 2행(`"use strict"` 다음)에 `"use client"` 가 붙습니다.

## 하위 호환
- 루트 `.` 와 기존 서브패스의 exports 경로 · 내보내기 이름 · 타입 선언은 바뀌지 않았습니다(ui-react exports 32항목 · 진입점 31개 · 루트 d.ts 심볼 132개, agentic-ui 기존 진입점 13개를 기준선과 대조).
- `dist` 안 파일 경로를 exports 를 거치지 않고 직접 import 했다면(`dist/chunk-*.mjs` 등) 경로가 달라질 수 있습니다.

## 회귀 게이트 (`pnpm pack-smoke`)
- G1(`scripts/use-client-gate.mjs`): tarball 의 목록 파일에 ESM · CJS 모두 지시문이 있는지, 루트 배럴 · `cn` · `*Variants` 파일에 없는지, 목록 밖 파일에 상태 훅 · createContext · useContext · 인라인 핸들러 · `"use client"` 의존 점 접근이 없는지 정적으로 봅니다. 인라인 핸들러는 props 에 화살표 · function 을 바로 쓴 경우만 보고, 컴포넌트 안 지역 함수를 DOM 에 넘기는 경우는 G2 렌더가 잡습니다(검증 변이 m9: G1 rc=0, G2 rc=1).
- G2(`scripts/pack-install-smoke.mjs` · `scripts/rsc-smoke/`): tokens · ui-react · agentic-ui · theme tarball 을 한 디렉터리에 설치해 `react-server` 조건으로 렌더하고 서버 `cn` · `*Variants` 호출을 확인합니다.
- 지시문 제거 · 루트 배럴 지시문 추가 · theme 지시문 제거 변이와 npm 1.4.0 tarball 에서 G1 · G2 모두 실패하는 것을 확인했습니다(testplan 5절).

## 알려진 한계
- 서버 page 에서 `avatarVariants` 만 서브패스(`@axis-ds/ui-react/avatar`)로 import 해도 First Load JS 가 103 kB 에서 111 kB 로 8 kB 늘어납니다. `avatar/index` 가 클라이언트 모듈인 `Avatar` 를 함께 내보내기 때문입니다. 호출 결과는 1.4.0 과 같습니다(2026-10-20 결정: 기록만).
- `@axis-ds/tokens` 는 코드 변경 없이 linked 버전 정렬로만 1.5.0 이 됩니다.
- 서버 컴포넌트에서 `onClick` · `onFeedback` 같은 함수 prop 은 넘길 수 없습니다. React Server Components 규칙이라 그대로이며, 핸들러가 필요하면 그 부분을 `"use client"` 파일로 만듭니다(각 패키지 README 「서버 컴포넌트」 절).
- 서버 컴포넌트에서 `useTheme()` 은 호출할 수 없습니다(훅).
- 서버 컴포넌트가 ui-react 루트 배럴을 import 하면 Radix 컴포넌트의 클라이언트 참조가 함께 실려 First Load JS 가 커질 수 있습니다. agentic-ui 는 ui-react 루트에서 `cn` 을 가져와 서브패스 하나만 import 해도 같은 현상이 있습니다(1.4.0 에도 있던 현상, 이번에 바꾸지 않음).
- 레지스트리(`apps/web/public/r`)로 복사해 쓰는 컴포넌트 소스에는 지시문을 넣지 않았습니다(WI-0045 와 함께 처리).
- 미측정(testplan 7절): ui-react · agentic-ui 의 Next 실빌드와 Playwright 상호작용, ui-react · agentic-ui CJS 산출물(`"use client"` 다음 `"use strict"`)의 Next require 경로 인식, Turbopack · `next dev` · Next 16, `dev` 스크립트(watch), CI 에서의 G2 실행.
